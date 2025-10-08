import contextlib
import sqlite3
from collections.abc import Generator


class SqlLiteDb:
    def __init__(self, database_path: str):
        self._database_path = database_path

    @contextlib.contextmanager
    def transactional(self) -> Generator[sqlite3.Connection, None, None]:
        with sqlite3.connect(self._database_path) as connection:
            try:
                yield connection
                connection.commit()
            except Exception as exception:
                connection.rollback()
                raise exception
