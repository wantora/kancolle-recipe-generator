import React from "react";
import PropTypes from "prop-types";
import ListGroupItem from "react-bootstrap/lib/ListGroupItem";
import classNames from "classnames";
import {FluxDispatcher} from "../flux";

export default function ItemListItem({
  item,
  button,
  result,
  target,
  available,
}) {
  const contents = [];
  const labels = [];

  if (result) {
    labels.push(`${result.label} `);
  }

  if (item.name === "Ro.43水偵") {
    labels.push(
      <b
        key="info-text"
        className="info-text"
        title="Ro.43水偵は秘書艦がイタリア艦の場合のみ開発できます"
      >
        {item.name}
      </b>
    );
  } else {
    labels.push(item.name);
  }

  contents.push(<span key="label">{labels}</span>);

  contents.push(
    <span key="info" className="info">
      {result ? `${result.rateStr} | ` : null}
      {item.category}
    </span>
  );

  if (button) {
    contents.push(
      <FluxDispatcher key="close-button">
        {(dispatch) => (
          <button
            type="button"
            className="close-button"
            onClick={() => {
              dispatch({
                type: "removeItem",
                value: item.name,
              });
            }}
          >
            <span className="glyphicon glyphicon-remove" />
          </button>
        )}
      </FluxDispatcher>
    );
  }

  return (
    <ListGroupItem
      className={classNames({
        "target-item": target,
        "unavailable-item": available === false,
      })}
      title={item.summary}
      data-name={item.name}
      data-category={item.category}
    >
      {contents}
    </ListGroupItem>
  );
}
ItemListItem.propTypes = {
  item: PropTypes.object.isRequired,
  button: PropTypes.bool,
  result: PropTypes.object,
  target: PropTypes.bool,
  available: PropTypes.bool,
};
