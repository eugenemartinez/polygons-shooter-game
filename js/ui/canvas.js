/**
 * Canvas configuration for the Polygons Survivor game
 * Handles responsive canvas setup and background styling
 */
export default class GameCanvas {
    constructor() {
        // Use clientWidth/Height instead of innerWidth/Height to avoid scrollbars
        this.width = document.documentElement.clientWidth;
        this.height = document.documentElement.clientHeight;
        this.backgroundColor = '#1a1a2e'; // Dark blue background
        
        // Prevent page scrolling
        this.preventScrolling();
    }

    // Get canvas configuration for Phaser
    getConfig() {
        return {
            type: Phaser.AUTO,
            width: this.width,
            height: this.height,
            backgroundColor: this.backgroundColor,
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0 }, // No gravity for top-down game
                    debug: false // Set to true to see collision bodies
                }
            },
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                parent: 'game-container',
                width: this.width,
                height: this.height
            },
            pixelArt: true,
            roundPixels: true
        };
    }
    
    // Initialize the game and handle all canvas-related setup
    initGame() {
        // Initialize Phaser with the canvas configuration
        const game = new Phaser.Game(this.getConfig());
        
        // Make game instance available globally (for the resize listener)
        window.game = game;
        
        // Setup resize listener to handle window size changes
        this.setupResizeListener();
        
        return game;
    }
    
    // Update canvas dimensions on window resize
    setupResizeListener() {
        window.addEventListener('resize', () => {
            if (window.game) {
                const newWidth = document.documentElement.clientWidth;
                const newHeight = document.documentElement.clientHeight;
                
                // Update local dimensions
                this.width = newWidth;
                this.height = newHeight;
                
                // Resize the game
                window.game.scale.resize(newWidth, newHeight);
            }
        });
    }
    
    // Prevent scrolling on the page
    preventScrolling() {
        // Add CSS to prevent scrolling
        const style = document.createElement('style');
        style.textContent = `
            html, body {
                margin: 0;
                padding: 0;
                overflow: hidden;
                width: 100%;
                height: 100%;
            }
            #game-container {
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
            }
        `;
        document.head.appendChild(style);
        
        // Create a container for the game if it doesn't exist
        if (!document.getElementById('game-container')) {
            const container = document.createElement('div');
            container.id = 'game-container';
            document.body.appendChild(container);
        }
    }
    
    // Get canvas dimensions
    getDimensions() {
        return {
            width: this.width,
            height: this.height
        };
    }
}