import BossOne from '../entities/boss/boss-one.js';
import BossTwo from '../entities/boss/boss-two.js';
import BossThree from '../entities/boss/boss-three.js';
import BossFour from '../entities/boss/boss-four.js';
import BossFive from '../entities/boss/boss-five.js';

/**
 * BossManager handles boss spawning and progression
 */
export default class BossManager {
    constructor(scene, player, enemyManager) {
        this.scene = scene;
        this.player = player;
        this.enemyManager = enemyManager;
        
        // Store all active bosses
        this.bosses = [];
        
        // Create a physics group for bosses
        this.bossGroup = this.scene.physics.add.group();
        
        // Track which intervals we've already spawned a boss for
        this.lastSpawnedInterval = 0;
        
        // Boss progression tracking
        this.bossesDefeated = 0;
        this.currentBossLevel = 0; 
        
        // Initialize the unlocked boss levels array
        this.unlockedBossLevels = [1]; // Start with level 1 unlocked
        
        // Mapping from shape to boss class (shape -> [HP, BossClass])
        this.shapeToBossMap = new Map();
        this.initializeShapeToBossMap();
    }
    
    initializeShapeToBossMap() {
        // Map each available shape to its boss class
        // Use the same shapes progression as the enemy manager
        const availableShapes = this.enemyManager.availableShapes;
        
        // We'll use entries from the enemy manager's shape mapping to get the shapes in order
        const enemyShapeEntries = Array.from(this.enemyManager.shapeToEnemyMap.entries());
        
        // Sort them by HP to maintain the proper progression
        enemyShapeEntries.sort((a, b) => a[1][0] - b[1][0]);
        
        // Map each shape to the appropriate boss class
        const bossClasses = [BossOne, BossTwo, BossThree, BossFour, BossFive];
        
        for (let i = 0; i < Math.min(enemyShapeEntries.length, bossClasses.length); i++) {
            const [shape, [hp, _]] = enemyShapeEntries[i];
            const bossClass = bossClasses[i];
            
            // Map shape to [bossLevel, BossClass]
            this.shapeToBossMap.set(shape, [i + 1, bossClass]);
        }
    }
    
    update(time, delta) {
        // Check boss progression using Phaser time for consistent progression
        this.checkBossProgression(time);
        
        // Get elapsed time in seconds from game stats (resets on game restart)
        const gameTime = this.scene.gameStats.elapsedTime;
        
        // Boss spawn every 5 seconds of game time (for testing)
        const bossSpawnIntervalSeconds = 30;
        
        // Check if we need to spawn a boss
        const currentInterval = Math.floor(gameTime / bossSpawnIntervalSeconds);
        
        if (gameTime >= bossSpawnIntervalSeconds && currentInterval > this.lastSpawnedInterval) {
            
            // Spawn the boss
            this.spawnBoss(time);
            
            // Increment boss level for next spawn (up to 5)
            this.currentBossLevel = Math.min(5, this.currentBossLevel + 1);
            
            // Track that we've spawned a boss in this interval
            this.lastSpawnedInterval = currentInterval;
        }
        
        // Update all active bosses
        for (let i = this.bosses.length - 1; i >= 0; i--) {
            const boss = this.bosses[i];
            
            if (!boss.sprite || !boss.sprite.active) {
                this.bosses.splice(i, 1);
                continue;
            }
            
            boss.update(time, delta, this.player.x, this.player.y);
        }
    }
    
    checkBossProgression(time) {
        if (time - this.lastProgressionCheck >= this.nextBossLevelTime) {
            this.lastProgressionCheck = time;
            
            // If we haven't unlocked all boss levels yet (up to 5)
            if (this.unlockedBossLevels.length < 5) {
                // Unlock the next boss level
                const nextLevel = this.unlockedBossLevels.length + 1;
                this.unlockedBossLevels.push(nextLevel);
            }
        }
    }
    
    spawnBoss(time) {
        // Get the spawn position for the boss
        const spawnPosition = this.getRandomSpawnPosition();
        
        // Determine which boss type to spawn
        let bossLevel, BossClass, shape;
        
        // If we've gone beyond level 5, choose random boss between 1-5
        if (this.currentBossLevel >= 5) {
            bossLevel = Phaser.Math.Between(1, 5);
        } else {
            // Otherwise, use the current progression level
            bossLevel = this.currentBossLevel + 1; // Add 1 because we start at 0
        }
        
        // Find the shape corresponding to this boss level
        for (const [shapeKey, [level, Class]] of this.shapeToBossMap.entries()) {
            if (level === bossLevel) {
                shape = shapeKey;
                BossClass = Class;
                break;
            }
        }
        
        // If we somehow don't have a valid class (fallback)
        if (!BossClass) {
            return;
        }
        
        // Create the boss
        const boss = new BossClass(this.scene, spawnPosition.x, spawnPosition.y, shape);
        
        // Add to boss list and physics group
        this.bosses.push(boss);
        this.bossGroup.add(boss.sprite);
    }
    
    getRandomSpawnPosition() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        const side = Phaser.Math.Between(0, 3);
        
        let x, y;
        const margin = 100; // Larger margin for bosses
        
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
    
    handlePlayerBulletCollision(playerSprite, bullet) {
        // Deal damage to the player
        const player = playerSprite.parentPlayer;
        if (player) {
            player.takeDamage(bullet.damage || 1);
        }
        
        // Remove the bullet
        bullet.destroy();
    }
    
    handleBulletBossCollision(bullet, bossSprite) {
        const boss = bossSprite.parentBoss;
        if (boss) {
            if (boss.takeDamage(bullet.damage || 1)) {
                // Boss was defeated
                this.bossesDefeated++;
                
                // Update score
                this.scene.gameStats.updateScore(
                    this.scene.gameStats.score + boss.score
                );
            }
        }
        
        // Remove the bullet
        bullet.destroy();
    }
    
    handlePlayerBossCollision(playerSprite, bossSprite) {
        const boss = bossSprite.parentBoss;
        const player = playerSprite.parentPlayer;
        
        if (boss && player) {
            // Deal damage to the player
            player.takeDamage(boss.damage);
        }
    }

    startSpawning() {
        // Reset the interval tracking
        this.lastSpawnedInterval = 0;
        
        // Reset boss tracking
        this.bossesDefeated = 0;
        this.currentBossLevel = 0;
    }

    shutdown() {
        
        try {
            // Defeat all active bosses
            if (this.bosses && this.bosses.length > 0) {
                for (const boss of [...this.bosses]) {
                    if (boss && boss.sprite && boss.sprite.active) {
                        boss.defeat();
                    }
                }
                this.bosses = [];
            }
            
            // Set bossGroup to null (will be recreated in constructor)
            this.bossGroup = null;
            
            // Reset tracking variables
            this.bossesDefeated = 0;
            this.currentBossLevel = 0;
            this.lastSpawnedInterval = 0;
            this.unlockedBossLevels = [1];
            
            // Don't touch shapeToBossMap - it will be recreated in the constructor
            
        } catch (error) {
            console.error("Error shutting down boss manager:", error);
        }
    }
    
    removeAllColliders() {
        try {
            if (!this.scene || !this.scene.physics || !this.scene.physics.world) {
                return;
            }
            
            // Get all active colliders
            const colliders = this.scene.physics.world.colliders.getActive();
            
            if (!colliders) {
                return;
            }
            
            // Remove any colliders involving our groups
            for (const collider of colliders) {
                if (!collider) continue;
                
                const obj1 = collider.object1;
                const obj2 = collider.object2;
                
                // Check if either object is one of our groups, with extra null checks
                if ((this.bossBullets && (obj1 === this.bossBullets || obj2 === this.bossBullets)) || 
                    (this.bossGroup && (obj1 === this.bossGroup || obj2 === this.bossGroup))) {
                    collider.destroy();
                }
            }
        } catch (error) {
            console.error("Error removing colliders:", error);
        }
    }
}