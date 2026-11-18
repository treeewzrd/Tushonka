from typing import Literal

from pydantic import AwareDatetime, BaseModel, Field, field_validator


def normalize_username(value: str) -> str:
    username = value.strip()

    if not username:
        raise ValueError("Username cannot be empty or whitespace")

    return username


# schema for incoming user creation requests
class UserCreate(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=12, max_length=128)

    @field_validator("username", mode="before")
    @classmethod
    def validate_username(cls, value: str) -> str:
        return normalize_username(value)

# Schema for user data returned by the API
class UserResponse(BaseModel):
    id: int
    username: str
    model_config = {"from_attributes": True}


# Schema for incoming partial user updates
class UserUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=1, max_length=50)

    @field_validator("username", mode="before")
    @classmethod
    def validate_username(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return normalize_username(value)


#
class UserLogin(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    password: str

    @field_validator("username", mode="before")
    @classmethod
    def validate_username(cls, value: str) -> str:
        return normalize_username(value)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


class UserRename(BaseModel):
    username: str = Field(min_length=1, max_length=50)

    @field_validator("username", mode="before")
    @classmethod
    def validate_username(cls, value: str) -> str:
        return normalize_username(value)


class EncounterCreate(BaseModel):
    map_name: str = Field(min_length=1, max_length=50)
    server_region: str = Field(min_length=1, max_length=50)
    game_time: Literal["day", "night"]
    occurred_at: AwareDatetime

    model_config = {
        "str_strip_whitespace": True,
        "extra": "forbid",
    }


class EncounterResponse(EncounterCreate):
    id: int
    user_id: int

    model_config = {
        "str_strip_whitespace": True,
        "extra": "forbid",
        "from_attributes": True,
    }
