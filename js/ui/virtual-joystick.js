export default class VirtualJoystick {
    constructor(scene, size) {
        this.scene = scene;
        this.size = size || 100;
        
        // Create base and stick graphics
        this.base = this.scene.add.circle(0, 0, this.size / 2, 0x000000, 0.5).setScrollFactor(0).setDepth(100).setVisible(false);
        this.stick = this.scene.add.circle(0, 0, this.size / 4, 0xcccccc, 0.8).setScrollFactor(0).setDepth(101).setVisible(false);
        
        // Border for better visibility
        this.border = this.scene.add.circle(0, 0, this.size / 2, 0xffffff).setScrollFactor(0).setDepth(99).setVisible(false);
        this.border.setStrokeStyle(2, 0xffffff, 0.8);
        this.border.setFillStyle(0x000000, 0.1);
        
        // Initialize position and movement values
        this.baseX = 0;
        this.baseY = 0;
        this.deltaX = 0;
        this.deltaY = 0;
        
        // Set up interactivity and drag
        this.setupInteraction();
        
        // Make visible only on touch devices
        const isTabletOrMobile = this.scene.scale.width < 1024;
        this.setVisible(isTabletOrMobile);
        
        // Allow joystick to appear on touch within the bottom half of the screen
        if (isTabletOrMobile) {
            this.setupTouchEvents();
        }
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
            this.setVisible(false);
        });
    }
    
    setupTouchEvents() {
        this.scene.input.on('pointerdown', (pointer) => {
            const screenHeight = this.scene.scale.height;
            const bottomHalfY = screenHeight / 2;
            
            if (pointer.y >= bottomHalfY) {
                this.baseX = pointer.x;
                this.baseY = pointer.y;
                
                this.base.setPosition(this.baseX, this.baseY).setVisible(true);
                this.stick.setPosition(this.baseX, this.baseY).setVisible(true);
                this.border.setPosition(this.baseX, this.baseY).setVisible(true);
                
                // Make the stick immediately usable
                this.stick.setInteractive();
                this.scene.input.setDraggable(this.stick);
                this.scene.input.dragDistanceThreshold = 0; // Ensure immediate drag
                
                // Simulate drag start to make it usable immediately
                this.scene.input.emit('dragstart', pointer, this.stick);
            }
        });
        
        this.scene.input.on('pointerup', () => {
            this.resetStick();
            this.setVisible(false);
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