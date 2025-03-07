export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }
    
    // Receive data from the previous scene
    init(data) {
        this.score = data.score || 0;
        this.survivedTime = data.survivedTime || 0;
        this.backgroundKey = data.backgroundKey || null;
    }
    
    create() {
        const { width, height } = this.scale;
        
        // Add the background screenshot if available
        if (this.backgroundKey) {
            const background = this.add.image(width/2, height/2, this.backgroundKey)
                .setOrigin(0.5)
                .setDisplaySize(width, height);
                
            // Add blur effect through a semi-transparent overlay (lighter than before)
            this.add.rectangle(0, 0, width, height, 0x000000, 0.5)
                .setOrigin(0, 0);
        } else {
            // Fallback if no background image is available
            this.add.rectangle(0, 0, width, height, 0x000000, 0.7)
                .setOrigin(0, 0);
        }
        
        // Create Game Over text with better styling
        const gameOverText = this.add.text(width / 2, height * 0.35, 'Game Over', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '64px',
            fontWeight: 'bold',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 5, fill: true }
        }).setOrigin(0.5).setAlpha(0).setScale(0.5);
    
        // Format survived time as MM:SS
        const minutes = Math.floor(this.survivedTime / 60);
        const seconds = this.survivedTime % 60;
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Create time text with improved spacing
        const timeText = this.add.text(
            width / 2, 
            height * 0.45, 
            `Survived Time: ${formattedTime}`, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '32px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5).setAlpha(0);
    
        // Create score text with improved spacing
        const scoreText = this.add.text(
            width / 2, 
            height * 0.52, 
            `Score: ${this.score}`, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '32px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5).setAlpha(0);
    
        // Create Restart button with title scene matching style
        const restartButton = this.add.text(
            width / 2, 
            height * 0.65, 
            'Restart', {
                fontFamily: 'Arial, sans-serif',
                fontSize: '36px',
                fontWeight: 'bold',
                fill: '#ffffff',
                backgroundColor: '#4a5dff',
                padding: { x: 30, y: 15 },
                stroke: '#000000',
                strokeThickness: 2,
                shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 2, fill: true }
            }
        ).setOrigin(0.5).setInteractive().setAlpha(0);
    
        // Adjust for mobile-first design
        const scaleFactor = Math.min(width, height) / 1000;  // Reference size for scaling
        gameOverText.setFontSize(Math.max(32, Math.floor(64 * scaleFactor)));
        scoreText.setFontSize(Math.max(20, Math.floor(32 * scaleFactor)));
        timeText.setFontSize(Math.max(20, Math.floor(32 * scaleFactor)));
        restartButton.setFontSize(Math.max(24, Math.floor(36 * scaleFactor)));
    
        // Add click event for Restart button
        restartButton.on('pointerdown', () => {
            // Start a fade out effect
            this.cameras.main.fadeOut(500, 0, 0, 0);
            
            this.cameras.main.once('camerafadeoutcomplete', () => {
                // This will ensure proper shutdown and reinitialization
                const gameScene = this.scene.get('GameScene');
                if (gameScene) {
                    gameScene.shutdown(); // Ensure shutdown is called
                }
                this.scene.stop('GameScene'); // This will trigger the shutdown method
                this.scene.start('GameScene'); // This will create a fresh scene
                this.scene.stop('GameOverScene');
            });
        });
    
        // Add hover effects for button
        restartButton.on('pointerover', () => {
            restartButton.setStyle({ 
                fill: '#ffffff',
                backgroundColor: '#2a3dff' 
            });
            this.input.setDefaultCursor('pointer');
            this.tweens.add({
                targets: restartButton,
                scale: 1.05,
                duration: 100,
                ease: 'Power1'
            });
        });
        
        restartButton.on('pointerout', () => {
            restartButton.setStyle({ 
                fill: '#ffffff',
                backgroundColor: '#4a5dff' 
            });
            this.input.setDefaultCursor('default');
            this.tweens.add({
                targets: restartButton,
                scale: 1,
                duration: 100,
                ease: 'Power1'
            });
        });
    
        // Start staggered animations for UI elements
        // 1. Game over text appears first
        this.tweens.add({
            targets: gameOverText,
            alpha: 1,
            scale: 1,
            duration: 800, 
            ease: 'Back.easeOut',
            onComplete: () => {
                // 2. Time and score appear next with better timing
                this.tweens.add({
                    targets: [timeText, scoreText],
                    alpha: 1,
                    y: '-=10',
                    duration: 600,
                    delay: (target, i) => i * 200,
                    ease: 'Power2.easeOut',
                    onComplete: () => {
                        // 3. Restart button appears last
                        this.tweens.add({
                            targets: restartButton,
                            alpha: 1,
                            y: '-=10',
                            duration: 600,
                            ease: 'Power2.easeOut',
                            onComplete: () => {
                                // 4. Add subtle pulsing effect to the restart button
                                this.tweens.add({
                                    targets: restartButton,
                                    scale: 1.05,
                                    duration: 1200,
                                    yoyo: true,
                                    repeat: -1
                                });
                            }
                        });
                    }
                });
            }
        });
    }
}