import BaseEnemy from './base-enemy.js';

export default class EnemyThree extends BaseEnemy {
    constructor(scene, x, y, sides) {
        super(scene, x, y, sides, 3, 5); // Difficulty 3, deals 5 HP damage
        this.score = 30; // 30 points for defeating EnemyThree
        this.rotationSpeed = 0.04; // Very fast rotation
    }
    
    update(time, delta, playerX, playerY) {
        // Call the parent update method for movement
        super.update(time, delta, playerX, playerY);
        
        // Add rotation with pulsating speed
        if (this.sprite && this.sprite.active) {
            this.sprite.rotation += this.rotationSpeed * (0.8 + Math.sin(time/1000) * 0.4);
        }
    }
}