import BaseBoss from './base-boss.js';

export default class BossThree extends BaseBoss {
    constructor(scene, x, y, sides) {
        super(scene, x, y, sides, 14, 7); // 14 HP, deals 7 damage
        this.score = 200; // 200 points for defeating BossThree
        this.rotationSpeed = 0.02; // Base rotation speed
        
        // Use the main color from BaseBoss and derive other colors from it
        this.primaryColor = this.color;           // Main color based on sides
        this.secondaryColor = this.lightenColor(this.color, 40);  // Lighter variant
        this.warningColor = this.saturateColor(this.color, 60);   // More saturated variant for warnings
        this.impactColor = this.lightenColor(this.color, 80);     // Very light variant for impacts
        
        // Track active visual effects for proper cleanup
        this.activeEffects = [];
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
        
        // Add rotation with bursts of speed
        if (this.sprite && this.sprite.active) {
            // Initialize burst properties if not set
            if (!this.burstPhase) {
                this.burstPhase = 0;
                this.inBurst = false;
                this.burstTime = 0;
            }
            
            // Every 3 seconds, do a burst of fast rotation
            if (time - this.burstTime > 3000) {
                this.inBurst = true;
                this.burstTime = time;
                
                // Visual effect for rotation burst
                this.createBurstEffect();
            }
            
            // Burst lasts for 0.5 seconds
            if (this.inBurst && time - this.burstTime > 500) {
                this.inBurst = false;
            }
            
            // Apply rotation with burst multiplier
            const burstMultiplier = this.inBurst ? 3 : 1;
            this.sprite.rotation += this.rotationSpeed * burstMultiplier;
        }
        
        // Special attack - every 9 seconds
        if (!this.lastSpecialAttack || time - this.lastSpecialAttack > 9000) {
            this.startZigZagAttack(time, playerX, playerY);
        }
        
        // Update zigzag attack if active
        if (this.inZigZagAttack && time < this.zigZagEndTime) {
            this.updateZigZagAttack(time, playerX, playerY);
        } else if (time >= this.zigZagEndTime && this.inZigZagAttack) {
            // End attack
            this.inZigZagAttack = false;
            this.sprite.lineStyle(2, 0x000000, 1);
            
            // Clean up any remaining effects
            this.clearVisualEffects();
        }
    }
    
    createBurstEffect() {
        const burstRing = this.scene.add.graphics();
        burstRing.lineStyle(3, this.primaryColor, 0.7);
        burstRing.strokeCircle(0, 0, this.size * 1.8);
        burstRing.x = this.sprite.x;
        burstRing.y = this.sprite.y;
        
        this.activeEffects.push(burstRing);
        
        // Expand and fade
        this.scene.tweens.add({
            targets: burstRing,
            scale: { from: 0.7, to: 1.4 },
            alpha: { from: 0.7, to: 0 },
            duration: 400,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                const index = this.activeEffects.indexOf(burstRing);
                if (index > -1) {
                    this.activeEffects.splice(index, 1);
                }
                burstRing.destroy();
            }
        });
    }
    
    startZigZagAttack(time, playerX, playerY) {
        this.inZigZagAttack = true;
        this.lastSpecialAttack = time;
        this.zigZagEndTime = time + 4500; // 4.5 seconds of zigzag attack
        
        // Reset flags
        this.hasFinalPointBeenAdjusted = false;
        
        // Setup zigzag parameters
        this.zigZagPoints = [];
        this.currentZigZagPoint = 0;
        this.zigZagNextPointTime = 0; // Will be set in updateZigZagAttack
        
        // Generate a complete zigzag path
        this.generateZigZagPath(playerX, playerY);
        
        // Visual indicator
        this.sprite.lineStyle(4, this.warningColor, 1);
        
        // Create initial visual effect
        this.scene.tweens.add({
            targets: this.sprite,
            scale: { from: 1, to: 1.2 },
            duration: 300,
            yoyo: true,
            ease: 'Cubic.easeInOut'
        });
        
        // Show the zigzag path preview
        this.showZigZagPath();
    }

    generateZigZagPath(playerX, playerY) {
        // Get screen boundaries with a small margin
        const margin = 50; // Keep points this many pixels from the edge
        const minX = margin;
        const minY = margin;
        const maxX = this.scene.game.config.width - margin;
        const maxY = this.scene.game.config.height - margin;
        
        // Helper function to constrain a point to screen boundaries
        const constrainPoint = (x, y) => {
            return {
                x: Math.max(minX, Math.min(maxX, x)),
                y: Math.max(minY, Math.min(maxY, y))
            };
        };
        
        // Start from boss position (already on screen)
        let x = this.sprite.x;
        let y = this.sprite.y;
        
        // Store initial position as first point
        this.zigZagPoints.push({ x, y, time: 0 });
        
        // Constrain playerX and playerY to screen
        const constrainedTarget = constrainPoint(playerX, playerY);
        playerX = constrainedTarget.x;
        playerY = constrainedTarget.y;
        
        // Calculate direction to player
        const dx = playerX - x;
        const dy = playerY - y;
        const angleToPlayer = Math.atan2(dy, dx);
        const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);
        
        // Perpendicular angle for zigzagging
        const perpAngle = angleToPlayer + Math.PI/2;
        
        // Number of complete zigzags
        const zigzagCount = 3;
        
        // Initial width and segment parameters - reduce segment times for faster movement
        let zigWidth = 100;
        let segmentLength = Math.min(distanceToPlayer / (zigzagCount * 2), 120);
        let segmentTime = 450; // Reduced from 600 to 450 for faster movement
        
        // Generate zigzag points
        for (let i = 0; i < zigzagCount; i++) {
            // Calculate the player's predicted position at this zigzag point
            // Use more aggressive prediction for the final position
            const predictedDistance = (i + 1) * segmentLength * 2;
            
            const predictionFactor = i === zigzagCount - 1 ? 0.8 : 0.3;
            const predictedPlayerX = playerX + dx/distanceToPlayer * predictedDistance * predictionFactor;
            const predictedPlayerY = playerY + dy/distanceToPlayer * predictedDistance * predictionFactor;
            
            // Constrain the predicted player position
            const constrainedPredicted = constrainPoint(predictedPlayerX, predictedPlayerY);
            
            // Calculate new direction to predicted player position
            const newDx = constrainedPredicted.x - x;
            const newDy = constrainedPredicted.y - y;
            const newAngle = Math.atan2(newDy, newDx);
            
            // New perpendicular angle
            const newPerpAngle = newAngle + Math.PI/2;
            
            // Calculate potential first zag point
            let potentialX = x + Math.cos(newAngle) * segmentLength + Math.cos(newPerpAngle) * zigWidth;
            let potentialY = y + Math.sin(newAngle) * segmentLength + Math.sin(newPerpAngle) * zigWidth;
            
            // Constrain it to screen
            const constrained1 = constrainPoint(potentialX, potentialY);
            x = constrained1.x;
            y = constrained1.y;
            
            const time1 = this.zigZagPoints.length > 0 ? 
                this.zigZagPoints[this.zigZagPoints.length-1].time + segmentTime : segmentTime;
            
            this.zigZagPoints.push({ x, y, time: time1 });
            
            // Calculate potential second zag (to other side)
            potentialX = x + Math.cos(newAngle) * segmentLength - Math.cos(newPerpAngle) * zigWidth * 2;
            potentialY = y + Math.sin(newAngle) * segmentLength - Math.sin(newPerpAngle) * zigWidth * 2;
            
            // Constrain it to screen
            const constrained2 = constrainPoint(potentialX, potentialY);
            x = constrained2.x;
            y = constrained2.y;
            
            const time2 = time1 + segmentTime;
            this.zigZagPoints.push({ x, y, time: time2 });
            
            // Adjust parameters if we've been constrained (reduce zigzag width)
            if (constrained1.x !== potentialX || constrained1.y !== potentialY ||
                constrained2.x !== potentialX || constrained2.y !== potentialY) {
                // If we were constrained by the screen, reduce width more aggressively
                zigWidth *= 0.5;
            } else {
                // Normal parameter changes
                zigWidth *= 0.65;
            }
            
            segmentLength *= 1.15;
            segmentTime *= 0.7;
        }
        
        // Final approach to player with improved prediction
        let predictedFinalX = playerX;
        let predictedFinalY = playerY;
        
        // If there's a player object with velocity information, use it
        if (this.scene.player && this.scene.player.sprite && 
            this.scene.player.sprite.body) {
            
            // Get player velocity
            const pvx = this.scene.player.sprite.body.velocity.x;
            const pvy = this.scene.player.sprite.body.velocity.y;
            
            // Get average segment time
            const avgSegmentTime = this.calculateRemainingTime();
            
            // Predict the player's position in the future
            predictedFinalX = playerX + pvx * avgSegmentTime / 1000;
            predictedFinalY = playerY + pvy * avgSegmentTime / 1000;
            
            // Constrain the predicted final position
            const constrainedFinal = constrainPoint(predictedFinalX, predictedFinalY);
            predictedFinalX = constrainedFinal.x;
            predictedFinalY = constrainedFinal.y;
        }
        
        // Calculate final vector and angle
        const finalDx = predictedFinalX - x;
        const finalDy = predictedFinalY - y;
        const finalDistance = Math.sqrt(finalDx * finalDx + finalDy * finalDy);
        const finalAngle = Math.atan2(finalDy, finalDx);
        
        // Add final point targeting the player's predicted position
        x += Math.cos(finalAngle) * finalDistance;
        y += Math.sin(finalAngle) * finalDistance;
        
        // Constrain the final point
        const constrainedFinalPoint = constrainPoint(x, y);
        x = constrainedFinalPoint.x;
        y = constrainedFinalPoint.y;
        
        const finalTime = this.zigZagPoints[this.zigZagPoints.length-1].time + segmentTime * 0.6;
        this.zigZagPoints.push({ x, y, time: finalTime });
        
        // Extra check: If any zigzag point is too close to another, slightly adjust
        // This helps avoid very sharp turns due to boundary constraints
        this.adjustClosestPoints();
    }

    updateZigZagAttack(time, playerX, playerY) {
        // Initialize timing if this is the first update
        if (this.currentZigZagPoint === 0) {
            this.zigZagStartTime = time;
            this.zigZagNextPointTime = time + this.zigZagPoints[1].time;
            this.currentZigZagPoint = 1;
        }
        
        // Check if we need to move to the next point
        if (time >= this.zigZagNextPointTime && 
            this.currentZigZagPoint < this.zigZagPoints.length - 1) {
            
            // Flash effect when changing direction
            this.scene.tweens.add({
                targets: this.sprite,
                alpha: { from: 1, to: 0.5 },
                duration: 100,
                yoyo: true
            });
            
            // Increment point and update next time
            this.currentZigZagPoint++;
            this.zigZagNextPointTime = this.zigZagStartTime + 
                this.zigZagPoints[this.currentZigZagPoint].time;
            
            // Create burst effect at turning point
            this.createDirectionChangeEffect();
            
            // IMPORTANT CHANGE: Completely REMOVE the final point adjustment logic
            // This way the zigzag path remains entirely fixed once generated
        }
        
        // Calculate target position based on current point and next point
        const currentPoint = this.zigZagPoints[this.currentZigZagPoint - 1];
        const nextPoint = this.zigZagPoints[this.currentZigZagPoint];
        
        // Calculate how far along this segment we are (0 to 1)
        const segmentDuration = nextPoint.time - currentPoint.time;
        const segmentProgress = Math.min(1, 
            (time - (this.zigZagStartTime + currentPoint.time)) / segmentDuration);
        
        // Use easing for smoother motion
        const easedProgress = this.easeInOutQuad(segmentProgress);
        
        // Interpolate between current and next point
        const targetX = currentPoint.x + (nextPoint.x - currentPoint.x) * easedProgress;
        const targetY = currentPoint.y + (nextPoint.y - currentPoint.y) * easedProgress;
        
        // Calculate direction to the interpolated position
        const dx = targetX - this.sprite.x;
        const dy = targetY - this.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            // INCREASED: Higher base speed (6x instead of 4x) and steeper acceleration
            const speedMultiplier = 1 + this.currentZigZagPoint * 0.2; // Increased from 0.15 to 0.2
            const speed = this.speed * 6 * speedMultiplier; // Increased from 4x to 6x
            
            // Set velocity to move toward the interpolated position
            const vx = (dx / distance) * speed;
            const vy = (dy / distance) * speed;
            
            this.sprite.body.setVelocity(vx, vy);
            
            // Create more frequent trail based on speed
            if (Math.random() > 0.5) { // Increased frequency from 0.6 to 0.5
                this.createTrailEffect();
            }
        }
        
        // Check if we've reached the final point
        if (this.currentZigZagPoint === this.zigZagPoints.length - 1 && 
            distance < 10) {
            
            // Create impact effect
            this.createImpactEffect();
            
            // End the attack early
            this.zigZagEndTime = time;
        }
    }

    updateZigZagPath() {
        // Remove previous path visualization
        if (this.pathGraphics) {
            this.pathGraphics.destroy();
            const index = this.activeEffects.indexOf(this.pathGraphics);
            if (index > -1) {
                this.activeEffects.splice(index, 1);
            }
        }
        
        // Create updated path visualization
        this.showZigZagPath();
    }

    showZigZagPath() {
        // Create a path indicator
        const path = this.scene.add.graphics();
        this.pathGraphics = path;
        
        // Create distinctive zigzag path visualization
        
        // 1. First, draw a thinner background trail to emphasize the path
        path.lineStyle(3, this.secondaryColor, 0.2); // Reduced from 5 to 3
        path.beginPath();
        path.moveTo(this.zigZagPoints[0].x, this.zigZagPoints[0].y);
        
        for (let i = 1; i < this.zigZagPoints.length; i++) {
            path.lineTo(this.zigZagPoints[i].x, this.zigZagPoints[i].y);
        }
        path.strokePath();
        
        // 2. Draw the main zigzag line with a distinctive pattern (thinner)
        path.lineStyle(1.5, this.secondaryColor, 0.6); // Reduced from 2 to 1.5
        
        // Create a zigzag effect by drawing angled lines between points
        for (let i = 0; i < this.zigZagPoints.length - 1; i++) {
            const startX = this.zigZagPoints[i].x;
            const startY = this.zigZagPoints[i].y;
            const endX = this.zigZagPoints[i+1].x;
            const endY = this.zigZagPoints[i+1].y;
            
            // Only draw distinctive zigzag markers for segments between turning points
            if (i % 2 === 0 || i === this.zigZagPoints.length - 2) {
                // Calculate segment length
                const dx = endX - startX;
                const dy = endY - startY;
                const length = Math.sqrt(dx * dx + dy * dy);
                
                // Only add decorative zigzags to longer segments
                if (length > 30) {
                    const steps = Math.ceil(length / 25); // Fewer decorations (every 25px instead of 20px)
                    
                    for (let j = 0; j < steps; j++) {
                        const progress = j / steps;
                        const nextProgress = (j + 1) / steps;
                        
                        // Calculate points along the line
                        const x1 = startX + dx * progress;
                        const y1 = startY + dy * progress;
                        const x2 = startX + dx * nextProgress;
                        const y2 = startY + dy * nextProgress;
                        
                        // We'll draw small zigzag marks perpendicular to the path (thinner)
                        const perpDx = -dy / length * 3.5; // Reduced from 5 to 3.5
                        const perpDy = dx / length * 3.5;
                        
                        // Draw small zigzag mark
                        path.beginPath();
                        path.moveTo(x1, y1);
                        path.lineTo(x1 + perpDx, y1 + perpDy);
                        path.lineTo(x2 - perpDx, y2 - perpDy);
                        path.lineTo(x2, y2);
                        path.strokePath();
                    }
                }
            }
            
            // Draw the main segment line
            path.beginPath();
            path.moveTo(startX, startY);
            path.lineTo(endX, endY);
            path.strokePath();
        }
        
        // 3. Add highlight nodes at the turning points with decoration
        for (let i = 0; i < this.zigZagPoints.length; i++) {
            const x = this.zigZagPoints[i].x;
            const y = this.zigZagPoints[i].y;
            
            // For turning points (every other point except first and last)
            if (i > 0 && i < this.zigZagPoints.length - 1) {
                // Draw a larger node for turning points
                path.fillStyle(this.secondaryColor, 0.7);
                path.fillCircle(x, y, 5); // Slightly smaller (from 6 to 5)
                
                // Add a highlight dot in the center
                path.fillStyle(this.warningColor, 0.8);
                path.fillCircle(x, y, 2);
                
                // Draw small indicator lines showing the sharp turn
                if (i > 0 && i < this.zigZagPoints.length - 1) {
                    const prevX = this.zigZagPoints[i-1].x;
                    const prevY = this.zigZagPoints[i-1].y;
                    const nextX = this.zigZagPoints[i+1].x;
                    const nextY = this.zigZagPoints[i+1].y;
                    
                    // Calculate directions
                    const prevDx = x - prevX;
                    const prevDy = y - prevY;
                    const prevLength = Math.sqrt(prevDx * prevDx + prevDy * prevDy);
                    
                    const nextDx = nextX - x;
                    const nextDy = nextY - y;
                    const nextLength = Math.sqrt(nextDx * nextDx + nextDy * nextDy);
                    
                    // Draw small directional indicator
                    if (prevLength > 0 && nextLength > 0) {
                        path.lineStyle(1.5, this.warningColor, 0.6); // Thinner (from 2 to 1.5)
                        
                        // Draw an arrow at the turning point
                        const arrowSize = 10; // Slightly smaller (from 12 to 10)
                        
                        // Normalized previous direction (reversed)
                        const dirX1 = -prevDx / prevLength;
                        const dirY1 = -prevDy / prevLength;
                        
                        // Normalized next direction
                        const dirX2 = nextDx / nextLength;
                        const dirY2 = nextDy / nextLength;
                        
                        // Draw a small zigzag arrow
                        path.beginPath();
                        path.moveTo(
                            x + dirX1 * arrowSize/2, 
                            y + dirY1 * arrowSize/2
                        );
                        path.lineTo(x, y);
                        path.lineTo(
                            x + dirX2 * arrowSize/2, 
                            y + dirY2 * arrowSize/2
                        );
                        path.strokePath();
                    }
                }
            }
            // Special markers for start and end points (using the color scheme)
            else if (i === 0) {
                // Start point - blue-shifted variant of the secondary color
                // Create a cooler variant of the secondary color for the starting point
                const startColor = this.adjustHue(this.secondaryColor, -40); // Shift toward blue
                
                path.fillStyle(startColor, 0.5);
                path.fillCircle(x, y, 6); // Slightly smaller (from 7 to 6)
                path.lineStyle(1, startColor, 0.7);
                path.strokeCircle(x, y, 8); // Slightly smaller (from 9 to 8)
            }
            else if (i === this.zigZagPoints.length - 1) {
                // End point - warning color (which is already more reddish/saturated)
                path.fillStyle(this.warningColor, 0.5);
                path.fillCircle(x, y, 6); // Slightly smaller (from 7 to 6)
                
                // Target rings
                path.lineStyle(1, this.warningColor, 0.7);
                path.strokeCircle(x, y, 9); // Slightly smaller (from 10 to 9)
                path.lineStyle(1, this.warningColor, 0.4);
                path.strokeCircle(x, y, 12); // Slightly smaller (from 14 to 12)
            }
        }
        
        this.activeEffects.push(path);
        
        // Fade out gradually, but stay visible longer to match the faster boss movement
        this.scene.tweens.add({
            targets: path,
            alpha: { from: 1, to: 0 },
            duration: 3500, // Increased from 2000 to 3500 to match faster boss speed
            ease: 'Cubic.easeIn',
            onComplete: () => {
                const index = this.activeEffects.indexOf(path);
                if (index > -1) {
                    this.activeEffects.splice(index, 1);
                }
                path.destroy();
                if (this.pathGraphics === path) {
                    this.pathGraphics = null;
                }
            }
        });
    }

    // Helper method to shift the hue of a color
    adjustHue(color, amount) {
        // Convert hex color to HSL
        const r = (color >> 16) & 255;
        const g = (color >> 8) & 255;
        const b = color & 255;
        
        // RGB to HSL conversion
        const r01 = r / 255;
        const g01 = g / 255;
        const b01 = b / 255;
        
        const max = Math.max(r01, g01, b01);
        const min = Math.min(r01, g01, b01);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r01: h = (g01 - b01) / d + (g01 < b01 ? 6 : 0); break;
                case g01: h = (b01 - r01) / d + 2; break;
                case b01: h = (r01 - g01) / d + 4; break;
            }
            
            h /= 6;
        }
        
        // Adjust hue
        h = (h * 360 + amount) % 360;
        if (h < 0) h += 360;
        h /= 360;
        
        // HSL to RGB conversion
        let r1, g1, b1;
        
        if (s === 0) {
            r1 = g1 = b1 = l; // achromatic
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            
            r1 = hue2rgb(p, q, h + 1/3);
            g1 = hue2rgb(p, q, h);
            b1 = hue2rgb(p, q, h - 1/3);
        }
        
        // Convert back to hex
        const newR = Math.round(r1 * 255);
        const newG = Math.round(g1 * 255);
        const newB = Math.round(b1 * 255);
        
        return (newR << 16) | (newG << 8) | newB;
    }
    
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    createDirectionChangeEffect() {
        const effect = this.scene.add.graphics();
        effect.fillStyle(this.secondaryColor, 0.7);
        effect.fillCircle(0, 0, this.size * 0.8);
        effect.x = this.sprite.x;
        effect.y = this.sprite.y;
        
        this.activeEffects.push(effect);
        
        // Quick burst effect
        this.scene.tweens.add({
            targets: effect,
            scale: { from: 0.5, to: 1.2 },
            alpha: { from: 0.7, to: 0 },
            duration: 300,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                const index = this.activeEffects.indexOf(effect);
                if (index > -1) {
                    this.activeEffects.splice(index, 1);
                }
                effect.destroy();
            }
        });
    }
    
    createTrailEffect() {
        // Create a fading trail particle
        const trail = this.scene.add.graphics();
        
        // Use a mix of colors for a more dynamic trail
        const useWarningColor = Math.random() > 0.7;
        const color = useWarningColor ? this.warningColor : this.secondaryColor;
        const alpha = useWarningColor ? 0.5 : 0.4;
        
        // Randomly vary between circle and zigzag shapes
        if (Math.random() > 0.5) {
            // Standard circle trail
            trail.fillStyle(color, alpha);
            trail.fillCircle(0, 0, this.size * 0.5);
        } else {
            // Small zigzag shape
            trail.lineStyle(2, color, alpha);
            const size = this.size * 0.4;
            
            trail.beginPath();
            trail.moveTo(-size, -size/2);
            trail.lineTo(0, 0);
            trail.lineTo(-size, size/2);
            trail.strokePath();
        }
        
        trail.x = this.sprite.x;
        trail.y = this.sprite.y;
        
        this.activeEffects.push(trail);
        
        // Fade out and remove with slight rotation
        this.scene.tweens.add({
            targets: trail,
            alpha: 0,
            scale: 0.5,
            rotation: Math.random() * 0.5,
            duration: 300,
            onComplete: () => {
                const index = this.activeEffects.indexOf(trail);
                if (index > -1) {
                    this.activeEffects.splice(index, 1);
                }
                trail.destroy();
            }
        });
    }
    
    createImpactEffect() {
        // Create an impact burst at current position
        const impact = this.scene.add.graphics();
        impact.fillStyle(this.impactColor, 0.6);
        impact.fillCircle(0, 0, this.size * 1.5);
        impact.x = this.sprite.x;
        impact.y = this.sprite.y;
        
        this.activeEffects.push(impact);
        
        // Expand and fade
        this.scene.tweens.add({
            targets: impact,
            scale: { from: 0.5, to: 2.0 },
            alpha: { from: 0.6, to: 0 },
            duration: 400,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                const index = this.activeEffects.indexOf(impact);
                if (index > -1) {
                    this.activeEffects.splice(index, 1);
                }
                impact.destroy();
            }
        });
    }
    
    // Add this method for enhanced effect cleanup

    // Override the cleanupEffects method from BaseBoss
    cleanupEffects() {
        // Handle zigzag attack cleanup with visual transition
        if (this.inZigZagAttack) {
            // Reset zigzag attack state
            this.inZigZagAttack = false;
            this.zigZagEndTime = 0;
            
            // Create a special effect if defeated during zigzag attack
            if (this.sprite && this.sprite.active) {
                // Reset visual style
                this.sprite.lineStyle(2, 0x000000, 1);
                this.sprite.setScale(1);
                
                // Create aborted zigzag effect
                const abortEffect = this.scene.add.graphics();
                abortEffect.fillStyle(this.warningColor, 0.6);
                abortEffect.fillCircle(0, 0, this.size * 1.2);
                
                abortEffect.x = this.sprite.x;
                abortEffect.y = this.sprite.y;
                
                // Quick pulse and fade
                this.scene.tweens.add({
                    targets: abortEffect,
                    scale: { from: 0.5, to: 1.5 },
                    alpha: { from: 0.6, to: 0 },
                    duration: 300,
                    ease: 'Cubic.easeOut',
                    onComplete: () => abortEffect.destroy()
                });
            }
        }
        
        // Clean up path graphics with a nice transition
        if (this.pathGraphics) {
            // Kill any existing tweens
            if (this.scene && this.scene.tweens) {
                this.scene.tweens.killTweensOf(this.pathGraphics);
            }
            
            // Create a quick fade-out
            if (this.pathGraphics.active) {
                this.scene.tweens.add({
                    targets: this.pathGraphics,
                    alpha: 0,
                    duration: 200,
                    ease: 'Cubic.easeOut',
                    onComplete: () => {
                        this.pathGraphics.destroy();
                        this.pathGraphics = null;
                    }
                });
            } else {
                this.pathGraphics.destroy();
                this.pathGraphics = null;
            }
        }
        
        // Clean up targeting laser
        if (this.targetingLaser) {
            if (this.scene && this.scene.tweens) {
                this.scene.tweens.killTweensOf(this.targetingLaser);
            }
            this.targetingLaser.destroy();
            this.targetingLaser = null;
        }
        
        // Clean up all active effects with a nice transition
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
        
        // Reset any timers related to zigzag attack
        this.zigZagPoints = [];
        this.zigZagNextPointTime = 0;
        this.currentZigZagPoint = 0;
        
        // Call parent method to handle common cleanup
        super.cleanupEffects();
    }

    // Replace the old clearVisualEffects method with our enhanced method
    clearVisualEffects() {
        this.cleanupEffects();
    }

    // Override destroy method to properly clean up
    destroy() {
        // Clean up all effects first
        this.cleanupEffects();
        
        // Call parent destroy
        super.destroy();
    }

    // Make sure effects are cleaned up when boss takes damage
    takeDamage(amount) {
        // Call parent method first to check if defeated
        const wasDefeated = super.takeDamage(amount);
        
        // Only clean up if not defeated (to avoid double cleanup)
        if (!wasDefeated && this.inZigZagAttack) {
            // Create a small impact effect when damaged during zigzag
            const damageEffect = this.scene.add.graphics();
            damageEffect.fillStyle(0xffffff, 0.5);
            damageEffect.fillCircle(0, 0, this.size * 0.8);
            
            damageEffect.x = this.sprite.x;
            damageEffect.y = this.sprite.y;
            
            // Quick pulse and fade
            this.scene.tweens.add({
                targets: damageEffect,
                scale: { from: 0.8, to: 1.3 },
                alpha: { from: 0.5, to: 0 },
                duration: 200,
                ease: 'Cubic.easeOut',
                onComplete: () => damageEffect.destroy()
            });
        }
        
        return wasDefeated;
    }

    // Helper method to calculate average remaining time
    calculateRemainingTime() {
        // Calculate average segment time based on the zigzag points
        if (!this.zigZagPoints || this.zigZagPoints.length < 2) {
            return 1000; // Default 1 second if no path exists yet
        }
        
        // Return the time of the last point as an estimate
        return this.zigZagPoints[this.zigZagPoints.length - 1].time;
    }

    // Add this new helper method to adjust points that end up too close together
    adjustClosestPoints() {
        const minDistance = 40; // Minimum distance between points
        
        for (let i = 1; i < this.zigZagPoints.length; i++) {
            const current = this.zigZagPoints[i];
            const prev = this.zigZagPoints[i-1];
            
            // Calculate distance between this point and previous
            const dx = current.x - prev.x;
            const dy = current.y - prev.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // If points are too close, try to adjust
            if (distance < minDistance) {
                // Get screen dimensions
                const width = this.scene.game.config.width;
                const height = this.scene.game.config.height;
                
                // Find direction to move away
                const angle = Math.atan2(dy, dx);
                
                // Try to extend the distance while staying on screen
                const targetX = prev.x + Math.cos(angle) * minDistance;
                const targetY = prev.y + Math.sin(angle) * minDistance;
                
                // Constrain to screen
                current.x = Math.max(20, Math.min(width - 20, targetX));
                current.y = Math.max(20, Math.min(height - 20, targetY));
            }
        }
    }
}