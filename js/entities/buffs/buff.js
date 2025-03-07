export default class PowerUp {
    constructor(scene, x, y, type, duration = 10000) {
        this.scene = scene;
        this.type = type;  // Type identifier for the power-up
        this.duration = duration;  // Duration of effect in milliseconds
        
        // Generate texture key for this power-up
        this.textureKey = `powerup_${type}`;
        
        // Create power-up texture if it doesn't exist yet
        if (!scene.textures.exists(this.textureKey)) {
            this.createTexture(scene);
        }
        
        // Create the sprite
        this.sprite = scene.physics.add.sprite(x, y, this.textureKey);
        this.sprite.setScale(0.5);  // Size adjusted for visibility
        
        // Add rotation animation
        this.rotationTween = scene.tweens.add({
            targets: this.sprite,
            angle: 360,
            duration: 3000,
            repeat: -1
        });
        
        // Add pulsing animation for better visibility
        this.pulseTween = scene.tweens.add({
            targets: this.sprite,
            scale: { from: 0.5, to: 0.6 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });
        
        // Set up disappear timer (10 seconds)
        this.disappearTimer = scene.time.delayedCall(10000, this.destroy, [], this);
        
        // Setup for collection
        this.collected = false;
    }
    
    // Method to create texture - to be overridden by subclasses
    createTexture(scene) {
        // Default power-up texture (gray circle)
        const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xaaaaaa);
        graphics.fillCircle(16, 16, 16);
        graphics.generateTexture(this.textureKey, 32, 32);
    }
    
    // Called when player collects the power-up
    collect(player) {
        if (this.collected) return;
        
        this.collected = true;
        this.applyEffect(player);
        
        // Play collection animation
        this.scene.tweens.add({
            targets: this.sprite,
            scale: 0,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                this.destroy();
            }
        });
    }
    
    // Apply power-up effect (to be overridden by subclasses)
    applyEffect(player) {
        // Abstract method to be implemented by subclasses
    }
    
    // Remove power-up effect (to be overridden by subclasses)
    removeEffect(player) {
        // Abstract method to be implemented by subclasses
    }
    
    // Destroy the power-up
    destroy() {
        if (this.sprite && this.sprite.active) {
            if (this.rotationTween) this.rotationTween.stop();
            if (this.pulseTween) this.pulseTween.stop();
            this.sprite.destroy();
        }
    }
}