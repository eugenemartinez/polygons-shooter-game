import BaseBoss from './base-boss.js';

export default class BossTwo extends BaseBoss {
    constructor(scene, x, y, sides) {
        super(scene, x, y, sides, 12, 6); // 12 HP, deals 6 damage
        this.score = 150; // 150 points for defeating BossTwo
        this.rotationSpeed = -0.015; // Counter-clockwise rotation
        
        // Use the main color from BaseBoss and derive other colors from it
        this.primaryColor = this.color;           // Main color based on sides
        this.secondaryColor = this.lightenColor(this.color, 40);  // Lighter variant
        this.warningColor = this.saturateColor(this.color, 60);   // More saturated variant for warnings
        this.impactColor = this.lightenColor(this.color, 80);     // Very light variant for impacts
        
        // Track active trail particles for proper cleanup
        this.activeTrails = [];
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
        const g = ((color >> 8) & 255);
        const b = (color & 255);
        
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
        
        // Add rotation with occasional direction change
        if (this.sprite && this.sprite.active) {
            // Initialize phase if not set
            if (!this.rotationPhase) {
                this.rotationPhase = 0;
            }
            
            this.rotationPhase += 0.005;
            
            // Change rotation direction with a sine wave pattern
            this.sprite.rotation += this.rotationSpeed * Math.sin(this.rotationPhase);
        }
        
        // Special attack - every 10 seconds
        if (!this.lastSpecialAttack || time - this.lastSpecialAttack > 10000) {
            this.performOrbitalAttack(time, playerX, playerY);
        }
        
        // Update orbital attack if active
        if (this.inOrbitalAttack && time < this.orbitalEndTime) {
            this.updateOrbitalAttack(time, playerX, playerY);
        } else if (time >= this.orbitalEndTime && this.inOrbitalAttack) {
            // End attack
            this.inOrbitalAttack = false;
            this.orbitalPhase = 'idle';
            this.sprite.lineStyle(2, 0x000000, 1);
            
            // Reset any visual effects
            this.sprite.scale = 1;
            
            // Clear any remaining visual indicators
            this.clearVisualEffects();
        }
        
        // No need to clean up orbit indicator since we're not using it anymore
    }
    
    // Add a new method to centralize all visual effects cleanup
    clearVisualEffects() {
        // Clean up any active trails
        if (this.activeTrails) {
            this.activeTrails.forEach(trail => {
                if (trail && trail.active) {
                    this.scene.tweens.killTweensOf(trail);
                    trail.destroy();
                }
            });
            this.activeTrails = [];
        }
        
        // Make sure we stop any active tweens on the targetLine before destroying it
        if (this.targetLine) {
            this.scene.tweens.killTweensOf(this.targetLine);
            
            // Also kill tweens on any children
            this.targetLine.getAll().forEach(child => {
                this.scene.tweens.killTweensOf(child);
            });
            
            this.targetLine.destroy();
            this.targetLine = null;
        }
        
        // Clear references
        this.targetReticle = null;
        this.targetDots = [];
    }
    
    // Make sure to clear indicators when boss is destroyed
    destroy() {
        // Clear any visual effects
        this.clearVisualEffects();
        
        // Call parent destroy if it exists
        if (super.destroy) {
            super.destroy();
        }
    }
    
    // Make sure arrows are cleaned up when boss takes damage
    takeDamage(amount) {
        // Clean up visuals when damaged as a safeguard
        this.clearVisualEffects();
        
        // Call parent method if it exists
        if (super.takeDamage) {
            return super.takeDamage(amount);
        }
        return false;
    }
    
    performOrbitalAttack(time, playerX, playerY) {
        this.inOrbitalAttack = true;
        this.lastSpecialAttack = time;
        this.orbitalEndTime = time + 6500; // 6.5 seconds of orbital attack
        this.orbitAngle = 0;
        this.orbitRadius = 250; // Starting orbit distance
        this.orbitSpeed = 0.05; // Base orbit speed
        this.orbitalPhase = 'approach'; // Start with approach phase
        this.lastPhaseChange = time;
        this.dashPrepped = false;
        
        // Visual indicator for special attack - use primary color
        this.sprite.lineStyle(4, this.primaryColor, 1);
        
        // Starting visual effect - pulse scale
        this.scene.tweens.add({
            targets: this.sprite,
            scale: { from: 1, to: 1.3 },
            duration: 300,
            yoyo: true,
            ease: 'Cubic.easeOut'
        });
    }
    
    updateOrbitalAttack(time, playerX, playerY) {
        // Clean up at the beginning of every update as a safety measure
        if (this.orbitalPhase !== 'prep_dash' && this.targetLine) {
            this.clearVisualEffects();
        }
        
        // Phase management
        switch(this.orbitalPhase) {
            case 'approach':
                // Approach the player to start orbiting
                this.approachPlayer(time, playerX, playerY);
                
                // Leave approach trail using primary color
                if (Math.random() > 0.8) {
                    this.createTrailEffect(this.primaryColor, 0.3);
                }
                break;
                
            case 'orbit':
                // Standard orbiting behavior
                this.orbitPlayer(time, playerX, playerY);
                
                // Leave orbit trail
                if (Math.random() > 0.7) {
                    this.createTrailEffect(this.secondaryColor, 0.4);
                }
                
                // Randomly change to dash phase
                if (time - this.lastPhaseChange > 2000 && Math.random() < 0.1) {
                    this.orbitalPhase = 'prep_dash';
                    this.lastPhaseChange = time;
                    this.sprite.lineStyle(4, this.warningColor, 1); // Warning color for dash
                    
                    // Add a dramatic rotation burst
                    this.scene.tweens.add({
                        targets: this.sprite,
                        rotation: this.sprite.rotation + Math.PI * 2,
                        duration: 600,
                        ease: 'Cubic.easeInOut'
                    });
                }
                break;
                
            case 'prep_dash':
                // Briefly pause and flash before dashing
                if (!this.dashPrepped) {
                    // Clean up any existing indicator first
                    this.clearVisualEffects();
                    
                    // Flash effect
                    this.scene.tweens.add({
                        targets: this.sprite,
                        alpha: { from: 1, to: 0.3 },
                        yoyo: true,
                        duration: 200,
                        repeat: 2
                    });
                    
                    // Scale effect
                    this.scene.tweens.add({
                        targets: this.sprite,
                        scale: { from: 1, to: 1.4 },
                        duration: 600,
                        ease: 'Back.easeIn'
                    });
                    
                    this.dashPrepped = true;
                    this.dashPrepEndTime = time + 600; // Prep for 0.6 seconds
                    
                    // Initialize tracking variables
                    this.dashMaxDuration = 1500; // Maximum tracking duration (1.5 seconds)
                    this.dashStartTime = 0; // Will be set when dash actually starts
                    
                    // Create a tracking indicator instead of a directional arrow
                    this.createTargetingIndicator(playerX, playerY);
                }
                
                // Hold position with slight vibration
                const vibrationAmount = 3;
                const offsetX = Math.random() * vibrationAmount - vibrationAmount/2;
                const offsetY = Math.random() * vibrationAmount - vibrationAmount/2;
                this.sprite.body.setVelocity(offsetX * 5, offsetY * 5);
                
                // Update the reticle to follow the player - IMPROVED VERSION
                if (this.targetLine && this.targetReticle) {
                    // Update reticle position to track player
                    this.targetReticle.x = playerX - this.sprite.x;
                    this.targetReticle.y = playerY - this.sprite.y;
                    
                    // Also update the connecting dots
                    this.updateTargetingDots(playerX, playerY);
                }
                
                // Move to dash phase after prep
                if (time > this.dashPrepEndTime) {
                    this.orbitalPhase = 'dash';
                    this.lastPhaseChange = time;
                    this.dashStartTime = time; // Mark when the dash starts
                    
                    // Clear targeting indicator
                    this.clearVisualEffects();
                    
                    // Reset scale for dash
                    this.scene.tweens.add({
                        targets: this.sprite,
                        scale: 1,
                        duration: 100
                    });
                }
                break;
                
            case 'dash':
                // Check if we've exceeded maximum dash duration
                if (time - this.dashStartTime > this.dashMaxDuration) {
                    // End dash if it's gone on too long
                    this.orbitalPhase = 'orbit';
                    this.lastPhaseChange = time;
                    this.sprite.lineStyle(4, this.primaryColor, 1);
                    
                    // Reverse orbit direction
                    this.orbitSpeed = -this.orbitSpeed;
                    
                    // Adjust radius for variety
                    this.orbitRadius = Math.max(150, Math.min(300, this.orbitRadius + Math.random() * 100 - 50));
                    
                    // Visual impact effect
                    this.createImpactEffect();
                    break;
                }
                
                // Calculate direction to current player position (tracking)
                const dx = playerX - this.sprite.x;
                const dy = playerY - this.sprite.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Check if we're very close to the player
                if (distance < 10) {
                    // We've reached the player, end dash
                    this.orbitalPhase = 'orbit';
                    this.lastPhaseChange = time;
                    this.sprite.lineStyle(4, this.primaryColor, 1);
                    
                    // Reverse orbit direction
                    this.orbitSpeed = -this.orbitSpeed;
                    
                    // Adjust radius for variety
                    this.orbitRadius = Math.max(150, Math.min(300, this.orbitRadius + Math.random() * 100 - 50));
                    
                    // Visual impact effect
                    this.createImpactEffect();
                } else {
                    // Still tracking the player
                    // Speed decreases over time to give player chance to escape
                    const elapsedTime = time - this.dashStartTime;
                    const speedFactor = Math.max(2.5, 4.0 - (elapsedTime / this.dashMaxDuration) * 1.5);
                    const speed = this.speed * speedFactor;
                    
                    const vx = (dx / distance) * speed;
                    const vy = (dy / distance) * speed;
                    this.sprite.body.setVelocity(vx, vy);
                    
                    // Create dash trail
                    this.createTrailArrow(dx/distance, dy/distance);
                }
                break;
        }
    }
    
    approachPlayer(time, playerX, playerY) {
        // Move toward player until within orbit radius
        const dx = playerX - this.sprite.x;
        const dy = playerY - this.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > this.orbitRadius) {
            // Still approaching
            const speed = this.speed * 1.5;
            const vx = (dx / distance) * speed;
            const vy = (dy / distance) * speed;
            this.sprite.body.setVelocity(vx, vy);
        } else {
            // Close enough, start orbiting
            this.orbitalPhase = 'orbit';
            this.lastPhaseChange = time;
            
            // Visual transition effect
            this.scene.tweens.add({
                targets: this.sprite,
                scale: { from: 1, to: 1.2 },
                duration: 200,
                yoyo: true,
                ease: 'Sine.easeOut'
            });
        }
    }
    
    orbitPlayer(time, playerX, playerY) {
        // Update orbit angle - variable speed for unpredictability
        if (time % 2000 < 1000) {
            // Speed up gradually
            this.orbitSpeed = this.orbitSpeed * 1.01;
        } else {
            // Slow down gradually
            this.orbitSpeed = this.orbitSpeed * 0.99;
        }
        
        this.orbitAngle += this.orbitSpeed;
        
        // Calculate orbit position
        const targetX = playerX + Math.cos(this.orbitAngle) * this.orbitRadius;
        const targetY = playerY + Math.sin(this.orbitAngle) * this.orbitRadius;
        
        // Set velocity to reach the orbital position
        const dx = targetX - this.sprite.x;
        const dy = targetY - this.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            const speed = this.speed * 2; // Faster during orbital phase
            const vx = (dx / distance) * speed;
            const vy = (dy / distance) * speed;
            this.sprite.body.setVelocity(vx, vy);
        }
    }
    
    createTrailEffect(color, alpha) {
        // Create a fading trail particle
        const trail = this.scene.add.graphics();
        trail.fillStyle(color, alpha);
        trail.fillCircle(0, 0, this.size * 0.7);
        trail.x = this.sprite.x;
        trail.y = this.sprite.y;
        
        // Initialize trails array if needed
        if (!this.activeTrails) {
            this.activeTrails = [];
        }
        
        // Track this trail for cleanup
        this.activeTrails.push(trail);
        
        // Fade out and remove the trail
        this.scene.tweens.add({
            targets: trail,
            alpha: 0,
            scale: 0.3,
            duration: 300,
            onComplete: () => {
                const index = this.activeTrails.indexOf(trail);
                if (index > -1) {
                    this.activeTrails.splice(index, 1);
                }
                trail.destroy();
            }
        });
    }
    
    createTargetingArrow(playerX, playerY) {
        // Create a targeting arrow from boss to player
        this.clearVisualEffects(); // Ensure any existing arrow is removed
        
        this.targetLine = this.scene.add.graphics();
        this.targetLine.lineStyle(2, this.warningColor, 0.6);
        
        // Calculate direction vector
        const dx = playerX - this.sprite.x;
        const dy = playerY - this.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Normalize the direction
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            // Draw the main line slightly shorter than full distance
            const lineLength = distance * 0.9;
            this.targetLine.lineBetween(
                this.sprite.x, 
                this.sprite.y, 
                this.sprite.x + dirX * lineLength, 
                this.sprite.y + dirY * lineLength
            );
            
            // Calculate arrowhead points
            const arrowSize = Math.min(20, distance * 0.2);
            const arrowheadX = this.sprite.x + dirX * lineLength;
            const arrowheadY = this.sprite.y + dirY * lineLength;
            
            // Calculate perpendicular direction for arrowhead
            const perpX = -dirY;
            const perpY = dirX;
            
            // Draw arrowhead
            this.targetLine.beginPath();
            this.targetLine.moveTo(arrowheadX, arrowheadY);
            this.targetLine.lineTo(
                arrowheadX - dirX * arrowSize + perpX * arrowSize * 0.5,
                arrowheadY - dirY * arrowSize + perpY * arrowSize * 0.5
            );
            this.targetLine.lineTo(
                arrowheadX - dirX * arrowSize - perpX * arrowSize * 0.5,
                arrowheadY - dirY * arrowSize - perpY * arrowSize * 0.5
            );
            this.targetLine.closePath();
            this.targetLine.fillStyle(this.warningColor, 0.6);
            this.targetLine.fill();
        }
        
        // Store reference to the tween so we can kill it if needed
        const arrowTween = this.scene.tweens.add({
            targets: this.targetLine,
            alpha: { from: 0.6, to: 1 },
            yoyo: true,
            repeat: 3,
            duration: 150
        });
    }
    
    createImpactEffect() {
        // Create an impact effect when transitioning from dash to orbit
        const impact = this.scene.add.graphics();
        impact.fillStyle(this.impactColor, 0.7);
        impact.fillCircle(0, 0, this.size * 2);
        impact.x = this.sprite.x;
        impact.y = this.sprite.y;
        
        // Expand and fade the impact
        this.scene.tweens.add({
            targets: impact,
            scale: { from: 0.5, to: 3 },
            alpha: { from: 0.7, to: 0 },
            duration: 500,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                impact.destroy();
            }
        });
    }
    
    // Create arrow-shaped trail particles like in Boss One
    createTrailArrow(dirX, dirY) {
        // Create a small arrow in the trail
        const trail = this.scene.add.graphics();
        trail.lineStyle(1, this.warningColor, 0.5);
        
        // Arrow size and position
        const arrowLength = this.size * 0.4;
        const arrowWidth = this.size * 0.25;
        
        // Position at boss
        trail.x = this.sprite.x;
        trail.y = this.sprite.y;
        
        // Draw a small arrow
        trail.beginPath();
        // Arrowhead point
        trail.moveTo(0, 0);
        // Left wing
        trail.lineTo(
            -dirX * arrowLength - dirY * arrowWidth,
            -dirY * arrowLength + dirX * arrowWidth
        );
        // Back center
        trail.lineTo(
            -dirX * arrowLength * 0.8,
            -dirY * arrowLength * 0.8
        );
        // Right wing
        trail.lineTo(
            -dirX * arrowLength + dirY * arrowWidth,
            -dirY * arrowLength - dirX * arrowWidth
        );
        trail.closePath();
        
        // Fill arrow
        trail.fillStyle(this.warningColor, 0.5);
        trail.fill();
        
        // Initialize trails array if needed
        if (!this.activeTrails) {
            this.activeTrails = [];
        }
        
        // Track this trail for cleanup
        this.activeTrails.push(trail);
        
        // Fade out and remove the trail
        this.scene.tweens.add({
            targets: trail,
            alpha: 0,
            scale: 0.7,
            duration: 300,
            onComplete: () => {
                const index = this.activeTrails.indexOf(trail);
                if (index > -1) {
                    this.activeTrails.splice(index, 1);
                }
                trail.destroy();
            }
        });
    }

    createTargetingIndicator(playerX, playerY) {
        // Clear any existing targeting indicator
        this.clearVisualEffects();
        
        // Create a container for all targeting graphics
        this.targetLine = this.scene.add.container(this.sprite.x, this.sprite.y);
        
        // 1. Create a pulsing ring around the boss indicating "tracking mode"
        const bossRing = this.scene.add.graphics();
        bossRing.lineStyle(3, this.warningColor, 0.7);
        bossRing.strokeCircle(0, 0, this.size * 1.5);
        this.targetLine.add(bossRing);
        
        // Add rotating markers around the boss ring
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i;
            const markerX = Math.cos(angle) * this.size * 1.5;
            const markerY = Math.sin(angle) * this.size * 1.5;
            
            const marker = this.scene.add.graphics();
            marker.fillStyle(this.warningColor, 0.9);
            marker.fillCircle(markerX, markerY, 4);
            this.targetLine.add(marker);
        }
        
        // 2. Create a targeting reticle on the player
        const reticle = this.scene.add.graphics();
        
        // Outer circle
        reticle.lineStyle(2, this.warningColor, 0.7);
        reticle.strokeCircle(0, 0, this.size * 1.2);
        
        // Cross hairs
        reticle.lineStyle(1, this.warningColor, 0.7);
        reticle.lineBetween(-this.size * 1.5, 0, this.size * 1.5, 0);
        reticle.lineBetween(0, -this.size * 1.5, 0, this.size * 1.5);
        
        // Add corner brackets
        const cornerSize = this.size * 0.7;
        reticle.lineStyle(2, this.warningColor, 1);
        
        // Top-left corner
        reticle.moveTo(-cornerSize, -cornerSize/2);
        reticle.lineTo(-cornerSize, -cornerSize);
        reticle.lineTo(-cornerSize/2, -cornerSize);
        
        // Top-right corner
        reticle.moveTo(cornerSize, -cornerSize/2);
        reticle.lineTo(cornerSize, -cornerSize);
        reticle.lineTo(cornerSize/2, -cornerSize);
        
        // Bottom-left corner
        reticle.moveTo(-cornerSize, cornerSize/2);
        reticle.lineTo(-cornerSize, cornerSize);
        reticle.lineTo(-cornerSize/2, cornerSize);
        
        // Bottom-right corner
        reticle.moveTo(cornerSize, cornerSize/2);
        reticle.lineTo(cornerSize, cornerSize);
        reticle.lineTo(cornerSize/2, cornerSize);
        
        // Important fix: Position relative to the container
        reticle.x = playerX - this.sprite.x;
        reticle.y = playerY - this.sprite.y;
        this.targetLine.add(reticle);
        
        // Store a direct reference to the reticle for easier updates
        this.targetReticle = reticle;
        
        // 3. Add "radar" dots between the boss and player
        this.updateTargetingDots(playerX, playerY);
        
        // Add animations to show this is a tracking indicator
        
        // 1. Pulse the reticle
        this.scene.tweens.add({
            targets: reticle,
            scale: { from: 0.9, to: 1.1 },
            alpha: { from: 0.7, to: 1 },
            duration: 300,
            yoyo: true,
            repeat: -1
        });
        
        // 2. Rotate the boss ring
        this.scene.tweens.add({
            targets: bossRing,
            rotation: Math.PI * 2,
            duration: 2000,
            repeat: -1,
            ease: 'Linear'
        });
    }

    // Add a new method to update the tracking dots
    updateTargetingDots(playerX, playerY) {
        // Remove old dots first
        if (this.targetLine && this.targetDots) {
            this.targetDots.forEach(dot => {
                // Error fix: use getAll() instead of getChildren()
                const index = this.targetLine.getAll().indexOf(dot);
                if (index !== -1) {
                    this.targetLine.removeAt(index);
                }
                dot.destroy();
            });
        }
        
        // Initialize dots array
        this.targetDots = [];
        
        // Only create dots if we have a valid container
        if (!this.targetLine) return;
        
        // Calculate distance to player
        const dx = playerX - this.sprite.x;
        const dy = playerY - this.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > this.size * 5) {
            const steps = 3; // Number of dots
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            for (let i = 1; i <= steps; i++) {
                const dotDistance = distance * (i / (steps + 1));
                // Calculate dot positions relative to container
                const dotX = dirX * dotDistance;
                const dotY = dirY * dotDistance;
                
                const dot = this.scene.add.graphics();
                dot.fillStyle(this.warningColor, 0.5);
                dot.fillCircle(0, 0, 5);
                dot.x = dotX;
                dot.y = dotY;
                this.targetLine.add(dot);
                this.targetDots.push(dot);
            }
        }
    }

    // Override the cleanupEffects method from BaseBoss
    cleanupEffects() {
        // Handle orbital attack cleanup with visual transition
        if (this.inOrbitalAttack) {
            // Reset orbital attack state
            this.inOrbitalAttack = false;
            this.orbitalPhase = 'idle';
            this.orbitalEndTime = 0;
            
            // Create a final orbit burst effect if in orbit/dash phase
            if (this.sprite && ['orbit', 'dash', 'prep_dash'].includes(this.orbitalPhase)) {
                // Create burst effect at the boss's position
                const burstEffect = this.scene.add.graphics();
                burstEffect.fillStyle(this.secondaryColor, 0.6);
                burstEffect.fillCircle(0, 0, this.size * 2);
                
                burstEffect.x = this.sprite.x;
                burstEffect.y = this.sprite.y;
                
                // Quick expansion and fade
                this.scene.tweens.add({
                    targets: burstEffect,
                    scale: { from: 0.5, to: 2 },
                    alpha: { from: 0.6, to: 0 },
                    duration: 300,
                    ease: 'Cubic.easeOut',
                    onComplete: () => burstEffect.destroy()
                });
                
                // If in dash phase, create directional burst particles
                if (this.orbitalPhase === 'dash' && this.sprite.body) {
                    // Get current velocity direction
                    const vx = this.sprite.body.velocity.x;
                    const vy = this.sprite.body.velocity.y;
                    const speed = Math.sqrt(vx * vx + vy * vy);
                    
                    if (speed > 0) {
                        // Create a burst of particles in the direction of travel
                        const dirX = vx / speed;
                        const dirY = vy / speed;
                        
                        for (let i = 0; i < 8; i++) {
                            // Create particle
                            const particle = this.scene.add.graphics();
                            particle.fillStyle(this.warningColor, 0.7);
                            particle.fillCircle(0, 0, 3);
                            
                            // Position at boss
                            particle.x = this.sprite.x;
                            particle.y = this.sprite.y;
                            
                            // Random angle variation within 45 degrees of travel direction
                            const angleVariation = (Math.random() - 0.5) * Math.PI / 4;
                            const particleAngle = Math.atan2(dirY, dirX) + angleVariation;
                            const particleSpeed = 50 + Math.random() * 100;
                            
                            // Animate the particle
                            this.scene.tweens.add({
                                targets: particle,
                                x: particle.x + Math.cos(particleAngle) * particleSpeed,
                                y: particle.y + Math.sin(particleAngle) * particleSpeed,
                                alpha: 0,
                                scale: 0.5,
                                duration: 400,
                                ease: 'Cubic.easeOut',
                                onComplete: () => {
                                    particle.destroy();
                                }
                            });
                        }
                    }
                }
            }
            
            // Reset visual properties
            if (this.sprite) {
                this.sprite.setScale(1);
                this.sprite.alpha = 1;
                this.sprite.lineStyle(2, 0x000000, 1);
            }
        }
        
        // Clean up any active trails with a smoother transition
        if (this.activeTrails && this.activeTrails.length > 0) {
            // Make a copy of the array to avoid issues during modification
            const trailsToClean = [...this.activeTrails];
            
            trailsToClean.forEach(trail => {
                if (trail && trail.active) {
                    // Kill any existing tweens on this trail
                    if (this.scene && this.scene.tweens) {
                        this.scene.tweens.killTweensOf(trail);
                    }
                    
                    // Create a quick fade-out
                    this.scene.tweens.add({
                        targets: trail,
                        alpha: 0,
                        scale: 0.3,
                        duration: 200,
                        ease: 'Cubic.easeOut',
                        onComplete: () => {
                            const index = this.activeTrails.indexOf(trail);
                            if (index > -1) {
                                this.activeTrails.splice(index, 1);
                            }
                            trail.destroy();
                        }
                    });
                }
            });
        }
        
        // Clean up targeting indicators with smooth transitions
        if (this.targetLine) {
            // Kill any active tweens on targeting elements
            if (this.scene && this.scene.tweens) {
                this.scene.tweens.killTweensOf(this.targetLine);
                
                // Kill tweens on all children
                this.targetLine.getAll().forEach(child => {
                    if (child) {
                        this.scene.tweens.killTweensOf(child);
                    }
                });
            }
            
            // Create a fade out animation
            this.scene.tweens.add({
                targets: this.targetLine,
                alpha: 0,
                scale: 0.7,
                duration: 200,
                ease: 'Cubic.easeOut',
                onComplete: () => {
                    this.targetLine.destroy();
                    this.targetLine = null;
                }
            });
        }
        
        // Reset references
        this.targetReticle = null;
        this.targetDots = [];
        
        // Finally call the parent cleanup method
        super.cleanupEffects();
    }

    // Override the destroy method to use our enhanced cleanup
    destroy() {
        // Call our enhanced cleanup
        this.cleanupEffects();
        
        // Then call parent destroy
        super.destroy();
    }

    // Update takeDamage to use cleanupEffects instead of clearVisualEffects
    takeDamage(amount) {
        // Call parent method first
        const wasDefeated = super.takeDamage(amount);
        
        // Only clean up if not defeated (to avoid double cleanup)
        if (!wasDefeated) {
            this.cleanupEffects();
        }
        
        return wasDefeated;
    }
}