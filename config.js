let canvas, ctx, uiLayer, titleEl, instructionEl, touchControls, fullscreenBtn, headlightBtn;
let levelData = [];
let designData = null;
let worldDistance = 0;
let nextObstacleIndex = 0;
let currentLevel = 1;
let levelDistance = 6000;
let finishLineActive = false;
let finishLineX = 0;
let isLevelComplete = false;
let bikeStopped = false;
let lives = 3;
let highestScoredObstacle = -1;
let isHeadlightOn = false;
let flyingObjects = [];
let rainParticles = [];
let isRaining = false;

let keys = { up: false, down: false };
let touchGas = false;
let touchBrake = false;
let isGameRunning = false;
let isGameOver = false;
let isCrashing = false;
let score = 0;
let levelStartScore = 0;
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
let beanCrash = { x: 0, y: 0, vx: 0, vy: 0, rotation: 0, isSplat: false };

let player = {
    targetBikeX: 30,
    rearWheel: { x: 30, defaultX: 30, y: 185, vy: 0, isJumping: false, isHittingWall: false, onUphillLiana: false, onSurface: true },
    frontWheel: { x: 90, defaultX: 90, y: 185, vy: 0, isJumping: false, isHittingWall: false, onUphillLiana: false, onSurface: true },
    gravity: 0.35,
    jumpStrength: -6.5
};

let obstacles = [];
let backgroundElements = [];