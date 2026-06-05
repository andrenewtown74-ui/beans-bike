const firebaseConfig = {
  apiKey: "AIzaSyBeGLo2fZeHpx2QShG3HzM_e-9Z1TqmL5Y",
  authDomain: "bohnen-bike.firebaseapp.com",
  projectId: "bohnen-bike",
  storageBucket: "bohnen-bike.firebasestorage.app",
  messagingSenderId: "813575639636",
  appId: "1:813575639636:web:46bc5f60ee57572e3b13c1",
  measurementId: "G-C5K21Q2VLD"
};
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = typeof firebase !== 'undefined' ? firebase.firestore() : null;

// Globale Variablen
let currentLevel = 1;
let lives = 3;
let score = 0;
let levelStartScore = 0;
let highScore = 0;
let gameSpeed = 1.5;

let isGameRunning = false;
let isGameOver = false;
let isCrashing = false;
let crashType = '';

let worldDistance = 0;
let levelDistance = 6000;
let highestScoredObstacle = -1;
let finishLineActive = false;
let finishLineX = 0;
let isLevelComplete = false;
let bikeStopped = false;

let pedalAngle = 0;
let isHeadlightOn = false;
let crashAngle = 0;
let crashBikeLength = 0;
let gameOverTimer = 0;
let hasPlayedFanfare = false;
let hasPlayedSplatSound = false;

let obstacles = [];
let flyingObjects = [];
let backgroundElements = [];
let nextObstacleIndex = 0;

let levelData = [];
let designData = {};

let player = {
    targetBikeX: 30,
    gravity: 0.35,
    jumpStrength: -6.5,
    rearWheel: { x: 30, y: 185, defaultX: 30, vy: 0, isJumping: false, isHittingWall: false, onSurface: true, onUphillLiana: false },
    frontWheel: { x: 90, y: 185, defaultX: 90, vy: 0, isJumping: false, isHittingWall: false, onSurface: true, onUphillLiana: false }
};

let bikeParts = { rear: null, front: null };
let beanCrash = { x: 0, y: 0, vx: 0, vy: 0, rotation: 0, isSplat: false };

let keys = { up: false, down: false };
let touchGas = false;
let touchBrake = false;

let lastTime = 0;
let animationFrameId;

let canvas, ctx, uiLayer, titleEl, instructionEl, touchControls, fullscreenBtn, headlightBtn;