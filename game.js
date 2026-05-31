// Zuweisung der DOM-Elemente (Variablen sind in config.js deklariert)
canvas = document.getElementById('gameCanvas');
ctx = canvas.getContext('2d');
uiLayer = document.getElementById('ui-layer');
titleEl = document.getElementById('title');
instructionEl = document.getElementById('instruction');
touchControls = document.getElementById('touch-controls');
fullscreenBtn = document.getElementById('fullscreen-btn');
headlightBtn = document.getElementById('headlight-btn');

// Sichere Initialisierung für dynamische Partikel (falls in config nicht vorhanden)
window.weatherParticles = window.weatherParticles || [];

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

// Initialisierung
designData = fallbackDesignData;
loadLevelData(currentLevel);

if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    if (touchControls) touchControls.classList.remove('hidden');
}
resizeCanvas();

function checkHeadlight() {
    if (currentLevel === 3) {
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

function loadLevelData(levelNum) {
    fetch(`level${levelNum}.json`)
        .then(function(response) {
            if (!response.ok) throw new Error('HTTP Status ' + response.status);
            return response.json();
        })
        .then(function(data) {
            levelData = data;
            for(let i = 0; i < levelData.length; i++) levelData[i].id = i;
        })
        .catch(function(error) {
            levelData = fallbackLevelData;
        });

    fetch(`design_level_${levelNum}.json`)
        .then(function(response) {
            if (!response.ok) throw new Error('HTTP Status ' + response.status);
            return response.json();
        })
        .then(function(data) {
            designData = data;
            initBackground();
            updateMusic();
            updatePhysicsConfig();
            checkHeadlight();
        })
        .catch(function(error) {
            designData = fallbackDesignData;
            initBackground();
            updateMusic();
            updatePhysicsConfig();
            checkHeadlight();
        });
}

function updateMusic() {
    if (designData && designData.theme && designData.theme.music) {
        if (!bgMusic.src.endsWith(designData.theme.music)) {
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

function startNewGame() {
    lives = 3;
    score = 0;
    currentLevel = 1;
    loadLevelData(currentLevel);
    restartLevel();
}

function advanceLevel() {
    currentLevel++;
    loadLevelData(currentLevel);
    restartLevel();
}

function restartLevel() {
    flyingObjects = [];
    window.weatherParticles = [];
    
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
    
    initAudio();
    startMusic();
    
    cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(gameLoop);
}

function respawnPlayer() {
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
    startMusic();
}

function handleInputEvent() {
    initAudio();
    if (isGameOver) {
        startNewGame();
        return true;
    }
    if (isLevelComplete && bikeStopped) {
        advanceLevel();
        return true;
    }
    if (!isGameRunning) {
        startNewGame();
        return true;
    }
    return false;
}

function jump(wheel) {
    if (handleInputEvent()) return;
    if (isLevelComplete || isCrashing) return;
    
    if (wheel === 'rear' && player.rearWheel.onSurface) {
        player.rearWheel.vy = player.jumpStrength;
        player.rearWheel.isJumping = true;
        player.rearWheel.onSurface = false;
        playJump();
    } else if (wheel === 'front' && player.frontWheel.onSurface) {
        player.frontWheel.vy = player.jumpStrength;
        player.frontWheel.isJumping = true;
        player.frontWheel.onSurface = false;
        playJump();
    }
}

window.addEventListener('keydown', function(e) {
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
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.up = false;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.down = false;
});

function handleTouch(e) {
    if (e.target.id === 'headlight-btn' || e.target.id === 'fullscreen-btn') return;
    
    if (handleInputEvent()) {
        if (e.cancelable) e.preventDefault();
        return;
    }
    if (isLevelComplete) return;

    touchBrake = false;
    touchGas = false;
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
    if (e.cancelable) e.preventDefault();
}

window.addEventListener('touchstart', handleTouch, { passive: false });
window.addEventListener('touchmove', handleTouch, { passive: false });
window.addEventListener('touchend', handleTouch, { passive: false });

window.addEventListener('mousedown', function(e) {
    if (e.target.id === 'headlight-btn' || e.target.id === 'fullscreen-btn') return;

    if (handleInputEvent()) return;
    if (isLevelComplete) return;

    const w = window.innerWidth;
    const q2 = w * 0.50;
    const q3 = w * 0.75;

    if (e.clientX >= q2 && e.clientX < q3) {
        jump('rear');
    } else if (e.clientX >= q3) {
        jump('front');
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
            if (['wasp', 'bird', 'meteorite', 'monkey', 'bat', 'fireball'].includes(nextObs.type)) {
                let startY = 100;
                let speedVal = nextObs.speed !== undefined ? nextObs.speed : 1.0;
                let vxVal = -speedVal; 
                let vyVal = 0;

                if (nextObs.type === 'meteorite') {
                    startY = -20;
                    vxVal = -speedVal * 0.7; 
                    vyVal = speedVal * 0.8;
                } else if (nextObs.type === 'monkey') {
                    let tY = getTerrainY(worldDistance + canvas.width);
                    startY = tY - 100; // Ausserhalb des Bildes starten
                    vxVal = -speedVal; 
                } else if (nextObs.type === 'bat') {
                    let tY = getTerrainY(worldDistance + canvas.width);
                    startY = tY - 60;
                    vxVal = -speedVal; 
                } else if (nextObs.type === 'fireball') {
                    startY = canvas.height + 20; 
                    vxVal = -gameSpeed; 
                    vyVal = -8; 
                } else {
                    let tY = getTerrainY(worldDistance + canvas.width);
                    startY = nextObs.spawnY !== undefined ? nextObs.spawnY : tY - 40;
                }

                flyingObjects.push({
                    id: nextObs.id,
                    x: canvas.width + 50,
                    y: startY,
                    spawnY: startY,
                    vx: vxVal,
                    vy: vyVal,
                    type: nextObs.type,
                    speed: speedVal,
                    deflected: false,
                    passed: false
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
        instructionEl.innerText = "Punkte: " + score + " | KLICK fuer Neustart";
        uiLayer.classList.remove('hidden');
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

            // Lianen-Steigung zwingt zum Gas geben (sonst rutscht man zurueck)
            if (player.rearWheel.onUphillLiana && !isAccelerating) {
                player.targetBikeX -= 3.5 * timeScale;
            } else {
                if (isAccelerating) {
                    player.targetBikeX += 2.5 * timeScale;
                } else if (isBraking) {
                    player.targetBikeX -= 2.5 * timeScale;
                } else {
                    // Das Fahrrad sanft horizontal in Richtung Mitte gleiten lassen
                    let centerTargetX = canvas.width * 0.4;
                    player.targetBikeX += (centerTargetX - player.targetBikeX) * 0.02 * timeScale;
                }
            }
        } else {
            player.targetBikeX += 2.0 * timeScale;
            if (player.frontWheel.x >= canvas.width / 2) {
                bikeStopped = true;
                if (!hasPlayedFanfare) {
                    playFanfare();
                    hasPlayedFanfare = true;
                    
                    titleEl.innerText = `Level ${currentLevel} Geschafft!`;
                    instructionEl.innerText = "Klick / Touch fuer naechstes Level";
                    uiLayer.classList.remove('hidden');
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
            handleFrameCollision(timeScale);
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
                if (Math.floor(oldAngle / Math.PI) < Math.floor(pedalAngle / Math.PI)) playPedalSound();
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

        if (obs.type !== 'chasm' && obs.type !== 'lava' && obs.type !== 'liana_bridge') {
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
            ctx.fill(); ctx.stroke();
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
                playScore();
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

if (typeof drawEnvironment === 'function' && typeof drawPlayer === 'function') {
    drawEnvironment(0);
    drawPlayer();
}