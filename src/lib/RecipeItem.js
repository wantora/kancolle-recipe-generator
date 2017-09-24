import flatten from "lodash/flatten";
import Result from "./Result";

export const SECRETARY_TYPES = ["砲戦系", "水雷系", "空母系"];
export const MATERIEL_TYPES = ["鋼材(燃料)", "弾薬", "ボーキ"];

export const TYPES = flatten(SECRETARY_TYPES.map((secretaryType) => {
  return MATERIEL_TYPES.map((materielType) => {
    return [secretaryType, materielType];
  });
}));

export const TYPENAME_TABLE = {
  "砲戦系": "b",
  "水雷系": "t",
  "空母系": "a",
};

export default class RecipeItem {
  constructor(item) {
    this._item = item;
    this._results = {};
    
    this._item.results.forEach((resultData) => {
      const result = new Result(resultData.result, resultData.count);
      
      if (!this._results[resultData.type[0]]) {
        this._results[resultData.type[0]] = {};
      }
      this._results[resultData.type[0]][resultData.type[1]] = result;
    });
  }
  get name() {
    return this._item.name;
  }
  get category() {
    return this._item.category;
  }
  get recipe() {
    return this._item.recipe;
  }
  get results() {
    return this._results;
  }
  get summary() {
    const typeTexts = [];
    
    SECRETARY_TYPES.forEach((secretaryType) => {
      const mtypes = MATERIEL_TYPES
        .filter((materielType) => this._results[secretaryType][materielType].canDevelop())
        .map((materielType) => `${this._results[secretaryType][materielType].label}${materielType}`);
      
      if (mtypes.length > 0) {
        typeTexts.push(`  ${secretaryType}：${mtypes.join(" ")}`);
      }
    });
    
    let summary = `理論値：${this._item.recipe.join("/")}\n開発可能テーブル\n${typeTexts.join("\n")}`;
    
    if (this._item.name === "Ro.43水偵") {
      summary += "\n秘書艦がイタリア艦の場合のみ開発可能";
    }
    
    return summary;
  }
}
