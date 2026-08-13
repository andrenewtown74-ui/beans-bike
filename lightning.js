// --- LIGHTNING CONFIG ---
const ALBY_LIGHTNING_ADDRESS = "feastnebular46104@getalby.com";
window.isPlayingForPot = false;

// 1. STATS BERECHNEN (Pott, Spenden, Auszahlungen)
async function updateLightningStats() {
    console.log("⚡ Starte Lightning-Stats Update...");
    if (typeof db === 'undefined') return;

    let totalGames = 0;
    let directDonations = 0;
    let totalPayouts = 0;

    // Pott-Spiele laden
    try {
        let potSnapshot = await db.collection("highscores").where("playedForPot", "==", true).get();
        totalGames = potSnapshot.size;
    } catch (e) { console.warn("Pott-Spiele nicht geladen", e); }

    // Spenden laden
    try {
        let donSnapshot = await db.collection("donations").get();
        donSnapshot.forEach(doc => {
            if (doc.data().amount) directDonations += doc.data().amount;
        });
    } catch (e) { console.warn("Spenden nicht geladen", e); }

    // Auszahlungen laden
    try {
        let payoutSnapshot = await db.collection("payouts").get();
        payoutSnapshot.forEach(doc => {
            if (doc.data().amount) totalPayouts += doc.data().amount;
        });
    } catch (e) { console.warn("Auszahlungen nicht geladen", e); }

    // Berechnen
    let devFromGames = totalGames * 11;
    let totalDev = devFromGames + directDonations;
    
    let currentPot = (totalGames * 10) - totalPayouts;
    if (currentPot < 0) currentPot = 0; 

    // Ins HTML schreiben
    let potEl = document.getElementById('pot-amount');
    let devEl = document.getElementById('dev-amount');
    if (potEl) potEl.innerText = currentPot;
    if (devEl) devEl.innerText = totalDev;
}

// 2. ZAHLUNGEN ABWICKELN (Desktop & Smartphone)
async function requestAndPayInvoice(amountSat, comment) {
    // Alby VORHER aktivieren (verhindert Browser-Blockaden)
    if (typeof window.webln !== 'undefined') {
        try { await window.webln.enable(); } catch(e) { console.error("WebLN Fehler:", e); }
    }

    const username = ALBY_LIGHTNING_ADDRESS.split('@')[0];
    const amountMsat = amountSat * 1000;
    const lnurlpUrl = `https://getalby.com/lnurlp/${username}/callback?amount=${amountMsat}&comment=${encodeURIComponent(comment)}`;

    try {
        const res = await fetch(lnurlpUrl);
        const data = await res.json();

        if (!data.pr) {
            alert("Fehler: Konnte keine Rechnung von der Node abrufen.");
            return false;
        }

        if (typeof window.webln !== 'undefined') {
            // Desktop: Über Alby Extension zahlen
            let payment = await window.webln.sendPayment(data.pr);
            return !!payment.preimage;
        } else {
            // Smartphone: Öffnet die Lightning-Wallet App (z.B. Alby Go)
            window.location.href = `lightning:${data.pr}`;
            return true; 
        }
    } catch (err) {
        console.error("Zahlungsfehler:", err);
        return false;
    }
}

// 3. EVENT LISTENER (Buttons)
document.addEventListener('DOMContentLoaded', () => {
    
    // Stats nach 1 Sekunde laden
    setTimeout(updateLightningStats, 1000);

    // Button: POTT
    const btnPlayPot = document.getElementById('btn-play-pot');
    if (btnPlayPot) {
        btnPlayPot.addEventListener('click', async (e) => {
            e.stopPropagation();
            
            let success = await requestAndPayInvoice(21, "Bohnen-Bike Pott");
            
            if (success) {
                window.isPlayingForPot = true;
                
                // JETZT erst die Adresse abfragen (Zahlung ist sicher durch!)
                let userLnAddress = prompt("Zahlung erhalten! ⚡\n\nBitte gib deine Lightning-Adresse ein, damit wir dich bei einem Gewinn auszahlen können:", "");
                
                if (typeof db !== 'undefined') {
                    try {
                        await db.collection("pot_contributors").add({
                            address: userLnAddress ? userLnAddress.trim() : "Anonym",
                            amount: 21,
                            timestamp: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    } catch (err) { console.error(err); }
                }
                
                let originalText = btnPlayPot.innerText;
                btnPlayPot.innerText = "Startet...";
                btnPlayPot.style.backgroundColor = "#0f0";
                
                setTimeout(() => {
                    btnPlayPot.innerText = originalText;
                    btnPlayPot.style.backgroundColor = "#f7931a";
                    if (typeof startNewGame === 'function') startNewGame();
                }, 1000);
            }
        });
    }

    // Button: SPENDEN
    const btnDonate = document.getElementById('btn-donate');
    if (btnDonate) {
        btnDonate.addEventListener('click', async (e) => {
            e.stopPropagation();
            
            let amount = prompt("Wie viele Sats möchtest du spenden?", "21");
            if (!amount || isNaN(amount) || amount <= 0) return;

            let amountInt = parseInt(amount);
            let success = await requestAndPayInvoice(amountInt, "Bohnen-Bike Spende");

            if (success) {
                alert("Vielen Dank für deine Spende! ☕");
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