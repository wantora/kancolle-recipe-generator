import React from "react";
import PropTypes from "prop-types";
import ItemListItem from "./ItemListItem";
import ListGroup from "react-bootstrap/lib/ListGroup";

export default class SelectedItemList extends React.Component {
  render() {
    const components = this.props.selectedItems.map((item) => {
      return <ItemListItem key={item.name} item={item} button={true} />;
    });
    
    return <ListGroup className="kcitems selected-items">{components}</ListGroup>;
  }
}
SelectedItemList.propTypes = {
  recipeData: PropTypes.object.isRequired,
  selectedItems: PropTypes.array.isRequired,
};
