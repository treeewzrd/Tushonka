# Tushonka

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)

A personal encounter logger for Escape from Tarkov. Record a suspected encounter, review the details, and save it to your account.

**Status:** actively being reworked. The core account and reporting features are connected; navigation, styling, and release testing are still in progress.

## Why I revisited it

Tushonka started as an older browser-only project. I came back to it to improve the structure, rebuild the reporting flow, and replace localStorage reports with account-owned records in PostgreSQL.

I adapted the backend from my Bastion project, then added encounter models and endpoints and connected them to Tushonka’s frontend. The rebuild has been a chance to work through authentication, ownership checks, pagination, and the less obvious parts of keeping a report intact while navigating between screens.

## Features

- Account creation with password confirmation and automatic login.
- Login, logout, and session restoration.
- Guided encounter entry: map, server region, in-game Day/Night, and review.
- Original encounter timestamp preserved through step navigation.
- Authenticated report saving.
- Personal report history with pagination and individual deletion.
- Personal report counts by map, region, and in-game Day/Night.
- Account-free preview of the encounter-entry flow.

Reports describe **suspected encounters**, not confirmed cheating. Report counts do not establish cheating rates or identify safer maps.

## Built with

- **Frontend:** HTML, CSS, vanilla JavaScript modules.
- **UI and charts:** Bulma, Google Fonts, Chart.js.
- **Backend:** Python, FastAPI, Pydantic, SQLAlchemy, Uvicorn.
- **Database:** PostgreSQL through Psycopg.
- **Authentication:** JWT access tokens and Argon2 password hashing through pwdlib.
- **Development:** VS Code, Live Server, Git, and FastAPI’s interactive API documentation.

There is no frontend build step. Some styles, fonts, and chart dependencies load from external services.

## Run locally

You’ll need Python 3.10+, PostgreSQL, and a static file server. VS Code’s Live Server works for the frontend.

### Backend

From the repository root:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

On Windows, activate the environment with `.venv\Scripts\activate`.

Create a dedicated PostgreSQL database and user, then edit `backend/.env`:

```dotenv
DATABASE_URL=postgresql+psycopg://USERNAME:PASSWORD@localhost:5432/DATABASE_NAME
JWT_SECRET_KEY=YOUR_RANDOM_SECRET
```

Generate a secret with:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

For a new development database, create the tables from the models:

```bash
python -c "from database import Base, engine; import models; Base.metadata.create_all(bind=engine)"
```

This creates missing tables; it does not migrate existing schemas.

Start the API from `backend/`:

```bash
uvicorn main:app --reload
```

API documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### Frontend

Open `index.html` with Live Server at:

```text
http://127.0.0.1:5500
```

The API currently allows that exact origin. Using `localhost` or another port requires updating CORS in `backend/main.py`.

The backend address is configured in `js/api.js`.

## Project structure

```text
index.html          Opening, dashboard, and encounter flow
data.html           Personal report history
results.html        Personal report counts
js/                 Authentication, API requests, and page behavior
css/                Page styles
images/             Development artwork and backgrounds
backend/            API, database models, validation, and authentication
```

## Testing

Testing so far has been manual, carried out by me during development.

I’ve checked account creation, login/logout, session restoration, encounter submission, history, deletion, and account isolation. I also checked the preview flow, automatic step navigation, Back and Cancel entry controls, and returning to a completed encounter after login or signup.

These are development checks, not independent user testing. Targeted error cases, pagination boundaries, and responsive layouts still need a final release pass.

Release checks include:

- Signup, invalid credentials, login, refresh, and logout.
- Preview → encounter review → authentication → saving.
- Preserved selections and original timestamp.
- History pagination beyond eight records.
- Deletion, cancellation, empty states, and request failures.
- Keyboard navigation and narrow-screen layouts.

No automated test suite is currently included. These manual checks are not a security audit.

## Deployment

Deployment is not configured yet. The application needs three parts: a static frontend, a Python API service, and PostgreSQL.

1. Provision PostgreSQL and configure the API service with `DATABASE_URL` and `JWT_SECRET_KEY`. Follow the database provider’s SSL requirements.
2. Install `backend/requirements.txt` and initialize a new database’s tables. Use migrations for later schema changes.
3. Run the API from `backend/` with:

   ```bash
   uvicorn main:app --host 0.0.0.0 --port "$PORT"
   ```

   Set `PORT` according to the hosting service. Do not use `--reload` in production.

4. Add the deployed frontend’s exact HTTPS origin to backend CORS.
5. Replace the local API address in `js/api.js` with the deployed HTTPS API address.
6. Publish only the frontend HTML, `css/`, `js/`, and required `images/` to the static host. Never publish `.env`, the virtual environment, or database credentials.
7. Test authentication, account isolation, saving, history, and deletion against the deployed app.

Frontend hosting and backend hosting are separate steps.

## Screenshots

Screenshots will be added after the layout pass:

- Signed-out opening and preview access.
- Encounter review.
- Personal report history.

A live demo link will be added after deployment.

## Next

- Finish preview-to-account navigation and session-expiration recovery.
- Replace separate Back controls with one shared Back arrow and Home/Cancel.
- Add compact submission confirmation.
- Finish responsive styling, keyboard behavior, and the available map choices.
- Add automated API and browser tests.

Later ideas include full raid tracking, filtering, exports, and community analysis. Recommendations need suitable data and methods before they become features.

Development images are placeholders. Final release artwork and attribution are still to be reviewed.
