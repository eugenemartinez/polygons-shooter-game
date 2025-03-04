import BaseEnemy from './base-enemy.js';

export default class EnemyFour extends BaseEnemy {
    constructor(scene, x, y, sides) {
        super(scene, x, y, sides, 4, 6); // Difficulty 4, deals 6 HP damage
        this.score = 40; // 40 points for defeating EnemyFour
    }
}