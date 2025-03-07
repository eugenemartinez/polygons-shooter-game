import BaseBoss from './base-boss.js';

export default class BossFive extends BaseBoss {
    constructor(scene, x, y, sides) {
        super(scene, x, y, sides, 20, 10); // 20 HP, deals 10 damage
        this.score = 250; // 250 points for defeating BossFive
    }
}