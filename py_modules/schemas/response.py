from dataclasses import dataclass
from typing import List
from .common import ChecksumAlgorithm, Game


@dataclass(slots=True)
class SessionInformation:
    date: str
    duration: float
    migrated: str | None
    checksum: str | None


@dataclass(slots=True)
class GamePlaytimeSummary:
    game: Game
    total_time: float


@dataclass(slots=True)
class GamePlaytimeDetails(GamePlaytimeSummary):
    sessions: List[SessionInformation]
    last_session: SessionInformation | None


@dataclass(slots=True)
class GamePlaytimeReport(GamePlaytimeSummary):
    last_played_date: str
    aliases_id: str | None


@dataclass(slots=True)
class DayStatistics:
    date: str
    games: List[GamePlaytimeDetails]
    total: float


@dataclass(slots=True)
class PagedDayStatistics:
    data: List[DayStatistics]
    has_prev: bool
    has_next: bool


@dataclass(slots=True)
class FileChecksum:
    game: Game
    checksum: str
    algorithm: ChecksumAlgorithm
    chunk_size: int
    created_at: None | str
    updated_at: None | str


@dataclass(slots=True)
class GameDictionary:
    game: Game
    files: List[FileChecksum]
