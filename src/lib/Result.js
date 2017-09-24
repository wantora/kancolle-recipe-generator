const RESULT_TABLE = {
  "A": {
    order: 4,
    label: "◎",
  },
  "B": {
    order: 3,
    label: "○",
  },
  "C": {
    order: 1,
    label: "△",
  },
  "unknown": {
    order: 2,
    label: "？",
  },
  "none": {
    order: null,
    label: "×",
  },
};

export default class Result {
  constructor(value, count) {
    this._value = value;
    this._count = count;
  }
  get value() {
    return this._value;
  }
  get order() {
    return RESULT_TABLE[this._value].order;
  }
  get label() {
    return RESULT_TABLE[this._value].label;
  }
  canDevelop() {
    return this._value !== "none";
  }
}
