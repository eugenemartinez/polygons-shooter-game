import BaseBoss from './base-boss.js';

export default class BossFour extends BaseBoss {
    constructor(scene, x, y, sides) {
        super(scene, x, y, sides, 16, 8); // 16 HP, deals 8 damage
        this.score = 225; // 225 points for defeating BossFour
    }
}