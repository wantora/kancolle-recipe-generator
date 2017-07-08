import React from "react";
import PropTypes from "prop-types";
import ItemButtonList from "./ItemButtonList";
import SelectedItemList from "./SelectedItemList";

export default class ItemSelector extends React.Component {
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
  recipeData: PropTypes.object.isRequired,
  selectedItems: PropTypes.array.isRequired,
};
