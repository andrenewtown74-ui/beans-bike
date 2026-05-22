// Umgebung und Hintergrund rendern
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

// Bohne bei Unfall zeichnen
function drawCrashBean() {
    if (beanCrash.isSplat) {
        // Zerplatzt am Boden
        ctx.fillStyle = '#D2B48C'; // Helles Braun
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(beanCrash.x, beanCrash.y, 22, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Augen (geschlossen/X-Form)
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(beanCrash.x - 5, beanCrash.y - 3); ctx.lineTo(beanCrash.x - 1, beanCrash.y + 1);
        ctx.moveTo(beanCrash.x - 1, beanCrash.y - 3); ctx.lineTo(beanCrash.x - 5, beanCrash.y + 1);
        ctx.moveTo(beanCrash.x + 1, beanCrash.y - 3); ctx.lineTo(beanCrash.x + 5, beanCrash.y + 1);
        ctx.moveTo(beanCrash.x + 5, beanCrash.y - 3); ctx.lineTo(beanCrash.x + 1, beanCrash.y + 1);
        ctx.stroke();

    } else {
        // Fliegend
        ctx.save();
        ctx.translate(beanCrash.x, beanCrash.y);
        ctx.rotate(beanCrash.rotation);
        
        // Körper
        ctx.fillStyle = '#D2B48C'; // Helles Braun
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 12, Math.PI / 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Gesicht (im save/restore Block)
        ctx.save();
        ctx.rotate(Math.PI / 8);
        // Augen (geschlossen/erschrocken)
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-3, -4); ctx.lineTo(0, -2);
        ctx.moveTo(0, -4); ctx.lineTo(3, -2);
        ctx.stroke();
        // Mund (offen/erschrocken)
        ctx.beginPath();
        ctx.arc(0, 3, 2, 0, Math.PI);
        ctx.stroke();
        ctx.restore();
        
        // Arme und Beine
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 5); ctx.lineTo(5, 12);
        ctx.moveTo(-2, 5); ctx.lineTo(-8, 10);
        ctx.moveTo(4, -2); ctx.lineTo(12, -8);
        ctx.stroke();
        ctx.restore();
    }
}

// Zerrissenes Bike zeichnen
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

// Regularen Spieler zeichnen
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

    // Fahrradrahmen und Räder
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

        const drawLeg = function(px, py) {
            const hipX = seatX - 2;
            const hipY = seatY + beanOffsetY + 4;
            const midX = (hipX + px) / 2;
            const midY = (hipY + py) / 2;
            ctx.beginPath();
            ctx.moveTo(hipX, hipY); ctx.lineTo(midX + 6, midY); ctx.lineTo(px, py);
            ctx.stroke();
        };

        // Hinteres Bein und Kurbel
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#555';
        drawLeg(px2, py2);
        ctx.beginPath(); ctx.moveTo(crankX, crankY); ctx.lineTo(px2, py2); ctx.stroke();

        // Bohne Körper
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000';
        ctx.fillStyle = '#D2B48C'; // Helles Braun

        ctx.save();
        ctx.translate(seatX, seatY + beanOffsetY);
        ctx.rotate(beanAngle);

        ctx.beginPath(); ctx.ellipse(0, -10, 8, 12, Math.PI / 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        // Gesicht
        ctx.save();
        ctx.translate(0, -10);
        ctx.rotate(Math.PI / 8);
        
        // Augen
        ctx.fillStyle = '#FFF';
        ctx.beginPath(); ctx.arc(3, -3, 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); // Rechts
        ctx.beginPath(); ctx.arc(0, -3, 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); // Links
        
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(4, -3, 0.8, 0, Math.PI * 2); ctx.fill(); // Rechte Pupille
        ctx.beginPath(); ctx.arc(1, -3, 0.8, 0, Math.PI * 2); ctx.fill(); // Linke Pupille
        
        // Mund
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(2, 2, 3, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
        
        ctx.restore(); // Ende Gesicht

        ctx.restore(); // Ende Bohne Körper

        // Vorderes Bein und Kurbel
        drawLeg(px1, py1);
        ctx.beginPath(); ctx.moveTo(crankX, crankY); ctx.lineTo(px1, py1); ctx.stroke();

        // Arme
        const shoulderX = seatX + 4 * Math.cos(beanAngle) - (-8) * Math.sin(beanAngle);
        const shoulderY = (seatY + beanOffsetY) + 4 * Math.sin(beanAngle) + (-8) * Math.cos(beanAngle);

        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.bezierCurveTo(-localX/2, -10, localX/2, -30, localX, -20);
        ctx.stroke();
    }
    ctx.restore();
}