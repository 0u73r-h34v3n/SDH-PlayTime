import unittest
from datetime import datetime
from py_modules.db.dao import Dao
from py_modules.db.migration import DbMigration
from py_modules.games import Games
from py_modules.tests.helpers import AbstractDatabaseTest


class TestGames(AbstractDatabaseTest):
    dao: Dao
    games: Games

    def setUp(self) -> None:
        super().setUp()
        DbMigration(db=self.database).migrate()
        self.dao = Dao(db=self.database)
        self.games = Games(dao=self.dao)

    def test_link_game_to_game_with_checksum_validates_parent_exists(self):
        with self.assertRaises(ValueError) as context:
            self.games.link_game_to_game_with_checksum(
                "alias_game", "nonexistent_parent"
            )

        self.assertIn("Parent game does not exist", str(context.exception))

    def test_link_game_to_game_with_checksum_validates_parent_has_name(self):
        self.dao.save_play_time(
            start=datetime(2023, 1, 1, 10, 0),
            time_s=3600,
            game_id="parent_game",
            source=None,
        )

        with self.assertRaises(ValueError) as context:
            self.games.link_game_to_game_with_checksum("alias_game", "parent_game")

        self.assertIn("Parent game does not exist", str(context.exception))


if __name__ == "__main__":
    unittest.main()
