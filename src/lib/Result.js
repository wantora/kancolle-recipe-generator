import numeral from "numeral";

const RESULT_TABLE = {
  A: {
    order: 4,
    label: "◎",
  },
  B: {
    order: 3,
    label: "○",
  },
  C: {
    order: 1,
    label: "△",
  },
  unknown: {
    order: 2,
    label: "？",
  },
  none: {
    order: null,
    label: "×",
  },
};

export default class Result {
  constructor(value, count) {
    this._value = value;
    this._count = count;

    if (this._value === "none") {
      this._rateStr = "不可";
    } else if (this._count[0] === 0 || this._count[1] === 0) {
      this._rateStr = "不明";
    } else {
      const rate = this._count[0] / this._count[1];
      // 99%信頼区間
      const se = 2.58 * Math.sqrt(rate * (1 - rate) / this._count[1]);
      const ci = [rate - se, rate + se].map((n) => {
        let n2 = Math.round(n * 1000) / 10;
        if (n2 <= 0) {
          n2 = 0.0;
        }
        if (n2 >= 100) {
          n2 = 100.0;
        }
        return numeral(n2).format("0.0");
      });

      if (ci[0] === ci[1]) {
        this._rateStr = `${ci[0]}%`;
      } else {
        this._rateStr = `${ci[0]}~${ci[1]}%`;
      }
    }
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
  get rateStr() {
    return this._rateStr;
  }
  canDevelop() {
    return this._value !== "none";
  }
}

export const RESULT_NONE = new Result("none", [0, 0]);
