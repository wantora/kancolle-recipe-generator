import React from "react";
import PropTypes from "prop-types";
import sortBy from "lodash/sortBy";
import InfoPanel from "./InfoPanel";
import ItemListItem from "./ItemListItem";
import RecipePanel from "./RecipePanel";
import {generateURL} from "../lib/QueryLoader";
import {TYPENAME_TABLE} from "../lib/RecipeItem";
import ListGroup from "react-bootstrap/lib/ListGroup";
import {Share} from "react-twitter-widgets";

export default class Recipes extends React.Component {
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
      
      const selectedItemNames = this.props.selectedItems.map((i) => i.name);
      
      const title =
        `(${index + 1}/${sortedRecipes.length}) ` +
        `${recipe.secretaryType}・${recipe.materielType}テーブル ` +
        `${selectedItemNames.join("・")}`;
      
      const panelKey = recipe.recipe.join("/") + TYPENAME_TABLE[recipe.secretaryType];
      const expanded = Object.prototype.hasOwnProperty.call(this.props.expandedPanels, panelKey) ?
        this.props.expandedPanels[panelKey] : (recipe.resultMin > 1 || allResultMin <= 1);
      
      const recipeURL = generateURL(location.href, selectedItemNames, panelKey);
      const recipeText = `${selectedItemNames.join("・")} を開発できるレシピは ${recipe.recipe.join("/")} 秘書:${recipe.secretaryType}`;
      
      return <RecipePanel key={`recipe${index}`}
        title={title}
        panelKey={panelKey}
        expanded={expanded}
      >
        <div className="share-box">
          <Share url={recipeURL} options={{text: recipeText, hashtags: "艦これ"}} />
        </div>
        
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
  recipeData: PropTypes.object.isRequired,
  selectedItems: PropTypes.array.isRequired,
  expandedPanels: PropTypes.object.isRequired,
};
