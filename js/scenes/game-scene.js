import GameStats from '../ui/stats.js';
import Player from '../entities/player.js';
import EnemyManager from '../managers/enemy-manager.js';
import BossManager from '../managers/boss-manager.js';
import VirtualJoystick from '../ui/virtual-joystick.js';
import PowerUpManager from '../managers/buff-manager.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }
    
    preload() {
        // Load assets here (images, sprites, audio, etc.)
        // Create a simple particle texture for player death effect
        // Or create a particle programmatically if you don't have the asset:
        this.createParticleTexture();
    }
    
    // Create a simple particle texture if you don't have one
    createParticleTexture() {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xffffff);
        graphics.fillCircle(4, 4, 4);
        graphics.generateTexture('particle', 8, 8);
    }
    
    create() {
        // Reset transition flag
        this.transitionStarted = false;
        
        // Initialize physics system
        this.physics.world.setBounds(0, 0, this.cameras.main.width, this.cameras.main.height);
        
        // Initialize game UI with starting values
        this.gameStats = new GameStats(this, 100, 0);
        
        // Setup controls first so they're available for the player
        this.setupControls();
        
        // Initialize game objects
        this.createPlayer();
        
        // Sync player stats with UI
        this.gameStats.updateHP(this.player.health);
        this.gameStats.updateScore(0);
        
        // Initialize enemy manager
        this.enemyManager = new EnemyManager(this, this.player);
        
        // Initialize boss manager
        this.bossManager = new BossManager(this, this.player, this.enemyManager);
        
        // Initialize power-up manager (add this line)
        this.powerUpManager = new PowerUpManager(this, this.player);
        
        // Setup collision detection
        this.setupCollisions();
        
        // Add a short delay before starting the game
        this.time.delayedCall(1000, () => {
            this.startGame();
        });

        // Add auto-aim indicator if on tablet or smaller screen
        if (this.scale.width < 1024) {
            // Create virtual joystick for movement on touch devices
            this.joystick = new VirtualJoystick(
                this, 
                120, // Position in lower left corner
                this.cameras.main.height - 120, 
                100 // Size
            );
            
            const autoAimText = this.add.text(this.scale.width/2, 60, "AUTO-AIM ENABLED", {
                fontFamily: 'Arial',
                fontSize: '16px',
                color: '#00ff00',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);
            
            // Make it flash to draw attention
            this.tweens.add({
                targets: autoAimText,
                alpha: { from: 1, to: 0.5 },
                duration: 1000,
                yoyo: true,
                repeat: 2,
                onComplete: () => {
                    this.tweens.add({
                        targets: autoAimText,
                        alpha: 0,
                        delay: 2000,
                        duration: 1000,
                        onComplete: () => autoAimText.destroy()
                    });
                }
            });
        }

        // Setup keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // WASD keys for alternative movement
        this.wasd = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };
        
        // Debug keys
        this.debugKeys = {
            i: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I),
            o: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O), // Debug text toggle
            u: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.U)  // Defeat player (changed from Q)
        };

        // Add this after all your other initialization code
    
        // Create debug text display
        this.debugText = this.add.text(10, 10, 'Debug Info', {
            fontFamily: 'Courier',
            fontSize: '14px',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 },
            fill: '#00ff00'
        });
        this.debugText.setScrollFactor(0); // Keep it fixed on screen when camera moves
        this.debugText.setDepth(1000);     // Make sure it's on top of everything
        
        // Add a toggle key for debug display
        this.debugKeys.o = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O);
        
        // Initially hide debug text (optional)
        this.debugText.visible = false;

        // Create debug text display in the top right corner
        const margin = 10;
        this.debugText = this.add.text(this.cameras.main.width - margin, margin, 'Debug Info', {
            fontFamily: 'Courier',
            fontSize: '14px',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 },
            fill: '#00ff00'
        });
        this.debugText.setOrigin(1, 0); // Align to top right
        this.debugText.setScrollFactor(0); // Keep it fixed on screen when camera moves
        this.debugText.setDepth(1000);     // Make sure it's on top of everything
        
        // Add a toggle key for debug display
        this.debugKeys.o = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O);
        
        // Initially hide debug text (optional)
        this.debugText.visible = false;

        // Add P key for pause
        this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    }
    
    startGame() {
        // Start enemy and boss spawning
        if (this.enemyManager) {
            this.enemyManager.startSpawning();
        }
        
        if (this.bossManager) {
            this.bossManager.startSpawning();
        }
        
        // Add this to initialize the PowerUpManager
        if (this.powerUpManager) {
            this.powerUpManager.create(); // Make sure it sets up the collisions
        }
        
        // Start game stats timer
        this.gameStats.reset();
        
        // For testing purposes, we'll leave invincibility on
        // Comment this section out to keep player invincible
        /*
        // Disable player invincibility after starting
        if (this.player) {
            this.time.delayedCall(2000, () => {
                this.player.disableInvincibility();
            });
        }
        */
    }
    
    update(time, delta) {

        // Add this to your GameScene's update method
        if (this.debugText) {
            this.debugText.setText(
                `Enemies: ${this.enemyManager.enemies.length}\n` +
                `Bosses: ${this.bossManager.bosses.length}\n` +
                `Power-ups: ${this.powerUpManager.powerUps.length}\n` +
                `Memory: ${Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024))}MB`
            );
        }
        
        // Make sure PowerUpManager.update() is called here
        if (this.powerUpManager) {
            this.powerUpManager.update();
        } else {
        }
        
        // Check debug keys
        if (Phaser.Input.Keyboard.JustDown(this.debugKeys.i)) {
            if (this.player) {
                const newState = !this.player.isInvincible;
                this.player.setInvincible(newState);
                
                // Display status message - make sure this matches the actual state
                this.displayStatusMessage(
                    newState ? "INVINCIBILITY ON" : "INVINCIBILITY OFF", 
                    newState ? 0x00ff00 : 0xff0000
                );
            }
        }
        
        // Change from Q to U for player defeat
        if (Phaser.Input.Keyboard.JustDown(this.debugKeys.u)) {
            if (this.player) {
                this.player.health = 0;
                this.player.defeat();
            }
        }

        // Add this with your other debug key checks
        if (Phaser.Input.Keyboard.JustDown(this.debugKeys.o)) {
            this.debugText.visible = !this.debugText.visible;
        }
        
        // Your existing debug text update
        if (this.debugText && this.debugText.visible) {
            try {
                let memoryInfo = '';
                if (window.performance && window.performance.memory) {
                    memoryInfo = `Memory: ${Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024))}MB`;
                }
                
                this.debugText.setText(
                    `FPS: ${Math.round(this.game.loop.actualFps)}\n` +
                    `Enemies: ${this.enemyManager.enemies.length}\n` +
                    `Bosses: ${this.bossManager.bosses.length}\n` +
                    `Power-ups: ${this.powerUpManager.powerUps ? this.powerUpManager.powerUps.length : 0}\n` +
                    memoryInfo
                );
            } catch (e) {
                console.error("Error updating debug text:", e);
            }
        }
        
        // Rest of your update code...

        // Update player if it exists
        if (this.player) {
            // If joystick exists (touch device), use its input
            if (this.joystick) {
                const movement = this.joystick.getMovement();
                this.player.handleJoystickMovement(movement);
            } 
            
            this.player.update(time, delta);
        }
        
        // Update enemies
        if (this.enemyManager) {
            this.enemyManager.update(time, delta);
        }
        
        // Update bosses
        if (this.bossManager) {
            this.bossManager.update(time, delta);
        }

        // Update power-ups
        if (this.powerUpManager) {
            this.powerUpManager.update();
        }

        // Check for pause key press
        if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
            this.pauseGame();
        }
    }
    
    createPlayer() {
        // Center the player in the game world
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        
        // Create the player
        this.player = new Player(this, centerX, centerY);
    }
    
    setupControls() {
        // Setup keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // WASD keys for alternative movement
        this.wasd = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };

        // Create debug keys for testing
        this.debugKeys = this.input.keyboard.addKeys({
            i: Phaser.Input.Keyboard.KeyCodes.I,  // Toggle invincibility
        });
    }
    
    setupCollisions() {
        // Check for bullet-enemy collisions
        this.physics.add.collider(
            this.player.bullets, 
            this.enemyManager.enemyGroup,
            (bullet, enemySprite) => {
                this.enemyManager.handleBulletEnemyCollision(bullet, enemySprite);
            },
            null,
            this
        );
        
        // Check for player-enemy collisions
        this.physics.add.collider(
            this.player.sprite,
            this.enemyManager.enemyGroup,
            (playerSprite, enemySprite) => {
                this.enemyManager.handlePlayerEnemyCollision(playerSprite, enemySprite);
            },
            null, 
            this
        );
        
        // Check for bullet-boss collisions
        this.physics.add.collider(
            this.player.bullets,
            this.bossManager.bossGroup,
            (bullet, bossSprite) => {
                this.bossManager.handleBulletBossCollision(bullet, bossSprite);
            },
            null,
            this
        );
        
        // Check for player-boss collisions
        this.physics.add.collider(
            this.player.sprite,
            this.bossManager.bossGroup,
            (playerSprite, bossSprite) => {
                this.bossManager.handlePlayerBossCollision(playerSprite, bossSprite);
            },
            null,
            this
        );
    }
    
    // Helper method to add visual feedback when player takes damage
    playerDamageEffect() {
        if (!this.player || !this.player.sprite) return;
        
        // Flash the player red
        this.tweens.add({
            targets: this.player.sprite,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                if (this.player && this.player.sprite) {
                    this.player.sprite.alpha = 1;
                }
            }
        });
    }
    
    // Method to handle player death and game over state
    handleGameOver() {
        // Create explosion effect
        if (this.player && this.player.sprite) {
            this.createExplosion(this.player.x, this.player.y, this.player.color);
        }
        
        // Stop updates for enemies and bosses
        this.isGameOver = true;
        
        // Stop the physics and other game activities
        this.physics.pause();
        
        // Stop the game stats timer
        this.gameStats.stopTimer();
        
        // Take a screenshot of the current game state
        const gameState = 'game-screenshot';
        this.game.renderer.snapshot((image) => {
            if (this.textures.exists(gameState)) {
                this.textures.remove(gameState);
            }
            this.textures.addImage(gameState, image);
            
            // Use a subtle fade with lower opacity
            this.cameras.main.fadeOut(800, 0, 0, 0, (camera, progress) => {
                // Start transition when fade is halfway (still partly visible)
                if (progress > 0.5 && !this.transitionStarted) {
                    this.transitionStarted = true;
                    
                    // Start the game over scene with the game state screenshot
                    this.scene.start('GameOverScene', { 
                        score: this.gameStats.score,
                        survivedTime: this.gameStats.elapsedTime,
                        backgroundKey: 'game-screenshot'
                    });
                }
            });
        });
    }

    // Create an explosion effect at the given position
    createExplosion(x, y, color) {
        // Create particle emitter using current Phaser API
        const particles = this.add.particles(x, y, 'particle', {
            speed: { min: 50, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 },  // Add alpha fading
            blendMode: 'SCREEN',
            lifespan: { min: 800, max: 1500 },  // Varied lifespan for more natural effect
            gravityY: 0,
            tint: color,
            quantity: 40,
            emitting: false
        });
        
        // Emit all particles at once
        particles.explode();
        
        // Clean up after animation completes (use the maximum possible lifespan)
        this.time.delayedCall(1500, () => {
            particles.destroy();
        });
    }

    // Add a shutdown method to properly clean up
    shutdown() {
        
        try {
            if (this.gameStats) {
                this.gameStats.shutdown();
            }
            
            if (this.enemyManager) {
                this.enemyManager.shutdown();
            }
            
            if (this.bossManager) {
                this.bossManager.shutdown();
            }
            
            if (this.powerUpManager) {
                this.powerUpManager.shutdown();
            }
            
            if (this.player) {
                this.player.destroy();
            }
            
            this.time.removeAllEvents();
            this.tweens.killAll();
            
            if (this.joystick) {
                this.joystick.shutdown();
                this.joystick = null;
            }
        } catch (error) {
            console.error("Error shutting down game scene:", error);
        }
    }

    // Add this helper method to show status messages
    displayStatusMessage(message, color = 0xffffff) {
        const x = this.cameras.main.width / 2;
        const y = 100;
        
        const text = this.add.text(x, y, message, {
            fontFamily: 'Arial',
            fontSize: '20px',
            fontWeight: 'bold',
            color: color ? `#${color.toString(16).padStart(6, '0')}` : '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: text,
            y: y - 50,
            alpha: { from: 1, to: 0 },
            duration: 2000,
            ease: 'Power2',
            onComplete: () => text.destroy()
        });
    }

    pauseGame() {
        // Pause the current scene
        this.scene.pause();
        
        // Launch the pause scene
        this.scene.launch('PauseScene');
    }
}