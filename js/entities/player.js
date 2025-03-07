/**
 * Player class for the Polygons Survivor game
 * Handles player movement, shape rendering, and shooting
 */
export default class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        
        // Random shape between triangle (3) and octagon (8)
        this.sides = Phaser.Math.Between(3, 8);
        
        // Base player stats
        this.baseSpeed = 160;
        this.baseHealth = 100; // Set base health to 3 for testing
        this.baseBulletSpeed = 300;
        this.fixedFireRate = 500; // Set a fixed fire rate
        
        // Calculate stats based on shape complexity
        this.calculateStats();
        
        this.size = 15; // Base size of player shape
        this.color = 0x00aaff; // Cyan blue color
        
        // Shooting properties
        this.bulletSize = this.size * 0.4; // Reduced to 40% of player size
        this.lastFired = 0;
        
        // Create the player shape
        this.createPlayerGraphics();
        
        // Enable physics
        this.scene.physics.world.enable(this.sprite);
        
        // Set the physics body to be a circle for better collision
        this.sprite.body.setCircle(this.size);
        
        // Position correction for the physics body if needed
        this.sprite.body.offset.x = this.sprite.body.offset.y = -this.size;
        
        // Create bullet group
        this.bullets = this.scene.physics.add.group({
            maxSize: 30,
            runChildUpdate: true
        });
        
        // Damage cooldown
        this.damageCooldown = 500; // 500 ms cooldown
        this.lastDamageTime = 0;
        
        // Add invincibility status
        this.isInvincible = false;
    }
    
    calculateStats() {
        const shapeFactor = (this.sides - 3) / 5; // 0.0 for triangle, 1.0 for octagon
        
        this.maxHealth = 100; // Set max health to 3 for testing
        this.health = this.maxHealth;
        
        this.speed = this.baseSpeed - Math.floor(shapeFactor * 40);
        
        this.bulletSpeed = this.baseBulletSpeed + Math.floor(shapeFactor * 100);
        
        this.fireRate = this.fixedFireRate; // Use the fixed fire rate
    }
    
    createPlayerGraphics() {
        if (this.sprite) {
            this.sprite.destroy();
        }
        
        this.sprite = this.scene.add.graphics();
        
        this.sprite.clear();
        this.sprite.fillStyle(this.color, 1);
        this.sprite.lineStyle(2, 0xffffff, 1);
        
        const points = this.generatePolygonPoints(0, 0, this.size, this.sides);
        this.sprite.fillPoints(points, true);
        this.sprite.strokePoints(points, true);
        
        this.sprite.x = this.x;
        this.sprite.y = this.y;
        
        this.sprite.parentPlayer = this;
    }
    
    generatePolygonPoints(centerX, centerY, size, sides) {
        const points = [];
        const angleStep = (Math.PI * 2) / sides;
        
        for (let i = 0; i < sides; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const x = centerX + size * Math.cos(angle);
            const y = centerY + size * Math.sin(angle);
            points.push(new Phaser.Geom.Point(x, y));
        }
        
        return points;
    }
    
    update(time, delta) {
        if (!this.sprite.active) return;
        
        this.handleMovement();
        
        // Apply world bounds to keep the player inside the game area
        this.constrainPlayerToWorld();
        
        this.x = this.sprite.x;
        this.y = this.sprite.y;
        
        this.handleShooting(time);
    }
    
    constrainPlayerToWorld() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        const margin = this.size;
        
        if (this.sprite.x < margin) {
            this.sprite.x = margin;
            this.sprite.body.velocity.x = 0;
        } else if (this.sprite.x > width - margin) {
            this.sprite.x = width - margin;
            this.sprite.body.velocity.x = 0;
        }
        
        if (this.sprite.y < margin) {
            this.sprite.y = margin;
            this.sprite.body.velocity.y = 0;
        } else if (this.sprite.y > height - margin) {
            this.sprite.y = height - margin;
            this.sprite.body.velocity.y = 0;
        }
    }
    
    handleShooting(time) {
        if (time > this.lastFired + this.fireRate) {
            const isTabletOrMobile = this.scene.scale.width < 1024;
            
            if (isTabletOrMobile) {
                this.shootWithAutoAim();
            } else {
                this.shoot();
            }
            this.lastFired = time;
        }
    }

    shootWithAutoAim() {
        const target = this.findNearestTarget();
        
        if (target) {
            const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
            
            const bullet = this.createBullet();
            if (bullet) {
                const velocityX = Math.cos(angle) * this.bulletSpeed;
                const velocityY = Math.sin(angle) * this.bulletSpeed;
                
                bullet.body.setVelocity(velocityX, velocityY);
                bullet.rotation = angle + Math.PI/2;
            }
        } else {
            this.shootInDirection(0);
        }
    }

    findNearestTarget() {
        let nearestDistance = Infinity;
        let nearestTarget = null;
        
        if (this.scene.enemyManager && this.scene.enemyManager.enemies) {
            for (const enemy of this.scene.enemyManager.enemies) {
                if (enemy.sprite && enemy.sprite.active) {
                    const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                    
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestTarget = { x: enemy.x, y: enemy.y };
                    }
                }
            }
        }
        
        if (this.scene.bossManager && this.scene.bossManager.bosses) {
            for (const boss of this.scene.bossManager.bosses) {
                if (boss.sprite && boss.sprite.active) {
                    const distance = Phaser.Math.Distance.Between(this.x, this.y, boss.x, boss.y);
                    
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestTarget = { x: boss.x, y: boss.y };
                    }
                }
            }
        }
        
        return nearestTarget;
    }

    shootInDirection(angle) {
        const bullet = this.createBullet();
        if (bullet) {
            const velocityX = Math.cos(angle) * this.bulletSpeed;
            const velocityY = Math.sin(angle) * this.bulletSpeed;
            
            bullet.body.setVelocity(velocityX, velocityY);
            bullet.rotation = angle + Math.PI/2;
        }
    }
    
    shoot() {
        const pointer = this.scene.input.activePointer;
        
        const angle = Phaser.Math.Angle.Between(this.x, this.y, pointer.worldX, pointer.worldY);
        
        const bullet = this.createBullet();
        if (bullet) {
            const velocityX = Math.cos(angle) * this.bulletSpeed;
            const velocityY = Math.sin(angle) * this.bulletSpeed;
            
            bullet.body.setVelocity(velocityX, velocityY);
            bullet.rotation = angle + Math.PI/2;
        }
    }
    
    createBullet() {
        const container = this.scene.add.container(this.x, this.y);
        this.bullets.add(container);
        
        const graphics = this.scene.add.graphics();
        
        graphics.clear();
        graphics.fillStyle(this.color, 1);
        
        const points = this.generatePolygonPoints(0, 0, this.bulletSize, this.sides);
        graphics.fillPoints(points, true);
        
        container.add(graphics);
        
        this.scene.physics.world.enable(container);
        
        container.damage = 1;
        container.lifespan = 2000;
        container.creationTime = this.scene.time.now;
        
        container.body.setCircle(this.bulletSize);
        
        container.update = function() {
            if (this.scene.time.now - this.creationTime > this.lifespan) {
                this.destroy();
            }
        };
        
        return container;
    }
    
    takeDamage(amount) {
        if (this.isInvincible === true) {
            this.scene.tweens.add({
                targets: this.sprite,
                alpha: { from: 1, to: 0.3 },
                duration: 50,
                yoyo: true,
                repeat: 1
            });
            return;
        }
        
        const currentTime = this.scene.time.now;
        if (currentTime - this.lastDamageTime < this.damageCooldown) {
            return;
        }
        
        this.lastDamageTime = currentTime;
        this.health -= amount;
        
        if (this.health <= 0) {
            this.die();
        }
        
        if (this.scene.gameStats) {
            this.scene.gameStats.updateHP(this.health);
        }
        
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
        });
    }
    
    die() {
        this.sprite.visible = false;
        this.sprite.active = false;
        this.sprite.body.enable = false;
        
        const particles = this.scene.add.particles(this.x, this.y, 'particle', {
            speed: { min: 50, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0 },
            blendMode: 'ADD',
            lifespan: 1000,
            gravityY: 0,
            quantity: 20
        });
        
        this.scene.handleGameOver();
    }
    
    upgradeShape() {
        if (this.sides < 8) {
            this.sides++;
            
            this.calculateStats();
            
            this.createPlayerGraphics();
            
            if (this.scene.gameStats) {
                this.scene.gameStats.updateHP(this.health);
            }
            
            return true;
        }
        return false;
    }
    
    setInvincible(value) {
        this.isInvincible = Boolean(value);
        
        if (this.isInvincible) {
            if (this.invinciblePulse) {
                this.invinciblePulse.stop();
            }
            
            this.invinciblePulse = this.scene.tweens.add({
                targets: this.sprite,
                alpha: { from: 1, to: 0.3 },
                duration: 200,
                yoyo: true,
                repeat: -1
            });
            
            this.sprite.lineStyle(4, 0xffff00, 1);
        } else {
            if (this.invinciblePulse) {
                this.invinciblePulse.stop();
                this.sprite.alpha = 1;
            }
            
            this.sprite.lineStyle(2, 0xffffff, 1);
        }
        
        const points = this.generatePolygonPoints(0, 0, this.size, this.sides);
        this.sprite.clear();
        this.sprite.fillStyle(this.color, 1);
        this.sprite.fillPoints(points, true);
        this.sprite.strokePoints(points, true);
    }
    
    enableInvincibility() {
        this.setInvincible(true);
    }
    
    disableInvincibility() {
        this.setInvincible(false);
    }
    
    temporaryInvincibility(duration) {
        this.setInvincible(true);
        
        this.scene.time.delayedCall(duration, () => {
            this.setInvincible(false);
        });
    }

    handleJoystickMovement(movement) {
        this.joystickInput = movement;
    }

    handleMovement() {
        let dx = 0;
        let dy = 0;
        
        if (this.joystickInput) {
            dx = this.joystickInput.x;
            dy = this.joystickInput.y;
        } else {
            const cursors = this.scene.cursors;
            const wasd = this.scene.wasd;
            
            if (cursors.left.isDown || wasd.left.isDown) {
                dx = -1;
            } else if (cursors.right.isDown || wasd.right.isDown) {
                dx = 1;
            }
            
            if (cursors.up.isDown || wasd.up.isDown) {
                dy = -1;
            } else if (cursors.down.isDown || wasd.down.isDown) {
                dy = 1;
            }
        }
        
        if (dx !== 0 && dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;
        }
        
        this.sprite.body.setVelocity(dx * this.speed, dy * this.speed);
    }

    // Methods to apply and remove power-up effects
    applyDoubleDamage() {
        this.bulletDamage *= 2;
    }

    removeDoubleDamage() {
        this.bulletDamage /= 2;
    }

    applyRapidFire() {
        this.fireRate /= 2;
    }

    removeRapidFire() {
        this.fireRate *= 2;
    }

    applyHaste() {
        this.speed *= 1.5;
    }

    removeHaste() {
        this.speed /= 1.5;
    }

    applyShield() {
        this.isInvincible = true;
    }

    removeShield() {
        this.isInvincible = false;
    }
}