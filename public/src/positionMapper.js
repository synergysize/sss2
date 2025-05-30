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
const baseRadius = 1250; // Increased from 1000 to 1250 (25% increase) for better sphere separation
const goldenAngle = 137.5 * (Math.PI / 180);
const spacingFactor = 1.25; // 25% increased spacing between nodes

// Helper function to generate random values in a range
const randomBetween = (min, max) => {
  return min + Math.random() * (max - min);
};

// Function to map shared wallets near the origin
const mapSharedWallets = (wallet, i, totalCount) => {
  // Calculate total holdings to determine importance
  const totalHolding = wallet.fartAmount + wallet.goatAmount;
  const normalizedIndex = i / totalCount;
  
  // Limit radius to within 1000 for shared wallets and cluster more tightly
  // Increased from 800 to 1000 for better sphere separation
  const r = Math.min(1000, baseRadius * Math.log(normalizedIndex + 1.5) / 3);
  const theta = i * goldenAngle;
  const phi = i * 0.5;
  
  // Calculate base positions using spherical coordinates with increased spacing
  let x = r * spacingFactor * Math.cos(theta) * Math.sin(phi);
  let y = r * spacingFactor * Math.sin(theta) * Math.sin(phi);
  let z = r * spacingFactor * Math.cos(phi);
  
  // Add small noise for more natural appearance
  // Scale noise proportionally to maintain visual consistency
  x += randomBetween(-baseRadius/18, baseRadius/18); // Reduced from /15 to /18 to keep noise proportional
  y += randomBetween(-baseRadius/18, baseRadius/18);
  z += randomBetween(-baseRadius/18, baseRadius/18);
  
  // White color for shared wallets (wallets holding both Fartcoin and Goat tokens)
  // Brightness correlates with token amount
  const brightness = Math.min(255, Math.floor(200 + totalHolding / 1000000));
  const color = `rgb(${brightness}, ${brightness}, ${brightness})`;
  
  return {
    x, y, z,
    address: wallet.address,
    fartAmount: wallet.fartAmount,
    goatAmount: wallet.goatAmount,
    totalHolding,
    walletType: 'shared',
    color
  };
};

// Function to map Fartcoin wallets in +X space with recursive spirals
const mapFartcoinWallets = (wallet, i) => {
  // Use logarithmic scaling for more interesting distribution with increased spacing
  const r = baseRadius * Math.log(i + 2);
  const theta = i * goldenAngle;
  const phi = i * 0.5;
  
  // Base position calculation - shifted toward +X axis with increased spacing
  let x = r * spacingFactor * Math.cos(theta) + baseRadius;
  let y = r * spacingFactor * Math.sin(theta);
  let z = r * spacingFactor * Math.sin(phi);
  
  // Add fractal sub-clusters by using modulo operations - increase spacing
  if (i % 5 === 0) {
    x += 250 * Math.sin(i); // Increased from 200 to 250
    y += 250 * Math.cos(i); // Increased from 200 to 250
  }
  
  // Add small noise - adjusted for increased spacing
  x += randomBetween(-baseRadius/12, baseRadius/12); // Reduced from /10 to /12 for proportional noise
  y += randomBetween(-baseRadius/12, baseRadius/12);
  z += randomBetween(-baseRadius/12, baseRadius/12);
  
  // Green color for Fartcoin-only wallets
  // Brightness correlates with token amount
  const brightness = Math.min(200, Math.floor(50 + wallet.amount / 1000000));
  const color = `rgb(0, ${brightness + 55}, 0)`;
  
  return {
    x, y, z,
    address: wallet.address,
    fartAmount: wallet.amount,
    goatAmount: 0,
    totalHolding: wallet.amount,
    walletType: 'fartcoin',
    color
  };
};

// Function to map Goat Token wallets in -X space (mirrored spirals)
const mapGoatTokenWallets = (wallet, i) => {
  // Use logarithmic scaling for more interesting distribution with increased spacing
  const r = baseRadius * Math.log(i + 2);
  const theta = i * goldenAngle;
  const phi = i * 0.5;
  
  // Base position calculation - shifted toward -X axis (mirrored from Fartcoin) with increased spacing
  let x = -(r * spacingFactor * Math.cos(theta)) - baseRadius;
  let y = r * spacingFactor * Math.sin(theta);
  let z = r * spacingFactor * Math.sin(phi);
  
  // Add fractal sub-clusters by using modulo operations - increase spacing
  if (i % 5 === 0) {
    x -= 250 * Math.sin(i); // Increased from 200 to 250
    y += 250 * Math.cos(i); // Increased from 200 to 250
  }
  
  // Add small noise - adjusted for increased spacing
  x += randomBetween(-baseRadius/12, baseRadius/12); // Reduced from /10 to /12 for proportional noise
  y += randomBetween(-baseRadius/12, baseRadius/12);
  z += randomBetween(-baseRadius/12, baseRadius/12);
  
  // Blue color for Goat-only wallets
  // Brightness correlates with token amount
  const brightness = Math.min(200, Math.floor(50 + wallet.amount / 1000000));
  const color = `rgb(0, 0, ${brightness + 55})`;
  
  return {
    x, y, z,
    address: wallet.address,
    fartAmount: 0,
    goatAmount: wallet.amount,
    totalHolding: wallet.amount,
    walletType: 'goat',
    color
  };
};

// Make sure data is initialized first
console.log('Initializing data from positionMapper.js');
initializeData();

// Initialize data immediately
console.log('Mapping wallet data to 3D points immediately');
console.log(`Data available before mapping: Fartcoin=${fartcoinHolders.length}, Goat=${goatTokenHolders.length}, Shared=${sharedHolders.length}`);

// No longer needed since we're using mapWallets helper function directly

// Create points arrays using a mutable object pattern instead of direct reassignment
export const points = {
  shared: [],
  fartcoin: [],
  goat: []
};

// Function to populate the arrays when data is ready
export function generateAllPoints() {
  console.log('Generating all points now that data is loaded');
  
  // Create local copies with capped number of wallets
  const cappedFartcoinHolders = fartcoinHolders.slice(0, 500);
  const cappedGoatTokenHolders = goatTokenHolders.slice(0, 500);
  const cappedSharedHolders = sharedHolders.slice(0, 100);
  
  // Use the modified functions below to create points based on capped data
  points.shared = mapWallets(cappedSharedHolders, mapSharedWallets);
  points.fartcoin = mapWallets(cappedFartcoinHolders, mapFartcoinWallets);
  points.goat = mapWallets(cappedGoatTokenHolders, mapGoatTokenWallets);
  
  console.log(`Generated: Shared=${points.shared.length}, Fartcoin=${points.fartcoin.length}, Goat=${points.goat.length}`);
  return { 
    sharedPoints: points.shared, 
    fartcoinPoints: points.fartcoin, 
    goatTokenPoints: points.goat 
  };
}

// Helper function to map wallets with the appropriate mapping function
function mapWallets(wallets, mapFn) {
  if (!wallets || wallets.length === 0) {
    console.warn('No wallet data available for mapping');
    return [];
  }
  
  return wallets.map((wallet, i) => mapFn(wallet, i, wallets.length));
}

// Generate the initial points
generateAllPoints();

// Log summary for verification
console.log(`Mapped ${points.shared.length} shared wallet points (centered)`);
console.log(`Mapped ${points.fartcoin.length} Fartcoin wallet points (+X space)`);
console.log(`Mapped ${points.goat.length} Goat Token wallet points (-X space)`);

// Optional: Log a sample point from each set
if (points.shared.length > 0) {
  console.log('Sample shared point:', points.shared[0]);
}
if (points.fartcoin.length > 0) {
  console.log('Sample Fartcoin point:', points.fartcoin[0]);
}
if (points.goat.length > 0) {
  console.log('Sample Goat Token point:', points.goat[0]);
}

// Default export for convenience
export default {
  sharedPoints: points.shared,
  fartcoinPoints: points.fartcoin,
  goatTokenPoints: points.goat
};