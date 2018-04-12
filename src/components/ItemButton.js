import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import {FluxDispatcher} from "../flux";

export default function ItemButton({item, selected}) {
  return (
    <FluxDispatcher>
      {(dispatch) => (
        <button
          type="button"
          className={classNames({selected: selected})}
          title={item.summary}
          onClick={() => {
            dispatch({
              type: selected ? "removeItem" : "addItem",
              value: item.name,
            });
          }}
          data-name={item.name}
          data-category={item.category}
        >
          {item.name}
        </button>
      )}
    </FluxDispatcher>
  );
}
ItemButton.propTypes = {
  item: PropTypes.object.isRequired,
  selected: PropTypes.bool.isRequired,
};
