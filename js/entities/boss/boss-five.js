import BaseBoss from './base-boss.js';

export default class BossFive extends BaseBoss {
    constructor(scene, x, y, sides) {
        super(scene, x, y, sides, 20, 10); // 20 HP, deals 10 damage
        this.score = 250; // 250 points for defeating BossFive
        this.rotationSpeed = 0.005; // Very slow base speed
    }
    
    update(time, delta, playerX, playerY) {
        // Call parent update for base behavior
        super.update(time, delta, playerX, playerY);
        
        // Add complex rotation pattern
        if (this.sprite && this.sprite.active) {
            // Initialize rotation properties if not set
            if (!this.patternTime) {
                this.patternTime = 0;
                this.currentPattern = 0;
                this.rotationDirection = 1;
            }
            
            // Change rotation pattern every 5 seconds
            if (time - this.patternTime > 5000) {
                this.currentPattern = (this.currentPattern + 1) % 3;
                this.patternTime = time;
                this.rotationDirection *= -1;
            }
            
            // Apply different rotation patterns
            switch (this.currentPattern) {
                case 0:
                    // Slow rotation
                    this.sprite.rotation += this.rotationSpeed * this.rotationDirection;
                    break;
                case 1:
                    // Fast rotation
                    this.sprite.rotation += this.rotationSpeed * 5 * this.rotationDirection;
                    break;
                case 2:
                    // Oscillating rotation
                    this.sprite.rotation += Math.sin(time / 200) * this.rotationSpeed * 3;
                    break;
            }
        }
    }
}