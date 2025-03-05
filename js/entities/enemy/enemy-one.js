import BaseEnemy from './base-enemy.js';

export default class EnemyOne extends BaseEnemy {
    constructor(scene, x, y, sides) {
        super(scene, x, y, sides, 1, 3); // Difficulty 1, deals 3 HP damage
        this.score = 10; // 10 points for defeating EnemyOne
    }
}