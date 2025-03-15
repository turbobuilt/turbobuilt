import { readFile, writeFile } from 'fs/promises';
import { parse } from 'node-html-parser';

let batteryGroups = ["24F", "35", "47", "48", "49", "65"];
let ourTiers = {
    "Value": "Standard",
    "Plus": "Better",
    "Platinum AGM": "Best"
}
let qualityTiers = Object.keys(ourTiers);

let searchUrl = "https://www.walmart.com/search?q="

async function main() {
    let current = [] as any[]
    let missing = [] as any[];
    try {
        current = JSON.parse(await readFile("battery-prices.json", "utf8"));
    } catch (e) {
        console.log("No current prices found");
        // process.exit();
    }
    try {
        missing = JSON.parse(await readFile("missing-batteries.json", "utf8"));
    } catch (e) {
        console.log("No missing batteries found");
        // process.exit();
    }
    // document.querySelector("[data-automation-id='product-title']")
    // <span data-automation-id=​"product-title" class=​"normal dark-gray mb0 mt1 lh-title f6 f5-l lh-copy">​EverStart Plus Lead Acid Automotive Battery, Group Size 24F 12 Volt, 600 CCA​</span>​
    let results = [] as any[];
    for (let group of batteryGroups) {
        for (let tier of qualityTiers) {
            let query = `EverStart ${tier} Group Size ${group} auto battery`;
            if (current.some(item => item.query === query)) {
                console.log("already have", group, tier);
                continue;
            }
            // if (query != 'EverStart Platinum AGM Group Size 48 auto battery')
            //     continue;
            console.log("query is", query);
            let response = await fetch(searchUrl + encodeURIComponent(query), {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                }
            });
            let text = await response.text();
            if (text.indexOf('Activate and hold the button to confirm that you’re human.') > -1) {
                console.log("got captcha");
                process.exit();
            }
            await writeFile("search-results.html", text);
            let doc = parse(text);
            let items = doc.querySelectorAll("[data-item-id]");
            let titleRegexp = new RegExp(`EverStart ${tier}.*Group.*${group} 12 Volt`);
            console.log("title regexp", titleRegexp);
            let item = items.find(item => item.querySelector("[data-automation-id='product-title']")?.innerText.match(titleRegexp));
            let tiles = items.map(item => item.querySelector("[data-automation-id='product-title']")?.innerText);
            console.log("tier", tier, "group", group);
            console.log(tiles)
            if (!item) {
                console.log("no item found for", group, tier);
                // process.exit();
                if (!missing.some(item => item.group === group && item.tier === tier && item.query === query))
                    missing.push({ group, tier, query });
                await writeFile("missing-batteries.json", JSON.stringify(missing, null, 2));
                continue;
            }
            let title = item?.querySelector("[data-automation-id='product-title']")?.innerText;
            if (!title?.includes("EverStart")) {
                console.log("no EverStart battery found for", group, tier);
                console.log("title", title);
                process.exit();
            } else if (!title?.match(new RegExp(`Group( Size)?.*${group} 12 Volt`))) {
                console.log("no Group( Size?) " + group + " battery found for", group, tier);
                process.exit();
            } else if (!title?.includes(`EverStart ${tier}`)) {
                console.log("no", tier, "battery found for", group, tier);
                process.exit();
            }
            let dollars = item?.querySelector("[data-automation-id='product-price'] .f2")?.innerText;
            let cents = item?.querySelector("[data-automation-id='product-price'] .f2")?.nextElementSibling?.innerText;
            let totalGroup = item?.querySelector("[data-automation-id='product-title']")?.innerText.match(/Group Size\s+(.+?)\s+12 Volt/)?.[1];
            if (!dollars || !cents) {
                console.log("no price found for", group, tier);
                console.log("Got", dollars, ".", cents);
                process.exit();
            }
            let price = parseFloat(dollars.trim() + "." + cents.trim());
            let cca = parseInt(title.match(/(\d+) CCA/)?.[1] || "0");
            if (!cca) {
                console.log("no CCA found for", group, tier);
                process.exit();
            }
            results.push({ group, totalGroup: totalGroup, tier: ourTiers[tier], price, cca, query });
            console.log(title, dollars, cents);
            console.log(results.at(-1));
            await writeFile("battery-prices.json", JSON.stringify(results, null, 2));
            // wait 10 seconds
            console.log("waiting 10 seconds...");
            await new Promise(resolve => setTimeout(resolve, 30000 + Math.random()*10000));
        }
    }
}

main();