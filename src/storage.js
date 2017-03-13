export default class Storage {
  constructor(key, domStorage) {
    this.key = key;
    this.domStorage = domStorage;
  }
  load(defaultData = {}) {
    let data = {};

    try {
      const src = this.domStorage.getItem(this.key);
      if (src !== null) {
        data = JSON.parse(src);
      }
    } catch (e) {
      // skip
    }

    return Object.assign({}, defaultData, data);
  }
  save(data) {
    const src = JSON.stringify(data);

    try {
      this.domStorage.setItem(this.key, src);
    } catch (e) {
      // skip
    }
  }
}
