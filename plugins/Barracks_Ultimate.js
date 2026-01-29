const { isMainThread } = require('node:worker_threads')
const { botConfig } = require("../ggebot")
const name = "Barracks_Ultimate_EN"

const troopMapping = {
    "Mead Ranged (Att)": 206,
    "Mead Melee (Att)": 196,
    "Mead Ranged (Def)": 229,
    "Mead Melee (Def)": 218,
    "Relic Food Ranged (Att)": 650,
    "Relic Food Melee (Att)": 649,
    "Relic Food Ranged (Def)": 652,
    "Relic Food Melee (Def)": 651,
    "Horror Ranged (Att)": 443,
    "Horror Melee (Att)": 442,
    "Beri Aux Melee": 602,
    "Beri Aux Ranged": 603,
    "Spearman": 14
};
const troopSelection = Object.keys(troopMapping);

if (isMainThread)
    return module.exports = {
        name: name,
        description: "Advanced recruitment for each castle",
        pluginOptions: [
            { type: "Text", label: "Recruit Level (1-3)", key: "level", default: "3" },
            { type: "Checkbox", label: "Main Castle: Active?", key: "en_HB", default: true },
            { type: "Select", label: "Main Castle Troop", key: "tr_HB", selection: troopSelection, default: 0 },
            { type: "Checkbox", label: "Outpost 1: Active?", key: "en_AP1", default: false },
            { type: "Select", label: "Outpost 1 Troop", key: "tr_AP1", selection: troopSelection, default: 5 },
            { type: "Checkbox", label: "Outpost 2: Active?", key: "en_AP2", default: false },
            { type: "Select", label: "Outpost 2 Troop", key: "tr_AP2", selection: troopSelection, default: 5 },
            { type: "Checkbox", label: "Outpost 3: Active?", key: "en_AP3", default: false },
            { type: "Select", label: "Outpost 3 Troop", key: "tr_AP3", selection: troopSelection, default: 5 },
            { type: "Checkbox", label: "ICE: Active?", key: "en_Ice", default: false },
            { type: "Select", label: "Ice Troop", key: "tr_Ice", selection: troopSelection, default: 4 },
            { type: "Checkbox", label: "SAND: Active?", key: "en_Sand", default: false },
            { type: "Select", label: "Sand Troop", key: "tr_Sand", selection: troopSelection, default: 4 },
            { type: "Checkbox", label: "FIRE: Active?", key: "en_Fire", default: false },
            { type: "Select", label: "Fire Troop", key: "tr_Fire", selection: troopSelection, default: 4 },
            { type: "Checkbox", label: "BERIMOND: Active?", key: "en_Beri", default: false },
            { type: "Select", label: "Beri Troop", key: "tr_Beri", selection: troopSelection, default: 10 },
            { type: "Checkbox", label: "Randomize Timing", key: "randomizeTiming", default: true }
        ]
    };

const { KingdomID, getResourceCastleList, kingdomLock, ClientCommands, AreaType } = require("../protocols.js")
const pluginOptions = botConfig.plugins[require('path').basename(__filename).slice(0, -3)] ?? {}
const { sendXT, waitForResult, events } = require("../ggebot")
const { buildings, units } = require("../ids.js")

let list = []; let start = 160;
while(buildings[start]) {
    list.push(buildings[start].wodID);
    if(!buildings[start].upgradeWodID || start == buildings[start].upgradeWodID) break;
    start = buildings[start].upgradeWodID;
}
let listBeri = []; let startBeri = 627;
while(buildings[startBeri]) {
    listBeri.push(buildings[startBeri].wodID);
    if(!buildings[startBeri].upgradeWodID || startBeri == buildings[startBeri].upgradeWodID) break;
    startBeri = buildings[startBeri].upgradeWodID;
}

events.once("load", async () => {
    console.log(`[${name}] Plugin loaded and starting...`);
    let resourceCastleList = await getResourceCastleList()
    
    // Find Green APs
    let greenEmpire = resourceCastleList.castles.find(c => c.kingdomID == KingdomID.greatEmpire);
    let greenAPs = [];
    if (greenEmpire) {
        greenAPs = greenEmpire.areaInfo
            .filter(a => a.type === 1 && a.extraData[0] !== 1)
            .map(a => a.extraData[0])
            .sort((a, b) => a - b);
    }

    let recruitTroops = (KID, AID) => kingdomLock(async () => {
        let isEnabled = false; let selName = "";
        if (KID === KingdomID.greatEmpire) {
            if (AID === 1) { isEnabled = pluginOptions.en_HB; selName = troopSelection[pluginOptions.tr_HB]; }
            else {
                let idx = greenAPs.indexOf(AID);
                if (idx === 0) { isEnabled = pluginOptions.en_AP1; selName = troopSelection[pluginOptions.tr_AP1]; }
                else if (idx === 1) { isEnabled = pluginOptions.en_AP2; selName = troopSelection[pluginOptions.tr_AP2]; }
                else if (idx === 2) { isEnabled = pluginOptions.en_AP3; selName = troopSelection[pluginOptions.tr_AP3]; }
            }
        } else if (KID === KingdomID.everwinterGlacier) { isEnabled = pluginOptions.en_Ice; selName = troopSelection[pluginOptions.tr_Ice]; }
        else if (KID === KingdomID.burningSands) { isEnabled = pluginOptions.en_Sand; selName = troopSelection[pluginOptions.tr_Sand]; }
        else if (KID === KingdomID.firePeaks) { isEnabled = pluginOptions.en_Fire; selName = troopSelection[pluginOptions.tr_Fire]; }
        else if (KID === KingdomID.berimond) { isEnabled = pluginOptions.en_Beri; selName = troopSelection[pluginOptions.tr_Beri]; }

        if (!isEnabled || !selName) return 0;

        console.log(`[${name}] Checking Castle KID:${KID} AID:${AID} (${selName})...`);

        let baseID = troopMapping[selName];
        sendXT("jca", JSON.stringify({"CID":AID,"KID":KID}))
        let [obj] = await waitForResult("jaa", 1000 * 10, o => o.grc.KID == KID && o.grc.AID == AID)
        
        let bList = KID != KingdomID.berimond ? list : listBeri
        let bObj = obj.gca.BD.find(e => bList.includes(e[0])) 
        if(!bObj) {
            console.log(`[${name}] No barracks found in AID:${AID}`);
            return 0;
        }
        
        sendXT("spl", JSON.stringify({LID: KID != KingdomID.berimond ? 0 : 3}))
        let [obj2] = await waitForResult("spl", 1000 * 10) 

        let recruitedAny = false;
        for (let i = 0; i < obj2.QS.length; i++) {
            const slot = obj2.QS[i];
            
            // CORRECTED LOGIC: RUT !== 0 means it's ALREADY recruiting. We want RUT == 0 (free).
            if(slot.P || (slot.SI && slot.SI.RUT !== 0)) {
                continue; 
            }

            console.log(`[${name}] Found free slot ${i} in AID:${AID}. Starting recruitment...`);

            let tPath = []; let curr = baseID;
            while(units[curr]){
                tPath.push(units[curr].wodID);
                if(!units[curr].upgradeWodID || units[curr].upgradeWodID == curr) break;
                curr = units[curr].upgradeWodID;
            }
            if(baseID == 229) tPath.push(493);
            if(baseID == 218) tPath.push(489);

            let level = Number(pluginOptions.level) || 1;
            let targetID = tPath[Math.min(level - 1, tPath.length - 1)];
            
            let sSize = Number(buildings.find(e => e?.wodID == bObj[0])?.stackSize) || 5;
            let bItems = obj.gca.CI.find(e => e.OID == bObj[1]);
            if (bItems?.CIL.find(e => e.CID == 14)) sSize += 80; // Practice dummy bonus

            if(KID == KingdomID.berimond) {
                try {
                    const det = await ClientCommands.getDetailedCastleList()();
                    const beri = det.castles.find(c => c.kingdomID == KID);
                    if(beri) {
                        let inv = beri.unitInventory || [];
                        let curAux = inv.reduce((s, u) => units.find(x => x?.wodID == u.unitID)?.isAuxiliary ? s + Number(u.ammount) : s, 0);
                        sSize = Math.min(sSize, (beri.getProductionData?.maxAuxilariesTroops || 100) - curAux);
                    }
                } catch (e) {}
            }

            if(sSize <= 0) {
                console.log(`[${name}] Stack size 0 or limit reached in AID:${AID}`);
                continue;
            }

            sendXT("bup", JSON.stringify({
                "LID": KID != KingdomID.berimond ? 0 : 3,
                "WID": targetID,
                "AMT": sSize, 
                "PO": -1, "PWR": 0, "SK": 73,
                "SID": KID != KingdomID.berimond ? 2 : 10, "AID": AID
            }));
            await waitForResult("bup", 5000);
            console.log(`[${name}] Success: Recruited ${sSize} units in AID:${AID}`);
            recruitedAny = true;
        }

        if(KID != KingdomID.berimond) sendXT("ahr", JSON.stringify({ID:0,T:6}));
        sendXT("spl", JSON.stringify({LID: KID != KingdomID.berimond ? 0 : 3}))
        let [obj3] = await waitForResult("spl", 1000 * 10)
        
        let waitTime = (obj3.TCT > 0) ? (obj3.TCT * 1000) + 10000 : 60000;
        console.log(`[${name}] Castle AID:${AID} done. Next check in ${Math.round(waitTime/60000)} min.`);
        setTimeout(() => recruitTroops(KID,AID), waitTime);
    })

    // Start recursion for all castles
    for (const res of resourceCastleList.castles) {
        if(res.kingdomID == KingdomID.stormIslands) continue;
        for (const area of res.areaInfo) {
            if(area.type === 1 || area.type === AreaType.beriCastle) {
                if (pluginOptions.randomizeTiming) await new Promise(r => setTimeout(r, Math.random() * 5000));
                recruitTroops(res.kingdomID, area.extraData[0]);
            }
        }
    }
})
