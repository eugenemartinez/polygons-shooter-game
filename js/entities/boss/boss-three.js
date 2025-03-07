import BaseBoss from './base-boss.js';

export default class BossThree extends BaseBoss {
    constructor(scene, x, y, sides) {
        super(scene, x, y, sides, 14, 7); // 14 HP, deals 7 damage
        this.score = 200; // 200 points for defeating BossThree
    }    

}