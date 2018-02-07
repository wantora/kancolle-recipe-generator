"use strict";
const path = require("path");
const fs = require("fs");
const {MongoClient, ObjectID} = require("mongodb");

const secretaryTypes = ["砲戦系", "水雷系", "空母系"];
const materielTypes = ["鋼材(燃料)", "弾薬", "ボーキ"];

const itemsFile = path.join(__dirname, "..", "src", "data", "items.json");
const dataDir = path.join(__dirname, "data");

const config = JSON.parse(fs.readFileSync(path.join(dataDir, "config.json"), "utf8"));
const slotitems = JSON.parse(fs.readFileSync(path.join(dataDir, "slotitems.json"), "utf8"));
const slotitemResults = JSON.parse(fs.readFileSync(path.join(dataDir, "slotitem-results.json"), "utf8"));
const ships = JSON.parse(fs.readFileSync(path.join(dataDir, "ships.json"), "utf8"));

function getMaterielType(items) {
  if (items[3] > Math.max(items[0], items[1], items[2])) {
    return "ボーキ";
  } else if (items[1] >= items[3] && items[1] > Math.max(items[0], items[2])) {
    return "弾薬";
  } else {
    return "鋼材(燃料)";
  }
}

function matchRecipe(items, recipe) {
  return items[0] >= recipe[0] &&
    items[1] >= recipe[1] &&
    items[2] >= recipe[2] &&
    items[3] >= recipe[3];
}

function aggregateDocument(db) {
  const lastUpdateDate = (() => {
    const args = config.lastUpdateDate.concat();
    args[1] -= 1;
    return Date.UTC(...args);
  })();
  
  return db.collection("createitemrecords").aggregate([
    {$match: {
      "secretary": {"$ne": 0},
      "items.0": {"$ne": null},
      "_id": {$gte: ObjectID.createFromTime(Math.round(lastUpdateDate / 1000))},
      "teitokuLv": {$gte: config.minTeitokuLv},
    }},
    {$group: {
      _id: {
        items: "$items",
        itemId: {$cond: {if: "$successful", then: "$itemId", else: -1}},
        secretary: "$secretary",
      },
      count: {$sum: 1},
    }},
  ], {allowDiskUse: true});
}

async function generateItems(db) {
  const resultItems = slotitems.map((slotitem) => {
    const results = [];
    const countTable = {};
    
    for (const secretaryType of secretaryTypes) {
      countTable[secretaryType] = {};
      
      for (const materielType of materielTypes) {
        const count = [0, 0];
        
        results.push({
          type: [secretaryType, materielType],
          result: slotitemResults[slotitem.name][secretaryType][materielType],
          count: count,
        });
        countTable[secretaryType][materielType] = count;
      }
    }
    
    return {
      id: slotitem.id,
      recipe: slotitem.recipe,
      countTable: countTable,
      data: {
        name: slotitem.name,
        category: slotitem.category,
        recipe: slotitem.recipe,
        results: results,
      },
    };
  });
  
  const slotitemRo43 = slotitems.find((slotitem) => slotitem.id === 163);
  const slotitem96Rikukou = slotitems.find((slotitem) => slotitem.id === 168);
  const italianShipIds = new Set(Object.values(ships)
    .filter((ship) => config.italianShips.includes(ship.name))
    .map((ship) => ship.id));
  
  const cursor = aggregateDocument(db);
  while (await cursor.hasNext()) {
    const {_id: {items, itemId, secretary}, count} = await cursor.next();
    const secretaryType = ships[secretary].secretaryType;
    const materielType = getMaterielType(items);
    const secretaryIsItalian = italianShipIds.has(secretary);
    
    for (const {id, recipe, countTable} of resultItems) {
      if (matchRecipe(items, recipe)) {
        // Ro.43水偵
        if (id === slotitemRo43.id) {
          if (!secretaryIsItalian) { continue; }
        } else {
          if (secretaryIsItalian) { continue; }
        }
        
        // 九六式陸攻以外の場合、九六式陸攻が開発可能なレシピを除外
        if (
          id !== slotitem96Rikukou.id &&
          (
            (secretaryType === "空母系" && materielType === "弾薬") ||
            (secretaryType === "空母系" && materielType === "ボーキ")
          ) &&
          matchRecipe(items, slotitem96Rikukou.recipe)
        ) { continue; }
        
        const resultCount = countTable[secretaryType][materielType];
        if (itemId === id) {
          resultCount[0] += count;
        }
        resultCount[1] += count;
      }
    }
  }
  
  return resultItems.map(({data}) => data);
}

MongoClient.connect("mongodb://localhost:27018").then(async (client) => {
  try {
    const db = client.db("poi-production");
    const items = await generateItems(db);
    fs.writeFileSync(itemsFile, JSON.stringify(items, null, 2), "utf8");
  } finally {
    client.close();
  }
}).catch((err) => {
  console.error(err); // eslint-disable-line no-console
});
