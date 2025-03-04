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
    
    // Add this new method to constrain the player within the game bounds
    constrainPlayerToWorld() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Create a safe margin using the player's size
        const margin = this.size;
        
        // Constrain X position
        if (this.sprite.x < margin) {
            this.sprite.x = margin;
            this.sprite.body.velocity.x = 0;
        } else if (this.sprite.x > width - margin) {
            this.sprite.x = width - margin;
            this.sprite.body.velocity.x = 0;
        }
        
        // Constrain Y position
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
            // Check if we're on a tablet or smaller screen (adjusted threshold)
            const isTabletOrMobile = this.scene.scale.width < 1024; // Updated threshold
            
            if (isTabletOrMobile) {
                this.shootWithAutoAim();
            } else {
                this.shoot(); // Regular shooting for larger screens
            }
            this.lastFired = time;
        }
    }

    shootWithAutoAim() {
        // Find the nearest enemy to target
        const target = this.findNearestTarget();
        
        if (target) {
            // Calculate angle to target
            const angle = Phaser.Math.Angle.Between(
                this.x, 
                this.y, 
                target.x, 
                target.y
            );
            
            // Create and fire the bullet
            const bullet = this.createBullet();
            if (bullet) {
                const velocityX = Math.cos(angle) * this.bulletSpeed;
                const velocityY = Math.sin(angle) * this.bulletSpeed;
                
                bullet.body.setVelocity(velocityX, velocityY);
                bullet.rotation = angle + Math.PI/2;
            }
        } else {
            // If no targets, shoot forward or in the last known direction
            this.shootInDirection(0); // Default direction (right)
        }
    }

    findNearestTarget() {
        let nearestDistance = Infinity;
        let nearestTarget = null;
        
        // Check enemies first
        if (this.scene.enemyManager && this.scene.enemyManager.enemies) {
            for (const enemy of this.scene.enemyManager.enemies) {
                if (enemy.sprite && enemy.sprite.active) {
                    const distance = Phaser.Math.Distance.Between(
                        this.x, this.y, enemy.x, enemy.y
                    );
                    
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestTarget = { x: enemy.x, y: enemy.y };
                    }
                }
            }
        }
        
        // Then check bosses
        if (this.scene.bossManager && this.scene.bossManager.bosses) {
            for (const boss of this.scene.bossManager.bosses) {
                if (boss.sprite && boss.sprite.active) {
                    const distance = Phaser.Math.Distance.Between(
                        this.x, this.y, boss.x, boss.y
                    );
                    
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
        
        const angle = Phaser.Math.Angle.Between(
            this.x, 
            this.y, 
            pointer.worldX, 
            pointer.worldY
        );
        
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
    
    // Fix the takeDamage method to properly respect invincibility
    takeDamage(amount) {
        // Strict check for invincibility - if true, no damage
        if (this.isInvincible === true) {
            // Visual feedback that damage was blocked
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
        
        // Call handleGameOver method from the scene
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
    
    // Simplified setInvincible method
    setInvincible(value) {
        // Set the flag directly - simpler and less error prone
        this.isInvincible = Boolean(value);
        
        // Apply visual effects based on state
        if (this.isInvincible) {
            // Stop any existing pulse first
            if (this.invinciblePulse) {
                this.invinciblePulse.stop();
            }
            
            // Much more visible effect
            this.invinciblePulse = this.scene.tweens.add({
                targets: this.sprite,
                alpha: { from: 1, to: 0.3 },
                duration: 200,
                yoyo: true,
                repeat: -1
            });
            
            // Bright yellow outline
            this.sprite.lineStyle(4, 0xffff00, 1);
        } else {
            // Clear the pulsing effect
            if (this.invinciblePulse) {
                this.invinciblePulse.stop();
                this.sprite.alpha = 1;
            }
            
            // Restore original line style
            this.sprite.lineStyle(2, 0xffffff, 1);
        }
        
        // Re-render with updated style
        const points = this.generatePolygonPoints(0, 0, this.size, this.sides);
        this.sprite.clear();
        this.sprite.fillStyle(this.color, 1);
        this.sprite.fillPoints(points, true);
        this.sprite.strokePoints(points, true);
    }
    
    // Helper methods for gameplay
    enableInvincibility() {
        this.setInvincible(true);
    }
    
    disableInvincibility() {
        this.setInvincible(false);
    }
    
    // Method to enable temporary invincibility
    temporaryInvincibility(duration) {
        this.setInvincible(true);
        
        // Set a timer to disable invincibility after duration
        this.scene.time.delayedCall(duration, () => {
            this.setInvincible(false);
        });
    }

    // Add this method to handle joystick input
    handleJoystickMovement(movement) {
        // Store joystick movement for use in the update method
        this.joystickInput = movement;
    }

    // Update the handleMovement method to use joystick input when available
    handleMovement() {
        // Get input from keyboard or joystick
        let dx = 0;
        let dy = 0;
        
        // Check if we have joystick input
        if (this.joystickInput) {
            dx = this.joystickInput.x;
            dy = this.joystickInput.y;
        } else {
            // Use keyboard input
            const cursors = this.scene.cursors;
            const wasd = this.scene.wasd;
            
            // Handle left/right
            if (cursors.left.isDown || wasd.left.isDown) {
                dx = -1;
            } else if (cursors.right.isDown || wasd.right.isDown) {
                dx = 1;
            }
            
            // Handle up/down
            if (cursors.up.isDown || wasd.up.isDown) {
                dy = -1;
            } else if (cursors.down.isDown || wasd.down.isDown) {
                dy = 1;
            }
        }
        
        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;
        }
        
        // Apply movement
        this.sprite.body.setVelocity(dx * this.speed, dy * this.speed);
    }
}