/**
 * directTooltipFix.js - Emergency fix for wallet metadata tooltip
 * 
 * This file provides direct, simple fixes for the wallet tooltip issues:
 * 1. Ensures the tooltip element exists and is properly styled
 * 2. Forces visibility when wallet data is available
 * 3. Provides a fallback mechanism for displaying wallet data
 */

// Direct tooltip update function that will be called when hovering over a wallet
export function updateTooltipContent(tooltip, walletData) {
  if (!tooltip || !walletData) {
    console.error('Missing tooltip element or wallet data:', { tooltip: !!tooltip, walletData: !!walletData });
    return false;
  }
  
  // Ensure tooltip is visible with a high z-index
  tooltip.style.display = 'block';
  tooltip.style.zIndex = '10000';
  tooltip.style.backgroundColor = 'rgba(0, 10, 30, 0.95)'; // Darker, more opaque background
  tooltip.style.border = '2px solid rgba(100, 200, 255, 0.8)'; // Brighter border
  tooltip.style.boxShadow = '0 0 15px rgba(0, 100, 255, 0.7)'; // Stronger glow effect
  
  // Format address for display (shorten if needed)
  const address = walletData.address || '0x0000...0000';
  const shortAddress = address.length > 16 
    ? `${address.substring(0, 8)}...${address.substring(address.length-8)}` 
    : address;
  
  // Get token amounts with fallbacks to zero
  const fartAmount = walletData.fartAmount || 0;
  const goatAmount = walletData.goatAmount || 0;
  
  // Format numbers with commas and 2 decimal places
  const fartAmountFormatted = fartAmount.toLocaleString(undefined, {
    maximumFractionDigits: 2
  });
  
  const goatAmountFormatted = goatAmount.toLocaleString(undefined, {
    maximumFractionDigits: 2
  });
  
  const totalAmountFormatted = (fartAmount + goatAmount).toLocaleString(undefined, {
    maximumFractionDigits: 2
  });
  
  // Determine token holdings description
  let holdingsType = '';
  if (fartAmount > 0 && goatAmount > 0) {
    holdingsType = 'Holds both 💨 and 🐐';
  } else if (fartAmount > 0) {
    holdingsType = 'Holds 💨 only';
  } else if (goatAmount > 0) {
    holdingsType = 'Holds 🐐 only';
  } else {
    holdingsType = 'No tokens found';
  }
  
  // Update tooltip content - without Total Value line
  tooltip.innerHTML = `
    <div class="tooltip-title" style="font-weight: bold; margin-bottom: 5px; font-size: 14px; color: #88ccff;">Wallet Details</div>
    <div class="tooltip-address" style="font-family: monospace; font-size: 12px; margin-bottom: 8px; color: #aaccff; word-break: break-all;">${shortAddress}</div>
    <div class="tooltip-type" style="margin-bottom: 5px; color: #ffcc88;">${holdingsType}</div>
    <div class="tooltip-holdings" style="margin-bottom: 5px;">
      <div class="tooltip-fartcoin" style="color: #88ff88;">💨: ${fartAmountFormatted}</div>
      <div class="tooltip-goat" style="color: #8888ff;">🐐: ${goatAmountFormatted}</div>
    </div>
  `;
  
  console.log('Updated tooltip with wallet data:', shortAddress);
  return true;
}

// Show tooltip at specified position
export function showTooltip(tooltip, x, y, walletData) {
  if (!tooltip) {
    console.error('Tooltip element is missing, cannot show');
    return false;
  }
  
  // Position with offset from cursor
  tooltip.style.left = (x + 15) + 'px';
  tooltip.style.top = (y + 15) + 'px';
  
  // Update content and ensure visibility
  const updated = updateTooltipContent(tooltip, walletData);
  if (updated) {
    tooltip.style.display = 'block';
    console.log('Tooltip shown at position:', x, y);
    return true;
  }
  
  return false;
}

// Hide tooltip
export function hideTooltip(tooltip) {
  if (tooltip) {
    tooltip.style.display = 'none';
    console.log('Tooltip hidden');
    return true;
  }
  return false;
}

// Create tooltip if missing
export function createTooltipIfMissing() {
  let tooltip = document.getElementById('wallet-tooltip');
  
  if (!tooltip) {
    console.log('Creating missing tooltip element');
    
    // Create tooltip element with inline styles for reliability
    tooltip = document.createElement('div');
    tooltip.id = 'wallet-tooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.display = 'none';
    tooltip.style.backgroundColor = 'rgba(0, 10, 30, 0.95)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '10px';
    tooltip.style.borderRadius = '5px';
    tooltip.style.fontSize = '12px';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '10000'; // Very high z-index
    tooltip.style.maxWidth = '250px';
    tooltip.style.transition = 'opacity 0.3s';
    tooltip.style.border = '2px solid rgba(100, 200, 255, 0.8)';
    tooltip.style.boxShadow = '0 0 15px rgba(0, 100, 255, 0.7)';
    
    // Create tooltip content - without Total Value line
    tooltip.innerHTML = `
      <div class="tooltip-title" style="font-weight: bold; margin-bottom: 5px; font-size: 14px; color: #88ccff;">Wallet Details</div>
      <div class="tooltip-address" style="font-family: monospace; font-size: 12px; margin-bottom: 8px; color: #aaccff; word-break: break-all;">0x0000...0000</div>
      <div class="tooltip-type" style="margin-bottom: 5px; color: #ffcc88;">Loading...</div>
      <div class="tooltip-holdings" style="margin-bottom: 5px;">
        <div class="tooltip-fartcoin" style="color: #88ff88;">Fartcoin: 0</div>
        <div class="tooltip-goat" style="color: #8888ff;">Goatcoin: 0</div>
      </div>
    `;
    
    // Add to document body
    document.body.appendChild(tooltip);
    console.log('Created and added tooltip element to body');
  }
  
  return tooltip;
}

// Export a default object with all functions
export default {
  updateTooltipContent,
  showTooltip,
  hideTooltip,
  createTooltipIfMissing
};