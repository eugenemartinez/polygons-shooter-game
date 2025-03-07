export default class PauseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PauseScene' });
    }
    
    create() {
        // Semi-transparent background overlay
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        this.overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.7);
        
        // Pause text
        const pauseText = this.add.text(width/2, height/2 - 100, 'GAME PAUSED', {
            fontFamily: 'Arial',
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        
        // Instructions
        const resumeText = this.add.text(width/2, height/2, 'Press P to resume', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        
        // Main menu button
        const menuButton = this.add.text(width/2, height/2 + 100, 'Main Menu', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#222266',
            padding: { x: 20, y: 10 },
            align: 'center'
        }).setOrigin(0.5);
        
        // Make button interactive
        menuButton.setInteractive({ useHandCursor: true })
            .on('pointerover', () => menuButton.setStyle({ backgroundColor: '#444499' }))
            .on('pointerout', () => menuButton.setStyle({ backgroundColor: '#222266' }))
            .on('pointerdown', () => {
                // Visual feedback on click
                menuButton.setStyle({ backgroundColor: '#666699' });
                
                // Add a fade-out transition
                this.cameras.main.fadeOut(500, 0, 0, 0);
                
                // Wait for the fade to complete, then switch scenes
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    // First stop the pause scene
                    this.scene.stop();
                    
                    // Stop the GameScene (which will trigger its shutdown method)
                    this.scene.stop('GameScene');
                    
                    // Start the title scene (main menu)
                    this.scene.start('TitleScene');
                });
            });
        
        // Add P key event for resuming the game
        this.input.keyboard.on('keydown-P', () => {
            this.resumeGame();
        });
        
        // Add ESC key as an alternate way to resume
        this.input.keyboard.on('keydown-ESC', () => {
            this.resumeGame();
        });
        
        // Make the pause text pulse to draw attention
        this.tweens.add({
            targets: pauseText,
            scale: { from: 1, to: 1.1 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Add subtle fade-in transition when the pause scene starts
        this.cameras.main.fadeIn(200, 0, 0, 0);
    }
    
    resumeGame() {
        // Simple alpha fadeout of the pause overlay elements
        const elements = [this.overlay, ...this.children.list];
        
        this.tweens.add({
            targets: elements,
            alpha: 0,
            duration: 150,
            onComplete: () => {
                // Resume the GameScene
                this.scene.resume('GameScene');
                
                // Stop the PauseScene
                this.scene.stop();
            }
        });
    }
}