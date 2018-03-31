import React from "react";
import PropTypes from "prop-types";
import sortBy from "lodash/sortBy";
import Panel from "react-bootstrap/lib/Panel";
import InfoPanel from "./InfoPanel";
import ItemListItem from "./ItemListItem";
import RecipePanel from "./RecipePanel";
import ShareBox from "./ShareBox";
import {generateURL} from "../lib/QueryLoader";
import {TYPENAME_TABLE} from "../lib/RecipeItem";
import ListGroup from "react-bootstrap/lib/ListGroup";

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

      panels.push(
        <InfoPanel
          key="info"
          recipeData={this.props.recipeData}
          selectedItems={this.props.selectedItems}
          expandedPanels={this.props.expandedPanels}
        />
      );
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

    return (
      <div className="panel panel-default">
        <div className="panel-heading">
          <h2>開発レシピ</h2>
        </div>
        <div className="panel-body">{panels}</div>
      </div>
    );
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
      const listItems = sortBy(recipe.resultItems, (resultItem) => {
        return 100 - resultItem.result.order;
      }).map((resultItem) => {
        return (
          <ItemListItem
            key={resultItem.data.name}
            item={resultItem.data}
            result={resultItem.result}
            target={resultItem.target}
          />
        );
      });

      const listRestItems = recipe.restItems.map((resultItem) => {
        return (
          <ItemListItem
            key={resultItem.data.name}
            item={resultItem.data}
            result={resultItem.result}
            target={resultItem.target}
            available={false}
          />
        );
      });

      const selectedItemNames = this.props.selectedItems.map((i) => i.name);
      const title =
        `(${index + 1}/${sortedRecipes.length}) ` +
        `${recipe.secretaryName}・${recipe.materielType}テーブル ` +
        `${selectedItemNames.join("・")}`;

      // panelKeyにはspecialTypeを含めなくても問題ないはず
      const panelKey = recipe.recipe.join("/") + TYPENAME_TABLE[recipe.secretaryType];
      const expanded = (() => {
        if (Object.prototype.hasOwnProperty.call(this.props.expandedPanels, panelKey)) {
          return this.props.expandedPanels[panelKey];
        } else {
          return recipe.resultMin > 1 || allResultMin <= 1;
        }
      })();

      const restPanelKey = `${panelKey}_rest`;
      const restExpanded = (() => {
        if (Object.prototype.hasOwnProperty.call(this.props.expandedPanels, restPanelKey)) {
          return this.props.expandedPanels[restPanelKey];
        } else {
          return false;
        }
      })();

      const recipeURL = generateURL(location.href, selectedItemNames, panelKey);
      const recipeText = `${selectedItemNames.join("・")} を開発できるレシピは ${recipe.recipe.join(
        "/"
      )} 秘書:${recipe.secretaryName}`;

      let restItemsPanel = null;
      if (listRestItems.length > 0) {
        restItemsPanel = (
          <Panel.Body>
            <RecipePanel
              key={`recipe${index}`}
              title="投入資材不足で開発できない装備"
              panelKey={restPanelKey}
              expanded={restExpanded}
              className="rest-items-panel"
            >
              <ListGroup className="kcitems">{listRestItems}</ListGroup>
            </RecipePanel>
          </Panel.Body>
        );
      }

      return (
        <RecipePanel key={`recipe${index}`} title={title} panelKey={panelKey} expanded={expanded}>
          <Panel.Body className="recipe-box">
            <table className="table table-bordered table-condensed recipe-table">
              <thead>
                <tr>
                  <th>燃料</th>
                  <th>弾薬</th>
                  <th>鋼材</th>
                  <th>ボーキ</th>
                  <th className="secretary-type">秘書艦</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{recipe.recipe[0]}</td>
                  <td>{recipe.recipe[1]}</td>
                  <td>{recipe.recipe[2]}</td>
                  <td>{recipe.recipe[3]}</td>
                  <td className="secretary-type">{recipe.secretaryName}</td>
                </tr>
              </tbody>
            </table>
            <ShareBox url={recipeURL} text={recipeText} hashtags="艦これ" />
          </Panel.Body>
          <ListGroup className="kcitems">{listItems}</ListGroup>
          {restItemsPanel}
        </RecipePanel>
      );
    });
  }
}
Recipes.propTypes = {
  recipeData: PropTypes.object.isRequired,
  selectedItems: PropTypes.array.isRequired,
  expandedPanels: PropTypes.object.isRequired,
};
