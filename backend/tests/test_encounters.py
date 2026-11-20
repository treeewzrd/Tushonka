import os
from datetime import datetime, timedelta, timezone

import jwt
import pytest

# Use SQLite so tests don't touch the actual database.
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["JWT_SECRET_KEY"] = "tushonka-local-testing-key-2026-only"

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base
from main import app, get_db, limiter, JWT_SECRET_KEY
from security import verify_password
from models import User, Encounter


PASSWORD = "Dummytestpw1312&"

ENCOUNTER = {
    "map_name": "Customs",
    "server_region": "US West",
    "game_time": "day",
    "occurred_at": "2026-11-18T12:00:00Z",
}


@pytest.fixture
def client():
    """Give each test its own database."""

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # SQLite drops timezone info, so restore UTC for these tests.
    def restore_utc(target, context, attrs=None):
        if target.occurred_at is not None:
            if target.occurred_at.tzinfo is None:
                target.occurred_at = target.occurred_at.replace(tzinfo=timezone.utc)

    event.listen(Encounter, "load", restore_utc)
    event.listen(Encounter, "refresh", restore_utc)

    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False)

    def override_get_db():
        with TestingSession() as db:
            yield db

    previous_override = app.dependency_overrides.get(get_db)
    previous_limiter_state = limiter.enabled

    app.dependency_overrides[get_db] = override_get_db

    # Rate limiting is already covered in test_security.py.
    limiter.enabled = False

    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        if previous_override is None:
            app.dependency_overrides.pop(get_db, None)
        else:
            app.dependency_overrides[get_db] = previous_override

        limiter.enabled = previous_limiter_state
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


def create_user(client, username):
    response = client.post(
        "/users",
        json={"username": username, "password": PASSWORD},
    )
    assert response.status_code == 201, response.text
    return response.json()


def user_headers(client, username):
    response = client.post(
        "/login",
        json={"username": username, "password": PASSWORD},
    )
    assert response.status_code == 200, response.text

    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def setup_user(client, username="testuser"):
    user = create_user(client, username)
    headers = user_headers(client, username)
    return user, headers


def create_encounter(client, headers, **changes):
    payload = {**ENCOUNTER, **changes}
    return client.post(
        "/encounters",
        json=payload,
        headers=headers,
    )


# Registration and login tests


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_registration(client):
    user = create_user(client, "alice")
    assert user["username"] == "alice"
    assert "hashed_password" not in user


def test_duplicate_registration(client):
    create_user(client, "alice")

    response = client.post(
        "/users",
        json={"username": "alice", "password": PASSWORD},
    )
    assert response.status_code == 409


def test_short_password_rejected(client):
    response = client.post(
        "/users",
        json={"username": "alice", "password": "short"},
    )
    assert response.status_code == 422


def test_password_is_hashed(client):
    create_user(client, "alice")

    # Check the password hash in the test database.
    db_generator = app.dependency_overrides[get_db]()
    db = next(db_generator)

    try:
        user = db.query(User).filter_by(username="alice").first()
        assert user.hashed_password != PASSWORD
        assert verify_password(PASSWORD, user.hashed_password)
    finally:
        db_generator.close()


def test_login_success(client):
    create_user(client, "alice")

    response = client.post(
        "/login",
        json={"username": "alice", "password": PASSWORD},
    )

    assert response.status_code == 200
    assert response.json()["token_type"] == "bearer"
    assert response.json()["access_token"]


def test_wrong_password(client):
    create_user(client, "alice")

    response = client.post(
        "/login",
        json={"username": "alice", "password": "WrongPassword123!"},
    )
    assert response.status_code == 401


def test_unknown_user_login(client):
    response = client.post(
        "/login",
        json={"username": "missing", "password": PASSWORD},
    )
    assert response.status_code == 401


def test_missing_token(client):
    response = client.get("/me")
    assert response.status_code == 401


def test_invalid_token(client):
    response = client.get(
        "/me",
        headers={"Authorization": "Bearer invalid.token.here"},
    )
    assert response.status_code == 401


def test_expired_token(client):
    user, _ = setup_user(client)

    expired = jwt.encode(
        {
            "sub": str(user["id"]),
            "exp": datetime.now(timezone.utc) - timedelta(minutes=1),
        },
        JWT_SECRET_KEY,
        algorithm="HS256",
    )

    response = client.get(
        "/me",
        headers={"Authorization": f"Bearer {expired}"},
    )
    assert response.status_code == 401


def test_forged_token(client):
    user, _ = setup_user(client)

    forged = jwt.encode(
        {
            "sub": str(user["id"]),
            "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
        },
        "wrong-signing-key-for-testing-2026",
        algorithm="HS256",
    )

    response = client.get(
        "/me",
        headers={"Authorization": f"Bearer {forged}"},
    )
    assert response.status_code == 401


# Check account access and permissions.


def test_me_returns_correct_user(client):
    user, headers = setup_user(client)

    response = client.get("/me", headers=headers)

    assert response.status_code == 200
    assert response.json()["id"] == user["id"]


def test_cannot_read_another_account(client):
    _, headers = setup_user(client, "alice")
    bob = create_user(client, "bob")

    response = client.get(
        f"/users/{bob['id']}",
        headers=headers,
    )
    assert response.status_code == 403


def test_cannot_delete_another_account(client):
    _, headers = setup_user(client, "alice")
    bob = create_user(client, "bob")

    response = client.delete(
        f"/users/{bob['id']}",
        headers=headers,
    )
    assert response.status_code == 403


def test_account_delete_invalidates_token(client):
    user, headers = setup_user(client)

    response = client.delete(
        f"/users/{user['id']}",
        headers=headers,
    )
    assert response.status_code == 204

    response = client.get("/me", headers=headers)
    assert response.status_code == 401


# Check encounter access and invalid inputs.


def test_encounter_requires_login(client):
    response = client.post("/encounters", json=ENCOUNTER)
    assert response.status_code == 401


def test_create_encounter(client):
    user, headers = setup_user(client)

    response = create_encounter(client, headers)

    assert response.status_code == 201
    assert response.json()["user_id"] == user["id"]
    assert response.json()["map_name"] == "Customs"


@pytest.mark.parametrize(
    "missing_field",
    ["map_name", "server_region", "game_time", "occurred_at"],
)
def test_missing_encounter_fields(client, missing_field):
    _, headers = setup_user(client)

    payload = ENCOUNTER.copy()
    del payload[missing_field]

    response = client.post(
        "/encounters",
        json=payload,
        headers=headers,
    )
    assert response.status_code == 422


def test_invalid_game_time(client):
    _, headers = setup_user(client)

    response = create_encounter(client, headers, game_time="morning")
    assert response.status_code == 422


def test_invalid_timestamp(client):
    _, headers = setup_user(client)

    response = create_encounter(client, headers, occurred_at="not-a-date")
    assert response.status_code == 422


def test_timezone_required(client):
    _, headers = setup_user(client)

    response = create_encounter(
        client,
        headers,
        occurred_at="2026-11-18T12:00:00",
    )
    assert response.status_code == 422


def test_extra_fields_rejected(client):
    _, headers = setup_user(client)

    response = create_encounter(client, headers, user_id=999)
    assert response.status_code == 422


# Encounter retrieval and ownership


def test_list_requires_login(client):
    response = client.get("/encounters")
    assert response.status_code == 401


def test_empty_encounter_list(client):
    _, headers = setup_user(client)

    response = client.get("/encounters", headers=headers)

    assert response.status_code == 200
    assert response.json() == []


def test_encounter_account_isolation(client):
    _, alice_headers = setup_user(client, "alice")
    _, bob_headers = setup_user(client, "bob")

    create_response = create_encounter(client, alice_headers)
    assert create_response.status_code == 201

    response = client.get(
        "/encounters",
        headers=bob_headers,
    )

    assert response.status_code == 200
    assert response.json() == []


def test_encounter_pagination(client):
    _, headers = setup_user(client)

    for i in range(3):
        response = create_encounter(client, headers, map_name=f"Map{i}")
        assert response.status_code == 201

    response = client.get(
        "/encounters?offset=0&limit=2",
        headers=headers,
    )
    assert response.status_code == 200
    assert len(response.json()) == 2

    response = client.get(
        "/encounters?offset=2&limit=2",
        headers=headers,
    )
    assert response.status_code == 200
    assert len(response.json()) == 1


@pytest.mark.parametrize(
    "query",
    [
        "offset=-1",
        "limit=0",
        "limit=101",
    ],
)
def test_invalid_pagination(client, query):
    _, headers = setup_user(client)

    response = client.get(
        f"/encounters?{query}",
        headers=headers,
    )
    assert response.status_code == 422


# Encounter deletion


def test_delete_own_encounter(client):
    _, headers = setup_user(client)

    created = create_encounter(client, headers)
    assert created.status_code == 201

    encounter_id = created.json()["id"]

    response = client.delete(
        f"/encounters/{encounter_id}",
        headers=headers,
    )
    assert response.status_code == 204

    remaining = client.get("/encounters", headers=headers)
    assert remaining.json() == []


def test_cannot_delete_another_users_encounter(client):
    _, alice_headers = setup_user(client, "alice")
    _, bob_headers = setup_user(client, "bob")

    created = create_encounter(client, alice_headers)
    assert created.status_code == 201

    encounter_id = created.json()["id"]

    response = client.delete(
        f"/encounters/{encounter_id}",
        headers=bob_headers,
    )
    assert response.status_code == 404

    remaining = client.get(
        "/encounters",
        headers=alice_headers,
    )
    assert len(remaining.json()) == 1


def test_delete_nonexistent_encounter(client):
    _, headers = setup_user(client)

    response = client.delete(
        "/encounters/999999",
        headers=headers,
    )
    assert response.status_code == 404


def test_delete_requires_login(client):
    response = client.delete("/encounters/1")
    assert response.status_code == 401
