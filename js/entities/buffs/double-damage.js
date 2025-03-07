import PowerUp from './buff.js';

export default class DoubleDamage extends PowerUp {
    constructor(scene, x, y) {
        super(scene, x, y, 'double_damage', 10000);
    }
    
    // Override the createTexture method
    createTexture(scene) {
        const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
        
        // Fill the circle background
        graphics.fillStyle(0xff0000);
        graphics.fillCircle(16, 16, 16);
        
        // Draw a star shape using polygon points
        graphics.fillStyle(0xffff00);
        
        // Create star points
        const starPoints = this.createStarPoints(16, 16, 5, 8, 14);
        
        // Fill the star shape
        graphics.fillPoints(starPoints, true);
        
        // Generate the texture
        graphics.generateTexture(this.textureKey, 32, 32);
    }
    
    // Helper method to create star points
    createStarPoints(centerX, centerY, points, innerRadius, outerRadius) {
        const starPoints = [];
        const angleStep = Math.PI * 2 / points;
        
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * angleStep / 2) - Math.PI / 2; // Start at top
            
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            starPoints.push(new Phaser.Geom.Point(x, y));
        }
        
        return starPoints;
    }
    
    applyEffect(player) {
        // Store original damage for later restoration
        this.originalDamage = player.bulletDamage || 1;
        
        // Double the player's bullet damage
        player.bulletDamage = this.originalDamage * 2;
                
        // Store original bullet creation method if it exists
        if (player.createBullet) {
            this.originalCreateBullet = player.createBullet;
            
            // Override the createBullet method to enhance bullets
            player.createBullet = (...args) => {
                const bullet = this.originalCreateBullet.apply(player, args);
                
                if (bullet) {
                    // Apply red tint to bullets
                    if (typeof bullet.setTint === 'function') {
                        bullet.setTint(0xff0000);
                    }
                    
                    // Set explicit damage property on bullet if needed
                    bullet.damage = player.bulletDamage;
                    
                    // Add data attribute for damage
                    if (typeof bullet.setData === 'function') {
                        bullet.setData('damage', player.bulletDamage);
                    }
                    
                    // Make bullets slightly larger for visual effect
                    if (bullet.scaleX && bullet.scaleY) {
                        bullet.setScale(bullet.scaleX * 1.2, bullet.scaleY * 1.2);
                    }
                }
                
                return bullet;
            };
        }
        
        // Store original color if it exists
        if (player.color !== undefined) {
            this.originalColor = player.color;
            player.color = 0xff4444;
            
            // If player has a render method, call it to update visuals
            if (typeof player.render === 'function') {
                player.render();
            }
        }
        
        // Apply visual effect to gun if it exists
        if (player.gunSprite) {
            this.originalGunColor = player.gunSprite.tint;
            if (typeof player.gunSprite.setTint === 'function') {
                player.gunSprite.setTint(0xff4444);
            }
        }
        
        // Create damage aura effect
        if (this.scene.add.particles) {
            this.damageAura = this.scene.add.particles(0, 0, 'particle', {
                follow: player.sprite,
                emitZone: {
                    type: 'random',
                    source: new Phaser.Geom.Circle(0, 0, 5) // Small area centered on player
                },
                scale: { start: 0.3, end: 0 },
                alpha: { start: 0.5, end: 0 },
                lifespan: 600,
                frequency: 50,  // More frequent for better visibility
                quantity: 2,    // More particles
                tint: 0xff0000,
                blendMode: 'ADD'
            });
        }
        
        // Track the power-up in the manager
        this.scene.powerUpManager.trackPowerUp(this);
        
        // Display indicator text
        this.scene.displayStatusMessage('Double Damage!', 0xff0000);
    }
    
    removeEffect(player) {
        // Restore original damage
        player.bulletDamage = this.originalDamage;
        
        // Restore original create bullet method if overridden
        if (this.originalCreateBullet && player.createBullet) {
            player.createBullet = this.originalCreateBullet;
        }
        
        // Restore original color if it was changed
        if (this.originalColor !== undefined && player.color !== undefined) {
            player.color = this.originalColor;
            
            // Update player rendering if possible
            if (typeof player.render === 'function') {
                player.render();
            }
        }
        
        // Restore gun color if it exists
        if (player.gunSprite && this.originalGunColor !== undefined) {
            if (typeof player.gunSprite.clearTint === 'function') {
                player.gunSprite.clearTint();
            } else if (typeof player.gunSprite.setTint === 'function') {
                player.gunSprite.setTint(this.originalGunColor);
            }
        }
        
        // Remove particle effect
        if (this.damageAura) {
            this.damageAura.destroy();
        }
    }
}