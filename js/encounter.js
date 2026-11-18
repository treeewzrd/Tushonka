import { createEncounter } from './api.js';
export function initEncounter({ showScreen, getAccessToken, requireLogin }) {
    const startButton = document.getElementById('start-encounter');
    const backButton = document.getElementById('back-home');
    const encounterTimeDisplay = document.getElementById('encounter-time');
    const mapButtons = document.querySelectorAll('#map-options .map-option');
    const mapStep = document.getElementById('map-step');
    const serverStep = document.getElementById('server-step');
    const serverHeading = document.getElementById('server-heading');
    const selectedMapSummary = document.getElementById('selected-map-summary');

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
    const selectedServerSummary = document.getElementById('selected-server-summary');

    const gameTimeStep = document.getElementById('game-time-step');
    const gameTimeHeading = document.getElementById('game-time-heading');
    const gameTimeButtons = document.querySelectorAll('[data-game-time]');
    const reviewStep = document.getElementById('review-step');
    const reviewHeading = document.getElementById('review-heading');
    const reviewMap = document.getElementById('review-map');
    const reviewRegion = document.getElementById('review-region');
    const reviewGameTime = document.getElementById('review-game-time');
    const reviewOccurredAt = document.getElementById('review-occurred-at');
    const backStepButton = document.getElementById('encounter-back');

    let selectedGameTime = null;
    let selectedServerArea = null;
    let selectedServerRegion = null;

    const saveButton = document.getElementById('save-encounter');
    const saveMessage = document.getElementById('save-message');

    let saveBusy = false;
    let encounterSaved = false;
    document.addEventListener('click', event => {
        if (saveBusy && event.target.closest('a')) {
            event.preventDefault();
        }
    }, { capture: true });

    let currentStep = 'map';

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

    function showStep(step) {
        currentStep = step;

        mapStep.hidden = step !== 'map';
        serverStep.hidden = step !== 'area' && step !== 'region';
        gameTimeStep.hidden = step !== 'game-time';
        reviewStep.hidden = step !== 'review';

        serverAreaOptions.hidden = step !== 'area';
        serverRegionPicker.hidden = step !== 'region';

        backStepButton.hidden = step === 'map';
        backStepButton.disabled = saveBusy || encounterSaved;

        if (step === 'area') {
        renderButtons(
            serverAreaOptions,
            Object.keys(serverRegions),
            area => {
                if (selectedServerArea !== area) {
                    selectedServerRegion = null;
                    selectedServerSummary.textContent = '';
                }

                selectedServerArea = area;
                showStep('region');
            },
            selectedServerArea
        );
        }

        if (step === 'region') {
            serverAreaHeading.textContent = selectedServerArea;

        renderButtons(
            serverRegionOptions,
            serverRegions[selectedServerArea],
            region => {
                selectedServerRegion = region;
                selectedServerSummary.textContent =
                    `Selected region: ${region}`;
                showStep('game-time');
            },
            selectedServerRegion
        );
        }

        if (step === 'review') {
            reviewMap.textContent = selectedMap;
            reviewRegion.textContent = selectedServerRegion;
            reviewGameTime.textContent =
                selectedGameTime === 'day' ? 'Day' : 'Night';
            reviewOccurredAt.textContent = encounterTime.toLocaleString();
    }

        const heading = {
            map: document.getElementById('map-heading'),
            area: serverHeading,
            region: serverAreaHeading,
            'game-time': gameTimeHeading,
            review: reviewHeading,
        }[step];

        heading.focus();
    }

    startButton.addEventListener('click', () => {
        if (saveBusy) return;

        encounterSaved = false;
        saveButton.disabled = false;
        saveMessage.textContent = '';

        selectedMap = null;
        selectedServerArea = null;
        selectedServerRegion = null;
        selectedGameTime = null;

        selectedServerSummary.textContent = '';
        selectedMapSummary.textContent = '';

        mapButtons.forEach(button => {
            button.setAttribute('aria-pressed', 'false');
        });

        gameTimeButtons.forEach(button => {
            button.setAttribute('aria-pressed', 'false');
        });

        encounterTime = new Date();
        encounterTimeDisplay.textContent =
            `Encounter time: ${encounterTime.toLocaleString()}`;

        showScreen('encounter');
        showStep('map');
    });

    backButton.addEventListener('click', () => {
        if (saveBusy) return;

        showScreen('home');
        startButton.focus();
    });

    backStepButton.addEventListener('click', () => {
        if (saveBusy || encounterSaved) return;

        const previousStep = {
            area: 'map',
            region: 'area',
            'game-time': 'region',
            review: 'game-time',
        }[currentStep];

        if (previousStep) showStep(previousStep);
    });

    mapButtons.forEach(button => {
        button.addEventListener('click', () => {
            selectedMap = button.textContent.trim();

            mapButtons.forEach(option => {
                option.setAttribute(
                    'aria-pressed',
                    String(option === button)
                );
            });

            selectedMapSummary.textContent =
                `Selected map: ${selectedMap}`;

            showStep('area');
        });
    });

    gameTimeButtons.forEach(button => {
        button.addEventListener('click', () => {
            selectedGameTime = button.dataset.gameTime;

            gameTimeButtons.forEach(option => {
                option.setAttribute(
                    'aria-pressed',
                    String(option === button)
                );
            });

            showStep('review');
        });
    });

    saveButton.addEventListener('click', async () => {
        if (saveBusy || encounterSaved) return;

        const accessToken = getAccessToken();

        if (!accessToken) {
            saveMessage.textContent =
                'Preview only — log in or create an account to save this report.';
            document.getElementById('show-login').click();
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
            backStepButton,
            document.getElementById('show-login'),
            document.getElementById('create-account'),
            document.getElementById('logout'),
        ];

        const previousDisabled = navigationButtons.map(button => button.disabled);
        navigationButtons.forEach(button => {
            button.disabled = true;
        });

        try {
            const response = await createEncounter(accessToken, encounter);

            if (response.status === 401) {
                requireLogin();
                return;
            }

            if (!response.ok) {
                throw new Error('Could not save the encounter. Please try again.');
            }

            encounterSaved = true;

            const savedEncounter = await response.json();

            window.location.assign(
                `results.html?saved=${encodeURIComponent(savedEncounter.id)}`
            );
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

            backStepButton.disabled = encounterSaved;
        }
    });
}
