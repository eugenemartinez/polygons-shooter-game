export default class VirtualJoystick {
    constructor(scene, x, y, size) {
        this.scene = scene;
        this.size = size || 100;
        
        // Default position (will be updated on touch)
        this.baseX = x;
        this.baseY = y;
        this.deltaX = 0;
        this.deltaY = 0;
        this.isActive = false;
        this.touchId = null;
        
        // Create base and stick graphics - initially hidden
        this.base = this.scene.add.circle(x, y, this.size / 2, 0x000000, 0.5)
            .setScrollFactor(0)
            .setDepth(100)
            .setVisible(false);
            
        this.stick = this.scene.add.circle(x, y, this.size / 4, 0xcccccc, 0.8)
            .setScrollFactor(0)
            .setDepth(101)
            .setVisible(false);
        
        // Border for better visibility
        this.border = this.scene.add.circle(x, y, this.size / 2, 0xffffff)
            .setScrollFactor(0)
            .setDepth(99)
            .setStrokeStyle(2, 0xffffff, 0.8)
            .setFillStyle(0x000000, 0.1)
            .setVisible(false);
        
        // Only enable on touch devices
        const isTabletOrMobile = this.scene.scale.width < 1024;
        if (isTabletOrMobile) {
            this.setupTouchInteraction();
        }
    }
    
    setupTouchInteraction() {
        // Store event handlers for later removal
        this.pointerDownHandler = (pointer) => {
            if (pointer.y > this.scene.cameras.main.height / 2) {
                this.touchId = pointer.id;
                this.activateJoystick(pointer.x, pointer.y);
            }
        };
        
        this.pointerMoveHandler = (pointer) => {
            if (this.isActive && pointer.id === this.touchId) {
                this.moveStick(pointer.x, pointer.y);
            }
        };
        
        this.pointerUpHandler = (pointer) => {
            if (this.isActive && pointer.id === this.touchId) {
                this.deactivateJoystick();
            }
        };
        
        this.pointerOutHandler = (pointer) => {
            if (this.isActive && pointer.id === this.touchId) {
                this.deactivateJoystick();
            }
        };
        
        // Add event listeners
        this.scene.input.on('pointerdown', this.pointerDownHandler, this);
        this.scene.input.on('pointermove', this.pointerMoveHandler, this);
        this.scene.input.on('pointerup', this.pointerUpHandler, this);
        this.scene.input.on('pointerout', this.pointerOutHandler, this);
    }
    
    activateJoystick(x, y) {
        // Position joystick at touch point
        this.baseX = x;
        this.baseY = y;
        
        // Position visuals
        this.base.setPosition(x, y);
        this.stick.setPosition(x, y);
        this.border.setPosition(x, y);
        
        // Show joystick
        this.base.setVisible(true);
        this.stick.setVisible(true);
        this.border.setVisible(true);
        
        // Mark as active
        this.isActive = true;
    }
    
    moveStick(x, y) {
        // Calculate distance from base center
        const distance = Phaser.Math.Distance.Between(this.baseX, this.baseY, x, y);
        
        // Constrain movement within joystick radius
        const maxDistance = this.size / 2;
        const angle = Phaser.Math.Angle.Between(this.baseX, this.baseY, x, y);
        
        if (distance <= maxDistance) {
            this.stick.x = x;
            this.stick.y = y;
        } else {
            this.stick.x = this.baseX + Math.cos(angle) * maxDistance;
            this.stick.y = this.baseY + Math.sin(angle) * maxDistance;
        }
        
        // Calculate normalized vector for movement
        const distRatio = Math.min(distance / maxDistance, 1);
        this.deltaX = Math.cos(angle) * distRatio;
        this.deltaY = Math.sin(angle) * distRatio;
    }
    
    deactivateJoystick() {
        // Reset stick
        this.resetStick();
        
        // Hide joystick
        this.base.setVisible(false);
        this.stick.setVisible(false);
        this.border.setVisible(false);
        
        // Mark as inactive
        this.isActive = false;
        this.touchId = null;
    }
    
    resetStick() {
        this.stick.x = this.baseX;
        this.stick.y = this.baseY;
        this.deltaX = 0;
        this.deltaY = 0;
    }
    
    getMovement() {
        return {
            x: this.deltaX,
            y: this.deltaY
        };
    }

    shutdown() {
        // Remove event listeners
        this.scene.input.off('pointerdown', this.pointerDownHandler, this);
        this.scene.input.off('pointermove', this.pointerMoveHandler, this);
        this.scene.input.off('pointerup', this.pointerUpHandler, this);
        this.scene.input.off('pointerout', this.pointerOutHandler, this);
        
        // Destroy joystick graphics
        this.base.destroy();
        this.stick.destroy();
        this.border.destroy();
        
        // Null out references
        this.base = null;
        this.stick = null;
        this.border = null;
        this.scene = null;
    }
}