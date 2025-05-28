import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FlyControls } from 'three/examples/jsm/controls/FlyControls.js';
import { initializeData, fartcoinHolders, goatTokenHolders, sharedHolders } from './dataLoader.js';
import { sharedPoints, fartcoinPoints, goatTokenPoints, generateAllPoints } from './positionMapper.js';

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
    controls.movementSpeed = 200;  // Set movement speed for WASD keys
    controls.rollSpeed = Math.PI / 6;  // Set roll speed as specified
    controls.dragToLook = true;  // Mouse drag to look around
    controls.autoForward = false;  // Don't move forward automatically
    
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
    
    // Add to group
    group.add(sprite);
  });
  
  // Add the group to the scene
  scene.add(group);
  
  return group;
}

// Create all wallet point clouds
if (sharedPoints.length > 0 && fartcoinPoints.length > 0 && goatTokenPoints.length > 0) {
  // Create point clouds for each dataset
  const sharedGroup = createWalletPointCloud(sharedPoints, 'sharedWallets', 0xffffff);
  const fartcoinGroup = createWalletPointCloud(fartcoinPoints, 'fartcoinWallets', 0x00ff00);
  const goatTokenGroup = createWalletPointCloud(goatTokenPoints, 'goatTokenWallets', 0x0000ff);
  
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
  
  // Add all wallet groups to the bounding box
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
    controlsElement.innerHTML = '<p>WASD to move, drag mouse to look around</p>';
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
    // FlyControls requires delta time
    controls.update(delta);
  } else {
    // OrbitControls just needs regular update
    controls.update();
  }
  
  // Subtle starfield rotation
  if (starfield) {
    starfield.rotation.y += delta * 0.01;
    starfield.rotation.x += delta * 0.005;
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