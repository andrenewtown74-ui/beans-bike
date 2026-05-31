// Umgebung und Hintergrund rendern
function drawEnvironment(moveScale) {
    if (designData && designData.theme) ctx.fillStyle = designData.theme.skyColor;
    else ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (designData && designData.theme && designData.theme.sun && designData.theme.sun.active) {
        ctx.fillStyle = designData.theme.sun.color;
        ctx.fillRect(canvas.width - designData.theme.sun.xOffset, designData.theme.sun.y, designData.theme.sun.size, designData.theme.sun.size);
    }

    const drawOrder = ['star', 'planet', 'mountain', 'tree', 'building'];
    let horizon = getHorizonY();

    drawOrder.forEach(function(type) {
        backgroundElements.filter(function(bg) { return bg.type === type; }).forEach(function(bg) {
            if (moveScale) bg.x -= gameSpeed * bg.speedModifier * moveScale;
            if (bg.x + bg.width < 0) bg.x = canvas.width;
            
            if (bg.type === 'star') {
                ctx.fillStyle = bg.color1;
                ctx.fillRect(bg.x, horizon - bg.height, bg.width, bg.width);
            } else if (bg.type === 'planet') {
                // Basis-Planet (Ozean)
                ctx.fillStyle = bg.color1 || '#1E90FF';
                ctx.beginPath(); ctx.arc(bg.x, horizon - bg.height, bg.width, 0, Math.PI * 2); ctx.fill();
                
                // Kontinente
                ctx.fillStyle = bg.color2 || '#32CD32';
                ctx.beginPath();
                ctx.ellipse(bg.x - bg.width * 0.2, horizon - bg.height - bg.width * 0.2, bg.width * 0.4, bg.width * 0.25, 0.5, 0, Math.PI * 2);
                ctx.ellipse(bg.x + bg.width * 0.3, horizon - bg.height + bg.width * 0.1, bg.width * 0.3, bg.width * 0.4, -0.2, 0, Math.PI * 2);
                ctx.ellipse(bg.x - bg.width * 0.1, horizon - bg.height + bg.width * 0.4, bg.width * 0.5, bg.width * 0.15, 0.1, 0, Math.PI * 2);
                ctx.fill();
                
                // Wolkenbaender
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.beginPath();
                ctx.ellipse(bg.x + bg.width * 0.1, horizon - bg.height - bg.width * 0.4, bg.width * 0.6, bg.width * 0.1, 0, 0, Math.PI * 2);
                ctx.ellipse(bg.x - bg.width * 0.3, horizon - bg.height + bg.width * 0.1, bg.width * 0.4, bg.width * 0.08, 0.2, 0, Math.PI * 2);
                ctx.fill();
                
                // Sphaerischer Schatteneffekt
                let shadowGrad = ctx.createLinearGradient(bg.x - bg.width, horizon - bg.height - bg.width, bg.x + bg.width, horizon - bg.height + bg.width);
                shadowGrad.addColorStop(0, 'rgba(0,0,0,0)');
                shadowGrad.addColorStop(0.5, 'rgba(0,0,0,0)');
                shadowGrad.addColorStop(1, 'rgba(0,0,0,0.8)');
                ctx.fillStyle = shadowGrad;
                ctx.beginPath(); ctx.arc(bg.x, horizon - bg.height, bg.width, 0, Math.PI * 2); ctx.fill();
            } else if (bg.type === 'tree') {
                ctx.fillStyle = bg.color1;
                ctx.fillRect(bg.x + bg.width/3, horizon - 15, bg.width/3, 20);
                ctx.fillStyle = bg.color2;
                ctx.fillRect(bg.x, horizon - bg.height + 5, bg.width, bg.height - 20);
            } else if (bg.type === 'building') {
                ctx.fillStyle = bg.color1;
                ctx.fillRect(bg.x, horizon + 5 - bg.height, bg.width, bg.height);
                ctx.fillStyle = bg.color2;
                ctx.beginPath();
                ctx.moveTo(bg.x - 5, horizon + 5 - bg.height);
                ctx.lineTo(bg.x + bg.width / 2, horizon + 5 - bg.height - 20);
                ctx.lineTo(bg.x + bg.width + 5, horizon + 5 - bg.height);
                ctx.fill();
            } else if (bg.type === 'mountain') {
                ctx.fillStyle = bg.color1;
                ctx.beginPath();
                ctx.moveTo(bg.x, horizon + 5);
                ctx.lineTo(bg.x + bg.width / 2, horizon + 5 - bg.height);
                ctx.lineTo(bg.x + bg.width, horizon + 5);
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
            if ((obs.type === 'chasm' || obs.type === 'lava' || obs.type === 'liana_bridge') && x >= obs.x && x <= obs.x + obs.width) isChasm = true;
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
            if ((obs.type === 'chasm' || obs.type === 'lava' || obs.type === 'liana_bridge') && x >= obs.x && x <= obs.x + obs.width) isChasm = true;
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
        ctx.fillStyle = '#FFD700';
        for(let i=0; i<10; i++) {
            ctx.fillRect(finishLineX, ty + 5 - (i*10), 10, 10);
        }
    }
}

// Zeichnen von Partikeleffekten (Regen, Schnee, Asche)
function drawWeather(timeScale) {
    if (!designData || !designData.theme || !designData.theme.weather) return;
    let weatherType = designData.theme.weather;

    if (weatherType === 'rain_intervals') {
        isRaining = (Math.floor(worldDistance / 2000) % 2 !== 0);
    } else {
        isRaining = true;
    }

    if (isRaining && window.weatherParticles.length < 150) {
        let vxBase = 0, vyBase = 0, colorStr = '';
        if (weatherType === 'rain_intervals' || weatherType === 'rain') {
            vyBase = 12 + Math.random() * 5;
            vxBase = -3 - Math.random() * 2;
            colorStr = 'rgba(200, 220, 255, 0.6)';
        } else if (weatherType === 'snow') {
            vyBase = 2 + Math.random() * 2;
            vxBase = -1 - Math.random() * 1.5;
            colorStr = 'rgba(255, 255, 255, 0.8)';
        } else if (weatherType === 'ash') {
            vyBase = -1 - Math.random() * 2; 
            vxBase = -2 + Math.random() * 4; 
            colorStr = Math.random() > 0.5 ? 'rgba(255, 69, 0, 0.8)' : 'rgba(100, 100, 100, 0.6)';
        }

        window.weatherParticles.push({
            x: Math.random() * canvas.width * 1.5,
            y: (weatherType === 'ash') ? canvas.height + Math.random() * 50 : Math.random() * canvas.height - canvas.height,
            vy: vyBase,
            vx: vxBase,
            type: weatherType,
            color: colorStr
        });
    }

    if (window.weatherParticles.length > 0) {
        for (let i = window.weatherParticles.length - 1; i >= 0; i--) {
            let p = window.weatherParticles[i];
            p.x += p.vx * timeScale;
            p.y += p.vy * timeScale;
            
            let isOut = (p.type === 'ash') ? (p.y < -20 || p.x < -20 || p.x > canvas.width + 20) : (p.y > canvas.height || p.x < -20);
            
            if (isOut) {
                if (isRaining) {
                    p.y = (p.type === 'ash') ? canvas.height + 20 : -20;
                    p.x = Math.random() * canvas.width * 1.5;
                } else {
                    window.weatherParticles.splice(i, 1);
                    continue;
                }
            }

            ctx.fillStyle = p.color;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 1;
            
            if (p.type === 'rain_intervals' || p.type === 'rain') {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x - p.vx, p.y - p.vy);
                ctx.stroke();
            } else if (p.type === 'snow') {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'ash') {
                ctx.fillRect(p.x, p.y, 2, 2);
            }
        }
    }
}

// Bohne bei Unfall zeichnen
function drawCrashBean() {
    if (beanCrash.isSplat) {
        ctx.fillStyle = '#D2B48C';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(beanCrash.x, beanCrash.y, 22, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(beanCrash.x - 5, beanCrash.y - 3); ctx.lineTo(beanCrash.x - 1, beanCrash.y + 1);
        ctx.moveTo(beanCrash.x - 1, beanCrash.y - 3); ctx.lineTo(beanCrash.x - 5, beanCrash.y + 1);
        ctx.moveTo(beanCrash.x + 1, beanCrash.y - 3); ctx.lineTo(beanCrash.x + 5, beanCrash.y + 1);
        ctx.moveTo(beanCrash.x + 5, beanCrash.y - 3); ctx.lineTo(beanCrash.x + 1, beanCrash.y + 1);
        ctx.stroke();
    } else {
        ctx.save();
        ctx.translate(beanCrash.x, beanCrash.y);
        ctx.rotate(beanCrash.rotation);
        
        ctx.fillStyle = '#D2B48C';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 12, Math.PI / 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.save();
        ctx.rotate(Math.PI / 8);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-3, -4); ctx.lineTo(0, -2);
        ctx.moveTo(0, -4); ctx.lineTo(3, -2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 3, 2, 0, Math.PI);
        ctx.stroke();
        ctx.restore();
        
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 5); ctx.lineTo(5, 12);
        ctx.moveTo(-2, 5); ctx.lineTo(-8, 10);
        ctx.moveTo(4, -2); ctx.lineTo(12, -8);
        ctx.stroke();
        ctx.restore();
    }
}

// Zerrissenes Fahrrad zeichnen
function drawBrokenBike() {
    if(crashType === 'fall') return; 
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
    
    ctx.fillStyle = '#A9A9A9';
    ctx.beginPath();
    ctx.rect(5, -22, 6, 4);
    ctx.fill();
    ctx.stroke();

    if (isHeadlightOn) {
        let grad = ctx.createLinearGradient(11, 0, 200, 0);
        grad.addColorStop(0, 'rgba(255, 255, 200, 0.6)');
        grad.addColorStop(1, 'rgba(255, 255, 200, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(11, -20);
        ctx.lineTo(200, -80);
        ctx.lineTo(200, 60);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
}

// Spieler zeichnen
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
    const lampX = localX + 5;
    const lampY = -20;

    ctx.beginPath();
    ctx.arc(-localX, 0, 5, 0, Math.PI * 2);
    ctx.arc(localX, 0, 5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-localX, 0); ctx.lineTo(localX, 0);
    ctx.moveTo(seatX, 0); ctx.lineTo(seatX, seatY);
    ctx.moveTo(localX, 0); ctx.lineTo(localX - 5, -20); ctx.lineTo(lampX, lampY);
    ctx.stroke();

    ctx.fillStyle = '#A9A9A9';
    ctx.beginPath();
    ctx.rect(lampX, lampY - 2, 6, 4);
    ctx.fill();
    ctx.stroke();

    if (isHeadlightOn && !isCrashing) {
        ctx.save();
        let grad = ctx.createLinearGradient(lampX + 6, 0, lampX + 200, 0);
        grad.addColorStop(0, 'rgba(255, 255, 200, 0.6)');
        grad.addColorStop(1, 'rgba(255, 255, 200, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(lampX + 6, lampY);
        ctx.lineTo(lampX + 200, lampY - 60);
        ctx.lineTo(lampX + 200, lampY + 80);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

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

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#555';
        drawLeg(px2, py2);
        ctx.beginPath(); ctx.moveTo(crankX, crankY); ctx.lineTo(px2, py2); ctx.stroke();

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000';
        ctx.fillStyle = '#D2B48C'; 

        ctx.save();
        ctx.translate(seatX, seatY + beanOffsetY);
        ctx.rotate(beanAngle);

        ctx.beginPath(); ctx.ellipse(0, -10, 8, 12, Math.PI / 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        ctx.save();
        ctx.translate(0, -10);
        ctx.rotate(Math.PI / 8);
        ctx.fillStyle = '#FFF';
        ctx.beginPath(); ctx.arc(3, -3, 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, -3, 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(4, -3, 0.8, 0, Math.PI * 2); ctx.fill(); 
        ctx.beginPath(); ctx.arc(1, -3, 0.8, 0, Math.PI * 2); ctx.fill(); 
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(2, 2, 3, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
        ctx.restore();
        ctx.restore();

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

// Zeichnen aller Flugobjekte
function drawFlyingObjects() {
    for (let obj of flyingObjects) {
        ctx.save();
        ctx.translate(obj.x, obj.y);

        if (obj.type === 'wasp') {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.ellipse(0, 0, 7, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#000000';
            ctx.fillRect(-3, -4, 2, 8);
            ctx.fillRect(1, -4, 2, 8);

            let wingOffset = Math.sin(performance.now() * 0.1) * 6;
            ctx.fillStyle = 'rgba(200, 240, 255, 0.7)';
            ctx.beginPath();
            ctx.ellipse(-1, -4, 3, 6, Math.PI/6 + wingOffset*0.05, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } 
        else if (obj.type === 'bird') {
            ctx.fillStyle = '#8B5A2B';
            ctx.beginPath();
            ctx.ellipse(0, 0, 8, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#FF9900';
            ctx.beginPath();
            ctx.moveTo(8, -2);
            ctx.lineTo(13, 0);
            ctx.lineTo(8, 2);
            ctx.closePath();
            ctx.fill();

            let wingY = Math.sin(performance.now() * 0.05) * 8;
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-2, 0);
            ctx.lineTo(0, -wingY);
            ctx.lineTo(2, 0);
            ctx.stroke();
        } 
        else if (obj.type === 'meteorite') {
            let gradient = ctx.createLinearGradient(0, 0, 15, -15);
            gradient.addColorStop(0, '#FF3300');
            gradient.addColorStop(0.5, '#FF9900');
            gradient.addColorStop(1, 'rgba(255, 153, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(-5, -5);
            ctx.lineTo(25, -25);
            ctx.lineTo(5, 5);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#555555';
            ctx.strokeStyle = '#FF3300';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, -6);
            ctx.lineTo(5, -3);
            ctx.lineTo(6, 3);
            ctx.lineTo(2, 6);
            ctx.lineTo(-4, 4);
            ctx.lineTo(-5, -2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        else if (obj.type === 'monkey') {
            ctx.strokeStyle = '#228B22';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(20, -200); 
            ctx.stroke();

            ctx.fillStyle = '#8B4513';
            ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(-4, -6, 5, 0, Math.PI * 2); ctx.fill();
            
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            ctx.beginPath(); 
            ctx.moveTo(6, 2); 
            ctx.quadraticCurveTo(12, Math.sin(performance.now()*0.01)*5, 10, -8); 
            ctx.stroke();
            
            ctx.fillStyle = '#FFDAB9';
            ctx.beginPath(); ctx.arc(-6, -6, 3, 0, Math.PI * 2); ctx.fill();
        }
        else if (obj.type === 'bat') {
            ctx.fillStyle = '#222';
            ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI*2); ctx.fill();
            let wingY = Math.sin(performance.now() * 0.05) * 8;
            ctx.beginPath(); ctx.moveTo(-2, -2); ctx.lineTo(-10, -wingY - 5); ctx.lineTo(-6, 2); ctx.fill();
            ctx.beginPath(); ctx.moveTo(2, -2); ctx.lineTo(10, -wingY - 5); ctx.lineTo(6, 2); ctx.fill();
            ctx.fillStyle = '#FFF';
            ctx.fillRect(-2, -2, 1, 1); ctx.fillRect(1, -2, 1, 1);
        }
        else if (obj.type === 'fireball') {
            let glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 15);
            glow.addColorStop(0, '#FFF');
            glow.addColorStop(0.3, '#FFD700');
            glow.addColorStop(0.6, '#FF4500');
            glow.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI*2); ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 69, 0, 0.5)';
            ctx.beginPath();
            ctx.moveTo(-5, 0); ctx.lineTo(-obj.vx*3, -obj.vy*3); ctx.lineTo(5, 0);
            ctx.fill();
        }
        else if (obj.type === 'bubble') {
            ctx.fillStyle = 'rgba(173, 216, 230, 0.4)'; 
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(-3, -4, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}