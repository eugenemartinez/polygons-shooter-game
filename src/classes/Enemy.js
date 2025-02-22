import { Boss } from "./Boss.js";
import { AutoShooterGame } from "./Game.js";

export class Enemy {
    constructor(scene, x, y, sides, speed, hp) {
        this.scene = scene;
        this.sides = sides;
        this.hp = hp;
        this.speed = speed;

        // Color based on difficulty
        let color;
        if (sides === 4) color = 0x3333ff; // Blue (Square)
        else if (sides === 5) color = 0x33ff33; // Green (Pentagon)
        else if (sides === 6) color = 0xffff33; // Yellow (Hexagon)
        else if (sides === 7) color = 0xff8800; // Orange (Heptagon)
        else color = 0xff3333; // Red (Octagon)

        this.graphics = scene.add.polygon(x, y, Enemy.getPolygonPoints(sides), color);
        scene.physics.world.enable(this.graphics);
        this.body = this.graphics.body;
        this.body.setCollideWorldBounds(true);
    }

    update() {
        if (this.scene.player) {
            this.scene.physics.moveTo(this.graphics, this.scene.player.x, this.scene.player.y, this.speed);
        }
    }

    static getPolygonPoints(sides) {
        let points = [];
        for (let i = 0; i < sides; i++) {
            let angle = (i * 2 * Math.PI) / sides;
            points.push(20 * Math.cos(angle), 20 * Math.sin(angle));
        }
        return points;
    }

    destroy() {
        // The points will be based on the number of sides, minus 3 (since 4 sides = 1 point)
        let points = this.sides - 3;
        console.log(`Enemy destroyed! Sides: ${this.sides}, Awarding: ${points} points.`); // ✅ Debug log
        
        this.scene.score += points;
        this.scene.scoreText.setText(`Score: ${this.scene.score}`);
        
        // ✅ Remove from enemies array
        this.scene.enemyObjects = this.scene.enemyObjects.filter(e => e !== this);
            
        // ✅ Remove from physics group
        this.scene.enemies.remove(this.graphics, true, true);
        
        // ✅ Destroy graphics
        this.graphics.destroy();
    }
}