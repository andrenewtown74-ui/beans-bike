// Initialisierung und UI
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const uiLayer = document.getElementById('ui-layer');
const titleEl = document.getElementById('title');
const instructionEl = document.getElementById('instruction');
const touchControls = document.getElementById('touch-controls');
const fullscreenBtn = document.getElementById('fullscreen-btn');

// Globale Variablen fuer die Logik
let levelData = [];
let designData = null;
let worldDistance = 0;
let nextObstacleIndex = 0;

let currentLevel = 1;
let playTime = 0;
const LEVEL_DURATION = 120000; 
let finishLineActive = false;
let finishLineX = 0;
let isLevelComplete = false;
let bikeStopped = false;

// Fallback Daten
const fallbackLevelData = [
    { "spawnDistance": 300, "type": "block", "width": 40, "height": 15, "color": "#8B4513" }
];

const fallbackDesignData = {
    "theme": {
        "skyColor": "#87CEEB",
        "groundColor": "#8B4513",
        "surfaceColor": "#228B22",
        "music": "Sprocket_Hill_Climb.mp3",
        "sun": { "active": true, "color": "#FFD700", "size": 20, "xOffset": 100, "y": 20 }
    },
    "objects": []
};

// Objekte zur Laufzeit
const keys = { up: false, down: false };
let touchGas = false;
let touchBrake = false;

let isGameRunning = false;
let isGameOver = false;
let isCrashing = false;
let score = 0;
let gameSpeed = 1.5; 
let animationFrameId;
let lastTime = 0; 
let pedalAngle = 0; 

let crashType = '';
let crashAngle = 0;
let crashBikeLength = 0;
let gameOverTimer = 0;
let bikeParts = {
    rear: { x: 0, y: 0, vx: 0, vy: 0, rot: 0, rotV: 0 },
    front: { x: 0, y: 0, vx: 0, vy: 0, rot: 0, rotV: 0 }
};
const beanCrash = { x: 0, y: 0, vx: 0, vy: 0, rotation: 0, isSplat: false };

const player = {
    targetBikeX: 30,
    rearWheel: { x: 30, defaultX: 30, y: 185, vy: 0, isJumping: false, isHittingWall: false, onSurface: true },
    frontWheel: { x: 90, defaultX: 90, y: 185, vy: 0, isJumping: false, isHittingWall: false, onSurface: true },
    gravity: 0.35,
    jumpStrength: -6.5
};

const obstacles = [];
const backgroundElements = [];

// Initiale Funktionsaufrufe
designData = fallbackDesignData;
loadLevelData(currentLevel);

if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    touchControls.classList.remove('hidden');
}
resizeCanvas();

// Hilfsfunktionen (Level laden, Resize, Events)
function loadLevelData(levelNum) {
    fetch(`level${levelNum}.json`)
        .then(function(response) {
            if (!response.ok) throw new Error('HTTP Status ' + response.status);
            return response.json();
        })
        .then(function(data) {
            levelData = data;
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
        })
        .catch(function(error) {
            designData = fallbackDesignData;
            initBackground();
            updateMusic();
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

function advanceLevel() {
    currentLevel++;
    loadLevelData(currentLevel);
    resetGame();
}

function resetGame() {
    player.targetBikeX = 30;
    keys.up = false;
    keys.down = false;
    touchGas = false;
    touchBrake = false;

    worldDistance = 0;
    let startY = getTerrainY(player.targetBikeX);

    player.rearWheel.y = startY;
    player.rearWheel.defaultX = 30;
    player.rearWheel.x = player.rearWheel.defaultX;
    player.rearWheel.vy = 0;
    player.rearWheel.isJumping = false;
    player.rearWheel.isHittingWall = false;
    player.rearWheel.onSurface = true;
    
    player.frontWheel.y = getTerrainY(90);
    player.frontWheel.defaultX = 90;
    player.frontWheel.x = player.frontWheel.defaultX;
    player.frontWheel.vy = 0;
    player.frontWheel.isJumping = false;
    player.frontWheel.isHittingWall = false;
    player.frontWheel.onSurface = true;
    
    obstacles.length = 0;
    nextObstacleIndex = 0;
    playTime = 0;
    finishLineActive = false;
    finishLineX = 0;
    isLevelComplete = false;
    bikeStopped = false;
    hasPlayedFanfare = false;
    
    score = 0;
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
    
    uiLayer.classList.add('hidden');
    isGameRunning = true;
    
    initAudio();
    startMusic();
    
    cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Steuerungsebene
function handleInputEvent() {
    initAudio();
    if (!isGameRunning) {
        if (isLevelComplete) advanceLevel();
        else resetGame();
        return true;
    }
    if (isGameOver) {
        resetGame();
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
    if (handleInputEvent()) {
        if (e.cancelable) e.preventDefault();
        return;
    }
    if (isLevelComplete) return;

    touchBrake = false;
    touchGas = false;
    const midX = window.innerWidth / 2;
    const midY = window.innerHeight / 2;

    for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i];
        if (t.clientX < midX) {
            if (t.clientY > midY) touchBrake = true;
        } else {
            if (t.clientY > midY) touchGas = true;
        }
    }

    if (e.type === 'touchstart') {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            if (t.clientX < midX && t.clientY <= midY) jump('rear');
            else if (t.clientX >= midX && t.clientY <= midY) jump('front');
        }
    }
    if (e.cancelable) e.preventDefault();
}

window.addEventListener('touchstart', handleTouch, { passive: false });
window.addEventListener('touchmove', handleTouch, { passive: false });
window.addEventListener('touchend', handleTouch, { passive: false });

window.addEventListener('mousedown', function(e) {
    if (handleInputEvent()) return;
    if (isLevelComplete) return;

    if (e.clientY < window.innerHeight / 2) {
        if (e.clientX < window.innerWidth / 2) jump('rear');
        else jump('front');
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
            let tY = getTerrainY(worldDistance + canvas.width);
            obstacles.push({
                x: canvas.width,
                y: tY + 5 - nextObs.height, 
                baseY: tY + 5 - nextObs.height,
                width: nextObs.width,
                height: nextObs.height,
                type: nextObs.type,
                color: nextObs.color,
                passed: false
            });
            nextObstacleIndex++;
        }
    }
}

// Haupt-Spiele-Schleife
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
        playTime += deltaTime;
        if (playTime >= LEVEL_DURATION && !finishLineActive) {
            finishLineActive = true;
            finishLineX = canvas.width + 100;
        }
    }

    let moveScale = (isCrashing || (isLevelComplete && bikeStopped)) ? 0 : timeScale;

    if (!isCrashing) {
        if (!isLevelComplete) {
            let isAccelerating = keys.up || touchGas;
            let isBraking = keys.down || touchBrake;

            if (isAccelerating) player.targetBikeX += 2.5 * timeScale;
            if (isBraking) player.targetBikeX -= 2.5 * timeScale;
        } else {
            player.targetBikeX += 2.0 * timeScale;
            if (player.frontWheel.x >= canvas.width / 2) {
                bikeStopped = true;
                if (!hasPlayedFanfare) {
                    stopMusic();
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

        updateWheel(player.rearWheel, timeScale);
        updateWheel(player.frontWheel, timeScale);
        handleFrameCollision(timeScale);

        if (player.rearWheel.y > canvas.height + 50 || player.frontWheel.y > canvas.height + 50) {
            startCrash('fall');
        } else {
            const dx = player.frontWheel.x - player.rearWheel.x;
            if (player.frontWheel.isHittingWall && dx < 30) startCrash('flip');
            else if (player.rearWheel.isHittingWall && dx > 110) startCrash('tear');

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
        updateCrashAnimation(timeScale);
    }

    if (finishLineActive && player.frontWheel.x >= finishLineX && !isLevelComplete) {
        isLevelComplete = true;
    }

    drawEnvironment(moveScale);
    spawnObstaclesFromData(timeScale, moveScale);
    
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.x -= gameSpeed * moveScale;

        if (obs.type !== 'chasm') {
            ctx.fillStyle = obs.color;
            ctx.strokeStyle = '#000';
            ctx.beginPath();
            if (obs.type === 'block') { ctx.rect(obs.x, obs.y, obs.width, obs.height); } 
            else if (obs.type === 'ramp') { ctx.moveTo(obs.x, getTerrainY(worldDistance + obs.x)); ctx.lineTo(obs.x + obs.width, obs.y); ctx.lineTo(obs.x + obs.width, getTerrainY(worldDistance + obs.x + obs.width)); } 
            else if (obs.type === 'round') { ctx.moveTo(obs.x, getTerrainY(worldDistance + obs.x)); ctx.ellipse(obs.x + obs.width / 2, getTerrainY(worldDistance + obs.x + obs.width/2), obs.width / 2, obs.height, 0, Math.PI, 0); }
            else if (obs.type === 'hill') { ctx.moveTo(obs.x, getTerrainY(worldDistance + obs.x)); ctx.quadraticCurveTo(obs.x + obs.width / 2, getTerrainY(worldDistance + obs.x + obs.width/2) - obs.height * 2, obs.x + obs.width, getTerrainY(worldDistance + obs.x + obs.width)); }
            ctx.fill(); ctx.stroke();
        }

        if (!isCrashing && !obs.passed && obs.x + obs.width < player.rearWheel.defaultX) {
            obs.passed = true;
            score += 1;
            playScore();
        }
        if (obs.x + obs.width < 0) obstacles.splice(i, 1);
    }

    drawPlayer();
    if (isCrashing) drawCrashBean();

    ctx.fillStyle = '#000';
    ctx.font = '16px Courier New';
    ctx.fillText('Punkte: ' + score, 10, 20);
    
    let timeLeft = Math.max(0, Math.ceil((LEVEL_DURATION - playTime) / 1000));
    ctx.fillText('Zeit: ' + timeLeft + 's', canvas.width - 120, 20);

    animationFrameId = requestAnimationFrame(gameLoop);
}

// Initialer Zeichnungsaufruf
drawEnvironment(0);
drawPlayer();