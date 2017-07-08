import React from "react";
import PropTypes from "prop-types";
import Panel from "react-bootstrap/lib/Panel";
import {dispatch} from "../flux";

export default class RecipePanel extends React.Component {
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
    
    return <div id={this.props.panelKey}>
      <Panel collapsible expanded={this.props.expanded}
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
      </Panel>
    </div>;
  }
}
RecipePanel.propTypes = {
  children: PropTypes.any.isRequired,
  title: PropTypes.string.isRequired,
  panelKey: PropTypes.string.isRequired,
  expanded: PropTypes.bool.isRequired,
};
