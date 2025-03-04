import BaseBoss from './base-boss.js';

export default class BossFive extends BaseBoss {
    constructor(scene, x, y, sides) {
        super(scene, x, y, sides, 20, 10); // 20 HP, deals 10 damage
        this.score = 250; // 250 points for defeating BossFive
        
        // BossFive has phase-based behavior
        this.phase = 1;
        this.phaseThresholds = [0.7, 0.4, 0.2]; // Phase changes at 70%, 40%, and 20% health
    }
    
    update(time, delta, playerX, playerY) {
        super.update(time, delta, playerX, playerY);
        
        // Check for phase transitions
        const healthPercentage = this.health / this.maxHealth;
        
        if (this.phase === 1 && healthPercentage <= this.phaseThresholds[0]) {
            this.phase = 2;
            this.enterPhaseTwo();
        } else if (this.phase === 2 && healthPercentage <= this.phaseThresholds[1]) {
            this.phase = 3;
            this.enterPhaseThree();
        } else if (this.phase === 3 && healthPercentage <= this.phaseThresholds[2]) {
            this.phase = 4;
            this.enterPhaseFour();
        }
    }
    
    enterPhaseTwo() {
        this.speed *= 1.2; // Increase speed by 20%
        this.specialAttackCooldown = 4000; // Reduce cooldown to 4 seconds
    }
    
    enterPhaseThree() {
        this.speed *= 1.2; // Increase speed by another 20%
        this.specialAttackCooldown = 3000; // Reduce cooldown to 3 seconds
    }
    
    enterPhaseFour() {
        this.speed *= 1.3; // Increase speed by another 30%
        this.specialAttackCooldown = 2000; // Reduce cooldown to 2 seconds
        
        // Change color to indicate final phase
        this.color = 0xff0000; // Bright red
        this.createBossGraphics(); // Redraw with new color
    }
    
    performSpecialAttack(time, playerX, playerY) {
        // Boss Five's special attack varies by phase
        switch (this.phase) {
            case 1:
                // Phase 1: Simple bullet spray
                this.bulletSprayAttack(4);
                break;
                
            case 2:
                // Phase 2: Summon minions + bullets
                this.summonMinionsAttack();
                this.bulletSprayAttack(4);
                break;
                
            case 3:
                // Phase 3: Dash + wider bullet spray
                this.dashAttack(playerX, playerY);
                this.bulletSprayAttack(6);
                break;
                
            case 4:
                // Phase 4: All attacks at once
                this.dashAttack(playerX, playerY);
                this.summonMinionsAttack();
                this.bulletSprayAttack(8);
                break;
        }
    }
    
    bulletSprayAttack(bulletCount) {
        const angleStep = (Math.PI * 2) / bulletCount;
        
        for (let i = 0; i < bulletCount; i++) {
            const angle = i * angleStep;
            
            // Emit an event that the boss manager can listen to for creating bullets
            this.scene.events.emit('bossFireBullet', this.sprite.x, this.sprite.y, angle, 150);
        }
    }
    
    summonMinionsAttack() {
        const spawnPositions = [
            { x: this.sprite.x + 50, y: this.sprite.y + 50 },
            { x: this.sprite.x - 50, y: this.sprite.y - 50 }
        ];
        
        // Emit an event that the boss manager can listen to for spawning minions
        this.scene.events.emit('bossSummonMinions', spawnPositions, this.sides);
    }
    
    dashAttack(playerX, playerY) {
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