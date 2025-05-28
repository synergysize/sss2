/**
 * test-mapper.js - Simple test for the position mapper
 */

import { initializeData } from './dataLoader.js';

// Initialize data first
console.log("Initializing data...");
const data = initializeData();
console.log("Data initialized:", data);

// Now import and use the position mapper
import('./positionMapper.js').then(module => {
  console.log("Position mapper loaded");
  console.log("Shared points:", module.sharedPoints.length);
  console.log("Fartcoin points:", module.fartcoinPoints.length);
  console.log("Goat token points:", module.goatTokenPoints.length);
  
  if (module.sharedPoints.length > 0) {
    console.log("Sample shared point:", module.sharedPoints[0]);
  }
});