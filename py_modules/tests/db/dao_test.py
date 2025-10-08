import sqlite3
from datetime import datetime

from py_modules.db.dao import Dao
from py_modules.db.migration import DbMigration
from py_modules.tests.helpers import AbstractDatabaseTest


class TestDao(AbstractDatabaseTest):
    dao: Dao

    def setUp(self) -> None:
        super().setUp()
        DbMigration(db=self.database).migrate()
        self.dao = Dao(db=self.database)

    def test_should_save_game_dict_only_once(self):
        self.dao.save_game_dict("1001", "Zelda BOTW")
        self.dao.save_game_dict("1001", "Zelda BOTW - updated")

        result = (
            sqlite3.connect(self.database_file)
            .execute("select game_id, name from game_dict")
            .fetchone()
        )
        self.assertEqual(result[0], "1001")
        self.assertEqual(result[1], "Zelda BOTW - updated")

    def test_should_add_new_interval(self):
        self.dao.save_game_dict("1001", "Zelda BOTW")
        self.dao.save_play_time(datetime(2023, 1, 1, 10, 0), 3600, "1001")
        result = (
            sqlite3.connect(self.database_file)
            .execute("select date_time, game_id, duration from play_time")
            .fetchone()
        )
        self.assertEqual(result[0], "2023-01-01T10:00:00")
        self.assertEqual(result[1], "1001")
        self.assertEqual(result[2], 3600)

    def test_should_calculate_per_day_time_report(self):
        self.dao.save_game_dict("1001", "Zelda BOTW")
        self.dao.save_game_dict("1002", "DOOM")
        self.dao.save_play_time(datetime(2023, 1, 1, 9, 0), 3600, "1001")
        self.dao.save_play_time(datetime(2023, 1, 1, 11, 0), 1800, "1001")
        self.dao.save_play_time(datetime(2023, 1, 2, 10, 0), 2000, "1002")
        result = self.dao.fetch_per_day_time_report(
            datetime(2023, 1, 1, 0, 0), datetime(2023, 1, 2, 23, 59)
        )
        self.assertEqual(len(result), 2)

        self.assertEqual(result[0].date, "2023-01-01")
        self.assertEqual(result[0].game_id, "1001")
        self.assertEqual(result[0].game_name, "Zelda BOTW")
        self.assertEqual(result[0].time, 5400)

        self.assertEqual(result[1].date, "2023-01-02")
        self.assertEqual(result[1].game_id, "1002")
        self.assertEqual(result[1].game_name, "DOOM")
        self.assertEqual(result[1].time, 2000)

    def test_should_calculate_per_day_time_report_with_game_id(self):
        self.dao.save_game_dict("1001", "Zelda BOTW")
        self.dao.save_game_dict("1002", "DOOM")
        self.dao.save_play_time(datetime(2023, 1, 1, 9, 0), 3600, "1001")
        self.dao.save_play_time(datetime(2023, 1, 1, 11, 0), 1800, "1001")
        self.dao.save_play_time(datetime(2023, 1, 2, 10, 0), 2000, "1002")

        result = self.dao.fetch_per_day_time_report(
            datetime(2023, 1, 1, 0, 0), datetime(2023, 1, 2, 23, 59), "1001"
        )

        self.assertEqual(len(result), 1)

        self.assertEqual(result[0].date, "2023-01-01")
        self.assertEqual(result[0].game_id, "1001")
        self.assertEqual(result[0].game_name, "Zelda BOTW")
        self.assertEqual(result[0].time, 5400)

    def test_should_manually_added_playtime_for_tracked_game(self):
        self.dao.save_game_dict("1001", "Zelda BOTW")
        self.dao.save_play_time(datetime(2023, 1, 1, 11, 0), 1800, "1001")
        self.dao.apply_manual_time_for_game(
            create_at=datetime.now(),
            game_id="1001",
            game_name="Zelda BOTW",
            new_overall_time=3600,
            source="manually-added_time",
        )

        self.assertEqual(self._get_overall_time_for_game("1001"), 3600)

    def test_should_manually_added_playtime_for_not_tracked_game(self):
        self.dao.save_game_dict("1001", "Zelda BOTW")
        self.dao.apply_manual_time_for_game(
            create_at=datetime.now(),
            game_id="1001",
            game_name="Zelda BOTW",
            new_overall_time=3600,
            source="manually-added-time",
        )

        self.assertEqual(self._get_overall_time_for_game("1001"), 3600)

    def test_should_have_date_before(self):
        self.dao.save_game_dict("1001", "Zelda BOTW")
        self.dao.save_play_time(datetime(2023, 1, 1), 3600, "1001")

        has_data_before = self.dao.has_data_before(datetime(2025, 1, 5))

        self.assertEqual(has_data_before, True)

    def test_should_have_date_before_with_game_id(self):
        self.dao.save_game_dict("1001", "Zelda BOTW")
        self.dao.save_play_time(datetime(2023, 1, 1), 3600, "1001")

        has_data_before = self.dao.has_data_before(datetime(2025, 1, 1), "1001")

        self.assertEqual(has_data_before, True)

    def test_should_not_have_date_before(self):
        self.dao.save_game_dict("1001", "Zelda BOTW")
        self.dao.save_play_time(datetime(2025, 1, 1), 3600, "1001")

        has_data_before = self.dao.has_data_before(datetime(2025, 1, 1))

        self.assertEqual(has_data_before, False)

    def test_should_not_have_date_before_with_game_id(self):
        self.dao.save_game_dict("1001", "Zelda BOTW")
        self.dao.save_play_time(datetime(2025, 1, 1), 3600, "1001")

        has_data_before = self.dao.has_data_before(datetime(2025, 1, 1), "1001")

        self.assertEqual(has_data_before, False)

    def test_should_have_date_after(self):
        self.dao.save_game_dict("1001", "Zelda BOTW")
        self.dao.save_play_time(datetime(2025, 1, 1, 9, 0), 3600, "1001")

        has_data_after = self.dao.has_data_after(datetime(2023, 1, 1))

        self.assertEqual(has_data_after, True)

    def test_should_not_have_date_after_with_game_id(self):
        self.dao.save_game_dict("1001", "Zelda BOTW")
        self.dao.save_play_time(datetime(2025, 1, 1), 3600, "1001")

        has_data_after = self.dao.has_data_after(datetime(2025, 5, 1), "1001")

        self.assertEqual(has_data_after, False)

    def test_should_not_have_date_after_when_no_data_exists(self):
        has_data_after = self.dao.has_data_after(datetime(2025, 5, 1))

        self.assertEqual(has_data_after, False)

    def test_should_have_multiple_dates_before(self):
        self.dao.save_game_dict("1001", "Zelda BOTW")
        self.dao.save_play_time(datetime(2023, 1, 1), 3600, "1001")
        self.dao.save_play_time(datetime(2024, 1, 1), 7200, "1001")

        has_data_before = self.dao.has_data_before(datetime(2025, 1, 1))

        self.assertEqual(has_data_before, True)

    def test_should_have_data_before_with_multiple_games(self):
        self.dao.save_game_dict("1001", "Zelda BOTW")
        self.dao.save_play_time(datetime(2023, 1, 1), 3600, "1001")

        self.dao.save_game_dict("1002", "Mario Kart")
        self.dao.save_play_time(datetime(2024, 1, 1), 1800, "1002")

        has_data_before = self.dao.has_data_before(datetime(2025, 1, 1))

        self.assertEqual(has_data_before, True)

    def test_should_have_data_after_with_multiple_games(self):
        self.dao.save_game_dict("1001", "Zelda BOTW")
        self.dao.save_play_time(datetime(2025, 1, 1), 3600, "1001")

        self.dao.save_game_dict("1002", "Mario Kart")
        self.dao.save_play_time(datetime(2025, 5, 1), 7200, "1002")

        has_data_after = self.dao.has_data_after(datetime(2025, 1, 1))

        self.assertEqual(has_data_after, True)

    def test_should_not_have_data_after_for_specific_game(self):
        self.dao.save_game_dict("1001", "Zelda BOTW")
        self.dao.save_play_time(datetime(2025, 1, 1), 3600, "1001")

        self.dao.save_game_dict("1002", "Mario Kart")
        self.dao.save_play_time(datetime(2025, 5, 1), 7200, "1002")

        has_data_after = self.dao.has_data_after(
            datetime(2025, 1, 1, 23, 59, 59), "1001"
        )

        self.assertEqual(has_data_after, False)

    def test_should_not_have_data_after_when_no_playtime_exists(self):
        self.dao.save_game_dict("1001", "Zelda BOTW")

        has_data_after = self.dao.has_data_after(datetime(2025, 1, 1))

        self.assertEqual(has_data_after, False)

    def test_should_not_have_date_before_when_all_data_is_after(self):
        self.dao.save_game_dict("1001", "Zelda BOTW")
        self.dao.save_play_time(datetime(2025, 1, 1), 3600, "1001")
        self.dao.save_play_time(datetime(2025, 6, 1), 7200, "1001")

        has_data_before = self.dao.has_data_before(datetime(2025, 1, 1))

        self.assertEqual(has_data_before, False)

    def test_should_have_data_before_when_no_playtime_exists_for_game(self):
        self.dao.save_game_dict("1001", "Zelda BOTW")

        has_data_before = self.dao.has_data_before(datetime(2025, 1, 1), "1001")

        self.assertEqual(has_data_before, False)

    def test_should_not_have_date_before_when_equal_to_saved_playtime(self):
        self.dao.save_game_dict("1001", "Zelda BOTW")
        self.dao.save_play_time(datetime(2025, 1, 1), 3600, "1001")

        has_data_before = self.dao.has_data_before(datetime(2025, 1, 1))

        self.assertEqual(has_data_before, False)

    def test_should_have_data_after_for_current_date(self):
        self.dao.save_game_dict("1001", "Zelda BOTW")
        self.dao.save_play_time(datetime(2025, 7, 10), 3600, "1001")

        has_data_after = self.dao.has_data_after(datetime(2025, 7, 9))

        self.assertEqual(has_data_after, True)

    def test_should_have_data_before_after_with_zero_duration(self):
        self.dao.save_game_dict("1001", "Zelda BOTW")
        self.dao.save_play_time(datetime(2023, 1, 1), 0, "1001")

        has_data_before = self.dao.has_data_before(datetime(2025, 1, 1))
        has_data_after = self.dao.has_data_after(datetime(2022, 1, 1))

        self.assertEqual(has_data_before, True)
        self.assertEqual(has_data_after, True)

    def test_should_save_game_checksum(self):
        self.dao.save_game_dict("1001", "Zelda BOTW")
        self.dao.save_game_checksum(
            "10001",
            "10c28f0e7cd1917b2f595828df",
            "SHA256",
            16 * 1024 * 1024,
            None,
            None,
        )
        self.dao.save_game_checksum(
            "10001",
            "10c28f0e7cd1917b2f595828df12312",
            "SHA256",
            16 * 1024 * 1024,
            None,
            None,
        )
        result = self.dao.get_game_files_checksum("10001")

        self.assertEqual(len(result), 2)

    def test_should_remove_game_checksum(self):
        self.dao.save_game_dict("1001", "Zelda BOTW")
        self.dao.save_game_checksum(
            "10001",
            "10c28f0e7cd1917b2f595828df",
            "SHA256",
            16 * 1024 * 1024,
            None,
            None,
        )
        self.dao.save_game_checksum(
            "10001",
            "10c28f0e7cd1917b2f595828df12312",
            "SHA256",
            16 * 1024 * 1024,
            None,
            None,
        )

        self.dao.remove_game_checksum("10001", "10c28f0e7cd1917b2f595828df12312")

        result = self.dao.get_game_files_checksum("10001")

        self.assertEqual(len(result), 1)

    def test_should_remove_all_game_checksums(self):
        self.dao.save_game_dict("1001", "Zelda BOTW")
        self.dao.save_game_checksum(
            "10001",
            "10c28f0e7cd1917b2f595828df",
            "SHA256",
            16 * 1024 * 1024,
            None,
            None,
        )
        self.dao.save_game_checksum(
            "10001",
            "10c28f0e7cd1917b2f595828df12312",
            "SHA256",
            16 * 1024 * 1024,
            None,
            None,
        )

        self.dao.remove_all_game_checksums("10001")

        result = self.dao.get_game_files_checksum("10001")

        self.assertEqual(len(result), 0)

    def _get_overall_time_for_game(self, game_id: str):
        return list(
            filter(lambda x: x.game_id == game_id, self.dao.fetch_overall_playtime())
        )[0].time
