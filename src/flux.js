import React from "react";
import PropTypes from "prop-types";

const FluxContext = React.createContext(null);

class Dispatcher {
  constructor() {
    this._listeners = [];
  }
  on(listener) {
    this._listeners.push(listener);
  }
  off(listener) {
    this._listeners = this._listeners.filter((lis) => lis !== listener);
  }
  dispatch(value) {
    for (const listener of this._listeners) {
      listener(value);
    }
  }
}

function createProvider(initialState, storeDispatcher, dispatch) {
  const provider = class FluxProvider extends React.Component {
    constructor(props) {
      super(props);

      this._update = (newState) => {
        this.setState({state: newState});
      };

      this.state = {state: initialState};
    }
    render() {
      const {children} = this.props;

      return (
        <FluxContext.Provider value={dispatch}>
          {children(this.state.state)}
        </FluxContext.Provider>
      );
    }
    componentDidMount() {
      storeDispatcher.on(this._update);
    }
    componentWillUnmount() {
      storeDispatcher.off(this._update);
    }
  };
  provider.propTypes = {
    children: PropTypes.func.isRequired,
  };

  return provider;
}

export class FluxStore {
  constructor(initialState, reducers) {
    this._state = initialState;
    this._reducers = reducers;
    this._dispatcher = new Dispatcher();

    this._provider = createProvider(this._state, this._dispatcher, (action) => {
      this.dispatch(action);
    });
  }
  dispatch(action) {
    this._state = this._reducers.reduce(
      (value, reducer) => reducer(value, action),
      this._state
    );
    this._dispatcher.dispatch(this._state);
  }
  get Provider() {
    return this._provider;
  }
}

export const FluxDispatcher = FluxContext.Consumer;
