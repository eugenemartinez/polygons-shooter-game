import BaseBoss from './base-boss.js';

export default class BossOne extends BaseBoss {
    constructor(scene, x, y, sides) {
        super(scene, x, y, sides, 10, 5); // 10 HP, deals 5 damage
        this.score = 100; // 100 points for defeating BossOne
        this.rotationSpeed = 0.01; // Slow, imposing rotation
        
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
        
        // Add rotation
        if (this.sprite && this.sprite.active) {
            this.sprite.rotation += this.rotationSpeed;
        }
        
        // Special attack - every 8 seconds
        if (!this.lastSpecialAttack || time - this.lastSpecialAttack > 8000) {
            this.startDashAttack(time, playerX, playerY);
        }
        
        // Update dash attack if active
        if (this.inDashAttack && time < this.dashEndTime) {
            this.updateDashAttack(time, playerX, playerY);
        } else if (time >= this.dashEndTime && this.inDashAttack) {
            // End the dash attack
            this.inDashAttack = false;
            this.sprite.lineStyle(2, 0x000000, 1);
            
            // Create impact effect at the end position
            this.createImpactEffect();
            
            // Clean up any remaining effects
            this.clearVisualEffects();
        }
    }
    
    // Override the cleanupEffects method from BaseBoss
    cleanupEffects() {
        // Handle dash attack cleanup with visual transition
        if (this.inDashAttack) {
            // Reset dash attack state
            this.inDashAttack = false;
            this.dashEndTime = 0;
            
            // Create a special effect if defeated during dash
            if (this.sprite) {
                // Reset visual style
                this.sprite.lineStyle(2, 0x000000, 1);
                this.sprite.setScale(1);
                
                // Create abort dash effect
                const dashAbortEffect = this.scene.add.graphics();
                dashAbortEffect.fillStyle(this.warningColor, 0.6);
                dashAbortEffect.fillCircle(0, 0, this.size * 1.2);
                
                dashAbortEffect.x = this.sprite.x;
                dashAbortEffect.y = this.sprite.y;
                
                // Quick pulse and fade
                this.scene.tweens.add({
                    targets: dashAbortEffect,
                    scale: { from: 0.5, to: 1.5 },
                    alpha: { from: 0.6, to: 0 },
                    duration: 300,
                    ease: 'Cubic.easeOut',
                    onComplete: () => dashAbortEffect.destroy()
                });
                
                // Create directional particles based on current velocity
                if (this.sprite.body && 
                   (this.sprite.body.velocity.x !== 0 || this.sprite.body.velocity.y !== 0)) {
                    
                    const vx = this.sprite.body.velocity.x;
                    const vy = this.sprite.body.velocity.y;
                    const speed = Math.sqrt(vx * vx + vy * vy);
                    
                    if (speed > 0) {
                        // Create a burst of particles in the direction of travel
                        const dirX = vx / speed;
                        const dirY = vy / speed;
                        
                        // Create several particles
                        for (let i = 0; i < 6; i++) {
                            const particle = this.scene.add.graphics();
                            
                            // Use secondary color for particles
                            particle.fillStyle(this.secondaryColor, 0.7);
                            particle.fillCircle(0, 0, 2 + Math.random() * 3);
                            
                            // Position at boss
                            particle.x = this.sprite.x;
                            particle.y = this.sprite.y;
                            
                            // Random angle variation
                            const angleVariation = (Math.random() - 0.5) * Math.PI / 3;
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
                                onComplete: () => particle.destroy()
                            });
                        }
                    }
                }
            }
        }
        
        // Clean up any active trails
        if (this.activeTrails && this.activeTrails.length > 0) {
            // Create a copy of the array to avoid modification issues
            const trailsToClean = [...this.activeTrails];
            
            trailsToClean.forEach(trail => {
                if (trail && trail.active) {
                    // Kill any existing tweens
                    if (this.scene && this.scene.tweens) {
                        this.scene.tweens.killTweensOf(trail);
                    }
                    
                    // Create a quick fade-out for smoother transition
                    this.scene.tweens.add({
                        targets: trail,
                        alpha: 0,
                        scale: 0.5,
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
        
        // Reset dash arrow with more robust cleanup
        if (this.dashArrow) {
            // Kill any running tween on the arrow
            if (this.arrowTween) {
                if (this.scene && this.scene.tweens) {
                    this.scene.tweens.remove(this.arrowTween);
                }
                this.arrowTween = null;
            }
            
            // Create a quick fade-out for the dash arrow
            if (this.dashArrow.active) {
                this.scene.tweens.add({
                    targets: this.dashArrow,
                    alpha: 0,
                    scale: 0.5,
                    duration: 150,
                    ease: 'Cubic.easeOut',
                    onComplete: () => {
                        this.dashArrow.destroy();
                        this.dashArrow = null;
                    }
                });
            } else {
                // Just in case it's not active anymore
                this.dashArrow.destroy();
                this.dashArrow = null;
            }
        }
        
        // Call parent cleanup method
        super.cleanupEffects();
    }

    // Override destroy method to use our enhanced cleanup
    destroy() {
        // Call our enhanced cleanup
        this.cleanupEffects();
        
        // Then call parent destroy
        super.destroy();
    }

    // Replace clearVisualEffects with our enhanced method
    clearVisualEffects() {
        this.cleanupEffects();
    }

    // Make sure effects are cleaned up when boss takes damage
    takeDamage(amount) {
        // Clean up visuals when damaged as a safeguard
        if (this.inDashAttack) {
            // Only clean up trails, keep the dash active
            if (this.activeTrails && this.activeTrails.length > 0) {
                const trailsToClean = [...this.activeTrails];
                
                trailsToClean.forEach(trail => {
                    if (trail && trail.active) {
                        this.scene.tweens.killTweensOf(trail);
                        trail.destroy();
                    }
                });
                this.activeTrails = [];
            }
        }
        
        // Call parent method
        return super.takeDamage(amount);
    }

    startDashAttack(time, playerX, playerY) {
        // Clean up any previous attack effects first
        this.clearVisualEffects();
        
        this.inDashAttack = true;
        this.lastSpecialAttack = time;
        this.dashEndTime = time + 2000; // 2 seconds of dash attack
        
        // Record starting position for reference
        this.dashStartX = this.sprite.x;
        this.dashStartY = this.sprite.y;
        
        // Record player position at dash start for targeted dash
        this.dashTargetX = playerX;
        this.dashTargetY = playerY;
        
        // Visual indicator - use warning color instead of hardcoded red
        this.sprite.lineStyle(4, this.warningColor, 1);
        
        // Add a dash preview arrow
        this.createDashArrow(playerX, playerY);
        
        // Brief warning pause before dash
        this.dashPauseUntil = time + 500; // 0.5 second pause
        
        // Scale effect
        this.scene.tweens.add({
            targets: this.sprite,
            scale: { from: 1, to: 1.3 },
            duration: 400,
            yoyo: true,
            ease: 'Cubic.easeIn'
        });
    }
    
    createDashArrow(playerX, playerY) {
        // Ensure any existing arrow is destroyed first
        if (this.dashArrow) {
            this.scene.tweens.killTweensOf(this.dashArrow);
            this.dashArrow.destroy();
            this.dashArrow = null;
        }
        
        // Create arrow graphics
        this.dashArrow = this.scene.add.graphics();
        this.dashArrow.lineStyle(2, this.warningColor, 0.8);
        
        // Calculate direction
        const dx = playerX - this.sprite.x;
        const dy = playerY - this.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Normalize the direction
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            // Draw the main line slightly shorter than full distance
            const lineLength = Math.min(distance * 0.8, 150); // Cap the length
            this.dashArrow.lineBetween(
                this.sprite.x, 
                this.sprite.y, 
                this.sprite.x + dirX * lineLength, 
                this.sprite.y + dirY * lineLength
            );
            
            // Calculate arrowhead points
            const arrowSize = Math.min(15, lineLength * 0.2);
            const arrowheadX = this.sprite.x + dirX * lineLength;
            const arrowheadY = this.sprite.y + dirY * lineLength;
            
            // Calculate perpendicular direction for arrowhead
            const perpX = -dirY;
            const perpY = dirX;
            
            // Draw arrowhead
            this.dashArrow.beginPath();
            this.dashArrow.moveTo(arrowheadX, arrowheadY);
            this.dashArrow.lineTo(
                arrowheadX - dirX * arrowSize + perpX * arrowSize * 0.5,
                arrowheadY - dirY * arrowSize + perpY * arrowSize * 0.5
            );
            this.dashArrow.lineTo(
                arrowheadX - dirX * arrowSize - perpX * arrowSize * 0.5,
                arrowheadY - dirY * arrowSize - perpY * arrowSize * 0.5
            );
            this.dashArrow.closePath();
            this.dashArrow.fillStyle(this.warningColor, 0.8);
            this.dashArrow.fill();
        }
        
        // Store a reference to the tween for easy cleanup
        this.arrowTween = this.scene.tweens.add({
            targets: this.dashArrow,
            alpha: { from: 0.8, to: 0.4 },
            yoyo: true,
            repeat: 3,
            duration: 120,
            onComplete: () => {
                // Ensure the arrow gets removed after animation ends,
                // even if dash logic doesn't trigger properly
                if (this.dashArrow === this.dashArrow) {
                    this.dashArrow.destroy();
                    this.dashArrow = null;
                }
            }
        });
    }
    
    updateDashAttack(time, playerX, playerY) {
        // Remove dash arrow when actual dash starts
        if (time >= this.dashPauseUntil && this.dashArrow) {
            // Kill any running tween on the arrow first
            if (this.arrowTween) {
                this.scene.tweens.remove(this.arrowTween);
                this.arrowTween = null;
            }
            this.dashArrow.destroy();
            this.dashArrow = null;
        }
        
        // Wait for the initial pause to complete
        if (time < this.dashPauseUntil) {
            // During pause, make boss vibrate slightly to indicate charging
            const vibrationAmount = 2;
            const offsetX = Math.random() * vibrationAmount - vibrationAmount/2;
            const offsetY = Math.random() * vibrationAmount - vibrationAmount/2;
            
            this.sprite.body.setVelocity(offsetX * 10, offsetY * 10);
            return;
        }
        
        // Calculate direction to dash target
        const dx = this.dashTargetX - this.sprite.x;
        const dy = this.dashTargetY - this.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If we're close to the target, dash through and beyond
        if (distance < 50) {
            // We've reached target, continue in same direction for a bit
            const speed = this.speed * 2.5;
            const vx = (dx / distance) * speed;
            const vy = (dy / distance) * speed;
            
            this.sprite.body.setVelocity(vx, vy);
        } else if (distance > 10) {
            // Still dashing to target
            const speed = this.speed * 3; // Triple speed during dash
            const vx = (dx / distance) * speed;
            const vy = (dy / distance) * speed;
            
            this.sprite.body.setVelocity(vx, vy);
            
            // Create motion blur effect with small arrows in the trail
            if (Math.random() > 0.7) {
                this.createTrailArrow(dx/distance, dy/distance);
            }
        }
    }
    
    createTrailArrow(dirX, dirY) {
        // Create a small arrow in the trail
        const trail = this.scene.add.graphics();
        trail.lineStyle(1, this.secondaryColor, 0.5);
        
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
        trail.fillStyle(this.secondaryColor, 0.5);
        trail.fill();
        
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
    
    createImpactEffect() {
        // Create an impact effect when dash ends
        const impact = this.scene.add.graphics();
        impact.fillStyle(this.impactColor, 0.7);
        impact.fillCircle(0, 0, this.size * 1.5);
        impact.x = this.sprite.x;
        impact.y = this.sprite.y;
        
        // Expand and fade the impact
        this.scene.tweens.add({
            targets: impact,
            scale: { from: 0.5, to: 2 },
            alpha: { from: 0.7, to: 0 },
            duration: 400,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                impact.destroy();
            }
        });
    }
    
    // Make sure to also clean up when game scene transitions
    deactivate() {
        this.cleanupEffects();
        
        // Call parent if exists
        if (super.deactivate) {
            super.deactivate();
        }
    }
}