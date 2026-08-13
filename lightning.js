// Konfiguration fuer Alby Lightning
const ALBY_LIGHTNING_ADDRESS = "feastnebular46104@getalby.com";
window.isPlayingForPot = false;

// Pott und Spenden aus der Firestore-Datenbank berechnen
async function updateLightningStats() {
    console.log("Starte Lightning-Stats Update...");
    if (typeof db === 'undefined') {
        console.error("Fehler: Datenbank (db) ist noch nicht bereit!");
        return;
    }

    let totalGames = 0;
    let directDonations = 0;

    try {
        let potSnapshot = await db.collection("highscores").where("playedForPot", "==", true).get();
        totalGames = potSnapshot.size;
    } catch (e) {
        console.error("Fehler beim Laden der Pott-Spiele:", e);
    }

    try {
        let donSnapshot = await db.collection("donations").get();
        donSnapshot.forEach(doc => {
            let data = doc.data();
            if (data.amount) {
                directDonations += data.amount;
            }
        });
    } catch (e) {
        console.error("Fehler beim Laden der Spenden:", e);
    }

    let currentPot = totalGames * 10;
    let devFromGames = totalGames * 11;
    let totalDev = devFromGames + directDonations;

    let potEl = document.getElementById('pot-amount');
    let devEl = document.getElementById('dev-amount');
    
    if (potEl) potEl.innerText = currentPot;
    if (devEl) devEl.innerText = totalDev;
}

// Hilfsfunktion zur Abwicklung von Zahlungen fuer Desktop (WebLN) und Smartphone (Deep Link)
async function requestAndPayInvoice(amountSat, comment) {
    const username = ALBY_LIGHTNING_ADDRESS.split('@')[0];
    const amountMsat = amountSat * 1000;
    const lnurlpUrl = `https://getalby.com/lnurlp/${username}/callback?amount=${amountMsat}&comment=${encodeURIComponent(comment)}`;

    const res = await fetch(lnurlpUrl);
    const data = await res.json();

    if (!data.pr) {
        alert("Fehler: Konnte keine Rechnung von der Node abrufen.");
        return false;
    }

    // Abfrage ob WebLN vorhanden ist (Desktop Browser mit Extension)
    if (typeof window.webln !== 'undefined') {
        try {
            await window.webln.enable();
            let payment = await window.webln.sendPayment(data.pr);
            return !!payment.preimage;
        } catch (err) {
            console.error("WebLN-Zahlung fehlgeschlagen oder abgebrochen:", err);
            return false;
        }
    } else {
        // Fallback fuer Smartphones ohne WebLN: Deep-Link Oeffnung fuer Alby Go / Mobile Wallet
        window.location.href = `lightning:${data.pr}`;
        return true;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    
    setTimeout(updateLightningStats, 1000);

// 1. Button: Um den Pott spielen (21 Sats)
    const btnPlayPot = document.getElementById('btn-play-pot');
    if (btnPlayPot) {
        btnPlayPot.addEventListener('click', async (e) => {
            e.stopPropagation();
            
            // NEU: Adresse VOR der Zahlung abfragen
            let userLnAddress = prompt("Bitte gib deine Lightning-Adresse ein, damit wir dich bei einem Gewinn auszahlen können:", "");
            if (userLnAddress === null) return; // Wenn der Spieler auf "Abbrechen" klickt

            let success = await requestAndPayInvoice(21, "Bohnen-Bike Pott");
            if (success) {
                window.isPlayingForPot = true;
                
                // NEU: Den Einzahler sofort in Firebase speichern!
                if (typeof db !== 'undefined') {
                    try {
                        await db.collection("pot_contributors").add({
                            address: userLnAddress.trim() || "Anonym",
                            amount: 21,
                            timestamp: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    } catch (err) {
                        console.error("Konnte Einzahler nicht speichern:", err);
                    }
                }
                
                let originalText = btnPlayPot.innerText;
                btnPlayPot.innerText = "Zahlung erfolgreich! Startet...";
                btnPlayPot.style.backgroundColor = "#0f0";
                
                setTimeout(() => {
                    btnPlayPot.innerText = originalText;
                    btnPlayPot.style.backgroundColor = "#f7931a";
                    if (typeof startNewGame === 'function') startNewGame();
                }, 1500);
            }
        });
    }

    // 2. Button: Spenden
    const btnDonate = document.getElementById('btn-donate');
    if (btnDonate) {
        btnDonate.addEventListener('click', async (e) => {
            e.stopPropagation();
            
            let amount = prompt("Wie viele Sats moechtest du spenden?", "21");
            if (!amount || isNaN(amount) || amount <= 0) return;

            let amountInt = parseInt(amount);
            let success = await requestAndPayInvoice(amountInt, "Bohnen-Bike Spende");

            if (success) {
                // Eintrag in Firebase vornehmen
                if (typeof db !== 'undefined') {
                    await db.collection("donations").add({
                        amount: amountInt,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
                updateLightningStats();
            }
        });
    }
});