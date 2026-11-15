# Tushonka

A personal tracker for logging encounters with cheaters in Escape from Tarkov.

## Run locally

Open this folder in VS Code, right-click index.html, and choose **Open with Live Server**.
There is no build step or npm dependency installation.
Bulma, Google Fonts, Chart.js, and the results-page click sound load from external services.

## Current functionality

- index.html: record time block, weekday, server, and suspected encounter count.
- results.html: view report-count charts and the existing recommendations.
- data.html: browse saved reports and delete individual entries or all entries.

Reports are stored in this browser's localStorage under the results key. They do not sync
between devices or browser origins. Report counts alone do not establish encounter rates.

## Structure

- css/: page-specific styles, including the existing main-page theme in app.css.
- js/: reporting, charts, and history behavior.
- images/: existing artwork and branding assets.
No backend is connected.

The dashboard redesign, accounts, map selection, and profile time zones are planned.
The current form still uses the original time blocks.

## Verification

No automated test runner is configured. Check report submission, chart updates,
history pagination, cancellation, and deletion using Live Server.

## Earlier proposals to revisit

These ideas appeared in the old README and are not approved implementation work:

- Filters by server, time block, and weekday.
- CSV or Excel export of personal history.
- User feedback and requests for additional server options.
- A dark-mode preference.
- Live updates once a backend exists.

Charts and browser-local persistence already exist. The previous README's npm/Jest
instructions, CI badges, and LICENSE-file reference did not match files in this checkout
and were removed.
