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

    async def test_add_time_with_default_status_tracks_playtime(self):
        """Test that add_time tracks playtime for games with default status."""
        plugin = self.main.Plugin()
        await plugin._main()
        await plugin.set_current_user("76561198044444444")

        # Add playtime (default status)
        await plugin.add_time(
            {
                "started_at": 1672574400,  # 2023-01-01 10:00:00
                "ended_at": 1672578000,  # 2023-01-01 11:00:00
                "game_id": "game_default",
                "game_name": "Default Game",
            }
        )

        # Verify playtime was tracked
        stats = await plugin.per_game_overall_statistics()
        game_ids = [stat["game"]["id"] for stat in stats]
        self.assertIn("game_default", game_ids, "Default status should allow tracking")

        # Verify the actual time
        game_stat = next(s for s in stats if s["game"]["id"] == "game_default")
        self.assertEqual(
            game_stat["totalTime"], 3600, "Should have tracked 1 hour (3600 seconds)"
        )

    async def test_add_time_with_pause_status_prevents_tracking(self):
        """Test that add_time does NOT track playtime for games with pause status."""
        plugin = self.main.Plugin()
        await plugin._main()
        await plugin.set_current_user("76561198055555555")

        # Create game in DB first by adding some initial playtime
        await plugin.add_time(
            {
                "started_at": 1672488000,  # 2022-12-31 10:00:00
                "ended_at": 1672491600,  # 2022-12-31 11:00:00
                "game_id": "game_pause",
                "game_name": "Paused Game",
            }
        )

        # Now set to pause status
        await plugin.set_game_tracking_status(
            {"game_id": "game_pause", "status": "pause"}
        )

        # Try to add more playtime (should be blocked by pause status)
        await plugin.add_time(
            {
                "started_at": 1672574400,  # 2023-01-01 10:00:00
                "ended_at": 1672578000,  # 2023-01-01 11:00:00
                "game_id": "game_pause",
                "game_name": "Paused Game",
            }
        )

        # Verify only the first session was tracked (not the second)
        stats = await plugin.per_game_overall_statistics()
        game_stat = next(s for s in stats if s["game"]["id"] == "game_pause")
        self.assertEqual(
            game_stat["totalTime"],
            3600,  # Only 1 hour from first session
            "Pause status should prevent new tracking - time should not increase",
        )

    async def test_add_time_with_ignore_status_prevents_tracking(self):
        """Test that add_time does NOT track playtime for games with ignore status."""
        plugin = self.main.Plugin()
        await plugin._main()
        await plugin.set_current_user("76561198066666666")

        # Create game in DB first by adding some initial playtime
        await plugin.add_time(
            {
                "started_at": 1672488000,  # 2022-12-31 10:00:00
                "ended_at": 1672491600,  # 2022-12-31 11:00:00
                "game_id": "game_ignore",
                "game_name": "Ignored Game",
            }
        )

        # Now set to ignore status
        await plugin.set_game_tracking_status(
            {"game_id": "game_ignore", "status": "ignore"}
        )

        # Try to add more playtime (should be blocked by ignore status)
        await plugin.add_time(
            {
                "started_at": 1672574400,  # 2023-01-01 10:00:00
                "ended_at": 1672578000,  # 2023-01-01 11:00:00
                "game_id": "game_ignore",
                "game_name": "Ignored Game",
            }
        )

        # Verify playtime did NOT increase (check raw DB since ignore hides from stats)
        dao = plugin._get_current_dao()
        result = dao.fetch_overall_playtime()
        game_data = next((g for g in result if g.game_id == "game_ignore"), None)
        self.assertIsNotNone(game_data, "Game should exist from first session")
        self.assertEqual(
            game_data.time,
            3600,  # Only 1 hour from first session
            "Ignore status should prevent new tracking - time should not increase",
        )

    async def test_add_time_with_hidden_status_tracks_but_hides_from_ui(self):
        """Test that add_time tracks playtime for hidden games but they don't appear in stats."""
        plugin = self.main.Plugin()
        await plugin._main()
        await plugin.set_current_user("76561198077777777")

        # Create game in DB first by adding some initial playtime
        await plugin.add_time(
            {
                "started_at": 1672488000,  # 2022-12-31 10:00:00
                "ended_at": 1672491600,  # 2022-12-31 11:00:00
                "game_id": "game_hidden",
                "game_name": "Hidden Game",
            }
        )

        # Now set to hidden status
        await plugin.set_game_tracking_status(
            {"game_id": "game_hidden", "status": "hidden"}
        )

        # Add more playtime (should be tracked despite hidden status)
        await plugin.add_time(
            {
                "started_at": 1672574400,  # 2023-01-01 10:00:00
                "ended_at": 1672578000,  # 2023-01-01 11:00:00
                "game_id": "game_hidden",
                "game_name": "Hidden Game",
            }
        )

        # Verify playtime is tracked in DB (both sessions)
        dao = plugin._get_current_dao()
        result = dao.fetch_overall_playtime()
        game_data = next(g for g in result if g.game_id == "game_hidden")
        self.assertEqual(
            game_data.time,
            7200,  # 2 hours from both sessions
            "Hidden status should still track playtime in DB",
        )

        # Verify it's hidden from statistics UI
        stats = await plugin.per_game_overall_statistics()
        stat_game_ids = [stat["game"]["id"] for stat in stats]
        self.assertNotIn(
            "game_hidden",
            stat_game_ids,
            "Hidden status should hide game from statistics",
        )

    async def test_add_time_multiple_sessions_with_status_changes(self):
        dao = plugin._get_current_dao()
        result = dao.fetch_overall_playtime()
        game_ids = [g.game_id for g in result]
        self.assertIn(
            "game_hidden", game_ids, "Hidden status should still track playtime in DB"
        )

        # Verify it's hidden from statistics UI
        stats = await plugin.per_game_overall_statistics()
        stat_game_ids = [stat["game"]["id"] for stat in stats]
        self.assertNotIn(
            "game_hidden",
            stat_game_ids,
            "Hidden status should hide game from statistics",
        )

    async def test_add_time_multiple_sessions_with_status_changes(self):
        """Test add_time behavior across status changes."""
        plugin = self.main.Plugin()
        await plugin._main()
        await plugin.set_current_user("76561198088888888")

        # Session 1: Default status - should track
        await plugin.add_time(
            {
                "started_at": 1672574400,  # 2023-01-01 10:00:00
                "ended_at": 1672578000,  # 2023-01-01 11:00:00
                "game_id": "game_multi",
                "game_name": "Multi Status Game",
            }
        )

        # Change to pause status
        await plugin.set_game_tracking_status(
            {"game_id": "game_multi", "status": "pause"}
        )

        # Session 2: Pause status - should NOT track
        await plugin.add_time(
            {
                "started_at": 1672660800,  # 2023-01-02 10:00:00
                "ended_at": 1672664400,  # 2023-01-02 11:00:00
                "game_id": "game_multi",
                "game_name": "Multi Status Game",
            }
        )

        # Change to ignore status
        await plugin.set_game_tracking_status(
            {"game_id": "game_multi", "status": "ignore"}
        )

        # Session 3: Ignore status - should NOT track
        await plugin.add_time(
            {
                "started_at": 1672747200,  # 2023-01-03 10:00:00
                "ended_at": 1672750800,  # 2023-01-03 11:00:00
                "game_id": "game_multi",
                "game_name": "Multi Status Game",
            }
        )

        # Change back to default
        await plugin.set_game_tracking_status(
            {"game_id": "game_multi", "status": "default"}
        )

        # Session 4: Default status again - should track
        await plugin.add_time(
            {
                "started_at": 1672833600,  # 2023-01-04 10:00:00
                "ended_at": 1672837200,  # 2023-01-04 11:00:00
                "game_id": "game_multi",
                "game_name": "Multi Status Game",
            }
        )

        # Verify only sessions 1 and 4 were tracked (2 hours total)
        stats = await plugin.per_game_overall_statistics()
        game_stat = next(s for s in stats if s["game"]["id"] == "game_multi")
        self.assertEqual(
            game_stat["totalTime"],
            7200,  # 2 hours = 7200 seconds
            "Only sessions with default status (1 and 4) should be tracked",
        )

    async def test_add_time_with_existing_playtime_then_pause(self):
        """Test that changing to pause status keeps existing time visible but blocks new tracking."""
        plugin = self.main.Plugin()
        await plugin._main()
        await plugin.set_current_user("76561198099999999")

        # Add playtime with default status
        await plugin.add_time(
            {
                "started_at": 1672574400,  # 2023-01-01 10:00:00
                "ended_at": 1672578000,  # 2023-01-01 11:00:00
                "game_id": "game_pause_after",
                "game_name": "Pause After Game",
            }
        )

        # Verify initial playtime
        stats = await plugin.per_game_overall_statistics()
        game_stat = next(s for s in stats if s["game"]["id"] == "game_pause_after")
        self.assertEqual(game_stat["totalTime"], 3600)

        # Change to pause status
        await plugin.set_game_tracking_status(
            {"game_id": "game_pause_after", "status": "pause"}
        )

        # Try to add more playtime (should be blocked)
        await plugin.add_time(
            {
                "started_at": 1672660800,  # 2023-01-02 10:00:00
                "ended_at": 1672664400,  # 2023-01-02 11:00:00
                "game_id": "game_pause_after",
                "game_name": "Pause After Game",
            }
        )

        # Verify time is still visible (pause doesn't hide) but unchanged
        stats = await plugin.per_game_overall_statistics()
        game_ids = [stat["game"]["id"] for stat in stats]
        self.assertIn(
            "game_pause_after",
            game_ids,
            "Pause status should keep existing time visible",
        )

        game_stat = next(s for s in stats if s["game"]["id"] == "game_pause_after")
        self.assertEqual(
            game_stat["totalTime"],
            3600,
            "Time should not increase - second session should be blocked",
        )


if __name__ == "__main__":
    unittest.main()
