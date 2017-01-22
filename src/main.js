require("./main.css");

import jQuery from "jquery";

window.jQuery = jQuery;
require("bootstrap");

import React from "react";
import ReactDOM from "react-dom";
import classNames from "classnames";
import _ from "lodash";

import rawData from "./data.json";

const RESULT_TABLE = ["×", "△", "○", "◎"];
const SECRETARY_TYPES = ["砲戦系", "水雷系", "空母系"];
const MATERIEL_TYPES = ["鋼材(燃料)", "弾薬", "ボーキ"];

const TYPES = _.flatten(SECRETARY_TYPES.map((secretaryType) => {
  return MATERIEL_TYPES.map((materielType) => {
    return [secretaryType, materielType];
  });
}));

class RecipeItem {
  constructor(item) {
    this._item = item;
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
    return this._item.results;
  }
  get summary() {
    const typeTexts = [];
    
    SECRETARY_TYPES.forEach((secretaryType) => {
      const mtypes = MATERIEL_TYPES
        .filter((materielType) => this._item.results[secretaryType][materielType] > 0);
      
      if (mtypes.length > 0) {
        typeTexts.push(`  ${secretaryType}：${mtypes.join("・")}`);
      }
    });
    
    let summary = `理論値：${this._item.recipe.join("/")}\n開発可能テーブル\n${typeTexts.join("\n")}`;
    
    if (this._item.name === "Ro.43水偵") {
      summary += "\n秘書艦がイタリア艦の場合のみ開発可能";
    }
    
    return summary;
  }
}

class RecipeData {
  constructor(data) {
    this._items = data.map((d) => new RecipeItem(d));
    this._nameTable = _.keyBy(this._items, (item) => item.name);
    this._categories = _.uniq(this._items.map((item) => item.category));
    this._categoryTable = _.groupBy(this._items, "category");
  }
  get items() {
    return this._items;
  }
  get categories() {
    return this._categories;
  }
  getItemByName(name) {
    return this._nameTable[name];
  }
  getItemsByCategory(category) {
    return this._categoryTable[category];
  }
  generateRecipes(targetItems) {
    let possibleTypes = TYPES;
    
    targetItems.forEach((item) => {
      TYPES.forEach(([secretaryType, materielType]) => {
        const result = item.results[secretaryType][materielType];
        
        if (result === 0) {
          possibleTypes = possibleTypes
            .filter((t) => !(t[0] === secretaryType && t[1] === materielType));
        }
      });
    });
    
    const baseRecipe = _.zip(...targetItems.map((item) => item.recipe))
      .map((a) => Math.max(...a));
    
    const recipes = [];
    
    possibleTypes.forEach(([secretaryType, materielType]) => {
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
        return;
      }
      
      const resultItems = [];
      
      this._items.forEach((item) => {
        const result = item.results[secretaryType][materielType];
        const recipeResult = _.zip(recipe, item.recipe).every(([a, b]) => a >= b);
        
        resultItems.push({
          data: item,
          result: recipeResult ? result : 0,
          target: targetItems.some((i) => i.name === item.name),
        });
      });
      
      const targetResults = resultItems
        .filter((resultItem) => resultItem.target)
        .map((resultItem) => resultItem.result);
      
      recipes.push({
        secretaryType: secretaryType,
        materielType: materielType,
        recipe: recipe,
        resultItems: resultItems,
        resultMin: Math.min(...targetResults),
        resultMax: Math.max(...targetResults),
      });
    });
    
    return recipes;
  }
}

class ItemButton extends React.Component {
  constructor(props) {
    super(props);
    
    this._onClick = () => {
      this.props.onToggleItem(this.props.item, !this.props.selected);
    };
  }
  render() {
    return <button type="button" className={classNames({selected: this.props.selected})}
      title={this.props.item.summary}
      onClick={this._onClick}
      data-name={this.props.item.name}
      data-category={this.props.item.category}>
      {this.props.item.name}
    </button>;
  }
}
ItemButton.propTypes = {
  item: React.PropTypes.object.isRequired,
  selected: React.PropTypes.bool.isRequired,
  onToggleItem: React.PropTypes.func.isRequired,
};

class ItemButtonList extends React.Component {
  render() {
    const itemList = [];
    
    this.props.recipeData.categories.forEach((category) => {
      const buttons = this.props.recipeData.getItemsByCategory(category).map((item) => {
        const selected = this.props.selectedItems.some((i) => i.name === item.name);
        
        return <ItemButton key={item.name} item={item} selected={selected}
          onToggleItem={this.props.onToggleItem} />;
      });
      
      itemList.push(<dt key={category + "-dt"}>{category}</dt>);
      itemList.push(<dd key={category + "-dd"}>{buttons}</dd>);
    });
    
    return <dl className="dl-horizontal item-list">{itemList}</dl>;
  }
}
ItemButtonList.propTypes = {
  recipeData: React.PropTypes.object.isRequired,
  selectedItems: React.PropTypes.array.isRequired,
  onToggleItem: React.PropTypes.func.isRequired,
};

class ItemListItem extends React.Component {
  constructor(props) {
    super(props);
    
    this._onClick = () => {
      this.props.onToggleItem(this.props.item, false);
    };
  }
  render() {
    const contents = [];
    const className = classNames({
      "list-group-item": true,
      "target-item": this.props.target,
    });
    
    if (this.props.result) {
      contents.push(`${RESULT_TABLE[this.props.result]} `);
    }
    
    if (this.props.item.name === "Ro.43水偵") {
      contents.push(<b key="info-text" className="info-text"
        title="Ro.43水偵は秘書艦がイタリア艦の場合のみ開発できます">
        {this.props.item.name}
      </b>);
    } else {
      contents.push(this.props.item.name);
    }
    
    if (this.props.onToggleItem) {
      contents.push(<button key="close-button" type="button" className="close-button"
        onClick={this._onClick}>
        <span className="glyphicon glyphicon-remove" />
      </button>);
    }
    
    return <li className={className}
      title={this.props.item.summary}
      data-name={this.props.item.name}
      data-category={this.props.item.category}>
        {contents}
    </li>;
  }
}
ItemListItem.propTypes = {
  item: React.PropTypes.object.isRequired,
  onToggleItem: React.PropTypes.func,
  result: React.PropTypes.number,
  target: React.PropTypes.bool,
};

class SelectedItemList extends React.Component {
  render() {
    const components = this.props.selectedItems.map((item) => {
      return <ItemListItem key={item.name} item={item} onToggleItem={this.props.onToggleItem} />;
    });
    
    return <ul className="list-group kcitems selected-items">{components}</ul>;
  }
}
SelectedItemList.propTypes = {
  recipeData: React.PropTypes.object.isRequired,
  selectedItems: React.PropTypes.array.isRequired,
  onToggleItem: React.PropTypes.func.isRequired,
};

class ItemSelector extends React.Component {
  render() {
    return <div className="panel panel-default">
      <div className="panel-heading"><h2>開発対象装備</h2></div>
      <div className="panel-body">
        <ItemButtonList
          recipeData={this.props.recipeData}
          selectedItems={this.props.selectedItems}
          onToggleItem={this.props.onToggleItem} />
        <SelectedItemList
          recipeData={this.props.recipeData}
          selectedItems={this.props.selectedItems}
          onToggleItem={this.props.onToggleItem} />
      </div>
    </div>;
  }
}
ItemSelector.propTypes = {
  recipeData: React.PropTypes.object.isRequired,
  selectedItems: React.PropTypes.array.isRequired,
  onToggleItem: React.PropTypes.func.isRequired,
};

class Recipes extends React.Component {
  render() {
    let panels;
    
    if (this.props.selectedItems.length > 0) {
      const recipes = this.props.recipeData.generateRecipes(this.props.selectedItems);
      
      if (recipes.length > 0) {
        panels = this._generatePanels(recipes);
      } else {
        panels = [
          <div key="alert" className="alert alert-danger" role="alert">
            <p>
              <span className="glyphicon glyphicon-exclamation-sign" aria-hidden="true" />{" "}
              条件を満たすレシピはありません。
            </p>
          </div>,
        ];
      }
    } else {
      panels = [
        <div key="alert" className="alert alert-info" role="alert">
          <p>
            <span className="glyphicon glyphicon-exclamation-sign" aria-hidden="true" />{" "}
            開発したい装備を選択してください。
          </p>
        </div>,
      ];
    }
    
    return <div className="panel panel-default">
      <div className="panel-heading"><h2>開発レシピ</h2></div>
      <div className="panel-body">{panels}</div>
    </div>;
  }
  _generatePanels(recipes) {
    const sortedRecipes = _.sortBy(recipes, (recipe) => {
      return [
        100 - recipe.resultMin,
        100 - recipe.resultMax,
        recipe.recipe.reduce((sum, n) => sum + n, 0),
      ];
    });
    const allResultMin = Math.max(...recipes.map((recipe) => recipe.resultMin));
    
    return sortedRecipes.map((recipe, index) => {
      const key = [...recipe.recipe, recipe.secretaryType].join("/");
      const onClick = (event) => {
        jQuery(event.currentTarget).parent().find(".collapse").collapse("toggle");
      };
      const collapseClass = classNames({
        "panel-collapse": true,
        "collapse": true,
        "in": recipe.resultMin >= 2 || allResultMin < 2,
      });
      
      const listItems = _.sortBy(recipe.resultItems, (resultItem) => 100 - resultItem.result)
        .filter((resultItem) => resultItem.result > 0)
        .map((resultItem) => {
          return <ItemListItem key={resultItem.data.name}
            item={resultItem.data}
            result={resultItem.result}
            target={resultItem.target} />;
        });
      
      return <div key={key} className="panel panel-default recipe-panel">
        <div className="panel-heading" onClick={onClick}>
          <h3>
            ({index + 1}/{sortedRecipes.length}){" "}
            {recipe.secretaryType}・{recipe.materielType}テーブル{" "}
            {this.props.selectedItems.map((i) => i.name).join("・")}
            <span className="glyphicon glyphicon-chevron-down accordion-icon" />
          </h3>
        </div>
        <div className={collapseClass}>
          <div className="panel-body">
            <table className="table table-bordered table-condensed recipe-table">
              <thead>
                <tr><th>燃料</th><th>弾薬</th><th>鋼材</th><th>ボーキ</th><th>秘書艦</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>{recipe.recipe[0]}</td>
                  <td>{recipe.recipe[1]}</td>
                  <td>{recipe.recipe[2]}</td>
                  <td>{recipe.recipe[3]}</td>
                  <td>{recipe.secretaryType}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <ul className="list-group kcitems">{listItems}</ul>
        </div>
      </div>;
    });
  }
}
Recipes.propTypes = {
  recipeData: React.PropTypes.object.isRequired,
  selectedItems: React.PropTypes.array.isRequired,
};

class Root extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = this._loadState();
    this._onToggleItem = this.toggleItem.bind(this);
  }
  render() {
    return <div>
      <ItemSelector
        recipeData={this.props.recipeData}
        selectedItems={this.state.selectedItems}
        onToggleItem={this._onToggleItem} />
      <Recipes
        recipeData={this.props.recipeData}
        selectedItems={this.state.selectedItems} />
    </div>;
  }
  toggleItem(targetItem, add) {
    this.setState((prevState, props) => {
      let newItems = prevState.selectedItems;
      
      if (add) {
        if (newItems.every((i) => i.name !== targetItem.name)) {
          newItems = newItems.concat([targetItem]);
        }
      } else {
        newItems = newItems.filter((i) => i.name !== targetItem.name);
      }
      
      const newState = {
        selectedItems: newItems,
      };
      
      this._saveState(newState);
      return newState;
    });
  }
  _loadState() {
    const state = {
      selectedItems: [],
    };
    
    try {
      const value = sessionStorage.getItem("selectedItems");
      if (value !== null) {
        state.selectedItems = JSON.parse(value)
          .map((name) => this.props.recipeData.getItemByName(name));
      }
    } catch (e) {
      // pass
    }
    
    return state;
  }
  _saveState(state) {
    try {
      const value = JSON.stringify(state.selectedItems.map((item) => item.name));
      sessionStorage.setItem("selectedItems", value);
    } catch (e) {
      // pass
    }
  }
}
Root.propTypes = {
  recipeData: React.PropTypes.object.isRequired,
};

ReactDOM.render(
  <Root recipeData={new RecipeData(rawData)} />,
  document.getElementById("root")
);
