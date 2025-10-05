import os
import unittest

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
