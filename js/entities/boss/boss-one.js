import BaseBoss from './base-boss.js';

export default class BossOne extends BaseBoss {
    constructor(scene, x, y, sides) {
        super(scene, x, y, sides, 10, 5); // 10 HP, deals 5 damage
        this.score = 100; // 100 points for defeating BossOne
    }
}