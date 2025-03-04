import BaseBoss from './base-boss.js';

export default class BossTwo extends BaseBoss {
    constructor(scene, x, y, sides) {
        super(scene, x, y, sides, 12, 6); // 12 HP, deals 6 damage
        this.score = 150; // 150 points for defeating BossTwo
    }
    
    performSpecialAttack(time, playerX, playerY) {
        // Boss Two's special attack - summon minions
        const spawnPositions = [
            { x: this.sprite.x + 50, y: this.sprite.y },
            { x: this.sprite.x - 50, y: this.sprite.y }
        ];
        
        // Emit an event that the boss manager can listen to for spawning minions
        this.scene.events.emit('bossSummonMinions', spawnPositions, this.sides);
    }
}