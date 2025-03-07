/**
 * BaseBoss class for Polygons Survivor game
 * Bosses are larger polygon shapes with higher health
 */
export default class BaseBoss {
    constructor(scene, x, y, sides, health, damage) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.sides = sides;
        this.health = health;
        this.damage = damage;
        this.score = 100; // Default score, will be overridden by subclasses
        
        // Boss stats based on shape complexity
        this.size = 30 + (sides - 3) * 3; // Bosses are larger than regular enemies
        
        // Bosses are slower than regular enemies but still challenging
        this.speed = 70 - (sides - 3) * 10; // Speed decreases with more sides
        
        this.color = this.getColorForSides(sides);
        
        // Set max health
        this.maxHealth = this.health;
        
        // Create the boss shape
        this.createBossGraphics();
        
        // Enable physics
        this.scene.physics.world.enable(this.sprite);
        
        // Set the physics body to be a circle for better collision
        this.sprite.body.setCircle(this.size);
        this.sprite.body.offset.x = this.sprite.body.offset.y = -this.size;
        
        // Store reference to this boss in the sprite for collision handling
        this.sprite.parentBoss = this;
    }
    
    getColorForSides(sides) {
        // Different colors for each shape - bosses have more vibrant/saturated colors
        const colors = {
            3: 0xff0000, // Triangle: bright red
            4: 0x00ff00, // Square: bright green
            5: 0x0000ff, // Pentagon: bright blue
            6: 0xffff00, // Hexagon: bright yellow
            7: 0xff00ff, // Heptagon: bright magenta
            8: 0x00ffff  // Octagon: bright cyan
        };
        return colors[sides] || 0xffffff;
    }
    
    createBossGraphics() {
        // Create graphics object for the boss
        if (this.sprite) {
            this.sprite.destroy();
        }
        
        this.sprite = this.scene.add.graphics();
        
        // Draw the polygon shape
        this.sprite.clear();
        this.sprite.fillStyle(this.color, 1);
        this.sprite.lineStyle(3, 0x000000, 1); // Thicker border for bosses
        
        // Generate polygon points centered at (0,0)
        const points = this.generatePolygonPoints(0, 0, this.size, this.sides);
        this.sprite.fillPoints(points, true);
        this.sprite.strokePoints(points, true);
        
        // Set the position of the graphics object
        this.sprite.x = this.x;
        this.sprite.y = this.y;
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
    
    update(time, delta, playerX, playerY) {
        if (!this.sprite.active) return;
        
        // Move towards the player
        const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, playerX, playerY);
        
        this.sprite.body.velocity.x = Math.cos(angle) * this.speed;
        this.sprite.body.velocity.y = Math.sin(angle) * this.speed;
        
        // Update internal position
        this.x = this.sprite.x;
        this.y = this.sprite.y;
    }
    
    takeDamage(amount) {
        this.health -= amount;
        
        // Visual feedback
        this.sprite.clear();
        this.sprite.fillStyle(this.color, 0.7); // Lower opacity when damaged
        this.sprite.lineStyle(3, 0x000000, 1);
        
        const points = this.generatePolygonPoints(0, 0, this.size, this.sides);
        this.sprite.fillPoints(points, true);
        this.sprite.strokePoints(points, true);
        
        // Flash effect
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            onComplete: () => {
                if (this.sprite && this.sprite.active) {
                    this.sprite.alpha = 1;
                    
                    // Restore normal appearance
                    this.sprite.clear();
                    this.sprite.fillStyle(this.color, 1);
                    this.sprite.lineStyle(3, 0x000000, 1);
                    this.sprite.fillPoints(points, true);
                    this.sprite.strokePoints(points, true);
                }
            }
        });
        
        // Check if the boss is defeated
        if (this.health <= 0) {
            this.die();
            return true; // Indicate that the boss was defeated
        }
        
        return false; // Boss is still alive
    }
    
    die() {
        if (!this.sprite || !this.sprite.active) return;
        
        // Visual explosion effect
        for (let i = 0; i < 20; i++) {
            const particle = this.scene.add.graphics();
            particle.fillStyle(this.color, 1);
            
            // Random size for particles
            const particleSize = Phaser.Math.Between(3, 8);
            particle.fillCircle(0, 0, particleSize);
            
            // Set position to boss position
            particle.x = this.sprite.x;
            particle.y = this.sprite.y;
            
            // Random velocity
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const speed = Phaser.Math.FloatBetween(50, 200);
            
            // Animate the particle
            this.scene.tweens.add({
                targets: particle,
                x: particle.x + Math.cos(angle) * speed,
                y: particle.y + Math.sin(angle) * speed,
                alpha: 0,
                scale: 0.5,
                duration: 1000,
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
        
        // Remove the boss
        this.sprite.destroy();
    }
}