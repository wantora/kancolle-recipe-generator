import groupBy from "lodash/groupBy";
import keyBy from "lodash/keyBy";
import uniq from "lodash/uniq";
import zip from "lodash/zip";
import Result from "./Result";
import RecipeItem, {TYPES} from "./RecipeItem";

const RESULT_CANNOT_DEVELOP = new Result("none", [0, 0]);

export default class RecipeData {
  constructor(items) {
    this._items = items.map((d) => new RecipeItem(d));
    this._nameTable = keyBy(this._items, (item) => item.name);
    this._categories = uniq(this._items.map((item) => item.category));
    this._categoryTable = groupBy(this._items, "category");
  }
  get items() {
    return this._items;
  }
  get categories() {
    return this._categories;
  }
  getItemByName(itemName) {
    return this._nameTable[itemName];
  }
  getItemsByCategory(category) {
    return this._categoryTable[category];
  }
  generateRecipes(targetItems) {
    const possibleTypes = this.generatePossibleTypes(targetItems);
    const baseRecipe = this.generateBaseRecipe(targetItems);
    const recipes = [];
    
    possibleTypes.forEach(([secretaryType, materielType]) => {
      const recipe = this.generateMaterielRecipe(baseRecipe, materielType);
      const resultItems = [];
      
      if (recipe === null) {
        return;
      }

      this._items.forEach((item) => {
        const result = item.results[secretaryType][materielType];
        const recipeResult = zip(recipe, item.recipe).every(([a, b]) => a >= b);
        
        resultItems.push({
          data: item,
          result: recipeResult ? result : RESULT_CANNOT_DEVELOP,
          target: targetItems.some((i) => i.name === item.name),
        });
      });
      
      const targetResultOrders = resultItems
        .filter((resultItem) => resultItem.target)
        .map((resultItem) => resultItem.result.order);
      
      recipes.push({
        secretaryType: secretaryType,
        materielType: materielType,
        recipe: recipe,
        resultItems: resultItems,
        resultMin: Math.min(...targetResultOrders),
        resultMax: Math.max(...targetResultOrders),
      });
    });
    
    return recipes;
  }
  generatePossibleTypes(targetItems) {
    let possibleTypes = TYPES;
    
    targetItems.forEach((item) => {
      TYPES.forEach(([secretaryType, materielType]) => {
        const result = item.results[secretaryType][materielType];
        
        if (!result.canDevelop()) {
          possibleTypes = possibleTypes
            .filter((t) => !(t[0] === secretaryType && t[1] === materielType));
        }
      });
    });

    return possibleTypes;
  }
  generateBaseRecipe(targetItems) {
    return zip(...targetItems.map((item) => item.recipe))
      .map((a) => Math.max(...a));
  }
  generateMaterielRecipe(baseRecipe, materielType) {
    const recipe = baseRecipe.concat();
    
    if (materielType === "鋼材(燃料)") {
      const max = Math.max(...recipe);
      
      if (recipe[0] < max && recipe[2] < max) {
        recipe[2] = max;
      }
    } else if (materielType === "弾薬") {
      if (recipe[1] < recipe[3]) {
        recipe[1] = recipe[3];
      }
      
      const max = Math.max(recipe[0], recipe[2]);
      
      if (recipe[1] <= max) {
        recipe[1] = max + 1;
      }
    } else if (materielType === "ボーキ") {
      const max = Math.max(recipe[0], recipe[1], recipe[2]);
      
      if (recipe[3] <= max) {
        recipe[3] = max + 1;
      }
    } else {
      throw new Error("materielType");
    }
    
    if (Math.max(...recipe) > 300) {
      return null;
    } else {
      return recipe;
    }
  }
}
