import PowerUp from './buff.js';

export default class Haste extends PowerUp {
    constructor(scene, x, y) {
        super(scene, x, y, 'haste', 12000);
    }
    
    // Override the createTexture method
    createTexture(scene) {
        const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
        
        // Base circle
        graphics.fillStyle(0xffff00);
        graphics.fillCircle(16, 16, 16);
        
        // Lightning bolt shape
        graphics.fillStyle(0xff9900);
        
        // Draw lightning bolt
        graphics.beginPath();
        graphics.moveTo(12, 6);   // Top left
        graphics.lineTo(20, 14);  // Middle right
        graphics.lineTo(14, 16);  // Middle left
        graphics.lineTo(20, 26);  // Bottom right
        graphics.lineTo(12, 18);  // Bottom left
        graphics.lineTo(18, 14);  // Back to middle right
        graphics.closePath();
        graphics.fillPath();
        
        graphics.generateTexture(this.textureKey, 32, 32);
    }
    
    applyEffect(player) {
        // Store original speed for later restoration
        this.originalSpeed = player.speed;
        
        // Increase movement speed by 50%
        player.speed *= 1.5;
        
        // Visual trail effect when moving
        this.createTrailEffect(player);
        
        // Track the power-up in the manager
        this.scene.powerUpManager.trackPowerUp(this);
        
        // Display indicator text
        if (this.scene.displayStatusMessage) {
            this.scene.displayStatusMessage('Speed Boost!', 0xffff00);
        }
    }
    
    createTrailEffect(player) {
        // Only create if particles system is available
        if (this.scene.add.particles) {
            this.trailEffect = this.scene.add.particles(0, 0, 'particle', {
                follow: player.sprite,
                scale: { start: 0.4, end: 0 },
                alpha: { start: 0.6, end: 0 },
                speed: 20,
                angle: { min: 0, max: 360 },
                lifespan: 300,
                frequency: 40,
                tint: 0xffff00,
                emitting: false
            });
            
            // Set up an update listener to emit particles only when player moves
            this.lastPos = { x: player.sprite.x, y: player.sprite.y };
            
            this.moveTracker = () => {
                const distanceMoved = Phaser.Math.Distance.Between(
                    this.lastPos.x, this.lastPos.y,
                    player.sprite.x, player.sprite.y
                );
                
                // Only emit particles when moving significantly
                if (distanceMoved > 1) {
                    this.trailEffect.emitting = true;
                } else {
                    this.trailEffect.emitting = false;
                }
                
                this.lastPos = { x: player.sprite.x, y: player.sprite.y };
            };
            
            // Add the update listener
            this.scene.events.on('update', this.moveTracker);
        }
    }
    
    removeEffect(player) {
        // Restore original speed
        player.speed = this.originalSpeed;
        
        // Remove trail effect
        if (this.trailEffect) {
            this.trailEffect.destroy();
        }
        
        // Remove update listener
        if (this.moveTracker) {
            this.scene.events.off('update', this.moveTracker);
        }
    }
}