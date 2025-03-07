export default class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    create() {
        const { width, height } = this.scale;
        const smallerDimension = Math.min(width, height);
        
        // Create background
        const bg = this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0, 0);
        
        // Calculate responsive positions
        const titleY = height * 0.25;
        const subtitleY = titleY + smallerDimension * 0.1;
        const buttonY = height * 0.55;
        const instructionsY = height * 0.75;
        
        // Add title text with a polygon theme - using responsive sizing
        const titleText = this.add.text(width / 2, titleY, 'POLYGON SURVIVOR', {
            fontFamily: 'Arial',
            fontSize: `${smallerDimension * 0.08}px`,
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: Math.max(3, smallerDimension * 0.006),
            shadow: { 
                offsetX: Math.max(1, smallerDimension * 0.003), 
                offsetY: Math.max(1, smallerDimension * 0.003), 
                color: '#000000', 
                blur: Math.max(2, smallerDimension * 0.005), 
                fill: true 
            }
        }).setOrigin(0.5);
        
        // Add subtitle text
        const subtitleText = this.add.text(width / 2, subtitleY, 'Survive the geometric onslaught', {
            fontFamily: 'Arial',
            fontSize: `${smallerDimension * 0.035}px`,
            color: '#cccccc'
        }).setOrigin(0.5);
        
        // Add start button - larger touch target for mobile
        // Updated to match GameOverScene button style
        const buttonWidth = smallerDimension * 0.5;
        const buttonHeight = smallerDimension * 0.1;
        const buttonBg = this.add.rectangle(
            width / 2,
            buttonY,
            buttonWidth,
            buttonHeight,
            0x4a5dff // Updated to blue to match GameOverScene
        ).setOrigin(0.5).setInteractive();
        
        const startButton = this.add.text(width / 2, buttonY, 'START GAME', {
            fontFamily: 'Arial',
            fontSize: `${smallerDimension * 0.045}px`,
            color: '#ffffff',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 1,
        }).setOrigin(0.5);
        
        // Check if we're on desktop (larger screen)
        // Updated threshold to include tablets in auto-aim
        const isDesktop = width >= 1024;
        
        // Only show keyboard/mouse instructions on desktop
        if (isDesktop) {
            // Add instructions - responsive text size
            const instructionsText = this.add.text(width / 2, instructionsY, 
                'Move: WASD or Arrow keys\nShoot: Mouse', {
                fontFamily: 'Arial',
                fontSize: `${smallerDimension * 0.03}px`,
                color: '#cccccc',
                align: 'center',
                lineSpacing: 30,
            }).setOrigin(0.5);
        } else {
            // For tablets and mobile, show auto-aim message and joystick instructions
            const touchText = this.add.text(width / 2, instructionsY,
                'Auto-aim enabled for touch devices\nUse the virtual joystick to move', {
                fontFamily: 'Arial',
                fontSize: `${smallerDimension * 0.03}px`,
                color: '#cccccc',
                align: 'center',
                lineSpacing: 15,
            }).setOrigin(0.5);
        }
        
        // Add hover/touch effect for button - updated to match GameOverScene
        buttonBg.on('pointerover', () => {
            buttonBg.setFillStyle(0x2a3dff); // Darker blue on hover
            this.input.setDefaultCursor('pointer'); // Add pointer cursor
            this.tweens.add({
                targets: [buttonBg, startButton],
                scale: 1.05,
                duration: 100,
                ease: 'Power1'
            });
        });
        
        buttonBg.on('pointerout', () => {
            buttonBg.setFillStyle(0x4a5dff); // Back to original blue
            this.input.setDefaultCursor('default'); // Reset cursor
            this.tweens.add({
                targets: [buttonBg, startButton],
                scale: 1,
                duration: 100,
                ease: 'Power1'
            });
        });
        
        // Add click/touch handler to start the game
        buttonBg.on('pointerdown', () => {
            // Transition to game scene with a fade
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('GameScene');
            });
        });
        
        // Animation for title
        this.tweens.add({
            targets: titleText,
            scale: { from: 0.8, to: 1 },
            duration: 1000,
            ease: 'Bounce.easeOut'
        });
        
        // Add subtle animation to button to draw attention
        this.tweens.add({
            targets: [buttonBg, startButton],
            scale: 1.05,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
        
        // Add version text
        this.add.text(width - 10, height - 10, 'v1.0', {
            fontFamily: 'Arial',
            fontSize: `${smallerDimension * 0.02}px`,
            color: '#666666'
        }).setOrigin(1, 1);
        
        // Handle orientation changes
        this.scale.on('resize', this.resize, this);
    }
    
    resize(gameSize) {
        const width = gameSize.width;
        const height = gameSize.height;
        
        // Recreate the scene for proper responsive layout
        if (this.scene.isActive('TitleScene')) {
            this.scene.restart();
        }
    }
}