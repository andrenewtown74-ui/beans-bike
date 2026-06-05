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
    if (obs.type === 'liana_bridge') {
        let progress = (x - obs.x) / obs.width;
        if (progress < 0.05 || progress > 0.95) return 1000;
        let tY = getTerrainY(worldDistance + x);
        return tY + Math.sin(progress * Math.PI) * obs.height;
    }
    if (obs.type === 'chasm' || obs.type === 'lava') {
        return 1000; 
    }
    if (obs.type === 'mud') {
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
    let onRamp = false;
    let overChasm = false;

    for (let obs of obstacles) {
        let surface = getObstacleSurface(wheel.x, obs);
        if (surface !== null) {
            if (obs.type === 'chasm' || obs.type === 'lava') {
                overChasm = true;
                currentSurface = surface;
            } else if (obs.type === 'crater' || obs.type === 'mud') {
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
}

function handleFrameCollision(timeScale) {
    let isScraping = false;
    let maxPenetration = 0;

    for (let i = 0.1; i < 1.0; i += 0.1) {
        let px = player.rearWheel.x + (player.frontWheel.x - player.rearWheel.x) * i;
        let py = player.rearWheel.y + (player.frontWheel.y - player.rearWheel.y) * i;
        
        let ty = getTerrainY(worldDistance + px);
        let overChasm = false;
        for (let obs of obstacles) {
            if ((obs.type === 'chasm' || obs.type === 'lava' || obs.type === 'liana_bridge') && px >= obs.x && px <= obs.x + obs.width) overChasm = true;
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
            if (obs.type === 'ramp' || obs.type === 'chasm' || obs.type === 'lava' || obs.type === 'mud') continue;
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
    if (isCrashing) return;
    isCrashing = true;
    crashType = type;
    lives--; 
    
    if (type === 'flip') {
        playHit();
        crashAngle = Math.atan2(player.frontWheel.y - player.rearWheel.y, player.frontWheel.x - player.rearWheel.x);
        if (crashAngle < 0) crashAngle += Math.PI * 2;
        crashBikeLength = Math.hypot(player.frontWheel.x - player.rearWheel.x, player.frontWheel.y - player.rearWheel.y);
    } else if (type === 'tear') {
        playTear();
        bikeParts = {
            rear: { x: player.rearWheel.x, y: player.rearWheel.y, vx: -4, vy: -4, rot: 0, rotV: -0.2 },
            front: { x: player.frontWheel.x, y: player.frontWheel.y, vx: gameSpeed * 2, vy: -6, rot: 0, rotV: 0.3 }
        };
    } else if (type === 'fall') {
        playTear();
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
                playCrash();
                hasPlayedSplatSound = true;
            }
        }
    } else {
        gameOverTimer += timeScale * 16.66;
        if (gameOverTimer > 1200) {
            if (lives > 0) {
                respawnPlayer();
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

        if (obj.type === 'car') {
            if (obj.crashed) {
                // Auto bremst
                if (obj.vx > 0) {
                    obj.vx -= 0.1 * timeScale; 
                    if (obj.vx < 0) obj.vx = 0;
                    
                    // Rauchpartikel an den Reifen
                    obj.smokeTimer = (obj.smokeTimer || 0) + timeScale;
                    if (obj.smokeTimer > 2) {
                        obj.smokeTimer = 0;
                        window.weatherParticles.push({
                            x: obj.x + 10 + Math.random() * 30, // zwischen den Raedern
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
                
                // Mit dem Terrain mitscrollen, wenn das Auto steht (vx = 0)
                obj.x += (obj.vx * timeScale) - (gameSpeed * moveScale);
                obj.y = getTerrainY(worldDistance + obj.x);

            } else {
                obj.x += (obj.vx * timeScale) - (gameSpeed * moveScale);
                obj.y = getTerrainY(worldDistance + obj.x);
                
                let carW = 50;
                let roofY = obj.y - 25;

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
                    playJump();
                } else if (!isCrashing) {
                    if ((rx > obj.x && rx < obj.x + carW && ry > roofY + 5) || 
                        (fx > obj.x && fx < obj.x + carW && fy > roofY + 5) ||
                        (beanX > obj.x && beanX < obj.x + carW && beanY > roofY + 5)) {
                        
                        startCrash('flip');
                        
                        // Auto schrotten / anhalten
                        obj.crashed = true;
                        obj.speechTimer = 100; // Anzeigezeit für Fluch-Blase
                        if (typeof playSqueal === 'function') playSqueal();
                        setTimeout(() => { if (typeof playYell === 'function') playYell(); }, 400);
                        
                        continue;
                    }
                }
            }
            
            if (obj.x > canvas.width + 200 || obj.x < -200) {
                flyingObjects.splice(i, 1);
            }
            continue; 
        }

        if (obj.type === 'monkey' && !obj.deflected) {
            obj.time = (obj.time || 0) + timeScale * 0.04;
            obj.x += (obj.vx * timeScale) - (gameSpeed * moveScale);
            obj.y = obj.spawnY + Math.abs(Math.sin(obj.time)) * 100;
        } else if (obj.type === 'bat' && !obj.deflected) {
            obj.time = (obj.time || 0) + timeScale * 0.1;
            obj.x += (obj.vx * timeScale) - (gameSpeed * moveScale);
            obj.y = obj.spawnY + Math.sin(obj.time) * 20;
        } else if (obj.type === 'fireball' && !obj.deflected) {
            obj.vy += 0.15 * timeScale; 
            obj.x += (obj.vx * timeScale) - (gameSpeed * moveScale);
            obj.y += obj.vy * timeScale;
        } else if (obj.type === 'falling_rock' && !obj.deflected) {
            obj.vy += 0.2 * timeScale; 
            obj.x -= (gameSpeed * moveScale); 
            obj.y += obj.vy * timeScale;
        } else {
            obj.x += (obj.vx * timeScale) - (gameSpeed * moveScale);
            obj.y += obj.vy * timeScale;
        }

        let isAnimal = ['wasp', 'bird', 'bat', 'monkey'].includes(obj.type);
        let isHazard = ['meteorite', 'falling_rock', 'fireball'].includes(obj.type);

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
                playCrash(); 
                flyingObjects.splice(i, 1);
                continue;
            }
        }
        
        if (obj.type === 'falling_rock' && !obj.deflected) {
            let tY = getTerrainY(worldDistance + obj.x);
            if (obj.y >= tY) {
                playCrash(); 
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

        if (isAnimal && !obj.deflected && !isCrashing) {
            if (bDist < 20 || frameDist < 15 || rDist < 20 || fDist < 20) {
                obj.type = 'bubble';
                obj.deflected = true;
                obj.vx = -gameSpeed * 0.5;
                obj.vy = -1.0;
                score += 5;
                if (typeof playScore === 'function') playScore(); 
                continue;
            }
        } else if (isHazard && !obj.deflected && !isCrashing) {
            if (bDist < 15 || frameDist < 10) {
                startCrash('flip');
                flyingObjects.splice(i, 1);
                continue;
            } else if (rDist < 18 || fDist < 18) {
                obj.deflected = true;
                obj.vx = 4;
                obj.vy = -3;
                playJump(); 
            }
        }

        if (!isCrashing && !obj.passed && obj.x < player.rearWheel.defaultX - 10) {
            obj.passed = true;
            if (obj.id > highestScoredObstacle) {
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