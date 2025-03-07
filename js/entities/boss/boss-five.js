import BaseBoss from './base-boss.js';

export default class BossFive extends BaseBoss {
    constructor(scene, x, y, sides) {
        super(scene, x, y, sides, 20, 10); // 20 HP, deals 10 damage
        this.score = 250; // 250 points for defeating BossFive
        this.rotationSpeed = 0.005; // Very slow base rotation speed
        
        // Use the main color from BaseBoss and derive other colors from it
        this.primaryColor = this.color;           // Main color based on sides
        this.secondaryColor = this.lightenColor(this.color, 40);  // Lighter variant
        this.warningColor = this.saturateColor(this.color, 60);   // More saturated variant for warnings
        this.impactColor = this.lightenColor(this.color, 80);     // Very light variant for impacts
        this.darkColor = this.darkenColor(this.color, 40);        // Darker variant for singularity
        
        // Track active visual effects for proper cleanup
        this.activeEffects = [];
        this.projectiles = [];
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
    
    // Helper method to create darker color variants
    darkenColor(color, percent) {
        const r = ((color >> 16) & 255) - percent;
        const g = ((color >> 8) & 255) - percent;
        const b = (color & 255) - percent;
        
        return ((r < 0 ? 0 : r) << 16) | 
               ((g < 0 ? 0 : g) << 8) | 
               (b < 0 ? 0 : b);
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
        
        // Add complex rotation pattern
        if (this.sprite && this.sprite.active) {
            // Initialize rotation properties if not set
            if (!this.patternTime) {
                this.patternTime = 0;
                this.currentPattern = 0;
                this.rotationDirection = 1;
            }
            
            // Change rotation pattern every 5 seconds
            if (time - this.patternTime > 5000) {
                this.currentPattern = (this.currentPattern + 1) % 3;
                this.patternTime = time;
                this.rotationDirection *= -1;
            }
            
            // Apply different rotation patterns
            switch (this.currentPattern) {
                case 0:
                    // Slow rotation
                    this.sprite.rotation += this.rotationSpeed * this.rotationDirection;
                    break;
                case 1:
                    // Fast rotation
                    this.sprite.rotation += this.rotationSpeed * 5 * this.rotationDirection;
                    break;
                case 2:
                    // Oscillating rotation
                    this.sprite.rotation += Math.sin(time / 200) * this.rotationSpeed * 3;
                    break;
            }
        }
        
        // Special attack - every 15 seconds (reduced from 18)
        if (!this.lastSpecialAttack || time - this.lastSpecialAttack > 15000) {
            this.startSingularityAttack(time, playerX, playerY);
        }
        
        // Update singularity attack if active
        if (this.inSingularityAttack && time < this.singularityEndTime) {
            this.updateSingularityAttack(time, playerX, playerY);
        } else if (time >= this.singularityEndTime && this.inSingularityAttack) {
            this.endSingularityAttack();
        }
    }
    
    startSingularityAttack(time, playerX, playerY) {
        // Clean up any previous attack effects
        this.clearVisualEffects();
        
        this.inSingularityAttack = true;
        this.lastSpecialAttack = time;
        this.singularityEndTime = time + 8000; // 8 seconds of singularity attack
        
        // Setup phases - add a pre-charge phase for better starting transition
        this.singularityPhase = 'pre_charging';
        this.phaseStartTime = time;
        this.singularityRadius = this.size * 3; // Initial radius
        this.maxSingularityRadius = this.size * 8; // Max radius
        this.singularityIntensity = 0; // Starts at 0, increases with time
        
        // Create initial flash effect to signal the attack is starting
        const flash = this.scene.add.graphics();
        flash.fillStyle(this.warningColor, 0.3);
        flash.fillCircle(0, 0, this.size * 3);
        
        flash.x = this.sprite.x;
        flash.y = this.sprite.y;
        
        this.activeEffects.push(flash);
        
        // Quick flash to indicate attack start
        this.scene.tweens.add({
            targets: flash,
            scale: { from: 0.2, to: 2 },
            alpha: { from: 0.6, to: 0 },
            duration: 400,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                const index = this.activeEffects.indexOf(flash);
                if (index > -1) {
                    this.activeEffects.splice(index, 1);
                }
                flash.destroy();
            }
        });
        
        // Visual indicator - use warning color
        this.sprite.lineStyle(4, this.warningColor, 1);
        
        // Scale up effect for pre-charging phase with more dramatic pulsing
        this.scene.tweens.add({
            targets: this.sprite,
            scale: { from: 1, to: 1.2 },
            duration: 400,
            yoyo: true,
            repeat: 2,
            ease: 'Sine.easeInOut'
        });
        
        // Create charging indicators
        this.createPreChargingEffects();
        
        // Add pulsing sound effect if sound is implemented
        // this.scene.sound.play('charge', { volume: 0.5 });
    }
    
    createPreChargingEffects() {
        // Create energy converging lines
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            this.createConvergingLine(angle);
        }
    }
    
    createConvergingLine(angle) {
        const line = this.scene.add.graphics();
        
        // Draw a line with gradient
        line.lineStyle(2, this.warningColor, 0.7);
        
        // Draw from outside toward the boss
        const startDistance = this.size * 12;
        const endDistance = this.size * 1.5;
        
        line.beginPath();
        line.moveTo(Math.cos(angle) * startDistance, Math.sin(angle) * startDistance);
        line.lineTo(Math.cos(angle) * endDistance, Math.sin(angle) * endDistance);
        line.strokePath();
        
        line.x = this.sprite.x;
        line.y = this.sprite.y;
        
        this.activeEffects.push(line);
        
        // Animate the line to create "flowing" effect
        this.scene.tweens.add({
            targets: line,
            alpha: { from: 0.3, to: 0.9 },
            duration: 600,
            ease: 'Sine.easeIn',
            onComplete: () => {
                // Fade out after appearing
                this.scene.tweens.add({
                    targets: line,
                    alpha: { from: 0.9, to: 0 },
                    duration: 300,
                    ease: 'Cubic.easeOut',
                    onComplete: () => {
                        const index = this.activeEffects.indexOf(line);
                        if (index > -1) {
                            this.activeEffects.splice(index, 1);
                        }
                        line.destroy();
                    }
                });
            }
        });
    }
    
    updateSingularityAttack(time, playerX, playerY) {
        const deltaTime = time - this.phaseStartTime;
        
        // Handle each phase
        switch (this.singularityPhase) {
            case 'pre_charging':
                // Pre-charging phase - creating visual build-up
                if (deltaTime > 800) { // 0.8 seconds of pre-charging
                    this.singularityPhase = 'charging';
                    this.phaseStartTime = time;
                    
                    // Create more dramatic flash when transitioning to charging
                    const transitionFlash = this.scene.add.graphics();
                    transitionFlash.fillStyle(this.secondaryColor, 0.5);
                    transitionFlash.fillCircle(0, 0, this.size * 2);
                    
                    transitionFlash.x = this.sprite.x;
                    transitionFlash.y = this.sprite.y;
                    
                    this.activeEffects.push(transitionFlash);
                    
                    // Quick flash to indicate phase change
                    this.scene.tweens.add({
                        targets: transitionFlash,
                        scale: { from: 0.5, to: 2 },
                        alpha: { from: 0.5, to: 0 },
                        duration: 300,
                        ease: 'Cubic.easeOut',
                        onComplete: () => {
                            const index = this.activeEffects.indexOf(transitionFlash);
                            if (index > -1) {
                                this.activeEffects.splice(index, 1);
                            }
                            transitionFlash.destroy();
                        }
                    });
                } else {
                    // Create converging energy particles during pre-charging
                    if (Math.random() > 0.6) {
                        this.createEnergyParticle();
                    }
                }
                break;
                
            case 'charging':
                // Charging phase - building up power
                if (deltaTime > 1500) { // 1.5 seconds charging
                    this.singularityPhase = 'active';
                    this.phaseStartTime = time;
                    
                    // Create singularity with dramatic entrance effect
                    this.createSingularityEffect(true); // Pass true for entrance effect
                } else {
                    // During charging, create energy particles
                    if (Math.random() > 0.5) {
                        this.createEnergyParticle();
                    }
                    
                    // Create charging rings
                    if (Math.random() > 0.7) {
                        this.createChargingEffect();
                    }
                }
                break;
                
            case 'active':
                // Active phase - expanding damage area
                const activeTime = time - this.phaseStartTime;
                
                // Increase singularity intensity over time
                this.singularityIntensity = Math.min(1, activeTime / 3000); // Faster intensity buildup (from 4000 to 3000)
                
                // Grow the singularity radius with smooth acceleration but faster
                const growthProgress = activeTime / 4000; // Reduced from 6000 to 4000 for faster expansion
                const easedGrowth = 1 - Math.cos(growthProgress * Math.PI / 2); // Keep the ease-out curve
                this.singularityRadius = this.size * 3 + 
                    (this.maxSingularityRadius - this.size * 3) * easedGrowth;
                
                // Check if player is within the singularity radius and damage them
                this.checkPlayerSingularityCollision(playerX, playerY);
                
                // Create particle effect for the singularity
                if (Math.random() > 0.8) {
                    this.createSingularityParticle();
                }
                
                // Final explosion phase
                if (activeTime > 4500) { // Reduced from 6000 to 4500 to match faster expansion
                    this.singularityPhase = 'collapse';
                    this.phaseStartTime = time;
                }
                break;
                
            case 'collapse':
                // Collapse phase - final explosion
                const collapseTime = time - this.phaseStartTime;
                const collapseProgress = collapseTime / 1000; // 1 second collapse
                
                if (collapseProgress < 1) {
                    // Singularity shrinks rapidly
                    this.singularityRadius = this.maxSingularityRadius * (1 - collapseProgress);
                    
                    // Create more intense particles during collapse
                    if (Math.random() > 0.4) {
                        this.createSingularityParticle();
                        this.createEnergyParticle();
                    }
                    
                    // Still check for collisions during collapse
                    this.checkPlayerSingularityCollision(playerX, playerY);
                    
                    // Screen shake effect
                    if (this.scene.cameras && this.scene.cameras.main) {
                        this.scene.cameras.main.shake(100, 0.002 + 0.008 * collapseProgress);
                    }
                } else {
                    // Final explosion and move to dissipating phase
                    this.createExplosionEffect();
                    
                    // Final damage check with the explosion radius
                    this.checkPlayerExplosionCollision(playerX, playerY);
                    
                    // Add dissipation phase for smooth ending transition
                    this.singularityPhase = 'dissipating';
                    this.phaseStartTime = time;
                    
                    // Final screen shake
                    if (this.scene.cameras && this.scene.cameras.main) {
                        this.scene.cameras.main.shake(300, 0.01);
                    }
                }
                break;
                
            case 'dissipating':
                // Dissipating phase - smooth end transition
                const dissipateTime = time - this.phaseStartTime;
                
                // Create fading particles
                if (Math.random() > 0.7) {
                    this.createDissipatingParticle();
                }
                
                // End attack after dissipation
                if (dissipateTime > 1200) { // 1.2 seconds of dissipation
                    this.singularityEndTime = time; // End now
                }
                break;
        }
        
        // Update the singularity visual if it exists
        this.updateSingularityVisual();
    }
    
    createSingularityEffect(withEntrance = false) {
        // Create the main singularity visual
        this.singularityGraphic = this.scene.add.graphics();
        this.updateSingularityVisual(); // Initial draw
        
        this.activeEffects.push(this.singularityGraphic);
        
        // Create a stable glow effect around the singularity
        const glow = this.scene.add.graphics();
        glow.fillStyle(this.secondaryColor, 0.3);
        glow.fillCircle(0, 0, this.singularityRadius * 1.2);
        
        glow.x = this.sprite.x;
        glow.y = this.sprite.y;
        
        this.activeEffects.push(glow);
        this.singularityGlow = glow;
        
        // Add entrance effect if requested
        if (withEntrance) {
            // Start with small scale and expand rapidly
            this.singularityGraphic.setScale(0.1);
            glow.setScale(0.1);
            
            // Add bright flash when singularity forms
            const flash = this.scene.add.graphics();
            flash.fillStyle(this.impactColor, 0.7);
            flash.fillCircle(0, 0, this.singularityRadius * 2);
            flash.x = this.sprite.x;
            flash.y = this.sprite.y;
            this.activeEffects.push(flash);
            
            // Rapid expansion with flash
            this.scene.tweens.add({
                targets: [this.singularityGraphic, glow],
                scale: 1,
                duration: 300,
                ease: 'Back.easeOut'
            });
            
            // Flash and disappear
            this.scene.tweens.add({
                targets: flash,
                scale: { from: 0.5, to: 1.5 },
                alpha: { from: 7, to: 0 },
                duration: 400,
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
        
        // Pulsating animation for the glow
        this.scene.tweens.add({
            targets: glow,
            scale: { from: 0.9, to: 1.1 },
            yoyo: true,
            repeat: -1,
            duration: 1200,
            ease: 'Sine.easeInOut'
        });
    }
    
    endSingularityAttack() {
        this.inSingularityAttack = false;
        
        // Don't clean up visuals yet - we'll use them for the ending animation
        
        // 1. First, animate the singularity itself collapsing
        if (this.singularityGraphic) {
            // Create a rapid implosion effect for the singularity
            this.scene.tweens.add({
                targets: [this.singularityGraphic],
                scale: { from: 1, to: 0.1 },
                duration: 500,
                ease: 'Back.easeIn',
                onComplete: () => {
                    // After singularity collapses, create the final flash
                    this.createFinalCollapseEffect();
                }
            });
            
            // Also animate the glow imploding but faster
            if (this.singularityGlow) {
                this.scene.tweens.add({
                    targets: [this.singularityGlow],
                    scale: { from: 1, to: 0.3 },
                    alpha: { from: 0.3, to: 0.8 },
                    duration: 350,
                    ease: 'Cubic.easeIn'
                });
            }
            
            // Add particles that rush toward the center
            this.createRushingParticles();
        } else {
            // If no singularity graphic exists, just do the final effect
            this.createFinalCollapseEffect();
        }
    }

    createRushingParticles() {
        // Create multiple particles that rush toward center
        for (let i = 0; i < 20; i++) {
            const particle = this.scene.add.graphics();
            
            // Random color from boss palette
            const colorChoices = [this.primaryColor, this.secondaryColor, this.impactColor];
            const color = colorChoices[Math.floor(Math.random() * colorChoices.length)];
            
            // Draw particle
            particle.fillStyle(color, 0.7);
            particle.fillCircle(0, 0, 3 + Math.random() * 4);
            
            // Position around singularity
            const angle = Math.random() * Math.PI * 2;
            const distance = this.size * 5 + Math.random() * this.size * 3;
            
            particle.x = this.sprite.x + Math.cos(angle) * distance;
            particle.y = this.sprite.y + Math.sin(angle) * distance;
            
            this.activeEffects.push(particle);
            
            // Rush toward center
            this.scene.tweens.add({
                targets: particle,
                x: this.sprite.x,
                y: this.sprite.y,
                scale: { from: 1, to: 0.3 },
                alpha: { from: 0.7, to: 0.9 },
                duration: 300 + Math.random() * 200,
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
    }

    createFinalCollapseEffect() {
        // Create a two-phase final effect: implosion followed by explosion
        
        // 1. Bright implosion flash
        const implosionFlash = this.scene.add.graphics();
        implosionFlash.fillStyle(this.impactColor, 0.9);
        implosionFlash.fillCircle(0, 0, this.size * 4);
        
        implosionFlash.x = this.sprite.x;
        implosionFlash.y = this.sprite.y;
        
        this.activeEffects.push(implosionFlash);
        
        // Implode flash
        this.scene.tweens.add({
            targets: implosionFlash,
            scale: { from: 1, to: 0.1 },
            alpha: { from: 0.9, to: 1 },
            duration: 300,
            ease: 'Cubic.easeIn',
            onComplete: () => {
                // 2. Once imploded, create outward explosion
                
                // Create shockwave ring - constraint to singularity radius
                const shockwave = this.scene.add.graphics();
                shockwave.lineStyle(6, this.warningColor, 0.8);
                shockwave.strokeCircle(0, 0, this.singularityRadius * 0.5); // Half of singularity radius
                
                shockwave.x = this.sprite.x;
                shockwave.y = this.sprite.y;
                
                this.activeEffects.push(shockwave);
                
                // Create center flash - also contained
                const finalFlash = this.scene.add.graphics();
                finalFlash.fillStyle(this.impactColor, 0.9);
                finalFlash.fillCircle(0, 0, this.singularityRadius * 0.8); // 80% of singularity radius
                
                finalFlash.x = this.sprite.x;
                finalFlash.y = this.sprite.y;
                finalFlash.setScale(0.1); // Start small
                
                this.activeEffects.push(finalFlash);
                
                // Expand shockwave - limited to singularity size
                this.scene.tweens.add({
                    targets: shockwave,
                    scale: { from: 0.1, to: 1.5 }, // Reduced from 3 to 1.5
                    alpha: { from: 0.8, to: 0 },
                    duration: 500,
                    ease: 'Cubic.easeOut',
                    onComplete: () => {
                        const index = this.activeEffects.indexOf(shockwave);
                        if (index > -1) {
                            this.activeEffects.splice(index, 1);
                        }
                        shockwave.destroy();
                    }
                });
                
                // Flash and fade - also more contained
                this.scene.tweens.add({
                    targets: finalFlash,
                    scale: { from: 0.1, to: 1.0 }, // Reduced from 1.5 to 1.0
                    alpha: { from: 0.9, to: 0 },
                    duration: 300,
                    ease: 'Cubic.easeOut',
                    onComplete: () => {
                        const index = this.activeEffects.indexOf(finalFlash);
                        if (index > -1) {
                            this.activeEffects.splice(index, 1);
                        }
                        finalFlash.destroy();
                        
                        // Create smaller energy bits flying outward
                        for (let i = 0; i < 15; i++) {
                            this.createEnergyBit();
                        }
                        
                        // Camera shake for impact
                        if (this.scene.cameras && this.scene.cameras.main) {
                            this.scene.cameras.main.shake(250, 0.008);
                        }
                        
                        // Final cleanup with slight delay - reduce from 400ms to 150ms
                        this.scene.time.delayedCall(150, () => {
                            // Reset boss appearance
                            if (this.sprite) {
                                this.sprite.lineStyle(2, 0x000000, 1);
                                this.sprite.setScale(1);
                            }
                            
                            // Clean up any remaining visual effects
                            this.clearVisualEffects();
                        });
                    }
                });
                
                // Remove the implosion flash
                const idx = this.activeEffects.indexOf(implosionFlash);
                if (idx > -1) {
                    this.activeEffects.splice(idx, 1);
                }
                implosionFlash.destroy();
            }
        });
    }

    createEnergyBit() {
        const bit = this.scene.add.graphics();
        
        // Random color
        const colors = [this.primaryColor, this.secondaryColor, this.warningColor, this.impactColor];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // Draw small energy bit
        bit.fillStyle(color, 0.8);
        bit.fillCircle(0, 0, 2 + Math.random() * 3);
        
        // Start at boss center
        bit.x = this.sprite.x;
        bit.y = this.sprite.y;
        
        this.activeEffects.push(bit);
        
        // Random direction
        const angle = Math.random() * Math.PI * 2;
        const distance = this.singularityRadius * (0.4 + Math.random() * 0.5); // 40-90% of singularity radius
        
        // Fly outward
        this.scene.tweens.add({
            targets: bit,
            x: this.sprite.x + Math.cos(angle) * distance,
            y: this.sprite.y + Math.sin(angle) * distance,
            scale: { from: 1, to: 0.2 },
            alpha: { from: 0.8, to: 0 },
            duration: 500 + Math.random() * 300,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                const index = this.activeEffects.indexOf(bit);
                if (index > -1) {
                    this.activeEffects.splice(index, 1);
                }
                bit.destroy();
            }
        });
    }
    
    applyGravitationalPull(playerX, playerY) {
        if (!this.scene.player) return;
        
        // Calculate distance between boss and player
        const dx = this.sprite.x - playerX;
        const dy = this.sprite.y - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Skip if too far away
        if (distance > this.maxSingularityRadius * 1.5) return;
        
        // Calculate gravity force (stronger as player gets closer)
        const maxPullDistance = this.maxSingularityRadius;
        const normalizedDistance = Math.max(0, Math.min(1, distance / maxPullDistance));
        const forceFactor = (1 - normalizedDistance) * this.singularityIntensity;
        const maxForce = 700; // Maximum pull force
        const force = maxForce * forceFactor;
        
        // Send gravity force to player object if available
        if (this.scene.applyForceToPlayer) {
            const forceX = force * (dx / distance);
            const forceY = force * (dy / distance);
            this.scene.applyForceToPlayer(forceX, forceY);
        }
    }
    
    // Simplify the checkPlayerSingularityCollision method to use whole numbers
    checkPlayerSingularityCollision(playerX, playerY) {
        if (!this.scene.player) return;
        
        // Calculate distance between boss and player
        const dx = this.sprite.x - playerX;
        const dy = this.sprite.y - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If player is inside the singularity radius, damage them
        if (distance <= this.singularityRadius) {
            // Tiered damage based on depth
            // Divide the singularity into 3 zones with increasing damage
            let damage = 1; // Default damage
            
            const normalizedDepth = 1 - (distance / this.singularityRadius);
            
            if (normalizedDepth > 0.7) {
                // Very close to center (inner 30%)
                damage = 3;
            } else if (normalizedDepth > 0.3) {
                // Middle zone (31-70%)
                damage = 2;
            }
            // Outer zone (0-30%) uses default damage of 1
            
            // Apply damage using whole numbers
            if (this.scene.player.takeDamage) {
                this.scene.player.takeDamage(damage);
            } else if (this.scene.damagePlayer) {
                this.scene.damagePlayer(damage);
            }
            
            // Visual indicator of damage
            if (Math.random() > 0.8) {
                this.createSingularityDamageEffect(playerX, playerY);
            }
        }
    }

    // Simplify the checkPlayerExplosionCollision method to use whole numbers
    checkPlayerExplosionCollision(playerX, playerY) {
        if (!this.scene.player) return;
        
        // Calculate distance between boss and player
        const dx = this.sprite.x - playerX;
        const dy = this.sprite.y - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Larger explosion radius
        const explosionRadius = this.maxSingularityRadius * 1.5;
        
        // If player is caught in explosion, apply heavy damage
        if (distance <= explosionRadius) {
            // Simplified tiered damage based on zones
            let damage = 5; // Default explosion damage
            
            const normalizedDistance = distance / explosionRadius;
            
            if (normalizedDistance < 0.3) {
                // Very close to center (inner 30%)
                damage = 10;
            } else if (normalizedDistance < 0.7) {
                // Middle zone (31-70%)
                damage = 8;
            }
            // Outer zone (71-100%) uses default damage of 5
            
            // Apply damage with whole numbers
            if (this.scene.player.takeDamage) {
                this.scene.player.takeDamage(damage);
            } else if (this.scene.damagePlayer) {
                this.scene.damagePlayer(damage);
            }
            
            // Visual feedback
            this.createSingularityDamageEffect(playerX, playerY);
        }
    }
    
    createSingularityDamageEffect(x, y) {
        // Create a quick flash effect at the player position
        const flash = this.scene.add.graphics();
        flash.fillStyle(this.impactColor, 0.7);
        flash.fillCircle(0, 0, 15);
        
        flash.x = x;
        flash.y = y;
        
        this.activeEffects.push(flash);
        
        // Quick flash and disappear
        this.scene.tweens.add({
            targets: flash,
            scale: { from: 0.5, to: 1.5 },
            alpha: { from: 0.7, to: 0 },
            duration: 200,
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
    
    createChargingEffect() {
        // Create a pulsating ring to indicate charging
        const chargeRing = this.scene.add.graphics();
        chargeRing.lineStyle(3, this.warningColor, 0.8);
        chargeRing.strokeCircle(0, 0, this.size * 2);
        
        chargeRing.x = this.sprite.x;
        chargeRing.y = this.sprite.y;
        
        this.activeEffects.push(chargeRing);
        
        // Pulsating animation
        this.scene.tweens.add({
            targets: chargeRing,
            scale: { from: 0.8, to: 1.3 },
            alpha: { from: 0.8, to: 0 },
            duration: 1000,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                const index = this.activeEffects.indexOf(chargeRing);
                if (index > -1) {
                    this.activeEffects.splice(index, 1);
                }
                chargeRing.destroy();
            }
        });
    }
    
    createEnergyParticle() {
        // Create particles that converge on the boss during charging
        const particle = this.scene.add.graphics();
        
        // Random color from palette
        const colorChoices = [this.primaryColor, this.secondaryColor, this.warningColor];
        const color = colorChoices[Math.floor(Math.random() * colorChoices.length)];
        
        // Draw particle
        particle.fillStyle(color, 0.7);
        particle.fillCircle(0, 0, 3 + Math.random() * 3);
        
        // Random position around boss
        const angle = Math.random() * Math.PI * 2;
        const distance = this.size * 8 + Math.random() * this.size * 6;
        particle.x = this.sprite.x + Math.cos(angle) * distance;
        particle.y = this.sprite.y + Math.sin(angle) * distance;
        
        this.activeEffects.push(particle);
        
        // Animate particle moving toward boss
        this.scene.tweens.add({
            targets: particle,
            x: this.sprite.x,
            y: this.sprite.y,
            scale: { from: 1, to: 0.5 },
            alpha: { from: 0.7, to: 0 },
            duration: 800 + Math.random() * 400,
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
    
    updateSingularityVisual() {
        // Skip if not created yet
        if (!this.singularityGraphic) return;
        
        // Update position to match boss
        this.singularityGraphic.x = this.sprite.x;
        this.singularityGraphic.y = this.sprite.y;
        
        if (this.singularityGlow) {
            this.singularityGlow.x = this.sprite.x;
            this.singularityGlow.y = this.sprite.y;
        }
        
        // Clear previous drawing
        this.singularityGraphic.clear();
        
        // Draw dark center
        this.singularityGraphic.fillStyle(this.darkColor, 0.7);
        this.singularityGraphic.fillCircle(0, 0, this.singularityRadius * 0.7);
        
        // Draw outer rim with warning color
        this.singularityGraphic.lineStyle(3, this.warningColor, 0.8);
        this.singularityGraphic.strokeCircle(0, 0, this.singularityRadius);
        
        // Draw inner details
        const innerRadius = this.singularityRadius * 0.4;
        
        // Create a swirl effect
        this.singularityGraphic.lineStyle(2, this.impactColor, 0.6);
        
        const time = this.scene.time.now / 1000;
        const arms = 4 + Math.floor(this.singularityIntensity * 4);
        
        for (let i = 0; i < arms; i++) {
            const startAngle = (i / arms) * Math.PI * 2 + time * (i % 2 === 0 ? 1 : -1);
            const endAngle = startAngle + Math.PI / 4;
            
            this.singularityGraphic.beginPath();
            for (let t = 0; t <= 1; t += 0.05) {
                const angle = startAngle + (endAngle - startAngle) * t;
                const radius = innerRadius * t * 1.2;
                
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                if (t === 0) {
                    this.singularityGraphic.moveTo(x, y);
                } else {
                    this.singularityGraphic.lineTo(x, y);
                }
            }
            this.singularityGraphic.strokePath();
        }
    }
    
    createSingularityParticle() {
        // Create particles that are pulled into the singularity
        const particle = this.scene.add.graphics();
        
        // Color based on distance from center
        const useWarningColor = Math.random() > 0.7;
        const color = useWarningColor ? this.warningColor : this.secondaryColor;
        
        // Draw the particle
        particle.fillStyle(color, 0.6);
        particle.fillCircle(0, 0, 2 + Math.random() * 3);
        
        // Random position within the singularity radius
        const angle = Math.random() * Math.PI * 2;
        const distance = (this.singularityRadius * 0.3) + (Math.random() * this.singularityRadius * 1.3);
        
        particle.x = this.sprite.x + Math.cos(angle) * distance;
        particle.y = this.sprite.y + Math.sin(angle) * distance;
        
        this.activeEffects.push(particle);
        
        // Spiral animation toward the center
        const duration = 800 - this.singularityIntensity * 300;
        const loops = 1 + Math.floor(Math.random() * 3);
        
        // Start with original position
        const startX = particle.x - this.sprite.x;
        const startY = particle.y - this.sprite.y;
        const startDistance = Math.sqrt(startX * startX + startY * startY);
        const startAngle = Math.atan2(startY, startX);
        
        this.scene.tweens.add({
            targets: particle,
            alpha: { from: 0.6, to: 0 },
            scale: { from: 1, to: 0.5 },
            duration: duration,
            ease: 'Cubic.easeIn',
            onUpdate: (tween) => {
                const t = tween.progress; // 0 to 1
                
                // Spiral motion: reduce radius and increase angle
                const newDistance = startDistance * (1 - t);
                const newAngle = startAngle + t * Math.PI * 2 * loops;
                
                particle.x = this.sprite.x + Math.cos(newAngle) * newDistance;
                particle.y = this.sprite.y + Math.sin(newAngle) * newDistance;
            },
            onComplete: () => {
                const index = this.activeEffects.indexOf(particle);
                if (index > -1) {
                    this.activeEffects.splice(index, 1);
                }
                particle.destroy();
            }
        });
    }
    
    createRingEmissionEffect() {
        // Create a ring effect when projectiles are emitted
        const ring = this.scene.add.graphics();
        ring.lineStyle(3, this.warningColor, 0.8);
        ring.strokeCircle(0, 0, this.size * 1.5);
        
        ring.x = this.sprite.x;
        ring.y = this.sprite.y;
        
        this.activeEffects.push(ring);
        
        // Expand and fade
        this.scene.tweens.add({
            targets: ring,
            scale: { from: 0.5, to: 1.5 },
            alpha: { from: 0.8, to: 0 },
            duration: 400,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                const index = this.activeEffects.indexOf(ring);
                if (index > -1) {
                    this.activeEffects.splice(index, 1);
                }
                ring.destroy();
            }
        });
    }
    
    createExplosionEffect() {
        // Create a large explosion at the end of the singularity
        const explosion = this.scene.add.graphics();
        
        // Core flash - keep within singularity radius
        explosion.fillStyle(this.impactColor, 0.8);
        explosion.fillCircle(0, 0, this.singularityRadius * 0.8); // Use actual singularity radius
        
        // Outer shock wave - match singularity size exactly
        explosion.lineStyle(6, this.warningColor, 0.7);
        explosion.strokeCircle(0, 0, this.singularityRadius);
        
        explosion.x = this.sprite.x;
        explosion.y = this.sprite.y;
        
        this.activeEffects.push(explosion);
        
        // Expand and fade - but limit maximum scale to keep within screen
        this.scene.tweens.add({
            targets: explosion,
            scale: { from: 0.2, to: 1.2 }, // Reduced from 2 to 1.2
            alpha: { from: 1, to: 0 },
            duration: 800,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                const index = this.activeEffects.indexOf(explosion);
                if (index > -1) {
                    this.activeEffects.splice(index, 1);
                }
                explosion.destroy();
            }
        });
        
        // Create additional particle bursts - but keep them contained
        for (let i = 0; i < 20; i++) {
            this.createExplosionParticle();
        }
    }

    createExplosionParticle() {
        const particle = this.scene.add.graphics();
        
        // Random color from palette
        const colorChoices = [this.primaryColor, this.secondaryColor, this.warningColor, this.impactColor];
        const color = colorChoices[Math.floor(Math.random() * colorChoices.length)];
        
        // Draw particle
        particle.fillStyle(color, 0.8);
        particle.fillCircle(0, 0, 3 + Math.random() * 5);
        
        // Start at boss position
        particle.x = this.sprite.x;
        particle.y = this.sprite.y;
        
        this.activeEffects.push(particle);
        
        // Calculate random direction
        const angle = Math.random() * Math.PI * 2;
        const speed = 300 + Math.random() * 400;
        
        // IMPORTANT: Limit distance to singularity radius
        const distance = this.singularityRadius * (0.5 + Math.random() * 0.5); // 50-100% of singularity radius
        
        // Burst animation
        this.scene.tweens.add({
            targets: particle,
            x: this.sprite.x + Math.cos(angle) * distance,
            y: this.sprite.y + Math.sin(angle) * distance,
            scale: { from: 1.5, to: 0.2 },
            alpha: { from: 0.8, to: 0 },
            duration: 500 + Math.random() * 300,
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
    
    createDissipatingParticle() {
        const particle = this.scene.add.graphics();
        
        // Use primary or secondary color
        const color = Math.random() > 0.5 ? this.primaryColor : this.secondaryColor;
        
        // Draw small particle
        particle.fillStyle(color, 0.6);
        particle.fillCircle(0, 0, 2 + Math.random() * 2);
        
        // Start at boss position
        particle.x = this.sprite.x;
        particle.y = this.sprite.y;
        
        this.activeEffects.push(particle);
        
        // Random direction with short travel distance
        const angle = Math.random() * Math.PI * 2;
        const distance = this.size * (1 + Math.random() * 2);
        
        // Floating away animation
        this.scene.tweens.add({
            targets: particle,
            x: this.sprite.x + Math.cos(angle) * distance,
            y: this.sprite.y + Math.sin(angle) * distance,
            scale: { from: 1, to: 0.1 },
            alpha: { from: 0.6, to: 0 },
            duration: 800 + Math.random() * 400,
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
    
    clearVisualEffects() {
        // Force immediate destruction of singularity graphics
        if (this.singularityGraphic) {
            this.scene.tweens.killTweensOf(this.singularityGraphic);
            this.singularityGraphic.destroy();
            this.singularityGraphic = null;
        }
        
        if (this.singularityGlow) {
            this.scene.tweens.killTweensOf(this.singularityGlow);
            this.singularityGlow.destroy();
            this.singularityGlow = null;
        }
        
        // Immediately destroy all active effects
        if (this.activeEffects) {
            this.activeEffects.forEach(effect => {
                if (effect && effect.active) {
                    this.scene.tweens.killTweensOf(effect);
                    effect.destroy();
                }
            });
            this.activeEffects = [];
        }
        
        // Clear all projectiles
        if (this.projectiles) {
            this.projectiles.forEach(projectile => {
                if (projectile && projectile.graphic) {
                    if (projectile.graphic.active) {
                        projectile.graphic.destroy();
                    }
                }
            });
            this.projectiles = [];
        }
    }
    
    destroy() {
        // Force immediate cleanup of all visual effects - no animations
        if (this.inSingularityAttack) {
            // Reset attack state
            this.inSingularityAttack = false;
            this.singularityPhase = null;
            this.singularityEndTime = 0;
            
            // Immediately destroy all singularity graphics
            if (this.singularityGraphic) {
                // Kill any running tweens first
                this.scene.tweens.killTweensOf(this.singularityGraphic);
                // Force immediate destruction
                this.singularityGraphic.destroy();
                this.singularityGraphic = null;
            }
            
            if (this.singularityGlow) {
                this.scene.tweens.killTweensOf(this.singularityGlow);
                this.singularityGlow.destroy();
                this.singularityGlow = null;
            }
        }
        
        // Cancel ALL tweens in the scene related to any of our effects
        // This is more aggressive but ensures everything stops
        if (this.activeEffects) {
            this.activeEffects.forEach(effect => {
                if (effect) {
                    this.scene.tweens.killTweensOf(effect);
                    effect.destroy();
                }
            });
            this.activeEffects = [];
        }
        
        // Kill ALL delayed calls on this object
        if (this.scene.time) {
            // Instead of removeAllEvents which affects the whole scene,
            // we'll be more targeted
            this.scene.time.getActiveTimers().forEach(timer => {
                // Try to identify our timers and remove only those
                if (timer.callback && timer.callback.name && 
                    timer.callback.name.includes('bound ') && 
                    timer.callback.name.includes('BossFive')) {
                    timer.remove();
                }
            });
        }
        
        // Make sure any ongoing camera shake is stopped
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.stopShake();
        }
        
        // Reset sprite visuals immediately if it still exists
        if (this.sprite && this.sprite.active) {
            this.sprite.setScale(1);
            this.sprite.lineStyle(2, 0x000000, 1);
        }
        
        // Call parent destroy to handle standard cleanup
        super.destroy();
        
        // As a last resort, add a cleanup check on the next frame
        this.scene.time.delayedCall(50, () => {
            // Double-check for any remaining effects
            if (this.singularityGraphic && this.singularityGraphic.active) {
                this.singularityGraphic.destroy();
                this.singularityGraphic = null;
            }
            
            if (this.singularityGlow && this.singularityGlow.active) {
                this.singularityGlow.destroy();
                this.singularityGlow = null;
            }
        });
    }

    // Override the cleanupEffects method with specialized singularity cleanup

    cleanupEffects() {
        // Handle singularity cleanup with a special effect if active
        if (this.inSingularityAttack) {
            // Reset state variables
            this.inSingularityAttack = false;
            this.singularityPhase = null;
            this.singularityEndTime = 0;
            
            // Create a cool implosion effect for the singularity if it exists
            if (this.singularityGraphic && this.singularityGraphic.active) {
                // Kill any existing tweens
                if (this.scene && this.scene.tweens) {
                    this.scene.tweens.killTweensOf(this.singularityGraphic);
                }
                
                // Create dramatic implosion
                this.scene.tweens.add({
                    targets: this.singularityGraphic,
                    scale: { from: this.singularityGraphic.scale, to: 0.1 },
                    alpha: { from: 1, to: 0.8 },
                    duration: 300,
                    ease: 'Cubic.easeIn',
                    onComplete: () => {
                        if (this.singularityGraphic && this.singularityGraphic.active) {
                            // Create a final flash at the singularity position
                            const finalFlash = this.scene.add.graphics();
                            finalFlash.fillStyle(this.impactColor, 0.9);
                            finalFlash.fillCircle(0, 0, this.size * 2);
                            
                            finalFlash.x = this.singularityGraphic.x;
                            finalFlash.y = this.singularityGraphic.y;
                            
                            this.scene.tweens.add({
                                targets: finalFlash,
                                scale: { from: 0.2, to: 1.5 },
                                alpha: { from: 0.9, to: 0 },
                                duration: 400,
                                ease: 'Cubic.easeOut',
                                onComplete: () => finalFlash.destroy()
                            });
                            
                            // Destroy the singularity
                            this.singularityGraphic.destroy();
                            this.singularityGraphic = null;
                        }
                    }
                });
            }
            
            // Same for the glow
            if (this.singularityGlow && this.singularityGlow.active) {
                if (this.scene && this.scene.tweens) {
                    this.scene.tweens.killTweensOf(this.singularityGlow);
                }
                
                this.scene.tweens.add({
                    targets: this.singularityGlow,
                    scale: { from: this.singularityGlow.scale, to: 0.1 },
                    alpha: { from: 0.3, to: 0 },
                    duration: 250,
                    ease: 'Cubic.easeIn',
                    onComplete: () => {
                        if (this.singularityGlow && this.singularityGlow.active) {
                            this.singularityGlow.destroy();
                            this.singularityGlow = null;
                        }
                    }
                });
            }
        }
        
        // Clean up all other effects using the parent method
        super.cleanupEffects();
        
        // Extra safety - find and destroy any graphics at the boss position after a short delay
        if (this.scene && this.scene.time) {
            this.scene.time.delayedCall(350, () => {
                if (this.scene && this.scene.children) {
                    this.scene.children.getAll().forEach(child => {
                        if (child && !child.destroyed && child.type === 'Graphics') {
                            // Check if it's near the boss's last position
                            if (this.sprite && 
                                Math.abs(child.x - this.sprite.x) < 30 && 
                                Math.abs(child.y - this.sprite.y) < 30) {
                                child.destroy();
                            }
                        }
                    });
                }
            });
        }
    }

    // Override destroy method to ensure proper cleanup
    destroy() {
        // Ensure effects are cleaned up
        this.cleanupEffects();
        
        // Call parent destroy
        super.destroy();
    }
}