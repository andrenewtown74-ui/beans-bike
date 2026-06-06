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
// Liste aller verfuegbaren Menue-Songs
const menuTracks = [
    "Sprocket_Hill_Climb.mp3",
    "Blauer_Marmor.mp3",
    "Cold_Obsidian.mp3",
    "Jungle_Theme.mp3",
    "Gravity_Pulls_the_Chain.mp3",
    "Gargoyle_Flight.mp3"
    // Hier kannst du beliebig viele weitere Titel eintragen.
    // Achte auf die exakte Schreibweise und das Komma am Ende jeder Zeile (ausser bei der letzten)!
];
let menuAudio = null;
let currentMenuTrackIndex = 0;

function playMenuMusic() {
    if (menuAudio && !menuAudio.paused) return; // Verhindert doppeltes Abspielen
    
    // Audio-Objekt mit dem aktuellen Track erstellen
    menuAudio = new Audio(menuTracks[currentMenuTrackIndex]);
    menuAudio.volume = 0.5; // Etwas leiser im Menue
    
    // Event-Listener: Wenn das Lied zu Ende ist, starte das naechste
    menuAudio.addEventListener('ended', function() {
        currentMenuTrackIndex++;
        // Wenn das Ende der Liste erreicht ist, fange wieder von vorne an
        if (currentMenuTrackIndex >= menuTracks.length) {
            currentMenuTrackIndex = 0;
        }
        // Quelle austauschen und abspielen
        menuAudio.src = menuTracks[currentMenuTrackIndex];
        menuAudio.play().catch(function(e) {
            console.log("Autoplay blockiert beim naechsten Track.");
        });
    });
    
    menuAudio.play().catch(function(e) {
        console.log("Autoplay blockiert, warte auf Interaktion.");
    });
}

function stopMenuMusic() {
    if (menuAudio) {
        menuAudio.pause();
        menuAudio.currentTime = 0;
    }
}
