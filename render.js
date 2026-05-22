// Konstante fuer den Horizont
const HORIZON_Y = 170;

// Umgebung und Hintergrund rendern
function drawEnvironment(moveScale) {
    if (designData && designData.theme) ctx.fillStyle = designData.theme.skyColor;
    else ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (designData && designData.theme && designData.theme.sun.active) {
        ctx.fillStyle = designData.theme.sun.color;
        ctx.fillRect(canvas.width - designData.theme.sun.xOffset, designData.theme.sun.y, designData.theme.sun.size, designData.theme.sun.size);
    }

    const drawOrder = ['mountain', 'tree', 'building'];
    drawOrder.forEach(function(type) {
        backgroundElements.filter(function(bg) { return bg.type === type; }).forEach(function(bg) {
            if (moveScale) bg.x -= gameSpeed * bg.speedModifier * moveScale;
            if (bg.x + bg.width < 0) bg.x = canvas.width;
            
            if (bg.type === 'tree') {
                ctx.fillStyle = bg.color1;
                ctx.fillRect(bg.x + bg.width/3, HORIZON_Y - 15, bg.width/3, 20);
                ctx.fillStyle = bg.color2;
                ctx.fillRect(bg.x, HORIZON_Y - bg.height + 5, bg.width, bg.height - 20);
            } else if (bg.type === 'building') {
                ctx.fillStyle = bg.color1;
                ctx.fillRect(bg.x, HORIZON_Y + 5 - bg.height, bg.width, bg.height);
                ctx.fillStyle = bg.color2;
                ctx.beginPath();
                ctx.moveTo(bg.x - 5, HORIZON_Y + 5 - bg.height);
                ctx.lineTo(bg.x + bg.width / 2, HORIZON_Y + 5 - bg.height - 20);
                ctx.lineTo(bg.x + bg.width + 5, HORIZON_Y + 5 - bg.height);
                ctx.fill();
            } else if (bg.type === 'mountain') {
                ctx.fillStyle = bg.color1;
                ctx.beginPath();
                ctx.moveTo(bg.x, HORIZON_Y + 5);
                ctx.lineTo(bg.x + bg.width / 2, HORIZON_Y + 5 - bg.height);
                ctx.lineTo(bg.x + bg.width, HORIZON_Y + 5);
                ctx.fill();
            }
        });
    });

    ctx.fillStyle = designData && designData.theme ? designData.theme.groundColor : '#8B4513';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    
    for (let x = 0; x <= canvas.width; x += 5) {
        let isChasm = false;
        for (let obs of obstacles) {
            if (obs.type === 'chasm' && x >= obs.x && x <= obs.x + obs.width) isChasm = true;
        }
        let ty = isChasm ? canvas.height + 10 : getTerrainY(worldDistance + x) + 5;
        ctx.lineTo(x, ty);
    }
    
    ctx.lineTo(canvas.width, canvas.height);
    ctx.fill();

    ctx.strokeStyle = designData && designData.theme ? designData.theme.surfaceColor : '#228B22';
    ctx.lineWidth = 4;
    ctx.beginPath();
    let isDrawing = false;
    
    for (let x = 0; x <= canvas.width; x += 5) {
        let isChasm = false;
        for (let obs of obstacles) {
            if (obs.type === 'chasm' && x >= obs.x && x <= obs.x + obs.width) isChasm = true;
        }
        if (!isChasm) {
            let ty = getTerrainY(worldDistance + x) + 5;
            if (!isDrawing) { ctx.moveTo(x, ty); isDrawing = true; }
            else { ctx.lineTo(x, ty); }
        } else {
            isDrawing = false;
        }
    }
    ctx.stroke();

    if (finishLineActive) {
        if (moveScale) finishLineX -= gameSpeed * moveScale;
        let ty = getTerrainY(worldDistance + finishLineX);
        ctx.fillStyle = '#FFF';
        ctx.fillRect(finishLineX, ty - 80, 10, 85);
        for(let i=0; i<4; i++) {
            ctx.fillStyle = (i%2===0) ? '#000' : '#FFF';
            ctx.fillRect(finishLineX + 10, ty - 80 + (i*10), 10, 10);
            ctx.fillStyle = (i%2!==0) ? '#000' : '#FFF';
            ctx.fillRect(finishLineX + 20, ty - 80 + (i*10), 10, 10);
        }
    }
}

// Bohne bei Unfall zeichnen
function drawCrashBean() {
    if (beanCrash.isSplat) {
        ctx.fillStyle = '#FFF'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(beanCrash.x, beanCrash.y, 22, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#555'; ctx.fillRect(beanCrash.x - 15, beanCrash.y - 4, 8, 5);
        ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.beginPath();
        ctx.moveTo(beanCrash.x + 4, beanCrash.y - 2); ctx.lineTo(beanCrash.x + 8, beanCrash.y + 2);
        ctx.moveTo(beanCrash.x + 8, beanCrash.y - 2); ctx.lineTo(beanCrash.x + 4, beanCrash.y + 2);
        ctx.moveTo(beanCrash.x + 12, beanCrash.y - 2); ctx.lineTo(beanCrash.x + 16, beanCrash.y + 2);
        ctx.moveTo(beanCrash.x + 16, beanCrash.y - 2); ctx.lineTo(beanCrash.x + 12, beanCrash.y + 2);
        ctx.stroke();
    } else {
        ctx.save();
        ctx.translate(beanCrash.x, beanCrash.y);
        ctx.rotate(beanCrash.rotation);
        ctx.fillStyle = '#FFF'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(0, 0, 8, 12, Math.PI / 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#555'; ctx.fillRect(-12, -6, 6, 12); ctx.strokeRect(-12, -6, 6, 12);
        ctx.fillStyle = '#000'; ctx.fillRect(2, -5, 2, 2); ctx.fillRect(6, -4, 2, 2);
        ctx.beginPath(); ctx.moveTo(0, 5); ctx.lineTo(5, 12); ctx.moveTo(-2, 5); ctx.lineTo(-8, 10); ctx.moveTo(4, -2); ctx.lineTo(12, -8); ctx.stroke();
        ctx.restore();
    }
}

// Zerrissenes Bike zeichnen
function drawBrokenBike() {
    if(crashType === 'fall') return; 
    ctx.lineWidth = 2; ctx.strokeStyle = '#000'; ctx.fillStyle = '#FFF';
    ctx.save(); ctx.translate(bikeParts.rear.x, bikeParts.rear.y); ctx.rotate(bikeParts.rear.rot);
    ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(25, 0); ctx.moveTo(10, 0); ctx.lineTo(10, -15); ctx.stroke();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(10, -15, 7, 2.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();

    ctx.save(); ctx.translate(bikeParts.front.x, bikeParts.front.y); ctx.rotate(bikeParts.front.rot);
    ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-25, 0); ctx.moveTo(0, 0); ctx.lineTo(-5, -20); ctx.lineTo(5, -20); ctx.stroke(); ctx.restore();
}

// Regularen Spieler zeichnen
function drawPlayer() {
    if (crashType === 'tear' || crashType === 'fall') {
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

    ctx.beginPath(); ctx.arc(-localX, 0, 5, 0, Math.PI * 2); ctx.arc(localX, 0, 5, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-localX, 0); ctx.lineTo(localX, 0); ctx.moveTo(seatX, 0); ctx.lineTo(seatX, seatY); ctx.moveTo(localX, 0); ctx.lineTo(localX - 5, -20); ctx.lineTo(localX + 5, -20); ctx.stroke();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(seatX, seatY, 7, 2.5, 0, 0, Math.PI * 2); ctx.fill();

    if (!isCrashing) {
        let beanOffsetY = 0;
        let beanAngle = 0;

        if (player.rearWheel.isJumping && !player.frontWheel.isJumping) { beanOffsetY = -8; beanAngle = 0.2; } 
        else if (player.frontWheel.isJumping && !player.rearWheel.isJumping) { beanOffsetY = 0; beanAngle = -0.5; } 
        else if (player.rearWheel.isJumping && player.frontWheel.isJumping) { beanOffsetY = -4; beanAngle = -0.1; }

        const crankX = seatX; const crankY = 0; const crankRadius = 6;
        const px1 = crankX + Math.cos(pedalAngle) * crankRadius; const py1 = crankY + Math.sin(pedalAngle) * crankRadius;
        const px2 = crankX + Math.cos(pedalAngle + Math.PI) * crankRadius; const py2 = crankY + Math.sin(pedalAngle + Math.PI) * crankRadius;

        const drawLeg = function(px, py) {
            const hipX = seatX - 2; const hipY = seatY + beanOffsetY + 4;
            const midX = (hipX + px) / 2; const midY = (hipY + py) / 2;
            ctx.beginPath(); ctx.moveTo(hipX, hipY); ctx.lineTo(midX + 6, midY); ctx.lineTo(px, py); ctx.stroke();
        };

        ctx.lineWidth = 1.5; ctx.strokeStyle = '#555'; drawLeg(px2, py2);
        ctx.beginPath(); ctx.moveTo(crankX, crankY); ctx.lineTo(px2, py2); ctx.stroke();
        ctx.lineWidth = 2; ctx.strokeStyle = '#000'; ctx.fillStyle = '#FFF';
        ctx.save(); ctx.translate(seatX, seatY + beanOffsetY); ctx.rotate(beanAngle);
        ctx.beginPath(); ctx.ellipse(0, -10, 8, 12, Math.PI / 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#555'; ctx.fillRect(-12, -16, 6, 12); ctx.strokeRect(-12, -16, 6, 12);
        ctx.fillStyle = '#000'; ctx.fillRect(2, -15, 2, 2); ctx.fillRect(6, -14, 2, 2); ctx.restore(); 
        drawLeg(px1, py1);
        ctx.beginPath(); ctx.moveTo(crankX, crankY); ctx.lineTo(px1, py1); ctx.stroke();

        const shoulderX = seatX + 4 * Math.cos(beanAngle) - (-8) * Math.sin(beanAngle);
        const shoulderY = (seatY + beanOffsetY) + 4 * Math.sin(beanAngle) + (-8) * Math.cos(beanAngle);

        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        
        if (isLevelComplete && bikeStopped) {
            let wave = Math.sin(performance.now() / 100) * 15;
            ctx.quadraticCurveTo(0, -40 + wave, 10, -50 + wave);
        } else {
            ctx.bezierCurveTo(-localX/2, -10, localX/2, -30, localX, -20);
        }
        ctx.stroke();
    }
    ctx.restore();
}
