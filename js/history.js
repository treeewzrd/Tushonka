const itemsPerPage = 8;
let currentPage = 0;
const data = JSON.parse(localStorage.getItem('results')) || [];

let pendingDeleteIndex = null;

document.getElementById('results').addEventListener('click', event => {
  const button = event.target.closest('[data-entry-index]');
  if (button) openDeleteEntryModal(Number(button.dataset.entryIndex));
});
renderHistory();

document.getElementById('previous-page').addEventListener('click', () => {
  if (currentPage > 0) currentPage--;
  renderHistory();
});

document.getElementById('next-page').addEventListener('click', () => {
  if ((currentPage + 1) * itemsPerPage < data.length) currentPage++;
  renderHistory();
});

document.getElementById('cancel-delete-entry').addEventListener('click', closeDeleteEntryModal);
document.getElementById('confirm-delete-entry').addEventListener('click', () => {
  if (pendingDeleteIndex === null) return;
  data.splice(pendingDeleteIndex, 1);
  localStorage.setItem('results', JSON.stringify(data));
  closeDeleteEntryModal();
  renderHistory();
});

document.getElementById('delete-all-btn').addEventListener('click', () => {
  document.getElementById('delete-all-modal').classList.add('is-active');
});

function escapeHtml(value) {
  const text = document.createElement('span');
  text.textContent = String(value);
  return text.innerHTML;
}

function displayEntries(data, page) {
  const resultsContainer = document.getElementById('results');
  const start = page * itemsPerPage;
  const currentData = [...data].reverse().slice(start, start + itemsPerPage);

  resultsContainer.innerHTML = currentData.length
    ? currentData.map((entry, index) => `
        <div class="result-item">
          <div class="result-number">Entry #${start + index + 1}</div>
          <p><strong>Time:</strong> ${escapeHtml(entry.time)}</p>
          <p><strong>Day:</strong> ${escapeHtml(entry.day)}</p>
          <p><strong>Server:</strong> ${escapeHtml(entry.server)}</p>
          <p><strong>Suspected encounters:</strong> ${escapeHtml(entry.suspectedEncounters ?? 'Not recorded')}</p>
          <button class="button is-danger delete-btn" data-entry-index="${data.length - 1 - start - index}">Delete Entry</button>
        </div>
      `).join('')
    : '<p>No more entries to show.</p>';
}

function openDeleteEntryModal(index) {
  pendingDeleteIndex = index;
  document.getElementById('delete-entry-modal').classList.add('is-active');
}

function closeDeleteEntryModal() {
  pendingDeleteIndex = null;
  document.getElementById('delete-entry-modal').classList.remove('is-active');
}

// Delete all data modal functionality
document.getElementById('confirm-delete-all').addEventListener('click', () => {
  localStorage.removeItem('results');
  data.length = 0;
  document.getElementById('delete-all-modal').classList.remove('is-active');
  renderHistory();
});

document.getElementById('cancel-delete-all').addEventListener('click', () => {
  document.getElementById('delete-all-modal').classList.remove('is-active');
});

function renderHistory() {
  currentPage = Math.min(currentPage, Math.max(0, Math.ceil(data.length / itemsPerPage) - 1));
  displayEntries(data, currentPage);
  document.getElementById('previous-page').disabled = currentPage === 0;
  document.getElementById('next-page').disabled = (currentPage + 1) * itemsPerPage >= data.length;
  document.getElementById('page-indicator').innerText = `Page ${currentPage + 1}`;
}
