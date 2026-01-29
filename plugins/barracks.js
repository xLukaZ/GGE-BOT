const { isMainThread } = require('node:worker_threads')
const { botConfig } = require("../ggebot")
const name = "Barracks"

const pluginOptions = isMainThread ? {} : (botConfig.plugins[require('path').basename(__filename).slice(0, -3)] ?? {});

const troopOptions = ["Relic-Ranged", "Relic-Melee", "Relic-Mix", "Crossbow", "Mead-Off-Mix", "Mead-Deff"];

if (isMainThread) {
    module.exports = {
        name: name,
        description: "English Version - Custom Amounts & Fixed UI",
        pluginOptions: [
            { type: "HorizontalRule" },
            { type: "Checkbox", label: "[ MAIN CASTLE ] ACTIVE", key: "en_HB", default: true },
            { type: "Selection", label: "HB: TROOP TYPE", key: "mode_HB", options: troopOptions, default: "Relic-Ranged" },
            { type: "Text", label: "HB: AMOUNT PER SLOT", key: "amt_HB", default: "110" },
            
            { type: "HorizontalRule" },
            { type: "Checkbox", label: "[ OUTPOST 1 ] ACTIVE", key: "en_AP1", default: false },
            { type: "Text", label: "AP 1: COORDINATES", key: "co_AP1", default: "802,824" },
            { type: "Selection", label: "AP 1: TROOP TYPE", key: "mode_AP1", options: troopOptions, default: "Relic-Ranged" },
            { type: "Text", label: "AP 1: AMOUNT PER SLOT", key: "amt_AP1", default: "100" },

            { type: "HorizontalRule" },
            { type: "Checkbox", label: "[ OUTPOST 2 ] ACTIVE", key: "en_AP2", default: false },
            { type: "Text", label: "AP 2: COORDINATES", key: "co_AP2", default: "796,833" },
            { type: "Selection", label: "AP 2: TROOP TYPE", key: "mode_AP2", options: troopOptions, default: "Relic-Ranged" },
            { type: "Text", label: "AP 2: AMOUNT PER SLOT", key: "amt_AP2", default: "100" },

            { type: "HorizontalRule" },
            { type: "Checkbox", label: "[ OUTPOST 3 ] ACTIVE", key: "en_AP3", default: false },
            { type: "Text", label: "AP 3: COORDINATES", key: "co_AP3", default: "813,820" },
            { type: "Selection", label: "AP 3: TROOP TYPE", key: "mode_AP3", options: troopOptions, default: "Relic-Ranged" },
            { type: "Text", label: "AP 3: AMOUNT PER SLOT", key: "amt_AP3", default: "100" },

            { type: "HorizontalRule" },
            { type: "Checkbox", label: "[ SAND ] ACTIVE", key: "en_Sand", default: true },
            { type: "Selection", label: "SAND: TROOP TYPE", key: "mode_Sand", options: troopOptions, default: "Relic-Ranged" },
            { type: "Text", label: "SAND: AMOUNT PER SLOT", key: "amt_Sand", default: "100" },

            { type: "HorizontalRule" },
            { type: "Checkbox", label: "[ ICE ] ACTIVE", key: "en_Ice", default: true },
            { type: "Selection", label: "ICE: TROOP TYPE", key: "mode_Ice", options: troopOptions, default: "Relic-Ranged" },
            { type: "Text", label: "ICE: AMOUNT PER SLOT", key: "amt_Ice", default: "100" },

            { type: "HorizontalRule" },
            { type: "Checkbox", label: "[ FIRE ] ACTIVE", key: "en_Fire", default: true },
            { type: "Selection", label: "FIRE: TROOP TYPE", key: "mode_Fire", options: troopOptions, default: "Relic-Ranged" },
            { type: "Text", label: "FIRE: AMOUNT PER SLOT", key: "amt_Fire", default: "100" },

            { type: "HorizontalRule" },
            { type: "Checkbox", label: "[ STORM ] ACTIVE", key: "en_Storm", default: true },
            { type: "Text", label: "STORM: COORDINATES", key: "co_Storm", default: "568,575" },
            { type: "Selection", label: "STORM: TROOP TYPE", key: "mode_Storm", options: troopOptions, default: "Crossbow" },
            { type: "Text", label: "STORM: AMOUNT PER SLOT", key: "amt_Storm", default: "80" },

            { type: "HorizontalRule" },
            { type: "Checkbox", label: "[ BERIMOND ] ACTIVE", key: "en_Beri", default: true },
            { type: "Text", label: "BERI: COORDINATES", key: "co_Beri", default: "1281,122" },
            { type: "Selection", label: "BERI: TROOP TYPE", key: "mode_Beri", options: troopOptions, default: "Relic-Mix" },
            { type: "Text", label: "BERI: AMOUNT PER SLOT", key: "amt_Beri", default: "60" },

            { type: "HorizontalRule" },
            { type: "Text", label: "WAIT TIME (MINUTES)", key: "globalWait", default: "60" }
        ]
    };
    return;
}

const { kingdomLock } = require("../protocols.js")
const { sendXT, waitForResult, events } = require("../ggebot")

events.once("load", async () => {
    async function tour() {
        const targets = [
            { n: "HB", en: pluginOptions.en_HB, m: pluginOptions.mode_HB, amt: pluginOptions.amt_HB, t: "jca", k: 0, c: 21505 },
            { n: "AP 1", en: pluginOptions.en_AP1, m: pluginOptions.mode_AP1, amt: pluginOptions.amt_AP1, t: "jaa", k: 0, co: pluginOptions.co_AP1 },
            { n: "AP 2", en: pluginOptions.en_AP2, m: pluginOptions.mode_AP2, amt: pluginOptions.amt_AP2, t: "jaa", k: 0, co: pluginOptions.co_AP2 },
            { n: "AP 3", en: pluginOptions.en_AP3, m: pluginOptions.mode_AP3, amt: pluginOptions.amt_AP3, t: "jaa", k: 0, co: pluginOptions.co_AP3 },
            { n: "Sand", en: pluginOptions.en_Sand, m: pluginOptions.mode_Sand, amt: pluginOptions.amt_Sand, t: "jca", k: 1, c: 38565 }, 
            { n: "Ice", en: pluginOptions.en_Ice, m: pluginOptions.mode_Ice, amt: pluginOptions.amt_Ice, t: "jca", k: 2, c: 27959 },
            { n: "Fire", en: pluginOptions.en_Fire, m: pluginOptions.mode_Fire, amt: pluginOptions.amt_Fire, t: "jca", k: 3, c: 42905 },
            { n: "Storm", en: pluginOptions.en_Storm, m: pluginOptions.mode_Storm, amt: pluginOptions.amt_Storm, t: "jaa", k: 4, co: pluginOptions.co_Storm, aid: 2219 },
            { n: "Beri", en: pluginOptions.en_Beri, m: pluginOptions.mode_Beri, amt: pluginOptions.amt_Beri, t: "jaa", k: 10, co: pluginOptions.co_Beri, aid: 324 }
        ];

        for (const target of targets) {
            if (!target.en) continue;

            try {
                await kingdomLock(async () => {
                    if (target.t === "jca") {
                        sendXT("jca", JSON.stringify({ "CID": target.c, "KID": target.k }));
                    } else {
                        const coords = target.co.split(/[,:]/);
                        sendXT("jaa", JSON.stringify({ "PX": Number(coords[0]), "PY": Number(coords[1]), "KID": target.k }));
                    }
                    await waitForResult("jaa", 5000).catch(() => {});

                    let aid = target.aid || (target.t === "jca" ? target.c : 0);
                    const sid = target.k;
                    const finalAmount = Number(target.amt) || 100;

                    for (let i = 1; i <= 5; i++) {
                        let wid = 149;
                        let label = "";

                        switch(target.m) {
                            case "Relic-Ranged": wid = (target.k === 10 ? 14 : 149); label = "Relic-Ranged"; break;
                            case "Relic-Melee": wid = (target.k === 10 ? 13 : 148); label = "Relic-Melee"; break;
                            case "Relic-Mix": 
                                wid = (i % 2 === 0 ? (target.k === 10 ? 13 : 148) : (target.k === 10 ? 14 : 149)); 
                                label = "Relic-Mix"; break;
                            case "Crossbow": wid = (target.k === 4 ? 607 : 12); label = "Crossbow"; break;
                            case "Mead-Off-Mix": wid = (i % 2 === 0 ? 215 : 216); label = "Mead-Off"; break;
                            case "Mead-Deff": wid = 156; label = "Mead-Deff"; break;
                        }

                        sendXT("bup", JSON.stringify({
                            "LID": (target.k === 10 ? 3 : 0), 
                            "WID": wid, "AMT": finalAmount, "PO": -1, "PWR": 0, "SK": 73, "SID": sid, "AID": aid
                        }));
                        
                        let [res, r] = await waitForResult("bup", 3000).catch(() => [null, -1]);
                        
                        if (r === 0) {
                            console.log(`[${target.n}] Recruited: ${finalAmount}x ${label} in Slot ${i}`);
                        } else if (r === 21 || r === 63 || r === 51) { 
                            // Stop if full or too many units
                            break; 
                        }
                        await new Promise(r => setTimeout(r, 1200));
                    }

                    if (target.k !== 10 && target.k !== 4) {
                        sendXT("ahr", JSON.stringify({ "ID": 0, "T": 6 }));
                    }
                });
            } catch (err) {}
            await new Promise(r => setTimeout(r, 2000));
        }

        const waitMin = (Number(pluginOptions.globalWait) || 60);
        console.log(`[SYSTEM] Finished recruitment in all castles. Sleeping for ${waitMin} minutes.`);

        setTimeout(tour, waitMin * 60000);
    }
    setTimeout(tour, 5000);
});
