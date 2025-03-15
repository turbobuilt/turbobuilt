import { readFile, writeFile } from "fs/promises";

async function main() {
    let dataJSON = await readFile("battery-prices.json", "utf-8");
    let data = JSON.parse(dataJSON);
    console.log(data)
    let csv = "";
    // add name column 
//   {
//     "group": "24F",
//     "totalGroup": "24F",
//     "tier": "Better",
//     "price": 109.76,
//     "cca": 600,
//     "query": "EverStart Plus Group Size 24F auto battery"
//   },
    for(let row of data) {
        row.name = `Group ${row.totalGroup || row.group} ${row.tier == 'Best' ? 'AGM' : 'Lead Acid'} 12 Volt ${row.cca} CCA Auto/Truck Battery`;
        row.price = row.price + 15 + 30;
        delete row.totalGroup;
        delete row.query;
    }
    let headers = new Set();
    for(let row of data) {
        for(let key in row) {
            headers.add(key);
        }
    }
    // sort by group
    data.sort((a: any, b: any) => a.group.localeCompare(b.group));

    csv += Array.from(headers).join(",") + "\n";
    for(let row of data) {
        let values = [] as any[];
        for(let header of headers) {
            let value = row[header as any] || "";
            if (typeof value === "string") {
                value = "\"" + value.replace(/"/g, "\"\"") + "\"";
            }
            values.push(value);
        }
        csv += values.join(",") + "\n";
    }
    await writeFile("battery-prices.csv", csv);
}

main();