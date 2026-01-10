const tableNode = document.getElementById("table");

const pear = document.createElement("img");
pear.src = "images/pear.svg";

const fruit = [
  "apple",
  "banana",
  "pear",
  ].map(name => {
    let img = document.createElement("img");
    img.src = `images/${name}.svg`;
    return { name, contents: img };
  })

function chunk(n, arr) {
  const chunked = [];
  for(; arr.length > 0; arr = arr.slice(n)) {
    chunked.push(arr.slice(0, n));
  }
  return chunked;
}

function shuffle(arr) {
  return arr
    .map(el => ({ el, key: Math.random() }))
    .sort((x, y) => x.key - y.key)
    .map(tagged => tagged.el);
}

function makeTable(parent, spread, cls) {
  for (const row of spread) {
    const rowNode = document.createElement("tr");
    for (const { name, contents } of row) {
      const placeNode = document.createElement("td");
      const cardNode = document.createElement("div");
      cardNode.classList.add(cls);
      cardNode.setAttribute("card-name", name);
      cardNode.appendChild(contents.cloneNode(true));
      placeNode.appendChild(cardNode);
      rowNode.appendChild(placeNode);
    }
    parent.appendChild(rowNode);
  }
}

function composite(name, spread) {
  const compTable = document.createElement("table");
  compTable.classList.add("composite");
  makeTable(compTable, spread, "comp-ico");
  return { name, contents: compTable };
}

function names(spread) {
  return spread.map(row => row.map(card => card.name));
}

function genNormal(n, w) {
  let chosen = shuffle(fruit).slice(0, 3);
  return chunk(3, shuffle(chosen.concat(chosen)));
}

let currentLevel = 0;
let levelA, levelB, levelC;

function initializeLevels() {
  levelA = genNormal(3, 3);
  do {
    levelB = genNormal(3, 3);
  } while (names(levelA) == names(levelB))
  do {
    levelC = genNormal(3, 3);
  } while ([names(levelA), names(levelB)].includes(names(levelC)))
}

let clickHook = undefined;

function clickFirst(name) {
  clickHook = clickedCard => {
    let firstCard = document.querySelector(`[card-name=${name}]`);
    let firstCardParent = firstCard.parentElement;
    clickedCard.replaceWith(firstCard);
    firstCardParent.appendChild(clickedCard);
    clickHook = undefined;
    return firstCard;
  };
}

const levels = [
  () => levelA,
  () => levelA,
  () => levelA,
  () => {
    clickFirst("levelA");
    let types =
      Object.entries({ levelA, levelB, levelC }).map(e => composite(...e));
    return chunk(3, shuffle(types.concat(types)));
  },
  () => levelB,
  () => levelC,
];

function nextLevel() {
  return levels[currentLevel++ % levels.length]();
}

let selected = null;
let playing = true;

function deal() {
  tableNode.textContent = "";
  makeTable(tableNode, nextLevel(), "card");
  changeCards(true);
}

function changeCards(enter) {
  const keyframes = enter
    ? [{ translate: `0 1000px` }, {}]
    : [{}, { translate: `0 -1000px` }];
  const timing = { duration: 300, easing: "ease", fill: "both" };
  return Promise.all(Array.from(document.querySelectorAll(".card")).map(
    (card, i) => card.animate(keyframes, { delay: i*100, ...timing }).finished
  ));
}

function rotate(card, from, to, direction) {
  return card.animate(
    [{ transform: `rotateY(${from}deg)` }, { transform: `rotateY(${to}deg)` }],
    { duration: 100, easing: `ease-${direction}`, composite: "add" }
  ).finished;
}

async function flip(card) {
  await rotate(card, 180, 90, "in");
  card.classList.add("flipped");
  await rotate(card, 90, 0, "out");
}

async function unflip() {
  let flipped =
    Array.from(document.getElementsByClassName("flipped"))
      .filter(card => !card.classList.contains("matched"));
  await Promise.all(flipped.map(card => rotate(card, 0, 90, "in")));
  flipped.map(card => card.classList.remove("flipped"));
  await Promise.all(flipped.map(card => rotate(card, 90, 180, "out")));
  playing = true;
}

function checkFinished() {
  if (document.querySelectorAll(".card:not(.matched)").length == 0) {
    setTimeout(() => changeCards(false).then(deal), 1000);
  }
}

tableNode.onclick = event => {
  let target = event.target;

  if (!playing) return;
  if (!target.classList.contains("card")) return;
  if (target == selected) return;

  if (clickHook) target = clickHook(target) || target;

  if (selected == null) {
    unflip();
    selected = target;
  } else {
    if (target.getAttribute("card-name") == selected.getAttribute("card-name")) {
      target.classList.add("matched");
      selected.classList.add("matched");
      checkFinished();
    } else {
      setTimeout(unflip, 1000);
      playing = false;
    }
    selected = null;
  }
  flip(target);
};

initializeLevels();
deal();
