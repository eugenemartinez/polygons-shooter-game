import BaseEnemy from './base-enemy.js';

export default class EnemyFour extends BaseEnemy {
    constructor(scene, x, y, sides) {
        super(scene, x, y, sides, 4, 6); // Difficulty 4, deals 6 HP damage
        this.score = 40; // 40 points for defeating EnemyFour
        this.rotationSpeed = 0.025; // Medium rotation speed
        this.directionChangeTime = 0;
    }
    
    update(time, delta, playerX, playerY) {
        // Call the parent update method for movement
        super.update(time, delta, playerX, playerY);
        
        // Add oscillating rotation that changes direction
        if (this.sprite && this.sprite.active) {
            // Change direction every 1.5 seconds
            if (time - this.directionChangeTime > 1500) {
                this.rotationSpeed = -this.rotationSpeed;
                this.directionChangeTime = time;
            }
            
            this.sprite.rotation += this.rotationSpeed;
        }
    }
}