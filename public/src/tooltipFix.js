// Tooltip Fix - Check if element exists and create it if not
console.log("Tooltip Fix script running");

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM fully loaded - checking for tooltip element");
  
  // Check if tooltip exists
  let tooltip = document.getElementById('wallet-tooltip');
  console.log("Tooltip element exists:", tooltip !== null);
  
  if (!tooltip) {
    console.log("Creating missing tooltip element");
    
    // Create tooltip element
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
        <div class="tooltip-fartcoin" style="color: #88ff88;">💨: 0</div>
        <div class="tooltip-goat" style="color: #8888ff;">🐐: 0</div>
      </div>
      <div class="tooltip-total" style="margin-top: 8px; font-weight: bold; color: #ffffff;">Total Value: 0</div>
    `;
    
    // Add to document
    document.body.appendChild(tooltip);
    console.log("Created and added tooltip element to body");
  }
});

// Export nothing - this is just for the side effects
export default {};