import BaseEnemy from './base-enemy.js';

export default class EnemyThree extends BaseEnemy {
    constructor(scene, x, y, sides) {
        super(scene, x, y, sides, 3, 5); // Difficulty 3, deals 5 HP damage
        this.score = 30; // 30 points for defeating EnemyThree
    }
}