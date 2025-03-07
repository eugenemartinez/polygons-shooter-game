import BaseBoss from './base-boss.js';

export default class BossThree extends BaseBoss {
    constructor(scene, x, y, sides) {
        super(scene, x, y, sides, 14, 7); // 14 HP, deals 7 damage
        this.score = 200; // 200 points for defeating BossThree
        this.rotationSpeed = 0.02; // Base rotation speed
        this.lastDirectionChange = 0;
    }
    
    update(time, delta, playerX, playerY) {
        // Call parent update for base behavior
        super.update(time, delta, playerX, playerY);
        
        // Add rotation with bursts of speed
        if (this.sprite && this.sprite.active) {
            // Initialize burst properties if not set
            if (!this.burstPhase) {
                this.burstPhase = 0;
                this.inBurst = false;
                this.burstTime = 0;
            }
            
            // Every 3 seconds, do a burst of fast rotation
            if (time - this.burstTime > 3000) {
                this.inBurst = true;
                this.burstTime = time;
            }
            
            // Burst lasts for 0.5 seconds
            if (this.inBurst && time - this.burstTime > 500) {
                this.inBurst = false;
            }
            
            // Apply rotation with burst multiplier
            const burstMultiplier = this.inBurst ? 3 : 1;
            this.sprite.rotation += this.rotationSpeed * burstMultiplier;
        }
    }
}