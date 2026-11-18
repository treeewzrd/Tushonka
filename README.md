# Tushonka

[![Backend Tests](https://github.com/treeewzrd/Tushonka/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/treeewzrd/Tushonka/actions/workflows/tests.yml)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)

A personal encounter logger for **Escape from Tarkov**. Record suspected encounters, save them to your account, and review patterns across maps, server regions, and in-game Day/Night.

**Status:**  The core web-app, account, and reporting features are built. I accomplished what I set out to do. Future developments will be done after I work on some other projects and have time to think about future implementation.

[Live application](https://tushonka-web.onrender.com) · [API documentation](https://tushonka-api.onrender.com/docs) · [Backend test workflow](https://github.com/treeewzrd/Tushonka/actions/workflows/tests.yml)

**Try it without an account:** Select **Preview app** to explore the dashboard and encounter-entry workflow. Logging in or creating an account is required to save encounters or access personal history and statistics.

[Features](#features) · [Screenshots](#screenshots) · [Architecture](#architecture-and-stack) · [Local setup](#run-locally) · [Testing](#testing)

## Why I built it and revisited it

I originally built Tushonka while playing a considerable amount of Tarkov. I wanted a personal record of suspected encounters to help me review my own experience across maps, servers, and times.

This was one of my earliest projects. After building **[BASHTON](https://github.com/treeewzrd/BASHTON)**, I returned to apply what I had learned about API design, authentication, databases, and deployment. I adapted my existing backend foundation into an independent Tushonka API and replaced browser-local reports with account-owned PostgreSQL records.

The rebuild also separated page styling, API requests, authentication, encounter state, and navigation into clearer responsibilities. The result is a complete reporting workflow with persistent personal history. It was a real mess <|:-]

## Features

- Account creation, login, logout, and session restoration.
- Account-free preview of encounter creation.
- Guided entry: map → geographic area → server region → in-game Day/Night → review.
- Original encounter timestamp and selections preserved when moving back through report steps.
- Login or signup from a completed preview, returning to the preserved review before saving.
- Authenticated saving followed by the personal statistics page.
- Recent reports with eight entries per page and individual deletion.
- Personal totals, ranked map and region counts, Day/Night totals, and tied leaders.
- A most-recent-report panel with deletion targeting the displayed record.
- Loading, empty, expired-session, and request-error states.

## Screenshots

The walkthrough below follows the application from dashboard to reporting, post-submission review, statistics, history, and account navigation. Images retain their original proportions.

### Dashboard

<img src="screenshots/tushonkaindexhtml.png" width="800" alt="Tushonka dashboard with Report Encounter and personal history navigation">

### Start a report

<img src="screenshots/tushonkaindexhtml2.png" width="800" alt="Encounter map selection with the original encounter timestamp">

### Review and submit

<img src="screenshots/tushonkasubmitreport.png" width="800" alt="Review of map, server region, in-game time, and encounter timestamp before submission">

### After submission

Saving opens the statistics page, which includes the most recent encounter and an option to delete the displayed report.

<img src="screenshots/tushonkaraidstats1.png" width="800" alt="Personal statistics page showing the most recent raid report">

### Personal statistics

<img src="screenshots/tushonkareportsoverview.png" width="800" alt="Report totals, leading map and region, Day and Night counts, and ranked breakdowns">

### Recent encounters

<img src="screenshots/tushonkarecentraidreports.png" width="800" alt="Personal encounter history with individual delete controls">

### Login and preview access

<img src="screenshots/tushonkaloginpage.png" width="800" alt="Login screen with account creation and Preview app controls">

### Account navigation

<img src="screenshots/tushonkaaccountdropdownnavigation.png" width="650" alt="Account dropdown linking to dashboard, encounter entry, recent raids, and statistics">

### GitHub Actions

<img src="screenshots/tushonkagithubactions.png" width="650" alt="Successful Backend Tests workflow runs on the tushonka-rebuild branch">

## Architecture and stack

```text
Browser: HTML, CSS, JavaScript modules
                 |
          JSON / HTTP API
        JWT bearer authentication
                 |
       FastAPI + Pydantic
                 |
           SQLAlchemy
                 |
      PostgreSQL via Psycopg
```

| Layer | Implementation |
| --- | --- |
| Frontend | HTML, CSS, vanilla JavaScript modules; no frontend build step |
| Styling | Custom CSS, Bulma on history/statistics pages, Google Fonts |
| API | Python, FastAPI, Pydantic, Uvicorn |
| Persistence | SQLAlchemy, PostgreSQL, Psycopg |
| Authentication | PyJWT access tokens; Argon2id password hashing through pwdlib |
| Request limiting | SlowAPI limits on login and registration |
| Testing | pytest, FastAPI TestClient, HTTPX, isolated in-memory SQLite |
| Hosting | Render static frontend, Render API service, Neon PostgreSQL |
| CI | GitHub Actions with Python 3.12 |

The API derives encounter ownership from the authenticated account. Listing is filtered by owner, and deletion requires a matching record ID and owner.

Access tokens expire after 15 minutes and are stored in browser `sessionStorage`. Encounter timestamps are stored with timezone information and displayed using the browser’s local formatting. This will change if development continues to support more users or phone/app development begins.

History requests a small page of records. Statistics fetch all account records in batches of 100 and calculate summaries in the browser. Current statistics use counters and ranked lists.

## Demo data and interpretation

The screenshot dataset includes synthetic encounter records generated for demonstration. These populate history and summaries so the interface can be shown with more than a few entries. They are not evidence of real cheating or a load test. The temporary seed script is not included as part of the application.

Personal summaries become more useful to explore as reports accumulate—for example, around 30–50 reports—but this is a practical illustration, not a validated statistical threshold.

Reports represent **suspected encounters**, not confirmed cheating. All encounters submitted by users are speculative, and personal summaries reflect those reports.

## Run locally

Use Python 3.12 to match CI, a dedicated PostgreSQL database, and a static file server.

### Backend

From the repository root:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Configure `backend/.env` with your database connection and a random signing secret:

```dotenv
DATABASE_URL=postgresql+psycopg://USERNAME:PASSWORD@localhost:5432/DATABASE_NAME
JWT_SECRET_KEY=YOUR_RANDOM_SECRET
```

Generate a secret:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Initialize a new development database:

```bash
python -c "from database import Base, engine; import models; Base.metadata.create_all(bind=engine)"
```

This creates missing tables; it does not migrate existing schemas.

Start the API from `backend/`:

```bash
uvicorn main:app --reload
```

Interactive API documentation is available at [127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### Frontend

From the repository root, in another terminal:

```bash
python3 -m http.server 5500
```

Open [127.0.0.1:5500](http://127.0.0.1:5500). VS Code Live Server on the same port also works.

`js/api.js` selects the local API when the frontend hostname is `localhost` or `127.0.0.1`; otherwise, it selects the deployed API. Backend CORS permits both local frontend hostnames on port 5500 and the deployed frontend origin.

## Testing

The checked-in automated suite contains two API tests:

- Repeated failed login attempts reach the configured rate limit.
- Repeated account registrations reach the configured rate limit.

Run them from `backend/` with the virtual environment activated:

```bash
python -m pytest -q
```

Tests override database access with isolated in-memory SQLite and test-only configuration. GitHub Actions runs the suite on pushes and pull requests.

Development also included manual checks of account creation, login/logout, refresh persistence, account isolation, encounter saving, history, deletion, and preview navigation. These manual checks are separate from the automated suite.

Automated browser testing, comprehensive API coverage, and PostgreSQL integration tests are not currently included. Existing checks are not a full security audit.

## Deployment

The deployed application uses three separate services:

- **Render static site:** frontend HTML, CSS, JavaScript, and assets.
- **Render web service:** FastAPI backend.
- **Neon:** PostgreSQL database.

The backend requires `DATABASE_URL` and `JWT_SECRET_KEY`. Run it from `backend/` using:

```bash
uvicorn main:app --host 0.0.0.0 --port "$PORT"
```

For another deployment, update the hosted API address in `js/api.js` and allowed frontend origins in `backend/main.py`. Initialize the database schema separately and follow the database provider’s connection requirements.

Local and hosted databases are independent. Deploying code does not transfer local accounts or reports.

## Project structure

```text
index.html                  Dashboard, authentication, encounter entry
data.html                   Personal report history
results.html                Personal statistics
js/
  api.js                    Backend requests and API address selection
  app.js                    Main-screen coordination
  auth.js                   Account access and session handling
  encounter.js              Encounter state and reporting workflow
  history.js                Paginated history and deletion
  results.js                Personal summaries and latest report
css/                        Page styling
images/                     Application artwork
screenshots/                README walkthrough
backend/
  main.py                   API routes, ownership checks, rate limits
  models.py                 User and encounter database models
  schemas.py                Request and response validation
  security.py               Password hashing and access tokens
  database.py               Database engine and sessions
  tests/test_security.py    Login and registration rate-limit tests
.github/workflows/tests.yml Backend CI
```

## Scope and possible next steps

This first release focuses on personal encounter logging. Community aggregation, recommended and least-recommended maps, full raid tracking, filtering, and exports remain possible future work. Controls marked “Coming later” are placeholders.

Recommendations would require suitable participation data and a way to account for raids without reported encounters. Further development is open-ended.

## Credits

Created by **treeewzrd**.

Tushonka is an independent fan project and is not affiliated with or endorsed by Battlestate Games. Escape from Tarkov names and game imagery belong to their respective owners.
