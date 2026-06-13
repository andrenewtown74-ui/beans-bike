canvas = document.getElementById('gameCanvas');
ctx = canvas.getContext('2d');
uiLayer = document.getElementById('ui-layer');
titleEl = document.getElementById('title');
instructionEl = document.getElementById('instruction');
fullscreenBtn = document.getElementById('fullscreen-btn');
headlightBtn = document.getElementById('headlight-btn');


namePopup = document.getElementById('name-popup');
popupScore = document.getElementById('popup-score');
playerNameInput = document.getElementById('player-name-input');
saveScoreBtn = document.getElementById('save-score-btn');
const pauseBtn = document.getElementById('pause-btn');
const btnStartGame = document.getElementById('btn-start-game');
const btnToggleMusic = document.getElementById('btn-toggle-music');
const btnShowHighscores = document.getElementById('btn-show-highscores');
const highscorePopup = document.getElementById('highscore-popup');
const closeHighscoreBtn = document.getElementById('close-highscore-btn');
const fullHighscoreList = document.getElementById('full-highscore-list');

let isMenuMusicPlaying = false;
window.isPaused = false;
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
window.hasInteracted = false; 

keys.rearJump = false;
keys.frontJump = false;
let touchRearJump = false;
let touchFrontJump = false;

designData = fallbackDesignData;
loadLevelData(currentLevel);

if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    let kbInst = document.getElementById('keyboard-instructions');
    if (kbInst) kbInst.classList.add('hidden');
}

let activeTouches = {};
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
function togglePause() {
    if (!isGameRunning || isGameOver || isLevelComplete) return;
    window.isPaused = !window.isPaused;
    
    if (pauseBtn) {
        pauseBtn.innerText = window.isPaused ? "Weiter" : "Pause";
    }
    
    if (window.isPaused) {
        if (typeof bgMusic !== 'undefined' && !bgMusic.paused) bgMusic.pause();
        if (window.audioCtx && window.audioCtx.state === 'running') window.audioCtx.suspend();
    } else {
        if (typeof bgMusic !== 'undefined' && isMenuMusicPlaying) bgMusic.play().catch(function(){});
        if (window.audioCtx && window.audioCtx.state === 'suspended') window.audioCtx.resume();
        lastTime = performance.now(); 
    }
}

if (pauseBtn) {
    pauseBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        togglePause();
    });
}
if (btnStartGame) {
    btnStartGame.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof initAudio === 'function') initAudio();
        if (typeof stopMenuMusic === 'function') stopMenuMusic();
        isMenuMusicPlaying = false;
        btnToggleMusic.innerText = "Musik: AUS";
        window.hasInteracted = false;
        document.getElementById('start-menu-buttons').classList.add('hidden');
        startNewGame();
    });
}

if (btnToggleMusic) {
    btnToggleMusic.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!isMenuMusicPlaying) {
            if (typeof initAudio === 'function') initAudio();
            if (typeof playMenuMusic === 'function') playMenuMusic();
            isMenuMusicPlaying = true;
            btnToggleMusic.innerText = "Musik: AN";
            window.hasInteracted = true;
        } else {
            if (typeof stopMenuMusic === 'function') stopMenuMusic();
            isMenuMusicPlaying = false;
            btnToggleMusic.innerText = "Musik: AUS";
            window.hasInteracted = false; 
        }
    });
}

if (btnShowHighscores) {
    btnShowHighscores.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        isPopupOpen = true; 
        highscorePopup.classList.remove('hidden');
        fetchTop20Highscores();
    });
}

if (closeHighscoreBtn) {
    closeHighscoreBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        highscorePopup.classList.add('hidden');
        isPopupOpen = false;
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

function showMainMenu() {
    isGameRunning = false;
    window.hasInteracted = false;
    isMenuMusicPlaying = false;
    if (typeof stopMenuMusic === 'function') stopMenuMusic();
    if (btnToggleMusic) btnToggleMusic.innerText = "Musik: AUS";
    
    titleEl.innerText = "Bohnen-Bike";
    instructionEl.classList.add('hidden');
    document.getElementById('start-menu-buttons').classList.remove('hidden');
    uiLayer.classList.remove('hidden');
    
    player.rearWheel.y = getTerrainY(30);
    player.frontWheel.y = getTerrainY(90);
    cancelAnimationFrame(animationFrameId);
    requestAnimationFrame(idleLoop);
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
    window.isPaused = false;
    if (pauseBtn) pauseBtn.innerText = "Pause";
    player.targetBikeX = 30;
    keys.up = false;
    keys.down = false;
    keys.rearJump = false;
    keys.frontJump = false;
    touchGas = false;
    touchBrake = false;
    touchRearJump = false;
    touchFrontJump = false;

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
    
    player.underwaterTimer = 0;
    player.underwaterTick = 0;

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
    keys.rearJump = false;
    keys.frontJump = false;
    touchGas = false;
    touchBrake = false;
    touchRearJump = false;
    touchFrontJump = false;

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
    
    player.underwaterTimer = 0;
    player.underwaterTick = 0;

    lastTime = performance.now();
    if (typeof startMusic === 'function') startMusic();
}

function handleInputEvent() {
    if (isPopupOpen) return false; 

    if (!window.hasInteracted && !isGameRunning) {
        window.hasInteracted = true;
        if (typeof playMenuMusic === 'function') {
            playMenuMusic();
        }
        if (instructionEl) {
            instructionEl.innerText = "Musik laeuft! Klick / Touch fuer Spielstart";
        }
        return true; 
    }

    if (typeof initAudio === 'function') initAudio();
    
    if (isGameOver) {
        instructionEl.classList.add('hidden');
        handleGameOverRestart();
        return true;
    }
    if (isLevelComplete && bikeStopped) {
        instructionEl.classList.add('hidden');
        if (currentLevel >= 8) { 
            startNewGame();
        } else {
            advanceLevel();
        }
        return true;
    }
    
    return false;
}

function jump(wheel) {
    if (isPopupOpen) return;
    if (handleInputEvent()) return;
    if (isLevelComplete || isCrashing) return;
    
    if (wheel === 'rear') {
        if (player.rearWheel.inWater && player.rearWheel.y > getTerrainY(worldDistance + player.rearWheel.x) - 5) return;
        if (player.rearWheel.onSurface) {
            player.rearWheel.vy = player.jumpStrength;
            player.rearWheel.isJumping = true;
            player.rearWheel.onSurface = false;
            if (typeof playJump === 'function') playJump();
        }
    } else if (wheel === 'front') {
        if (player.frontWheel.inWater && player.frontWheel.y > getTerrainY(worldDistance + player.frontWheel.x) - 5) return;
        if (player.frontWheel.onSurface) {
            player.frontWheel.vy = player.jumpStrength;
            player.frontWheel.isJumping = true;
            player.frontWheel.onSurface = false;
            if (typeof playJump === 'function') playJump();
        }
    }
}

window.addEventListener('keydown', function(e) {
    if (isPopupOpen) return; 

    if (['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8'].includes(e.code)) {
        currentLevel = parseInt(e.key.replace('Digit', ''));
        levelStartScore = score; 
        document.getElementById('start-menu-buttons').classList.add('hidden');
        loadLevelData(currentLevel).then(function() {
            restartLevel();
        });
        e.preventDefault();
        return;
    }
    
    if (e.code === 'KeyI') {
        window.isInvincible = !window.isInvincible;
        e.preventDefault();
        return;
    }
    
    // Ueberprueft nun auch Space, ArrowUp und KeyW fuer das handleInputEvent
    if (['Space', 'KeyN', 'KeyM', 'ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'ArrowUp', 'KeyW'].includes(e.code)) {
        if (handleInputEvent()) { e.preventDefault(); return; }
    }
    if (isLevelComplete) return;

    if (e.code === 'KeyN') { keys.rearJump = true; jump('rear'); e.preventDefault(); }
    if (e.code === 'KeyM') { keys.frontJump = true; jump('front'); e.preventDefault(); }
    
    // Globale Sprungtasten fuer beide Raeder gleichzeitig (verhindert Tastatur-Ghosting)
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') { 
        keys.rearJump = true; 
        keys.frontJump = true; 
        jump('rear'); 
        jump('front'); 
        e.preventDefault(); 
    }
    
    if (e.code === 'KeyD' || e.code === 'ArrowRight') { keys.up = true; e.preventDefault(); }
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') { keys.down = true; e.preventDefault(); }
    if (e.code === 'KeyP') {
            togglePause();
            e.preventDefault();
            return;
    }
});

window.addEventListener('keyup', function(e) {
    if (isPopupOpen) return;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.up = false;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.down = false;
    if (e.code === 'KeyN') keys.rearJump = false;
    if (e.code === 'KeyM') keys.frontJump = false;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') { 
        keys.rearJump = false; 
        keys.frontJump = false; 
    }
});

function handleTouch(e) {
    if (isPopupOpen) return; 
    if (e.target.id === 'headlight-btn' || e.target.id === 'fullscreen-btn') return;
    
    if (handleInputEvent()) {
        if (e.cancelable) e.preventDefault();
        return;
    }
    if (isLevelComplete || !isGameRunning) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.type === 'touchstart') {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            const tx = (t.clientX - rect.left) * scaleX;
            const ty = (t.clientY - rect.top) * scaleY;

            // Touch-Zonen auf Bildschirmhaelften aufgeteilt fuer fehlerfreie Erkennung
            if (tx >= canvas.width / 2) {
                activeTouches[t.identifier] = { startX: tx, startY: ty, wheel: 'front', isDrag: false, hasJumped: false };
            } else {
                activeTouches[t.identifier] = { startX: tx, startY: ty, wheel: 'rear', isDrag: false, hasJumped: false };
            }
        }
    }

    touchGas = false;
    touchBrake = false;
    touchRearJump = false;
    touchFrontJump = false;

    for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i];
        const data = activeTouches[t.identifier];
        if (data) {
            const tx = (t.clientX - rect.left) * scaleX;
            const ty = (t.clientY - rect.top) * scaleY;
            const dx = tx - data.startX;
            const dy = ty - data.startY;

            if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                data.isDrag = true;
            }

            if (data.wheel === 'front' && dx > 15) touchGas = true;
            if (data.wheel === 'rear' && dx < -15) touchBrake = true;
            
            // Ermoeglicht den Sprung durch nach-oben-wischen, auch waehrend Gas gegeben wird
            if (dy < -20) {
                if (!data.hasJumped) {
                    jump(data.wheel);
                    data.hasJumped = true; 
                }
                if (data.wheel === 'front') touchFrontJump = true;
                if (data.wheel === 'rear') touchRearJump = true;
            }
        }
    }

    if (e.type === 'touchend' || e.type === 'touchcancel') {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            const data = activeTouches[t.identifier];
            if (data) {
                // Ein einfaches Tippen loest weiterhin einen regulueren Sprung aus
                if (!data.isDrag && !data.hasJumped && !isCrashing) {
                    jump(data.wheel);
                    if (data.wheel === 'front') touchFrontJump = true;
                    if (data.wheel === 'rear') touchRearJump = true;
                }
                delete activeTouches[t.identifier];
            }
        }
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
    if (isLevelComplete || !isGameRunning) return;

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
    
    // Die while-Schleife erlaubt es, beliebig viele Objekte bei exakt derselben spawnDistance gleichzeitig zu erzeugen
    while (nextObstacleIndex < levelData.length && worldDistance >= levelData[nextObstacleIndex].spawnDistance) {
        let nextObs = levelData[nextObstacleIndex];
        
        const vehicleTypes = ['car', 'snowcat', 'rover', 'jeep', 'borer', 'taxi', 'uber'];
        const flyingObjTypes = ['wasp', 'bird', 'meteorite', 'monkey', 'bat', 'fireball', 'falling_rock', 'pigeon', 'pigeon_poop', 'cyclist', 'escooter', 'pelican', 'soccer_ball', 'striker', 'goalkeeper', 'soccer_goal'];
        
        if (flyingObjTypes.concat(vehicleTypes).includes(nextObs.type)) {
            let startY = 100;
            let speedVal = nextObs.speed !== undefined ? nextObs.speed : 1.0;
            let vxVal = -speedVal; 
            let vyVal = 0;
            let spawnX = canvas.width + 50;
            let zVal = 0;

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
            } else if (nextObs.type === 'pigeon' || nextObs.type === 'pelican') {
                startY = nextObs.spawnY !== undefined ? nextObs.spawnY : 50;
                vxVal = -speedVal * 1.5;
            } else if (nextObs.type === 'soccer_goal') {
                vxVal = 0; 
                startY = getTerrainY(worldDistance + spawnX);
            } else if (nextObs.type === 'goalkeeper') {
                vxVal = 0; 
                startY = getTerrainY(worldDistance + spawnX);
            } else if (nextObs.type === 'striker') {
                vxVal = -speedVal; 
                startY = getTerrainY(worldDistance + spawnX);
            } else if (nextObs.type === 'soccer_ball') {
                if (Math.random() > 0.5) {
                    spawnX = -100 - (Math.random() * 150); 
                    vxVal = gameSpeed + (speedVal * 0.6); 
                } else {
                    spawnX = canvas.width + 100 + (Math.random() * 150); 
                    vxVal = -(speedVal * 0.7); 
                }
                startY = getTerrainY(worldDistance + spawnX) - 20 - (Math.random() * 100); 
                vyVal = -1 + (Math.random() * 3);
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
                z: zVal,
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
                y: tY + 5 - (nextObs.height || 0), 
                baseY: tY + 5 - (nextObs.height || 0),
                width: nextObs.width,
                height: nextObs.height || 0,
                type: nextObs.type,
                color: nextObs.color,
                passed: false
            });

            if (nextObs.type === 'water') {
                let spawnX = canvas.width + nextObs.width / 2; 

                flyingObjects.push({
                    id: nextObs.id + 10000,
                    x: spawnX,
                    y: canvas.height + 50, 
                    vx: -1.5, 
                    vy: 0,
                    type: 'shark',
                    state: 'patrol',
                    minX: canvas.width + 30, 
                    maxX: canvas.width + nextObs.width - 30, 
                    deflected: false, passed: false, crashed: false
                });

                flyingObjects.push({
                    id: nextObs.id + 20000,
                    x: spawnX,
                    y: getHorizonY(),
                    vx: 0, 
                    vy: 0,
                    type: 'motorboat',
                    crashed: false,
                    speechTimer: 0
                });
            }
        }
        nextObstacleIndex++;
    }
}

function gameLoop(timestamp) {
    if (!isGameRunning) return;
    if (!lastTime) lastTime = timestamp;
    let deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    if (window.isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 30px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSE', canvas.width / 2, canvas.height / 2);
        ctx.textAlign = 'left';
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
    }
    if (deltaTime > 100) deltaTime = 16.66;
    const timeScale = deltaTime / 16.666;

    if (isGameOver) {
        isGameRunning = false;
        titleEl.innerText = "Game Over!";
        
        if (!window.scoreSubmitted && score > 0) {
            showNamePopup();
        } else if (!isPopupOpen) {
            instructionEl.innerText = "Punkte: " + score + " | KLICK fuer Neustart";
            instructionEl.classList.remove('hidden');
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

            let inWater = player.rearWheel.inWater || player.frontWheel.inWater;
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
            } else if (inWater) {
                player.underwaterTimer = (player.underwaterTimer || 0) + timeScale;
                let penaltyThreshold = Math.max(5, 60 - Math.floor(player.underwaterTimer / 10)); 
                player.underwaterTick = (player.underwaterTick || 0) + timeScale;
                
                if (player.underwaterTick > penaltyThreshold) {
                    player.underwaterTick = 0;
                    if (score > 0) score -= 1;
                }

                if (isAccelerating) {
                    player.targetBikeX += 1.5 * timeScale; 
                } else if (isBraking) {
                    player.targetBikeX -= 1.5 * timeScale; 
                } else {
                    player.targetBikeX -= 0.5 * timeScale; 
                }
            } else {
                player.underwaterTimer = 0; 
                player.underwaterTick = 0;
                
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
                    // Ein Leben hochzaehlen bei erfolgreichem Levelabschluss
                    lives++;
                    if (currentLevel >= 8) { 
                        titleEl.innerText = "Herzlichen Glückwunsch!";
                        if (!window.scoreSubmitted && score > 0) {
                            showNamePopup();
                        } else if (!isPopupOpen) {
                            instructionEl.innerText = "Spiel durchgespielt! Klick fuer Neustart.";
                            instructionEl.classList.remove('hidden');
                            uiLayer.classList.remove('hidden');
                        }
                    } else {
                        titleEl.innerText = `Level ${currentLevel} Geschafft!`;
                        instructionEl.innerText = "Klick / Touch fuer naechstes Level";
                        instructionEl.classList.remove('hidden');
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

        if (obs.type !== 'chasm' && obs.type !== 'lava' && obs.type !== 'liana_bridge' && obs.type !== 'mud' && obs.type !== 'poop_splat' && obs.type !== 'water') {
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
            if (obs.id > highestScoredObstacle && obs.type !== 'pigeon_poop' && obs.type !== 'water') {
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

function fetchTop20Highscores() {
    if (!fullHighscoreList || !db) return;
    
    fullHighscoreList.innerHTML = '<li>Lade Highscores...</li>';

    db.collection("highscores")
      .orderBy("score", "desc")
      .limit(20)
      .get()
      .then(function(querySnapshot) {
          fullHighscoreList.innerHTML = '';
          let rank = 1;
          querySnapshot.forEach(function(doc) {
              let data = doc.data();
              let li = document.createElement('li');
              
              let nameSpan = document.createElement('span');
              nameSpan.innerText = rank + ". " + data.name;
              
              let scoreSpan = document.createElement('span');
              scoreSpan.innerText = data.score;
              
              li.appendChild(nameSpan);
              li.appendChild(scoreSpan);
              fullHighscoreList.appendChild(li);
              rank++;
          });
          if (fullHighscoreList.innerHTML === '') {
              fullHighscoreList.innerHTML = '<li>Noch keine Eintraege.</li>';
          }
      })
      .catch(function(error) {
          fullHighscoreList.innerHTML = '<li>Fehler beim Laden</li>';
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
        playerNameInput.value = '';
        isPopupOpen = false;
        
        showMainMenu(); 
    });
}

function idleLoop(timestamp) {
    if (isGameRunning) return; 
    
    if (typeof drawEnvironment === 'function') drawEnvironment(0);
    if (typeof drawPlayer === 'function') drawPlayer();
    
    requestAnimationFrame(idleLoop);
}

player.rearWheel.y = getTerrainY(30);
player.frontWheel.y = getTerrainY(90);

requestAnimationFrame(idleLoop);