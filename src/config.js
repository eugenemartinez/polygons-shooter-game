import { AutoShooterGame } from "./classes/Game.js";

// /src/config.js
export const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,  // Adjust to fit window size
    height: window.innerHeight, // Adjust to fit window size
    physics: {
        default: "arcade",
        arcade: {
            debug: false // Set to true for debugging
        }
    },
    scene: AutoShooterGame // This points to your game scene (the class that handles the game logic)
};