/*
  Declaration of global variables
*/

//Product info variables
let productName;
let productSubname;
let productPrice;
let productImage;

//Timeout IDs
let shakeTimeout;
let toastTimeout;
let warningTimeout;

/*
  Global variable constants
*/

//The day Remadle was launched. Used to find game number each day
const remadleStartDate = new Date("10/24/2025");
const gameNumber = getGameNumber();

//Elements with event listeners to play the game
const input = document.getElementById("guess-input");
const buttonInput = document.getElementById("guess-button");

const infoButton = document.getElementById("info-button");
infoButton.addEventListener("click", switchState);

const statButton = document.getElementById("stat-button");
statButton.addEventListener("click", switchState);

//User stats object
const userStats = JSON.parse(localStorage.getItem("stats")) || {
  numGames: 0,
  numWins: 0,
  winsInNum: [0, 0, 0, 0, 0, 0],
  currentStreak: 0,
  maxStreak: 0,
};

//User game state
const gameState = JSON.parse(localStorage.getItem("state")) || {
  gameNumber: -1,
  guesses: [],
  hasWon: false,
};

/*
  Starts playing the game. Called at beginning of execution
*/

playGame();

function playGame() {
  fetchGameData(getGameNumber());
}

/*
  Acquiring Game Data
*/

//Fetches the current day's game data from the json and starts game
function fetchGameData(gameNumber) {
  fetch("./games.json")
    .then((response) => response.json())
    .then((json) => {
      productName = json[`game-${gameNumber}`].name;
      productPrice = json[`game-${gameNumber}`].price;
      productSubname = json[`game-${gameNumber}`].subname.toUpperCase();
      productImage = json[`game-${gameNumber}`].image;

      initializeGame();
    });
}

/*
  Used to initialize the game board using the current game state
*/

function initializeGame() {
  //Reset game state and track new game if user last played on a previous day
  if (gameState.gameNumber !== gameNumber) {
    if (gameState.hasWon === false) {
      userStats.currentStreak = 0;
    }
    gameState.gameNumber = gameNumber;
    gameState.guesses = [];
    gameState.hasWon = false;
    userStats.numGames++;

    localStorage.setItem("stats", JSON.stringify(userStats));
    localStorage.setItem("state", JSON.stringify(gameState));
  }

  displayProductCard();

  updateGameBoard();

  if (gameState.guesses.length < 6 && !gameState.hasWon) {
    addEventListeners();
  } else {
    convertToShareButton();
  }
}

function convertToShareButton() {
  const containerElem = document.getElementById("input-container");
  const shareButtonElem = document.createElement("button");
  shareButtonElem.setAttribute("id", "share-button");
  containerElem.innerHTML = "";
  shareButtonElem.innerHTML = `Del
  <img src="./assets/share-icon.svg" class="share-icon" />`;
  shareButtonElem.addEventListener("click", copyStats);
  containerElem.appendChild(shareButtonElem);
}

function displayProductCard() {
  //First, update the image container with the new product image
  const imageContainer = document.getElementById("image-container");

  //Create a new image element to dynamically store game image
  const productImageElement = document.createElement("img");
  productImageElement.src = productImage;
  productImageElement.setAttribute("id", "product-image");

  //Add created image to the image container
  imageContainer.appendChild(productImageElement);

  //Select product info element and update the html to display product name
  const productInfo = document.getElementById("product-info");
  productInfo.innerHTML = `<center>${productName}<br />${productSubname}</center>`;
}

function updateGameBoard() {
  updateGuessStat();

  gameState.guesses.forEach((guess, index) => displayGuess(guess, index + 1));
}

function updateGuessStat() {
  const guessStats = document.getElementById("game-stats");
  if (gameState.hasWon) {
    guessStats.innerHTML = `<center>Du vandt! Tillykke!🎉</center>`;
    const formattedPrice = parseFloat(productPrice).toFixed(2).replace('.', ',');
    guessStats.innerHTML += `<center>Prisen var ${formattedPrice} kr.</center>`;
    return;
  }

  if (gameState.guesses.length === 6) {
    guessStats.innerHTML = `<center>Bedre held næste gang!</center>`;
    const formattedPrice = parseFloat(productPrice).toFixed(2).replace('.', ',');
    guessStats.innerHTML += `<center>Prisen var ${formattedPrice} kr.</center>`;
  } else {
    guessStats.innerHTML = `Gæt: ${gameState.guesses.length + 1}/6`;
  }
}

/*
  Event Listeners
*/

//Text input event listener to submit guess when user presses "Enter"
function inputEventListener(event) {
  if (event.key === "Enter") {
    handleInput();
  }
}

//Button event listener to submit guess when user presses guess button
function buttonEventListener() {
  handleInput();
}

function handleInput() {
  // Get the raw input value (which may contain commas for Danish formatting)
  const rawInput = input.value;
  
  // Convert comma to period for decimal separator and remove thousand separators (dots)
  const strippedString = rawInput.replace(/\./g, '').replace(',', '.');
  const guess = Number(strippedString).toFixed(2);

  if (isNaN(guess) || !strippedString) {
    displayWarning();
    return;
  }

  checkGuess(guess);

  input.value = "";

  function displayWarning() {
    clearTimeout(warningTimeout);

    const warningElem = document.getElementById("warning-toast");
    warningElem.classList.remove("hide");
    warningElem.classList.add("animate__flipInX");

    warningTimeout = setTimeout(() => {
      warningElem.classList.remove("animate__flipInX");
      warningElem.classList.add("animate__flipOutX");
      setTimeout(() => {
        warningElem.classList.remove("animate__flipOutX");
        warningElem.classList.add("hide");
      }, 1000);
    }, 2000);
  }
}

function copyStats() {
  const date = new Date();
  const formatted = new Intl.DateTimeFormat('da-DK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
  let output = `Remadle, ${formatted},`;
  if (!gameState.hasWon) {
    output += ` X/6\n`;
  } else {
    output += ` ${gameState.guesses.length}/6\n`;
  }

  gameState.guesses.forEach((guess) => {
    switch (guess.direction) {
      case "&uarr;":
        output += `⬆️`;
        break;
      case "&darr;":
        output += `⬇️`;
        break;
      case "&check;":
        output += `✅`;
        break;
    }

    switch (guess.closeness) {
      case "guess-far":
        output += `🟥`;
        break;
      case "guess-near":
        output += `🟨`;
        break;
    }
    output += `\n`;
  });

  const isMobile =
    navigator.userAgent.match(/Android/i) ||
    navigator.userAgent.match(/webOS/i) ||
    navigator.userAgent.match(/iPhone/i) ||
    navigator.userAgent.match(/iPad/i) ||
    navigator.userAgent.match(/iPod/i) ||
    navigator.userAgent.match(/BlackBerry/i) ||
    navigator.userAgent.match(/Windows Phone/i) ||
    navigator.userAgent.match(/IEMobile/i) ||
    navigator.userAgent.match(/Opera Mini/i);

  if (isMobile) {
    if (navigator.canShare) {
      navigator
        .share({
          title: "REMADLE",
          text: output,
          url: "https://remadle.fuglede.dk",
        })
        .catch((error) => console.error("Share failed:", error));
    }
  } else {
    output += `https://remadle.fuglede.dk`;
    navigator.clipboard.writeText(output);
    displayToast();
  }

  function displayToast() {
    clearTimeout(toastTimeout);

    const toastElem = document.getElementById("share-toast");
    toastElem.classList.remove("hide");
    toastElem.classList.add("animate__flipInX");

    toastTimeout = setTimeout(() => {
      toastElem.classList.remove("animate__flipInX");
      toastElem.classList.add("animate__flipOutX");
      setTimeout(() => {
        toastElem.classList.remove("animate__flipOutX");
        toastElem.classList.add("hide");
      }, 1000);
    }, 3000);
  }
}

function addEventListeners() {
  input.addEventListener("keydown", inputEventListener);
  buttonInput.addEventListener("click", buttonEventListener);

  input.addEventListener("focus", () => {
    input.setAttribute("placeholder", "0,00");
  });
  input.addEventListener("blur", () => {
    input.setAttribute("placeholder", "Indtast et gæt");
  });
}

function removeEventListeners() {
  buttonInput.setAttribute("disabled", "");
  buttonInput.classList.remove("active");
  input.setAttribute("disabled", "");
  input.setAttribute("placeholder", "Spillet er slut!");
  input.removeEventListener("keydown", inputEventListener);
  buttonInput.removeEventListener("click", buttonEventListener);
}

/*
  Handles the logic of Costocodle
  Creates a guess object based on user guess and checks win condition
*/

function checkGuess(guess) {
  const guessObj = { guess, closeness: "", direction: "" };

  const percentAway = calculatePercent(guess);

  if (Math.abs(percentAway) <= 5) {
    guessObj.closeness = "guess-win";
    gameState.hasWon = true;
  } else {
    shakeBox();
    if (Math.abs(percentAway) <= 25) {
      guessObj.closeness = "guess-near";
    } else {
      guessObj.closeness = "guess-far";
    }
  }

  if (gameState.hasWon) {
    guessObj.direction = "&check;";
  } else if (percentAway < 0) {
    guessObj.direction = "&uarr;";
  } else {
    guessObj.direction = "&darr;";
  }

  gameState.guesses.push(guessObj);
  localStorage.setItem("state", JSON.stringify(gameState));

  displayGuess(guessObj);

  if (gameState.hasWon) {
    gameWon();
  } else if (gameState.guesses.length === 6) {
    gameLost();
  }
}

/*
  Displays guess object from either game state or a new guess
*/

function displayGuess(guess, index = gameState.guesses.length) {
  const guessContainer = document.getElementById(index);
  const guessValueContainer = document.createElement("div");
  const infoContainer = document.createElement("div");

  guessValueContainer.classList.add(
    "guess-value-container",
    "animate__flipInX"
  );

  infoContainer.classList.add("guess-direction-container", "animate__flipInX");

  // Format the guess value in Danish currency format (12,00 kr.)
  const formattedGuess = parseFloat(guess.guess).toFixed(2).replace('.', ',');
  guessValueContainer.innerHTML = `${formattedGuess} kr.`;

  infoContainer.classList.add(guess.closeness);
  infoContainer.innerHTML = guess.direction;

  guessContainer.classList.add("animate__flipOutX");

  setTimeout(() => {
    guessContainer.classList.add("transparent-background");
    guessContainer.appendChild(guessValueContainer);
    guessContainer.appendChild(infoContainer);
  }, 500);

  updateGuessStat();
}

/*
  Helper function to compute guess accuracy
*/

function calculatePercent(guess) {
  return ((guess * 100) / (productPrice * 100)) * 100 - 100;
}

/* 
  End state function to handle win/loss conditions
*/

function gameWon() {
  userStats.numWins++;
  userStats.currentStreak++;
  userStats.winsInNum[gameState.guesses.length - 1]++;
  if (userStats.currentStreak > userStats.maxStreak) {
    userStats.maxStreak = userStats.currentStreak;
  }
  gameState.hasWon = true;

  localStorage.setItem("state", JSON.stringify(gameState));
  localStorage.setItem("stats", JSON.stringify(userStats));
  removeEventListeners();
  convertToShareButton();
}

function gameLost() {
  userStats.currentStreak = 0;

  localStorage.setItem("stats", JSON.stringify(userStats));

  removeEventListeners();
  convertToShareButton();
}

/*
  DOM manipulation functions for overlays and animations
*/

function switchState(event) {
  const overlayBtnClicked = event.currentTarget.dataset.overlay;
  const overlayElem = document.getElementById(overlayBtnClicked);
  const title = document.getElementById("title");

  if (title.classList.contains("info-title")) {
    title.classList.remove("info-title");
  }

  if (overlayElem.style.display === "flex") {
    title.innerHTML = `REMADLE`;
    overlayElem.style.display = "none";
    return;
  }

  if (overlayBtnClicked === "info-overlay") {
    document.getElementById("stats-overlay").style.display = "none";
    renderInfo();
  } else {
    document.getElementById("info-overlay").style.display = "none";
    renderStats();
  }

  function renderInfo() {
    title.innerHTML = `SÅDAN <span class="costco-blue">GØR</span> DU`;
    if (!title.classList.contains("info-title")) {
      title.classList.add("info-title");
    }
    overlayElem.style.display = "flex";
  }

  function renderStats() {
    title.innerHTML = `<span class="costco-blue">STATISTIK</span>`;

    renderStatistics();
    graphDistribution();

    overlayElem.style.display = "flex";

    function renderStatistics() {
      const numWinsElem = document.getElementById("number-wins");
      numWinsElem.innerHTML = `${userStats.numGames}`;

      const winPercentElem = document.getElementById("win-percent");
      if (userStats.numGames === 0) {
        winPercentElem.innerHTML = `0`;
      } else {
        winPercentElem.innerHTML = `${Math.round(
          (userStats.numWins / userStats.numGames) * 100
        )}`;
      }

      const currentStreakElem = document.getElementById("current-streak");
      currentStreakElem.innerHTML = `${userStats.currentStreak}`;

      const maxStreakElem = document.getElementById("max-streak");
      maxStreakElem.innerHTML = `${userStats.maxStreak}`;
    }

    function graphDistribution() {
      console.log("here");
      userStats.winsInNum.forEach((value, index) => {
        const graphElem = document.getElementById(`graph-${index + 1}`);
        if (userStats.numWins === 0) {
          graphElem.style = `width: 5%`;
        } else {
          graphElem.style = `width: ${
            Math.floor((value / userStats.numWins) * 0.95 * 100) + 5
          }%`;
        }
        graphElem.innerHTML = `${value}`;
      });
    }
  }
}

function shakeBox() {
  clearTimeout(shakeTimeout);
  const infoCard = document.getElementById("info-card");
  if (infoCard.classList.contains("animate__headShake")) {
    infoCard.classList.remove("animate__headShake");
  }
  shakeTimeout = setTimeout(
    () => infoCard.classList.add("animate__headShake"),
    100
  );
}

/*
  Finds current game number based off of Remadle start date
*/

function getGameNumber() {
  const currDate = new Date();
  let timeDifference = currDate.getTime() - remadleStartDate.getTime();
  let dayDifference = timeDifference / (1000 * 3600 * 24);

  return (Math.ceil(dayDifference)  % 3822) + 1;
}

