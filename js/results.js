function playClickSound() {
  const clickSound = new Audio('https://www.soundjay.com/button/beep-07.wav'); // URL for the click sound
  clickSound.play().catch(() => {});
}

document.addEventListener('DOMContentLoaded', () => {

  const buttons = document.querySelectorAll('.button');
  buttons.forEach(button => {
    button.addEventListener('click', playClickSound);
  });

  const results = JSON.parse(localStorage.getItem('results')) || [];

  const timeOfDayCounts = {
    '0HRS-600HRS': 0,
    '700HRS-1200HRS': 0,
    '1300HRS-1800HRS': 0,
    '1900HRS-2400HRS': 0
  };
  const dayOfWeekCounts = {
    'Monday': 0,
    'Tuesday': 0,
    'Wednesday': 0,
    'Thursday': 0,
    'Friday': 0,
    'Saturday': 0,
    'Sunday': 0
  };
  const serverCounts = {
    'EAST': 0,
    'WEST': 0,
    'CENTRAL': 0,
    'SOUTH': 0,
    'SOUTHEAST': 0,
    'SOUTHWEST': 0
  };

  results.forEach(report => {
    if (Object.hasOwn(timeOfDayCounts, report.time)) timeOfDayCounts[report.time]++;
    if (Object.hasOwn(dayOfWeekCounts, report.day)) dayOfWeekCounts[report.day]++;
    if (Object.hasOwn(serverCounts, report.server)) serverCounts[report.server]++;
  });

  function showLeastReported(id, counts) {
    const labels = Object.keys(counts);
    const hasReports = Object.values(counts).some(count => count > 0);
    document.getElementById(id).textContent = hasReports
      ? labels.reduce((a, b) => counts[a] < counts[b] ? a : b)
      : 'No reports yet';
  }

  showLeastReported('best-server', serverCounts);
  showLeastReported('best-time', timeOfDayCounts);
  showLeastReported('best-day', dayOfWeekCounts);

  function createPieChart(id, counts, label, colors) {
    new Chart(document.getElementById(id), {
      type: 'pie',
      data: {
        labels: Object.keys(counts),
        datasets: [{ label, data: Object.values(counts), backgroundColor: colors }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          tooltip: { callbacks: { label: context => `${context.label}: ${context.raw} reports` } }
        }
      }
    });
  }

  const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#FF9F40', '#4BC0C0', '#9966FF', '#FF66B2'];
  createPieChart('time-of-day-chart', timeOfDayCounts, 'Entries by Time of Day', colors);
  createPieChart('day-of-week-chart', dayOfWeekCounts, 'Entries by Day of Week', colors);
  createPieChart('server-chart', serverCounts, 'Entries by Server', colors);
});
