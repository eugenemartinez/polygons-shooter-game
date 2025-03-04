import BaseBoss from './base-boss.js';

export default class BossThree extends BaseBoss {
    constructor(scene, x, y, sides) {
        super(scene, x, y, sides, 14, 7); // 14 HP, deals 7 damage
        this.score = 200; // 200 points for defeating BossThree
    }
    
    performSpecialAttack(time, playerX, playerY) {
        // Boss Three's special attack - bullet spray
        const bullets = 8;
        const angleStep = (Math.PI * 2) / bullets;
        
        for (let i = 0; i < bullets; i++) {
            const angle = i * angleStep;
            
            // Emit an event that the boss manager can listen to for creating bullets
            this.scene.events.emit('bossFireBullet', this.sprite.x, this.sprite.y, angle, 150);
        }
    }
}