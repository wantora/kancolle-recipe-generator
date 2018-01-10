import React from "react";
import PropTypes from "prop-types";
import Panel from "react-bootstrap/lib/Panel";
import {dispatch} from "../flux";

export default class RecipePanel extends React.Component {
  render() {
    const onClick = (ev) => {
      let ele = ev.target;
      do {
        if (ele.classList.contains("panel-heading")) {
          dispatch({
            type: "togglePanel",
            key: this.props.panelKey,
            value: !this.props.expanded,
          });
          break;
        }
      } while (ele !== ev.currentTarget && (ele = ele.parentNode));
    };
    
    return <div id={this.props.panelKey}>
      <Panel className="recipe-panel" expanded={this.props.expanded}>
        <Panel.Heading onClick={onClick}>
          <h3>
            {this.props.title}
            <span className="glyphicon glyphicon-chevron-down accordion-icon" />
          </h3>
        </Panel.Heading>
        <Panel.Collapse>
          {this.props.children}
        </Panel.Collapse>
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
