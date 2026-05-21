const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const uiLayer = document.getElementById('ui-layer');
const titleEl = document.getElementById('title');
const instructionEl = document.getElementById('instruction');
const touchControls = document.getElementById('touch-controls');
const fullscreenBtn = document.getElementById('fullscreen-btn');

let levelData = [];
let worldDistance = 0;
let nextObstacleIndex = 0;

// Laedt die Level-Datenbank asynchron
fetch('level1.json')
    .then(response => response.json())
    .then(data => {
        levelData = data;
    })
    .catch(error => {
        console.error('Fehler beim Laden von level1.json:', error);
    });

if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    touchControls.classList.remove('hidden');
}

function showCustomMessage(msg) {
    const msgBox = document.getElementById('msg-box');
    msgBox.innerText = msg;
    msgBox.classList.remove('hidden');
    setTimeout(() => msgBox.classList.add('hidden'), 3500);
}

fullscreenBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation(); 
    const elem = document.documentElement;
    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
    if (!isFullscreen) {
        let requestFS = elem.requestFullscreen || elem.webkitRequestFullscreen || elem.mozRequestFullScreen || elem.msRequestFullscreen;
        if (requestFS) requestFS.call(elem).catch(() => {});
    } else {
        let exitFS = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
        if (exitFS) exitFS.call(document);
    }
});

const updateBtnText = () => {
    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
    fullscreenBtn.innerText = isFullscreen ? "Fenster" : "Vollbild";
};
document.addEventListener('fullscreenchange', updateBtnText);

function resizeCanvas() {
    canvas.height = 200;
    canvas.width = 200 * (window.innerWidth / window.innerHeight);
    ctx.imageSmoothingEnabled = false;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let hasPlayedSplatSound = false;
const bgMusic = new Audio('Sprocket_Hill_Climb.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.4; 

function initAudio() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playTone(frequency, type, duration, vol = 0.1) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playJump() { playTone(150, 'square', 0.1, 0.1); }
function playScore() {
    playTone(880, 'square', 0.1, 0.1);
    setTimeout(() => playTone(1108, 'square', 0.15, 0.1), 100);
}
function playCrash() {
    if (!audioCtx) return;
    const bufferSize = audioCtx.sampleRate * 0.5;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    noise.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start();
}
function playTear() { playTone(50, 'sawtooth', 0.4, 0.3); }
function playHit() { playTone(100, 'square', 0.2, 0.2); }

function playPedalSound() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime); 
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
}

function startMusic() {
    bgMusic.currentTime = 0;
    bgMusic.play().catch(() => {});
}

function stopMusic() { bgMusic.pause(); }

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
    jumpStrength: -6.5,
    groundY: 185
};

const obstacles = [];
const backgroundElements = [];

function initBackground() {
    backgroundElements.length = 0;
    for (let i = 0; i < 5; i++) {
        backgroundElements.push({
            x: Math.random() * canvas.width,
            width: 30 + Math.random() * 20,
            height: 60 + Math.random() * 40,
            speedModifier: 0.5
        });
    }
}

function resetGame() {
    player.targetBikeX = 30;
    keys.up = false;
    keys.down = false;
    touchGas = false;
    touchBrake = false;

    player.rearWheel.y = player.groundY;
    player.rearWheel.defaultX = 30;
    player.rearWheel.x = player.rearWheel.defaultX;
    player.rearWheel.vy = 0;
    player.rearWheel.isJumping = false;
    player.rearWheel.isHittingWall = false;
    player.rearWheel.onSurface = true;
    
    player.frontWheel.y = player.groundY;
    player.frontWheel.defaultX = 90;
    player.frontWheel.x = player.frontWheel.defaultX;
    player.frontWheel.vy = 0;
    player.frontWheel.isJumping = false;
    player.frontWheel.isHittingWall = false;
    player.frontWheel.onSurface = true;
    
    obstacles.length = 0;
    worldDistance = 0;
    nextObstacleIndex = 0;
    
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
    
    if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

function jump(wheel) {
    if (!isGameRunning && !isGameOver) {
        resetGame();
        return;
    }
    if (isGameOver || isCrashing) {
        if (isGameOver) resetGame();
        return;
    }
    
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

window.addEventListener('keydown', (e) => {
    initAudio();
    if (!isGameRunning || isGameOver) {
        if (['Space', 'KeyN', 'KeyM', 'ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(e.code)) {
            resetGame();
            e.preventDefault();
        }
        return;
    }
    if (e.code === 'KeyN') { jump('rear'); e.preventDefault(); }
    if (e.code === 'KeyM') { jump('front'); e.preventDefault(); }
    if (e.code === 'KeyD' || e.code === 'ArrowRight') { keys.up = true; e.preventDefault(); }
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') { keys.down = true; e.preventDefault(); }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.up = false;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.down = false;
});

function handleTouch(e) {
    initAudio();
    if (!isGameRunning || isGameOver) {
        if (e.type === 'touchstart') resetGame();
        if (e.cancelable) e.preventDefault();
        return;
    }

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
            if (t.clientX < midX && t.clientY <= midY) {
                jump('rear');
            } else if (t.clientX >= midX && t.clientY <= midY) {
                jump('front');
            }
        }
    }
    if (e.cancelable) e.preventDefault();
}

window.addEventListener('touchstart', handleTouch, { passive: false });
window.addEventListener('touchmove', handleTouch, { passive: false });
window.addEventListener('touchend', handleTouch, { passive: false });

window.addEventListener('mousedown', (e) => {
    initAudio();
    if (!isGameRunning || isGameOver) {
        resetGame();
        return;
    }
    if (e.clientY < window.innerHeight / 2) {
        if (e.clientX < window.innerWidth / 2) jump('rear');
        else jump('front');
    }
});

function spawnObstaclesFromData(timeScale, moveScale) {
    worldDistance += gameSpeed * moveScale;

    if (nextObstacleIndex < levelData.length) {
        let nextObs = levelData[nextObstacleIndex];
        if (worldDistance >= nextObs.spawnDistance) {
            obstacles.push({
                x: canvas.width,
                y: player.groundY + 5 - nextObs.height, 
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

function getObstacleSurface(x, obs) {
    if (x < obs.x || x > obs.x + obs.width) return null;
    if (obs.type === 'block') return obs.y - 5; 
    if (obs.type === 'ramp') {
        let progress = (x - obs.x) / obs.width;
        return player.groundY - (progress * obs.height);
    }
    if (obs.type === 'round') {
        let radius = obs.width / 2;
        let cx = obs.x + radius;
        let dx = x - cx;
        let dy = obs.height * Math.sqrt(Math.max(0, 1 - (dx * dx) / (radius * radius)));
        return player.groundY - dy;
    }
    return null;
}

function updateWheel(wheel, timeScale) {
    wheel.vy += player.gravity * timeScale;
    wheel.y += wheel.vy * timeScale;

    let currentSurface = player.groundY;
    wheel.isHittingWall = false;
    let onRamp = false;

    for (let obs of obstacles) {
        let surface = getObstacleSurface(wheel.x, obs);
        if (surface !== null) {
            if (obs.type === 'block' && wheel.x < obs.x + 8 && wheel.y > obs.y - 2) {
                wheel.isHittingWall = true;
            } else if (obs.type === 'round' && wheel.x < obs.x + 8 && wheel.y > obs.y + (obs.height * 0.4)) {
                wheel.isHittingWall = true;
            } else if (surface < currentSurface) {
                currentSurface = surface;
                if (obs.type === 'ramp' || obs.type === 'round') onRamp = true;
            }
        }
    }

    if (wheel.isHittingWall) {
        wheel.x -= gameSpeed * timeScale; 
    } else {
        wheel.x += (wheel.defaultX - wheel.x) * (0.1 * timeScale);
    }

    if (wheel.y >= currentSurface) {
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
    for (let obs of obstacles) {
        if (obs.type === 'ramp') continue;

        const minX = Math.min(player.frontWheel.x, player.rearWheel.x);
        const maxX = Math.max(player.frontWheel.x, player.rearWheel.x);
        
        if (obs.x < maxX && obs.x + obs.width > minX) {
            let maxPenetration = 0;
            for (let i = 0.1; i < 1.0; i += 0.1) {
                let px = player.rearWheel.x + (player.frontWheel.x - player.rearWheel.x) * i;
                let py = player.rearWheel.y + (player.frontWheel.y - player.rearWheel.y) * i;
                if (px >= obs.x && px <= obs.x + obs.width) {
                    let surfaceY = getObstacleSurface(px, obs);
                    if (surfaceY !== null && py > surfaceY) {
                        let penetration = py - surfaceY;
                        if (penetration > maxPenetration) maxPenetration = penetration;
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
        }
    }
    if (isScraping) {
        player.targetBikeX -= (gameSpeed * 1.2) * timeScale;
    }
}

function startCrash(type) {
    isCrashing = true;
    crashType = type;
    stopMusic();
    
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
        if (player.frontWheel.y < player.groundY) {
            player.frontWheel.y += player.gravity * timeScale;
        }
        player.rearWheel.x = player.frontWheel.x - Math.cos(crashAngle) * crashBikeLength;
        player.rearWheel.y = player.frontWheel.y - Math.sin(crashAngle) * crashBikeLength;
    } else if (crashType === 'tear') {
        ['rear', 'front'].forEach(part => {
            let p = bikeParts[part];
            p.vy += player.gravity * timeScale;
            p.x += p.vx * timeScale;
            p.y += p.vy * timeScale;
            p.rot += p.rotV * timeScale;
            if (p.y > player.groundY + 5) {
                p.y = player.groundY + 5;
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

        if (beanCrash.y >= player.groundY + 5) {
            beanCrash.y = player.groundY + 5;
            beanCrash.isSplat = true;
            if (!hasPlayedSplatSound) {
                playCrash();
                hasPlayedSplatSound = true;
            }
        }
    } else {
        gameOverTimer += timeScale * 16.66;
        if (gameOverTimer > 1200) isGameOver = true;
    }
}

function drawEnvironment(moveScale) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const finishLineX = canvas.width + (3000 - worldDistance);
    if (finishLineX > 0 && finishLineX < canvas.width) {
        ctx.fillStyle = '#FFD700';
        for(let i=0; i<10; i++) {
            ctx.fillRect(finishLineX, player.groundY + 5 - (i*10), 10, 10);
        }
    }

    ctx.fillStyle = '#228B22';
    for (let bg of backgroundElements) {
        if (moveScale) bg.x -= gameSpeed * bg.speedModifier * moveScale;
        if (bg.x + bg.width < 0) bg.x = canvas.width;
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(bg.x + bg.width/3, player.groundY - 15, bg.width/3, 20);
        ctx.fillStyle = '#006400';
        ctx.fillRect(bg.x, player.groundY - bg.height + 5, bg.width, bg.height - 20);
    }

    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, player.groundY + 5, canvas.width, canvas.height - (player.groundY + 5));
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, player.groundY + 5, canvas.width, 4);
}

function drawCrashBean() {
    if (beanCrash.isSplat) {
        ctx.fillStyle = '#FFF';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(beanCrash.x, beanCrash.y, 22, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#555';
        ctx.fillRect(beanCrash.x - 15, beanCrash.y - 4, 8, 5);

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(beanCrash.x + 4, beanCrash.y - 2); ctx.lineTo(beanCrash.x + 8, beanCrash.y + 2);
        ctx.moveTo(beanCrash.x + 8, beanCrash.y - 2); ctx.lineTo(beanCrash.x + 4, beanCrash.y + 2);
        ctx.moveTo(beanCrash.x + 12, beanCrash.y - 2); ctx.lineTo(beanCrash.x + 16, beanCrash.y + 2);
        ctx.moveTo(beanCrash.x + 16, beanCrash.y - 2); ctx.lineTo(beanCrash.x + 12, beanCrash.y + 2);
        ctx.stroke();
    } else {
        ctx.save();
        ctx.translate(beanCrash.x, beanCrash.y);
        ctx.rotate(beanCrash.rotation);
        
        ctx.fillStyle = '#FFF';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 12, Math.PI / 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#555';
        ctx.fillRect(-12, -6, 6, 12);
        ctx.strokeRect(-12, -6, 6, 12);

        ctx.fillStyle = '#000';
        ctx.fillRect(2, -5, 2, 2);
        ctx.fillRect(6, -4, 2, 2);
        
        ctx.beginPath();
        ctx.moveTo(0, 5); ctx.lineTo(5, 12);
        ctx.moveTo(-2, 5); ctx.lineTo(-8, 10);
        ctx.moveTo(4, -2); ctx.lineTo(12, -8);
        ctx.stroke();
        ctx.restore();
    }
}

function drawBrokenBike() {
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#FFF';

    ctx.save();
    ctx.translate(bikeParts.rear.x, bikeParts.rear.y);
    ctx.rotate(bikeParts.rear.rot);
    ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(25, 0); ctx.moveTo(10, 0); ctx.lineTo(10, -15); ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(10, -15, 7, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(bikeParts.front.x, bikeParts.front.y);
    ctx.rotate(bikeParts.front.rot);
    ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-25, 0); ctx.moveTo(0, 0); ctx.lineTo(-5, -20); ctx.lineTo(5, -20); ctx.stroke();
    ctx.restore();
}

function drawPlayer() {
    if (crashType === 'tear') {
        drawBrokenBike();
        return;
    }

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#FFF';

    const dx = player.frontWheel.x - player.rearWheel.x;
    const dy = player.frontWheel.y - player.rearWheel.y;
    const angle = Math.atan2(dy, dx);
    
    const cx = (player.rearWheel.x + player.frontWheel.x) / 2;
    const cy = (player.rearWheel.y + player.frontWheel.y) / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    const dist = Math.hypot(dx, dy);
    const localX = Math.max(5, dist / 2);
    
    const seatX = -localX + 10;
    const seatY = -15;

    ctx.beginPath();
    ctx.arc(-localX, 0, 5, 0, Math.PI * 2);
    ctx.arc(localX, 0, 5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-localX, 0); ctx.lineTo(localX, 0);
    ctx.moveTo(seatX, 0); ctx.lineTo(seatX, seatY);
    ctx.moveTo(localX, 0); ctx.lineTo(localX - 5, -20); ctx.lineTo(localX + 5, -20);
    ctx.stroke();

    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(seatX, seatY, 7, 2.5, 0, 0, Math.PI * 2); ctx.fill();

    if (!isCrashing) {
        let beanOffsetY = 0;
        let beanAngle = 0;

        if (player.rearWheel.isJumping && !player.frontWheel.isJumping) {
            beanOffsetY = -8; beanAngle = 0.2;
        } else if (player.frontWheel.isJumping && !player.rearWheel.isJumping) {
            beanOffsetY = 0; beanAngle = -0.5;
        } else if (player.rearWheel.isJumping && player.frontWheel.isJumping) {
            beanOffsetY = -4; beanAngle = -0.1;
        }

        const crankX = seatX;
        const crankY = 0;
        const crankRadius = 6;
        const px1 = crankX + Math.cos(pedalAngle) * crankRadius;
        const py1 = crankY + Math.sin(pedalAngle) * crankRadius;
        const px2 = crankX + Math.cos(pedalAngle + Math.PI) * crankRadius;
        const py2 = crankY + Math.sin(pedalAngle + Math.PI) * crankRadius;

        const drawLeg = (px, py) => {
            const hipX = seatX - 2;
            const hipY = seatY + beanOffsetY + 4;
            const midX = (hipX + px) / 2;
            const midY = (hipY + py) / 2;
            ctx.beginPath();
            ctx.moveTo(hipX, hipY); ctx.lineTo(midX + 6, midY); ctx.lineTo(px, py);
            ctx.stroke();
        };

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#555';
        drawLeg(px2, py2);
        ctx.beginPath(); ctx.moveTo(crankX, crankY); ctx.lineTo(px2, py2); ctx.stroke();

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000';
        ctx.fillStyle = '#FFF';

        ctx.save();
        ctx.translate(seatX, seatY + beanOffsetY);
        ctx.rotate(beanAngle);

        ctx.beginPath(); ctx.ellipse(0, -10, 8, 12, Math.PI / 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#555'; ctx.fillRect(-12, -16, 6, 12); ctx.strokeRect(-12, -16, 6, 12);
        ctx.fillStyle = '#000'; ctx.fillRect(2, -15, 2, 2); ctx.fillRect(6, -14, 2, 2);
        ctx.restore(); 

        drawLeg(px1, py1);
        ctx.beginPath(); ctx.moveTo(crankX, crankY); ctx.lineTo(px1, py1); ctx.stroke();

        const shoulderX = seatX + 4 * Math.cos(beanAngle) - (-8) * Math.sin(beanAngle);
        const shoulderY = (seatY + beanOffsetY) + 4 * Math.sin(beanAngle) + (-8) * Math.cos(beanAngle);

        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.bezierCurveTo(-localX/2, -10, localX/2, -30, localX, -20);
        ctx.stroke();
    }
    ctx.restore();
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
        instructionEl.innerText = "Punkte: " + score + " | KLICK für Neustart";
        uiLayer.classList.remove('hidden');
        return;
    }

    let moveScale = isCrashing ? 0 : timeScale;

    if (!isCrashing) {
        let isAccelerating = keys.up || touchGas;
        let isBraking = keys.down || touchBrake;

        if (isAccelerating) player.targetBikeX += 2.5 * timeScale;
        if (isBraking) player.targetBikeX -= 2.5 * timeScale;
        
        if (player.targetBikeX < 20) player.targetBikeX = 20;
        if (player.targetBikeX > canvas.width - 100) player.targetBikeX = canvas.width - 100;

        player.rearWheel.defaultX = player.targetBikeX;
        player.frontWheel.defaultX = player.targetBikeX + 60;

        updateWheel(player.rearWheel, timeScale);
        updateWheel(player.frontWheel, timeScale);
        handleFrameCollision(timeScale);

        const dx = player.frontWheel.x - player.rearWheel.x;
        
        if (player.frontWheel.isHittingWall && dx < 30) {
            startCrash('flip');
        } else if (player.rearWheel.isHittingWall && dx > 110) {
            startCrash('tear');
        }

        if (!player.rearWheel.isJumping && !player.frontWheel.isJumping && !player.frontWheel.isHittingWall) {
            let currentPedalSpeed = gameSpeed * 0.15;
            if (isAccelerating) currentPedalSpeed += 0.1;
            if (isBraking) currentPedalSpeed = Math.max(0.05, currentPedalSpeed - 0.1);
            
            let oldAngle = pedalAngle;
            pedalAngle += currentPedalSpeed * timeScale;
            if (Math.floor(oldAngle / Math.PI) < Math.floor(pedalAngle / Math.PI)) playPedalSound();
        }
    } else {
        updateCrashAnimation(timeScale);
    }

    drawEnvironment(moveScale);
    spawnObstaclesFromData(timeScale, moveScale);
    
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.x -= gameSpeed * moveScale;

        ctx.fillStyle = obs.color;
        ctx.strokeStyle = '#000';
        ctx.beginPath();
        if (obs.type === 'block') {
            ctx.rect(obs.x, obs.y, obs.width, obs.height);
        } else if (obs.type === 'ramp') {
            ctx.moveTo(obs.x, player.groundY + 5); ctx.lineTo(obs.x + obs.width, obs.y); ctx.lineTo(obs.x + obs.width, player.groundY + 5);
        } else if (obs.type === 'round') {
            ctx.moveTo(obs.x, player.groundY + 5); ctx.ellipse(obs.x + obs.width / 2, player.groundY + 5, obs.width / 2, obs.height, 0, Math.PI, 0);
        }
        ctx.fill(); ctx.stroke();

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

    animationFrameId = requestAnimationFrame(gameLoop);
}

drawEnvironment(0);
drawPlayer();