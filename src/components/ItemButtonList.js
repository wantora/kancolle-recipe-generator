import React from "react";
import PropTypes from "prop-types";
import ItemButton from "./ItemButton";

export default class ItemButtonList extends React.Component {
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
  recipeData: PropTypes.object.isRequired,
  selectedItems: PropTypes.array.isRequired,
};
