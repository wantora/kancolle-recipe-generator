import React from "react";
import PropTypes from "prop-types";
import ListGroupItem from "react-bootstrap/lib/ListGroupItem";
import classNames from "classnames";
import {dispatch} from "../flux";

export default class ItemListItem extends React.Component {
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
    const labels = [];
    
    if (this.props.result) {
      labels.push(`${this.props.result.label} `);
    }
    
    if (this.props.item.name === "Ro.43水偵") {
      labels.push(<b key="info-text" className="info-text"
        title="Ro.43水偵は秘書艦がイタリア艦の場合のみ開発できます">
        {this.props.item.name}
      </b>);
    } else {
      labels.push(this.props.item.name);
    }
    
    contents.push(<span key="label">{labels}</span>);
    
    contents.push(
      <span key="info" className="info">
        {this.props.result ? `${this.props.result.rateStr} | ` : null}
        {this.props.item.category}
      </span>
    );
    
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
  item: PropTypes.object.isRequired,
  button: PropTypes.bool,
  result: PropTypes.object,
  target: PropTypes.bool,
};
