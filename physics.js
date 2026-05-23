// Berechnung des Terrain-Profils aus den Level-Konfigurationen
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

// Horizont fuer Hintergrundobjekte dynamisch anpassen
function getHorizonY() {
    if (designData && designData.physics && designData.physics.horizonY !== undefined) {
        return designData.physics.horizonY;
    }
    return 185;
}

// Ermittlung der Oberflaeche anhand aktueller Hindernisse
function getObstacleSurface(x, obs) {
    if (x < obs.x || x > obs.x + obs.width) return null;
    
    if (obs.type === 'block') return obs.baseY; 
    
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
    if (obs.type === 'chasm') {
        return 1000; 
    }
    return null;
}

// Physik-Update fuer ein einzelnes Rad
function updateWheel(wheel, timeScale) {
    wheel.vy += player.gravity * timeScale;
    wheel.y += wheel.vy * timeScale;

    let currentSurface = getTerrainY(worldDistance + wheel.x);
    wheel.isHittingWall = false;
    let onRamp = false;
    let overChasm = false;

    for (let obs of obstacles) {
        let surface = getObstacleSurface(wheel.x, obs);
        if (surface !== null) {
            if (obs.type === 'chasm') {
                overChasm = true;
                currentSurface = surface;
            } else if (obs.type === 'block' && wheel.x < obs.x + 5 && wheel.y > obs.y) {
                // Toleranz um 3 Pixel verringert, um Einschneiden an Kanten zu verhindern
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
        // Synchronisierung des globalen Ankerpunkts zur Vermeidung von Verspannungen
        player.targetBikeX -= gameSpeed * timeScale;
    } else if (!isLevelComplete || (isLevelComplete && !bikeStopped)) {
        wheel.x += (wheel.defaultX - wheel.x) * (0.1 * timeScale);
    }

    // Bergab-Haftung: Haelt das Rad bei moderaten Talfahrten am Boden
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

// Kollision zwischen Rahmen und Untergrund
function handleFrameCollision(timeScale) {
    let isScraping = false;
    let maxPenetration = 0;

    for (let i = 0.1; i < 1.0; i += 0.1) {
        let px = player.rearWheel.x + (player.frontWheel.x - player.rearWheel.x) * i;
        let py = player.rearWheel.y + (player.frontWheel.y - player.rearWheel.y) * i;
        
        let ty = getTerrainY(worldDistance + px);
        let overChasm = false;
        for (let obs of obstacles) {
            if (obs.type === 'chasm' && px >= obs.x && px <= obs.x + obs.width) overChasm = true;
        }
        if (!overChasm && py > ty) {
            let pen = py - ty;
            if (pen > maxPenetration) maxPenetration = pen;
        }

        for (let obs of obstacles) {
            if (obs.type === 'ramp' || obs.type === 'chasm') continue;
            if (px >= obs.x && px <= obs.x + obs.width) {
                let surfaceY = getObstacleSurface(px, obs);
                if (surfaceY !== null && py > surfaceY) {
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

// Initiierung der Absturzsequenz
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
// Fortschreibung der Crash-Animation
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
                respawnPlayer(); // <-- HIER GEÄNDERT: Setzt den Spieler nur ein kleines Stueck zurueck!
            } else {
                isGameOver = true;
            }
        }
    }
}