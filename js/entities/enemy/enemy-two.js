import BaseEnemy from './base-enemy.js';

export default class EnemyTwo extends BaseEnemy {
    constructor(scene, x, y, sides) {
        super(scene, x, y, sides, 2, 4); // Difficulty 2, deals 4 HP damage
        this.score = 20; // 20 points for defeating EnemyTwo
    }
}