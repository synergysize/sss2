/**
 * positionMapper.js - Map wallet addresses into 3D fractal space
 *
 * This module maps wallet addresses into 3D coordinates using
 * recursive spiral patterns with logarithmic scaling and self-similar offsets.
 * 
 * The positioning follows these strategies:
 * - Shared Wallets: Clustered near origin (0,0,0) in a golden-angle spiral inside a sphere
 * - Fartcoin Wallets: Expand outward in +X space in recursive golden-angle spirals
 * - Goat Token Wallets: Mirror of Fartcoin in -X space
 */

import { fartcoinHolders, goatTokenHolders, sharedHolders, initializeData } from './dataLoader.js';

// Constants for the 3D positioning
const baseRadius = 1000;
const goldenAngle = 137.5 * (Math.PI / 180);

// Helper function to generate random values in a range
const randomBetween = (min, max) => {
  return min + Math.random() * (max - min);
};

// Function to map shared wallets near the origin
const mapSharedWallets = () => {
  // Make sure we have data to map
  if (!sharedHolders || sharedHolders.length === 0) {
    console.warn('No shared wallet data available for mapping');
    return [];
  }
  
  return sharedHolders.map((wallet, i) => {
    // Calculate total holdings to determine importance
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
};

// Function to map Fartcoin wallets in +X space with recursive spirals
const mapFartcoinWallets = () => {
  // Make sure we have data to map
  if (!fartcoinHolders || fartcoinHolders.length === 0) {
    console.warn('No Fartcoin wallet data available for mapping');
    return [];
  }
  
  return fartcoinHolders.map((wallet, i) => {
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
};

// Function to map Goat Token wallets in -X space (mirrored spirals)
const mapGoatTokenWallets = () => {
  // Make sure we have data to map
  if (!goatTokenHolders || goatTokenHolders.length === 0) {
    console.warn('No Goat Token wallet data available for mapping');
    return [];
  }
  
  return goatTokenHolders.map((wallet, i) => {
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
};

// Make sure data is initialized first
console.log('Initializing data from positionMapper.js');
initializeData();

// Initialize data immediately
console.log('Mapping wallet data to 3D points immediately');
console.log(`Data available before mapping: Fartcoin=${fartcoinHolders.length}, Goat=${goatTokenHolders.length}, Shared=${sharedHolders.length}`);

// Generate all the 3D positions - we'll recreate these as functions that can be called when we're sure data is loaded
const generateSharedPoints = () => mapSharedWallets();
const generateFartcoinPoints = () => mapFartcoinWallets();
const generateGoatTokenPoints = () => mapGoatTokenWallets();

// Initial empty arrays
export let sharedPoints = [];
export let fartcoinPoints = [];
export let goatTokenPoints = [];

// Function to populate the arrays when data is ready
export function generateAllPoints() {
  console.log('Generating all points now that data is loaded');
  sharedPoints = generateSharedPoints();
  fartcoinPoints = generateFartcoinPoints();
  goatTokenPoints = generateGoatTokenPoints();
  
  console.log(`Generated: Shared=${sharedPoints.length}, Fartcoin=${fartcoinPoints.length}, Goat=${goatTokenPoints.length}`);
  return { sharedPoints, fartcoinPoints, goatTokenPoints };
}

// Generate the initial points
generateAllPoints();

// Log summary for verification
console.log(`Mapped ${sharedPoints.length} shared wallet points (centered)`);
console.log(`Mapped ${fartcoinPoints.length} Fartcoin wallet points (+X space)`);
console.log(`Mapped ${goatTokenPoints.length} Goat Token wallet points (-X space)`);

// Optional: Log a sample point from each set
if (sharedPoints.length > 0) {
  console.log('Sample shared point:', sharedPoints[0]);
}
if (fartcoinPoints.length > 0) {
  console.log('Sample Fartcoin point:', fartcoinPoints[0]);
}
if (goatTokenPoints.length > 0) {
  console.log('Sample Goat Token point:', goatTokenPoints[0]);
}

// Default export for convenience
export default {
  sharedPoints,
  fartcoinPoints,
  goatTokenPoints
};