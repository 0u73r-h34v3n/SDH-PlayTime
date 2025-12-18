"""
Unit tests for UserManager module.

Tests cover:
- Per-user database creation
- Legacy database migration
- User switching
- Edge cases and error handling
"""

import os
import shutil
import sqlite3
import tempfile
import unittest
from pathlib import Path

from py_modules.db.dao import Dao
from py_modules.db.migration import DbMigration
from py_modules.db.sqlite_db import SqlLiteDb
from py_modules.user_manager import UserManager


class TestUserManager(unittest.TestCase):
    """Test cases for UserManager class."""

    def setUp(self):
        """Set up test fixtures."""
        self.test_dir = tempfile.mkdtemp()
        self.user_manager = UserManager(self.test_dir)

    def tearDown(self):
        """Clean up test fixtures."""
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def _create_legacy_db_with_data(self):
        """Helper to create a legacy database with some test data."""
        legacy_path = Path(self.test_dir) / "storage.db"
        db = SqlLiteDb(str(legacy_path))

        # Run migrations to set up schema
        migration = DbMigration(db)
        migration.migrate()

        # Add some test data
        dao = Dao(db)
        dao.save_game_dict("12345", "Test Game")
        dao.save_play_time(
            start=__import__("datetime").datetime(2024, 1, 1, 12, 0, 0),
            time_s=3600,
            game_id="12345",
        )

        return legacy_path

    def _get_playtime_from_db(self, db_path: str) -> list:
        """Helper to read playtime data from a database."""
        with sqlite3.connect(db_path) as conn:
            return conn.execute("SELECT game_id, duration FROM play_time").fetchall()

    def _get_games_from_db(self, db_path: str) -> list:
        """Helper to read game_dict data from a database."""
        with sqlite3.connect(db_path) as conn:
            return conn.execute("SELECT game_id, name FROM game_dict").fetchall()


class TestUserManagerBasics(TestUserManager):
    """Test basic UserManager functionality."""

    def test_legacy_db_path(self):
        """Test legacy_db_path property."""
        expected = Path(self.test_dir) / "storage.db"
        self.assertEqual(self.user_manager.legacy_db_path, expected)

    def test_users_dir(self):
        """Test users_dir property."""
        expected = Path(self.test_dir) / "users"
        self.assertEqual(self.user_manager.users_dir, expected)

    def test_get_user_db_path(self):
        """Test get_user_db_path method."""
        user_id = "76561198012345678"
        expected = Path(self.test_dir) / "users" / user_id / "storage.db"
        self.assertEqual(self.user_manager.get_user_db_path(user_id), expected)

    def test_has_legacy_db_false(self):
        """Test has_legacy_db returns False when no legacy DB exists."""
        self.assertFalse(self.user_manager.has_legacy_db())

    def test_has_legacy_db_true(self):
        """Test has_legacy_db returns True when legacy DB exists."""
        self._create_legacy_db_with_data()
        self.assertTrue(self.user_manager.has_legacy_db())

    def test_has_user_db_false(self):
        """Test has_user_db returns False when user DB doesn't exist."""
        self.assertFalse(self.user_manager.has_user_db("76561198012345678"))

    def test_current_user_id_initially_none(self):
        """Test current_user_id is None initially."""
        self.assertIsNone(self.user_manager.current_user_id)

    def test_get_current_dao_when_no_user_set(self):
        """Test get_current_dao returns None when no user is set."""
        self.assertIsNone(self.user_manager.get_current_dao())


class TestUserManagerSetCurrentUser(TestUserManager):
    """Test set_current_user functionality."""

    def test_set_current_user_creates_user_directory(self):
        """Test that set_current_user creates the user directory."""
        user_id = "76561198012345678"

        self.user_manager.set_current_user(user_id)

        user_dir = Path(self.test_dir) / "users" / user_id
        self.assertTrue(user_dir.exists())

    def test_set_current_user_creates_database(self):
        """Test that set_current_user creates the database file."""
        user_id = "76561198012345678"

        self.user_manager.set_current_user(user_id)

        db_path = self.user_manager.get_user_db_path(user_id)
        self.assertTrue(db_path.exists())

    def test_set_current_user_returns_dao(self):
        """Test that set_current_user returns a Dao instance."""
        user_id = "76561198012345678"

        dao = self.user_manager.set_current_user(user_id)

        self.assertIsInstance(dao, Dao)

    def test_set_current_user_updates_current_user_id(self):
        """Test that set_current_user updates current_user_id property."""
        user_id = "76561198012345678"

        self.user_manager.set_current_user(user_id)

        self.assertEqual(self.user_manager.current_user_id, user_id)

    def test_set_current_user_caches_dao(self):
        """Test that DAO is cached and reused on subsequent calls."""
        user_id = "76561198012345678"

        dao1 = self.user_manager.set_current_user(user_id)
        dao2 = self.user_manager.set_current_user(user_id)

        self.assertIs(dao1, dao2)

    def test_set_current_user_rejects_empty_user_id(self):
        """Test that set_current_user rejects empty user ID."""
        with self.assertRaises(ValueError) as context:
            self.user_manager.set_current_user("")

        self.assertIn("empty", str(context.exception).lower())

    def test_set_current_user_rejects_whitespace_only_user_id(self):
        """Test that set_current_user rejects whitespace-only user ID."""
        with self.assertRaises(ValueError) as context:
            self.user_manager.set_current_user("   ")

        self.assertIn("empty", str(context.exception).lower())

    def test_set_current_user_rejects_non_numeric_user_id(self):
        """Test that set_current_user rejects non-numeric user ID."""
        with self.assertRaises(ValueError) as context:
            self.user_manager.set_current_user("invalid-user-id")

        self.assertIn("invalid", str(context.exception).lower())

    def test_set_current_user_strips_whitespace(self):
        """Test that set_current_user strips leading/trailing whitespace."""
        user_id = "76561198012345678"

        self.user_manager.set_current_user(f"  {user_id}  ")

        self.assertEqual(self.user_manager.current_user_id, user_id)

    def test_set_current_user_database_is_functional(self):
        """Test that the created database is functional."""
        user_id = "76561198012345678"

        dao = self.user_manager.set_current_user(user_id)

        # Try to save some data
        dao.save_game_dict("99999", "Test Game")
        dao.save_play_time(
            start=__import__("datetime").datetime(2024, 6, 15, 10, 0, 0),
            time_s=1800,
            game_id="99999",
        )

        # Verify data was saved
        db_path = str(self.user_manager.get_user_db_path(user_id))
        games = self._get_games_from_db(db_path)
        self.assertEqual(len(games), 1)
        self.assertEqual(games[0], ("99999", "Test Game"))


class TestUserManagerMigration(TestUserManager):
    """Test legacy database migration functionality."""

    def test_migration_copies_legacy_db_for_new_user(self):
        """Test that legacy DB is copied when a new user logs in."""
        # Create legacy DB with data
        self._create_legacy_db_with_data()

        user_id = "76561198012345678"
        self.user_manager.set_current_user(user_id)

        # Verify user DB was created with migrated data
        user_db_path = str(self.user_manager.get_user_db_path(user_id))
        games = self._get_games_from_db(user_db_path)

        self.assertEqual(len(games), 1)
        self.assertEqual(games[0], ("12345", "Test Game"))

    def test_migration_preserves_playtime_data(self):
        """Test that playtime data is preserved during migration."""
        self._create_legacy_db_with_data()

        user_id = "76561198012345678"
        self.user_manager.set_current_user(user_id)

        user_db_path = str(self.user_manager.get_user_db_path(user_id))
        playtime = self._get_playtime_from_db(user_db_path)

        self.assertEqual(len(playtime), 1)
        self.assertEqual(playtime[0], ("12345", 3600))

    def test_migration_does_not_modify_legacy_db(self):
        """Test that legacy DB is not modified after migration."""
        legacy_path = self._create_legacy_db_with_data()

        # Get original data
        original_games = self._get_games_from_db(str(legacy_path))
        original_playtime = self._get_playtime_from_db(str(legacy_path))

        # Migrate user
        user_id = "76561198012345678"
        dao = self.user_manager.set_current_user(user_id)

        # Add new data to user's DB
        dao.save_game_dict("99999", "New Game")
        dao.save_play_time(
            start=__import__("datetime").datetime(2024, 6, 15, 10, 0, 0),
            time_s=7200,
            game_id="99999",
        )

        # Verify legacy DB is unchanged
        legacy_games = self._get_games_from_db(str(legacy_path))
        legacy_playtime = self._get_playtime_from_db(str(legacy_path))

        self.assertEqual(legacy_games, original_games)
        self.assertEqual(legacy_playtime, original_playtime)

    def test_migration_only_happens_once_per_user(self):
        """Test that migration only happens once, not on subsequent logins."""
        self._create_legacy_db_with_data()

        user_id = "76561198012345678"

        # First login - should migrate
        dao = self.user_manager.set_current_user(user_id)
        dao.save_game_dict("99999", "New Game After Migration")

        # Clear cache to simulate restart
        self.user_manager.clear_cache()

        # Second login - should NOT re-migrate (would overwrite new data)
        self.user_manager.set_current_user(user_id)

        user_db_path = str(self.user_manager.get_user_db_path(user_id))
        games = self._get_games_from_db(user_db_path)

        # Should have both original migrated game AND the new game
        game_ids = [g[0] for g in games]
        self.assertIn("12345", game_ids)  # Original from legacy
        self.assertIn("99999", game_ids)  # Added after migration

    def test_no_migration_when_no_legacy_db(self):
        """Test that no migration happens when there's no legacy DB."""
        user_id = "76561198012345678"

        self.user_manager.set_current_user(user_id)

        user_db_path = str(self.user_manager.get_user_db_path(user_id))
        games = self._get_games_from_db(user_db_path)

        # Should be empty - no data to migrate
        self.assertEqual(len(games), 0)

    def test_migration_for_second_user_also_gets_legacy_data(self):
        """Test that a second user also gets legacy data migrated."""
        self._create_legacy_db_with_data()

        user1 = "76561198012345678"
        user2 = "76561198087654321"

        # First user logs in
        dao1 = self.user_manager.set_current_user(user1)
        dao1.save_game_dict("user1_game", "User 1 Game")

        # Second user logs in - should also get legacy data
        dao2 = self.user_manager.set_current_user(user2)

        user2_db_path = str(self.user_manager.get_user_db_path(user2))
        games = self._get_games_from_db(user2_db_path)

        # User 2 should have legacy data but NOT user 1's new data
        game_ids = [g[0] for g in games]
        self.assertIn("12345", game_ids)  # Original from legacy
        self.assertNotIn("user1_game", game_ids)  # User 1's data should not be here


class TestUserManagerMultiUser(TestUserManager):
    """Test multi-user scenarios."""

    def test_switching_users(self):
        """Test switching between different users."""
        user1 = "76561198012345678"
        user2 = "76561198087654321"

        # Set up user 1
        dao1 = self.user_manager.set_current_user(user1)
        dao1.save_game_dict("game1", "User 1 Game")

        # Switch to user 2
        dao2 = self.user_manager.set_current_user(user2)
        dao2.save_game_dict("game2", "User 2 Game")

        # Verify data isolation
        user1_db_path = str(self.user_manager.get_user_db_path(user1))
        user2_db_path = str(self.user_manager.get_user_db_path(user2))

        user1_games = self._get_games_from_db(user1_db_path)
        user2_games = self._get_games_from_db(user2_db_path)

        self.assertEqual(len(user1_games), 1)
        self.assertEqual(user1_games[0], ("game1", "User 1 Game"))

        self.assertEqual(len(user2_games), 1)
        self.assertEqual(user2_games[0], ("game2", "User 2 Game"))

    def test_get_current_dao_after_switch(self):
        """Test get_current_dao returns correct DAO after switching users."""
        user1 = "76561198012345678"
        user2 = "76561198087654321"

        dao1 = self.user_manager.set_current_user(user1)
        dao2 = self.user_manager.set_current_user(user2)

        current_dao = self.user_manager.get_current_dao()

        self.assertIs(current_dao, dao2)
        self.assertIsNot(current_dao, dao1)

    def test_list_users_empty(self):
        """Test list_users returns empty list when no users exist."""
        users = self.user_manager.list_users()
        self.assertEqual(users, [])

    def test_list_users_after_creation(self):
        """Test list_users returns all user IDs."""
        user1 = "76561198012345678"
        user2 = "76561198087654321"

        self.user_manager.set_current_user(user1)
        self.user_manager.set_current_user(user2)

        users = self.user_manager.list_users()

        self.assertEqual(set(users), {user1, user2})

    def test_get_dao_for_user_without_setting_current(self):
        """Test get_dao_for_user works without setting current user."""
        user_id = "76561198012345678"

        dao = self.user_manager.get_dao_for_user(user_id)

        self.assertIsInstance(dao, Dao)
        self.assertIsNone(self.user_manager.current_user_id)  # Current not set


class TestUserManagerLegacyDao(TestUserManager):
    """Test legacy DAO access."""

    def test_get_legacy_dao_when_no_legacy_db(self):
        """Test get_legacy_dao returns None when no legacy DB exists."""
        dao = self.user_manager.get_legacy_dao()
        self.assertIsNone(dao)

    def test_get_legacy_dao_when_legacy_exists(self):
        """Test get_legacy_dao returns DAO when legacy DB exists."""
        self._create_legacy_db_with_data()

        dao = self.user_manager.get_legacy_dao()

        self.assertIsInstance(dao, Dao)

    def test_get_legacy_dao_is_cached(self):
        """Test get_legacy_dao returns same instance on multiple calls."""
        self._create_legacy_db_with_data()

        dao1 = self.user_manager.get_legacy_dao()
        dao2 = self.user_manager.get_legacy_dao()

        self.assertIs(dao1, dao2)

    def test_legacy_dao_can_read_data(self):
        """Test legacy DAO can read data from legacy DB."""
        self._create_legacy_db_with_data()

        dao = self.user_manager.get_legacy_dao()
        overall_playtime = dao.fetch_overall_playtime()

        self.assertEqual(len(overall_playtime), 1)
        self.assertEqual(overall_playtime[0].game_id, "12345")
        self.assertEqual(overall_playtime[0].time, 3600)


class TestUserManagerClearCache(TestUserManager):
    """Test cache clearing functionality."""

    def test_clear_cache_clears_current_user(self):
        """Test clear_cache clears current user ID."""
        self.user_manager.set_current_user("76561198012345678")

        self.user_manager.clear_cache()

        self.assertIsNone(self.user_manager.current_user_id)

    def test_clear_cache_clears_dao_cache(self):
        """Test clear_cache clears DAO cache."""
        user_id = "76561198012345678"
        dao1 = self.user_manager.set_current_user(user_id)

        self.user_manager.clear_cache()

        dao2 = self.user_manager.set_current_user(user_id)

        # Should be different instances after cache clear
        self.assertIsNot(dao1, dao2)


if __name__ == "__main__":
    unittest.main()
