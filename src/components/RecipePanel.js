import React from "react";
import PropTypes from "prop-types";
import Panel from "react-bootstrap/lib/Panel";
import {FluxDispatcher} from "../flux";

export default function RecipePanel({children, title, panelKey, expanded, className}) {
  return (
    <FluxDispatcher>
      {(dispatch) => (
        <div id={panelKey}>
          <Panel className={`recipe-panel ${className || ""}`} expanded={expanded}>
            <Panel.Heading
              onClick={(ev) => {
                let ele = ev.target;
                do {
                  if (ele.classList.contains("panel-heading")) {
                    dispatch({
                      type: "togglePanel",
                      key: panelKey,
                      value: !expanded,
                    });
                    break;
                  }
                } while (ele !== ev.currentTarget && (ele = ele.parentNode));
              }}
            >
              <h3>{title}</h3>
              <span className="glyphicon glyphicon-chevron-down accordion-icon" />
            </Panel.Heading>
            <Panel.Collapse>{children}</Panel.Collapse>
          </Panel>
        </div>
      )}
    </FluxDispatcher>
  );
}
RecipePanel.propTypes = {
  children: PropTypes.any.isRequired,
  title: PropTypes.string.isRequired,
  panelKey: PropTypes.string.isRequired,
  expanded: PropTypes.bool.isRequired,
  className: PropTypes.string,
};
