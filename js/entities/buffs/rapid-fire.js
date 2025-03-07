import PowerUp from './buff.js';

export default class RapidFire extends PowerUp {
    constructor(scene, x, y) {
        super(scene, x, y, 'rapid_fire', 8000);
    }
    
    // Override the createTexture method
    createTexture(scene) {
        const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
        
        // Base circle
        graphics.fillStyle(0x00ffff);
        graphics.fillCircle(16, 16, 16);
        
        // Bullet symbols
        graphics.fillStyle(0x0000ff);
        
        // Add multiple "bullet" rectangles to suggest rapid fire
        for (let i = -1; i <= 1; i++) {
            graphics.fillRect(10 + i*5, 8, 3, 16);
        }
        
        // Add muzzle flash suggestion at top
        graphics.fillStyle(0xffffff);
        // Create a simple triangle for muzzle flash
        graphics.beginPath();
        graphics.moveTo(10, 6);   // Left point
        graphics.lineTo(16, 0);   // Top point
        graphics.lineTo(22, 6);   // Right point
        graphics.closePath();
        graphics.fillPath();
        
        graphics.generateTexture(this.textureKey, 32, 32);
    }
    
    applyEffect(player) {
        // Store original fire rate for later restoration
        this.originalFireRate = player.fireRate;
        
        // Double the fire rate (lower cooldown time)
        player.fireRate /= 2;
        
        // Create trail effect with improved centering
        if (this.scene.add.particles) {
            this.trailEffect = this.scene.add.particles(0, 0, 'particle', {
                follow: player.sprite,
                emitZone: {
                    type: 'random',
                    source: new Phaser.Geom.Circle(0, 0, 6) // Small centered circle
                },
                scale: { start: 0.3, end: 0 },
                alpha: { start: 0.5, end: 0 },
                lifespan: 400,
                frequency: 40, // Slightly more frequent for better effect
                quantity: 1,
                tint: 0x00ffff,
                blendMode: 'ADD' // Added for more vibrant effect
            });
        }
        
        // Store original bullet fired callback if it exists
        if (player.onBulletFired) {
            this.originalOnBulletFired = player.onBulletFired;
            
            // Override with enhanced version
            player.onBulletFired = (x, y, angle) => {
                // Call original callback
                this.originalOnBulletFired(x, y, angle);
                
                // Add flash effect
                if (this.scene.add.particles) {
                    const particles = this.scene.add.particles(x, y, 'particle', {
                        speed: 100,
                        scale: { start: 0.2, end: 0 },
                        alpha: { start: 0.7, end: 0 },
                        lifespan: 100,
                        angle: { min: angle - 20, max: angle + 20 },
                        blendMode: 'ADD',
                        quantity: 3
                    });
                    
                    // Destroy after short time
                    this.scene.time.delayedCall(100, () => {
                        particles.destroy();
                    });
                }
            };
        }
        
        // Track the power-up in the manager
        this.scene.powerUpManager.trackPowerUp(this);
        
        // Display indicator text
        this.scene.displayStatusMessage('Rapid Fire!', 0x00ffff);
    }
    
    removeEffect(player) {
        // Restore original fire rate
        player.fireRate = this.originalFireRate;
        
        // Restore original bullet fired callback
        if (this.originalOnBulletFired && player.onBulletFired) {
            player.onBulletFired = this.originalOnBulletFired;
        }
        
        // Remove trail effect
        if (this.trailEffect) {
            this.trailEffect.destroy();
        }
    }
}