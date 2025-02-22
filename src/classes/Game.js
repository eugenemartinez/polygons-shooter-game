
import { Enemy } from "./Enemy.js";
import { Boss } from "./Boss.js";

export class AutoShooterGame extends Phaser.Scene {
    constructor() {
        super("AutoShooterGame");
        this.invincible = false; // Prevents instant multiple hits
    }

    create() {
        this.cameras.main.setBackgroundColor("#1a1a3d"); // Dark blue background
    
        this.player = this.add.triangle(window.innerWidth / 2, window.innerHeight / 2, 0, 0, -15, 30, 15, 30, 0x00ffff);
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);
    
        this.cursors = this.input.keyboard.addKeys({
            up: "W", down: "S", left: "A", right: "D"
        });
    
        this.enemies = this.physics.add.group();
        this.enemyObjects = [];
        this.bullets = this.physics.add.group();
    
        this.spawnLevel = 0; // Controls difficulty progression
    
        this.time.addEvent({ delay: 1000, callback: this.spawnEnemy, callbackScope: this, loop: true });
        this.time.addEvent({ delay: 300, callback: this.shootBullet, callbackScope: this, loop: true });
    
        // Increase difficulty every 30 seconds
        this.time.addEvent({ delay: 30000, callback: this.increaseDifficulty, callbackScope: this, loop: true });
    
        this.hp = 100;
        this.score = 0; // Starting score
        this.difficulty = 1; // Starting difficulty
        console.log(`Initial Difficulty Level: ${this.difficulty}`);
    
        this.hpText = this.add.text(10, 10, `HP: ${this.hp}`, { fontSize: '20px', fill: '#fff' });
        this.scoreText = this.add.text(10, 40, `Score: ${this.score}`, { fontSize: '20px', fill: '#fff' });
    
        this.physics.add.overlap(this.enemies, this.bullets, this.damageEnemy, null, this);
    
        this.bosses = this.physics.add.group();
        this.bossObjects = [];
    
        // **Boss overlap detection**
        this.physics.add.overlap(this.bosses, this.bullets, this.damageBoss, null, this);
    
        // Boss spawns every 30 seconds
        this.time.addEvent({ delay: 30000, callback: this.spawnBoss, callbackScope: this, loop: true });
    
        // Resize listener for full-screen adaptation
        window.addEventListener("resize", () => {
            this.scale.resize(window.innerWidth, window.innerHeight);
        });
    }

    update() {
        this.player.body.setVelocity(0);
        if (this.cursors.left.isDown) this.player.body.setVelocityX(-200);
        if (this.cursors.right.isDown) this.player.body.setVelocityX(200);
        if (this.cursors.up.isDown) this.player.body.setVelocityY(-200);
        if (this.cursors.down.isDown) this.player.body.setVelocityY(200);
    
        // Update all enemy objects
        this.enemyObjects.forEach(enemy => enemy.update());
    
        // 🔥 Add this line to update boss movement 🔥
        this.bossObjects.forEach(boss => boss.update());
    }

    spawnEnemy() {
        let screenWidth = window.innerWidth;
        let screenHeight = window.innerHeight;
        let borderSide = Phaser.Math.Between(0, 3);
        let x, y;
    
        if (borderSide === 0) {        // Top
            x = Phaser.Math.Between(0, screenWidth);
            y = 0;
        } else if (borderSide === 1) { // Bottom
            x = Phaser.Math.Between(0, screenWidth);
            y = screenHeight;
        } else if (borderSide === 2) { // Left
            x = 0;
            y = Phaser.Math.Between(0, screenHeight);
        } else {                       // Right
            x = screenWidth;
            y = Phaser.Math.Between(0, screenHeight);
        }
    
        let enemyTypes = [];
    
        if (this.spawnLevel >= 0) enemyTypes.push(4); // Squares
        if (this.spawnLevel >= 1) enemyTypes.push(5); // Pentagons
        if (this.spawnLevel >= 2) enemyTypes.push(6); // Hexagons
        if (this.spawnLevel >= 3) enemyTypes.push(7); // Heptagons
        if (this.spawnLevel >= 4) enemyTypes.push(8); // Octagons (Highest difficulty)
    
        let sides = Phaser.Utils.Array.GetRandom(enemyTypes); // Pick a random available enemy type
        let hp = sides - 3;
        let speed = 50 + (sides - 4) * 10;
    
        let enemy = new Enemy(this, x, y, sides, speed, hp);
        this.enemies.add(enemy.graphics);
        this.enemyObjects.push(enemy);
    }

    spawnBoss() {
        console.log("Spawning Boss...");
        
        let screenWidth = window.innerWidth;
        let screenHeight = window.innerHeight;
        let borderSide = Phaser.Math.Between(0, 3);
        let x, y;
    
        if (borderSide === 0) {        
            x = Phaser.Math.Between(0, screenWidth);
            y = 0;
        } else if (borderSide === 1) { 
            x = Phaser.Math.Between(0, screenWidth);
            y = screenHeight;
        } else if (borderSide === 2) { 
            x = 0;
            y = Phaser.Math.Between(0, screenHeight);
        } else {                       
            x = screenWidth;
            y = Phaser.Math.Between(0, screenHeight);
        }
    
        let sides = this.bosses.countActive() === 0 ? 4 : Math.min(4 + this.spawnLevel, 8);        
        let hp = 20 + (sides - 4);
        let speed = 30 + (sides - 4) * 5;  
    
        console.log(`Boss Sides: ${sides}, Boss HP: ${hp}`); // ✅ Check HP value before spawning
    
        let boss = new Boss(this, x, y, sides, speed, hp);
        this.bosses.add(boss.graphics);
    }

    shootBullet() {
        if (!this.input.activePointer) return;
    
        let bullet = this.add.circle(this.player.x, this.player.y, 5, 0xffcc00); // Yellow bullet
        this.physics.add.existing(bullet);
        this.bullets.add(bullet);
    
        let pointer = this.input.activePointer;
        let angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.x, pointer.y);
        let speed = 400;
    
        bullet.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    }

    damageEnemy(enemy, bullet) {
        bullet.destroy(); // Destroy the bullet immediately
    
        let enemyInstance = this.enemyObjects.find(e => e.graphics === enemy);
        if (enemyInstance) {
            enemyInstance.hp--; // Reduce HP
            if (enemyInstance.hp <= 0) {
                this.removeEnemy(enemyInstance);
            }
        }
    }

    damageBoss(bossGraphics, bullet) {
        console.log("Bullet hit boss!"); // Check if it's triggered
        if (!bossGraphics || !bullet) return;
    
        const boss = this.bossObjects.find(b => b.graphics === bossGraphics);
        if (boss) {
            boss.takeDamage(1); 
            console.log(`Boss HP after hit: ${boss.hp}`);
            bullet.destroy(); 
        }
    }

    takeDamage(player, enemy) {
        this.hp -= 10;
        this.hpText.setText(`HP: ${this.hp}`);
        enemy.destroy();
    
        if (this.hp <= 0) {
            this.hp = 100;  // Reset HP
            this.score = 0; // Reset Score
            this.scene.restart();
        }
    }

    removeEnemy(enemyInstance) {
        if (!enemyInstance || !enemyInstance.graphics) return;
    
        // Remove the enemy from the physics world and scene
        this.enemies.remove(enemyInstance.graphics, true, true);
        enemyInstance.graphics.destroy();
    
        // Remove from tracking array
        this.enemyObjects = this.enemyObjects.filter(e => e !== enemyInstance);
    
        // Calculate the points based on difficulty and the enemy's shape
        let points = enemyInstance.sides - 3;  // Award points based on sides
        points *= this.difficulty;  // Scale by the current difficulty level
        
        // Add the points to the score
        this.score += points;
        this.scoreText.setText(`Score: ${this.score}`);
    }

    increaseDifficulty() {
        if (this.spawnLevel < 4) { // Assuming max difficulty level is 4
            this.spawnLevel++;
            this.scene.difficulty = this.spawnLevel;  // Set scene.difficulty to spawnLevel
            console.log(`Difficulty increased! Spawn Level: ${this.spawnLevel}, Difficulty: ${this.scene.difficulty}`);
        }
    }
}