import os
import unittest

from datetime import datetime
from py_modules.db.sqlite_db import SqlLiteDb


class AbstractDatabaseTest(unittest.TestCase):
    database_file = f"test_db_{os.getpid()}.db"
    database: SqlLiteDb

    def setUp(self) -> None:
        if os.path.exists(self.database_file):
            os.remove(self.database_file)
        self.database = SqlLiteDb(self.database_file)
        super().setUp()

    def tearDown(self) -> None:
        if os.path.exists(self.database_file):
            os.remove(self.database_file)
        self.database = None  # type: ignore [assignment]
        super().tearDown()

    if __name__ == "__main__":
        unittest.main()


def remove_date_fields(dt: datetime):
    if isinstance(dt, list):
        return [remove_date_fields(item) for item in dt]

    if isinstance(dt, dict):
        return {
            key: remove_date_fields(value) for key, value in dt.items() if key != "date"
        }

    return dt
