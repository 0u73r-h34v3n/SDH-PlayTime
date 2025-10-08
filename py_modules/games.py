import dataclasses
from typing import Dict, List

from py_modules.db.dao import Dao
from py_modules.dto.save_game_checksum import AddGameChecksumDTO
from py_modules.schemas.common import Game
from py_modules.schemas.response import (
    FileChecksum,
    GameDictionary,
    GamePlaytimeSummary,
)


class Games:
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
            file_checksum_list: List[FileChecksum] = []

            for game_file_checksum in game_files_checksum:
                file_checksum_list.append(
                    FileChecksum(
                        Game(game_file_checksum.game_id, game_file_checksum.game_name),
                        game_file_checksum.checksum,
                        game_file_checksum.algorithm,
                        game_file_checksum.chunk_size,
                        game_file_checksum.created_at,
                        game_file_checksum.updated_at,
                    )
                )

            result.append(
                dataclasses.asdict(
                    GameDictionary(Game(game.id, game.name), files=file_checksum_list)
                )
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
        result = []

        for game in games_checksum_without_game_dict:
            result.append(
                dataclasses.asdict(
                    FileChecksum(
                        # TODO: Add test case to check if name is correct
                        Game(
                            game.game_id,
                            (
                                game.game_name
                                if game.game_name is not None
                                else "[Unknown name]"
                            ),
                        ),
                        game.checksum,
                        game.algorithm,
                        game.chunk_size,
                        game.created_at,
                        game.updated_at,
                    )
                )
            )

        return result

    def link_game_to_game_with_checksum(self, child_game_id: str, parent_game_id: str):
        return self.dao.link_game_to_game_with_checksum(child_game_id, parent_game_id)
