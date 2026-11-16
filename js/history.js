import { listEncounters } from './api.js';

const itemsPerPage = 8;
const results = document.getElementById('results');
const message = document.getElementById('history-message');
const previousButton = document.getElementById('previous-page');
const nextButton = document.getElementById('next-page');
const pageIndicator = document.getElementById('page-indicator');
const retryButton = document.getElementById('retry-history');

let currentPage = 0;
let hasNextPage = false;
let busy = false;

function updateControls() {
  previousButton.disabled = busy || currentPage === 0;
  nextButton.disabled = busy || !hasNextPage;
  retryButton.disabled = busy;
}

function renderEntries(entries) {
  results.replaceChildren();

  entries.forEach(entry => {
    const card = document.createElement('article');
    card.className = 'result-item';

    const heading = document.createElement('h2');
    heading.className = 'result-number';
    heading.textContent = entry.map_name;
    card.append(heading);

    const details = [
      ['Server', entry.server_region],
      ['In-game time', entry.game_time === 'day' ? 'Day' : 'Night'],
      ['Encounter time', new Date(entry.occurred_at).toLocaleString()],
      ['Record ID', entry.id],
    ];

    details.forEach(([label, value]) => {
      const paragraph = document.createElement('p');
      paragraph.textContent = `${label}: ${value}`;
      card.append(paragraph);
    });

    results.append(card);
  });
}

async function loadPage(page) {
  if (busy) return;

  results.replaceChildren();
  pageIndicator.textContent = '';
  retryButton.hidden = true;
  hasNextPage = false;

  const accessToken = sessionStorage.getItem('tushonka-token');

  if (!accessToken) {
    message.textContent = 'Log in from the home page to view your encounters.';
    updateControls();
    return;
  }

  busy = true;
  message.textContent = 'Loading encounters…';
  updateControls();

  try {
    const response = await listEncounters(
      accessToken,
      page * itemsPerPage,
      itemsPerPage + 1
    );

    if (response.status === 401) {
      message.textContent = 'Your session expired. Log in again from the home page.';
      return;
    }

    if (!response.ok) {
      throw new Error('Could not load encounters. Please retry.');
    }

    const entries = await response.json();

    currentPage = page;
    hasNextPage = entries.length > itemsPerPage;
    renderEntries(entries.slice(0, itemsPerPage));
    pageIndicator.textContent = `Page ${currentPage + 1}`;
    message.textContent = entries.length
      ? ''
      : 'No encounters on this page.';
  } catch (error) {
    message.textContent = error instanceof TypeError
      ? 'Cannot reach the server. Check your connection and retry.'
      : error.message;
    retryButton.hidden = false;
  } finally {
    busy = false;
    updateControls();
  }
}

previousButton.addEventListener('click', () => {
  if (currentPage > 0) loadPage(currentPage - 1);
});

nextButton.addEventListener('click', () => {
  if (hasNextPage) loadPage(currentPage + 1);
});

retryButton.addEventListener('click', () => {
  loadPage(currentPage);
});

loadPage(0);
