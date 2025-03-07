import BaseEnemy from './base-enemy.js';

export default class EnemyTwo extends BaseEnemy {
    constructor(scene, x, y, sides) {
        super(scene, x, y, sides, 2, 4); // Difficulty 2, deals 4 HP damage
        this.score = 20; // 20 points for defeating EnemyTwo
        this.rotationSpeed = -0.02; // Counter-clockwise rotation
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