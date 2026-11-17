import { getAllEncounters, deleteEncounter } from './api.js';
const message = document.getElementById('statistics-message');
const total = document.getElementById('report-total');
const retryButton = document.getElementById('retry-statistics');
const savedReportMessage = document.getElementById('saved-report-message');
const deleteLastButton = document.getElementById('delete-last-encounter');

const savedIdValue = new URLSearchParams(window.location.search).get('saved');
let savedEncounterId = Number(savedIdValue);

if (!Number.isSafeInteger(savedEncounterId) || savedEncounterId <= 0) {
  savedEncounterId = null;
}

const charts = [];
let busy = false;

function countBy(entries, getLabel) {
  const counts = new Map();

  entries.forEach(entry => {
    const label = getLabel(entry);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  return counts;
}

function createChart(id, counts) {
  const chart = new window.Chart(document.getElementById(id), {
    type: 'bar',
    data: {
      labels: [...counts.keys()],
      datasets: [{
        label: 'Raid reports',
        data: [...counts.values()],
        backgroundColor: '#b7c18e',
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 },
        },
      },
    },
  });

  charts.push(chart);
}

async function loadStatistics() {
  if (busy) return;

  busy = true;
  retryButton.hidden = true;
  total.textContent = '';
  charts.forEach(chart => chart.destroy());
  charts.length = 0;

  try {
    const accessToken = sessionStorage.getItem('tushonka-token');

    if (!accessToken) {
      message.textContent =
        'Log in from the home page to view your statistics.';
      return;
    }

    if (typeof window.Chart !== 'function') {
      throw new Error('The chart library did not load. Refresh the page to retry.');
    }

    message.textContent = 'Loading your raid reports…';

    const entries = await getAllEncounters(accessToken);

    if (entries.length === 0) {
      message.textContent = 'Save your first raid report to see statistics.';
      return;
    }
    deleteLastButton.hidden = !entries.some(
      entry => entry.id === savedEncounterId
    );

    if (!deleteLastButton.hidden) {
      savedReportMessage.textContent =
        'Your encounter was saved. You can delete that report below if it was incorrect.';
    }
    createChart(
      'map-chart',
      countBy(entries, entry => entry.map_name)
    );

    createChart(
      'game-time-chart',
      countBy(entries, entry => entry.game_time === 'day' ? 'Day' : 'Night')
    );

    createChart(
      'server-chart',
      countBy(entries, entry => entry.server_region)
    );

    total.textContent = `${entries.length} saved raid reports`;
    message.textContent =
      'Counts reflect your saved reports. They do not measure cheating rates.';
  } catch (error) {
    charts.forEach(chart => chart.destroy());
    charts.length = 0;
    message.textContent = error instanceof TypeError
      ? 'Cannot reach the server. Check your connection and retry.'
      : error.message;
    retryButton.hidden = false;
  } finally {
    busy = false;
  }
}
deleteLastButton.addEventListener('click', async () => {
  if (busy || savedEncounterId === null) return;

  if (!window.confirm('Delete the report you just saved? This cannot be undone.')) {
    return;
  }

  const accessToken = sessionStorage.getItem('tushonka-token');

  if (!accessToken) {
    savedReportMessage.textContent = 'Log in again to delete this report.';
    return;
  }

  busy = true;
  deleteLastButton.disabled = true;
  retryButton.disabled = true;
  savedReportMessage.textContent = 'Deleting report…';

  let deleted = false;

  try {
    const response = await deleteEncounter(accessToken, savedEncounterId);

    if (!response.ok && response.status !== 404) {
      throw new Error(
        response.status === 401
          ? 'Your session expired. Log in again to delete this report.'
          : 'Could not delete the report. Please try again.'
      );
    }

    savedEncounterId = null;
    deleteLastButton.hidden = true;
    window.history.replaceState(null, '', window.location.pathname);
    savedReportMessage.textContent = response.status === 404
      ? 'That report is already gone.'
      : 'Report deleted.';
    deleted = true;
  } catch (error) {
    savedReportMessage.textContent = error instanceof TypeError
      ? 'Could not confirm deletion. Check Recent Raid Reports before retrying.'
      : error.message;
  } finally {
    busy = false;
    deleteLastButton.disabled = false;
    retryButton.disabled = false;
  }

  if (deleted) await loadStatistics();
});
retryButton.addEventListener('click', loadStatistics);
loadStatistics();
