import flatten from "lodash/flatten";
import Result, {RESULT_NONE} from "./Result";

export const SECRETARY_TYPES = ["砲戦系", "水雷系", "空母系"];
export const MATERIEL_TYPES = ["鋼材(燃料)", "弾薬", "ボーキ"];
export const SPECIAL_TYPES = ["general", "italian", "rikko"];

export const TYPES = flatten(
  SECRETARY_TYPES.map((secretaryType) => {
    return MATERIEL_TYPES.map((materielType) => {
      return [secretaryType, materielType];
    });
  })
);

export const TYPENAME_TABLE = {
  砲戦系: "b",
  水雷系: "t",
  空母系: "a",
};

function createResults() {
  const results = {};

  SECRETARY_TYPES.forEach((secretaryType) => {
    results[secretaryType] = {};
    MATERIEL_TYPES.forEach((materielType) => {
      results[secretaryType][materielType] = {};
      SPECIAL_TYPES.forEach((specialType) => {
        results[secretaryType][materielType][specialType] = RESULT_NONE;
      });
    });
  });

  return results;
}

export default class RecipeItem {
  constructor(item) {
    this._item = item;
    this._results = createResults();

    this._item.results.forEach((resultData) => {
      const result = new Result(resultData.result, resultData.count);
      const type = resultData.type;
      this._results[type[0]][type[1]][type[2]] = result;
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
  get specialType() {
    if (this._item.name === "Ro.43水偵") {
      return "italian";
    } else if (this._item.name === "九六式陸攻") {
      return "rikko";
    } else {
      return "general";
    }
  }
  get summary() {
    const typeTexts = [];
    const specialType = this.specialType;

    SECRETARY_TYPES.forEach((secretaryType) => {
      const mtypes = MATERIEL_TYPES.filter((materielType) => {
        return this._results[secretaryType][materielType][specialType].canDevelop();
      }).map((materielType) => {
        return `${this._results[secretaryType][materielType][specialType].label}${materielType}`;
      });

      if (mtypes.length > 0) {
        typeTexts.push(`  ${secretaryType}：${mtypes.join(" ")}`);
      }
    });

    let summary = `理論値：${this._item.recipe.join("/")}\n開発可能テーブル\n${typeTexts.join(
      "\n"
    )}`;

    if (specialType === "italian") {
      summary += "\n秘書艦がイタリア艦の場合のみ開発可能";
    }

    return summary;
  }
}
