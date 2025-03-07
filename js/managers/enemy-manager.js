import EnemyOne from '../entities/enemy/enemy-one.js';
import EnemyTwo from '../entities/enemy/enemy-two.js';
import EnemyThree from '../entities/enemy/enemy-three.js';
import EnemyFour from '../entities/enemy/enemy-four.js';
import EnemyFive from '../entities/enemy/enemy-five.js';

/**
 * EnemyManager handles enemy spawning, progression, and tracking
 */
export default class EnemyManager {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        
        // Store all active enemies
        this.enemies = [];
        
        // All possible shapes (3-8 sides)
        this.allShapes = [3, 4, 5, 6, 7, 8];
        
        // Available shapes (excluding player shape)
        this.availableShapes = this.allShapes.filter(shape => shape !== player.sides);
        
        // Currently unlocked shapes (starts with just the first shape)
        this.unlockedShapes = [this.availableShapes[0]];
        
        // Mapping from shape to HP/enemy class (shape -> [HP, EnemyClass])
        this.shapeToEnemyMap = new Map();
        this.initializeShapeToEnemyMap();
        
        // Spawn settings - increased spawn rate
        this.spawnRate = 1000; // ms between spawns (reduced from 1500ms)
        this.lastSpawn = 0;
        this.maxEnemies = 100; // Maximum enemies on screen
        
        // Progression settings
        this.nextShapeTime = 30000; // 30 seconds until next shape unlocks
        
        // NEW: Game time tracking for spawn and progression
        this.lastSpawnGameTime = 0;
        this.lastShapeProgressionInterval = 0;
        
        // Create a physics group for enemies
        this.enemyGroup = this.scene.physics.add.group();
        
        // Counter to track the number of enemies spawned
        this.enemySpawnCount = 0;
    }
    
    initializeShapeToEnemyMap() {
        // Map each shape to its HP value and enemy class
        // Skip the player's shape
        let hpCounter = 1;
        
        for (let shape of this.availableShapes) {
            if (hpCounter === 1) {
                this.shapeToEnemyMap.set(shape, [1, EnemyOne]);
            } else if (hpCounter === 2) {
                this.shapeToEnemyMap.set(shape, [2, EnemyTwo]);
            } else if (hpCounter === 3) {
                this.shapeToEnemyMap.set(shape, [3, EnemyThree]);
            } else if (hpCounter === 4) {
                this.shapeToEnemyMap.set(shape, [4, EnemyFour]);
            } else if (hpCounter === 5) {
                this.shapeToEnemyMap.set(shape, [5, EnemyFive]);
            }
            hpCounter++;
        }
    }
    
    update(time, delta) {
        // Get elapsed time in seconds from game stats (resets on game restart)
        const gameTimeSeconds = this.scene.gameStats.elapsedTime;
        // Convert to ms for consistent calculations with existing timing
        const gameTimeMs = gameTimeSeconds * 1000;
        
        // Check if it's time to unlock a new shape based on game time
        this.checkShapeProgression(gameTimeSeconds);
        
        // Gradually decrease spawn time for increased difficulty based on game time
        // Calculate elapsed time in ms for spawn rate adjustment
        const minSpawnRate = 500; // Minimum spawn time in ms
        const adjustedSpawnRate = Math.max(
            minSpawnRate, 
            this.spawnRate - (gameTimeMs / 30000) * 150
        ); // Every 30 seconds of game time, decrease spawn time by 150ms
        
        // Track when we last spawned relative to game time
        const currentGameTimeMs = gameTimeMs;
        const spawnIntervalMs = adjustedSpawnRate;
        
        // Spawn new enemies at the adjusted rate, using game time reference
        if (currentGameTimeMs - this.lastSpawnGameTime >= spawnIntervalMs && 
            this.enemies.length < this.maxEnemies) {
            this.spawnEnemy(time); // Still pass Phaser time to spawnEnemy for entity creation
            this.lastSpawnGameTime = currentGameTimeMs;
        }
        
        // Update all active enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            if (!enemy.sprite || !enemy.sprite.active) {
                this.enemies.splice(i, 1);
                continue;
            }
            
            enemy.update(time, delta, this.player.x, this.player.y);
        }
    }
    
    checkShapeProgression(gameTimeSeconds) {
        // Convert times to seconds for easier comparison with game stats time
        const nextShapeTimeSeconds = this.nextShapeTime / 1000; // Convert to seconds
        const gameTime = gameTimeSeconds; // Already in seconds
        
        // Check if it's time to unlock a new shape based on intervals
        const currentInterval = Math.floor(gameTime / nextShapeTimeSeconds);
        
        if (currentInterval > this.lastShapeProgressionInterval) {
            // We've reached a new progression interval
            this.lastShapeProgressionInterval = currentInterval;
            
            // If we haven't unlocked all shapes yet
            if (this.unlockedShapes.length < this.availableShapes.length) {
                // Unlock the next shape
                const nextShape = this.availableShapes[this.unlockedShapes.length];
                this.unlockedShapes.push(nextShape);
            }
        }
    }
    
    spawnEnemy(time) {
        const spawnPosition = this.getRandomSpawnPosition();
        
        // Choose a shape based on weighted probabilities
        const shape = this.getWeightedRandomShape();
        
        // Get the enemy class for this shape
        const [hp, EnemyClass] = this.shapeToEnemyMap.get(shape);
        
        // Create the enemy
        const enemy = new EnemyClass(this.scene, spawnPosition.x, spawnPosition.y, shape);
        
        this.enemies.push(enemy);
        this.enemyGroup.add(enemy.sprite);
        this.lastSpawn = time;
        this.enemySpawnCount++;
    }
    
    getWeightedRandomShape() {
        // Assign weights to each shape based on its HP
        // Lower HP = higher weight = more likely to spawn
        const weights = {};
        let totalWeight = 0;
        
        // Calculate weights for each unlocked shape
        for (const shape of this.unlockedShapes) {
            const [hp, _] = this.shapeToEnemyMap.get(shape);
            const weight = Math.max(1, 6 - hp); // Weight 5 for HP1, 4 for HP2, 3 for HP3, etc.
            weights[shape] = weight;
            totalWeight += weight;
        }
        
        // Choose a random shape based on weights
        let random = Math.random() * totalWeight;
        let cumulativeWeight = 0;
        
        for (const shape of this.unlockedShapes) {
            cumulativeWeight += weights[shape];
            if (random <= cumulativeWeight) {
                return shape;
            }
        }
        
        // Fallback to first shape if something goes wrong
        return this.unlockedShapes[0];
    }
    
    getRandomSpawnPosition() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        const side = Phaser.Math.Between(0, 3);
        
        let x, y;
        const margin = 50;
        
        switch(side) {
            case 0:
                x = Phaser.Math.Between(0, width);
                y = -margin;
                break;
            case 1:
                x = width + margin;
                y = Phaser.Math.Between(0, height);
                break;
            case 2:
                x = Phaser.Math.Between(0, width);
                y = height + margin;
                break;
            case 3:
                x = -margin;
                y = Phaser.Math.Between(0, height);
                break;
        }
        
        return { x, y };
    }
    
    handleBulletEnemyCollision(bullet, enemySprite) {
        const enemy = enemySprite.parentEnemy;
        if (enemy) {
            if (enemy.takeDamage(bullet.damage || 1)) {
                // Use the score property from the enemy instance
                const scoreValue = enemy.score || 10; // Default to 10 if score is not set
                
                this.scene.gameStats.updateScore(
                    this.scene.gameStats.score + scoreValue
                );
            }
        }
        
        bullet.destroy();
    }
    
    handlePlayerEnemyCollision(playerSprite, enemySprite) {
        const enemy = enemySprite.parentEnemy;
        const player = playerSprite.parentPlayer;
        
        if (enemy && player) {
            player.takeDamage(enemy.damage);
            
            enemy.die();
            
            const index = this.enemies.indexOf(enemy);
            if (index > -1) {
                this.enemies.splice(index, 1);
            }
        }
    }

    // Method to reset/initialize enemy spawning
    startSpawning() {
        // Reset enemy tracking
        this.enemySpawnCount = 0;
        
        // Reset shape progression
        this.unlockedShapes = [this.availableShapes[0]];
        this.lastShapeProgressionInterval = 0;
        
        // Reset spawn timing
        this.lastSpawnGameTime = 0;
    }

    // Method for proper cleanup
    shutdown() {
        // Clear all enemies from the game
        this.enemyGroup.clear(true, true);
        this.enemies = [];
        
        // Reset tracking variables
        this.enemySpawnCount = 0;
        
        // Reset progression
        this.unlockedShapes = [this.availableShapes[0]];
        this.lastShapeProgressionInterval = 0;
    }
}