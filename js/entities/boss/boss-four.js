import BaseBoss from './base-boss.js';

export default class BossFour extends BaseBoss {
    constructor(scene, x, y, sides) {
        super(scene, x, y, sides, 16, 8); // 16 HP, deals 8 damage
        this.score = 225; // 225 points for defeating BossFour
        
        // BossFour is temporarily invulnerable after taking damage
        this.invulnerable = false;
        this.invulnerabilityTime = 1500; // 1.5 seconds of invulnerability
        this.lastDamageTime = 0;
    }
    
    update(time, delta, playerX, playerY) {
        super.update(time, delta, playerX, playerY);
        
        // Check if invulnerability should end
        if (this.invulnerable && time - this.lastDamageTime > this.invulnerabilityTime) {
            this.invulnerable = false;
            
            // Visual indication of invulnerability ending
            if (this.sprite && this.sprite.active) {
                this.sprite.alpha = 1;
            }
        }
    }
    
    takeDamage(amount) {
        // Check for invulnerability
        if (this.invulnerable) {
            return false;
        }
        
        const isDead = super.takeDamage(amount);
        
        if (!isDead) {
            // Become invulnerable after taking damage
            this.invulnerable = true;
            this.lastDamageTime = this.scene.time.now;
            
            // Visual indication of invulnerability
            if (this.sprite && this.sprite.active) {
                this.sprite.alpha = 0.7;
            }
        }
        
        return isDead;
    }
    
    performSpecialAttack(time, playerX, playerY) {
        // Boss Four's special attack - become temporarily invulnerable and chase player
        this.invulnerable = true;
        this.lastDamageTime = time;
        
        // Speed boost during special attack
        const originalSpeed = this.speed;
        this.speed *= 1.5;
        
        // Reset after 3 seconds
        this.scene.time.delayedCall(3000, () => {
            if (this.sprite && this.sprite.active) {
                this.speed = originalSpeed;
                this.invulnerable = false;
                this.sprite.alpha = 1;
            }
        });
    }
}