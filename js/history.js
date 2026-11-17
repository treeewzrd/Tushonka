import { listEncounters, deleteEncounter } from './api.js';

const itemsPerPage = 8;
const results = document.getElementById('results');
const message = document.getElementById('history-message');
const previousButton = document.getElementById('previous-page');
const nextButton = document.getElementById('next-page');
const pageIndicator = document.getElementById('page-indicator');

let currentPage = 0;
let hasNextPage = false;
let busy = false;

function updateControls() {
  previousButton.disabled = busy || currentPage === 0;
  nextButton.disabled = busy || !hasNextPage;

  results.querySelectorAll('button').forEach(button => {
    button.disabled = busy;
  });
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

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'button is-danger';
    deleteButton.textContent = 'Delete encounter';
    deleteButton.addEventListener('click', () => {
      removeEncounter(entry);
    });
    card.append(deleteButton);

    results.append(card);
  });
}

async function removeEncounter(entry) {
  if (busy) return;

  const confirmed = window.confirm(
    `Delete the ${entry.map_name} encounter from ${new Date(entry.occurred_at).toLocaleString()
    }? This cannot be undone.`
  );

  if (!confirmed) return;

  const accessToken = sessionStorage.getItem('tushonka-token');

  if (!accessToken) {
    results.replaceChildren();
    message.textContent = 'Log in from the home page to delete encounters.';
    return;
  }

  busy = true;
  message.textContent = 'Deleting encounter…';
  updateControls();

  let deleted = false;

  try {
    const response = await deleteEncounter(accessToken, entry.id);

    if (response.status === 401) {
      results.replaceChildren();
      throw new Error('Your session expired. Log in again from the home page.');
    }

    if (response.status === 404) {
      throw new Error('This encounter is no longer available. Refresh the page to update the list.');
    }

    if (!response.ok) {
      throw new Error('Could not delete the encounter. Please try again.');
    }

    deleted = true;
  } catch (error) {
    message.textContent = error instanceof TypeError
      ? 'Could not confirm deletion. Refresh the page before trying again.'
      : error.message;
  } finally {
    busy = false;
    updateControls();
  }

  if (deleted) {
    await loadPage(0);
  }
}

async function loadPage(page) {
  if (busy) return;

  results.replaceChildren();
  pageIndicator.textContent = '';
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
      throw new Error('Could not load encounters. Refresh the page to try again.');
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
      ? 'Cannot reach the server. Check your connection and refresh the page.'
      : error.message;
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


loadPage(0);
