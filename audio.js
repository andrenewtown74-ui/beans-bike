let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let bgMusic = new Audio();
bgMusic.loop = true;
bgMusic.volume = 0.4;

function initAudio() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
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
    setTimeout(function() { playTone(1108, 'square', 0.15, 0.1); }, 100);
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

function playFanfare() {
    if (!audioCtx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; 
    let startTime = audioCtx.currentTime;
    notes.forEach(function(freq, i) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, startTime + i * 0.15);
        gain.gain.setValueAtTime(0.1, startTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + i * 0.15 + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(startTime + i * 0.15);
        osc.stop(startTime + i * 0.15 + 0.15);
    });
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1046.50, startTime + 0.6);
    gain.gain.setValueAtTime(0.1, startTime + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(startTime + 0.6);
    osc.stop(startTime + 1.2);
}

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
    if (bgMusic.src && bgMusic.paused) {
        bgMusic.play().catch(function(err) {});
    }
}

function stopMusic() { 
    bgMusic.pause(); 
}