import BaseBoss from './base-boss.js';

export default class BossFour extends BaseBoss {
    constructor(scene, x, y, sides) {
        super(scene, x, y, sides, 16, 8); // 16 HP, deals 8 damage
        this.score = 225; // 225 points for defeating BossFour
        this.rotationSpeed = 0.025; // Base rotation speed
        
        // Use the main color from BaseBoss and derive other colors from it
        this.primaryColor = this.color;           // Main color based on sides
        this.secondaryColor = this.lightenColor(this.color, 40);  // Lighter variant
        this.warningColor = this.saturateColor(this.color, 60);   // More saturated variant for warnings
        this.impactColor = this.lightenColor(this.color, 80);     // Very light variant for impacts
        
        // Track active visual effects for proper cleanup
        this.activeEffects = [];
        
        // Initialize player tracking for direction prediction
        this.playerPositions = [];
    }
    
    // Helper method to create lighter/darker color variants
    lightenColor(color, percent) {
        const r = ((color >> 16) & 255) + percent;
        const g = ((color >> 8) & 255) + percent;
        const b = (color & 255) + percent;
        
        return ((r > 255 ? 255 : r) << 16) | 
               ((g > 255 ? 255 : g) << 8) | 
               (b > 255 ? 255 : b);
    }
    
    // Helper method to create a more saturated/intense version of a color
    saturateColor(color, percent) {
        // Extract RGB components
        const r = (color >> 16) & 255;
        const g = (color >> 8) & 255;
        const b = color & 255;
        
        // Find the dominant color channel
        const max = Math.max(r, g, b);
        
        // Increase the dominant channel and reduce others to create a more saturated effect
        let newR = r;
        let newG = g;
        let newB = b;
        
        if (max === r) {
            newR = Math.min(255, r + percent);
            newG = Math.max(0, g - percent/2);
            newB = Math.max(0, b - percent/2);
        } else if (max === g) {
            newR = Math.max(0, r - percent/2);
            newG = Math.min(255, g + percent);
            newB = Math.max(0, b - percent/2);
        } else {
            newR = Math.max(0, r - percent/2);
            newG = Math.max(0, g - percent/2);
            newB = Math.min(255, b + percent);
        }
        
        return (newR << 16) | (newG << 8) | newB;
    }
    
    update(time, delta, playerX, playerY) {
        // Call parent update for base behavior
        super.update(time, delta, playerX, playerY);
        
        // Track player position for direction prediction (store last 5 positions)
        this.trackPlayerPosition(playerX, playerY);
        
        // Add pulsating rotation that speeds up and slows down
        if (this.sprite && this.sprite.active) {
            // Calculate a pulsating rotation speed
            const pulseSpeed = Math.abs(Math.sin(time / 1000) * this.rotationSpeed * 2);
            this.sprite.rotation += pulseSpeed;
        }
        
        // Special attack - every 10 seconds (reduced from 15)
        if (!this.lastSpecialAttack || time - this.lastSpecialAttack > 10000) {
            this.startTeleportAttack(time, playerX, playerY);
        }
        
        // Update teleport if active
        if (this.inTeleportAttack && time < this.teleportEndTime) {
            this.updateTeleportAttack(time, playerX, playerY);
        } else if (time >= this.teleportEndTime && this.inTeleportAttack) {
            this.inTeleportAttack = false;
            this.sprite.lineStyle(2, 0x000000, 1);
            // Clean up any remaining effects
            this.clearVisualEffects();
        }
    }
    
    trackPlayerPosition(playerX, playerY) {
        // Add current position with timestamp
        this.playerPositions.push({
            x: playerX,
            y: playerY,
            time: this.scene.time.now
        });
        
        // Keep only the last 5 positions for movement prediction
        if (this.playerPositions.length > 5) {
            this.playerPositions.shift();
        }
    }
    
    predictPlayerPosition(lookAheadTime) {
        // If we don't have enough positions yet, return current position
        if (this.playerPositions.length < 2) {
            return {
                x: this.playerPositions[0].x,
                y: this.playerPositions[0].y
            };
        }
        
        // Get the two most recent positions
        const current = this.playerPositions[this.playerPositions.length - 1];
        const prev = this.playerPositions[this.playerPositions.length - 2];
        
        // Calculate velocity (pixels per millisecond)
        const dt = current.time - prev.time;
        if (dt <= 0) return current; // Avoid division by zero
        
        const vx = (current.x - prev.x) / dt;
        const vy = (current.y - prev.y) / dt;
        
        // Predict position after lookAheadTime milliseconds
        return {
            x: current.x + vx * lookAheadTime,
            y: current.y + vy * lookAheadTime
        };
    }
    
    startTeleportAttack(time, playerX, playerY) {
        // Clean up any active effects first
        this.clearVisualEffects();
        
        this.inTeleportAttack = true;
        this.lastSpecialAttack = time;
        this.teleportEndTime = time + 5000; // 5 seconds of teleport attack
        this.lastTeleportTime = 0;
        this.teleportInterval = 1200; // Teleport every 1.2 seconds
        this.teleportPhase = 'targeting'; // Start in targeting phase
        
        // Enhance boss appearance for teleport mode
        this.sprite.lineStyle(3, this.warningColor, 1);
        
        // Create initial effect
        this.createTeleportChargeEffect();
    }
    
    updateTeleportAttack(time, playerX, playerY) {
        // Initialize phase timing if not set
        if (!this.phaseStartTime) {
            this.phaseStartTime = time;
        }
        
        // Handle the current teleport phase
        switch (this.teleportPhase) {
            case 'targeting':
                this.updateTargetingPhase(time, playerX, playerY);
                break;
                
            case 'charging':
                this.updateChargingPhase(time, playerX, playerY);
                break;
                
            case 'teleporting':
                this.updateTeleportingPhase(time, playerX, playerY);
                break;
                
            case 'cooldown':
                this.updateCooldownPhase(time, playerX, playerY);
                break;
        }
    }
    
    updateTargetingPhase(time, playerX, playerY) {
        // In targeting phase, calculate where to teleport based on player movement
        const phaseDuration = 500; // 0.5 second targeting
        const progress = (time - this.phaseStartTime) / phaseDuration;
        
        if (progress >= 1) {
            // Move to charging phase
            this.teleportPhase = 'charging';
            this.phaseStartTime = time;
            
            // Predict where player will be in 1 second
            const prediction = this.predictPlayerPosition(1000);
            
            // Add some randomness to make it challenging but fair
            const randomOffset = Math.random() * 80 - 40;
            
            // Calculate teleport target position
            // Position in front of the player's predicted path
            this.teleportTargetX = prediction.x + randomOffset;
            this.teleportTargetY = prediction.y + randomOffset;
            
            // Create targeting indicator at teleport destination
            this.createTargetingIndicator();
            
            // Ensure the boss doesn't teleport off-screen
            this.constrainToScreen();
            
            // Visual effect for the charging phase
            this.sprite.lineStyle(3, this.secondaryColor, 1);
        }
    }
    
    updateChargingPhase(time, playerX, playerY) {
        // In charging phase, the boss "charges up" its teleport
        const phaseDuration = 800; // 0.8 seconds charging
        const progress = (time - this.phaseStartTime) / phaseDuration;
        
        // Make boss vibrate/pulse during charge
        if (this.sprite) {
            // Vibration increases as charge progresses
            const vibrationAmount = 2 * progress;
            const offsetX = (Math.random() * 2 - 1) * vibrationAmount;
            const offsetY = (Math.random() * 2 - 1) * vibrationAmount;
            
            this.sprite.body.setVelocity(offsetX * 10, offsetY * 10);
            
            // Pulse size effect
            const pulseScale = 1 + 0.1 * Math.sin(progress * Math.PI * 8);
            this.sprite.setScale(pulseScale);
            
            // Create charging particles
            if (Math.random() > 0.7) {
                this.createChargingParticle();
            }
        }
        
        if (progress >= 1) {
            // Move to teleporting phase
            this.teleportPhase = 'teleporting';
            this.phaseStartTime = time;
            
            // Visual indication for teleportation
            this.sprite.lineStyle(3, this.warningColor, 1);
            
            // Create teleport out effect
            this.createTeleportOutEffect();
        }
    }
    
    updateTeleportingPhase(time, playerX, playerY) {
        // In teleporting phase, the boss disappears and reappears
        const phaseDuration = 200; // 0.2 seconds teleporting
        const progress = (time - this.phaseStartTime) / phaseDuration;
        
        if (progress >= 0.5 && !this.hasTeleported) {
            // Actually move the boss to the new position at the mid-point
            this.sprite.x = this.teleportTargetX;
            this.sprite.y = this.teleportTargetY;
            this.hasTeleported = true;
            
            // Create teleport in effect
            this.createTeleportInEffect();
        }
        
        // Fade out/in effect
        if (progress < 0.5) {
            // Fade out
            this.sprite.alpha = 1 - progress * 2;
        } else {
            // Fade in
            this.sprite.alpha = (progress - 0.5) * 2;
        }
        
        // Freeze position during teleport
        this.sprite.body.setVelocity(0, 0);
        
        if (progress >= 1) {
            // Move to cooldown phase
            this.teleportPhase = 'cooldown';
            this.phaseStartTime = time;
            this.hasTeleported = false;
            
            // Reset alpha to ensure boss is fully visible
            this.sprite.alpha = 1;
            
            // Reset scale
            this.sprite.setScale(1);
            
            // Visual indication for cooldown
            this.sprite.lineStyle(3, this.primaryColor, 1);
        }
    }
    
    updateCooldownPhase(time, playerX, playerY) {
        // In cooldown phase, the boss recovers before next teleport
        const phaseDuration = 800; // 0.8 seconds cooldown
        const progress = (time - this.phaseStartTime) / phaseDuration;
        
        if (progress >= 1) {
            // Start the cycle again with targeting
            this.teleportPhase = 'targeting';
            this.phaseStartTime = time;
        }
    }
    
    constrainToScreen() {
        // Ensure the teleport target is within screen bounds
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        const margin = 100; // Stay away from absolute edges
        
        this.teleportTargetX = Math.max(margin, Math.min(width - margin, this.teleportTargetX));
        this.teleportTargetY = Math.max(margin, Math.min(height - margin, this.teleportTargetY));
    }
    
    createTeleportChargeEffect() {
        // Create a pulsing aura effect
        const aura = this.scene.add.graphics();
        aura.fillStyle(this.primaryColor, 0.3);
        aura.fillCircle(0, 0, this.size * 1.5);
        aura.x = this.sprite.x;
        aura.y = this.sprite.y;
        
        this.activeEffects.push(aura);
        
        // Pulse animation
        this.scene.tweens.add({
            targets: aura,
            scale: { from: 0.8, to: 1.3 },
            alpha: { from: 0.3, to: 0.1 },
            duration: 600,
            yoyo: true,
            repeat: 1,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                const index = this.activeEffects.indexOf(aura);
                if (index > -1) {
                    this.activeEffects.splice(index, 1);
                }
                aura.destroy();
            }
        });
    }
    
    createTargetingIndicator() {
        // Create a targeting indicator at the teleport destination
        const target = this.scene.add.graphics();
        
        // Draw main target circle
        target.lineStyle(2, this.warningColor, 0.7);
        target.strokeCircle(0, 0, this.size + 5);
        
        // Draw crosshair lines
        target.lineStyle(1, this.warningColor, 0.6);
        const size = this.size + 15;
        target.moveTo(-size, 0);
        target.lineTo(size, 0);
        target.moveTo(0, -size);
        target.lineTo(0, size);
        
        // Position at teleport target
        target.x = this.teleportTargetX;
        target.y = this.teleportTargetY;
        
        this.activeEffects.push(target);
        this.targetIndicator = target;
        
        // Pulse animation
        this.scene.tweens.add({
            targets: target,
            scale: { from: 0.7, to: 1.1 },
            alpha: { from: 0.7, to: 0.3 },
            duration: 400,
            yoyo: true,
            repeat: 2,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                const index = this.activeEffects.indexOf(target);
                if (index > -1) {
                    this.activeEffects.splice(index, 1);
                }
                if (this.targetIndicator === target) {
                    this.targetIndicator = null;
                }
                target.destroy();
            }
        });
    }
    
    createChargingParticle() {
        // Create a small particle that converges on the boss during charging
        const particle = this.scene.add.graphics();
        
        // Random color between primary and warning
        const useWarning = Math.random() > 0.5;
        const color = useWarning ? this.warningColor : this.primaryColor;
        
        // Draw the particle
        particle.fillStyle(color, 0.6);
        particle.fillCircle(0, 0, 3);
        
        // Random position around the boss
        const angle = Math.random() * Math.PI * 2;
        const distance = this.size * 3 + Math.random() * this.size * 2;
        particle.x = this.sprite.x + Math.cos(angle) * distance;
        particle.y = this.sprite.y + Math.sin(angle) * distance;
        
        this.activeEffects.push(particle);
        
        // Converge animation
        this.scene.tweens.add({
            targets: particle,
            x: this.sprite.x,
            y: this.sprite.y,
            scale: { from: 1, to: 0.5 },
            alpha: { from: 0.6, to: 0 },
            duration: 400,
            ease: 'Cubic.easeIn',
            onComplete: () => {
                const index = this.activeEffects.indexOf(particle);
                if (index > -1) {
                    this.activeEffects.splice(index, 1);
                }
                particle.destroy();
            }
        });
    }
    
    createTeleportOutEffect() {
        // Create teleport-out effect at current position
        const flash = this.scene.add.graphics();
        flash.fillStyle(this.impactColor, 0.7);
        flash.fillCircle(0, 0, this.size * 1.5);
        flash.x = this.sprite.x;
        flash.y = this.sprite.y;
        
        this.activeEffects.push(flash);
        
        // Flash animation
        this.scene.tweens.add({
            targets: flash,
            scale: { from: 0.5, to: 1.5 },
            alpha: { from: 0.7, to: 0 },
            duration: 300,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                const index = this.activeEffects.indexOf(flash);
                if (index > -1) {
                    this.activeEffects.splice(index, 1);
                }
                flash.destroy();
            }
        });
    }
    
    createTeleportInEffect() {
        // Create teleport-in effect at target position
        const flash = this.scene.add.graphics();
        flash.fillStyle(this.impactColor, 0.7);
        flash.fillCircle(0, 0, this.size * 1.5);
        flash.x = this.teleportTargetX;
        flash.y = this.teleportTargetY;
        
        this.activeEffects.push(flash);
        
        // Flash animation
        this.scene.tweens.add({
            targets: flash,
            scale: { from: 1.5, to: 0.5 },
            alpha: { from: 0.7, to: 0 },
            duration: 300,
            ease: 'Cubic.easeIn',
            onComplete: () => {
                const index = this.activeEffects.indexOf(flash);
                if (index > -1) {
                    this.activeEffects.splice(index, 1);
                }
                flash.destroy();
            }
        });
        
        // Add some particles for extra effect
        this.createTeleportParticles();
    }
    
    createTeleportParticles() {
        // Create particles that burst outward from teleport-in point
        const count = 8;
        
        for (let i = 0; i < count; i++) {
            const particle = this.scene.add.graphics();
            
            // Alternate between primary and secondary color
            const color = i % 2 === 0 ? this.primaryColor : this.secondaryColor;
            
            // Draw the particle
            particle.fillStyle(color, 0.6);
            particle.fillCircle(0, 0, 4);
            
            // Position at teleport target
            particle.x = this.teleportTargetX;
            particle.y = this.teleportTargetY;
            
            this.activeEffects.push(particle);
            
            // Calculate burst direction
            const angle = (i / count) * Math.PI * 2;
            const targetX = this.teleportTargetX + Math.cos(angle) * this.size * 3;
            const targetY = this.teleportTargetY + Math.sin(angle) * this.size * 3;
            
            // Burst animation
            this.scene.tweens.add({
                targets: particle,
                x: targetX,
                y: targetY,
                scale: { from: 1, to: 0.5 },
                alpha: { from: 0.6, to: 0 },
                duration: 500,
                ease: 'Cubic.easeOut',
                onComplete: () => {
                    const index = this.activeEffects.indexOf(particle);
                    if (index > -1) {
                        this.activeEffects.splice(index, 1);
                    }
                    particle.destroy();
                }
            });
        }
    }
    
    clearVisualEffects() {
        // Clear any targeting indicator
        if (this.targetIndicator) {
            this.scene.tweens.killTweensOf(this.targetIndicator);
            this.targetIndicator.destroy();
            this.targetIndicator = null;
        }
        
        // Clean up all active effects
        this.activeEffects.forEach(effect => {
            if (effect && effect.active) {
                this.scene.tweens.killTweensOf(effect);
                effect.destroy();
            }
        });
        this.activeEffects = [];
    }
    
    // Override the cleanupEffects method to handle teleport attack effects
    cleanupEffects() {
        // Special cleanup for teleport attack
        if (this.inTeleportAttack) {
            // Reset teleport attack state
            this.inTeleportAttack = false;
            this.teleportPhase = null;
            this.teleportEndTime = 0;
            
            // If teleporting when defeated, create a special effect
            if (this.teleportPhase === 'teleporting' && this.sprite) {
                // Create a dramatic teleport interruption effect
                const disruptEffect = this.scene.add.graphics();
                disruptEffect.fillStyle(this.warningColor, 0.6);
                disruptEffect.fillCircle(0, 0, this.size * 2);
                
                disruptEffect.x = this.sprite.x;
                disruptEffect.y = this.sprite.y;
                
                // Quick pulse and fade
                this.scene.tweens.add({
                    targets: disruptEffect,
                    scale: { from: 0.5, to: 1.5 },
                    alpha: { from: 0.6, to: 0 },
                    duration: 400,
                    ease: 'Cubic.easeOut',
                    onComplete: () => disruptEffect.destroy()
                });
            }
            
            // Reset visual properties
            if (this.sprite) {
                this.sprite.setScale(1);
                this.sprite.alpha = 1;
                this.sprite.lineStyle(2, 0x000000, 1);
            }
        }
        
        // Clear targeting indicator
        if (this.targetIndicator) {
            if (this.scene && this.scene.tweens) {
                this.scene.tweens.killTweensOf(this.targetIndicator);
            }
            this.targetIndicator.destroy();
            this.targetIndicator = null;
        }
        
        // Clean up all active effects with a special transition
        if (this.activeEffects && this.activeEffects.length > 0) {
            const effectsToClean = [...this.activeEffects]; // Clone array to avoid modification issues
            
            effectsToClean.forEach(effect => {
                if (effect && effect.active) {
                    // Kill any existing tweens
                    if (this.scene && this.scene.tweens) {
                        this.scene.tweens.killTweensOf(effect);
                    }
                    
                    // Create a quick fade-out for a smoother transition
                    this.scene.tweens.add({
                        targets: effect,
                        alpha: 0,
                        scale: 0.5,
                        duration: 200,
                        ease: 'Cubic.easeOut',
                        onComplete: () => {
                            // Remove from the array if it's still there
                            const index = this.activeEffects.indexOf(effect);
                            if (index > -1) {
                                this.activeEffects.splice(index, 1);
                            }
                            effect.destroy();
                        }
                    });
                }
            });
        }
        
        // Call parent method to handle common cleanup
        super.cleanupEffects();
    }

    // Override destroy method to properly clean up
    destroy() {
        // Clean up all effects first
        this.cleanupEffects();
        
        // Call parent destroy
        super.destroy();
    }
}