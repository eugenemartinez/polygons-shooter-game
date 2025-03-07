/**
 * Game stats display for the Polygons Survivor game
 * Shows HP, score, and time spent during the current game session
 */
export default class GameStats {
    constructor(scene, initialHP = 100, initialScore = 0) {
        this.scene = scene;
        this.hp = initialHP;
        this.maxHp = initialHP;
        this.score = initialScore;
        this.startTime = 0;
        this.elapsedTime = 0;
        
        // Style configuration for stats text
        this.textStyle = {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#000000',
                blur: 2,
                stroke: true,
                fill: true
            }
        };
        
        // Create UI elements
        this.createUI();
        
        // Start the timer update
        this.startTimer();
    }
    
    startTimer() {
        this.startTime = this.scene.time.now;
        
        // Start the timer update
        this.timerEvent = this.scene.time.addEvent({
            delay: 1000, // Update every second
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }
    
    createUI() {
        const margin = 20;
        
        // Create container for stats
        this.container = this.scene.add.container(margin, margin);
        this.container.setScrollFactor(0); // Fixed position (doesn't move with camera)
        
        // Create HP bar background
        this.hpBarBackground = this.scene.add.rectangle(0, 0, 200, 20, 0x333333);
        this.hpBarBackground.setOrigin(0, 0);
        
        // Create HP bar foreground
        this.hpBar = this.scene.add.rectangle(0, 0, 200, 20, 0xff0000);
        this.hpBar.setOrigin(0, 0);
        
        // Create HP text
        this.hpText = this.scene.add.text(
            100, 10, 
            `HP: ${this.hp}/${this.maxHp}`, 
            { ...this.textStyle, fontSize: '14px' }
        );
        this.hpText.setOrigin(0.5, 0.5);
        
        // Create score text
        this.scoreText = this.scene.add.text(
            0, 30, 
            `Score: ${this.score}`, 
            this.textStyle
        );
        this.scoreText.setOrigin(0, 0);
        
        // Create timer text
        this.timerText = this.scene.add.text(
            0, 60, 
            `Time: 00:00`, 
            this.textStyle
        );
        this.timerText.setOrigin(0, 0);
        
        // Add all elements to the container
        this.container.add([
            this.hpBarBackground, 
            this.hpBar, 
            this.hpText, 
            this.scoreText, 
            this.timerText
        ]);
        
        // Ensure stats are always on top
        this.container.setDepth(1000);
    }
    
    updateHP(newHP) {
        this.hp = Math.max(0, Math.min(newHP, this.maxHp)); // Clamp between 0 and maxHp
        
        // Update HP bar width based on current HP percentage
        const hpPercentage = this.hp / this.maxHp;
        this.hpBar.width = 200 * hpPercentage;
        
        // Update HP text
        this.hpText.setText(`HP: ${this.hp}/${this.maxHp}`);
        
        // Change HP bar color based on health remaining
        if (hpPercentage > 0.6) {
            this.hpBar.fillColor = 0x00ff00; // Green for high health
        } else if (hpPercentage > 0.3) {
            this.hpBar.fillColor = 0xffff00; // Yellow for medium health
        } else {
            this.hpBar.fillColor = 0xff0000; // Red for low health
        }
    }
    
    updateScore(newScore) {
        this.score = newScore;
        this.scoreText.setText(`Score: ${this.score}`);
    }
    
    updateTimer() {
        this.elapsedTime = Math.floor((this.scene.time.now - this.startTime) / 1000);
        const minutes = Math.floor(this.elapsedTime / 60);
        const seconds = this.elapsedTime % 60;
        
        // Format time as MM:SS
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.timerText.setText(`Time: ${formattedTime}`);
    }
    
    // Method to be called when game is over to stop the timer
    stopTimer() {
        if (this.timerEvent) {
            this.timerEvent.remove();
        }
    }
    
    // Reset stats for new game
    reset(initialHP = 100, initialScore = 0) {
        this.hp = initialHP;
        this.maxHp = initialHP;
        this.score = initialScore;
        this.startTime = this.scene.time.now;
        this.elapsedTime = 0;
        
        this.updateHP(this.hp);
        this.updateScore(this.score);
        this.updateTimer();
    }
    
    // Get current game stats
    getStats() {
        return {
            hp: this.hp,
            maxHp: this.maxHp,
            score: this.score,
            elapsedTime: this.elapsedTime
        };
    }
}