// --- LIGHTNING CONFIG ---
const ALBY_LIGHTNING_ADDRESS = "feastnebular46104@getalby.com";
window.isPlayingForPot = false;

// Pott aus der Firestore-Datenbank berechnen
function updateLightningStats() {
    if (typeof db !== 'undefined') {
        db.collection("highscores").where("playedForPot", "==", true).get()
        .then(snapshot => {
            let totalGames = snapshot.size;
            let currentPot = totalGames * 10;
            let currentDev = totalGames * 11;
            
            let potEl = document.getElementById('pot-amount');
            let devEl = document.getElementById('dev-amount');
            if (potEl) potEl.innerText = currentPot;
            if (devEl) devEl.innerText = currentDev;
        })
        .catch(err => {
            console.error("Fehler beim Laden des Potts:", err);
            let potEl = document.getElementById('pot-amount');
            let devEl = document.getElementById('dev-amount');
            if (potEl) potEl.innerText = "0";
            if (devEl) devEl.innerText = "0";
        });
    }
}

// Warten, bis das HTML vollständig geladen ist
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Button: 21 Sats für den Pott zahlen
    const btnPlayPot = document.getElementById('btn-play-pot');
    if (btnPlayPot) {
        btnPlayPot.addEventListener('click', async (e) => {
            e.stopPropagation(); // WICHTIG: Verhindert, dass das Spiel den Klick abfängt!
            
            if (typeof window.webln === 'undefined') {
                alert("Bitte installiere eine WebLN-Wallet wie die Alby Browser-Erweiterung, um um den Pott zu spielen!");
                return;
            }

            try {
                await window.webln.enable();
                
                // LNURLp Aufruf, um eine Invoice über 21 Sats (21000 Milli-Sats) zu generieren
                const username = ALBY_LIGHTNING_ADDRESS.split('@')[0];
                const lnurlpUrl = `https://getalby.com/lnurlp/${username}/callback?amount=21000&comment=Bohnen-Bike%20Pott`;
                
                let res = await fetch(lnurlpUrl);
                let data = await res.json();
                
                if (data.pr) { 
                    let payment = await window.webln.sendPayment(data.pr);
                    if (payment.preimage) {
                        window.isPlayingForPot = true;
                        document.getElementById('lightning-stats').innerHTML = "<h3 style='color:#0f0; text-align:center; margin:0;'>Zahlung erfolgreich! Viel Glück!</h3>";
                        
                        // Nach 1.5 Sekunden das Spiel starten
                        setTimeout(() => {
                            if (typeof startNewGame === 'function') startNewGame();
                        }, 1500);
                    }
                } else {
                    alert("Fehler: Konnte keine Rechnung von der Node abrufen.");
                }
            } catch (err) {
                console.error("Zahlung fehlgeschlagen:", err);
            }
        });
    }

    // 2. Button: Spenden
    const btnDonate = document.getElementById('btn-donate');
    if (btnDonate) {
        btnDonate.addEventListener('click', async (e) => {
            e.stopPropagation(); // WICHTIG!
            
            if (typeof window.webln === 'undefined') {
                alert("Bitte installiere eine WebLN-Wallet wie Alby zum Spenden!");
                return;
            }
            
            let amount = prompt("Wie viele Sats möchtest du spenden?", "21");
            if (!amount || isNaN(amount) || amount <= 0) return;

            try {
                await window.webln.enable();
                const username = ALBY_LIGHTNING_ADDRESS.split('@')[0];
                const amountMsat = parseInt(amount) * 1000;
                const lnurlpUrl = `https://getalby.com/lnurlp/${username}/callback?amount=${amountMsat}&comment=Bohnen-Bike%20Spende`;
                
                let res = await fetch(lnurlpUrl);
                let data = await res.json();
                
                if (data.pr) {
                    let payment = await window.webln.sendPayment(data.pr);
                    if (payment.preimage) {
                        alert("Vielen Dank für deine Spende! ☕");
                    }
                }
            } catch (err) {
                console.error("Spende fehlgeschlagen:", err);
            }
        });
    }
});