function getTerrainY(worldX) {
    if (!designData || !designData.physics) return 185;
    const config = designData.physics;
    
    if (config.terrainType === 'flat') {
        return config.baseGroundY !== undefined ? config.baseGroundY : 185;
    } else if (config.terrainType === 'wavy') {
        let amp1 = config.amplitude1 !== undefined ? config.amplitude1 : 20;
        let freq1 = config.frequency1 !== undefined ? config.frequency1 : 0.003;
        let amp2 = config.amplitude2 !== undefined ? config.amplitude2 : 10;
        let freq2 = config.frequency2 !== undefined ? config.frequency2 : 0.007;
        let base = config.baseGroundY !== undefined ? config.baseGroundY : 165;
        
        let wave1 = Math.sin(worldX * freq1) * amp1; 
        let wave2 = Math.cos(worldX * freq2) * amp2; 
        return base - wave1 - wave2; 
    }
    return 185;
}

function getHorizonY() {
    if (designData && designData.physics && designData.physics.horizonY !== undefined) {
        return designData.physics.horizonY;
    }
    return 185;
}

function getObstacleSurface(x, obs) {
    if (x < obs.x || x > obs.x + obs.width) return null;
    
    if (obs.type === 'block' || obs.type === 'ice_block') return obs.baseY; 
    
    if (obs.type === 'ramp') {
        let progress = (x - obs.x) / obs.width;
        let tY = getTerrainY(worldDistance + x);
        return tY - (progress * obs.height);
    }
    if (obs.type === 'round') {
        let radius = obs.width / 2;
        let cx = obs.x + radius;
        let dx = x - cx;
        let dy = obs.height * Math.sqrt(Math.max(0, 1 - (dx * dx) / (radius * radius)));
        let tY = getTerrainY(worldDistance + x);
        return tY - dy;
    }
    if (obs.type === 'hill') {
        let progress = (x - obs.x) / obs.width;
        let dy = Math.sin(progress * Math.PI) * obs.height;
        let tY = getTerrainY(worldDistance + x);
        return tY - dy;
    }
    if (obs.type === 'crater') {
        let progress = (x - obs.x) / obs.width;
        let dy = Math.sin(progress * Math.PI) * obs.height;
        let tY = getTerrainY(worldDistance + x);
        return tY + dy; 
    }
    if (obs.type === 'water') {
        let progress = (x - obs.x) / obs.width;
        let tY = getTerrainY(worldDistance + x);
        let dip = Math.sin(progress * Math.PI) * 60; 
        return tY + dip; 
    }
    if (obs.type === 'liana_bridge') {
        let progress = (x - obs.x) / obs.width;
        if (progress < 0.05 || progress > 0.95) return 1000;
        let tY = getTerrainY(worldDistance + x);
        return tY + Math.sin(progress * Math.PI) * obs.height;
    }
    if (obs.type === 'chasm' || obs.type === 'lava') {
        return 1000; 
    }
    if (obs.type === 'mud' || obs.type === 'poop_splat') {
        return getTerrainY(worldDistance + x); 
    }
    return null;
}

function updateWheel(wheel, timeScale) {
    wheel.vy += player.gravity * timeScale;
    wheel.y += wheel.vy * timeScale;

    let currentSurface = getTerrainY(worldDistance + wheel.x);
    wheel.isHittingWall = false;
    wheel.onUphillLiana = false;
    wheel.inWater = false;
    let waterSurfaceY = currentSurface;
    let onRamp = false;
    let overChasm = false;

    for (let obs of obstacles) {
        let surface = getObstacleSurface(wheel.x, obs);
        if (surface !== null) {
            if (obs.type === 'chasm' || obs.type === 'lava') {
                overChasm = true;
                currentSurface = surface;
            } else if (obs.type === 'water') {
                wheel.inWater = true;
                waterSurfaceY = getTerrainY(worldDistance + wheel.x); 
                currentSurface = surface;
            } else if (obs.type === 'crater' || obs.type === 'mud' || obs.type === 'poop_splat') {
                currentSurface = surface;
            } else if (obs.type === 'liana_bridge') {
                overChasm = true; 
                currentSurface = surface;
                let progress = (wheel.x - obs.x) / obs.width;
                if (progress > 0.5 && progress < 0.95) wheel.onUphillLiana = true;
            } else if ((obs.type === 'block' || obs.type === 'ice_block') && wheel.x < obs.x + 5 && wheel.y > obs.y) {
                wheel.isHittingWall = true;
            } else if (obs.type === 'round' && wheel.x < obs.x + 8 && wheel.y > obs.y + (obs.height * 0.4)) {
                wheel.isHittingWall = true;
            } else if (surface < currentSurface) {
                currentSurface = surface;
                if (obs.type === 'ramp' || obs.type === 'round' || obs.type === 'hill') onRamp = true;
            }
        }
    }

    if (wheel.isHittingWall) {
        wheel.x -= gameSpeed * timeScale; 
        player.targetBikeX -= gameSpeed * timeScale;
    } else if (!isLevelComplete || (isLevelComplete && !bikeStopped)) {
        wheel.x += (wheel.defaultX - wheel.x) * (0.1 * timeScale);
    }

    if (!wheel.isJumping && !overChasm && wheel.y < currentSurface && wheel.y > currentSurface - 20) {
        wheel.y = currentSurface;
        wheel.vy = 0;
    }

    if (wheel.y >= currentSurface && !overChasm) {
        wheel.y = currentSurface;
        wheel.onSurface = true; 
        if (onRamp && !wheel.isHittingWall) {
            wheel.vy = -gameSpeed * 1.5; 
            wheel.isJumping = true;
        } else {
            if (wheel.vy > 2) wheel.vy = -wheel.vy * 0.3;
            else {
                wheel.vy = 0;
                wheel.isJumping = false;
            }
        }
    } else {
        wheel.onSurface = false; 
    }

    if (wheel.inWater && wheel.y > waterSurfaceY) {
        wheel.vy *= 0.85; 
        
        let isRear = (wheel === player.rearWheel);
        let isFront = (wheel === player.frontWheel);
        
        if (isRear && (keys.rearJump || (typeof touchRearJump !== 'undefined' && touchRearJump))) {
            wheel.vy -= 0.9 * timeScale;
        }
        if (isFront && (keys.frontJump || (typeof touchFrontJump !== 'undefined' && touchFrontJump))) {
            wheel.vy -= 0.9 * timeScale;
        }
        
        wheel.isJumping = false; 
    }
}

function handleFrameCollision(timeScale) {
    if (player.rearWheel.inWater || player.frontWheel.inWater) return;

    let isScraping = false;
    let maxPenetration = 0;

    for (let i = 0.1; i < 1.0; i += 0.1) {
        let px = player.rearWheel.x + (player.frontWheel.x - player.rearWheel.x) * i;
        let py = player.rearWheel.y + (player.frontWheel.y - player.rearWheel.y) * i;
        
        let ty = getTerrainY(worldDistance + px);
        let overChasm = false;
        for (let obs of obstacles) {
            if ((obs.type === 'chasm' || obs.type === 'lava' || obs.type === 'liana_bridge' || obs.type === 'water') && px >= obs.x && px <= obs.x + obs.width) overChasm = true;
            if (obs.type === 'crater' && px >= obs.x && px <= obs.x + obs.width) {
                let craterSur = getObstacleSurface(px, obs);
                if (craterSur !== null) ty = craterSur;
            }
        }
        if (!overChasm && py > ty) {
            let pen = py - ty;
            if (pen > maxPenetration) maxPenetration = pen;
        }

        for (let obs of obstacles) {
            if (obs.type === 'ramp' || obs.type === 'chasm' || obs.type === 'lava' || obs.type === 'water' || obs.type === 'mud' || obs.type === 'poop_splat') continue;
            if (px >= obs.x && px <= obs.x + obs.width) {
                let surfaceY = getObstacleSurface(px, obs);
                if (surfaceY !== null && py > surfaceY && surfaceY !== 1000) {
                    let pen = py - surfaceY;
                    if (pen > maxPenetration) maxPenetration = pen;
                }
            }
        }
    }

    if (maxPenetration > 0) {
        player.rearWheel.y -= maxPenetration;
        player.frontWheel.y -= maxPenetration;
        if (player.rearWheel.vy > 0) player.rearWheel.vy *= 0.5;
        if (player.frontWheel.vy > 0) player.frontWheel.vy *= 0.5;
        isScraping = true;
        player.rearWheel.onSurface = true;
        player.frontWheel.onSurface = true;
    }

    if (isScraping && !isLevelComplete) {
        player.targetBikeX -= (gameSpeed * 1.2) * timeScale;
    }
}

function startCrash(type) {
    if (window.isInvincible && type !== 'fall') return; 

    if (isCrashing) return;
    isCrashing = true;
    crashType = type;
    lives--; 
    
    if (type === 'flip') {
        if (typeof playHit === 'function') playHit();
        crashAngle = Math.atan2(player.frontWheel.y - player.rearWheel.y, player.frontWheel.x - player.rearWheel.x);
        if (crashAngle < 0) crashAngle += Math.PI * 2;
        crashBikeLength = Math.hypot(player.frontWheel.x - player.rearWheel.x, player.frontWheel.y - player.rearWheel.y);
    } else if (type === 'tear') {
        if (typeof playTear === 'function') playTear();
        bikeParts = {
            rear: { x: player.rearWheel.x, y: player.rearWheel.y, vx: -4, vy: -4, rot: 0, rotV: -0.2 },
            front: { x: player.frontWheel.x, y: player.frontWheel.y, vx: gameSpeed * 2, vy: -6, rot: 0, rotV: 0.3 }
        };
    } else if (type === 'fall') {
        if (typeof playTear === 'function') playTear();
    }
    
    const cx = (player.rearWheel.x + player.frontWheel.x) / 2;
    const cy = (player.rearWheel.y + player.frontWheel.y) / 2;
    beanCrash.x = cx;
    beanCrash.y = cy - 20;
    beanCrash.vx = gameSpeed * 2.5; 
    beanCrash.vy = -5; 
    beanCrash.rotation = 0;
    beanCrash.isSplat = false;
}

function updateCrashAnimation(timeScale) {
    if (crashType === 'flip') {
        let targetAngle = Math.PI; 
        if (crashAngle < targetAngle) {
            crashAngle += 0.08 * timeScale;
            if (crashAngle > targetAngle) crashAngle = targetAngle;
        }
        let tY = getTerrainY(worldDistance + player.frontWheel.x);
        if (player.frontWheel.y < tY) {
            player.frontWheel.y += player.gravity * timeScale;
        }
        player.rearWheel.x = player.frontWheel.x - Math.cos(crashAngle) * crashBikeLength;
        player.rearWheel.y = player.frontWheel.y - Math.sin(crashAngle) * crashBikeLength;
    } else if (crashType === 'tear') {
        ['rear', 'front'].forEach(function(part) {
            let p = bikeParts[part];
            p.vy += player.gravity * timeScale;
            p.x += p.vx * timeScale;
            p.y += p.vy * timeScale;
            p.rot += p.rotV * timeScale;
            
            let tY = getTerrainY(worldDistance + p.x);
            if (p.y > tY + 5) {
                p.y = tY + 5;
                p.vy = -p.vy * 0.4;
                p.vx *= 0.8;
            }
        });
    }

    if (!beanCrash.isSplat) {
        beanCrash.vy += player.gravity * timeScale;
        beanCrash.x += beanCrash.vx * timeScale;
        beanCrash.y += beanCrash.vy * timeScale;
        beanCrash.rotation += 0.2 * timeScale;

        let tY = getTerrainY(worldDistance + beanCrash.x);
        if (beanCrash.y >= tY + 5) {
            beanCrash.y = tY + 5;
            beanCrash.isSplat = true;
            if (!hasPlayedSplatSound) {
                if (typeof playCrash === 'function') playCrash();
                hasPlayedSplatSound = true;
            }
        }
    } else {
        gameOverTimer += timeScale * 16.66;
        if (gameOverTimer > 1200) {
            if (lives > 0) {
                if (typeof respawnPlayer === 'function') respawnPlayer();
            } else {
                isGameOver = true;
            }
        }
    }
}

function updateFlyingObjects(timeScale, moveScale) {
    let cx = (player.rearWheel.x + player.frontWheel.x) / 2;
    let cy = (player.rearWheel.y + player.frontWheel.y) / 2;
    let beanX = cx;
    let beanY = cy - 25;
    const vehicleTypes = ['car', 'snowcat', 'rover', 'jeep', 'borer', 'taxi', 'uber'];

    for (let i = flyingObjects.length - 1; i >= 0; i--) {
        let obj = flyingObjects[i];

        if (obj.type === 'bubble') {
            obj.vy -= 0.05 * timeScale;
            obj.x += (obj.vx * timeScale) - (gameSpeed * moveScale);
            obj.y += obj.vy * timeScale;
            
            if (obj.y < -50 || obj.x < -100) {
                flyingObjects.splice(i, 1);
            }
            continue;
        }

        if (vehicleTypes.includes(obj.type)) {
            if (!obj.engineStarted && typeof startEngineSound === 'function') {
                startEngineSound(obj);
            }

            if (obj.crashed) {
                if (obj.vx > 0) {
                    obj.vx -= 0.1 * timeScale; 
                    if (obj.vx < 0) obj.vx = 0;
                    
                    obj.smokeTimer = (obj.smokeTimer || 0) + timeScale;
                    if (obj.smokeTimer > 2) {
                        obj.smokeTimer = 0;
                        window.weatherParticles.push({
                            x: obj.x + 20 + Math.random() * 20, 
                            y: getTerrainY(worldDistance + obj.x) - 5,
                            vx: -0.5 + Math.random(),
                            vy: -1 - Math.random(),
                            type: 'smoke',
                            color: 'rgba(150, 150, 150, 0.6)',
                            life: 1.0
                        });
                    }
                }
                if (obj.speechTimer > 0) {
                    obj.speechTimer -= timeScale;
                }
                
                obj.x += (obj.vx * timeScale) - (gameSpeed * moveScale);
                obj.y = getTerrainY(worldDistance + obj.x);

            } else {
                obj.x += (obj.vx * timeScale) - (gameSpeed * moveScale);
                obj.y = getTerrainY(worldDistance + obj.x);
                
                let carW = 50;
                let roofY = obj.y - 25;
                
                if (obj.type === 'snowcat') { carW = 60; roofY = obj.y - 30; }
                else if (obj.type === 'rover') { carW = 55; roofY = obj.y - 25; }
                else if (obj.type === 'jeep') { carW = 55; roofY = obj.y - 35; }
                else if (obj.type === 'borer') { carW = 80; roofY = obj.y - 40; }

                let rx = player.rearWheel.x, ry = player.rearWheel.y;
                let fx = player.frontWheel.x, fy = player.frontWheel.y;
                let onRoof = false;
                
                if (rx > obj.x - 5 && rx < obj.x + carW + 5 && ry >= roofY - 15 && ry <= roofY + 5 && player.rearWheel.vy >= 0) {
                    player.rearWheel.vy = player.jumpStrength * 1.5; 
                    player.rearWheel.isJumping = true;
                    player.rearWheel.onSurface = false;
                    onRoof = true;
                }
                if (fx > obj.x - 5 && fx < obj.x + carW + 5 && fy >= roofY - 15 && fy <= roofY + 5 && player.frontWheel.vy >= 0) {
                    player.frontWheel.vy = player.jumpStrength * 1.5;
                    player.frontWheel.isJumping = true;
                    player.frontWheel.onSurface = false;
                    onRoof = true;
                }

                if (onRoof) {
                    if (!obj.stomped) {
                        obj.stomped = true;
                        score += 5;
                        if (typeof playScore === 'function') playScore();
                    }
                    if (typeof playJump === 'function') playJump();
                } else if (!isCrashing && !window.isInvincible) {
                    if ((rx > obj.x && rx < obj.x + carW && ry > roofY + 5) || 
                        (fx > obj.x && fx < obj.x + carW && fy > roofY + 5) ||
                        (beanX > obj.x && beanX < obj.x + carW && beanY > roofY + 5)) {
                        
                        startCrash('flip');
                        
                        obj.crashed = true;
                        obj.speechTimer = 100; 
                        if (typeof stopEngineSound === 'function') stopEngineSound(obj);
                        if (typeof playSqueal === 'function') playSqueal();
                        setTimeout(function() { if (typeof playYell === 'function') playYell(); }, 400);
                        
                        continue;
                    }
                }
                
                if (obj.engineOsc && obj.engineGain) {
                    let targetFreq = 40 + (obj.vx * 5);
                    obj.engineOsc.frequency.linearRampToValueAtTime(targetFreq, window.audioCtx.currentTime + 0.1);
                }
            }
            
            if (obj.x > canvas.width + 200 || obj.x < -200) {
                if (typeof stopEngineSound === 'function') stopEngineSound(obj);
                flyingObjects.splice(i, 1);
            }
            continue; 
        }

        if (['cyclist', 'escooter'].includes(obj.type)) {
            if (obj.crashed) {
                obj.x -= gameSpeed * moveScale;
                if (obj.speechTimer > 0) obj.speechTimer -= timeScale;
            } else {
                obj.x += (obj.vx * timeScale) - (gameSpeed * moveScale);
                obj.y = getTerrainY(worldDistance + obj.x);

                if (!isCrashing && !window.isInvincible && Math.abs(cx - obj.x) < 25 && Math.abs(cy - obj.y) < 30) {
                    startCrash('flip');
                    obj.crashed = true;
                    obj.speechTimer = 100;
                    if (typeof playYell === 'function') setTimeout(playYell, 100);
                }
            }
            if (obj.x < -200 || obj.x > canvas.width + 200) {
                flyingObjects.splice(i, 1);
            }
            continue;
        }

        if (obj.type === 'motorboat') {
            if (!obj.crashed) {
                obj.x -= gameSpeed * moveScale; 
                
                let currentDist = obj.x - player.targetBikeX;
                if (obj.startDist > 0) {
                    obj.z = Math.max(-200, (currentDist / obj.startDist) * 1000);
                }
                
                let targetY = getTerrainY(worldDistance + obj.x) + 5;
                
                // EXAKTE WELLE wie im Wasser-Renderer! Das Boot schwimmt nun perfekt mit.
                let wave = Math.sin(performance.now() * 0.005 + obj.x * 0.05) * 3; 
                obj.y = targetY + wave;

                if (obj.z < 25 && obj.z > -15 && !isCrashing && !window.isInvincible) {
                    let scale = Math.max(0.1, 1000 / (Math.max(0, obj.z) + 200)); 
                    let boatW = 60 * scale; 
                    let boatTop = obj.y - (15 * scale); 
                    let boatBottom = obj.y + (5 * scale); 
                    
                    let rx = player.rearWheel.x, ry = player.rearWheel.y;
                    let fx = player.frontWheel.x, fy = player.frontWheel.y;
                    let onRoof = false;

                    let inBoatX = function(x) { return x > obj.x - boatW/2 && x < obj.x + boatW/2; };

                    if (inBoatX(rx) && ry >= boatTop - 20 && ry <= boatBottom && player.rearWheel.vy >= 0) {
                        player.rearWheel.vy = player.jumpStrength * 1.5; 
                        player.rearWheel.isJumping = true;
                        player.rearWheel.onSurface = false;
                        onRoof = true;
                    }
                    if (inBoatX(fx) && fy >= boatTop - 20 && fy <= boatBottom && player.frontWheel.vy >= 0) {
                        player.frontWheel.vy = player.jumpStrength * 1.5;
                        player.frontWheel.isJumping = true;
                        player.frontWheel.onSurface = false;
                        onRoof = true;
                    }

                    if (onRoof) {
                        if (!obj.stomped) {
                            obj.stomped = true;
                            score += 5;
                            if (typeof playScore === 'function') playScore();
                        }
                        if (typeof playJump === 'function') playJump();
                    } else {
                        let hitRear = inBoatX(rx) && ry > boatTop - 5 && ry < boatBottom + 10;
                        let hitFront = inBoatX(fx) && fy > boatTop - 5 && fy < boatBottom + 10;
                        
                        if (hitRear || hitFront) {
                            startCrash('flip');
                            obj.crashed = true;
                            obj.speechTimer = 100;
                            if (typeof playHit === 'function') playHit();
                        }
                    }
                }
            } else {
                obj.x -= gameSpeed * moveScale;
                if (obj.speechTimer > 0) obj.speechTimer -= timeScale;
            }
            if (obj.z < -200 || obj.x < -200) {
                flyingObjects.splice(i, 1);
            }
            continue;
        }
        
        if (obj.type === 'shark' && !obj.deflected) {
            obj.x -= gameSpeed * moveScale;
            
            if (!obj.jumpTriggered) {
                obj.y = canvas.height + 50; 
                if (obj.x - player.targetBikeX < 180 && obj.x - player.targetBikeX > 0) { 
                    obj.jumpTriggered = true;
                    obj.vy = -(7.0 + Math.random() * 1.5); 
                }
            } else {
                obj.vy += player.gravity * timeScale;
                obj.y += obj.vy * timeScale;
            }
        } 
        else if (obj.type === 'pigeon' && !obj.deflected) {
            obj.time = (obj.time || 0) + timeScale * 0.1;
            obj.x += (obj.vx * timeScale) - (gameSpeed * moveScale);
            obj.y = obj.spawnY + Math.sin(obj.time) * 15;

            obj.poopTimer = (obj.poopTimer || (Math.random() * 100 + 50)) - timeScale;
            if (obj.poopTimer <= 0) {
                obj.poopTimer = 150 + Math.random() * 100;
                flyingObjects.push({
                    id: 90000 + Math.floor(Math.random() * 1000),
                    x: obj.x, y: obj.y + 10, vx: obj.vx, vy: 0,
                    type: 'pigeon_poop', passed: true 
                });
            }
        } else if (obj.type === 'pigeon_poop') {
            obj.vy += player.gravity * timeScale;
            obj.x += (obj.vx * timeScale) - (gameSpeed * moveScale);
            obj.y += obj.vy * timeScale;

            let tY = getTerrainY(worldDistance + obj.x);
            if (obj.y >= tY) {
                obstacles.push({
                    id: 30000 + Math.floor(Math.random() * 1000),
                    x: obj.x - 10, y: tY + 5, baseY: tY + 5, width: 20, height: 5,
                    type: 'poop_splat', color: '#E8E8E8', passed: true
                });
                flyingObjects.splice(i, 1);
                continue;
            }
        } else if (obj.type === 'monkey' && !obj.deflected) {
            obj.time = (obj.time || 0) + timeScale * 0.04;
            obj.x += (obj.vx * timeScale) - (gameSpeed * moveScale);
            obj.y = obj.spawnY + Math.abs(Math.sin(obj.time)) * 100;
        } else if (obj.type === 'bat' && !obj.deflected) {
            obj.time = (obj.time || 0) + timeScale * 0.1;
            obj.x += (obj.vx * timeScale) - (gameSpeed * moveScale);
            obj.y = obj.spawnY + Math.sin(obj.time) * 20;
        } else if (obj.type === 'pelican' && !obj.deflected) {
            obj.time = (obj.time || 0) + timeScale * 0.08;
            obj.x += (obj.vx * timeScale) - (gameSpeed * moveScale);
            obj.y = obj.spawnY + Math.sin(obj.time) * 15;
        } else if (obj.type === 'fireball' && !obj.deflected) {
            obj.vy += 0.15 * timeScale; 
            obj.x += (obj.vx * timeScale) - (gameSpeed * moveScale);
            obj.y += obj.vy * timeScale;
        } else if (obj.type === 'falling_rock' && !obj.deflected) {
            obj.vy += 0.2 * timeScale; 
            obj.x -= (gameSpeed * moveScale); 
            obj.y += obj.vy * timeScale;
        } else if (obj.type !== 'shark') {
            obj.x += (obj.vx * timeScale) - (gameSpeed * moveScale);
            obj.y += obj.vy * timeScale;
        }

        let isCatchable = ['wasp', 'bird', 'bat', 'monkey', 'meteorite', 'fireball', 'falling_rock', 'pigeon', 'pelican', 'shark'].includes(obj.type);

        if (obj.type === 'meteorite' && !obj.deflected) {
            let tY = getTerrainY(worldDistance + obj.x);
            if (obj.y >= tY) {
                obstacles.push({
                    id: 20000 + obj.id, 
                    x: obj.x - 20, 
                    y: tY + 5, 
                    baseY: tY + 5,
                    width: 40,
                    height: 15,
                    type: 'crater',
                    color: '#333333',
                    passed: false
                });
                if (typeof playCrash === 'function') playCrash(); 
                flyingObjects.splice(i, 1);
                continue;
            }
        }
        
        if (obj.type === 'falling_rock' && !obj.deflected) {
            let tY = getTerrainY(worldDistance + obj.x);
            if (obj.y >= tY) {
                if (typeof playCrash === 'function') playCrash(); 
                flyingObjects.splice(i, 1);
                continue;
            }
        }

        let rDist = Math.hypot(player.rearWheel.x - obj.x, player.rearWheel.y - obj.y);
        let fDist = Math.hypot(player.frontWheel.x - obj.x, player.frontWheel.y - obj.y);
        
        let rx = player.rearWheel.x, ry = player.rearWheel.y;
        let fx = player.frontWheel.x, fy = player.frontWheel.y;
        let l2 = (fx - rx) * (fx - rx) + (fy - ry) * (fy - ry);
        let frameDist = 1000;
        if (l2 > 0) {
            let t = Math.max(0, Math.min(1, ((obj.x - rx) * (fx - rx) + (obj.y - ry) * (fy - ry)) / l2));
            let projX = rx + t * (fx - rx);
            let projY = ry + t * (fy - ry);
            frameDist = Math.hypot(obj.x - projX, obj.y - projY);
        }
        
        let bDist = Math.hypot(beanX - obj.x, beanY - obj.y);

        if (isCatchable && !obj.deflected && !isCrashing) {
            if (bDist < 20 || frameDist < 15 || rDist < 20 || fDist < 20) {
                obj.type = 'bubble';
                obj.deflected = true;
                obj.vx = -gameSpeed * 0.5;
                obj.vy = -1.0;
                score += 5;
                if (typeof playScore === 'function') playScore(); 
                continue;
            }
        }

        if (!isCrashing && !obj.passed && obj.x < player.rearWheel.defaultX - 10) {
            obj.passed = true;
            if (obj.id > highestScoredObstacle && obj.type !== 'pigeon_poop' && obj.type !== 'water') {
                score += 1;
                highestScoredObstacle = obj.id;
                if (typeof playScore === 'function') playScore();
            }
        }

        if (obj.x < -200 || obj.x > canvas.width + 200 || obj.y > canvas.height + 100 || obj.y < -150) {
            flyingObjects.splice(i, 1);
        }
    }
}