import BaseBoss from './base-boss.js';

export default class BossTwo extends BaseBoss {
    constructor(scene, x, y, sides) {
        super(scene, x, y, sides, 12, 6); // 12 HP, deals 6 damage
        this.score = 150; // 150 points for defeating BossTwo
    }    
}