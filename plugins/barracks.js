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
        description: "Advanced recruitment per castle and outpost",
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

const { KingdomID, getResourceCastleList, kingdomLock, ClientCommands, AreaType } = require("../../protocols.js")
const pluginOptions = botConfig.plugins[require('path').basename(__filename).slice(0, -3)] ?? {}
const { sendXT, waitForResult, events } = require("../../ggebot")
const { buildings, units } = require("../../ids.js")

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
    let resourceCastleList = await getResourceCastleList()
    let greenAPs = resourceCastleList.castles
        .find(c => c.kingdomID == KingdomID.greatEmpire)
        .areaInfo.filter(a => a.type === 1 && a.extraData[0] !== 1)
        .map(a => a.extraData[0])
        .sort((a, b) => a - b);

    let recruitTroops = (KID, AID) => kingdomLock(async () => {
        let isEnabled = false;
        let selectedTroopName = "";

        if (KID === KingdomID.greatEmpire) {
            if (AID === 1) {
                isEnabled = pluginOptions.en_HB;
                selectedTroopName = troopSelection[pluginOptions.tr_HB];
            } else {
                let apIndex = greenAPs.indexOf(AID);
                if (apIndex === 0) { isEnabled = pluginOptions.en_AP1; selectedTroopName = troopSelection[pluginOptions.tr_AP1]; }
                if (apIndex === 1) { isEnabled = pluginOptions.en_AP2; selectedTroopName = troopSelection[pluginOptions.tr_AP2]; }
                if (apIndex === 2) { isEnabled = pluginOptions.en_AP3; selectedTroopName = troopSelection[pluginOptions.tr_AP3]; }
            }
        } else if (KID === KingdomID.everwinterGlacier) {
            isEnabled = pluginOptions.en_Ice; selectedTroopName = troopSelection[pluginOptions.tr_Ice];
        } else if (KID === KingdomID.burningSands) {
            isEnabled = pluginOptions.en_Sand; selectedTroopName = troopSelection[pluginOptions.tr_Sand];
        } else if (KID === KingdomID.firePeaks) {
            isEnabled = pluginOptions.en_Fire; selectedTroopName = troopSelection[pluginOptions.tr_Fire];
        } else if (KID === KingdomID.berimond) {
            isEnabled = pluginOptions.en_Beri; selectedTroopName = troopSelection[pluginOptions.tr_Beri];
        }

        if (!isEnabled || !selectedTroopName) return 0;

        let baseTroopID = troopMapping[selectedTroopName];
        sendXT("jca", JSON.stringify({"CID":AID,"KID":KID}))
        let [obj] = await waitForResult("jaa", 1000 * 10, o => o.grc.KID == KID && o.grc.AID == AID)
        let buildingList = KID != KingdomID.berimond ? list : listBeri
        let buildingObject = obj.gca.BD.find(e => buildingList.includes(e[0])) 
        if(!buildingObject) return 0
        
        sendXT("spl", JSON.stringify({LID: KID != KingdomID.berimond ? 0 : 3}))
        let [obj2] = await waitForResult("spl", 1000 * 10) 

        for (let i = 0; i < obj2.QS.length; i++) {
            const slot = obj2.QS[i];
            if(slot.P || slot.SI.RUT == 0) continue

            let troopPath = []; let curr = baseTroopID;
            while(units[curr]){
                troopPath.push(units[curr].wodID);
                if(!units[curr].upgradeWodID || units[curr].upgradeWodID == curr) break;
                curr = units[curr].upgradeWodID;
            }
            if(baseTroopID == 229) troopPath.push(493);
            if(baseTroopID == 218) troopPath.push(489);

            let targetTroopID = troopPath[Math.min(Number(pluginOptions.level || 1) - 1, troopPath.length - 1)];
            let stackSize = Number(buildings.find(e => e?.wodID == buildingObject[0])?.stackSize) || 5;
            let builditems = obj.gca.CI.find(e => e.OID == buildingObject[1]);
            if (builditems?.CIL.find(e => e.CID == 14)) stackSize += 80;

            if(KID == KingdomID.berimond) {
                const detailedCastles = await ClientCommands.getDetailedCastleList()();
                const beri = detailedCastles.castles.find(c => c.kingdomID == KID);
                if(beri) {
                    let cur = beri.unitInventory.reduce((s, u) => units.find(x => x?.wodID==u.unitID)?.isAuxiliary ? s + Number(u.ammount) : s, 0);
                    stackSize = Math.min(stackSize, beri.getProductionData.maxAuxilariesTroops - cur);
                }
            }

            if(stackSize <= 0) continue;

            sendXT("bup", JSON.stringify({
                "LID": KID != KingdomID.berimond ? 0 : 3,
                "WID": targetTroopID,
                "AMT": stackSize, 
                "PO": -1, "PWR": 0, "SK": 73,
                "SID": KID != KingdomID.berimond ? 2 : 10, "AID": AID
            }));
            await waitForResult("bup", 4000);
        }
        
        if(KID != KingdomID.berimond) sendXT("ahr", JSON.stringify({ID:0,T:6}));
        sendXT("spl", JSON.stringify({LID: KID != KingdomID.berimond ? 0 : 3}));
        let [obj3] = await waitForResult("spl", 1000 * 10);
        setTimeout(() => recruitTroops(KID,AID), (obj3.TCT * 1000) + 5000);
    })

    for (const resCastle of resourceCastleList.castles) {
        if(resCastle.kingdomID == KingdomID.stormIslands) continue;
        for (const area of resCastle.areaInfo) {
            if(area.type === 1 || area.type === AreaType.beriCastle) {
                if (pluginOptions.randomizeTiming) await new Promise(r => setTimeout(r, Math.random() * 5000));
                recruitTroops(resCastle.kingdomID, area.extraData[0]);
            }
        }
    }
})
