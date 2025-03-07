import BaseBoss from './base-boss.js';

export default class BossTwo extends BaseBoss {
    constructor(scene, x, y, sides) {
        super(scene, x, y, sides, 12, 6); // 12 HP, deals 6 damage
        this.score = 150; // 150 points for defeating BossTwo
        this.rotationSpeed = -0.015; // Counter-clockwise rotation
    }
    
    update(time, delta, playerX, playerY) {
        // Call parent update for base behavior
        super.update(time, delta, playerX, playerY);
        
        // Add rotation with occasional direction change
        if (this.sprite && this.sprite.active) {
            // Initialize phase if not set
            if (!this.rotationPhase) {
                this.rotationPhase = 0;
            }
            
            this.rotationPhase += 0.005;
            
            // Change rotation direction with a sine wave pattern
            this.sprite.rotation += this.rotationSpeed * Math.sin(this.rotationPhase);
        }
    }
}