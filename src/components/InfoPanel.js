import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import times from "lodash/times";
import Panel from "react-bootstrap/lib/Panel";
import RecipePanel from "./RecipePanel";
import {SECRETARY_TYPES, MATERIEL_TYPES, TYPES} from "../lib/RecipeItem";

export default class InfoPanel extends React.Component {
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
            {item.results[secretaryType][materielType].label}<br />
            <span className="rate">{item.results[secretaryType][materielType].rateStr}</span>
          </td>;
        })}
      </tr>;
    });

    return <RecipePanel
      title="詳細情報"
      expanded={this.props.expandedPanels.info}
      panelKey="info"
    >
      <Panel.Body>
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
      </Panel.Body>
    </RecipePanel>;
  }
}
InfoPanel.propTypes = {
  recipeData: PropTypes.object.isRequired,
  selectedItems: PropTypes.array.isRequired,
  expandedPanels: PropTypes.object.isRequired,
};
