import BaseEnemy from './base-enemy.js';

export default class EnemyFive extends BaseEnemy {
    constructor(scene, x, y, sides) {
        super(scene, x, y, sides, 5, 7); // Difficulty 5, deals 7 HP damage
        this.score = 50; // 50 points for defeating EnemyFive
    }
}