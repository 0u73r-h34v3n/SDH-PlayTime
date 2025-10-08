from dataclasses import dataclass
from typing import List, Optional, TypedDict

from .common import Game


class AddTimeDict(TypedDict):
    started_at: int
    ended_at: int
    game_id: str
    game_name: str


class DailyStatisticsForPeriodDict(TypedDict):
    start_date: str
    end_date: str
    game_id: Optional[str]


@dataclass
class ApplyManualTimeCorrectionList:
    game: Game
    time: float


ApplyManualTimeCorrectionDict = List[ApplyManualTimeCorrectionList]

GetGameDTO = str

GetFileSHA256DTO = str


class AddGameChecksumDict(TypedDict):
    game_id: str
    checksum: str
    algorithm: str
    chunk_size: int
    created_at: Optional[str]
    updated_at: Optional[str]


class RemoveGameChecksumDTO(TypedDict):
    game_id: str
    checksum: str


RemoveAllGameChecksumsDTO = str
