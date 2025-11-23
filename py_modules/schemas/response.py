from dataclasses import dataclass
from typing import List, Dict, Any
from .common import ChecksumAlgorithm, Game


@dataclass(slots=True)
class SessionInformation:
    date: str
    duration: float
    migrated: str | None
    checksum: str | None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "date": self.date,
            "duration": self.duration,
            "migrated": self.migrated,
            "checksum": self.checksum,
        }


@dataclass(slots=True)
class GamePlaytimeSummary:
    game: Game
    total_time: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "game": {"id": self.game.id, "name": self.game.name},
            "total_time": self.total_time,
        }


@dataclass(slots=True)
class GamePlaytimeDetails(GamePlaytimeSummary):
    sessions: List[SessionInformation]
    last_session: SessionInformation | None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "game": {"id": self.game.id, "name": self.game.name},
            "total_time": self.total_time,
            "sessions": [s.to_dict() for s in self.sessions],
            "last_session": self.last_session.to_dict() if self.last_session else None,
        }


@dataclass(slots=True)
class GamePlaytimeReport(GamePlaytimeSummary):
    last_played_date: str
    aliases_id: str | None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "game": {"id": self.game.id, "name": self.game.name},
            "total_time": self.total_time,
            "last_played_date": self.last_played_date,
            "aliases_id": self.aliases_id,
        }


@dataclass(slots=True)
class DayStatistics:
    date: str
    games: List[GamePlaytimeDetails]
    total: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "date": self.date,
            "games": [g.to_dict() for g in self.games],
            "total": self.total,
        }


@dataclass(slots=True)
class PagedDayStatistics:
    data: List[DayStatistics]
    has_prev: bool
    has_next: bool

    def to_dict(self) -> Dict[str, Any]:
        return {
            "data": [d.to_dict() for d in self.data],
            "has_prev": self.has_prev,
            "has_next": self.has_next,
        }


@dataclass(slots=True)
class FileChecksum:
    game: Game
    checksum: str
    algorithm: ChecksumAlgorithm
    chunk_size: int
    created_at: None | str
    updated_at: None | str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "game": {"id": self.game.id, "name": self.game.name},
            "checksum": self.checksum,
            "algorithm": self.algorithm,
            "chunk_size": self.chunk_size,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


@dataclass(slots=True)
class GameDictionary:
    game: Game
    files: List[FileChecksum]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "game": {"id": self.game.id, "name": self.game.name},
            "files": [f.to_dict() for f in self.files],
        }
