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
        // Create a bullet at the player's current position
        let bullet = this.add.sprite(this.player.x, this.player.y, 'bullet'); // or your custom bullet shape
        this.physics.add.existing(bullet);
        bullet.body.setVelocity(0, -500); // Adjust velocity as needed
        this.bullets.add(bullet);
    }

    updateHPText() {
        this.scene.hpText.setText(`HP: ${this.hp}`);
    }

    updateScoreText() {
        this.scene.scoreText.setText(`Score: ${this.score}`);
    }
}