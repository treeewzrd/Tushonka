import os

# Use test settings so we don't connect to the actual database.
os.environ["JWT_SECRET_KEY"] = "tushonka-local-testing-key-2026-only"
os.environ["DATABASE_URL"] = "sqlite://"

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base
from main import app, get_db, limiter
from database import engine as app_engine

# Make sure the tests are using SQLite.
assert app_engine.dialect.name == "sqlite", (
    "Security tests must not initialize against PostgreSQL"
)


engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSession = sessionmaker(bind=engine, autoflush=False)

def override_get_db():
    with TestingSession() as db:
        yield db


app.dependency_overrides[get_db] = override_get_db

# Check that repeated failed logins get blocked.
def test_login_rate_limit():
    Base.metadata.create_all(bind=engine)
    limiter.reset()

    try:
        with TestClient(app) as client:
            for _ in range(5):
                response = client.post(
                    "/login",
                    json={
                        "username": "nonexistent",
                        "password": "wrongpassword",
                    },
                )
                assert response.status_code == 401

            response = client.post(
                "/login",
                json={
                    "username": "nonexistent",
                    "password": "wrongpassword",
                },
            )
            assert response.status_code == 429
    finally:
        Base.metadata.drop_all(bind=engine)
        limiter.reset()


# Check that too many registrations get blocked.
def test_registration_rate_limit():
    Base.metadata.create_all(bind=engine)
    limiter.reset()

    try:
        with TestClient(app) as client:
            for i in range(3):
                response = client.post(
                    "/users",
                    json={
                        "username": f"testuser{i}",
                        "password": "temporarypassword123",
                    },
                )
                assert response.status_code == 201

            response = client.post(
                "/users",
                json={
                    "username": "testuser4",
                    "password": "temporarypassword123",
                },
            )
            assert response.status_code == 429
    finally:
        Base.metadata.drop_all(bind=engine)
        limiter.reset()
