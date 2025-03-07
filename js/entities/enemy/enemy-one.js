import BaseEnemy from './base-enemy.js';

export default class EnemyOne extends BaseEnemy {
    constructor(scene, x, y, sides) {
        super(scene, x, y, sides, 1, 3); // Difficulty 1, deals 3 HP damage
        this.score = 10; // 10 points for defeating EnemyOne
        this.rotationSpeed = 0.03; // Fast rotation speed
    }
    
    update(time, delta, playerX, playerY) {
        // Call the parent update method for movement
        super.update(time, delta, playerX, playerY);
        
        // Add rotation
        if (this.sprite && this.sprite.active) {
            this.sprite.rotation += this.rotationSpeed;
        }
    }
}