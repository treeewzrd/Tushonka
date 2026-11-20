import os

import pytest

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["JWT_SECRET_KEY"] = "tushonka-local-testing-key-2026-only"

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker

from database import Base
from main import app, get_db, limiter


PASSWORD = "Dummytestpw1312&"


@pytest.fixture
def pg_client():
    database_url = os.getenv("POSTGRES_TEST_DATABASE_URL")

    if not database_url:
        pytest.skip("Set POSTGRES_TEST_DATABASE_URL to run PostgreSQL tests")

    url = make_url(database_url)

    # Make sure tests only run on a local postgres test database.
    if not url.drivername.startswith("postgresql+psycopg"):
        pytest.fail("Test DB must use postgresql+psycopg")

    if url.host not in ("localhost", "127.0.0.1", "::1"):
        pytest.fail("Only local PostgreSQL testing is permitted")

    database_name = url.database or ""

    if not database_name.endswith(("_test", "_integration_check")):
        pytest.fail("Database name must end in _test or _integration_check")

    engine = create_engine(database_url)

    # Check for existing tables so we don't overwrite anything.
    try:
        if inspect(engine).get_table_names():
            pytest.fail("Test database must be empty before running")

        Base.metadata.create_all(bind=engine)

        TestingSession = sessionmaker(
            bind=engine,
            autoflush=False,
        )

        def override_get_db():
            with TestingSession() as db:
                yield db

        # Put the original settings back after the tests finish
        previous_override = app.dependency_overrides.get(get_db)
        previous_limiter_state = limiter.enabled

        app.dependency_overrides[get_db] = override_get_db
        limiter.enabled = False

        try:
            with TestClient(app) as client:
                yield client
        finally:
            if previous_override is None:
                app.dependency_overrides.pop(get_db, None)
            else:
                app.dependency_overrides[get_db] = previous_override

            limiter.enabled = previous_limiter_state
            Base.metadata.drop_all(bind=engine)
    finally:
        engine.dispose()


def test_postgresql_registration_and_login(pg_client):
    registration = pg_client.post(
        "/users",
        json={
            "username": "postgres_user",
            "password": PASSWORD,
        },
    )

    assert registration.status_code == 201

    login = pg_client.post(
        "/login",
        json={
            "username": "postgres_user",
            "password": PASSWORD,
        },
    )

    assert login.status_code == 200

    token = login.json()["access_token"]

    me = pg_client.get(
        "/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert me.status_code == 200
    assert me.json()["username"] == "postgres_user"


def test_postgresql_encounter_persistence(pg_client):
    registration = pg_client.post(
        "/users",
        json={
            "username": "encounter_user",
            "password": PASSWORD,
        },
    )

    assert registration.status_code == 201

    login = pg_client.post(
        "/login",
        json={
            "username": "encounter_user",
            "password": PASSWORD,
        },
    )

    assert login.status_code == 200

    headers = {"Authorization": (f"Bearer {login.json()['access_token']}")}

    encounter = pg_client.post(
        "/encounters",
        json={
            "map_name": "Customs",
            "server_region": "US West",
            "game_time": "night",
            "occurred_at": "2026-11-18T12:00:00Z",
        },
        headers=headers,
    )

    assert encounter.status_code == 201

    response = pg_client.get(
        "/encounters",
        headers=headers,
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["map_name"] == "Customs"
    assert response.json()[0]["game_time"] == "night"
