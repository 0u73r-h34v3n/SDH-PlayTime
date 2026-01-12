import unittest
from datetime import datetime, timedelta
from py_modules.tests.helpers import AbstractDatabaseTest
from py_modules.db.migration import DbMigration
from py_modules.games import Games
from py_modules.db.dao import Dao
from py_modules.time_tracking import TimeTracking
from py_modules.statistics import Statistics
from py_modules.dto.save_game_checksum import AddGameChecksumDTO


class TestGame(AbstractDatabaseTest):
    games: Games
    dao: Dao
    time_tracking: TimeTracking
    playtime_statistics: Statistics

    def setUp(self) -> None:
        super().setUp()
        DbMigration(db=self.database).migrate()
        self.games = Games(Dao(self.database))
        self.dao = Dao(db=self.database)
        self.time_tracking = TimeTracking(Dao(self.database))
        self.playtime_statistics = Statistics(Dao(self.database), tracking_manager=None)

    def test_shoulld_save_game_checksum(self):
        self.dao.save_game_dict("100", "Zelda BOTW")
        self.dao.save_game_dict("1001", "Zelda BOTW 2")

        self.games.save_game_checksum(
            "100",
            "8d01416611a03b7c979d6fdee3b16006da68e29b5bd5cbc8785bc0e10205b7e8",
            "SHA256",
            16 * 1024 * 1024,
            None,
            None,
        )
        self.games.save_game_checksum(
            "1001",
            "8d01416611a03b7c979d6fdee3b16006da68e29b5bd5cbc8785bc0e10205b7e8",
            "SHA256",
            16 * 1024 * 1024,
            None,
            None,
        )
        self.games.save_game_checksum(
            "15439",
            "8d01416611a03b7c979d6fdee3b16006da68e29b5bd5cbc8785bc0e10205b7e8",
            "SHA256",
            16 * 1024 * 1024,
            None,
            None,
        )
        self.games.save_game_checksum(
            "666",
            "8d01416611a03b7c979d6fdee3b16006da68e29b5bd5cbc8785bc0e10205b7e8",
            "SHA256",
            16 * 1024 * 1024,
            None,
            None,
        )

        self.games.save_game_checksum(
            "184328543",
            "c021416611a03b7c979d6fdee3b16006da68e29b5bd5cbc8785bc0e10205b7e8",
            "SHA256",
            16 * 1024 * 1024,
            None,
            None,
        )

        self.games.save_game_checksum(
            "1",
            "c021416611a03b7c979d6fdee3b16006da68e29b5bd5cbc8785bc0e10205b7e8",
            "SHA256",
            16 * 1024 * 1024,
            None,
            None,
        )

        result = self.games.get_dictionary()

        result = self.games.get_games_checksum()

        now = datetime(2022, 1, 1, 9, 0)

        self.time_tracking.add_time(
            now.timestamp(), (now + timedelta(hours=1)).timestamp(), "101", "Zelda BOTW"
        )
        self.time_tracking.add_time(
            (now + timedelta(hours=1)).timestamp(),
            (now + timedelta(hours=1, minutes=30)).timestamp(),
            "101",
            "Zelda BOTW",
        )

        result = self.playtime_statistics.per_game_overall_statistic()

        self.assertEqual(result[0]["total_time"], 3600 + 1800)

    def test_save_game_checksum_bulk_inserts_multiple_records(self):
        """
        Verify that multiple, unique checksums are inserted correctly.
        """
        checksums_to_save = [
            AddGameChecksumDTO(
                game_id="game-123",
                checksum="checksum_alpha",
                algorithm="SHA256",
                chunk_size=1024,
                created_at="2023-03-01 12:00:00",
                updated_at="2023-03-01 12:00:00",
            ),
            AddGameChecksumDTO(
                game_id="game-123",
                checksum="checksum_beta",
                algorithm="BLAKE2B",
                chunk_size=2048,
                created_at="2023-03-02 12:00:00",
                updated_at="2023-03-02 12:00:00",
            ),
            AddGameChecksumDTO(
                game_id="game-456",
                checksum="checksum_gamma",
                algorithm="SHA256",
                chunk_size=1024,
                created_at="2023-03-03 12:00:00",
                updated_at="2023-03-03 12:00:00",
            ),
        ]

        self.games.save_game_checksum_bulk(checksums_to_save)

        results = self.games.get_games_checksum()

        assert len(results) == 3

        self.assertEqual(
            results,
            [
                {
                    "checksum_id": 1,
                    "game_id": "game-123",
                    "checksum": "checksum_alpha",
                    "algorithm": "SHA256",
                    "chunk_size": 1024,
                    "created_at": "2023-03-01 12:00:00",
                    "updated_at": "2023-03-01 12:00:00",
                },
                {
                    "checksum_id": 2,
                    "game_id": "game-123",
                    "checksum": "checksum_beta",
                    "algorithm": "BLAKE2B",
                    "chunk_size": 2048,
                    "created_at": "2023-03-02 12:00:00",
                    "updated_at": "2023-03-02 12:00:00",
                },
                {
                    "checksum_id": 3,
                    "game_id": "game-456",
                    "checksum": "checksum_gamma",
                    "algorithm": "SHA256",
                    "chunk_size": 1024,
                    "created_at": "2023-03-03 12:00:00",
                    "updated_at": "2023-03-03 12:00:00",
                },
            ],
        )

    def test_save_game_checksum_bulk_ignores_duplicates(self):
        """
        Verify that `INSERT OR IGNORE` correctly handles duplicate entries.
        A duplicate is defined by the UNIQUE constraint: (game_id, checksum, algorithm)
        """
        self.games.save_game_checksum(
            "game-123",
            "checksum_alpha",
            "SHA256",
            1024,
            "2023-01-01 12:00:00",
            "2023-01-01 12:00:00",
        )

        checksums_to_save = [
            AddGameChecksumDTO(
                game_id="game-123",
                checksum="checksum_alpha",
                algorithm="SHA256",
                chunk_size=1024,
                created_at="2023-02-01 12:00:00",
                updated_at="2023-02-01 12:00:00",
            ),
            AddGameChecksumDTO(
                game_id="game-123",
                checksum="checksum_delta",
                algorithm="SHA256",
                chunk_size=4096,
                created_at="2023-03-01 12:00:00",
                updated_at="2023-03-01 12:00:00",
            ),
        ]

        self.games.save_game_checksum_bulk(checksums_to_save)

        results = self.games.get_games_checksum()
        assert len(results) == 2

        self.assertEqual(
            results,
            [
                {
                    "algorithm": "SHA256",
                    "checksum": "checksum_alpha",
                    "checksum_id": 1,
                    "chunk_size": 1024,
                    "created_at": "2023-01-01 12:00:00",
                    "game_id": "game-123",
                    "updated_at": "2023-01-01 12:00:00",
                },
                {
                    "algorithm": "SHA256",
                    "checksum": "checksum_delta",
                    "checksum_id": 3,
                    "chunk_size": 4096,
                    "created_at": "2023-03-01 12:00:00",
                    "game_id": "game-123",
                    "updated_at": "2023-03-01 12:00:00",
                },
            ],
        )


if __name__ == "__main__":
    unittest.main()
