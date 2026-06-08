function drawEnvironment(moveScale) {
    if (designData && designData.theme) ctx.fillStyle = designData.theme.skyColor;
    else ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (designData && designData.theme && designData.theme.sun && designData.theme.sun.active) {
        ctx.fillStyle = designData.theme.sun.color;
        ctx.fillRect(canvas.width - designData.theme.sun.xOffset, designData.theme.sun.y, designData.theme.sun.size, designData.theme.sun.size);
    }

    const drawOrder = ['star', 'planet', 'eiffel', 'mountain', 'tree', 'palm_tree', 'building'];
    let horizon = getHorizonY();

    drawOrder.forEach(function(type) {
        backgroundElements.filter(function(bg) { return bg.type === type; }).forEach(function(bg) {
            if (moveScale) bg.x -= gameSpeed * bg.speedModifier * moveScale;
            if (bg.x + bg.width < 0) bg.x = canvas.width;
            
            if (bg.type === 'star') {
                ctx.fillStyle = bg.color1;
                ctx.fillRect(bg.x, horizon - bg.height, bg.width, bg.width);
            } else if (bg.type === 'planet') {
                ctx.fillStyle = bg.color1 || '#1E90FF';
                ctx.beginPath(); ctx.arc(bg.x, horizon - bg.height, bg.width, 0, Math.PI * 2); ctx.fill();
                
                ctx.fillStyle = bg.color2 || '#32CD32';
                ctx.beginPath();
                ctx.ellipse(bg.x - bg.width * 0.2, horizon - bg.height - bg.width * 0.2, bg.width * 0.4, bg.width * 0.25, 0.5, 0, Math.PI * 2);
                ctx.ellipse(bg.x + bg.width * 0.3, horizon - bg.height + bg.width * 0.1, bg.width * 0.3, bg.width * 0.4, -0.2, 0, Math.PI * 2);
                ctx.ellipse(bg.x - bg.width * 0.1, horizon - bg.height + bg.width * 0.4, bg.width * 0.5, bg.width * 0.15, 0.1, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.beginPath();
                ctx.ellipse(bg.x + bg.width * 0.1, horizon - bg.height - bg.width * 0.4, bg.width * 0.6, bg.width * 0.1, 0, 0, Math.PI * 2);
                ctx.ellipse(bg.x - bg.width * 0.3, horizon - bg.height + bg.width * 0.1, bg.width * 0.4, bg.width * 0.08, 0.2, 0, Math.PI * 2);
                ctx.fill();
                
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
            } else if (bg.type === 'palm_tree') {
                ctx.fillStyle = bg.color1 || '#8B4513';
                ctx.beginPath();
                ctx.moveTo(bg.x + bg.width/2 - 4, canvas.height); 
                ctx.quadraticCurveTo(bg.x + bg.width/2 + 8, horizon - bg.height/2, bg.x + bg.width/2, horizon - bg.height);
                ctx.lineTo(bg.x + bg.width/2 + 6, horizon - bg.height);
                ctx.quadraticCurveTo(bg.x + bg.width/2 + 15, horizon - bg.height/2, bg.x + bg.width/2 + 4, canvas.height); 
                ctx.fill();

                ctx.fillStyle = bg.color2 || '#228B22';
                ctx.beginPath();
                ctx.ellipse(bg.x + bg.width/2 + 2, horizon - bg.height + 4, bg.width/1.3, bg.height/3.5, 0, 0, Math.PI*2);
                ctx.fill();
                
                ctx.fillStyle = '#5C4033';
                ctx.beginPath(); ctx.arc(bg.x + bg.width/2 - 4, horizon - bg.height + 12, 5, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(bg.x + bg.width/2 + 6, horizon - bg.height + 12, 5, 0, Math.PI*2); ctx.fill();
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
            } else if (bg.type === 'eiffel') {
                let tw = bg.width;
                let th = bg.height;
                let tx = bg.x;
                let ty = horizon + 5;

                ctx.fillStyle = bg.color1 || '#4a3c31';
                
                ctx.beginPath();
                ctx.moveTo(tx, ty);
                ctx.lineTo(tx + tw * 0.2, ty - th * 0.3);
                ctx.lineTo(tx + tw * 0.35, ty - th * 0.3);
                ctx.lineTo(tx + tw * 0.25, ty);
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(tx + tw, ty);
                ctx.lineTo(tx + tw * 0.8, ty - th * 0.3);
                ctx.lineTo(tx + tw * 0.65, ty - th * 0.3);
                ctx.lineTo(tx + tw * 0.75, ty);
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(tx + tw * 0.25, ty - th * 0.3);
                ctx.lineTo(tx + tw * 0.4, ty - th * 0.8);
                ctx.lineTo(tx + tw * 0.6, ty - th * 0.8);
                ctx.lineTo(tx + tw * 0.75, ty - th * 0.3);
                ctx.fill();
                
                ctx.beginPath();
                ctx.moveTo(tx + tw * 0.42, ty - th * 0.8);
                ctx.lineTo(tx + tw * 0.47, ty - th);
                ctx.lineTo(tx + tw * 0.53, ty - th);
                ctx.lineTo(tx + tw * 0.58, ty - th * 0.8);
                ctx.fill();

                ctx.fillStyle = bg.color2 || '#2a221c';
                ctx.fillRect(tx + tw * 0.15, ty - th * 0.3, tw * 0.7, th * 0.05);
                ctx.fillRect(tx + tw * 0.35, ty - th * 0.6, tw * 0.3, th * 0.04);

                ctx.fillStyle = designData.theme.skyColor || '#87CEEB';
                ctx.beginPath();
                ctx.arc(tx + tw * 0.5, ty, tw * 0.25, Math.PI, 0);
                ctx.fill();

                ctx.strokeStyle = bg.color2 || '#2a221c';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(tx + tw * 0.25, ty - th * 0.3); ctx.lineTo(tx + tw * 0.75, ty - th * 0.6);
                ctx.moveTo(tx + tw * 0.75, ty - th * 0.3); ctx.lineTo(tx + tw * 0.25, ty - th * 0.6);
                ctx.moveTo(tx + tw * 0.1, ty - th * 0.15); ctx.lineTo(tx + tw * 0.9, ty - th * 0.15); 
                ctx.stroke();
            }
        });
    });

    if (designData && designData.theme && designData.theme.cave) {
        ctx.fillStyle = designData.theme.groundColor;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        for (let x = 0; x <= canvas.width; x += 15) {
            let ceilY = 25 + Math.sin((worldDistance + x) * 0.04) * 15 + Math.cos((worldDistance + x) * 0.07) * 10;
            ctx.lineTo(x, ceilY);
        }
        ctx.lineTo(canvas.width, 0);
        ctx.fill();
    }

    ctx.fillStyle = designData && designData.theme ? designData.theme.groundColor : '#8B4513';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    
    for (let x = 0; x <= canvas.width; x += 5) {
        let isChasm = false;
        let isWater = false;
        let waterObs = null;
        for (let obs of obstacles) {
            if ((obs.type === 'chasm' || obs.type === 'lava' || obs.type === 'liana_bridge') && x >= obs.x && x <= obs.x + obs.width) isChasm = true;
            if (obs.type === 'water' && x >= obs.x && x <= obs.x + obs.width) { isWater = true; waterObs = obs; }
        }
        let ty;
        if (isChasm) {
            ty = canvas.height + 10;
        } else if (isWater) {
            let progress = (x - waterObs.x) / waterObs.width;
            ty = getTerrainY(worldDistance + x) + 5 + Math.sin(progress * Math.PI) * 60;
        } else {
            ty = getTerrainY(worldDistance + x) + 5;
        }
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
        let isWater = false;
        let waterObs = null;
        for (let obs of obstacles) {
            if ((obs.type === 'chasm' || obs.type === 'lava' || obs.type === 'liana_bridge') && x >= obs.x && x <= obs.x + obs.width) isChasm = true;
            if (obs.type === 'water' && x >= obs.x && x <= obs.x + obs.width) { isWater = true; waterObs = obs; }
        }
        if (!isChasm) {
            let ty;
            if (isWater) {
                let progress = (x - waterObs.x) / waterObs.width;
                ty = getTerrainY(worldDistance + x) + 5 + Math.sin(progress * Math.PI) * 60;
            } else {
                ty = getTerrainY(worldDistance + x) + 5;
            }
            if (!isDrawing) { ctx.moveTo(x, ty); isDrawing = true; }
            else { ctx.lineTo(x, ty); }
        } else {
            isDrawing = false;
        }
    }
    ctx.stroke();

    ctx.fillStyle = 'rgba(0, 150, 255, 0.6)';
    for (let obs of obstacles) {
        if (obs.type === 'water') {
            ctx.strokeStyle = '#2E8B57';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            for (let sw = 20; sw < obs.width; sw += 40) {
                let swX = obs.x + sw;
                let progress = sw / obs.width; 
                let floor = getTerrainY(worldDistance + swX) + 5 + Math.sin(progress * Math.PI) * 60; 
                let wave = Math.sin(performance.now() * 0.003 + swX) * 8; 
                ctx.beginPath();
                ctx.moveTo(swX, floor);
                ctx.quadraticCurveTo(swX + wave, floor - 20, swX - wave, floor - 40);
                ctx.stroke();
            }

            ctx.fillStyle = 'rgba(0, 150, 255, 0.6)';
            ctx.beginPath();
            let startY = getTerrainY(worldDistance + obs.x) + 5;
            ctx.moveTo(obs.x, startY);
            for(let j=0; j<=obs.width; j+=5) {
                let wX = obs.x + j;
                let wave = Math.sin(performance.now()*0.005 + j*0.05)*3;
                let baseLevel = getTerrainY(worldDistance + wX) + 5;
                ctx.lineTo(wX, baseLevel + wave);
            }
            for(let j=obs.width; j>=0; j-=5) {
                let wX = obs.x + j;
                let progress = j / obs.width;
                let floor = getTerrainY(worldDistance + wX) + 5 + Math.sin(progress * Math.PI) * 60;
                ctx.lineTo(wX, floor);
            }
            ctx.fill();
        }
    }

    if (finishLineActive) {
        if (moveScale) finishLineX -= gameSpeed * moveScale;
        let ty = getTerrainY(worldDistance + finishLineX);
        ctx.fillStyle = '#FFD700';
        for(let i=0; i<10; i++) {
            ctx.fillRect(finishLineX, ty + 5 - (i*10), 10, 10);
        }
    }
}

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
            
            if (p.type === 'smoke') {
                p.life -= 0.02 * timeScale;
                if (p.life <= 0) {
                    window.weatherParticles.splice(i, 1);
                    continue;
                }
                p.x += p.vx * timeScale;
                p.y += p.vy * timeScale;
                ctx.globalAlpha = Math.max(0, p.life * 0.6);
                ctx.fillStyle = '#666';
                ctx.beginPath();
                ctx.arc(p.x, p.y, 4 + (1 - p.life) * 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
                continue; 
            }
            
            p.x += p.vx * timeScale;
            p.y += p.vy * timeScale;
            
            let isOut = (p.type === 'ash' || p.type === 'smoke') ? (p.y < -20 || p.x < -20 || p.x > canvas.width + 20) : (p.y > canvas.height || p.x < -20);
            
            if (isOut) {
                if (isRaining && p.type !== 'smoke') {
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

function drawCrashBean() {
    if (beanCrash.isSplat) {
        ctx.fillStyle = '#FFF';
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
        
        ctx.fillStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000';
        ctx.beginPath();
        ctx.moveTo(-5, -6);
        ctx.lineTo(-11, -6);
        ctx.quadraticCurveTo(-14, -6, -14, -3);
        ctx.lineTo(-14, 6);
        ctx.quadraticCurveTo(-14, 9, -11, 9);
        ctx.lineTo(-4, 9);
        ctx.fill();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(-14, -1);
        ctx.lineTo(-5, 1);
        ctx.stroke();

        ctx.fillStyle = '#FFF'; 
        ctx.beginPath();
        ctx.moveTo(0, 9); 
        ctx.bezierCurveTo(8, 9, 9, 3, 4, 0); 
        ctx.bezierCurveTo(9, -4, 7, -15, 0, -15); 
        ctx.bezierCurveTo(-6, -15, -8, -6, -3, 0); 
        ctx.bezierCurveTo(-7, 2, -6, 9, 0, 9); 
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(4, 0); 
        ctx.quadraticCurveTo(0, 0, -2, 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-5, -4);
        ctx.quadraticCurveTo(-2, -4, 0, 0);
        ctx.stroke();

        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(3, -10, 1.2, 0, Math.PI*2); ctx.fill(); 
        ctx.beginPath(); ctx.arc(-1, -10, 1.2, 0, Math.PI*2); ctx.fill(); 
        
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 8); ctx.lineTo(5, 15);
        ctx.moveTo(-2, 8); ctx.lineTo(-8, 13);
        ctx.moveTo(-2, -2); ctx.lineTo(6, -8);
        ctx.stroke();
        
        ctx.restore();
    }
}

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

        if (!isGameRunning && window.hasInteracted) {
            let time = performance.now();
            beanOffsetY = Math.abs(Math.sin(time * 0.006)) * -12; 
            beanAngle = Math.sin(time * 0.003) * 0.15; 
            pedalAngle -= 0.05; 
        } else if (player.rearWheel.isJumping && !player.frontWheel.isJumping) {
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

        ctx.save();
        ctx.translate(seatX, seatY + beanOffsetY - 6);
        ctx.rotate(beanAngle);
        
        ctx.fillStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000';
        ctx.beginPath();
        ctx.moveTo(-5, -6);
        ctx.lineTo(-11, -6);
        ctx.quadraticCurveTo(-14, -6, -14, -3);
        ctx.lineTo(-14, 6);
        ctx.quadraticCurveTo(-14, 9, -11, 9);
        ctx.lineTo(-4, 9);
        ctx.fill();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(-14, -1);
        ctx.lineTo(-5, 1);
        ctx.stroke();

        ctx.fillStyle = '#FFF'; 
        ctx.beginPath();
        ctx.moveTo(0, 9); 
        ctx.bezierCurveTo(8, 9, 9, 3, 4, 0); 
        ctx.bezierCurveTo(9, -4, 7, -15, 0, -15); 
        ctx.bezierCurveTo(-6, -15, -8, -6, -3, 0); 
        ctx.bezierCurveTo(-7, 2, -6, 9, 0, 9); 
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(4, 0); 
        ctx.quadraticCurveTo(0, 0, -2, 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-5, -4);
        ctx.quadraticCurveTo(-2, -4, 0, 0);
        ctx.stroke();

        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(3, -10, 1.2, 0, Math.PI*2); ctx.fill(); 
        ctx.beginPath(); ctx.arc(-1, -10, 1.2, 0, Math.PI*2); ctx.fill(); 

        ctx.restore();

        drawLeg(px1, py1);
        ctx.beginPath(); ctx.moveTo(crankX, crankY); ctx.lineTo(px1, py1); ctx.stroke();

        const localShoulderX = 0;
        const localShoulderY = 0;
        const shoulderX = seatX + localShoulderX * Math.cos(beanAngle) - localShoulderY * Math.sin(beanAngle);
        const shoulderY = (seatY + beanOffsetY - 6) + localShoulderX * Math.sin(beanAngle) + localShoulderY * Math.cos(beanAngle);

        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        
        if (isLevelComplete && bikeStopped) {
            let wave = Math.sin(performance.now() / 100) * 15;
            ctx.quadraticCurveTo(0, -40 + wave, 10, -50 + wave);
        } else {
            ctx.bezierCurveTo(seatX + 10, seatY + 5, localX / 1.5, -25, localX, -20);
        }
        ctx.stroke();
    }
    ctx.restore();
}

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
        else if (obj.type === 'bird' || obj.type === 'pigeon') {
            ctx.fillStyle = obj.type === 'pigeon' ? '#A9A9A9' : '#8B5A2B';
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
        else if (obj.type === 'pelican') {
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath(); ctx.ellipse(0, 0, 14, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            
            ctx.fillStyle = '#FFA500';
            ctx.beginPath(); ctx.moveTo(10, -2); ctx.lineTo(30, 2); ctx.lineTo(10, 8); ctx.closePath(); ctx.fill();
            
            let wingY = Math.sin(performance.now() * 0.04) * 12;
            ctx.fillStyle = '#F0F0F0';
            ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(0, -wingY - 4); ctx.lineTo(6, 0); ctx.fill(); ctx.stroke();
        }
        else if (obj.type === 'shark') {
            let angle = Math.atan2(obj.vy, obj.vx);
            ctx.rotate(angle);
            
            ctx.fillStyle = '#778899';
            ctx.beginPath(); ctx.ellipse(0, 0, 20, 9, 0, 0, Math.PI*2); ctx.fill();
            
            ctx.beginPath(); ctx.moveTo(-5, -6); ctx.lineTo(-12, -18); ctx.lineTo(2, -6); ctx.fill();
            ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(-28, -10); ctx.lineTo(-24, 0); ctx.lineTo(-28, 10); ctx.fill();
            
            ctx.fillStyle = '#000'; ctx.fillRect(8, -4, 2, 2);
            ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.moveTo(10, 5); ctx.lineTo(20, 5); ctx.lineTo(15, 0); ctx.fill();
        }
        else if (obj.type === 'motorboat') {
            let scale = Math.max(0.1, 1000 / (Math.max(0, obj.z) + 200)); 
            ctx.scale(scale, scale);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath(); ctx.moveTo(-30, -5); ctx.lineTo(30, -5); ctx.lineTo(20, 5); ctx.lineTo(-20, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
            
            ctx.fillStyle = '#87CEEB';
            ctx.fillRect(-10, -15, 20, 10); ctx.strokeRect(-10, -15, 20, 10);
            
            ctx.fillStyle = '#FF4500';
            ctx.fillRect(-25, -2, 50, 2);
            
            if (obj.crashed && obj.speechTimer > 0) {
                ctx.fillStyle = '#FFF'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.rect(-20, -40, 40, 18); ctx.fill(); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(5, -15); ctx.lineTo(10, -22); ctx.fill(); ctx.stroke();
                ctx.fillStyle = '#000'; ctx.font = 'bold 12px Arial'; ctx.fillText('!#@*%', -16, -27);
            } else if (!obj.crashed) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.beginPath(); ctx.arc(-30, 5, Math.random()*5+2, 0, Math.PI*2); ctx.fill();
            }
        }
        else if (obj.type === 'pigeon_poop') {
            ctx.fillStyle = '#E8E8E8';
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fill();
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
        else if (obj.type === 'falling_rock') {
            ctx.fillStyle = '#444';
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, -10);
            ctx.lineTo(8, -4);
            ctx.lineTo(6, 6);
            ctx.lineTo(-4, 10);
            ctx.lineTo(-10, 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(-4, -2);
            ctx.lineTo(2, 4);
            ctx.stroke();
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
        else if (['car', 'snowcat', 'rover', 'jeep', 'borer', 'taxi', 'uber'].includes(obj.type)) {
            if (obj.type === 'car' || obj.type === 'taxi' || obj.type === 'uber') {
                ctx.fillStyle = obj.type === 'taxi' ? '#FFFFFF' : (obj.type === 'uber' ? '#111111' : (obj.color || '#B22222'));
                ctx.fillRect(0, -20, 50, 15); 
                ctx.fillRect(10, -30, 30, 10); 
                
                ctx.fillStyle = '#ADD8E6';
                ctx.fillRect(12, -28, 10, 8);
                ctx.fillRect(28, -28, 10, 8);

                ctx.fillStyle = '#111';
                ctx.beginPath(); ctx.arc(10, -5, 6, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(40, -5, 6, 0, Math.PI * 2); ctx.fill();
                
                if (obj.type === 'taxi') {
                    ctx.fillStyle = '#FFD700';
                    ctx.fillRect(20, -38, 10, 8);
                    ctx.fillStyle = '#000';
                    ctx.font = 'bold 8px Arial';
                    ctx.fillText('TAXI', 21, -31);
                    
                    ctx.fillStyle = '#000';
                    ctx.fillRect(5, -18, 5, 3);
                    ctx.fillRect(15, -18, 5, 3);
                    ctx.fillRect(40, -18, 5, 3);
                }
            } 
            else if (obj.type === 'snowcat') {
                ctx.fillStyle = '#A9A9A9';
                ctx.beginPath();
                ctx.moveTo(-5, -5); ctx.lineTo(55, -5); ctx.lineTo(60, 0); ctx.lineTo(55, 5); ctx.lineTo(-5, 5); ctx.closePath();
                ctx.fill(); ctx.stroke();
                
                ctx.fillStyle = '#FF4500';
                ctx.fillRect(5, -25, 45, 20);
                
                ctx.fillStyle = '#ADD8E6';
                ctx.fillRect(35, -20, 10, 10);
                
                ctx.fillStyle = '#FFD700';
                ctx.beginPath(); ctx.moveTo(60, -15); ctx.lineTo(70, 0); ctx.lineTo(60, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
            }
            else if (obj.type === 'rover') {
                ctx.fillStyle = '#E0E0E0';
                ctx.fillRect(0, -20, 55, 15);
                ctx.fillStyle = '#ADD8E6';
                ctx.beginPath(); ctx.arc(40, -20, 10, Math.PI, 0); ctx.fill();
                
                ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(15, -20); ctx.lineTo(15, -35); ctx.stroke();
                ctx.beginPath(); ctx.arc(15, -35, 5, 0, Math.PI, true); ctx.stroke();

                ctx.fillStyle = '#A9A9A9';
                ctx.beginPath(); ctx.arc(10, -5, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                ctx.beginPath(); ctx.arc(27, -5, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                ctx.beginPath(); ctx.arc(45, -5, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            }
            else if (obj.type === 'jeep') {
                ctx.fillStyle = '#556B2F';
                ctx.fillRect(0, -20, 55, 15); 
                ctx.fillRect(15, -35, 30, 15); 
                
                ctx.strokeStyle = '#222'; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.moveTo(15, -35); ctx.lineTo(45, -35); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(30, -35); ctx.lineTo(30, -20); ctx.stroke();

                ctx.fillStyle = '#111';
                ctx.beginPath(); ctx.arc(12, -5, 8, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(43, -5, 8, 0, Math.PI * 2); ctx.fill();
            }
            else if (obj.type === 'borer') {
                ctx.fillStyle = '#808080';
                ctx.fillRect(0, -35, 60, 30);
                
                ctx.fillStyle = '#A9A9A9';
                ctx.beginPath(); ctx.moveTo(60, -35); ctx.lineTo(85, -20); ctx.lineTo(60, -5); ctx.closePath(); ctx.fill();
                
                ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
                let offset = (worldDistance * 0.5) % 10;
                ctx.beginPath(); ctx.moveTo(60 + offset, -30 + offset/2); ctx.lineTo(60 + offset, -10 - offset/2); ctx.stroke();
                
                ctx.fillStyle = '#333';
                ctx.fillRect(10, -5, 40, 10);
            }

            if (obj.crashed) {
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(0, -15, 3, 6);
                
                if (obj.speechTimer > 0) {
                    ctx.fillStyle = '#FFF';
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.rect(10, -60, 40, 18);
                    ctx.fill();
                    ctx.stroke();
                    
                    ctx.beginPath();
                    ctx.moveTo(25, -42);
                    ctx.lineTo(30, -35);
                    ctx.lineTo(35, -42);
                    ctx.fill();
                    ctx.stroke();
                    
                    ctx.fillStyle = '#000';
                    ctx.font = 'bold 12px Arial';
                    ctx.fillText('!#@*%', 14, -47);
                }
            } else if (obj.type !== 'uber' && obj.type !== 'borer' && obj.type !== 'rover') {
                ctx.fillStyle = '#FFD700';
                let lightX = (obj.type === 'snowcat') ? 55 : (obj.type === 'jeep' ? 50 : 45);
                ctx.fillRect(lightX, -15, 5, 5);
                
                let grad = ctx.createLinearGradient(lightX + 5, -12, lightX + 55, -12);
                grad.addColorStop(0, 'rgba(255, 255, 200, 0.6)');
                grad.addColorStop(1, 'rgba(255, 255, 200, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.moveTo(lightX + 5, -15);
                ctx.lineTo(lightX + 55, -30);
                ctx.lineTo(lightX + 55, 5);
                ctx.closePath();
                ctx.fill();
            }
        }
        else if (obj.type === 'cyclist') {
            ctx.fillStyle = '#333';
            ctx.beginPath(); ctx.arc(-15, -5, 8, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(15, -5, 8, 0, Math.PI*2); ctx.fill();
            
            ctx.strokeStyle = '#B22222'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(-15, -5); ctx.lineTo(0, -5); ctx.lineTo(5, -20); ctx.lineTo(-10, -20); ctx.closePath(); ctx.stroke();
            
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(-5, -35, 5, 0, Math.PI*2); ctx.fill(); 
            ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(-5, -30); ctx.lineTo(-10, -20); ctx.stroke(); 
            ctx.beginPath(); ctx.moveTo(-10, -25); ctx.lineTo(0, -25); ctx.stroke(); 
            
            if (obj.crashed && obj.speechTimer > 0) {
                ctx.fillStyle = '#FFF';
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.rect(-20, -70, 40, 18); ctx.fill(); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, -52); ctx.lineTo(5, -45); ctx.lineTo(10, -52); ctx.fill(); ctx.stroke();
                ctx.fillStyle = '#000';
                ctx.font = 'bold 12px Arial';
                ctx.fillText('!#@*%', -16, -57);
            }
        }
        else if (obj.type === 'escooter') {
            ctx.fillStyle = '#111';
            ctx.beginPath(); ctx.arc(-10, -3, 4, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(10, -3, 4, 0, Math.PI*2); ctx.fill();
            
            ctx.strokeStyle = '#444'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(-12, -7); ctx.lineTo(12, -7); ctx.lineTo(10, -30); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(5, -30); ctx.lineTo(15, -30); ctx.stroke();
            
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(-2, -45, 5, 0, Math.PI*2); ctx.fill(); 
            ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(-2, -40); ctx.lineTo(-2, -15); ctx.stroke(); 
            ctx.beginPath(); ctx.moveTo(-2, -30); ctx.lineTo(8, -30); ctx.stroke(); 
            
            if (obj.crashed && obj.speechTimer > 0) {
                ctx.fillStyle = '#FFF';
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.rect(-20, -80, 40, 18); ctx.fill(); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, -62); ctx.lineTo(5, -55); ctx.lineTo(10, -62); ctx.fill(); ctx.stroke();
                ctx.fillStyle = '#000';
                ctx.font = 'bold 12px Arial';
                ctx.fillText('!#@*%', -16, -67);
            }
        }
        ctx.restore();
    }
}