import { getAllEncounters, deleteEncounter } from './api.js';
const message = document.getElementById('statistics-message');
const total = document.getElementById('report-total');
const savedReportMessage = document.getElementById('saved-report-message');
const deleteLastButton = document.getElementById('delete-last-encounter');

const latestEncounter = document.getElementById('latest-encounter');
const latestDetails = document.getElementById('latest-encounter-details');
let savedEncounterId = null;

function showLatestEncounter(entry) {
  savedEncounterId = entry?.id ?? null;
  latestEncounter.hidden = !entry;
  deleteLastButton.hidden = !entry;
  latestDetails.replaceChildren();
  if (!entry) return;

  const fields = [
    ['Map', entry.map_name],
    ['Server region', entry.server_region],
    ['In-game time', entry.game_time === 'day' ? 'Day' : 'Night'],
    ['Encounter time', new Date(entry.occurred_at).toLocaleString()],
  ];
  fields.forEach(([label, value]) => {
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = label;
    description.textContent = value;
    latestDetails.append(term, description);
  });
}

const summary = document.getElementById('personal-summary');
let busy = false;

function countBy(entries, getLabel) {
  const counts = new Map();

  entries.forEach(entry => {
    const label = getLabel(entry);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  return counts;
}

function rankedCounts(entries, getLabel) {
  return [...countBy(entries, getLabel)].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function renderBreakdown(id, counts) {
  const list = document.getElementById(id);
  list.replaceChildren();
  counts.forEach(([label, count]) => {
    const row = document.createElement('li');
    const name = document.createElement('span');
    const value = document.createElement('span');
    name.textContent = label;
    value.textContent = `${count} ${count === 1 ? 'report' : 'reports'}`;
    row.append(name, value);
    list.append(row);
  });
}

function renderSummary(entries) {
  const maps = rankedCounts(entries, entry => entry.map_name);
  const regions = rankedCounts(entries, entry => entry.server_region);
  const times = countBy(entries, entry => entry.game_time);
  const topLabel = counts => {
    if (!counts.length) return 'No reports yet';
    const leaders = counts.filter(item => item[1] === counts[0][1]);
    return `${leaders.map(item => item[0]).join(' / ')} (${counts[0][1]})${leaders.length > 1 ? ' — tied' : ''}`;
  };
  total.textContent = String(entries.length);
  document.getElementById('top-map').textContent = topLabel(maps);
  document.getElementById('top-region').textContent = topLabel(regions);
  document.getElementById('time-counts').textContent = `${times.get('day') ?? 0} Day / ${times.get('night') ?? 0} Night`;
  renderBreakdown('map-breakdown', maps);
  renderBreakdown('region-breakdown', regions);
  summary.hidden = false;
}

async function loadStatistics() {
  if (busy) return;

  busy = true;
  total.textContent = '';
  showLatestEncounter(null);
  summary.hidden = true;

  try {
    const accessToken = sessionStorage.getItem('tushonka-token');

    if (!accessToken) {
      message.textContent =
        'Log in from the home page to view your statistics.';
      return;
    }

    message.textContent = 'Loading your raid reports…';

    const entries = await getAllEncounters(accessToken);

    renderSummary(entries);
    if (entries.length === 0) {
      message.textContent = 'Save your first raid report to see statistics.';
      return;
    }
    // The API orders encounters by timestamp descending, then ID descending.
    showLatestEncounter(entries[0]);
    message.textContent = '';
  } catch (error) {
    summary.hidden = true;
    message.textContent = error instanceof TypeError
      ? 'Cannot reach the server. Check your connection and refresh the page.'
      : error.message;
  } finally {
    busy = false;
  }
}
deleteLastButton.addEventListener('click', async () => {
  if (busy || savedEncounterId === null) return;

  if (!window.confirm('Delete the encounter shown above? This cannot be undone.')) {
    return;
  }

  const accessToken = sessionStorage.getItem('tushonka-token');

  if (!accessToken) {
    savedReportMessage.textContent = 'Log in again to delete this report.';
    return;
  }

  busy = true;
  deleteLastButton.disabled = true;
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

    showLatestEncounter(null);
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
  }

  if (deleted) await loadStatistics();
});
loadStatistics();
