import { createEncounter } from './api.js';

export function initEncounter({ showScreen, getAccessToken }) {
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
    const continueGameTime = document.getElementById('continue-game-time');
    const reviewStep = document.getElementById('review-step');
    const reviewHeading = document.getElementById('review-heading');
    const reviewMap = document.getElementById('review-map');
    const reviewRegion = document.getElementById('review-region');
    const reviewGameTime = document.getElementById('review-game-time');
    const reviewOccurredAt = document.getElementById('review-occurred-at');
    const backGameTime = document.getElementById('back-game-time');
    let selectedGameTime = null;
    let selectedServerArea = null;
    let selectedServerRegion = null;
    const saveButton = document.getElementById('save-encounter');
    const saveMessage = document.getElementById('save-message');

    let saveBusy = false;
    let encounterSaved = false;

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
        reviewStep.hidden = step !== 'review';
    }

    startButton.addEventListener('click', () => {
        if (saveBusy) return;

        encounterSaved = false;
        saveButton.disabled = false;
        saveMessage.textContent = '';
        backGameTime.disabled = false;
        selectedMap = null;
        selectedGameTime = null;
        continueGameTime.disabled = true;
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
            continueGameTime.disabled = selectedGameTime === null;

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
    continueGameTime.addEventListener('click', () => {
        if (
            selectedMap === null ||
            selectedServerRegion === null ||
            selectedGameTime === null ||
            encounterTime === null
        ) {
            return;
        }

        reviewMap.textContent = selectedMap;
        reviewRegion.textContent = selectedServerRegion;
        reviewGameTime.textContent =
            selectedGameTime === 'day' ? 'Day' : 'Night';
        reviewOccurredAt.textContent = encounterTime.toLocaleString();

        showStep('review');
        reviewHeading.focus();
    });

    backGameTime.addEventListener('click', () => {
        showStep('game-time');
        continueGameTime.focus();
    });

    saveButton.addEventListener('click', async () => {
        if (saveBusy || encounterSaved) return;

        const accessToken = getAccessToken();

        if (!accessToken) {
            saveMessage.textContent =
                'Please log in before starting an encounter, or wait for your session check to finish.';
            return;
        }

        if (
            selectedMap === null ||
            selectedServerRegion === null ||
            selectedGameTime === null ||
            encounterTime === null
        ) {
            saveMessage.textContent = 'Complete the encounter details before saving.';
            return;
        }

        const encounter = {
            map_name: selectedMap,
            server_region: selectedServerRegion,
            game_time: selectedGameTime,
            occurred_at: encounterTime.toISOString(),
        };

        saveBusy = true;
        saveButton.disabled = true;
        saveMessage.textContent = 'Saving encounter…';

        const navigationButtons = [
            backButton,
            backGameTime,
            document.getElementById('show-login'),
            document.getElementById('logout'),
        ];

        const previousDisabled = navigationButtons.map(button => button.disabled);
        navigationButtons.forEach(button => {
            button.disabled = true;
        });

        try {
            const response = await createEncounter(accessToken, encounter);

            if (!response.ok) {
                throw new Error(
                    response.status === 401
                        ? 'Your session expired. Log in again before starting another encounter.'
                        : 'Could not save the encounter. Please try again.'
                );
            }

            encounterSaved = true;
            saveMessage.textContent = 'Encounter saved to your account.';
        } catch (error) {
            saveMessage.textContent = error instanceof TypeError
                ? 'Could not confirm the save. Check your connection and history before retrying.'
                : error.message;
        } finally {
            saveBusy = false;
            saveButton.disabled = encounterSaved;

            navigationButtons.forEach((button, index) => {
                button.disabled = previousDisabled[index];
            });

            backGameTime.disabled = encounterSaved;
        }
    });
}
