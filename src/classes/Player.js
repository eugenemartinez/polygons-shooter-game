export class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        this.hp = 100;
        this.score = 0;
        this.speed = 200;
        this.graphics = scene.add.triangle(x, y, 0, 0, -15, 30, 15, 30, 0x00ffff);
        this.scene.physics.add.existing(this.graphics);
        this.graphics.body.setCollideWorldBounds(true);
    }

    update(cursors) {
        this.graphics.body.setVelocity(0);
        if (cursors.left.isDown) this.graphics.body.setVelocityX(-this.speed);
        if (cursors.right.isDown) this.graphics.body.setVelocityX(this.speed);
        if (cursors.up.isDown) this.graphics.body.setVelocityY(-this.speed);
        if (cursors.down.isDown) this.graphics.body.setVelocityY(this.speed);
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 100;
            this.score = 0;
            this.scene.scene.restart();
        }
    }

    shootBullet() {
        if (!this.input.activePointer) return;
        
        // Create a triangle bullet that resembles the player's shape
        let bullet = this.add.triangle(this.player.x, this.player.y, 0, 0, -15, 30, 15, 30, 0x00ffff); // Yellow bullet
        this.physics.add.existing(bullet);
        this.bullets.add(bullet);
        
        let pointer = this.input.activePointer;
        let angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.x, pointer.y);
        let speed = 400;
        
        bullet.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    }

    updateHPText() {
        this.scene.hpText.setText(`HP: ${this.hp}`);
    }

    updateScoreText() {
        this.scene.scoreText.setText(`Score: ${this.score}`);
    }
}