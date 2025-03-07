import BaseBoss from './base-boss.js';

export default class BossFour extends BaseBoss {
    constructor(scene, x, y, sides) {
        super(scene, x, y, sides, 16, 8); // 16 HP, deals 8 damage
        this.score = 225; // 225 points for defeating BossFour
        this.rotationSpeed = 0.025; // Base rotation speed
    }
    
    update(time, delta, playerX, playerY) {
        // Call parent update for base behavior
        super.update(time, delta, playerX, playerY);
        
        // Add pulsating rotation that speeds up and slows down
        if (this.sprite && this.sprite.active) {
            // Calculate a pulsating rotation speed
            const pulseSpeed = Math.abs(Math.sin(time / 1000) * this.rotationSpeed * 2);
            this.sprite.rotation += pulseSpeed;
        }
    }
}