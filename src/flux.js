import {EventEmitter} from "events";

const Dispatcher = new EventEmitter();

export const dispatch = (action) => {
  Dispatcher.emit("action", action);
};

export class Store {
  constructor(initialState, reducer) {
    this.reducer = reducer;
    this.state = initialState;
    this.emitter = new EventEmitter();

    this.onAction = (action) => {
      this.state = this.reducer(this.state, action);
      this.emitter.emit("change");
    };
    Dispatcher.on("action", this.onAction);
  }
  dispose() {
    Dispatcher.removeListener("action", this.onAction);
  }
  subscribe(listener) {
    this.emitter.on("change", listener);
  }
}
