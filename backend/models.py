from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

# shared declarative base form database configuration
from database import Base


# user table definition
class User(Base):
    __tablename__ = "users"

    # primary key: uniquely identifies each user
    id: Mapped[int] = mapped_column(primary_key=True)

    # username: self explanatory
    username: Mapped[str] = mapped_column(String(50), unique=True)

    # stores the Argon2id password hash, never the plaintext password
    hashed_password: Mapped[str] = mapped_column(String(255))


class Encounter(Base):
    __tablename__ = "encounters"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    map_name: Mapped[str] = mapped_column(String(50))
    server_region: Mapped[str] = mapped_column(String(50))
    game_time: Mapped[str] = mapped_column(String(5))
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
