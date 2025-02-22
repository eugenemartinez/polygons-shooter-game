class AutoShooterGame extends Phaser.Scene {
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

class Enemy {
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

class Boss {
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

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    physics: { default: "arcade", arcade: { debug: false } },
    scene: AutoShooterGame
};

const game = new Phaser.Game(config);