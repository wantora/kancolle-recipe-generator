"use strict";

const _ = require("lodash");
const $ = window.jQuery = require("jquery");
require("bootstrap");

const RESULT_TABLE = ["×", "△", "○", "◎"];
const SECRETARY_TYPES = ["砲戦系", "水雷系", "空母系"];
const MATERIEL_TYPES = ["鋼材(燃料)", "弾薬", "ボーキ"];

const TYPES = _.flatten(SECRETARY_TYPES.map((secretaryType) => {
  return MATERIEL_TYPES.map((materielType) => {
    return [secretaryType, materielType];
  });
}));

const itemList = document.getElementById("item-list");
const selectedItems = document.getElementById("selected-items");
const recipePanels = document.getElementById("recipe-panels");

let recipeData = null;
let recipeDataTable = null;

function generateRecipeDataTable() {
  const table = {};
  
  recipeData.forEach((item) => {
    table[item.name] = item;
  });
  
  return table;
}

function generateSummary(item) {
  let typeTexts = [];
  
  SECRETARY_TYPES.forEach((secretaryType) => {
    const mtypes = MATERIEL_TYPES.filter((materielType) => item.results[secretaryType][materielType] > 0);
    
    if (mtypes.length > 0) {
      typeTexts.push(`  ${secretaryType}：${mtypes.join("・")}`);
    }
  })
  
  let summary = `理論値：${item.recipe.join("/")}\n開発可能テーブル\n${typeTexts.join("\n")}`;
  
  if (item.name === "Ro.43水偵") {
    summary += "\n秘書艦がイタリア艦の場合のみ開発可能";
  }
  
  return summary;
}

function createItemElement(item) {
  const li = document.createElement("li");
  li.classList.add("list-group-item");
  li.setAttribute("data-name", item.name);
  li.setAttribute("data-category", item.category);
  li.title = generateSummary(item);
  
  if (item.name === "Ro.43水偵") {
    const infoText = document.createElement("b");
    infoText.classList.add("info-text");
    infoText.title = "Ro.43水偵は秘書艦がイタリア艦の場合のみ開発できます";
    infoText.textContent = item.name;
    
    li.appendChild(infoText);
  } else {
    li.textContent = item.name;
  }
  
  return li;
}

function initItemList() {
  const g = _.groupBy(recipeData, "category");
  
  _.uniq(recipeData.map((item) => item.category)).forEach((category) => {
    const dt = document.createElement("dt");
    dt.textContent = category;
    itemList.appendChild(dt);
    
    const dd = document.createElement("dd");
    itemList.appendChild(dd);
    
    g[category].forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("data-name", item.name);
      button.setAttribute("data-category", item.category);
      button.textContent = item.name;
      button.title = generateSummary(item);
      
      button.addEventListener("click", (event) => {
        if (button.classList.contains("selected")) {
          removeItem(item.name);
        } else {
          addItem(item.name);
        }
      }, false);
      
      dd.appendChild(button);
    });
  });
}

function getSelectedItems() {
  return _.toArray(selectedItems.querySelectorAll("li")).map((li) => {
    return li.getAttribute("data-name");
  });
}

function addItem(name) {
  if (_.includes(getSelectedItems(), name)) {
    return;
  }
  
  const li = createItemElement(recipeDataTable[name]);
  
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.classList.add("close-button");
  closeButton.addEventListener("click", (event) => {
    removeItem(name);
  }, false);
  li.appendChild(closeButton);
  
  const closeIcon = document.createElement("span");
  closeIcon.classList.add("glyphicon");
  closeIcon.classList.add("glyphicon-remove");
  closeButton.appendChild(closeIcon);
  
  selectedItems.appendChild(li);
  
  const button = itemList.querySelector(`button[data-name="${name}"]`);
  button.classList.add("selected");
  
  updateResult();
}

function removeItem(name) {
  const li = selectedItems.querySelector(`li[data-name="${name}"]`);
  li.parentNode.removeChild(li);
  
  const button = itemList.querySelector(`button[data-name="${name}"]`);
  button.classList.remove("selected");
  
  updateResult();
}

function generateRecipes(targetNames) {
  const possibleTypes = _.clone(TYPES);
  
  targetNames.forEach((name) => {
    TYPES.forEach(([secretaryType, materielType]) => {
      const result = recipeDataTable[name].results[secretaryType][materielType];
      
      if (result === 0) {
        _.remove(possibleTypes, (t) => t[0] === secretaryType && t[1] === materielType);
      }
    });
  });
  
  const baseRecipe = _.zip(...targetNames.map((name) => recipeDataTable[name].recipe))
    .map((a) => Math.max(...a));
  
  const recipes = [];
  
  possibleTypes.map(([secretaryType, materielType]) => {
    const recipe = _.clone(baseRecipe);
    
    if (materielType === "鋼材(燃料)") {
      const max = Math.max(...recipe);
      
      if (recipe[0] < max && recipe[2] < max) {
        recipe[2] = max;
      }
    } else if (materielType === "弾薬") {
      if (recipe[1] < recipe[3]) {
        recipe[1] = recipe[3];
      }
      
      const max = Math.max(recipe[0], recipe[2]);
      
      if (recipe[1] <= max) {
        recipe[1] = max + 1;
      }
    } else if (materielType === "ボーキ") {
      const max = Math.max(recipe[0], recipe[1], recipe[2]);
      
      if (recipe[3] <= max) {
        recipe[3] = max + 1;
      }
    } else {
      throw new Error("materielType");
    }
    
    if (Math.max(...recipe) > 300) {
      return;
    }
    
    const items = [];
    
    recipeData.forEach((item) => {
      const result = item.results[secretaryType][materielType];
      
      if (result > 0) {
        const recipeResult = _.zip(recipe, item.recipe).every(([a, b]) => a >= b);
        
        items.push({
          data: item,
          result: recipeResult ? result : 0,
          target: _.includes(targetNames, item.name),
        });
      }
    });
    
    const results = items.filter((item) => item.target).map((item) => item.result);
    
    recipes.push({
      secretaryType: secretaryType,
      materielType: materielType,
      recipe: recipe,
      items: items,
      resultMin: Math.min(...results),
      resultMax: Math.max(...results),
    });
  });
  
  return recipes;
}

function updateResult() {
  const targetNames = getSelectedItems();
  
  if (targetNames.length === 0) {
    recipePanels.innerHTML = `<div class="alert alert-info" role="alert"><p>
      <span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>
      開発したい装備を選択してください。
    </p></div>`;
    return;
  }
  
  const recipes = generateRecipes(targetNames);
  
  if (recipes.length === 0) {
    recipePanels.innerHTML = `<div class="alert alert-danger" role="alert"><p>
      <span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>
      条件を満たすレシピはありません。
    </p></div>`;
    return;
  }
  
  recipePanels.textContent = "";
  
  const sortedRecipes = _.sortBy(recipes, (recipe) => {
    return [
      10 - recipe.resultMin,
      10 - recipe.resultMax,
      _.reduce(recipe.recipe, (sum, n) => sum + n, 0),
    ];
  });
  
  const allResultMin = Math.max(...recipes.map((recipe) => recipe.resultMin));
  
  sortedRecipes.forEach((recipe, index) => {
    const panel = document.createElement("div");
    panel.classList.add("panel");
    panel.classList.add("panel-default");
    panel.classList.add("recipe-panel");
    
    const heading = document.createElement("div");
    heading.classList.add("panel-heading");
    heading.addEventListener("click", (event) => {
      $(collapse).collapse("toggle");
    }, false);
    panel.appendChild(heading);
    
    const h3 = document.createElement("h3");
    h3.textContent = `(${index + 1}/${sortedRecipes.length}) ${targetNames.join("・")} ${recipe.secretaryType}・${recipe.materielType}レシピ`;
    heading.appendChild(h3);
    
    const headIcon = document.createElement("span");
    headIcon.classList.add("glyphicon");
    headIcon.classList.add("glyphicon-chevron-down");
    headIcon.classList.add("accordion-icon");
    h3.appendChild(headIcon);
    
    const collapse = document.createElement("div");
    collapse.classList.add("panel-collapse");
    collapse.classList.add("collapse");
    
    if (recipe.resultMin >= 2 || allResultMin < 2) {
      collapse.classList.add("in");
    }
    
    panel.appendChild(collapse);
    
    const body = document.createElement("div");
    body.classList.add("panel-body");
    collapse.appendChild(body);
    
    const table = document.createElement("table");
    table.classList.add("table");
    table.classList.add("table-bordered");
    table.classList.add("table-condensed");
    table.classList.add("recipe-table");
    table.innerHTML = "<thead><tr><th>燃料</th><th>弾薬</th><th>鋼材</th><th>ボーキ</th><th>秘書艦</th></tr></thead>";
    body.appendChild(table);
    
    const tbody = document.createElement("tbody");
    table.appendChild(tbody);
    
    const tr = document.createElement("tr");
    tbody.appendChild(tr);
    
    [...recipe.recipe, recipe.secretaryType].forEach((content) => {
      const td = document.createElement("td");
      td.textContent = content;
      tr.appendChild(td);
    });
    
    const ul = document.createElement("ul");
    ul.classList.add("list-group");
    ul.classList.add("kcitems");
    collapse.appendChild(ul);
    
    _.sortBy(recipe.items, (item) => 10 - item.result).forEach((item) => {
      if (item.result === 0) {
        return;
      }
      
      const li = createItemElement(item.data);
      li.insertBefore(document.createTextNode(`${RESULT_TABLE[item.result]} `), li.firstChild);
      
      if (item.target) {
        li.classList.add("target-item");
      }
      
      ul.appendChild(li);
    });
    
    recipePanels.appendChild(panel);
  });
}

$.getJSON("data.json").done((data) => {
  recipeData = data;
  recipeDataTable = generateRecipeDataTable();
  
  initItemList();
  updateResult();
  
  _.toArray(document.querySelectorAll(".loading")).forEach((ele) => {
    ele.classList.remove("loading");
  });
});
