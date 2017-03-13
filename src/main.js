import "core-js";
import "./main.css";
import jQuery from "jquery";
window.jQuery = jQuery;
require("bootstrap");

import React from "react";
import ReactDOM from "react-dom";
import classNames from "classnames";
import _ from "lodash";

import itemsData from "./data/items.json";
import resultsData from "./data/results.csv";

const RESULT_TABLE = {
  "A": {
    order: 4,
    label: "◎",
  },
  "B": {
    order: 3,
    label: "○",
  },
  "C": {
    order: 1,
    label: "△",
  },
  "Q": {
    order: 2,
    label: "？",
  },
  "X": {
    order: null,
    label: "×",
  },
};
const SECRETARY_TYPES = ["砲戦系", "水雷系", "空母系"];
const MATERIEL_TYPES = ["鋼材(燃料)", "弾薬", "ボーキ"];

const TYPES = _.flatten(SECRETARY_TYPES.map((secretaryType) => {
  return MATERIEL_TYPES.map((materielType) => {
    return [secretaryType, materielType];
  });
}));

class Result {
  constructor(value) {
    this._value = value;
  }
  get value() {
    return this._value;
  }
  get order() {
    return RESULT_TABLE[this._value].order;
  }
  get label() {
    return RESULT_TABLE[this._value].label;
  }
  canDevelop() {
    return this._value !== "X";
  }
}

const RESULT_CANNOT_DEVELOP = new Result("X");

class RecipeItem {
  constructor(item, results) {
    this._item = item;
    this._results = results;
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

class RecipeData {
  constructor(items, results) {
    const resultMap = {};

    results.forEach((o) => {
      if (!resultMap[o.name]) {
        resultMap[o.name] = {};
      }
      if (!resultMap[o.name][o.secretaryType]) {
        resultMap[o.name][o.secretaryType] = {};
      }
      resultMap[o.name][o.secretaryType][o.materielType] = new Result(o.result);
    });

    this._items = items.map((d) => new RecipeItem(d, resultMap[d.name]));
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
        const recipeResult = _.zip(recipe, item.recipe).every(([a, b]) => a >= b);
        
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
    return _.zip(...targetItems.map((item) => item.recipe))
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
      contents.push(`${this.props.result.label} `);
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
  result: React.PropTypes.object,
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

class RecipePanel extends React.Component {
  render() {
    const onClick = (event) => {
      jQuery(event.currentTarget).parent().find(".collapse").collapse("toggle");
    };
    const collapseClass = classNames({
      "panel-collapse": true,
      "collapse": true,
      "in": !this.props.collapse,
    });

    return <div className="panel panel-default recipe-panel">
      <div className="panel-heading" onClick={onClick}>
        <h3>
          {this.props.title}
          <span className="glyphicon glyphicon-chevron-down accordion-icon" />
        </h3>
      </div>
      <div className={collapseClass}>
        {this.props.children}
      </div>
    </div>;
  }
}
RecipePanel.propTypes = {
  children: React.PropTypes.any.isRequired,
  title: React.PropTypes.string.isRequired,
  collapse: React.PropTypes.bool.isRequired,
};

class InfoPanel extends React.Component {
  render() {
    const possibleTypes = this.props.recipeData.generatePossibleTypes(this.props.selectedItems);

    const itemRecipeRows = this.props.selectedItems.map((item) => {
      return <tr key={item.name}>
        <td className="item-name">{item.name}</td>
        <td>{item.recipe[0]}</td>
        <td>{item.recipe[1]}</td>
        <td>{item.recipe[2]}</td>
        <td>{item.recipe[3]}</td>
      </tr>;
    });

    const baseRecipe = this.props.recipeData.generateBaseRecipe(this.props.selectedItems);
    const recipeRows = MATERIEL_TYPES.map((materielType) => {
      const recipe = this.props.recipeData.generateMaterielRecipe(baseRecipe, materielType);

      if (recipe === null) {
        return <tr key={materielType}>
          <td className="materiel-type">{materielType}</td>
          <td colSpan={4}>不可</td>
        </tr>;
      } else {
        const isPossibleType = possibleTypes.some(([s, m]) => m === materielType);
        const className = classNames({"possible-type": isPossibleType});

        return <tr key={materielType}>
          <td className="materiel-type">{materielType}</td>
          <td className={className}>{recipe[0]}</td>
          <td className={className}>{recipe[1]}</td>
          <td className={className}>{recipe[2]}</td>
          <td className={className}>{recipe[3]}</td>
        </tr>;
      }
    });

    const itemRows = this.props.selectedItems.map((item) => {
      return <tr key={item.name}>
        <td key={`${item.name}_name`} className="item-name">{item.name}</td>
        {TYPES.map(([secretaryType, materielType]) => {
          const isPossibleType = possibleTypes
            .some(([s, m]) => s === secretaryType && m === materielType);

          return <td
            key={`${item.name}_${secretaryType}_${materielType}`}
            className={classNames({"possible-type": isPossibleType})}
          >
            {item.results[secretaryType][materielType].label}
          </td>;
        })}
      </tr>;
    });

    return <RecipePanel title="詳細情報" collapse={true}>
      <div className="panel-body">
        <h4>理論値</h4>
        <table className="table table-bordered table-condensed recipe-table">
          <thead>
            <tr>
              <th className="item-name">装備</th>
              <th>燃料</th><th>弾薬</th><th>鋼材</th><th>ボーキ</th>
            </tr>
          </thead>
          <tbody>{itemRecipeRows}</tbody>
        </table>

        <h4>最大資材別投入資材</h4>
        <table className="table table-bordered table-condensed recipe-table">
          <thead>
            <tr>
              <th className="materiel-type">最大資材</th>
              <th>燃料</th><th>弾薬</th><th>鋼材</th><th>ボーキ</th>
            </tr>
          </thead>
          <tbody>{recipeRows}</tbody>
        </table>

        <h4>開発テーブル</h4>
        <table className="table table-bordered table-condensed recipe-table">
          <thead>
            <tr>
              <th className="item-name" rowSpan={2}>装備</th>
              {SECRETARY_TYPES.map((t) => <th key={t} colSpan={3}>{t}</th>)}
            </tr>
            <tr>{_.times(3, (i) => MATERIEL_TYPES.map((t) => <th key={`${i}_${t}`}>{t}</th>))}</tr>
          </thead>
          <tbody>{itemRows}</tbody>
        </table>
      </div>
    </RecipePanel>;
  }
}
InfoPanel.propTypes = {
  recipeData: React.PropTypes.object.isRequired,
  selectedItems: React.PropTypes.array.isRequired,
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

      panels.push(<InfoPanel
        key="info"
        recipeData={this.props.recipeData}
        selectedItems={this.props.selectedItems}
      />);
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
      
      const listItems = _.sortBy(
          recipe.resultItems.filter((resultItem) => resultItem.result.canDevelop()),
          (resultItem) => 100 - resultItem.result.order)
        .map((resultItem) => {
          return <ItemListItem key={resultItem.data.name}
            item={resultItem.data}
            result={resultItem.result}
            target={resultItem.target} />;
        });
      
      const title =
          `(${index + 1}/${sortedRecipes.length}) ` +
          `${recipe.secretaryType}・${recipe.materielType}テーブル ` +
          `${this.props.selectedItems.map((i) => i.name).join("・")}`;

      return <RecipePanel key={key}
        title={title}
        collapse={recipe.resultMin <= 1 && allResultMin > 1}
      >
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
      </RecipePanel>;
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
  <Root recipeData={new RecipeData(itemsData, resultsData)} />,
  document.getElementById("root")
);
