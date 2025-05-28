import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FlyControls } from 'three/examples/jsm/controls/FlyControls.js';
import { initializeData, fartcoinHolders, goatTokenHolders, sharedHolders } from './dataLoader.js';
import { sharedPoints, fartcoinPoints, goatTokenPoints, generateAllPoints } from './positionMapper.js';

// V22 - Implemented true 3D spherical wallet distribution
console.log("Starting 3D Blockchain Visualizer v22");

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
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 20000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

// CRITICAL: Set renderer size before anything else
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
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
versionDisplay.innerHTML = 'v22';
document.body.appendChild(versionDisplay);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);

// Debug helpers removed for production

// Define boxCenter at global scope with a default value
let boxCenter = new THREE.Vector3(0, 0, 0);

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

// Initial camera setup - safe starting position
camera.position.set(0, 0, 3000);
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
    controls.minDistance = 500;
    controls.maxDistance = 30000;
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

// Function to create a Level 2 cluster that orbits a Level 1 wallet
function createLevel2Cluster(parentPosition, parentScale, parentColor) {
  // Create a group to hold the mini-cluster
  const miniClusterGroup = new THREE.Group();
  
  // Create central mini-node (gray or faded color)
  const centralNodeMaterial = new THREE.SpriteMaterial({
    map: pointTexture,
    color: new THREE.Color(parentColor).lerp(new THREE.Color(0x333333), 0.7), // Fade to gray
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending
  });
  
  const centralNode = new THREE.Sprite(centralNodeMaterial);
  centralNode.scale.set(parentScale * 0.3, parentScale * 0.3, 1); // Scale down from parent
  centralNode.position.set(0, 0, 0); // Will be positioned relative to parent later
  miniClusterGroup.add(centralNode);
  
  // Create 10 smaller orbiting spheres for Level 2
  for (let i = 0; i < 10; i++) {
    // Calculate orbit position using spherical coordinates for full 3D sphere
    const radius = parentScale * 0.15; // Keep tight orbit
    
    // Use Fibonacci sphere distribution for even spacing across the entire sphere
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const theta = 2 * Math.PI * i / goldenRatio; // Azimuthal angle
    const phi = Math.acos(1 - 2 * (i + 0.5) / 10); // Polar angle (full range from 0 to π)
    
    // Convert to Cartesian coordinates
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    
    // Create mini-sphere material with reduced opacity
    const miniSphereMaterial = new THREE.SpriteMaterial({
      map: pointTexture,
      color: new THREE.Color(parentColor).lerp(new THREE.Color(0xffffff), 0.5), // Lighter version
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending
    });
    
    const miniSphere = new THREE.Sprite(miniSphereMaterial);
    const miniScale = parentScale * 0.12; // Much smaller than parent
    miniSphere.scale.set(miniScale, miniScale, 1);
    miniSphere.position.set(x, y, z);
    
    miniClusterGroup.add(miniSphere);
  }
  
  // Position the entire mini-cluster at parent position (will be offset in animation)
  miniClusterGroup.position.copy(parentPosition);
  
  return miniClusterGroup;
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
    const baseScale = point.amount ? (Math.log(point.amount) * 10) : 200;
    const scale = Math.max(200, baseScale * 3);
    sprite.scale.set(scale, scale, 1);
    sprite.userData = { isLevel1Wallet: true, parentIndex: index };
    
    // Add to group
    group.add(sprite);
    
    // Add Level 2 clusters for each Level 1 wallet
    // Cap Level 2 clusters to avoid performance issues (add for first 200 wallets)
    if (index < 200) {
      const level2Cluster = createLevel2Cluster(
        sprite.position.clone(),
        scale,
        point.color || color
      );
      
      // Store reference to parent for orbit animation
      level2Cluster.userData = { 
        parentIndex: index,
        orbitRadius: scale * 0.6, // Orbit radius based on parent scale
        orbitSpeed: 0.2 + Math.random() * 0.3, // Random speed for horizontal
        verticalSpeed: 0.15 + Math.random() * 0.2, // Independent speed for vertical
        horizontalAngle: Math.random() * Math.PI * 2, // Random starting horizontal angle
        verticalAngle: Math.random() * Math.PI, // Random starting vertical angle (0 to π)
        parentSprite: sprite
      };
      
      level2Group.add(level2Cluster);
    }
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
  
  // Calculate camera distance
  const cameraDistance = Math.max(3000, maxDim * 2.5);
  
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
              // Orbit angle updates are now handled separately for horizontal and vertical
              
              // Calculate new position in orbit
              const orbitRadius = cluster.userData.orbitRadius;
              
              // Calculate true 3D spherical orbit position with independent angles
              // Update both angles independently for true spherical movement
              let horizontalAngle = cluster.userData.horizontalAngle;
              let verticalAngle = cluster.userData.verticalAngle;
              
              // Update angles with different speeds for more natural movement
              horizontalAngle += delta * cluster.userData.orbitSpeed;
              verticalAngle += delta * cluster.userData.verticalSpeed;
              
              // Keep the vertical angle within the range [0, π]
              // This ensures we cover the whole sphere from pole to pole
              verticalAngle = verticalAngle % Math.PI;
              
              // Store updated angles
              cluster.userData.horizontalAngle = horizontalAngle;
              cluster.userData.verticalAngle = verticalAngle;
              
              // Standard spherical to Cartesian conversion for true 3D distribution
              const offsetX = Math.sin(verticalAngle) * Math.cos(horizontalAngle) * orbitRadius;
              const offsetY = Math.sin(verticalAngle) * Math.sin(horizontalAngle) * orbitRadius;
              const offsetZ = Math.cos(verticalAngle) * orbitRadius;
              
              // Set position relative to parent wallet
              cluster.position.set(
                parentSprite.position.x + offsetX,
                parentSprite.position.y + offsetY,
                parentSprite.position.z + offsetZ
              );
              
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
  
  // Render the scene
  renderer.render(scene, camera);
}

animate();