from typing import Literal

from pydantic import AwareDatetime, BaseModel, Field


# schema for incoming user creation requests
class UserCreate(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=12, max_length=128)


# Schema for user data returned by the API
class UserResponse(BaseModel):
    id: int
    username: str
    model_config = {"from_attributes": True}


# Schema for incoming partial user updates
class UserUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=1, max_length=50)


#
class UserLogin(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


class UserRename(BaseModel):
    username: str = Field(min_length=1, max_length=50)


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
