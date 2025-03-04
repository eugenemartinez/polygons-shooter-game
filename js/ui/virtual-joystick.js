export default class VirtualJoystick {
    constructor(scene, x, y, size) {
        this.scene = scene;
        this.size = size || 100;
        
        // Create base and stick graphics
        this.base = this.scene.add.circle(x, y, this.size / 2, 0x000000, 0.5).setScrollFactor(0).setDepth(100);
        this.stick = this.scene.add.circle(x, y, this.size / 4, 0xcccccc, 0.8).setScrollFactor(0).setDepth(101);
        
        // Border for better visibility
        this.border = this.scene.add.circle(x, y, this.size / 2, 0xffffff).setScrollFactor(0).setDepth(99);
        this.border.setStrokeStyle(2, 0xffffff, 0.8);
        this.border.setFillStyle(0x000000, 0.1);
        
        // Initialize position and movement values
        this.baseX = x;
        this.baseY = y;
        this.deltaX = 0;
        this.deltaY = 0;
        
        // Set up interactivity and drag
        this.setupInteraction();
        
        // Make visible only on touch devices
        const isTabletOrMobile = this.scene.scale.width < 1024;
        this.setVisible(isTabletOrMobile);
    }
    
    setupInteraction() {
        // Make stick draggable
        this.stick.setInteractive();
        this.scene.input.setDraggable(this.stick);
        
        // Handle drag
        this.scene.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            if (gameObject !== this.stick) return;
            
            // Calculate distance from base center
            const distance = Phaser.Math.Distance.Between(this.baseX, this.baseY, dragX, dragY);
            
            // Constrain movement within joystick radius
            const maxDistance = this.size / 2;
            const angle = Phaser.Math.Angle.Between(this.baseX, this.baseY, dragX, dragY);
            
            if (distance <= maxDistance) {
                this.stick.x = dragX;
                this.stick.y = dragY;
            } else {
                this.stick.x = this.baseX + Math.cos(angle) * maxDistance;
                this.stick.y = this.baseY + Math.sin(angle) * maxDistance;
            }
            
            // Calculate normalized vector for movement
            const distRatio = Math.min(distance / maxDistance, 1);
            this.deltaX = Math.cos(angle) * distRatio;
            this.deltaY = Math.sin(angle) * distRatio;
        });
        
        // Reset on pointer up
        this.scene.input.on('pointerup', () => {
            this.resetStick();
        });
    }
    
    resetStick() {
        this.stick.x = this.baseX;
        this.stick.y = this.baseY;
        this.deltaX = 0;
        this.deltaY = 0;
    }
    
    update() {
        // Nothing to update continuously, movement is handled via events
    }
    
    setVisible(visible) {
        this.base.setVisible(visible);
        this.stick.setVisible(visible);
        this.border.setVisible(visible);
    }
    
    getMovement() {
        return {
            x: this.deltaX,
            y: this.deltaY
        };
    }
}