from py_modules.db.dao import Dao
from typing import Dict, List
import dataclasses
from py_modules.schemas.common import Game
from py_modules.schemas.response import (
    FileChecksum,
    GameDictionary,
    GamePlaytimeSummary,
)
from py_modules.dto.save_game_checksum import AddGameChecksumDTO


class Games:
    __slots__ = ("dao",)
    dao: Dao

    def __init__(self, dao: Dao) -> None:
        self.dao = dao

    def get_by_id(self, game_id: str) -> GamePlaytimeSummary | None:
        response = self.dao.get_game(game_id)

        if response is None:
            return None

        return GamePlaytimeSummary(
            Game(response.game_id, response.name), total_time=response.time
        )

    def get_dictionary(self) -> List[Dict[str, GameDictionary]]:
        data = self.dao.get_games_dictionary()

        result: List[Dict[str, GameDictionary]] = []

        for game in data:
            game_files_checksum = self.dao.get_game_files_checksum(game.id)

            # Use generator expression to avoid building intermediate list
            file_checksums = (
                FileChecksum(
                    Game(gfc.game_id, gfc.game_name),
                    gfc.checksum,
                    gfc.algorithm,
                    gfc.chunk_size,
                    gfc.created_at,
                    gfc.updated_at,
                )
                for gfc in game_files_checksum
            )

            result.append(
                GameDictionary(
                    Game(game.id, game.name), files=list(file_checksums)
                ).to_dict()
            )

        return result

    def save_game_checksum(
        self,
        game_id: str,
        hash_checksum: str,
        hash_algorithm: str,
        hash_chunk_size: int,
        hash_created_at: None | str,
        hash_updated_at: None | str,
    ):
        self.dao.save_game_checksum(
            game_id,
            hash_checksum,
            hash_algorithm,
            hash_chunk_size,
            hash_created_at,
            hash_updated_at,
        )

    def save_game_checksum_bulk(self, checksums: List[AddGameChecksumDTO]):
        checksums_data = [
            (
                dto.game_id,
                dto.checksum,
                dto.algorithm,
                dto.chunk_size,
                dto.created_at,
                dto.updated_at,
            )
            for dto in checksums
        ]

        self.dao.save_game_checksum_bulk(checksums_data)

    def remove_game_checksum(self, game_id: str, checksum: str):
        self.dao.remove_game_checksum(game_id, checksum)

    def remove_all_game_checksums(self, game_id: str):
        self.dao.remove_all_game_checksums(game_id)

    def remove_all_checksums(self):
        return self.dao.remove_all_checksums()

    def get_games_checksum(self):
        games_checksum_without_game_dict = self.dao.get_games_checksum()

        # TODO: Add test case to check if name is correct
        return [
            FileChecksum(
                Game(
                    game.game_id,
                    game.game_name if game.game_name is not None else "[Unknown name]",
                ),
                game.checksum,
                game.algorithm,
                game.chunk_size,
                game.created_at,
                game.updated_at,
            ).to_dict()
            for game in games_checksum_without_game_dict
        ]

    def link_game_to_game_with_checksum(self, child_game_id: str, parent_game_id: str):
        parent_game = self.dao.get_game(parent_game_id)

        if not parent_game or parent_game.name is None:
            raise ValueError(
                f"Cannot link game '{child_game_id}' to parent '{parent_game_id}'. Parent game does not exist or has invalid name."
            )

        # Now link the checksum
        return self.dao.link_game_to_game_with_checksum(child_game_id, parent_game_id)
