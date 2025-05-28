/**
 * walletTooltip.js - A standalone tooltip solution for wallet data
 * 
 * This creates a visible floating tooltip that isn't dependent on HTML elements
 * but is drawn directly on the canvas.
 */

import * as THREE from 'three';

class WalletTooltip {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.visible = false;
    this.walletData = null;
    this.position = new THREE.Vector3();
    this.offset = new THREE.Vector3(0, 200, 0);
    
    // Create sprite for the tooltip background
    const tooltipTexture = this.createTooltipTexture();
    this.tooltipMaterial = new THREE.SpriteMaterial({
      map: tooltipTexture,
      transparent: true,
      opacity: 0.9,
      depthTest: false,
      depthWrite: false
    });
    
    this.tooltipSprite = new THREE.Sprite(this.tooltipMaterial);
    this.tooltipSprite.scale.set(400, 200, 1);
    this.tooltipSprite.visible = false;
    this.scene.add(this.tooltipSprite);
    
    console.log('Created 3D wallet tooltip');
  }
  
  createTooltipTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    
    const context = canvas.getContext('2d');
    
    // Draw background
    context.fillStyle = 'rgba(0, 10, 30, 0.9)';
    context.strokeStyle = 'rgba(100, 200, 255, 0.8)';
    context.lineWidth = 4;
    context.beginPath();
    context.roundRect(10, 10, canvas.width - 20, canvas.height - 20, 15);
    context.fill();
    context.stroke();
    
    // Add title text
    context.fillStyle = '#88ccff';
    context.font = 'bold 24px Arial';
    context.fillText('Wallet Details', 30, 40);
    
    // Add placeholder text
    context.fillStyle = '#ffffff';
    context.font = '16px Monospace';
    context.fillText('Address: 0x000...000', 30, 80);
    context.fillStyle = '#88ff88';
    context.fillText('Fartcoin: 0', 30, 110);
    context.fillStyle = '#8888ff';
    context.fillText('Goat: 0', 30, 140);
    context.fillStyle = '#ffffff';
    context.font = 'bold 16px Arial';
    context.fillText('Total Value: 0', 30, 180);
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    // Store context for updates
    this.canvasContext = context;
    this.canvas = canvas;
    
    return texture;
  }
  
  updateTooltipContent(walletData) {
    if (!walletData) return;
    
    const context = this.canvasContext;
    
    // Clear the previous content
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw background
    context.fillStyle = 'rgba(0, 10, 30, 0.9)';
    context.strokeStyle = 'rgba(100, 200, 255, 0.8)';
    context.lineWidth = 4;
    context.beginPath();
    context.roundRect(10, 10, this.canvas.width - 20, this.canvas.height - 20, 15);
    context.fill();
    context.stroke();
    
    // Add title text
    context.fillStyle = '#88ccff';
    context.font = 'bold 24px Arial';
    context.fillText('Wallet Details', 30, 40);
    
    // Format address
    const address = walletData.address;
    const shortAddress = address.length > 12 
      ? `${address.substring(0, 8)}...${address.substring(address.length-4)}` 
      : address;
    
    // Format values
    const fartAmountFormatted = walletData.fartAmount.toLocaleString(undefined, {
      maximumFractionDigits: 2
    });
    
    const goatAmountFormatted = walletData.goatAmount.toLocaleString(undefined, {
      maximumFractionDigits: 2
    });
    
    const totalAmountFormatted = (walletData.fartAmount + walletData.goatAmount).toLocaleString(undefined, {
      maximumFractionDigits: 2
    });
    
    // Add wallet data
    context.fillStyle = '#aaccff';
    context.font = '16px Monospace';
    context.fillText(`Address: ${shortAddress}`, 30, 80);
    context.fillStyle = '#88ff88';
    context.fillText(`Fartcoin: ${fartAmountFormatted}`, 30, 110);
    context.fillStyle = '#8888ff';
    context.fillText(`Goat: ${goatAmountFormatted}`, 30, 140);
    context.fillStyle = '#ffffff';
    context.font = 'bold 16px Arial';
    context.fillText(`Total Value: ${totalAmountFormatted}`, 30, 180);
    
    // Update texture
    this.tooltipMaterial.map.needsUpdate = true;
  }
  
  show(walletData, worldPosition) {
    this.walletData = walletData;
    this.position.copy(worldPosition);
    this.updateTooltipContent(walletData);
    this.tooltipSprite.visible = true;
    this.visible = true;
    console.log('Showing 3D tooltip');
  }
  
  hide() {
    this.tooltipSprite.visible = false;
    this.visible = false;
    console.log('Hiding 3D tooltip');
  }
  
  update() {
    if (!this.visible) return;
    
    // Position tooltip to follow target position in world space
    // but offset to the right side
    
    // Get position in screen space
    const screenPosition = this.position.clone().project(this.camera);
    
    // Add offset to the right
    screenPosition.x += 0.2;
    
    // Convert back to world space
    const worldPosition = screenPosition.clone().unproject(this.camera);
    
    // Set tooltip position
    this.tooltipSprite.position.copy(worldPosition);
    
    // Position at the same distance as camera
    const cameraDistance = this.camera.position.distanceTo(this.position);
    const direction = worldPosition.clone().sub(this.camera.position).normalize();
    this.tooltipSprite.position.copy(this.camera.position).add(direction.multiplyScalar(cameraDistance * 0.8));
  }
}

export default WalletTooltip;