from dataclasses import dataclass

from .common import ChecksumAlgorithm, Game


@dataclass
class SessionInformation:
    date: str
    duration: float
    migrated: str | None
    checksum: str | None


@dataclass
class GamePlaytimeSummary:
    game: Game
    total_time: float


@dataclass
class GamePlaytimeDetails(GamePlaytimeSummary):
    sessions: list[SessionInformation]
    last_session: SessionInformation | None


@dataclass
class GamePlaytimeReport(GamePlaytimeSummary):
    last_played_date: str
    aliases_id: str | None


@dataclass
class DayStatistics:
    date: str
    games: list[GamePlaytimeDetails]
    total: float


@dataclass
class PagedDayStatistics:
    data: list[DayStatistics]
    has_prev: bool
    has_next: bool


@dataclass
class FileChecksum:
    game: Game
    checksum: str
    algorithm: ChecksumAlgorithm
    chunk_size: int
    created_at: None | str
    updated_at: None | str


@dataclass
class GameDictionary:
    game: Game
    files: list[FileChecksum]
