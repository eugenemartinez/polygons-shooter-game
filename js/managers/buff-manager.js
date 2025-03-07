import DoubleDamage from '../entities/buffs/double-damage.js';
import RapidFire from '../entities/buffs/rapid-fire.js';
import Haste from '../entities/buffs/haste.js';
import Shield from '../entities/buffs/shield.js';

export default class PowerUpManager {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.powerUps = [];
        this.activePowerUps = [];
        
        // Instead of using Phaser's time events, we'll track time using gameStats.elapsedTime
        this.initialSpawnTimeSeconds = 60; // 10 seconds for testing (change to 60 for production)
        this.spawnIntervalSeconds = 20;    // Spawn every 20 seconds
        this.lastSpawnTimeSeconds = -1;    // Track when we last spawned
        
        // Duration that power-ups stay on screen (10 seconds)
        this.powerUpLifespan = 10000;
        
        // Physics group for power-ups
        this.powerUpGroup = scene.physics.add.group();
        
        // Create the status message helper on the scene if it doesn't exist
        if (!scene.displayStatusMessage) {
            scene.displayStatusMessage = (message, color = 0xffffff) => {
                const text = scene.add.text(
                    scene.game.config.width / 2,
                    scene.game.config.height / 3,
                    message,
                    {
                        fontFamily: 'Arial',
                        fontSize: '24px',
                        color: '#ffffff',
                        stroke: '#000000',
                        strokeThickness: 4
                    }
                );
                text.setOrigin(0.5);
                text.setDepth(1000);
                
                scene.tweens.add({
                    targets: text,
                    y: text.y - 50,
                    alpha: 0,
                    duration: 2000,
                    ease: 'Power2',
                    onComplete: () => text.destroy()
                });
            };
        }
        
        // Initialize active power-up indicators
        this.powerUpIndicators = {};
    }
    
    create() {
        // Setup power-up collision with player
        this.scene.physics.add.overlap(
            this.player.sprite,
            this.powerUpGroup,
            (playerSprite, powerupSprite) => {
                const powerup = this.findPowerUpBySprite(powerupSprite);
                if (powerup) {
                    powerup.collect(this.player);
                }
            }
        );
        
        // Create UI for active power-up indicators
        this.createActivePowerUpUI();
    }
    
    createActivePowerUpUI() {
        // Position below the timer text and slightly to the right
        const marginLeft = 40; // Same left margin as the stats
        const marginTop = 120;  // Below the timer text (timer is at 60)

        // Container for power-up indicators - positioned below timer
        this.indicatorContainer = this.scene.add.container(marginLeft, marginTop);
        this.indicatorContainer.setDepth(1000);
        this.indicatorContainer.setScrollFactor(0); // Fixed to camera
    }
    
    spawnPowerUp() {
        // Get random position within game bounds
        const gameWidth = this.scene.game.config.width;
        const gameHeight = this.scene.game.config.height;
        const margin = 100; // Avoid spawning too close to edges
        
        const x = Phaser.Math.Between(margin, gameWidth - margin);
        const y = Phaser.Math.Between(margin, gameHeight - margin);
        
        // Choose random power-up type
        const powerUpTypes = [DoubleDamage, RapidFire, Haste, Shield];
        const PowerUpClass = Phaser.Utils.Array.GetRandom(powerUpTypes);
        
        // Create power-up
        const powerUp = new PowerUpClass(this.scene, x, y);
        this.powerUps.push(powerUp);
        
        // Add to physics group
        this.powerUpGroup.add(powerUp.sprite);
        
        // Add visual indicator that a power-up has spawned
        this.addSpawnIndicator(x, y, powerUp.type);
    }
    
    addSpawnIndicator(x, y, type) {
        // Create a pulsing arrow or beacon to draw attention to the power-up
        const arrow = this.scene.add.text(x, y - 30, '⬇', {
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        arrow.setOrigin(0.5);
        
        // Add pulsing animation
        this.scene.tweens.add({
            targets: arrow,
            scale: { from: 0.8, to: 1.2 },
            alpha: { from: 0.7, to: 1 },
            duration: 500,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                arrow.destroy();
            }
        });
    }
    
    // Find a power-up by its sprite
    findPowerUpBySprite(sprite) {
        return this.powerUps.find(p => p.sprite === sprite);
    }
    
    // Track active power-up effects
    trackPowerUp(powerUp) {
        this.activePowerUps.push(powerUp);
        
        // Add indicator for active power-up
        this.addActivePowerUpIndicator(powerUp);
        
        // Set timer to remove effect
        powerUp.activeTimer = this.scene.time.delayedCall(powerUp.duration, () => {
            powerUp.removeEffect(this.player);
            this.removeActivePowerUpIndicator(powerUp.type);
            this.activePowerUps = this.activePowerUps.filter(p => p !== powerUp);
        });
    }
    
    // Add UI indicator for active power-up
    addActivePowerUpIndicator(powerUp) {
        // Remove existing indicator if present
        this.removeActivePowerUpIndicator(powerUp.type);
        
        // Create icon with smaller scale for more compact display
        const icon = this.scene.add.sprite(0, 0, powerUp.textureKey);
        icon.setScale(0.5);  // Smaller scale
        
        // Create timer background - wider for better visibility
        const timerBg = this.scene.add.rectangle(0, 18, 30, 4, 0x333333);
        
        // Create timer bar
        const timerBar = this.scene.add.rectangle(0, 18, 30, 4, 0xffffff);
        timerBar.setOrigin(0, 0.5);
        timerBar.x = -15; // Align left
        
        // Create container - position horizontally with margin
        const containerMargin = 40;  // Space between indicators
        const containerX = Object.keys(this.powerUpIndicators).length * containerMargin;
        const container = this.scene.add.container(containerX, 0);
        container.add([icon, timerBg, timerBar]);
        
        // Add to main container
        this.indicatorContainer.add(container);
        
        // Start timer animation
        this.scene.tweens.add({
            targets: timerBar,
            width: 0,
            duration: powerUp.duration,
            ease: 'Linear'
        });
        
        // Store reference to indicator
        this.powerUpIndicators[powerUp.type] = {
            container,
            powerUp
        };
        
        // Re-arrange indicators
        this.arrangeIndicators();
    }
    
    // Remove UI indicator when power-up expires
    removeActivePowerUpIndicator(type) {
        if (this.powerUpIndicators[type]) {
            // Remove with a fade out effect
            this.scene.tweens.add({
                targets: this.powerUpIndicators[type].container,
                alpha: 0,
                y: -20,  // Fade upward
                duration: 300,
                onComplete: () => {
                    this.powerUpIndicators[type].container.destroy();
                    delete this.powerUpIndicators[type];
                    this.arrangeIndicators();
                }
            });
        }
    }
    
    // Arrange active power-up indicators horizontally
    arrangeIndicators() {
        let index = 0;
        const margin = 40;  // Space between indicators
        
        for (const key in this.powerUpIndicators) {
            const indicator = this.powerUpIndicators[key].container;
            
            // Animate to new position - horizontal arrangement
            this.scene.tweens.add({
                targets: indicator,
                x: index * margin,
                duration: 200,
                ease: 'Power2'
            });
            
            index++;
        }
    }
    
    // Clean up all power-ups
    clear() {
        // Remove all active power-ups
        for (const powerUp of this.activePowerUps) {
            if (powerUp.activeTimer) {
                powerUp.activeTimer.remove();
            }
            powerUp.removeEffect(this.player);
            this.removeActivePowerUpIndicator(powerUp.type);
        }
        
        // Destroy all power-up sprites
        for (const powerUp of this.powerUps) {
            powerUp.destroy();
        }
        
        this.powerUps = [];
        this.activePowerUps = [];
    }
    
    update() {
        // Check if gameStats exists
        if (!this.scene.gameStats) {
            return;
        }
        
        // Get game time from stats in seconds
        const gameTimeSeconds = this.scene.gameStats.elapsedTime;
        
        // Check if it's time to spawn a new power-up
        if (gameTimeSeconds >= this.initialSpawnTimeSeconds) {
            // Calculate which spawn interval we're in
            const currentSpawnInterval = Math.floor((gameTimeSeconds - this.initialSpawnTimeSeconds) / this.spawnIntervalSeconds);
            
            // If we haven't spawned for this interval yet, do it now
            if (currentSpawnInterval > this.lastSpawnTimeSeconds) {
                this.spawnPowerUp();
                this.lastSpawnTimeSeconds = currentSpawnInterval;
            }
        }
        
        // Clean up destroyed power-ups from array
        this.powerUps = this.powerUps.filter(p => p.sprite && p.sprite.active);
    }
    
    // Cleanup on shutdown
    shutdown() {
        
        try {
            // Remove effects of active power-ups
            if (this.activePowerUps) {
                for (const powerUp of this.activePowerUps) {
                    if (powerUp) {
                        // Remove the timer if it exists
                        if (powerUp.activeTimer) {
                            powerUp.activeTimer.remove();
                        }
                        
                        // Remove the effect from the player
                        if (typeof powerUp.removeEffect === 'function') {
                            powerUp.removeEffect(this.player);
                        }
                    }
                }
                this.activePowerUps = [];
            }
            
            // Destroy all power-up sprites
            if (this.powerUps) {
                for (const powerUp of this.powerUps) {
                    if (powerUp) {
                        powerUp.destroy();
                    }
                }
                this.powerUps = [];
            }
            
            // Reset other properties
            this.lastSpawnTimeSeconds = -1;
            
        } catch (error) {
            console.error("Error shutting down power-up manager:", error);
        }
    }
}