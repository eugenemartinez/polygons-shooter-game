import BaseEnemy from './base-enemy.js';

export default class EnemyFive extends BaseEnemy {
    constructor(scene, x, y, sides) {
        super(scene, x, y, sides, 5, 7); // Difficulty 5, deals 7 HP damage
        this.score = 50; // 50 points for defeating EnemyFive
        this.rotationSpeed = 0.015; // Slow but variable rotation
        this.lastSpeedChangeTime = 0;
    }
    
    update(time, delta, playerX, playerY) {
        // Call the parent update method for movement
        super.update(time, delta, playerX, playerY);
        
        // Add random speed changes for rotation
        if (this.sprite && this.sprite.active) {
            // Change rotation speed every 0.8 seconds
            if (time - this.lastSpeedChangeTime > 800) {
                this.rotationSpeed = Phaser.Math.FloatBetween(0.01, 0.05) * 
                                    (Math.random() > 0.5 ? 1 : -1);
                this.lastSpeedChangeTime = time;
            }
            
            this.sprite.rotation += this.rotationSpeed;
        }
    }
}