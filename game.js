import GameCanvas from './js/ui/canvas.js';
import GameScene from './js/scenes/game-scene.js';
import TitleScene from './js/scenes/title-scene.js';
import GameOverScene from './js/scenes/game-over-scene.js';

// Initialize the canvas and game
const gameCanvas = new GameCanvas();

// Get config with physics added
const config = gameCanvas.getConfig();

// Add global physics configuration to the config
config.physics = {
    default: 'arcade',
    arcade: {
        gravity: { y: 0 },
        debug: false
    }
};

// Initialize the game with the enhanced config
const game = new Phaser.Game(config);

// Make game instance available globally (for the resize listener)
window.game = game;

// Setup resize listener to handle window size changes
gameCanvas.setupResizeListener();

// Register game scenes
game.scene.add('TitleScene', TitleScene);
game.scene.add('GameScene', GameScene);
game.scene.add('GameOverScene', GameOverScene);

// Start with the title scene instead of the game scene
game.scene.start('TitleScene');