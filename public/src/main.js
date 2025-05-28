import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FlyControls } from 'three/examples/jsm/controls/FlyControls.js';
import { initializeData, fartcoinHolders, goatTokenHolders, sharedHolders } from './dataLoader.js';
import { sharedPoints, fartcoinPoints, goatTokenPoints, generateAllPoints } from './positionMapper.js';
import tooltipFix from './tooltipFix.js';
import WalletTooltip from './walletTooltip.js';

// V27 - Fixed hover interactions, color coding, and wallet metadata display
console.log("Starting 3D Blockchain Visualizer v27");

// Create a point texture for better visibility
function createPointTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.9)');
  gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.7)');
  gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.3)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Create the point sprite texture
const pointTexture = createPointTexture();

// Initialize the scene, camera, and renderer
const scene = new THREE.Scene();
// Increase far clipping plane to accommodate the larger visualization
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 50000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

// CRITICAL: Set renderer size before anything else
renderer.setSize(window.innerWidth, window.innerHeight);
// Limit pixel ratio for better performance with 200 points per node
const limitedPixelRatio = Math.min(window.devicePixelRatio, 1.5);
renderer.setPixelRatio(limitedPixelRatio);
document.body.appendChild(renderer.domElement);

// Set background color to deep space blue
scene.background = new THREE.Color(0x000815);

// Add strong lighting for better visibility
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);

// Add version display in top-right corner
const versionDisplay = document.createElement('div');
versionDisplay.style.position = 'absolute';
versionDisplay.style.top = '10px';
versionDisplay.style.right = '10px';
versionDisplay.style.color = 'white';
versionDisplay.style.opacity = '0.3';
versionDisplay.style.fontSize = '16px';
versionDisplay.style.fontFamily = 'Arial, sans-serif';
versionDisplay.innerHTML = 'v27';
document.body.appendChild(versionDisplay);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);

// Debug helpers removed for production

// Define boxCenter at global scope with a default value
let boxCenter = new THREE.Vector3(0, 0, 0);

// Setup raycaster for hover interactions with adjusted parameters for better detection
const raycaster = new THREE.Raycaster();
// Dramatically increase the precision for sprites to ensure we can hit them
raycaster.params.Sprite = { threshold: 50 }; // Increase from 15 to 50 for much easier hover detection
console.log('Raycaster initialized with very high sprite threshold:', raycaster.params.Sprite.threshold);
const mouse = new THREE.Vector2();
let hoveredObject = null;
let hoveredOriginalScale = null;
let hoveredOriginalColor = null;
const hoverScaleFactor = 1.5; // How much to scale up on hover
const hoverBrightnessFactor = 1.3; // How much to brighten on hover

// We'll get the tooltip element with a delay to ensure DOM is ready
let tooltip = null;

// Function to get tooltip element
function getTooltipElement() {
  tooltip = document.getElementById('wallet-tooltip');
  console.log('Tooltip element found:', tooltip !== null);
  
  if (!tooltip) {
    console.error('CRITICAL: wallet-tooltip element not found in the DOM!');
    console.log('Creating tooltip element dynamically');
    
    // Create tooltip element if not found
    tooltip = document.createElement('div');
    tooltip.id = 'wallet-tooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.display = 'none';
    tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '10px';
    tooltip.style.borderRadius = '5px';
    tooltip.style.fontSize = '12px';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '1000';
    tooltip.style.maxWidth = '250px';
    tooltip.style.transition = 'opacity 0.3s';
    tooltip.style.border = '1px solid rgba(255, 255, 255, 0.3)';
    tooltip.style.boxShadow = '0 0 10px rgba(0, 100, 255, 0.5)';
    
    // Create tooltip content
    tooltip.innerHTML = `
      <div class="tooltip-title" style="font-weight: bold; margin-bottom: 5px; font-size: 14px; color: #88ccff;">Wallet Details</div>
      <div class="tooltip-address" style="font-family: monospace; font-size: 12px; margin-bottom: 8px; color: #aaccff; word-break: break-all;">0x0000...0000</div>
      <div class="tooltip-holdings" style="margin-bottom: 5px;">
        <div class="tooltip-fartcoin" style="color: #88ff88;">Fartcoin: 0</div>
        <div class="tooltip-goat" style="color: #8888ff;">Goat: 0</div>
      </div>
      <div class="tooltip-total" style="margin-top: 8px; font-weight: bold; color: #ffffff;">Total Value: 0</div>
    `;
    
    // Add to document
    document.body.appendChild(tooltip);
    console.log('Created and added tooltip element to body');
  }
  
  // Make sure tooltip is invisible initially
  if (tooltip) {
    tooltip.style.display = 'none';
    console.log('Set tooltip to hidden initially');
  }
}

// Get tooltip with a slight delay to ensure DOM is ready
setTimeout(getTooltipElement, 500);

// Track mouse position for raycasting
function onMouseMove(event) {
  // Calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  // Debug: Log mouse coordinates occasionally
  if (Math.random() < 0.01) { // Only log 1% of events to avoid flooding
    console.log(`Mouse position: (${mouse.x.toFixed(2)}, ${mouse.y.toFixed(2)})`);
  }
  
  // Update tooltip position to follow mouse
  if (tooltip) {
    // Position tooltip with offset from cursor
    tooltip.style.left = (event.clientX + 15) + 'px';
    tooltip.style.top = (event.clientY + 15) + 'px';
  } else {
    // Try to get tooltip again if not found
    if (Math.random() < 0.01) { // Limit retries to avoid excessive DOM queries
      console.warn('Tooltip element not found in the DOM during mouse move, trying to get it again');
      getTooltipElement();
    }
  }
}

// Add mouse move listener
window.addEventListener('mousemove', onMouseMove, false);

// Create starfield background
function createStarfield() {
  const geometry = new THREE.BufferGeometry();
  const starCount = 2000;
  const positions = new Float32Array(starCount * 3);
  const sizes = new Float32Array(starCount);
  
  // Create stars at random positions with random sizes
  for (let i = 0; i < starCount; i++) {
    const i3 = i * 3;
    // Random position in a large sphere around the scene
    const radius = 5000 + Math.random() * 10000;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    
    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);
    
    // Random sizes between 1 and 5
    sizes[i] = 1 + Math.random() * 4;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  
  // Star material with soft glow
  const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 2,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending
  });
  
  // Create stars and add to scene
  const stars = new THREE.Points(geometry, starMaterial);
  stars.name = 'starfield';
  scene.add(stars);
  
  return stars;
}

// Add starfield to the scene
const starfield = createStarfield();

// Create 3D tooltip for wallet data
const walletTooltip = new WalletTooltip(scene, camera);
console.log('3D wallet tooltip initialized');

// Initial camera setup - increased distance for better view of larger visualization
camera.position.set(0, 0, 5000); // Increased from 3000 to 5000 to fit the larger visualization
camera.lookAt(0, 0, 0);

// Detect if device is touch-based (mobile/tablet)
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

// Console element not needed in production
const consoleElement = document.getElementById('console');
if (consoleElement) {
  consoleElement.style.display = 'none';
}

// Initialize appropriate controls based on device type
let controls;
let controlType;
// Track shift key state for jetpack
let shiftKeyPressed = false;

// Add event listeners for shift key (for jetpack control)
window.addEventListener('keydown', function(event) {
  if (event.code === 'ShiftLeft') {
    shiftKeyPressed = true;
  }
});

window.addEventListener('keyup', function(event) {
  if (event.code === 'ShiftLeft') {
    shiftKeyPressed = false;
  }
});

try {
  if (isTouchDevice) {
    // Use OrbitControls for touch devices
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 0.5;
    controls.screenSpacePanning = false;
    controls.minDistance = 1000; // Increased from 500 to 1000 for better viewing with more points
    controls.maxDistance = 50000; // Increased from 30000 to 50000 to match camera far clip plane
    controlType = 'Orbit';
    
    if (consoleElement) {
      consoleElement.innerHTML += '<p>Created OrbitControls for touch device</p>';
    }
  } else {
    // Use FlyControls for desktop
    controls = new FlyControls(camera, renderer.domElement);
    controls.movementSpeed = 400;  // Increased movement speed from 200 to 400
    controls.rollSpeed = Math.PI / 6;  // Set roll speed as specified
    controls.dragToLook = true;  // Mouse drag to look around
    controls.autoForward = false;  // Don't move forward automatically
    
    // Additional physics properties for desktop
    controls.velocity = new THREE.Vector3(0, 0, 0); // Current velocity vector
    controls.damping = 0.2; // Reduced damping for smoother inertia (was 0.5)
    controls.gravity = 0.5; // Half gravity for floating effect
    
    // Jetpack fuel system
    controls.jetpackFuel = 250; // Full tank = 250 units (2.5x the original 100)
    controls.jetpackMaxFuel = 250; // 2.5x the original maximum
    controls.jetpackActive = false;
    controls.jetpackEnabled = true; // Enabled when fuel > 0
    controls.jetpackRefillRate = 0.8; // Refill rate when not using jetpack
    controls.jetpackDrainRate = 1.2; // Drain rate when using jetpack
    controls.jetpackMinFuelToReactivate = 25; // Minimum fuel needed to reactivate (scaled up from 10)
    controls.jetpackBoostFactor = 2.5; // How much faster than normal speed
    
    // Show the fuel meter UI for desktop
    const fuelMeterContainer = document.getElementById('fuel-meter-container');
    if (fuelMeterContainer) {
      fuelMeterContainer.style.display = 'block';
      console.log('Fuel meter UI initialized for desktop controls');
    } else {
      console.error('Fuel meter container not found in the DOM');
    }
    
    controlType = 'Fly';
    
    if (consoleElement) {
      consoleElement.innerHTML += '<p>Created FlyControls for desktop</p>';
    }
  }
} catch (error) {
  console.error('Error creating controls:', error);
  if (consoleElement) {
    consoleElement.innerHTML += `<p style="color:red">Error creating controls: ${error.message}</p>`;
  }
}

// Set the target/lookAt point for OrbitControls
if (controlType === 'Orbit') {
  controls.target.set(0, 0, 0);
}

// Initial update
if (controlType === 'Fly') {
  const delta = 0.01; // Small initial delta for first update
  controls.update(delta);
} else {
  controls.update();
}

// Initialize and prepare visualization data
initializeData();
generateAllPoints();

// Data verification - check that wallet data was loaded successfully
if (sharedPoints.length === 0 || fartcoinPoints.length === 0 || goatTokenPoints.length === 0) {
  console.error('ERROR: Missing wallet data for visualization!');
}

// Function to create a Level 2 cluster forming a hollow sphere around a Level 1 wallet
function createLevel2Cluster(parentPosition, parentScale, parentColor) {
  // Create a group to hold the hollow spherical shell
  const sphericalShellGroup = new THREE.Group();
  
  // Create central parent node that will sit at the center of the sphere
  const centralNodeMaterial = new THREE.SpriteMaterial({
    map: pointTexture,
    color: parentColor, // Use parent color for visibility
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending
  });
  
  const centralNode = new THREE.Sprite(centralNodeMaterial);
  centralNode.scale.set(parentScale * 0.5, parentScale * 0.5, 1); // Make center node visible
  centralNode.position.set(0, 0, 0); // Center point of the sphere
  sphericalShellGroup.add(centralNode);
  
  // Define the number of wallet points to distribute on the sphere - increased to 200 per spec
  const numPoints = 200; // Increased from ~10-12 to 200 for full dataset visualization
  
  // Optimize hollow sphere size to prevent overlap between adjacent spheres
  const shellRadius = parentScale * 2.8; // Reduced from 3.0 to 2.8 to prevent sphere overlap
  // We're reducing the shell radius slightly while increasing parent node spacing,
  // which will result in distinct separation between the hollow spheres
  
  // Create evenly distributed points on the sphere surface using Fibonacci sphere distribution
  // This algorithm produces a more uniform distribution for larger point counts
  for (let i = 0; i < numPoints; i++) {
    // Use Fibonacci sphere distribution for perfectly even spacing across the sphere surface
    // This works better than previous approach for 200 points
    const phi = Math.acos(1 - 2 * (i + 0.5) / numPoints);
    const theta = Math.PI * 2 * i * (1 + Math.sqrt(5)); // Golden ratio-based angle
    
    // Convert spherical coordinates to Cartesian coordinates
    const x = shellRadius * Math.sin(phi) * Math.cos(theta);
    const z = shellRadius * Math.sin(phi) * Math.sin(theta);
    const yPos = shellRadius * Math.cos(phi);
    
    // Create wallet node material with adjusted opacity for larger point count
    const walletNodeMaterial = new THREE.SpriteMaterial({
      map: pointTexture,
      color: new THREE.Color(parentColor).lerp(new THREE.Color(0xffffff), 0.3), // Slightly lighter version
      transparent: true,
      opacity: 0.7, // Reduced from 0.8 to prevent visual crowding with 200 points
      blending: THREE.AdditiveBlending
    });
    
    // Create the wallet sprite
    const walletNode = new THREE.Sprite(walletNodeMaterial);
    const walletScale = parentScale * 0.18; // Further reduced from 0.2 to 0.18 for better differentiation between spheres
    walletNode.scale.set(walletScale, walletScale, 1);
    walletNode.position.set(x, yPos, z);
    
    // Add to shell group
    sphericalShellGroup.add(walletNode);
    
    // Store original position and parent's wallet data
    walletNode.userData = {
      originalPosition: new THREE.Vector3(x, yPos, z),
      shellRadius: shellRadius,
      originalScale: walletScale,
      originalColor: walletNodeMaterial.color.getStyle()
    };
  }
  
  // Position the entire shell group at parent position
  sphericalShellGroup.position.copy(parentPosition);
  
  return sphericalShellGroup;
}

// Function to create a wallet point cloud with sprites
function createWalletPointCloud(pointsArray, groupName, color = 0xffffff) {
  // Create a group to hold all sprites
  const group = new THREE.Group();
  group.name = groupName;
  
  // Check if we have valid points
  if (!pointsArray || pointsArray.length === 0) {
    console.error(`No points available for ${groupName}`);
    return group;
  }
  
  // Level 2 clusters container (for performance management)
  const level2Group = new THREE.Group();
  level2Group.name = `${groupName}_level2`;
  
  // Create a sprite for each point
  pointsArray.forEach((point, index) => {
    if (isNaN(point.x) || isNaN(point.y) || isNaN(point.z)) {
      console.warn(`Skipping invalid point at index ${index}`);
      return; // Skip invalid points
    }
    
    // Enhanced material with glow effect
    const material = new THREE.SpriteMaterial({
      map: pointTexture,
      color: point.color || color,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    
    const sprite = new THREE.Sprite(material);
    
    // Position the sprite
    sprite.position.set(point.x, point.y, point.z);
    
    // Calculate scale based on amount, with minimum scale to ensure visibility
    const baseScale = point.totalHolding ? (Math.log(point.totalHolding) * 10) : 200;
    const scale = Math.max(200, baseScale * 3);
    sprite.scale.set(scale, scale, 1);
    
    // Store wallet data in userData for raycasting and hover effects
    sprite.userData = { 
      isLevel1Wallet: true, 
      parentIndex: index,
      walletData: {
        address: point.address,
        fartAmount: point.fartAmount || 0,
        goatAmount: point.goatAmount || 0,
        totalHolding: point.totalHolding || 0,
        walletType: point.walletType || 'unknown'
      },
      originalScale: scale,
      originalColor: point.color
    };
    
    // Add to group
    group.add(sprite);
    
    // Add Level 2 clusters for each Level 1 wallet
    // Now supporting all parent nodes to handle the full dataset
    // For Fartcoin and Goat, we need to handle 1000+ points each, plus 76 shared
    const level2Cluster = createLevel2Cluster(
      sprite.position.clone(),
      scale,
      point.color || color
    );
      
      // Store reference to parent for orbit animation
      level2Cluster.userData = { 
        parentIndex: index,
        shellRadius: scale * 2.8, // Adjusted from 3.0 to 2.8 to prevent hollow sphere overlap
        rotationSpeed: 0.05 + Math.random() * 0.10, // Reduced from 0.1-0.25 to 0.05-0.15 for smoother animation with 200 points
        parentSprite: sprite,
        rotationAxis: new THREE.Vector3(
          Math.random() - 0.5, 
          Math.random() - 0.5, 
          Math.random() - 0.5
        ).normalize(), // Random rotation axis for more interesting movement
        walletData: sprite.userData.walletData // Copy wallet data from parent
      };
      
      level2Group.add(level2Cluster);
  });
  
  // Add the main group to the scene
  scene.add(group);
  
  // Add the Level 2 clusters group to the scene
  scene.add(level2Group);
  
  return { mainGroup: group, level2Group: level2Group };
}

// Create all wallet point clouds
if (sharedPoints.length > 0 && fartcoinPoints.length > 0 && goatTokenPoints.length > 0) {
  // Create point clouds for each dataset with Level 2 recursion
  const sharedGroups = createWalletPointCloud(sharedPoints, 'sharedWallets', 0xffffff);
  const fartcoinGroups = createWalletPointCloud(fartcoinPoints, 'fartcoinWallets', 0x00ff00);
  const goatTokenGroups = createWalletPointCloud(goatTokenPoints, 'goatTokenWallets', 0x0000ff);
  
  // Extract main groups for bounding box calculation
  const sharedGroup = sharedGroups.mainGroup;
  const fartcoinGroup = fartcoinGroups.mainGroup;
  const goatTokenGroup = goatTokenGroups.mainGroup;
  
  // Store Level 2 groups for animation updates
  const level2Groups = [
    sharedGroups.level2Group,
    fartcoinGroups.level2Group,
    goatTokenGroups.level2Group
  ];
  
  // Calculate bounding box for camera positioning
  const boundingBox = new THREE.Box3();
  
  // Initialize with empty but valid volume
  boundingBox.set(
    new THREE.Vector3(-1, -1, -1),
    new THREE.Vector3(1, 1, 1)
  );
  
  // Function to safely add sprites to bounding box
  const addGroupToBoundingBox = (group) => {
    if (group && group.children && group.children.length > 0) {
      group.children.forEach(sprite => {
        if (sprite && sprite.position) {
          boundingBox.expandByPoint(sprite.position);
        }
      });
    }
  };
  
  // Add all wallet groups to the bounding box (only main Level 1 groups)
  addGroupToBoundingBox(sharedGroup);
  addGroupToBoundingBox(fartcoinGroup);
  addGroupToBoundingBox(goatTokenGroup);
  
  // Get bounding box center and size
  boxCenter = boundingBox.getCenter(new THREE.Vector3());
  const boxSize = boundingBox.getSize(new THREE.Vector3());
  
  // Ensure minimum dimensions
  const maxDim = Math.max(
    Math.max(1, boxSize.x),
    Math.max(1, boxSize.y),
    Math.max(1, boxSize.z)
  );
  
  // Calculate camera distance - increased to accommodate 200 points per node
  const cameraDistance = Math.max(5000, maxDim * 3.0);
  
  // Position the camera to fit the bounding box
  camera.position.set(
    boxCenter.x, 
    boxCenter.y + maxDim * 0.5,
    boxCenter.z + cameraDistance
  );
  
  // Look at the center of the wallet cloud
  camera.lookAt(boxCenter);
  
  // Update controls target for OrbitControls
  if (controlType === 'Orbit') {
    controls.target.copy(boxCenter);
    controls.update();
  } else if (controlType === 'Fly') {
    // For FlyControls, just make sure camera is looking at the target
    camera.lookAt(boxCenter);
    controls.update(0.01);
  }
  
  // Debug test spheres removed for production
  
} else {
  console.error('Error: Missing wallet data for visualization.');
}

// Update controls instructions based on detected control type
const controlsElement = document.getElementById('controls');
if (controlsElement) {
  if (controlType === 'Fly') {
    controlsElement.innerHTML = '<p>WASD to move, drag mouse to look around<br>HOLD LEFT SHIFT to activate jetpack boost</p>';
  } else {
    controlsElement.innerHTML = '<p>Drag to rotate, pinch to zoom</p>';
  }
}

// Handle window resize
window.addEventListener('resize', () => {
  // Update camera aspect
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  
  // Reset any active hover state on resize
  if (hoveredObject) {
    // Restore original scale
    hoveredObject.scale.set(
      hoveredObject.userData.originalScale, 
      hoveredObject.userData.originalScale, 
      1
    );
    
    // Restore original color
    if (hoveredObject.material) {
      hoveredObject.material.color.set(hoveredObject.userData.originalColor);
    }
    
    hoveredObject = null;
    
    // Hide tooltip
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  }
  
  // Check if device type changed (e.g., orientation change might affect detection)
  const currentIsTouchDevice = window.matchMedia('(pointer: coarse)').matches;
  const expectedControlType = currentIsTouchDevice ? 'Orbit' : 'Fly';
  
  // If control type doesn't match the current device type, reload to reinitialize
  if (controlType !== expectedControlType) {
    location.reload();
  }
});

// Render loop
const clock = new THREE.Clock();
clock.start(); // Explicitly start the clock
let frameCounter = 0;
const logInterval = 60;

// Store initial camera position and target for recovery
const initialCameraPosition = camera.position.clone();
const initialCameraTarget = boxCenter.clone();

function animate() {
  requestAnimationFrame(animate);
  
  const delta = clock.getDelta();
  
  // Update 3D tooltip position
  walletTooltip.update();
  
  // Handle hover animation for better visibility
  if (hoveredObject && hoveredObject.userData.pulseAnimation) {
    hoveredObject.userData.pulseTime += delta;
    // More extreme pulsing - 5x to 8x original size
    const pulseScale = hoveredObject.userData.originalScale * (5 + Math.sin(hoveredObject.userData.pulseTime * 8) * 3);
    hoveredObject.scale.set(pulseScale, pulseScale, 1);
    
    // Also pulse the brightness with more extreme values and different color
    if (hoveredObject.material) {
      // Use bright yellow/white for maximum visibility
      const pulseIntensity = 1.5 + Math.sin(hoveredObject.userData.pulseTime * 8) * 0.5;
      hoveredObject.material.color.setRGB(
        1.0, // Always full red
        1.0, // Always full green
        Math.min(1, 0.7 + Math.sin(hoveredObject.userData.pulseTime * 16) * 0.3) // Pulsing blue
      );
    }
  }
  
  // Update controls based on control type
  if (controlType === 'Fly') {
    // Custom physics for FlyControls on desktop
    
    // Get keyboard state
    const moveForward = controls.moveState.forward > 0;
    // Use ShiftLeft instead of spacebar (which was mapped to moveState.up)
    const jetpackKeyPressed = shiftKeyPressed;
    
    // Update jetpack fuel
    const fuelLevelElement = document.getElementById('fuel-level');
    
    // Handle jetpack fuel logic
    if (jetpackKeyPressed && controls.jetpackEnabled && controls.jetpackFuel > 0) {
      // Only activate jetpack when Left Shift is held AND we have fuel
      controls.jetpackActive = true;
      
      // Drain fuel
      controls.jetpackFuel = Math.max(0, controls.jetpackFuel - controls.jetpackDrainRate * delta * 60);
      
      // Log jetpack activation
      if (frameCounter % logInterval === 0) {
        console.log(`Jetpack active: ${controls.jetpackActive}, Fuel: ${controls.jetpackFuel.toFixed(1)}/${controls.jetpackMaxFuel}`);
      }
      
      // Disable jetpack if fuel depleted
      if (controls.jetpackFuel <= 0) {
        controls.jetpackEnabled = false;
        controls.jetpackActive = false;
        console.log('Jetpack disabled: Out of fuel');
      }
    } else {
      // Deactivate jetpack when Left Shift is released
      if (controls.jetpackActive) {
        console.log('Jetpack deactivated');
      }
      controls.jetpackActive = false;
      
      // Recharge fuel when not using jetpack
      if (controls.jetpackFuel < controls.jetpackMaxFuel) {
        controls.jetpackFuel = Math.min(
          controls.jetpackMaxFuel, 
          controls.jetpackFuel + controls.jetpackRefillRate * delta * 60
        );
        
        // Log fuel recharge
        if (frameCounter % logInterval === 0) {
          console.log(`Recharging fuel: ${controls.jetpackFuel.toFixed(1)}/${controls.jetpackMaxFuel}`);
        }
        
        // Re-enable jetpack if fuel reaches minimum threshold
        if (!controls.jetpackEnabled && controls.jetpackFuel >= controls.jetpackMinFuelToReactivate) {
          controls.jetpackEnabled = true;
          console.log('Jetpack re-enabled: Sufficient fuel');
        }
      }
    }
    
    // Update fuel meter UI
    if (fuelLevelElement) {
      const fuelPercentage = (controls.jetpackFuel / controls.jetpackMaxFuel) * 100;
      fuelLevelElement.style.width = `${fuelPercentage}%`;
      
      // Change color based on fuel level
      if (fuelPercentage < 20) {
        fuelLevelElement.style.backgroundColor = '#cc2222'; // Red when low
      } else if (fuelPercentage < 50) {
        fuelLevelElement.style.backgroundColor = '#cccc22'; // Yellow when medium
      } else {
        fuelLevelElement.style.backgroundColor = '#22cc22'; // Green when high
      }
    }
    
    // Get the camera's forward direction
    const forwardVector = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    
    // Calculate movement from FlyControls' internal state
    let movement = new THREE.Vector3();
    
    // Apply standard FlyControls update for basic movement
    controls.update(delta);
    
    // Handle jetpack mechanics with spacebar
    if (controls.jetpackActive && controls.jetpackEnabled) {
      // Get the camera's forward direction for jetpack thrust
      const jetpackThrustVector = forwardVector.clone();
      
      // Apply strong forward thrust in the camera's direction when jetpack is active
      // Multiply by the boost factor to make it significantly faster
      const jetpackSpeed = controls.movementSpeed * controls.jetpackBoostFactor;
      movement.add(
        jetpackThrustVector.multiplyScalar(jetpackSpeed * delta)
      );
      
      // Debug logging for jetpack thrust
      if (frameCounter % logInterval === 0) {
        console.log(`Applying jetpack thrust: speed=${jetpackSpeed}, direction=(${jetpackThrustVector.x.toFixed(2)}, ${jetpackThrustVector.y.toFixed(2)}, ${jetpackThrustVector.z.toFixed(2)})`);
      }
    }
    
    // Apply momentum and damping for zero-gravity drift
    // Only apply normal WASD movement if jetpack is not active
    if (!controls.jetpackActive && (
        controls.moveState.forward || controls.moveState.back || 
        controls.moveState.left || controls.moveState.right ||
        controls.moveState.up || controls.moveState.down)) {
      
      // If keys are pressed and jetpack is not active, add their effect to velocity
      if (controls.moveState.forward) 
        movement.add(forwardVector.clone().multiplyScalar(controls.movementSpeed * delta));
      if (controls.moveState.back) 
        movement.add(forwardVector.clone().multiplyScalar(-controls.movementSpeed * delta));
        
      // Right vector
      const rightVector = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
      if (controls.moveState.right) 
        movement.add(rightVector.clone().multiplyScalar(controls.movementSpeed * delta));
      if (controls.moveState.left) 
        movement.add(rightVector.clone().multiplyScalar(-controls.movementSpeed * delta));
      
      // Up/down movement (using R/F keys)
      const upVector = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
      // Process normal up/down movement (R/F keys)
      if (controls.moveState.up) 
        movement.add(upVector.clone().multiplyScalar(controls.movementSpeed * delta));
      if (controls.moveState.down) 
        movement.add(upVector.clone().multiplyScalar(-controls.movementSpeed * delta));
    }
    
    // Always add the current movement to velocity, whether from jetpack or WASD
    controls.velocity.add(movement);
    
    // Apply light inertia - gradual slowdown when jetpack turns off
    // Lower damping means more inertia (slower slowdown)
    controls.velocity.multiplyScalar(1 - (controls.damping * delta));
    
    // Apply half-gravity pullback - slowly pull down in world-space Y axis
    // This simulates a floating feel in low-gravity
    if (!controls.moveState.up && !controls.moveState.down) {
      // Only apply gravity when not explicitly moving up/down
      controls.velocity.y -= controls.gravity * delta;
    }
    
    // Apply velocity to camera position for actual movement
    camera.position.add(controls.velocity.clone().multiplyScalar(delta));
    
    // Log physics state for debugging
    if (frameCounter % logInterval === 0) {
      console.log(`Physics: velocity=(${controls.velocity.x.toFixed(2)}, ${controls.velocity.y.toFixed(2)}, ${controls.velocity.z.toFixed(2)}), damping=${controls.damping}, gravity=${controls.gravity}`);
    }
    
  } else {
    // OrbitControls just needs regular update
    controls.update();
  }
  
  // Subtle starfield rotation
  if (starfield) {
    starfield.rotation.y += delta * 0.01;
    starfield.rotation.x += delta * 0.005;
  }
  
  // Update Level 2 cluster orbits
  if (typeof level2Groups !== 'undefined') {
    level2Groups.forEach(group => {
      if (group && group.children) {
        group.children.forEach(cluster => {
          if (cluster && cluster.userData) {
            // Get parent reference and orbit data
            const parentSprite = cluster.userData.parentSprite;
            
            if (parentSprite) {
              // For hollow spherical shells, we maintain the sphere structure
              // and rotate the entire sphere around its center (the parent node)
              
              // Get parent position and rotation data
              const parentPos = parentSprite.position;
              
              // Apply rotation to the entire spherical shell group
              // This maintains the hollow sphere structure while animating
              
              // Create rotation quaternion based on time and random axis
              const rotationSpeed = cluster.userData.rotationSpeed;
              const rotationAxis = cluster.userData.rotationAxis;
              
              // Apply incremental rotation to the entire group
              cluster.rotateOnAxis(rotationAxis, delta * rotationSpeed);
              
              // Update the center position to follow the parent node
              cluster.position.set(
                parentPos.x,
                parentPos.y,
                parentPos.z
              );
              
              // No need to update individual wallet positions as they are fixed
              // relative to the sphere center and rotate with the whole group
              
              // Add slight rotation to the entire cluster
              cluster.rotation.z += delta * 0.1;
            }
          }
        });
      }
    });
  }
  
  // Check for invalid camera position (but without excessive logging)
  frameCounter++;
  if (frameCounter % logInterval === 0) {
    // Check for invalid camera position
    if (isNaN(camera.position.x) || isNaN(camera.position.y) || isNaN(camera.position.z)) {
      camera.position.copy(initialCameraPosition);
      
      if (controlType === 'Orbit') {
        controls.target.copy(initialCameraTarget);
      } else {
        camera.lookAt(initialCameraTarget);
      }
      
      if (controlType === 'Fly') {
        controls.update(delta);
      } else {
        controls.update();
      }
    }
    
    if (frameCounter > 1000) frameCounter = 0;
  }
  
  // Perform raycasting for hover detection
  raycaster.setFromCamera(mouse, camera);
  
  // Debug: Log raycaster status every few frames
  if (frameCounter % 120 === 0) {
    console.log(`Raycaster origin: (${raycaster.ray.origin.x.toFixed(2)}, ${raycaster.ray.origin.y.toFixed(2)}, ${raycaster.ray.origin.z.toFixed(2)})`);
    console.log(`Raycaster direction: (${raycaster.ray.direction.x.toFixed(2)}, ${raycaster.ray.direction.y.toFixed(2)}, ${raycaster.ray.direction.z.toFixed(2)})`);
  }
  
  // Create array of all point clouds to raycast against
  const pointGroups = [];
  
  // Add all wallet groups to raycasting targets
  const sharedGroup = scene.getObjectByName('sharedWallets');
  const fartcoinGroup = scene.getObjectByName('fartcoinWallets');
  const goatTokenGroup = scene.getObjectByName('goatTokenWallets');
  
  // Debug: Log group existence
  if (frameCounter % 120 === 0) {
    console.log(`Wallet groups found: shared=${!!sharedGroup}, fartcoin=${!!fartcoinGroup}, goat=${!!goatTokenGroup}`);
  }
  
  if (sharedGroup) pointGroups.push(sharedGroup);
  if (fartcoinGroup) pointGroups.push(fartcoinGroup);
  if (goatTokenGroup) pointGroups.push(goatTokenGroup);
  
  // Get wallet points to test against
  let walletPoints = [];
  pointGroups.forEach(group => {
    if (group && group.children) {
      walletPoints = walletPoints.concat(group.children);
    }
  });
  
  // Debug: Log wallet points count
  if (frameCounter % 120 === 0) {
    console.log(`Raycast targets: ${walletPoints.length} wallet points`);
  }
  
  // Perform raycast
  const intersects = raycaster.intersectObjects(walletPoints, false);
  
  // Debug: Log intersections
  if (intersects.length > 0 && frameCounter % 10 === 0) {
    console.log(`Found ${intersects.length} intersections with wallet points`);
    console.log(`First intersection: distance=${intersects[0].distance.toFixed(2)}, object=${intersects[0].object.userData?.isLevel1Wallet ? 'Level 1 Wallet' : 'Other'}`);
  }
  
  // Handle tooltip and hover effects
  if (intersects.length > 0) {
    const object = intersects[0].object;
    
    // Only process if the object has wallet data
    if (object.userData && object.userData.walletData) {
      // Debug: Log wallet data found
      if (frameCounter % 30 === 0) {
        console.log('Found wallet data in intersection:', object.userData.walletData);
      }
      
      // If hovering over a new object
      if (hoveredObject !== object) {
        console.log('Hovering over new wallet:', object.userData.walletData.address);
        
        // Reset previous hover state
        if (hoveredObject) {
          console.log('Resetting previous hover state');
          
          // Restore original scale and color
          hoveredObject.scale.set(
            hoveredObject.userData.originalScale, 
            hoveredObject.userData.originalScale, 
            1
          );
          
          // Restore original color
          if (hoveredObject.material) {
            console.log(`Restoring original color: ${hoveredObject.userData.originalColor}`);
            hoveredObject.material.color.set(hoveredObject.userData.originalColor);
          } else {
            console.warn('Previous hovered object has no material');
          }
        }
        
        // Set new hovered object
        hoveredObject = object;
        console.log('Set new hovered object');
        
        // Scale up and brighten the hovered object - make it MUCH larger for visibility
        const newScale = object.userData.originalScale * 3; // Increased from 1.5 to 3 for better visibility
        console.log(`Scaling up to: ${newScale} (original: ${object.userData.originalScale})`);
        object.scale.set(newScale, newScale, 1);
        
        // Add pulsing animation for extra visibility
        object.userData.pulseAnimation = true;
        object.userData.pulseTime = 0;
        
        // Brighten the color
        if (object.material) {
          console.log('Brightening the color of hovered object');
          
          // Store original color if not already stored
          if (!object.userData.storedOriginalColor) {
            object.userData.storedOriginalColor = object.material.color.clone();
            console.log('Stored original color');
          }
          
          // Create brighter version of the original color
          const origColor = new THREE.Color(object.userData.originalColor);
          console.log(`Original color: r=${origColor.r.toFixed(2)}, g=${origColor.g.toFixed(2)}, b=${origColor.b.toFixed(2)}`);
          
          const brighterColor = new THREE.Color(
            Math.min(1, origColor.r * hoverBrightnessFactor),
            Math.min(1, origColor.g * hoverBrightnessFactor),
            Math.min(1, origColor.b * hoverBrightnessFactor)
          );
          console.log(`Brighter color: r=${brighterColor.r.toFixed(2)}, g=${brighterColor.g.toFixed(2)}, b=${brighterColor.b.toFixed(2)}`);
          
          // Apply brighter color
          object.material.color.copy(brighterColor);
          console.log('Applied brighter color');
        } else {
          console.warn('Hovered object has no material');
        }
        
        // Show the 3D tooltip instead of HTML tooltip
        console.log('Showing 3D wallet tooltip');
        const walletData = object.userData.walletData;
        
        // Log the data for debugging
        console.log(`Wallet Data: Address=${walletData.address}, Fart=${walletData.fartAmount}, Goat=${walletData.goatAmount}`);
        
        // Show 3D tooltip with wallet data
        walletTooltip.show(walletData, object.position.clone());
      }
    }
  } else if (hoveredObject) {
    // No longer hovering over anything, reset state
    console.log('No longer hovering over anything, resetting state');
    
    // Restore original scale
    hoveredObject.scale.set(
      hoveredObject.userData.originalScale, 
      hoveredObject.userData.originalScale, 
      1
    );
    
    // Restore original color
    if (hoveredObject.material) {
      console.log(`Restoring original color on hover end: ${hoveredObject.userData.originalColor}`);
      hoveredObject.material.color.set(hoveredObject.userData.originalColor);
    } else {
      console.warn('Hovered object has no material when trying to restore color');
    }
    
    // Clear hovered object
    hoveredObject = null;
    console.log('Cleared hovered object reference');
    
    // Hide 3D tooltip
    console.log('Hiding 3D tooltip');
    walletTooltip.hide();
  }
  
  // Render the scene
  renderer.render(scene, camera);
}

animate();