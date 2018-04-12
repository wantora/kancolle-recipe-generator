import "./main.css";

import React from "react";
import ReactDOM from "react-dom";
import {FluxStore} from "./flux";
import PermanentStorage from "./storage";
import Root from "./components/Root";
import RecipeData from "./lib/RecipeData";
import {loadURLQuery} from "./lib/QueryLoader";

import itemsData from "./data/items.json";

function reducer(state, action) {
  if (action.type === "addItem") {
    if (state.selectedItems.every((item) => item !== action.value)) {
      return Object.assign({}, state, {
        selectedItems: state.selectedItems.concat([action.value]),
        expandedPanels: {
          info: state.expandedPanels.info,
        },
      });
    }
  } else if (action.type === "removeItem") {
    return Object.assign({}, state, {
      selectedItems: state.selectedItems.filter((item) => item !== action.value),
      expandedPanels: {
        info: state.expandedPanels.info,
      },
    });
  } else if (action.type === "togglePanel") {
    return Object.assign({}, state, {
      expandedPanels: Object.assign({}, state.expandedPanels, {
        [action.key]: action.value,
      }),
    });
  }
  return state;
}

const recipeData = new RecipeData(itemsData);
const initialState = {
  selectedItems: [],
  expandedPanels: {
    info: false,
  },
};

const query = loadURLQuery(location.href);
if (query) {
  initialState.selectedItems = query.selectedItems.filter((itemName) =>
    recipeData.getItemByName(itemName)
  );

  if (query.panelKey) {
    initialState.expandedPanels[query.panelKey] = true;
  }
}
const storageKey = "kancolle-recipe-generator" + location.search;

const storage = new PermanentStorage(storageKey, sessionStorage);
const fluxStore = new FluxStore(storage.load(initialState), [
  reducer,
  (state) => {
    storage.save(state);
    return state;
  },
]);

ReactDOM.render(
  <fluxStore.Provider>{(state) => <Root recipeData={recipeData} {...state} />}</fluxStore.Provider>,
  document.getElementById("root")
);
