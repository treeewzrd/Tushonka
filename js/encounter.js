export function initEncounter({ showScreen }) {

    const startButton = document.getElementById('start-encounter');
    const backButton = document.getElementById('back-home');
    const encounterTimeDisplay = document.getElementById('encounter-time');
    const mapButtons = document.querySelectorAll('#map-options .map-option');
    const continueButton = document.getElementById('continue-encounter');
    const mapStep = document.getElementById('map-step');
    const serverStep = document.getElementById('server-step');
    const serverHeading = document.getElementById('server-heading');
    const selectedMapSummary = document.getElementById('selected-map-summary');
    const backMapButton = document.getElementById('back-map');

    let encounterTime = null;
    let selectedMap = null;

    const serverRegions = {
        'North America': [
            'North America Central',
            'North America South East',
            'North America West',
            'North America North East',
            'North America South',
            'Mexico',
        ],
        'South America': ['South America', 'Colombia'],
        Europe: [
            'Europe Central',
            'Europe North',
            'Europe West',
            'Europe East',
            'Europe South',
        ],
        Asia: [
            'Asia Central',
            'Japan',
            'Singapore',
            'China',
            'Korea',
            'Malaysia',
        ],
        Russia: ['Russia Central', 'Russia East', 'Russia West'],
        'Middle East': ['Middle East', 'Dubai'],
        Oceania: ['Australia', 'New Zealand'],
        Africa: ['Africa', 'Nigeria'],
    };

    const serverAreaOptions = document.getElementById('server-area-options');
    const serverRegionPicker = document.getElementById('server-region-picker');
    const serverAreaHeading = document.getElementById('server-area-heading');
    const serverRegionOptions = document.getElementById('server-region-options');
    const backServerAreas = document.getElementById('back-server-areas');
    const selectedServerSummary = document.getElementById('selected-server-summary');

    const continueServer = document.getElementById('continue-server');
    const gameTimeStep = document.getElementById('game-time-step');
    const gameTimeHeading = document.getElementById('game-time-heading');
    const gameTimeButtons = document.querySelectorAll('[data-game-time]');
    const backServer = document.getElementById('back-server');

    let selectedGameTime = null;
    let selectedServerArea = null;
    let selectedServerRegion = null;

    function renderButtons(container, choices, onSelect, selected = null) {
        container.replaceChildren();

        choices.forEach(choice => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'map-option';
            button.textContent = choice;
            button.setAttribute('aria-pressed', String(choice === selected));
            button.addEventListener('click', () => onSelect(choice));
            container.append(button);
        });
    }

    function showServerAreas() {
        serverAreaOptions.hidden = false;
        serverRegionPicker.hidden = true;

        renderButtons(
            serverAreaOptions,
            Object.keys(serverRegions),
            showServerRegions,
            selectedServerArea
        );
    }

    function showServerRegions(area) {
        if (selectedServerArea !== area) {
            selectedServerRegion = null;
            selectedServerSummary.textContent = '';
        }

        continueServer.disabled = selectedServerRegion === null;

        selectedServerArea = area;
        serverAreaOptions.hidden = true;
        serverRegionPicker.hidden = false;
        serverAreaHeading.textContent = area;

        renderButtons(
            serverRegionOptions,
            serverRegions[area],
            region => {
                selectedServerRegion = region;
                selectedServerSummary.textContent = `Selected region: ${region}`;

                continueServer.disabled = false;

                serverRegionOptions.querySelectorAll('button').forEach(button => {
                    button.setAttribute(
                        'aria-pressed',
                        String(button.textContent === region)
                    );
                });
            },
            selectedServerRegion
        );

        serverAreaHeading.focus();
    }

    backServerAreas.addEventListener('click', () => {
        showServerAreas();
        serverAreaOptions.querySelector('button').focus();
    });

    showServerAreas();

    function showLogging(isLogging) {
        showScreen(isLogging ? 'encounter' : 'home');

        if (isLogging) {
            backButton.focus();
        } else {
            startButton.focus();
        }
    }

    function showStep(step) {
        mapStep.hidden = step !== 'map';
        serverStep.hidden = step !== 'server';
        gameTimeStep.hidden = step !== 'game-time';
    }

    startButton.addEventListener('click', () => {
        selectedMap = null;
        selectedGameTime = null;
        continueServer.disabled = true;

        gameTimeButtons.forEach(button => {
            button.setAttribute('aria-pressed', 'false');
        });
        selectedServerArea = null;
        selectedServerRegion = null;
        selectedServerSummary.textContent = '';
        showServerAreas();
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
            const wasSelected = button.getAttribute('aria-pressed') === 'true';

            mapButtons.forEach(mapButton => {
                mapButton.setAttribute('aria-pressed', 'false');
            });

            selectedMap = wasSelected ? null : button.textContent.trim();
            continueButton.disabled = selectedMap === null;
            button.setAttribute('aria-pressed', String(!wasSelected));
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

    continueServer.addEventListener('click', () => {
        if (selectedServerRegion === null) return;

        showStep('game-time');
        gameTimeHeading.focus();
    });

    gameTimeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const value = button.dataset.gameTime;
            selectedGameTime = selectedGameTime === value ? null : value;

            gameTimeButtons.forEach(option => {
                option.setAttribute(
                    'aria-pressed',
                    String(option.dataset.gameTime === selectedGameTime)
                );
            });
        });
    });

    backServer.addEventListener('click', () => {
        showStep('server');
        continueServer.focus();
    });
}
