export function getSecretaryName(secretaryType, specialType) {
  if (specialType === "italian") {
    return `${secretaryType}(イタリア艦)`;
  } else {
    return secretaryType;
  }
}

export default class Recipe {
  constructor({
    secretaryType,
    materielType,
    specialType,
    recipe,
    resultItems,
    restItems,
  }) {
    this.secretaryType = secretaryType;
    this.materielType = materielType;
    this.specialType = specialType;
    this.recipe = recipe;
    this.resultItems = resultItems;
    this.restItems = restItems;

    const targetResultOrders = resultItems
      .filter((resultItem) => resultItem.target)
      .map((resultItem) => resultItem.result.order);

    this.resultMin = Math.min(...targetResultOrders);
    this.resultMax = Math.max(...targetResultOrders);
    this.secretaryName = getSecretaryName(secretaryType, specialType);
  }
}
