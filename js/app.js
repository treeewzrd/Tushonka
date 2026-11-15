const homeSections = document.querySelectorAll('.home-section');
const loggingScreen = document.getElementById('logging-screen');
const startButton = document.getElementById('start-encounter');
const backButton = document.getElementById('back-home');
const encounterTimeDisplay = document.getElementById('encounter-time');
const mapButtons = document.querySelectorAll('.map-option');
const continueButton = document.getElementById('continue-encounter');
const mapStep = document.getElementById('map-step');
const serverStep = document.getElementById('server-step');
const serverHeading = document.getElementById('server-heading');
const selectedMapSummary = document.getElementById('selected-map-summary');
const backMapButton = document.getElementById('back-map');

let encounterTime = null;
let selectedMap = null;

function showLogging(isLogging) {
  homeSections.forEach(section => {
    section.hidden = isLogging;
  });

  loggingScreen.hidden = !isLogging;

  if (isLogging) {
    backButton.focus();
  } else {
    startButton.focus();
  }
}

function showStep(step) {
  mapStep.hidden = step !== 'map';
  serverStep.hidden = step !== 'server';
}

startButton.addEventListener('click', () => {
  selectedMap = null;
  continueButton.disabled = true;

  showStep('map');

  mapButtons.forEach(button => {
    button.setAttribute('aria-pressed', 'false');
  });

  encounterTime = new Date();
  encounterTimeDisplay.textContent = `Encounter time: ${encounterTime.toLocaleString()}`;
  showLogging(true);
});

backButton.addEventListener('click', () => {
  showLogging(false);
});

mapButtons.forEach(button => {
  button.addEventListener('click', () => {
    selectedMap = button.textContent.trim();
    continueButton.disabled = false;

    mapButtons.forEach(mapButton => {
      mapButton.setAttribute('aria-pressed', 'false');
    });

    button.setAttribute('aria-pressed', 'true');
  });
});

continueButton.addEventListener('click', () => {
  if (selectedMap === null) {
    return;
  }

  selectedMapSummary.textContent = `Selected map: ${selectedMap}`;
  showStep('server');
  serverHeading.focus();
});

backMapButton.addEventListener('click', () => {
  showStep('map');
  continueButton.focus();
});
