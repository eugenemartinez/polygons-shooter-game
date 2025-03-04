import BaseBoss from './base-boss.js';

export default class BossOne extends BaseBoss {
    constructor(scene, x, y, sides) {
        super(scene, x, y, sides, 10, 5); // 10 HP, deals 5 damage
        this.score = 100; // 100 points for defeating BossOne
    }
    
    performSpecialAttack(time, playerX, playerY) {
        // Boss One's special attack - dash towards player
        const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, playerX, playerY);
        
        // Temporary speed boost
        const originalSpeed = this.speed;
        this.speed *= 3;
        
        // Reset speed after 0.5 seconds
        this.scene.time.delayedCall(500, () => {
            if (this.sprite && this.sprite.active) {
                this.speed = originalSpeed;
            }
        });
    }
}