import contextlib
import sqlite3
from typing import Generator


class SqlLiteDb:
    __slots__ = ("_database_path",)

    def __init__(self, database_path: str):
        self._database_path = database_path

        self._init_db_settings()

    def _init_db_settings(self):
        """Apply persistent settings once."""
        conn = sqlite3.connect(self._database_path)
        try:
            conn.execute("PRAGMA journal_mode = WAL")
            conn.execute("PRAGMA synchronous = NORMAL")
            conn.commit()
        finally:
            conn.close()

    @contextlib.contextmanager
    def transactional(self) -> Generator[sqlite3.Connection, None, None]:
        connection = sqlite3.connect(self._database_path, isolation_level=None)

        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute("PRAGMA cache_size = -20000")

        try:
            connection.execute("BEGIN")
            yield connection
            connection.execute("COMMIT")
        except Exception as exception:
            connection.execute("ROLLBACK")
            raise exception
        finally:
            connection.close()
