import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import {dispatch} from "../flux";

export default class ItemButton extends React.Component {
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
    return (
      <button
        type="button"
        className={classNames({selected: this.props.selected})}
        title={this.props.item.summary}
        onClick={this._onClick}
        data-name={this.props.item.name}
        data-category={this.props.item.category}
      >
        {this.props.item.name}
      </button>
    );
  }
}
ItemButton.propTypes = {
  item: PropTypes.object.isRequired,
  selected: PropTypes.bool.isRequired,
};
