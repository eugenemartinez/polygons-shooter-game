import PowerUp from './buff.js';

export default class Shield extends PowerUp {
    constructor(scene, x, y) {
        super(scene, x, y, 'shield', 15000);
    }
    
    // Override the createTexture method
    createTexture(scene) {
        // Power-up icon
        const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0x0088ff);
        graphics.fillCircle(16, 16, 16);
        graphics.lineStyle(3, 0xffffff);
        graphics.beginPath();
        graphics.arc(16, 16, 10, 0, Math.PI, true);
        graphics.strokePath();
        graphics.generateTexture(this.textureKey, 32, 32);
        
        // Shield effect texture that surrounds player
        if (!scene.textures.exists('shield_effect')) {
            const shieldEffectGraphics = scene.make.graphics({ x: 0, y: 0, add: false });
            shieldEffectGraphics.lineStyle(3, 0x0088ff, 1);
            shieldEffectGraphics.strokeCircle(24, 24, 20);
            shieldEffectGraphics.lineStyle(1, 0xffffff, 0.8);
            shieldEffectGraphics.strokeCircle(24, 24, 23);
            shieldEffectGraphics.generateTexture('shield_effect', 48, 48);
        }
    }
    
    applyEffect(player) {
        // Store original invincibility state
        this.originalInvincible = player.isInvincible;
        
        // Enable invincibility
        player.isInvincible = true;
        
        // Visual shield effect
        this.shieldSprite = this.scene.add.sprite(player.sprite.x, player.sprite.y, 'shield_effect');
        this.shieldSprite.setScale(1.5);
        this.shieldSprite.setAlpha(0.6);
        this.shieldSprite.setDepth(player.sprite.depth - 1);
        
        // Make shield follow player
        this.updateShieldPosition = () => {
            if (this.shieldSprite && player.sprite && player.sprite.active) {
                this.shieldSprite.x = player.sprite.x;
                this.shieldSprite.y = player.sprite.y;
            }
        };
        
        this.scene.events.on('update', this.updateShieldPosition);
        
        // Rotate shield effect
        this.shieldRotation = this.scene.tweens.add({
            targets: this.shieldSprite,
            angle: 360,
            duration: 3000,
            repeat: -1
        });
        
        // Track the power-up in the manager
        this.scene.powerUpManager.trackPowerUp(this);
        
        // Display indicator text
        this.scene.displayStatusMessage('Shield Active!', 0x0088ff);
    }
    
    removeEffect(player) {
        // Restore original invincibility state
        player.isInvincible = this.originalInvincible;
        
        // Remove shield visual
        if (this.shieldSprite) {
            this.shieldRotation.stop();
            this.shieldSprite.destroy();
        }
        
        // Clean up event listener
        this.scene.events.off('update', this.updateShieldPosition);
    }
}