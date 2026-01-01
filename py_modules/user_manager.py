"""
User Manager Module

Handles per-user database management for PlayTime plugin.
Each Steam user gets their own isolated database for playtime tracking.

Migration Strategy:
- When a user first logs in, check if legacy storage.db exists
- If legacy DB exists AND no user-specific DB exists, copy legacy DB to user's folder
- Legacy storage.db is preserved and never modified (backward compatibility)
"""

import shutil
from pathlib import Path
from typing import Dict, Optional

from py_modules.db.dao import Dao
from py_modules.db.migration import DbMigration
from py_modules.db.sqlite_db import SqlLiteDb


class UserManager:
    """
    Manages per-user database instances and handles migration from legacy storage.

    Directory Structure:
        $DECKY_PLUGIN_RUNTIME_DIR/
        ├── storage.db              # Legacy DB (preserved, read-only after migration)
        └── users/
            ├── 76561198012345678/
            │   └── storage.db      # User-specific DB
            └── 76561198087654321/
                └── storage.db      # Another user's DB
    """

    __slots__ = (
        "_data_dir",
        "_current_user_id",
        "_user_daos",
        "_legacy_dao",
        "_logger",
    )

    USERS_SUBDIR = "users"
    STORAGE_DB_FILENAME = "storage.db"

    def __init__(self, data_dir: str, logger=None):
        """
        Initialize UserManager.

        Args:
            data_dir: The plugin runtime directory (DECKY_PLUGIN_RUNTIME_DIR)
            logger: Optional logger instance for debugging
        """
        self._data_dir = Path(data_dir)
        self._current_user_id: Optional[str] = None
        self._user_daos: Dict[str, Dao] = {}
        self._legacy_dao: Optional[Dao] = None
        self._logger = logger

    def _log(self, message: str):
        """Log a message if logger is available."""
        if self._logger:
            self._logger.info(f"[UserManager] {message}")

    def _log_error(self, message: str):
        """Log an error if logger is available."""
        if self._logger:
            self._logger.error(f"[UserManager] {message}")

    @property
    def legacy_db_path(self) -> Path:
        """Path to the legacy storage.db file."""
        return self._data_dir / self.STORAGE_DB_FILENAME

    @property
    def users_dir(self) -> Path:
        """Path to the users directory."""
        return self._data_dir / self.USERS_SUBDIR

    def get_user_db_path(self, user_id: str) -> Path:
        """Get the database path for a specific user."""
        return self.users_dir / user_id / self.STORAGE_DB_FILENAME

    def has_legacy_db(self) -> bool:
        """Check if legacy storage.db exists."""
        return self.legacy_db_path.exists()

    def has_user_db(self, user_id: str) -> bool:
        """Check if a user-specific database exists."""
        return self.get_user_db_path(user_id).exists()

    @property
    def current_user_id(self) -> Optional[str]:
        """Get the current user ID."""
        return self._current_user_id

    def set_current_user(self, user_id: str) -> Dao:
        """
        Set the current user and return their DAO.

        This will:
        1. Create user directory if needed
        2. Migrate legacy DB if this is a new user and legacy exists
        3. Initialize and migrate the user's database
        4. Cache the DAO for future use

        Args:
            user_id: The Steam user ID (64-bit as string)

        Returns:
            The Dao instance for this user

        Raises:
            ValueError: If user_id is empty or invalid
        """
        if not user_id or not user_id.strip():
            raise ValueError("user_id cannot be empty")

        # Validate Steam ID format (should be numeric, 17 digits for 64-bit Steam ID)
        user_id = user_id.strip()

        if not user_id.isdigit():
            raise ValueError(f"Invalid Steam ID format: {user_id}")

        self._current_user_id = user_id
        self._log(f"Setting current user to: {user_id}")

        if user_id in self._user_daos:
            self._log(f"Using cached DAO for user: {user_id}")
            return self._user_daos[user_id]

        return self._initialize_user_dao(user_id)

    def _initialize_user_dao(self, user_id: str) -> Dao:
        """
        Initialize the DAO for a specific user.

        Handles migration from legacy DB if applicable.
        """
        user_db_path = self.get_user_db_path(user_id)
        user_dir = user_db_path.parent

        # Create user directory if it doesn't exist
        user_dir.mkdir(parents=True, exist_ok=True)

        # Check if we need to migrate legacy data
        should_migrate = self.has_legacy_db() and not self.has_user_db(user_id)

        if should_migrate:
            self._migrate_legacy_db_for_user(user_id)

        # Initialize the database
        db = SqlLiteDb(str(user_db_path))
        migration = DbMigration(db)
        migration.migrate()

        dao = Dao(db)
        self._user_daos[user_id] = dao

        self._log(f"Initialized DAO for user: {user_id}")
        return dao

    def _migrate_legacy_db_for_user(self, user_id: str) -> bool:
        """
        Copy legacy storage.db to user's directory.

        Args:
            user_id: The Steam user ID

        Returns:
            True if migration was successful, False otherwise
        """
        user_db_path = self.get_user_db_path(user_id)

        try:
            # Get legacy DB size for progress logging
            legacy_size = self.legacy_db_path.stat().st_size
            legacy_size_mb = legacy_size / (1024 * 1024)

            self._log(
                f"Migrating legacy DB for user {user_id}: "
                f"{self.legacy_db_path} -> {user_db_path} "
                f"(size: {legacy_size_mb:.2f} MB)"
            )

            # Copy the legacy database file
            shutil.copy2(str(self.legacy_db_path), str(user_db_path))

            self._log(
                f"Successfully migrated legacy DB for user: {user_id} "
                f"({legacy_size_mb:.2f} MB copied)"
            )
            return True

        except Exception as e:
            self._log_error(f"Failed to migrate legacy DB for user {user_id}: {e}")
            # If copy fails, we'll just create a fresh database
            return False

    def get_current_dao(self) -> Optional[Dao]:
        """
        Get the DAO for the current user.

        Returns:
            The Dao for the current user, or None if no user is set
        """
        if self._current_user_id is None:
            return None

        return self._user_daos.get(self._current_user_id)

    def get_dao_for_user(self, user_id: str) -> Dao:
        """
        Get or create a DAO for a specific user.

        Args:
            user_id: The Steam user ID

        Returns:
            The Dao instance for the user
        """
        if user_id in self._user_daos:
            return self._user_daos[user_id]

        return self._initialize_user_dao(user_id)

    def get_legacy_dao(self) -> Optional[Dao]:
        """
        Get the DAO for the legacy database (read-only access).

        Returns:
            The Dao for legacy DB, or None if legacy DB doesn't exist
        """
        if not self.has_legacy_db():
            return None

        if self._legacy_dao is None:
            db = SqlLiteDb(str(self.legacy_db_path))
            # Don't run migrations on legacy DB - it should remain as-is
            self._legacy_dao = Dao(db)

        return self._legacy_dao

    def list_users(self) -> list[str]:
        """
        List all user IDs that have databases.

        Returns:
            List of user ID strings
        """
        if not self.users_dir.exists():
            return []

        users = []
        for user_dir in self.users_dir.iterdir():
            if user_dir.is_dir() and (user_dir / self.STORAGE_DB_FILENAME).exists():
                users.append(user_dir.name)

        return users

    def clear_cache(self):
        """Clear all cached DAOs. Useful for testing."""
        self._user_daos.clear()
        self._legacy_dao = None
        self._current_user_id = None
