import "core-js";

import "bootstrap/dist/css/bootstrap.css";
import "./main.css";

import React from "react";
import ReactDOM from "react-dom";
import classNames from "classnames";
import flatten from "lodash/flatten";
import groupBy from "lodash/groupBy";
import keyBy from "lodash/keyBy";
import sortBy from "lodash/sortBy";
import times from "lodash/times";
import uniq from "lodash/uniq";
import zip from "lodash/zip";
import Panel from "react-bootstrap/lib/Panel";
import ListGroup from "react-bootstrap/lib/ListGroup";
import ListGroupItem from "react-bootstrap/lib/ListGroupItem";
import {Store, dispatch} from "./flux";
import Storage from "./storage";

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

const TYPES = flatten(SECRETARY_TYPES.map((secretaryType) => {
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

class ItemButton extends React.Component {
  constructor(props) {
    super(props);
    
    this._onClick = () => {
      dispatch({
        type: this.props.selected ? "removeItem" : "addItem",
        value: this.props.item.name,
      });
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
};

class ItemButtonList extends React.Component {
  render() {
    const itemList = [];
    
    this.props.recipeData.categories.forEach((category) => {
      const buttons = this.props.recipeData.getItemsByCategory(category).map((item) => {
        const selected = this.props.selectedItems.some((i) => i.name === item.name);
        
        return <ItemButton key={item.name} item={item} selected={selected} />;
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
};

class ItemListItem extends React.Component {
  constructor(props) {
    super(props);
    
    this._onClick = () => {
      dispatch({
        type: "removeItem",
        value: this.props.item.name,
      });
    };
  }
  render() {
    const contents = [];
    
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
    
    if (this.props.button) {
      contents.push(<button key="close-button" type="button" className="close-button"
        onClick={this._onClick}>
        <span className="glyphicon glyphicon-remove" />
      </button>);
    }
    
    return <ListGroupItem
      className={classNames({"target-item": this.props.target})}
      title={this.props.item.summary}
      data-name={this.props.item.name}
      data-category={this.props.item.category}>
        {contents}
    </ListGroupItem>;
  }
}
ItemListItem.propTypes = {
  item: React.PropTypes.object.isRequired,
  button: React.PropTypes.bool,
  result: React.PropTypes.object,
  target: React.PropTypes.bool,
};

class SelectedItemList extends React.Component {
  render() {
    const components = this.props.selectedItems.map((item) => {
      return <ItemListItem key={item.name} item={item} button={true} />;
    });
    
    return <ListGroup className="kcitems selected-items">{components}</ListGroup>;
  }
}
SelectedItemList.propTypes = {
  recipeData: React.PropTypes.object.isRequired,
  selectedItems: React.PropTypes.array.isRequired,
};

class ItemSelector extends React.Component {
  render() {
    return <div className="panel panel-default">
      <div className="panel-heading"><h2>開発対象装備</h2></div>
      <div className="panel-body">
        <ItemButtonList
          recipeData={this.props.recipeData}
          selectedItems={this.props.selectedItems} />
        <SelectedItemList
          recipeData={this.props.recipeData}
          selectedItems={this.props.selectedItems} />
      </div>
    </div>;
  }
}
ItemSelector.propTypes = {
  recipeData: React.PropTypes.object.isRequired,
  selectedItems: React.PropTypes.array.isRequired,
};

class RecipePanel extends React.Component {
  render() {
    const onClick = (event) => {
      let ele = event.target;
      do {
        if (ele.classList.contains("panel-heading")) {
          dispatch({
            type: "togglePanel",
            key: this.props.panelKey,
            value: !this.props.expanded,
          });
          break;
        }
      } while (ele !== event.currentTarget && (ele = ele.parentNode));
    };

    return <Panel collapsible expanded={this.props.expanded}
      className="recipe-panel"
      onClick={onClick}
      header={
        <h3>
          {this.props.title}
          <span className="glyphicon glyphicon-chevron-down accordion-icon" />
        </h3>
      }
    >
      {this.props.children}
    </Panel>;
  }
}
RecipePanel.propTypes = {
  children: React.PropTypes.any.isRequired,
  title: React.PropTypes.string.isRequired,
  panelKey: React.PropTypes.string.isRequired,
  expanded: React.PropTypes.bool.isRequired,
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
          <td className={classNames({"materiel-type": true, "possible-type": isPossibleType})}>{materielType}</td>
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

    return <RecipePanel
      title="詳細情報"
      expanded={this.props.expandedPanels.info}
      panelKey="info"
    >
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
          <tr>{times(3, (i) => MATERIEL_TYPES.map((t) => <th key={`${i}_${t}`}>{t}</th>))}</tr>
        </thead>
        <tbody>{itemRows}</tbody>
      </table>
    </RecipePanel>;
  }
}
InfoPanel.propTypes = {
  recipeData: React.PropTypes.object.isRequired,
  selectedItems: React.PropTypes.array.isRequired,
  expandedPanels: React.PropTypes.object.isRequired,
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
        expandedPanels={this.props.expandedPanels}
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
    const sortedRecipes = sortBy(recipes, (recipe) => {
      return [
        100 - recipe.resultMin,
        100 - recipe.resultMax,
        recipe.recipe.reduce((sum, n) => sum + n, 0),
      ];
    });
    const allResultMin = Math.max(...recipes.map((recipe) => recipe.resultMin));

    return sortedRecipes.map((recipe, index) => {
      const listItems = sortBy(
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

      const panelKey = index.toString();
      const expanded = Object.prototype.hasOwnProperty.call(this.props.expandedPanels, panelKey) ?
        this.props.expandedPanels[panelKey] : (recipe.resultMin > 1 || allResultMin <= 1);

      return <RecipePanel key={`recipe${index}`}
        title={title}
        panelKey={panelKey}
        expanded={expanded}
      >
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
        <ListGroup fill className="kcitems">{listItems}</ListGroup>
      </RecipePanel>;
    });
  }
}
Recipes.propTypes = {
  recipeData: React.PropTypes.object.isRequired,
  selectedItems: React.PropTypes.array.isRequired,
  expandedPanels: React.PropTypes.object.isRequired,
};

class Root extends React.Component {
  render() {
    const selectedItems = this.props.selectedItems
      .map((name) => this.props.recipeData.getItemByName(name));

    return <div>
      <ItemSelector
        recipeData={this.props.recipeData}
        selectedItems={selectedItems} />
      <Recipes
        recipeData={this.props.recipeData}
        selectedItems={selectedItems}
        expandedPanels={this.props.expandedPanels} />
    </div>;
  }
}
Root.propTypes = {
  recipeData: React.PropTypes.object.isRequired,
  selectedItems: React.PropTypes.array.isRequired,
  expandedPanels: React.PropTypes.object.isRequired,
};

function reducer(state, action) {
  if (action.type === "addItem") {
    if (state.selectedItems.every((item) => item !== action.value)) {
      return Object.assign({}, state, {
        selectedItems: state.selectedItems.concat([action.value]),
        expandedPanels: {
          info: state.expandedPanels.info,
        },
      });
    }
  } else if (action.type === "removeItem") {
    return Object.assign({}, state, {
      selectedItems: state.selectedItems.filter((item) => item !== action.value),
      expandedPanels: {
        info: state.expandedPanels.info,
      },
    });
  } else if (action.type === "togglePanel") {
    return Object.assign({}, state, {
      expandedPanels: Object.assign({}, state.expandedPanels, {
        [action.key]: action.value,
      }),
    });
  }
  return state;
}

function render() {
  storage.save(store.state);
  ReactDOM.render(<Root recipeData={recipeData} {...store.state} />, document.getElementById("root"));
}

const recipeData = new RecipeData(itemsData, resultsData);
const initialState = {
  selectedItems: [],
  expandedPanels: {
    info: false,
  },
};

const storage = new Storage("kancolle-recipe-generator", sessionStorage);
const store = new Store(storage.load(initialState), reducer);

store.subscribe(render);
render();
