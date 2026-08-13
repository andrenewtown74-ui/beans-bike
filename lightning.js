// --- LIGHTNING CONFIG ---
const ALBY_LIGHTNING_ADDRESS = "feastnebular46104@getalby.com";
window.isPlayingForPot = false;

// Pott und Spenden aus der Firestore-Datenbank berechnen
async function updateLightningStats() {
    console.log("⚡ Starte Lightning-Stats Update...");
    if (typeof db === 'undefined') {
        console.error("⚡ Fehler: Datenbank (db) ist noch nicht bereit!");
        return;
    }

    let totalGames = 0;
    let directDonations = 0;

    // 1. Hole alle Pott-Spiele
    try {
        console.log("⚡ Lade Pott-Spiele aus Firebase...");
        let potSnapshot = await db.collection("highscores").where("playedForPot", "==", true).get();
        totalGames = potSnapshot.size;
        console.log("⚡ " + totalGames + " Pott-Spiele gefunden.");
    } catch (e) {
        console.error("⚡ Fehler beim Laden der Pott-Spiele (Rechte?):", e);
    }

    // 2. Hole alle direkten Spenden
    try {
        console.log("⚡ Lade Spenden aus Firebase...");
        let donSnapshot = await db.collection("donations").get();
        console.log("⚡ " + donSnapshot.size + " Spenden-Einträge gefunden.");
        
        donSnapshot.forEach(doc => {
            let data = doc.data();
            console.log("⚡ Gefundene Spende:", data);
            if (data.amount) {
                directDonations += data.amount;
            }
        });
    } catch (e) {
        console.error("⚡ Fehler beim Laden der Spenden (Rechte?):", e);
    }

    // Berechnung
    let currentPot = totalGames * 10;
    let devFromGames = totalGames * 11;
    let totalDev = devFromGames + directDonations;

    console.log("⚡ Ergebnis Berechnung -> Pott:", currentPot, "Dev:", totalDev);

    // Ins HTML schreiben
    let potEl = document.getElementById('pot-amount');
    let devEl = document.getElementById('dev-amount');
    
    if (potEl) potEl.innerText = currentPot;
    if (devEl) devEl.innerText = totalDev;
}

// Warten, bis das HTML vollständig geladen ist
document.addEventListener('DOMContentLoaded', () => {
    
    // Direkt beim Start einmal abrufen (1 Sekunde Verzögerung, damit Firebase sicher bereit ist)
    setTimeout(updateLightningStats, 1000);

    // 1. Button: 21 Sats für den Pott zahlen
    const btnPlayPot = document.getElementById('btn-play-pot');
    if (btnPlayPot) {
        btnPlayPot.addEventListener('click', async (e) => {
            e.stopPropagation();
            
            if (typeof window.webln === 'undefined') {
                alert("Bitte installiere eine WebLN-Wallet wie die Alby Browser-Erweiterung, um um den Pott zu spielen!");
                return;
            }

            try {
                await window.webln.enable();
                
                const username = ALBY_LIGHTNING_ADDRESS.split('@')[0];
                const lnurlpUrl = `https://getalby.com/lnurlp/${username}/callback?amount=21000&comment=Bohnen-Bike%20Pott`;
                
                let res = await fetch(lnurlpUrl);
                let data = await res.json();
                
                if (data.pr) { 
                    let payment = await window.webln.sendPayment(data.pr);
                    if (payment.preimage) {
                        window.isPlayingForPot = true;
                        
                        // NUR den Button-Text ändern, um das HTML nicht zu zerstören!
                        let originalText = btnPlayPot.innerText;
                        btnPlayPot.innerText = "Zahlung erfolgreich! Startet...";
                        btnPlayPot.style.backgroundColor = "#0f0";
                        
                        setTimeout(() => {
                            btnPlayPot.innerText = originalText;
                            btnPlayPot.style.backgroundColor = "#f7931a";
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
            e.stopPropagation();
            
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
                        
                        // Spende in die Firebase Datenbank eintragen
                        if (typeof db !== 'undefined') {
                            await db.collection("donations").add({
                                amount: parseInt(amount),
                                timestamp: firebase.firestore.FieldValue.serverTimestamp()
                            });
                        }
                        
                        // Anzeige direkt danach aktualisieren
                        updateLightningStats();
                    }
                }
            } catch (err) {
                console.error("Spende fehlgeschlagen:", err);
            }
        });
    }
});