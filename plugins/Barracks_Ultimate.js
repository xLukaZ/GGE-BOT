const { isMainThread } = require('node:worker_threads')
const { botConfig } = require("../ggebot")
const name = "Barracks_Ultimate_Pro"

const pluginOptions = isMainThread ? {} : (botConfig.plugins[require('path').basename(__filename).slice(0, -3)] ?? {});

if (isMainThread) {
    module.exports = {
        name: name,
        description: "Full Sync - Smart Reader & Multi-Troop",
        pluginOptions: [
            { 
                type: "Selection", 
                label: "Welche Truppen?", 
                key: "troopMode", 
                options: [
                    "Relikt-Kurzbogen (Fern)", 
                    "Relikt-Axt (Nah)", 
                    "Gemischt (Relikt)", 
                    "Armbrustschütze", 
                    "Met-Truppen (Off)", 
                    "Met-Truppen (Deff)"
                ], 
                default: "Relikt-Kurzbogen (Fern)" 
            },
            { type: "Checkbox", label: "HB aktiv?", key: "en_HB", default: true },
            { type: "Checkbox", label: "Eiswelt aktiv?", key: "en_Ice", default: true },
            { type: "Checkbox", label: "Sandwelt aktiv?", key: "en_Sand", default: true },
            { type: "Checkbox", label: "Feuerwelt aktiv?", key: "en_Fire", default: true },
            { type: "Checkbox", label: "Sturminseln aktiv?", key: "en_Storm", default: true },
            { type: "Checkbox", label: "Berimond aktiv?", key: "en_Beri", default: true },
            { type: "Text", label: "Warten (Min)", key: "globalWait", default: "10" }
        ]
    };
    return;
}

const { kingdomLock, getResourceCastleList } = require("../protocols.js")
const { sendXT, waitForResult, events } = require("../ggebot")

events.once("load", async () => {
    async function tour() {
        try {
            const resList = await getResourceCastleList();
            if (!resList?.castles) return setTimeout(tour, 10000);

            for (let castle of resList.castles) {
                const KID = castle.kingdomID;
                if (KID === 0 && !pluginOptions.en_HB) continue;
                if (KID === 2 && !pluginOptions.en_Ice) continue;
                if (KID === 1 && !pluginOptions.en_Sand) continue;
                if (KID === 3 && !pluginOptions.en_Fire) continue;
                if (KID === 4 && !pluginOptions.en_Storm) continue;
                if (KID === 10 && !pluginOptions.en_Beri) continue;

                const area = castle.areaInfo.find(a => a.type === 1 || a.areaID === 1);
                if (area) {
                    const AID = area.extraData?.[0] || area.areaID;
                    await runRecruitment(KID, AID);
                }
            }
        } catch (e) { console.error(`[${name}] Tour-Fehler:`, e.message); }
        setTimeout(tour, (Number(pluginOptions.globalWait) || 10) * 60000);
    }

    async function runRecruitment(KID, AID) {
        try {
            await kingdomLock(async () => {
                const labels = {0: "HB", 1: "Sand", 2: "Eis", 3: "Feuer", 4: "Sturm", 10: "Beri"};
                console.log(`[${name}] Prüfe ${labels[KID]} (AID: ${AID})...`);

                sendXT("jca", JSON.stringify({"CID": AID, "KID": KID}));
                let [jcaRes] = await waitForResult("jaa", 4000);
                
                // Wir schauen in UUL (UnitUserList), ULL und UQL (Queue) nach belegten Slots
                let units = jcaRes?.UUL || jcaRes?.ULL || jcaRes?.UQL || [];
                let occupiedSlots = Array.isArray(units) ? units.length : 0;
                let freeSlots = 5 - occupiedSlots;

                console.log(`[${name}] ${labels[KID]}: ${occupiedSlots} belegt, ${freeSlots} frei.`);

                if (freeSlots > 0) {
                    let targetSID = (KID === 0) ? 0 : (KID === 1 ? 1 : (KID === 10 ? 10 : 2));
                    let amount = (KID === 0) ? 110 : (KID === 10 ? 60 : 100); // HB: 110, Beri: 60
                    
                    // Truppen-Mapping
                    let troopID = 149; // Default Relikt-Fern
                    const mode = pluginOptions.troopMode;
                    if (mode === "Relikt-Axt (Nah)") troopID = (KID === 10) ? 13 : 148;
                    else if (mode === "Armbrustschütze") troopID = 12;
                    else if (mode === "Met-Truppen (Off)") troopID = 155;
                    else if (mode === "Met-Truppen (Deff)") troopID = 156;

                    for (let i = 0; i < freeSlots; i++) {
                        let currentWID = troopID;
                        if (mode === "Gemischt (Relikt)") {
                            currentWID = (i % 2 === 0) ? (KID === 10 ? 14 : 149) : (KID === 10 ? 13 : 148);
                        }

                        sendXT("bup", JSON.stringify({
                            "LID": (KID === 10 ? 3 : 0), "WID": currentWID, "AMT": amount,
                            "PO": -1, "PWR": 0, "SK": 73, "SID": targetSID, "AID": AID
                        }));
                        await waitForResult("bup", 3000);
                        await new Promise(r => setTimeout(r, 1200));
                    }
                }

                // Allianz-Hilfe mit Timeout-Schutz
                sendXT("ahr", JSON.stringify({"ID": 0, "T": 6})); //
                await new Promise(r => setTimeout(r, 1000));
            });
        } catch (err) { console.error(`[${name}] Fehler in KID ${KID}:`, err.message); }
    }
    setTimeout(tour, 5000);
});
