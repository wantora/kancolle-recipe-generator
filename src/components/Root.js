import React from "react";
import PropTypes from "prop-types";
import ItemSelector from "./ItemSelector";
import Recipes from "./Recipes";

export default class Root extends React.Component {
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
  recipeData: PropTypes.object.isRequired,
  selectedItems: PropTypes.array.isRequired,
  expandedPanels: PropTypes.object.isRequired,
};
