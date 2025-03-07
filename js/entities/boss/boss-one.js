import BaseBoss from './base-boss.js';

export default class BossOne extends BaseBoss {
    constructor(scene, x, y, sides) {
        super(scene, x, y, sides, 10, 5); // 10 HP, deals 5 damage
        this.score = 100; // 100 points for defeating BossOne
        this.rotationSpeed = 0.01; // Slow, imposing rotation
    }
    
    update(time, delta, playerX, playerY) {
        // Call parent update for base behavior
        super.update(time, delta, playerX, playerY);
        
        // Add rotation
        if (this.sprite && this.sprite.active) {
            this.sprite.rotation += this.rotationSpeed;
        }
    }
}