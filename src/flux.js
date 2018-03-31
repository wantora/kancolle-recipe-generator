import events from "events";

const Dispatcher = new events.EventEmitter();

export const dispatch = (action) => {
  Dispatcher.emit("action", action);
};

export class Store {
  constructor(initialState, reducer) {
    this.reducer = reducer;
    this.state = initialState;
    this.emitter = new events.EventEmitter();

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
