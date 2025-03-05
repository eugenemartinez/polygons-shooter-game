/**
 * BaseEnemy class for Polygons Survivor game
 * Enemies are polygon shapes that chase the player
 */
export default class BaseEnemy {
    constructor(scene, x, y, sides, health, damage) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.sides = sides;
        this.health = health; // Use directly, without modification
        this.damage = damage; // Use directly, without modification
        this.score = 0; // Default score, can be overridden by subclasses
        
        // Enemy stats based on shape complexity
        this.size = 15 + (sides - 3) * 2; // Size increases with more sides
        
        // Increased base speed with steeper reduction for higher levels
        // Starting at 120 (was 80) and decreasing by 15 (was 10) per side
        this.speed = 120 - (sides - 3) * 15; // Speed decreases with more sides
        
        this.color = this.getColorForSides(sides);
        
        // Set max health
        this.maxHealth = this.health;
        
        // Create the enemy shape
        this.createEnemyGraphics();
        
        // Enable physics
        this.scene.physics.world.enable(this.sprite);
        
        // Set the physics body to be a circle for better collision
        this.sprite.body.setCircle(this.size);
        this.sprite.body.offset.x = this.sprite.body.offset.y = -this.size;
        
        // Store reference to this enemy in the sprite for collision handling
        this.sprite.parentEnemy = this;
    }
    
    getColorForSides(sides) {
        // Different colors for each shape
        const colors = {
            3: 0xff4444, // Triangle: red
            4: 0x44ff44, // Square: green
            5: 0x4444ff, // Pentagon: blue
            6: 0xffff44, // Hexagon: yellow
            7: 0xff44ff, // Heptagon: magenta
            8: 0x44ffff  // Octagon: cyan
        };
        return colors[sides] || 0xffffff;
    }
    
    createEnemyGraphics() {
        // Create graphics object for the enemy
        if (this.sprite) {
            this.sprite.destroy();
        }
        
        this.sprite = this.scene.add.graphics();
        
        // Draw the polygon shape
        this.sprite.clear();
        this.sprite.fillStyle(this.color, 1);
        this.sprite.lineStyle(2, 0x000000, 1);
        
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
            const angle = i * angleStep - Math.PI / 2; // Start at top
            const x = centerX + size * Math.cos(angle);
            const y = centerY + size * Math.sin(angle);
            points.push(new Phaser.Geom.Point(x, y));
        }
        
        return points;
    }
    
    update(time, delta, playerX, playerY) {
        if (!this.sprite.active) return;
        
        // Move toward the player
        const angle = Phaser.Math.Angle.Between(
            this.sprite.x, 
            this.sprite.y, 
            playerX, 
            playerY
        );
        
        // Calculate velocity components based on angle
        const velocityX = Math.cos(angle) * this.speed;
        const velocityY = Math.sin(angle) * this.speed;
        
        // Set enemy velocity
        this.sprite.body.setVelocity(velocityX, velocityY);
        
        // Update position tracking
        this.x = this.sprite.x;
        this.y = this.sprite.y;
    }
    
    takeDamage(amount) {
        this.health -= amount;
        
        // Flash effect for taking damage
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.5,
            duration: 50,
            yoyo: true,
        });
        
        if (this.health <= 0) {
            this.die();
            return true; // Enemy died
        }
        
        return false; // Enemy still alive
    }
    
    die() {
        // Create death explosion effect
        const particles = this.scene.add.particles(this.x, this.y, 'particle', {
            speed: { min: 20, max: 100 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.3, end: 0 },
            blendMode: 'ADD',
            lifespan: 800,
            gravityY: 0,
            quantity: 10 + this.sides * 2 // More particles for larger shapes
        });
        
        // Auto-destroy particles after animation completes
        this.scene.time.delayedCall(800, () => {
            particles.destroy();
        });
        
        // Destroy the enemy
        this.sprite.destroy();
    }
}