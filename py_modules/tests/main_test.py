import unittest
import os
import shutil
import tempfile
import sqlite3
from pathlib import Path
from unittest.mock import MagicMock, patch
from py_modules.tests.helpers import remove_date_fields


class TestPlugin(unittest.IsolatedAsyncioTestCase):
    STORAGE_DB_FILENAME = "storage.db"

    @classmethod
    def setUpClass(cls):
        """Set up mock environment and dependencies before importing main.py."""
        cls.mock_decky_user_home = tempfile.mkdtemp()
        cls.mock_plugin_runtime_dir = tempfile.mkdtemp()
        cls.mock_plugin_dir = tempfile.mkdtemp()

        os.makedirs(os.path.join(cls.mock_plugin_dir, "py_modules"), exist_ok=True)

        mock_env = {
            "DECKY_USER_HOME": cls.mock_decky_user_home,
            "DECKY_PLUGIN_RUNTIME_DIR": cls.mock_plugin_runtime_dir,
            "DECKY_PLUGIN_DIR": cls.mock_plugin_dir,
        }

        cls.mock_decky = MagicMock()
        cls.mock_decky.logger = MagicMock()

        cls.mocked_modules = {
            "decky": cls.mock_decky,
        }

        cls.patcher_env = patch.dict("os.environ", mock_env, clear=True)
        cls.patcher_modules = patch.dict("sys.modules", cls.mocked_modules)
        cls.patcher_env.start()
        cls.patcher_modules.start()

        global main
        import main

        cls.main = main

        cls.addClassCleanup(cls.patcher_env.stop)
        cls.addClassCleanup(cls.patcher_modules.stop)
        cls.addClassCleanup(shutil.rmtree, cls.mock_decky_user_home)
        cls.addClassCleanup(shutil.rmtree, cls.mock_plugin_runtime_dir)
        cls.addClassCleanup(shutil.rmtree, cls.mock_plugin_dir)

    def _get_games_from_db(self, db_path: str) -> list:
        """Helper to read game_dict data from a database."""
        with sqlite3.connect(db_path) as conn:
            return conn.execute("SELECT game_id, name FROM game_dict").fetchall()

    async def test_has_min_required_python_version(self):
        plugin = self.main.Plugin()
        with patch("sys.version_info", (3, 11, 0)):
            self.assertTrue(await plugin.has_min_required_python_version())
        with patch("sys.version_info", (3, 10, 9)):
            self.assertFalse(await plugin.has_min_required_python_version())

    async def test_get_decky_home(self):
        plugin = self.main.Plugin()
        result = await plugin.get_decky_home()
        self.assertEqual(result, self.mock_decky_user_home)

    async def test_apply_manual_time_correction(self):
        plugin = self.main.Plugin()
        await plugin._main()

        # Set a test user before accessing database
        await plugin.set_current_user("76561198012345678")

        await plugin.apply_manual_time_correction(
            [
                {
                    "game": {
                        "id": "3536189763",
                        "name": "Grand Theft Auto: San Andreas",
                    },
                    "time": 28800,
                }
            ]
        )

        per_game_overall_statistics = await plugin.per_game_overall_statistics()
        self.assertEqual(
            remove_date_fields(per_game_overall_statistics),
            [
                {
                    "game": {
                        "id": "3536189763",
                        "name": "Grand Theft Auto: San Andreas",
                    },
                    "lastSession": {
                        "checksum": None,
                        "duration": 28800,
                        "migrated": "manually-changed",
                    },
                    "totalTime": 28800,
                    "sessions": [
                        {
                            "checksum": None,
                            "duration": 28800,
                            "migrated": "manually-changed",
                        }
                    ],
                }
            ],
        )

    async def test_unload_logs_message(self):
        plugin = self.main.Plugin()
        await plugin._unload()
        self.mock_decky.logger.info.assert_called_with("Goodnight, World!")

    async def test_uninstall_logs_message(self):
        plugin = self.main.Plugin()
        await plugin._uninstall()
        self.mock_decky.logger.info.assert_called_with("Goodbye, World!")

    async def test_set_current_user_creates_user_database(self):
        """Test that set_current_user creates a user-specific database."""
        plugin = self.main.Plugin()
        await plugin._main()

        user_id = "76561198099999999"
        await plugin.set_current_user(user_id)

        # Verify user database was created
        user_db_path = (
            Path(self.mock_plugin_runtime_dir) / "users" / user_id / "storage.db"
        )
        self.assertTrue(user_db_path.exists())

        # Verify get_current_user returns correct user
        current_user = await plugin.get_current_user()
        self.assertEqual(current_user, user_id)

    async def test_multi_user_data_isolation(self):
        """Test that different users have isolated data."""
        plugin = self.main.Plugin()
        await plugin._main()

        user1 = "76561198011111111"
        user2 = "76561198022222222"

        # User 1 adds playtime
        await plugin.set_current_user(user1)
        await plugin.apply_manual_time_correction(
            [{"game": {"id": "user1_game", "name": "User 1 Game"}, "time": 3600}]
        )

        # User 2 adds playtime
        await plugin.set_current_user(user2)
        await plugin.apply_manual_time_correction(
            [{"game": {"id": "user2_game", "name": "User 2 Game"}, "time": 7200}]
        )

        # Verify User 1's data
        await plugin.set_current_user(user1)
        user1_stats = await plugin.per_game_overall_statistics()
        user1_game_ids = [stat["game"]["id"] for stat in user1_stats]
        self.assertIn("user1_game", user1_game_ids)
        self.assertNotIn("user2_game", user1_game_ids)

        # Verify User 2's data
        await plugin.set_current_user(user2)
        user2_stats = await plugin.per_game_overall_statistics()
        user2_game_ids = [stat["game"]["id"] for stat in user2_stats]
        self.assertIn("user2_game", user2_game_ids)
        self.assertNotIn("user1_game", user2_game_ids)

    async def test_legacy_db_migration_on_first_user_login(self):
        """Test that legacy DB is migrated when first user logs in."""
        # Create a legacy database with some data first
        from py_modules.db.sqlite_db import SqlLiteDb
        from py_modules.db.migration import DbMigration
        from py_modules.db.dao import Dao

        legacy_path = Path(self.mock_plugin_runtime_dir) / "storage.db"
        db = SqlLiteDb(str(legacy_path))
        DbMigration(db).migrate()
        dao = Dao(db)
        dao.save_game_dict("legacy_game", "Legacy Game")
        dao.save_play_time(
            start=__import__("datetime").datetime(2024, 1, 1, 12, 0, 0),
            time_s=1800,
            game_id="legacy_game",
        )

        # Now create plugin and set user
        plugin = self.main.Plugin()
        await plugin._main()

        user_id = "76561198033333333"
        await plugin.set_current_user(user_id)

        # Verify legacy data was migrated to user's DB
        stats = await plugin.per_game_overall_statistics()
        game_ids = [stat["game"]["id"] for stat in stats]
        self.assertIn("legacy_game", game_ids)

        # Verify legacy DB still exists unchanged
        self.assertTrue(legacy_path.exists())
        legacy_games = self._get_games_from_db(str(legacy_path))
        self.assertEqual(len(legacy_games), 1)
        self.assertEqual(legacy_games[0], ("legacy_game", "Legacy Game"))


if __name__ == "__main__":
    unittest.main()
