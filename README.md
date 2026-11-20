# Tushonka

[![Backend Tests](https://github.com/treeewzrd/Tushonka/actions/workflows/tests.yml/badge.svg?branch=tushonka-rebuild)](https://github.com/treeewzrd/Tushonka/actions/workflows/tests.yml)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)

A personal encounter logger for **Escape from Tarkov**. Record suspected encounters, save them to your account, and review patterns across maps, server regions, and in-game Day/Night.

**Status:**  The core web-app, account, and reporting features are built. I accomplished what i set out to do. Future developments will be done after I work on some other projects and have time to think about future iplementation.

[Live application](https://tushonka-web.onrender.com) · [API documentation](https://tushonka-api.onrender.com/docs) · [Backend test workflow](https://github.com/treeewzrd/Tushonka/actions/workflows/tests.yml)

**Try it without an account:** Select **Preview app** to explore the dashboard and encounter-entry workflow. Logging in or creating an account is required to save encounters or access personal history and statistics.

[Features](#features) · [Screenshots](#screenshots) · [Architecture](#architecture-and-stack) · [Local setup](#run-locally) · [Testing](#testing)

## Why I built it and revisited it

I originally built Tushonka while playing a considerable amount of Tarkov. I wanted a personal record of suspected encounters to help me review patterns across maps, servers, and times. The documentation is intentionally detailed because I'm also using this project to practice technical documentation.

This was an old Project with no backend that i didnt ever get where i wanted it. After building an API **BASHTON**, I returned to apply what I had learned about API design, authentication, databases, and deployment. I adapted my existing backend foundation into an independent Tushonka API and replaced browser-local reports with account-owned PostgreSQL records.

The rebuild also separated page styling, API requests, authentication, encounter state, and navigation into clearer responsibilities. The result is a complete reporting workflow with persistent personal history.

I plan to revisit TUSHONKA as I develop new skills and ideas, possibly adapting it into a mobile app or expanding it to other games. For now, I'm shifting my focus toward application security and backend development. I've enjoyed the design side of things, but styling can be time-consuming, and I'd like to explore other aspects of software development. <|:-]

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

Access tokens expire after 15 minutes and are stored in browser `sessionStorage`. Encounter timestamps are stored with timezone information and displayed using the browser’s local formatting. This will change is development continues to support more users or phone/app development begins.

History requests a small page of records. Statistics fetch all account records in batches of 100 and calculate summaries in the browser. Current statistics use counters and ranked lists.

## Demo data and interpretation

The screenshot dataset includes synthetic encounter records generated for demonstration. These populate history and summaries so the interface can be shown with more than a few entries. They are not evidence of real cheating or a load test. The temporary seed script is not included as part of the application.

Personal summaries become more useful to explore as reports accumulate—for example, around 30–50 reports. the more the better—but this is a practical illustration.

Reports represent **suspected encounters**, not confirmed cheating. All statistics and recommendations are based on user opinions, not verified evidence.

In saying that, if you're someone who thinks everyone is always cheating and don't admit to your own limit-tations or "skill-issue" youre going to have a wide amount of false reports. watch playback, investigate profiles, and remember tarkov, tarkovs. Sometimes its just chance or the player has over 10k hrs. Sometimes theyre lv 10, w/ a 1.8 kd wiping the map.

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

Tushonka has **41 passing automated tests**, covering authentication, authorization, account management, encounter reporting, and PostgreSQL integration.

The full suite was verified locally using Python 3.12 and pytest.

**Latest local result: 41 passed, 0 failed, 0 skipped.**

### Test coverage

| Area | Verification |
| --- | --- |
| Registration | Account creation, duplicate usernames, input validation, and password hashing |
| Authentication | Valid and invalid credentials, missing tokens, expired tokens, and invalid signatures |
| Authorization | Account access restrictions, ownership checks, and token invalidation after account deletion |
| Rate limiting | Repeated login attempts and registrations return HTTP 429 when limits are exceeded |
| Encounter creation | Authentication requirements, required fields, valid inputs, and timestamp validation |
| Account isolation | Users cannot retrieve or delete another account's encounters |
| Encounter history | Empty results, pagination, and invalid query parameters |
| Encounter deletion | Successful deletion, nonexistent records, and unauthorized requests |
| PostgreSQL integration | Registration, login, authenticated access, and encounter persistence |

### Running the tests

From `backend/`, activate the virtual environment:

```bash
source .venv/bin/activate
python -m pytest -q
```

The standard suite uses isolated SQLite databases. PostgreSQL integration tests require a separate local test database configured through `POSTGRES_TEST_DATABASE_URL`.

Without that configuration, the two PostgreSQL integration tests are skipped.

### PostgreSQL verification

Two integration tests were completed successfully against a dedicated local PostgreSQL database.

These verify that authentication and encounter persistence work with PostgreSQL rather than relying entirely on SQLite.

The PostgreSQL test fixture only accepts local database connections and refuses databases containing existing tables.

### Test isolation

Tests use temporary accounts and dummy credentials. Production database credentials are not included in the repository.

Automated tests use isolated SQLite databases for API behavior and a dedicated PostgreSQL database for integration verification.

### Test files

| File | Purpose |
| --- | --- |
| `tests/test_security.py` | Login and registration rate limiting |
| `tests/test_encounters.py` | Authentication, authorization, encounter operations, validation, and pagination |
| `tests/test_postgresql.py` | PostgreSQL integration testing |

The existing GitHub Actions workflow runs backend tests automatically on pushes and pull requests. The expanded 41-test suite has been verified locally; the updated suite has also been verified by github actions.


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
