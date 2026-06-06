canvas = document.getElementById('gameCanvas');
ctx = canvas.getContext('2d');
uiLayer = document.getElementById('ui-layer');
titleEl = document.getElementById('title');
instructionEl = document.getElementById('instruction');
touchControls = document.getElementById('touch-controls');
fullscreenBtn = document.getElementById('fullscreen-btn');
headlightBtn = document.getElementById('headlight-btn');

namePopup = document.getElementById('name-popup');
popupScore = document.getElementById('popup-score');
playerNameInput = document.getElementById('player-name-input');
saveScoreBtn = document.getElementById('save-score-btn');

window.weatherParticles = window.weatherParticles || [];
window.rainParticles = window.rainParticles || [];

const fallbackLevelData = [
    { "id": 0, "spawnDistance": 300, "type": "block", "width": 40, "height": 15, "color": "#8B4513" }
];

const fallbackDesignData = {
    "theme": {
        "skyColor": "#87CEEB",
        "groundColor": "#8B4513",
        "surfaceColor": "#228B22",
        "music": "Sprocket_Hill_Climb.mp3",
        "sun": { "active": true, "color": "#FFD700", "size": 20, "xOffset": 100, "y": 20 },
        "headlightOn": false
    },
    "physics": {
        "gravity": 0.35,
        "jumpStrength": -6.5,
        "horizonY": 185,
        "terrainType": "flat",
        "baseGroundY": 185,
        "levelDistance": 6000
    },
    "objects": []
};

let isLoadingData = false;
window.hasInteracted = false; // NEU: Merkt sich, ob der Spieler schon geklickt hat

designData = fallbackDesignData;
loadLevelData(currentLevel);

if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    if (touchControls) touchControls.classList.remove('hidden');
    let kbInst = document.getElementById('keyboard-instructions');
    if (kbInst) kbInst.classList.add('hidden');
}
resizeCanvas();

function checkHeadlight() {
    if (currentLevel === 3 || currentLevel === 5) {
        isHeadlightOn = true;
    }
    if (headlightBtn) {
        headlightBtn.innerText = isHeadlightOn ? "Licht: AN" : "Licht: AUS";
    }
}

if (headlightBtn) {
    headlightBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        isHeadlightOn = !isHeadlightOn;
        headlightBtn.innerText = isHeadlightOn ? "Licht: AN" : "Licht: AUS";
    });
}

async function loadLevelData(levelNum) {
    try {
        const response = await fetch(`level${levelNum}.json`);
        if (!response.ok) throw new Error('HTTP Status ' + response.status);
        const data = await response.json();
        levelData = data;
        for(let i = 0; i < levelData.length; i++) levelData[i].id = i;
    } catch (error) {
        levelData = fallbackLevelData;
    }

    try {
        const response = await fetch(`design_level_${levelNum}.json`);
        if (!response.ok) throw new Error('HTTP Status ' + response.status);
        const data = await response.json();
        designData = data;
    } catch (error) {
        designData = fallbackDesignData;
    }

    initBackground();
    updateMusic();
    updatePhysicsConfig();
    checkHeadlight();
}

function updateMusic() {
    if (designData && designData.theme && designData.theme.music) {
        if (typeof bgMusic !== 'undefined' && !bgMusic.src.endsWith(designData.theme.music)) {
            bgMusic.src = designData.theme.music;
            if (isGameRunning && !isLevelComplete) {
                bgMusic.play().catch(function(err) {});
            }
        }
    }
}

function updatePhysicsConfig() {
    if (designData && designData.physics) {
        player.gravity = designData.physics.gravity !== undefined ? designData.physics.gravity : 0.35;
        player.jumpStrength = designData.physics.jumpStrength !== undefined ? designData.physics.jumpStrength : -6.5;
        levelDistance = designData.physics.levelDistance !== undefined ? designData.physics.levelDistance : 6000;
    }
}

function initBackground() {
    backgroundElements.length = 0;
    if (!designData || !designData.objects) return;

    designData.objects.forEach(function(objConfig) {
        for (let i = 0; i < objConfig.count; i++) {
            backgroundElements.push({
                x: Math.random() * canvas.width,
                width: objConfig.minWidth + Math.random() * (objConfig.maxWidth - objConfig.minWidth),
                height: objConfig.minHeight + Math.random() * (objConfig.maxHeight - objConfig.minHeight),
                speedModifier: objConfig.speedModifier,
                type: objConfig.type,
                color1: objConfig.color1,
                color2: objConfig.color2
            });
        }
    });
}

async function startNewGame() {
    if (isLoadingData) return;
    isLoadingData = true;
    lives = typeof STARTING_LIVES !== 'undefined' ? STARTING_LIVES : 5;
    score = 0;
    levelStartScore = 0;
    currentLevel = 1;
    await loadLevelData(currentLevel);
    restartLevel();
    isLoadingData = false;
}

async function advanceLevel() {
    if (isLoadingData) return;
    isLoadingData = true;
    currentLevel++;
    levelStartScore = score;
    await loadLevelData(currentLevel);
    restartLevel();
    isLoadingData = false;
}

async function handleGameOverRestart() {
    if (isLoadingData) return;
    isLoadingData = true;
    lives = typeof STARTING_LIVES !== 'undefined' ? STARTING_LIVES : 5;
    score = levelStartScore;
    await loadLevelData(currentLevel);
    restartLevel();
    isLoadingData = false;
}

function restartLevel() {
    if (typeof stopEngineSound === 'function') {
        flyingObjects.forEach(function(obj) { stopEngineSound(obj); });
    }
    flyingObjects = [];
    window.weatherParticles = [];
    window.rainParticles = [];
    
    window.scoreSubmitted = false; 
    
    player.targetBikeX = 30;
    keys.up = false;
    keys.down = false;
    touchGas = false;
    touchBrake = false;

    worldDistance = 0;
    highestScoredObstacle = -1;
    let startY = getTerrainY(player.targetBikeX);

    player.rearWheel.y = startY;
    player.rearWheel.defaultX = 30;
    player.rearWheel.x = player.rearWheel.defaultX;
    player.rearWheel.vy = 0;
    player.rearWheel.isJumping = false;
    player.rearWheel.isHittingWall = false;
    player.rearWheel.onUphillLiana = false;
    player.rearWheel.onSurface = true;
    
    player.frontWheel.y = getTerrainY(90);
    player.frontWheel.defaultX = 90;
    player.frontWheel.x = player.frontWheel.defaultX;
    player.frontWheel.vy = 0;
    player.frontWheel.isJumping = false;
    player.frontWheel.isHittingWall = false;
    player.frontWheel.onUphillLiana = false;
    player.frontWheel.onSurface = true;
    
    obstacles.length = 0;
    nextObstacleIndex = 0;
    finishLineActive = false;
    finishLineX = 0;
    isLevelComplete = false;
    bikeStopped = false;
    hasPlayedFanfare = false;
    
    gameSpeed = 1.5;
    pedalAngle = 0;
    
    isGameOver = false;
    isCrashing = false;
    crashType = '';
    gameOverTimer = 0;
    beanCrash.isSplat = false;
    hasPlayedSplatSound = false;
    
    lastTime = performance.now();
    initBackground();
    checkHeadlight();
    
    uiLayer.classList.add('hidden');
    isGameRunning = true;
    
    if (typeof initAudio === 'function') initAudio();
    if (typeof startMusic === 'function') startMusic();
    
    cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(gameLoop);
}

function respawnPlayer() {
    if (typeof stopEngineSound === 'function') {
        flyingObjects.forEach(function(obj) { stopEngineSound(obj); });
    }
    flyingObjects = [];
    worldDistance = Math.max(0, worldDistance - 400);

    player.targetBikeX = 30;
    let startY = getTerrainY(worldDistance + player.targetBikeX);

    player.rearWheel.y = startY;
    player.rearWheel.defaultX = 30;
    player.rearWheel.x = player.rearWheel.defaultX;
    player.rearWheel.vy = 0;
    player.rearWheel.isJumping = false;
    player.rearWheel.isHittingWall = false;
    player.rearWheel.onUphillLiana = false;
    player.rearWheel.onSurface = true;
    
    player.frontWheel.y = getTerrainY(worldDistance + 90);
    player.frontWheel.defaultX = 90;
    player.frontWheel.x = player.frontWheel.defaultX;
    player.frontWheel.vy = 0;
    player.frontWheel.isJumping = false;
    player.frontWheel.isHittingWall = false;
    player.frontWheel.onUphillLiana = false;
    player.frontWheel.onSurface = true;

    keys.up = false;
    keys.down = false;
    touchGas = false;
    touchBrake = false;

    obstacles.length = 0;
    nextObstacleIndex = 0;
    for (let i = 0; i < levelData.length; i++) {
        if (levelData[i].spawnDistance > worldDistance) {
            nextObstacleIndex = i;
            break;
        }
    }
    if (nextObstacleIndex === 0 && levelData.length > 0 && levelData[levelData.length - 1].spawnDistance <= worldDistance) {
        nextObstacleIndex = levelData.length;
    }

    isCrashing = false;
    crashType = '';
    gameOverTimer = 0;
    beanCrash.isSplat = false;
    hasPlayedSplatSound = false;
    
    lastTime = performance.now();
    if (typeof startMusic === 'function') startMusic();
}

function handleInputEvent() {
    if (isPopupOpen) return false; 

    // 1. Klick: Musik aktivieren, Spiel noch NICHT starten
    if (!window.hasInteracted && !isGameRunning) {
        window.hasInteracted = true;
        
        // NEU: Aufruf der sequenziellen Playlist-Funktion
        if (typeof playMenuMusic === 'function') {
            playMenuMusic();
        }
        
        // Text anpassen, um zu zeigen, dass das Spiel jetzt startklar ist
        if (instructionEl) {
            instructionEl.innerText = "Musik laeuft! Klick / Touch fuer Spielstart";
        }
        return true; 
    }

    // 2. Klick: Spiel starten
    if (typeof initAudio === 'function') initAudio();
    if (isGameOver) {
        handleGameOverRestart();
        return true;
    }
    if (isLevelComplete && bikeStopped) {
        if (currentLevel >= 6) { 
            startNewGame();
        } else {
            advanceLevel();
        }
        return true;
    }
    if (!isGameRunning) {
        if (typeof stopMenuMusic === 'function') stopMenuMusic();
        startNewGame();
        return true;
    }
    return false;
}

function jump(wheel) {
    if (isPopupOpen) return;
    if (handleInputEvent()) return;
    if (isLevelComplete || isCrashing) return;
    
    if (wheel === 'rear' && player.rearWheel.onSurface) {
        player.rearWheel.vy = player.jumpStrength;
        player.rearWheel.isJumping = true;
        player.rearWheel.onSurface = false;
        if (typeof playJump === 'function') playJump();
    } else if (wheel === 'front' && player.frontWheel.onSurface) {
        player.frontWheel.vy = player.jumpStrength;
        player.frontWheel.isJumping = true;
        player.frontWheel.onSurface = false;
        if (typeof playJump === 'function') playJump();
    }
}

window.addEventListener('keydown', function(e) {
    if (isPopupOpen) return; 
// --- CHEAT / DEV-MODUS ---
    // Mit den Tasten 1 bis 6 direkt in das jeweilige Level springen
    if (['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'].includes(e.code)) {
        currentLevel = parseInt(e.key);
        levelStartScore = score; 
        
        // Lade die neuen Level-Daten und starte direkt neu
        loadLevelData(currentLevel).then(function() {
            restartLevel();
        });
        e.preventDefault();
        return;
    }
    if (['Space', 'KeyN', 'KeyM', 'ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(e.code)) {
        if (handleInputEvent()) { e.preventDefault(); return; }
    }
    if (isLevelComplete) return;

    if (e.code === 'KeyN') { jump('rear'); e.preventDefault(); }
    if (e.code === 'KeyM') { jump('front'); e.preventDefault(); }
    if (e.code === 'KeyD' || e.code === 'ArrowRight') { keys.up = true; e.preventDefault(); }
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') { keys.down = true; e.preventDefault(); }
});

window.addEventListener('keyup', function(e) {
    if (isPopupOpen) return;

    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.up = false;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.down = false;
});

function handleTouch(e) {
    if (isPopupOpen) return; 

    if (e.target.id === 'headlight-btn' || e.target.id === 'fullscreen-btn') return;
    if (handleInputEvent()) {
        if (e.cancelable) e.preventDefault();
        return;
    }
    if (isLevelComplete) return;

    touchBrake = false;
    touchGas = false;
    let touchingRear = false;
    let touchingFront = false;

    const w = window.innerWidth;
    const q1 = w * 0.25;
    const q2 = w * 0.50;
    const q3 = w * 0.75;

    for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i];
        if (t.clientX < q1) {
            touchBrake = true;
        } else if (t.clientX >= q1 && t.clientX < q2) {
            touchGas = true;
        } else if (t.clientX >= q2 && t.clientX < q3) {
            touchingRear = true;
        } else if (t.clientX >= q3) {
            touchingFront = true;
        }
    }

    if (e.type === 'touchstart') {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            if (t.clientX >= q2 && t.clientX < q3) {
                jump('rear');
            } else if (t.clientX >= q3) {
                jump('front');
            }
        }
    }

    const zoneBrake = document.getElementById('zone-brake');
    const zoneGas = document.getElementById('zone-gas');
    const zoneRear = document.getElementById('zone-rear');
    const zoneFront = document.getElementById('zone-front');

    if (zoneBrake) {
        zoneBrake.classList.toggle('active', touchBrake);
        zoneGas.classList.toggle('active', touchGas);
        zoneRear.classList.toggle('active', touchingRear);
        zoneFront.classList.toggle('active', touchingFront);
    }

    if (e.cancelable) e.preventDefault();
}

window.addEventListener('touchstart', handleTouch, { passive: false });
window.addEventListener('touchmove', handleTouch, { passive: false });
window.addEventListener('touchend', handleTouch, { passive: false });
window.addEventListener('touchcancel', handleTouch, { passive: false });

window.addEventListener('mousedown', function(e) {
    if (isPopupOpen) return; 

    if (e.target.id === 'headlight-btn' || e.target.id === 'fullscreen-btn') return;

    if (handleInputEvent()) return;
    if (isLevelComplete) return;

    const w = window.innerWidth;
    const q2 = w * 0.50;
    const q3 = w * 0.75;

    if (e.clientX >= q2 && e.clientX < q3) {
        jump('rear');
        const z = document.getElementById('zone-rear');
        if(z) { z.classList.add('active'); setTimeout(() => z.classList.remove('active'), 150); }
    } else if (e.clientX >= q3) {
        jump('front');
        const z = document.getElementById('zone-front');
        if(z) { z.classList.add('active'); setTimeout(() => z.classList.remove('active'), 150); }
    }
});

fullscreenBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation(); 
    const elem = document.documentElement;
    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
    if (!isFullscreen) {
        let requestFS = elem.requestFullscreen || elem.webkitRequestFullscreen || elem.mozRequestFullScreen || elem.msRequestFullscreen;
        if (requestFS) requestFS.call(elem).catch(function() {});
    } else {
        let exitFS = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
        if (exitFS) exitFS.call(document);
    }
});

document.addEventListener('fullscreenchange', function() {
    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
    fullscreenBtn.innerText = isFullscreen ? "Fenster" : "Vollbild";
});

function resizeCanvas() {
    canvas.height = 200;
    canvas.width = 200 * (window.innerWidth / window.innerHeight);
    ctx.imageSmoothingEnabled = false;
}
window.addEventListener('resize', resizeCanvas);

function spawnObstaclesFromData(timeScale, moveScale) {
    if (finishLineActive) return; 

    worldDistance += gameSpeed * moveScale;
    if (nextObstacleIndex < levelData.length) {
        let nextObs = levelData[nextObstacleIndex];
        if (worldDistance >= nextObs.spawnDistance) {
            const vehicleTypes = ['car', 'snowcat', 'rover', 'jeep', 'borer', 'taxi', 'uber'];
            if (['wasp', 'bird', 'meteorite', 'monkey', 'bat', 'fireball', 'falling_rock', 'pigeon', 'pigeon_poop', 'cyclist', 'escooter'].concat(vehicleTypes).includes(nextObs.type)) {
                let startY = 100;
                let speedVal = nextObs.speed !== undefined ? nextObs.speed : 1.0;
                let vxVal = -speedVal; 
                let vyVal = 0;
                let spawnX = canvas.width + 50;

                if (vehicleTypes.includes(nextObs.type)) {
                    spawnX = -150; 
                    vxVal = gameSpeed + speedVal; 
                    startY = getTerrainY(worldDistance + spawnX);
                } else if (['cyclist', 'escooter'].includes(nextObs.type)) {
                    spawnX = canvas.width + 50; 
                    vxVal = -(gameSpeed + speedVal); 
                    startY = getTerrainY(worldDistance + spawnX);
                } else if (nextObs.type === 'meteorite') {
                    startY = -20;
                    vxVal = -speedVal * 0.7; 
                    vyVal = speedVal * 0.8;
                } else if (nextObs.type === 'falling_rock') {
                    startY = -40;
                    vxVal = 0;
                    vyVal = speedVal;
                    spawnX = player.targetBikeX + 150 + Math.random() * 50; 
                } else if (nextObs.type === 'monkey') {
                    let tY = getTerrainY(worldDistance + canvas.width);
                    startY = tY - 100; 
                    vxVal = -speedVal; 
                } else if (nextObs.type === 'bat') {
                    let tY = getTerrainY(worldDistance + canvas.width);
                    startY = tY - 60;
                    vxVal = -speedVal; 
                } else if (nextObs.type === 'fireball') {
                    startY = canvas.height + 20; 
                    vxVal = -gameSpeed; 
                    vyVal = -8; 
                } else if (nextObs.type === 'pigeon') {
                    startY = nextObs.spawnY !== undefined ? nextObs.spawnY : 50;
                    vxVal = -speedVal;
                } else {
                    let tY = getTerrainY(worldDistance + canvas.width);
                    startY = nextObs.spawnY !== undefined ? nextObs.spawnY : tY - 40;
                }

                flyingObjects.push({
                    id: nextObs.id,
                    x: spawnX,
                    y: startY,
                    spawnY: startY,
                    vx: vxVal,
                    vy: vyVal,
                    type: nextObs.type,
                    speed: speedVal,
                    color: nextObs.color,
                    deflected: false,
                    passed: false,
                    crashed: false,
                    smokeTimer: 0,
                    speechTimer: 0,
                    engineStarted: false
                });
            } else {
                let tY = getTerrainY(worldDistance + canvas.width);
                obstacles.push({
                    id: nextObs.id,
                    x: canvas.width,
                    y: tY + 5 - nextObs.height, 
                    baseY: tY + 5 - nextObs.height,
                    width: nextObs.width,
                    height: nextObs.height,
                    type: nextObs.type,
                    color: nextObs.color,
                    passed: false
                });
            }
            nextObstacleIndex++;
        }
    }
}

function gameLoop(timestamp) {
    if (!isGameRunning) return;
    if (!lastTime) lastTime = timestamp;
    let deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    if (deltaTime > 100) deltaTime = 16.66;
    const timeScale = deltaTime / 16.666;

    if (isGameOver) {
        isGameRunning = false;
        titleEl.innerText = "Game Over!";
        
        if (!window.scoreSubmitted && score > 0) {
            showNamePopup();
        } else if (!isPopupOpen) {
            instructionEl.innerText = "Punkte: " + score + " | KLICK fuer Neustart";
            uiLayer.classList.remove('hidden');
        }
        return;
    }

    if (!isLevelComplete && !isCrashing) {
        if (worldDistance >= levelDistance && !finishLineActive) {
            finishLineActive = true;
            finishLineX = canvas.width + 100;
        }
    }

    let moveScale = (isCrashing || (isLevelComplete && bikeStopped)) ? 0 : timeScale;

    if (!isCrashing) {
        if (!isLevelComplete) {
            let isAccelerating = keys.up || touchGas;
            let isBraking = keys.down || touchBrake;

            let onMud = false;
            let onPoop = false;
            for (let obs of obstacles) {
                if (obs.type === 'mud' && player.rearWheel.defaultX >= obs.x && player.rearWheel.defaultX <= obs.x + obs.width) {
                    onMud = true;
                }
                if (obs.type === 'poop_splat' && player.rearWheel.defaultX >= obs.x && player.rearWheel.defaultX <= obs.x + obs.width) {
                    onPoop = true;
                }
            }

            if (player.rearWheel.onUphillLiana && !isAccelerating) {
                player.targetBikeX -= 3.5 * timeScale;
            } else if (onPoop) {
                // Extremes Rutschen durch Tauben-Dreck
                player.targetBikeX -= 4.5 * timeScale;
                if (Math.random() < 0.1 && typeof playSqueal === 'function') playSqueal();
            } else if (onMud) {
                if (isAccelerating) {
                    player.targetBikeX -= 0.5 * timeScale;
                } else if (isBraking) {
                    player.targetBikeX -= 3.5 * timeScale;
                } else {
                    player.targetBikeX -= 2.0 * timeScale;
                }
            } else {
                if (isAccelerating) {
                    player.targetBikeX += 2.5 * timeScale;
                } else if (isBraking) {
                    player.targetBikeX -= 2.5 * timeScale;
                } else {
                    let centerTargetX = canvas.width * 0.4;
                    player.targetBikeX += (centerTargetX - player.targetBikeX) * 0.02 * timeScale;
                }
            }
        } else {
            player.targetBikeX += 2.0 * timeScale;
            if (player.frontWheel.x >= canvas.width / 2) {
                bikeStopped = true;
                if (!hasPlayedFanfare) {
                    if (typeof playFanfare === 'function') playFanfare();
                    hasPlayedFanfare = true;
                    
                    if (currentLevel >= 6) { // Sieg-Bedingung auf Level 6 erhoeht
                        titleEl.innerText = "Herzlichen Glückwunsch!";
                        if (!window.scoreSubmitted && score > 0) {
                            showNamePopup();
                        } else if (!isPopupOpen) {
                            instructionEl.innerText = "Spiel durchgespielt! Klick fuer einen Neustart.";
                            uiLayer.classList.remove('hidden');
                        }
                    } else {
                        titleEl.innerText = `Level ${currentLevel} Geschafft!`;
                        instructionEl.innerText = "Klick / Touch fuer naechstes Level";
                        uiLayer.classList.remove('hidden');
                    }
                }
            }
        }
        
        if (player.targetBikeX < 20) player.targetBikeX = 20;
        if (player.targetBikeX > canvas.width - 50 && !isLevelComplete) player.targetBikeX = canvas.width - 50;

        player.rearWheel.defaultX = player.targetBikeX;
        player.frontWheel.defaultX = player.targetBikeX + 60;

        if (typeof updateWheel === 'function') {
            updateWheel(player.rearWheel, timeScale);
            updateWheel(player.frontWheel, timeScale);
            if (typeof handleFrameCollision === 'function') handleFrameCollision(timeScale);
        }

        if (player.rearWheel.y > canvas.height + 50 || player.frontWheel.y > canvas.height + 50) {
            if (typeof startCrash === 'function') startCrash('fall');
        } else {
            const dx = player.frontWheel.x - player.rearWheel.x;
            if (player.frontWheel.isHittingWall && dx < 30) {
                if (typeof startCrash === 'function') startCrash('flip');
            }
            else if (player.rearWheel.isHittingWall && dx > 110) {
                if (typeof startCrash === 'function') startCrash('tear');
            }

            if (!player.rearWheel.isJumping && !player.frontWheel.isJumping && !player.frontWheel.isHittingWall && !bikeStopped) {
                let currentPedalSpeed = gameSpeed * 0.15;
                if (!isLevelComplete && (keys.up || touchGas)) currentPedalSpeed += 0.1;
                if (!isLevelComplete && (keys.down || touchBrake)) currentPedalSpeed = Math.max(0.05, currentPedalSpeed - 0.1);
                
                let oldAngle = pedalAngle;
                pedalAngle += currentPedalSpeed * timeScale;
                if (Math.floor(oldAngle / Math.PI) < Math.floor(pedalAngle / Math.PI)) {
                    if (typeof playPedalSound === 'function') playPedalSound();
                }
            }
        }
    } else {
        if (typeof updateCrashAnimation === 'function') updateCrashAnimation(timeScale);
    }

    if (finishLineActive && player.frontWheel.x >= finishLineX && !isLevelComplete) {
        isLevelComplete = true;
    }

    if (typeof drawEnvironment === 'function') drawEnvironment(moveScale);
    
    spawnObstaclesFromData(timeScale, moveScale);
    if (typeof updateFlyingObjects === 'function') updateFlyingObjects(timeScale, moveScale);
    
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.x -= gameSpeed * moveScale;

        if (obs.type !== 'chasm' && obs.type !== 'lava' && obs.type !== 'liana_bridge' && obs.type !== 'mud' && obs.type !== 'poop_splat') {
            ctx.fillStyle = obs.color;
            ctx.strokeStyle = '#000';
            ctx.beginPath();
            if (obs.type === 'block' || obs.type === 'ice_block') { 
                ctx.rect(obs.x, obs.y, obs.width, obs.height); 
                if (obs.type === 'ice_block') {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                    ctx.fill();
                }
            } 
            else if (obs.type === 'ramp') { 
                ctx.moveTo(obs.x, getTerrainY(worldDistance + obs.x) + 5); 
                ctx.lineTo(obs.x + obs.width, obs.y); 
                ctx.lineTo(obs.x + obs.width, getTerrainY(worldDistance + obs.x + obs.width) + 5); 
            } 
            else if (obs.type === 'round') { 
                ctx.moveTo(obs.x, getTerrainY(worldDistance + obs.x) + 5); 
                ctx.ellipse(obs.x + obs.width / 2, getTerrainY(worldDistance + obs.x + obs.width/2) + 5, obs.width / 2, obs.height, 0, Math.PI, 0); 
            }
            else if (obs.type === 'hill') { 
                ctx.moveTo(obs.x, getTerrainY(worldDistance + obs.x) + 5); 
                ctx.quadraticCurveTo(obs.x + obs.width / 2, getTerrainY(worldDistance + obs.x + obs.width/2) + 5 - obs.height * 2, obs.x + obs.width, getTerrainY(worldDistance + obs.x + obs.width) + 5); 
            }
            else if (obs.type === 'crater') {
                ctx.moveTo(obs.x, getTerrainY(worldDistance + obs.x) + 5);
                ctx.quadraticCurveTo(obs.x + obs.width / 2, getTerrainY(worldDistance + obs.x + obs.width/2) + 5 + obs.height * 2, obs.x + obs.width, getTerrainY(worldDistance + obs.x + obs.width) + 5);
            }
            ctx.fill(); ctx.stroke();
        } else if (obs.type === 'poop_splat') {
            ctx.fillStyle = obs.color || '#E8E8E8';
            ctx.beginPath();
            ctx.ellipse(obs.x + obs.width / 2, obs.y - 2, obs.width / 2, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#556B2F';
            ctx.beginPath();
            ctx.ellipse(obs.x + obs.width / 2 + 3, obs.y - 2, obs.width / 4, 2, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (obs.type === 'mud') {
            ctx.fillStyle = obs.color || '#1c140d';
            ctx.beginPath();
            for (let j = 0; j <= obs.width; j += 5) {
                let tY = getTerrainY(worldDistance + obs.x + j) + 5;
                if (j === 0) ctx.moveTo(obs.x + j, tY - 1);
                else ctx.lineTo(obs.x + j, tY - 1);
            }
            ctx.lineTo(obs.x + obs.width, canvas.height);
            ctx.lineTo(obs.x, canvas.height);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.arc(obs.x + obs.width * 0.3, getTerrainY(worldDistance + obs.x + obs.width*0.3) + 3, 3, 0, Math.PI*2);
            ctx.arc(obs.x + obs.width * 0.7, getTerrainY(worldDistance + obs.x + obs.width*0.7) + 3, 2, 0, Math.PI*2);
            ctx.fill();
        } else if (obs.type === 'liana_bridge') {
            ctx.fillStyle = '#5C4033';
            ctx.fillRect(obs.x - 10, getTerrainY(worldDistance + obs.x) + 5 - 100, 20, 100);
            ctx.fillRect(obs.x + obs.width - 10, getTerrainY(worldDistance + obs.x + obs.width) + 5 - 100, 20, 100);
            
            ctx.strokeStyle = '#228B22'; 
            ctx.lineWidth = 4;
            ctx.beginPath();
            for (let j = 0; j <= obs.width; j += 5) {
                let progress = j / obs.width;
                if (progress < 0.05 || progress > 0.95) continue;
                let dy = Math.sin(progress * Math.PI) * obs.height;
                let tY = getTerrainY(worldDistance + obs.x + j) + 5;
                if (j === 5 || j === Math.ceil(0.05 * obs.width)) ctx.moveTo(obs.x + j, tY + dy);
                else ctx.lineTo(obs.x + j, tY + dy);
            }
            ctx.stroke();

            ctx.fillStyle = '#006400';
            ctx.beginPath(); ctx.arc(obs.x, getTerrainY(worldDistance + obs.x) + 5 - 100, 25, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(obs.x + obs.width, getTerrainY(worldDistance + obs.x + obs.width) + 5 - 100, 25, 0, Math.PI*2); ctx.fill();
        } else if (obs.type === 'lava') {
            ctx.fillStyle = '#FF4500';
            ctx.fillRect(obs.x, canvas.height - 30, obs.width, 40);
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            for (let j = 0; j <= obs.width; j+=10) {
                let waveY = canvas.height - 30 + Math.sin(performance.now()*0.005 + j)*5;
                if(j===0) ctx.moveTo(obs.x+j, waveY);
                else ctx.lineTo(obs.x+j, waveY);
            }
            ctx.lineTo(obs.x+obs.width, canvas.height); ctx.lineTo(obs.x, canvas.height); ctx.fill();
        }

        if (!isCrashing && !obs.passed && obs.x + obs.width < player.rearWheel.defaultX) {
            obs.passed = true;
            if (obs.id > highestScoredObstacle) {
                score += 1;
                highestScoredObstacle = obs.id;
                if (typeof playScore === 'function') playScore();
            }
        }
        if (obs.x + obs.width < 0) obstacles.splice(i, 1);
    }

    if (typeof drawPlayer === 'function') drawPlayer();
    if (isCrashing && typeof drawCrashBean === 'function') drawCrashBean();
    if (typeof drawFlyingObjects === 'function') drawFlyingObjects();
    if (typeof drawWeather === 'function') drawWeather(timeScale);

    ctx.font = 'bold 16px Courier New';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText('Punkte: ' + score, 10, 20);
    ctx.strokeText('Leben: ' + lives, 10, 40);
    let distanceLeft = Math.max(0, Math.floor((levelDistance - worldDistance) / 10));
    ctx.strokeText('Ziel: ' + distanceLeft + 'm', canvas.width - 120, 20);
    
    ctx.fillStyle = '#FFF';
    ctx.fillText('Punkte: ' + score, 10, 20);
    ctx.fillText('Leben: ' + lives, 10, 40);
    ctx.fillText('Ziel: ' + distanceLeft + 'm', canvas.width - 120, 20);

    animationFrameId = requestAnimationFrame(gameLoop);
}

function startEngineSound(obj) {
    try {
        if (!window.audioCtx) window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        let osc = audioCtx.createOscillator();
        let filter = audioCtx.createBiquadFilter();
        let gain = audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.value = 40 + Math.random() * 10; 
        
        filter.type = 'lowpass';
        filter.frequency.value = 150; 

        gain.gain.value = 0.0;
        gain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        obj.engineOsc = osc;
        obj.engineGain = gain;
        obj.engineStarted = true;
    } catch(e) {
        obj.engineStarted = true; 
    }
}

function stopEngineSound(obj) {
    if (obj.engineOsc && obj.engineGain) {
        try {
            obj.engineGain.gain.cancelScheduledValues(audioCtx.currentTime);
            obj.engineGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
            obj.engineOsc.stop(audioCtx.currentTime + 0.2);
        } catch(e) {}
        obj.engineOsc = null;
    }
}

function playSqueal() {
    try {
        if (!window.audioCtx) window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    } catch(e) {}
}

function playYell() {
    try {
        if (!window.audioCtx) window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(200, audioCtx.currentTime + 0.1);
        osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    } catch(e) {}
}

function fetchHighscores() {
    const listEl = document.getElementById('highscore-list');
    if (!listEl || !db) return;

    db.collection("highscores")
      .orderBy("score", "desc")
      .limit(5)
      .get()
      .then(function(querySnapshot) {
          listEl.innerHTML = '';
          querySnapshot.forEach(function(doc) {
              let data = doc.data();
              let li = document.createElement('li');
              
              let nameSpan = document.createElement('span');
              nameSpan.innerText = data.name;
              
              let scoreSpan = document.createElement('span');
              scoreSpan.innerText = data.score;
              
              li.appendChild(nameSpan);
              li.appendChild(scoreSpan);
              listEl.appendChild(li);
          });
      })
      .catch(function(error) {
          listEl.innerHTML = '<li>Fehler beim Laden</li>';
      });
}

async function saveHighscore(playerName, finalScore) {
    if (!db) return;
    let playerIP = "Unbekannt";
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        playerIP = data.ip;
    } catch (e) {
        console.log("IP konnte nicht abgerufen werden");
    }

    db.collection("highscores").add({
        name: playerName,
        score: finalScore,
        ip: playerIP,
        date: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function() {
        fetchHighscores();
    }).catch(function(error) {
        console.error("Fehler beim Speichern in Firebase:", error);
    });
}

function showNamePopup() {
    if (!window.scoreSubmitted && score > 0) {
        window.scoreSubmitted = true;
        isPopupOpen = true;
        popupScore.innerText = score;
        instructionEl.classList.add('hidden'); 
        namePopup.classList.remove('hidden');
        uiLayer.classList.remove('hidden');
        playerNameInput.focus();
    }
}

if (saveScoreBtn) {
    saveScoreBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        let pName = playerNameInput.value.trim();
        if (pName === "") pName = "Bohne";
        
        saveHighscore(pName.substring(0, 15), score);
        
        namePopup.classList.add('hidden');
        instructionEl.classList.remove('hidden');
        playerNameInput.value = '';
        isPopupOpen = false;
        
        startNewGame(); 
    });
}

fetchHighscores();

// NEUER CODE - Idle-Loop für die Startseite
function idleLoop(timestamp) {
    if (isGameRunning) return; // Stoppt die Schleife, sobald das Spiel startet
    
    if (typeof drawEnvironment === 'function') drawEnvironment(0);
    if (typeof drawPlayer === 'function') drawPlayer();
    
    requestAnimationFrame(idleLoop);
}

// Initiale Position für die Startseite setzen, damit das Fahrrad nicht in der Luft hängt
player.rearWheel.y = getTerrainY(30);
player.frontWheel.y = getTerrainY(90);

// Startbildschirm-Animation starten
requestAnimationFrame(idleLoop);