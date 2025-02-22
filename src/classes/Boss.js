import { AutoShooterGame } from "./Game.js";
import { Enemy } from "./Enemy.js";

export class Boss {
    constructor(scene, x, y, sides, speed, hp) {
        this.scene = scene;
        this.sides = sides;
        this.hp = hp;
        this.initialHp = hp; // Store the initial HP for score calculation
        this.speed = speed;

        console.log(`Boss HP initialized: ${this.hp}`);  // Debug log for HP

        // Boss colors based on shape
        let color;
        if (sides === 4) color = 0x0000ff; // Blue for squares
        else if (sides === 5) color = 0x00ff00; // Green for pentagons
        else if (sides === 6) color = 0xffff00; // Yellow for hexagons
        else if (sides === 7) color = 0xff8800; // Orange for heptagons
        else color = 0xff0000; // Red for octagons

        // Create boss polygon
        this.graphics = scene.add.polygon(x, y, Boss.getPolygonPoints(sides), color);
        scene.physics.world.enable(this.graphics);

        this.body = this.graphics.body;
        this.body.setCollideWorldBounds(true);

        this.scene.bossObjects.push(this);
    }

    update() {
        if (this.scene.player) {
            this.scene.physics.moveTo(this.graphics, this.scene.player.x, this.scene.player.y, this.speed);
        }
    }

    takeDamage(damage) {
        this.hp -= damage;
        console.log(`Boss HP after damage: ${this.hp}`);  // Debug log for HP after damage
        if (this.hp <= 0) {
            this.destroy();
        }
    }

    destroy() {
        // Award score equal to the original HP
        let scoreForBoss = this.initialHp;
        console.log(`Boss destroyed! Initial HP: ${this.initialHp}, Awarding: ${scoreForBoss} points.`); // Debug log

        // Update score
        this.scene.score += scoreForBoss;
        this.scene.scoreText.setText(`Score: ${this.scene.score}`);
        console.log(`Score updated: ${this.scene.score}`);  // Debug log for score update

        // Destroy the boss object from scene
        this.scene.bossObjects = this.scene.bossObjects.filter(b => b !== this);
        this.scene.bosses.remove(this.graphics, true, true); // Remove from physics world
        this.graphics.destroy(); // Remove from scene
    }

    static getPolygonPoints(sides) {
        let points = [];
        for (let i = 0; i < sides; i++) {
            let angle = (i * 2 * Math.PI) / sides;
            points.push(30 * Math.cos(angle), 30 * Math.sin(angle)); // Boss is slightly bigger
        }
        return points;
    }
}