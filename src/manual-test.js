// A simple test script to validate the fractal wallet mapping

// Import required modules
import { initializeData, fartcoinHolders, goatTokenHolders, sharedHolders } from './dataLoader.js';

// Initialize data
console.log("Initializing data...");
initializeData();

// Print out the data we loaded
console.log(`Loaded ${fartcoinHolders.length} Fartcoin holders`);
console.log(`Loaded ${goatTokenHolders.length} Goat Token holders`);
console.log(`Loaded ${sharedHolders.length} shared holders`);

// Constants for the 3D positioning
const baseRadius = 1000;
const goldenAngle = 137.5 * (Math.PI / 180);

// Helper function to generate random values in a range
const randomBetween = (min, max) => {
  return min + Math.random() * (max - min);
};

// Map all wallets to 3D coordinates
console.log("Mapping wallets to 3D coordinates...");

// Map shared wallets near the origin
const sharedPoints = sharedHolders.map((wallet, i) => {
  const totalHolding = wallet.fartAmount + wallet.goatAmount;
  const normalizedIndex = i / sharedHolders.length;
  
  // Limit radius to within 800 for shared wallets and cluster more tightly
  const r = Math.min(800, baseRadius * Math.log(normalizedIndex + 1.5) / 3);
  const theta = i * goldenAngle;
  const phi = i * 0.5;
  
  // Calculate base positions using spherical coordinates
  let x = r * Math.cos(theta) * Math.sin(phi);
  let y = r * Math.sin(theta) * Math.sin(phi);
  let z = r * Math.cos(phi);
  
  // Add small noise for more natural appearance
  x += randomBetween(-baseRadius/15, baseRadius/15);
  y += randomBetween(-baseRadius/15, baseRadius/15);
  z += randomBetween(-baseRadius/15, baseRadius/15);
  
  // Add brightness based on holdings
  const brightness = Math.min(255, Math.floor(200 + totalHolding / 1000000));
  const color = `rgb(${brightness}, ${brightness}, ${brightness})`;
  
  return {
    x, y, z,
    address: wallet.address,
    fartAmount: wallet.fartAmount,
    goatAmount: wallet.goatAmount,
    color
  };
});

// Map Fartcoin wallets in +X space with recursive spirals
const fartcoinPoints = fartcoinHolders.map((wallet, i) => {
  // Use logarithmic scaling for more interesting distribution
  const r = baseRadius * Math.log(i + 2);
  const theta = i * goldenAngle;
  const phi = i * 0.5;
  
  // Base position calculation - shifted toward +X axis
  let x = r * Math.cos(theta) + baseRadius;
  let y = r * Math.sin(theta);
  let z = r * Math.sin(phi);
  
  // Add fractal sub-clusters by using modulo operations
  if (i % 5 === 0) {
    x += 200 * Math.sin(i);
    y += 200 * Math.cos(i);
  }
  
  // Add small noise
  x += randomBetween(-baseRadius/10, baseRadius/10);
  y += randomBetween(-baseRadius/10, baseRadius/10);
  z += randomBetween(-baseRadius/10, baseRadius/10);
  
  // Generate green-tinted color based on holdings
  const brightness = Math.min(200, Math.floor(50 + wallet.amount / 1000000));
  const color = `rgb(0, ${brightness + 55}, ${Math.floor(brightness/2)})`;
  
  return {
    x, y, z,
    address: wallet.address,
    amount: wallet.amount,
    color
  };
});

// Map Goat Token wallets in -X space (mirrored spirals)
const goatTokenPoints = goatTokenHolders.map((wallet, i) => {
  // Use logarithmic scaling for more interesting distribution
  const r = baseRadius * Math.log(i + 2);
  const theta = i * goldenAngle;
  const phi = i * 0.5;
  
  // Base position calculation - shifted toward -X axis (mirrored from Fartcoin)
  let x = -(r * Math.cos(theta)) - baseRadius;
  let y = r * Math.sin(theta);
  let z = r * Math.sin(phi);
  
  // Add fractal sub-clusters by using modulo operations
  if (i % 5 === 0) {
    x -= 200 * Math.sin(i);
    y += 200 * Math.cos(i);
  }
  
  // Add small noise
  x += randomBetween(-baseRadius/10, baseRadius/10);
  y += randomBetween(-baseRadius/10, baseRadius/10);
  z += randomBetween(-baseRadius/10, baseRadius/10);
  
  // Generate blue-tinted color based on holdings
  const brightness = Math.min(200, Math.floor(50 + wallet.amount / 1000000));
  const color = `rgb(${Math.floor(brightness/2)}, ${Math.floor(brightness/2)}, ${brightness + 55})`;
  
  return {
    x, y, z,
    address: wallet.address,
    amount: wallet.amount,
    color
  };
});

// Print mapping results
console.log(`Mapped ${sharedPoints.length} shared wallet points (centered)`);
console.log(`Mapped ${fartcoinPoints.length} Fartcoin wallet points (+X space)`);
console.log(`Mapped ${goatTokenPoints.length} Goat Token wallet points (-X space)`);

// Print sample points
if (sharedPoints.length > 0) {
  console.log("Sample shared point:", sharedPoints[0]);
}
if (fartcoinPoints.length > 0) {
  console.log("Sample Fartcoin point:", fartcoinPoints[0]);
}
if (goatTokenPoints.length > 0) {
  console.log("Sample Goat Token point:", goatTokenPoints[0]);
}

console.log("Test completed successfully!");