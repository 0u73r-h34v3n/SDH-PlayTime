import dataclasses
import unittest
from datetime import datetime, timedelta
from py_modules.db.dao import Dao
from py_modules.db.migration import DbMigration
from py_modules.statistics import Statistics
from py_modules.tests.helpers import AbstractDatabaseTest
from py_modules.time_tracking import TimeTracking
from py_modules.games import Games
from py_modules.schemas.request import ApplyManualTimeCorrectionList
from py_modules.schemas.common import Game


class TestPlayTime(AbstractDatabaseTest):
    time_tracking: TimeTracking
    games: Games
    dao: Dao

    def setUp(self) -> None:
        super().setUp()
        DbMigration(db=self.database).migrate()
        self.time_tracking = TimeTracking(Dao(self.database))
        self.playtime_statistics = Statistics(Dao(self.database))
        self.games = Games(Dao(self.database))
        self.dao = Dao(db=self.database)

    def test_should_add_new_interval(self):
        now = datetime(2022, 1, 1, 9, 0)
        self.time_tracking.add_time(
            now.timestamp(), (now + timedelta(hours=1)).timestamp(), "100", "Zelda BOTW"
        )

        result = self.playtime_statistics.daily_statistics_for_period(
            now.date(), now.date()
        )

        self.assertEqual(
            [dataclasses.asdict(r) for r in result.data],
            [
                {
                    "date": "2022-01-01",
                    "games": [
                        {
                            "game": {
                                "id": "100",
                                "name": "Zelda BOTW",
                            },
                            "total_time": 3600,
                            "sessions": [
                                {
                                    "date": "2022-01-01T09:00:00",
                                    "duration": 3600,
                                    "migrated": None,
                                    "checksum": None,
                                },
                            ],
                            "last_session": {
                                "date": "2022-01-01T09:00:00",
                                "duration": 3600,
                                "migrated": None,
                                "checksum": None,
                            },
                        }
                    ],
                    "total": 3600,
                }
            ],
        )

    def test_should_add_new_interval_to_existing_game(self):
        now = datetime(2022, 1, 1, 9, 0)
        self.time_tracking.add_time(
            now.timestamp(),
            (now + timedelta(hours=1)).timestamp(),
            "3647351456",
            "Zelda BOTW",
        )
        self.time_tracking.add_time(
            (now + timedelta(hours=1)).timestamp(),
            (now + timedelta(hours=2)).timestamp(),
            "3647351456",
            "Zelda BOTW",
        )

        result = self.playtime_statistics.daily_statistics_for_period(
            now.date(), now.date()
        )
        self.maxDiff = None
        self.assertEqual(
            [dataclasses.asdict(r) for r in result.data],
            [
                {
                    "date": "2022-01-01",
                    "games": [
                        {
                            "game": {
                                "id": "3647351456",
                                "name": "Zelda BOTW",
                            },
                            "total_time": 7200,
                            "sessions": [
                                {
                                    "date": "2022-01-01T09:00:00",
                                    "duration": 3600,
                                    "migrated": None,
                                    "checksum": None,
                                },
                                {
                                    "date": "2022-01-01T10:00:00",
                                    "duration": 3600,
                                    "migrated": None,
                                    "checksum": None,
                                },
                            ],
                            "last_session": {
                                "date": "2022-01-01T10:00:00",
                                "duration": 3600,
                                "migrated": None,
                                "checksum": None,
                            },
                        }
                    ],
                    "total": 7200,
                }
            ],
        )

    def test_should_split_interval_in_two_day_in_case_night_session(self):
        now = datetime(2022, 1, 1, 23, 0)
        next_day = now + timedelta(hours=2)
        self.time_tracking.add_time(
            now.timestamp(), next_day.timestamp(), "100", "Zelda BOTW"
        )

        result = self.playtime_statistics.daily_statistics_for_period(
            now.date(), next_day.date()
        )
        self.assertEqual(
            [dataclasses.asdict(r) for r in result.data],
            [
                {
                    "date": "2022-01-01",
                    "games": [
                        {
                            "game": {
                                "id": "100",
                                "name": "Zelda BOTW",
                            },
                            "total_time": 3600,
                            "sessions": [
                                {
                                    "date": "2022-01-01T23:00:00",
                                    "duration": 3600,
                                    "migrated": None,
                                    "checksum": None,
                                }
                            ],
                            "last_session": {
                                "date": "2022-01-02T00:00:00",
                                "duration": 3600,
                                "migrated": None,
                                "checksum": None,
                            },
                        }
                    ],
                    "total": 3600,
                },
                {
                    "date": "2022-01-02",
                    "games": [
                        {
                            "game": {
                                "id": "100",
                                "name": "Zelda BOTW",
                            },
                            "total_time": 3600,
                            "sessions": [
                                {
                                    "date": "2022-01-02T00:00:00",
                                    "duration": 3600,
                                    "migrated": None,
                                    "checksum": None,
                                }
                            ],
                            "last_session": {
                                "date": "2022-01-02T00:00:00",
                                "duration": 3600,
                                "migrated": None,
                                "checksum": None,
                            },
                        }
                    ],
                    "total": 3600,
                },
            ],
        )

    def test_should_sum_total_time_per_day(self):
        now = datetime(2022, 1, 1, 9, 0)
        self.time_tracking.add_time(
            now.timestamp(), (now + timedelta(hours=1)).timestamp(), "100", "Zelda BOTW"
        )
        self.time_tracking.add_time(
            (now + timedelta(hours=1)).timestamp(),
            (now + timedelta(hours=1, minutes=30)).timestamp(),
            "101",
            "Doom",
        )

        result = self.playtime_statistics.daily_statistics_for_period(
            now.date(), now.date()
        )
        self.assertEqual(
            [dataclasses.asdict(r) for r in result.data],
            [
                {
                    "date": "2022-01-01",
                    "games": [
                        {
                            "game": {
                                "id": "100",
                                "name": "Zelda BOTW",
                            },
                            "total_time": 3600,
                            "sessions": [
                                {
                                    "date": "2022-01-01T09:00:00",
                                    "duration": 3600,
                                    "migrated": None,
                                    "checksum": None,
                                }
                            ],
                            "last_session": {
                                "date": "2022-01-01T09:00:00",
                                "duration": 3600,
                                "migrated": None,
                                "checksum": None,
                            },
                        },
                        {
                            "game": {
                                "id": "101",
                                "name": "Doom",
                            },
                            "total_time": 1800,
                            "sessions": [
                                {
                                    "date": "2022-01-01T10:00:00",
                                    "duration": 1800,
                                    "migrated": None,
                                    "checksum": None,
                                }
                            ],
                            "last_session": {
                                "date": "2022-01-01T10:00:00",
                                "duration": 1800,
                                "migrated": None,
                                "checksum": None,
                            },
                        },
                    ],
                    "total": 3600 + 1800,
                }
            ],
        )

    def test_return_only_data_in_requested_interval_without_gaps(self):
        date_01 = datetime(2022, 1, 1, 9, 0)
        self.time_tracking.add_time(
            date_01.timestamp(),
            (date_01 + timedelta(hours=1)).timestamp(),
            "100",
            "Zelda BOTW",
        )

        date_02 = datetime(2022, 1, 2, 9, 0)
        self.time_tracking.add_time(
            date_02.timestamp(),
            (date_02 + timedelta(hours=1)).timestamp(),
            "101",
            "Doom",
        )

        date_03 = datetime(2022, 1, 3, 9, 0)
        self.time_tracking.add_time(
            date_03.timestamp(),
            (date_03 + timedelta(minutes=30)).timestamp(),
            "102",
            "Zelda Minish Cap",
        )

        date_04 = datetime(2022, 1, 4, 9, 0)
        self.time_tracking.add_time(
            date_04.timestamp(),
            (date_04 + timedelta(minutes=30)).timestamp(),
            "100",
            "Zelda BOTW",
        )

        date_08 = datetime(2022, 1, 8, 9, 0)

        result = self.playtime_statistics.daily_statistics_for_period(
            date_02.date(), date_08.date()
        )
        # pylint: disable=C0103
        self.maxDiff = None
        self.assertEqual(
            [dataclasses.asdict(r) for r in result.data],
            [
                {
                    "date": "2022-01-02",
                    "games": [
                        {
                            "game": {
                                "id": "101",
                                "name": "Doom",
                            },
                            "total_time": 3600,
                            "sessions": [
                                {
                                    "date": "2022-01-02T09:00:00",
                                    "duration": 3600,
                                    "migrated": None,
                                    "checksum": None,
                                }
                            ],
                            "last_session": {
                                "date": "2022-01-02T09:00:00",
                                "duration": 3600,
                                "migrated": None,
                                "checksum": None,
                            },
                        }
                    ],
                    "total": 3600,
                },
                {
                    "date": "2022-01-03",
                    "games": [
                        {
                            "game": {
                                "id": "102",
                                "name": "Zelda Minish Cap",
                            },
                            "total_time": 1800,
                            "sessions": [
                                {
                                    "date": "2022-01-03T09:00:00",
                                    "duration": 1800,
                                    "migrated": None,
                                    "checksum": None,
                                }
                            ],
                            "last_session": {
                                "date": "2022-01-03T09:00:00",
                                "duration": 1800,
                                "migrated": None,
                                "checksum": None,
                            },
                        }
                    ],
                    "total": 1800,
                },
                {
                    "date": "2022-01-04",
                    "games": [
                        {
                            "game": {
                                "id": "100",
                                "name": "Zelda BOTW",
                            },
                            "total_time": 1800,
                            "sessions": [
                                {
                                    "date": "2022-01-04T09:00:00",
                                    "duration": 1800,
                                    "migrated": None,
                                    "checksum": None,
                                }
                            ],
                            "last_session": {
                                "date": "2022-01-04T09:00:00",
                                "duration": 1800,
                                "migrated": None,
                                "checksum": None,
                            },
                        }
                    ],
                    "total": 1800,
                },
                {"date": "2022-01-05", "games": [], "total": 0},
                {"date": "2022-01-06", "games": [], "total": 0},
                {"date": "2022-01-07", "games": [], "total": 0},
                {"date": "2022-01-08", "games": [], "total": 0},
            ],
        )

    def test_should_calculate_overall_time_for_game(self):
        now = datetime(2022, 1, 1, 9, 0)
        self.time_tracking.add_time(
            now.timestamp(), (now + timedelta(hours=1)).timestamp(), "101", "Zelda BOTW"
        )
        self.time_tracking.add_time(
            (now + timedelta(hours=1)).timestamp(),
            (now + timedelta(hours=1, minutes=30)).timestamp(),
            "101",
            "Zelda BOTW",
        )

        result = self.playtime_statistics.per_game_overall_statistic()
        self.assertEqual(result[0]["total_time"], 3600 + 1800)

    def test_should_apply_manual_time_for_games(self):
        now = datetime(2025, 1, 1, 9, 0)
        five_hours_delay = now + timedelta(hours=5)

        self.time_tracking.add_time(
            now.timestamp(),
            (now + timedelta(hours=1)).timestamp(),
            "101",
            "Zelda BOTW",
        )
        self.time_tracking.add_time(
            five_hours_delay.timestamp(),
            (five_hours_delay + timedelta(minutes=45)).timestamp(),
            "101",
            "Zelda BOTW",
        )

        apps = [
            ApplyManualTimeCorrectionList(game=Game("101", "Zelda BOTW"), time=1800),
        ]

        self.time_tracking.apply_manual_time_for_games(apps, "manually-changed")
        result = self.playtime_statistics.per_game_overall_statistic()

        # NOTE(ynhhoJ): This function remove `date` field from `result`, because when is applied
        # `apply_manual_time_for_games` it creates an internal `now` variable with current timestamp
        def remove_date_fields(data):
            if isinstance(data, list):
                return [remove_date_fields(item) for item in data]

            if isinstance(data, dict):
                return {
                    key: remove_date_fields(value)
                    for key, value in data.items()
                    if key != "date"
                }

            return data

        self.assertEqual(
            remove_date_fields(result),
            [
                {
                    "game": {"id": "101", "name": "Zelda BOTW"},
                    "last_session": {
                        "duration": -4500,
                        "migrated": "manually-changed",
                        "checksum": None,
                    },
                    "sessions": [
                        {
                            "duration": 3600,
                            "migrated": None,
                            "checksum": None,
                        },
                        {
                            "duration": 2700,
                            "migrated": None,
                            "checksum": None,
                        },
                        {
                            "duration": -4500,
                            "migrated": "manually-changed",
                            "checksum": None,
                        },
                    ],
                    "total_time": 1800,
                }
            ],
        )

    def test_should_merge_correctly_overall_statistic_of_games_with_same_checksum_and_without(
        self,
    ):
        now = datetime(2025, 7, 13, 1)

        self.time_tracking.add_time(
            now.timestamp(),
            (now + timedelta(seconds=58)).timestamp(),
            "3393530879",
            "Monster Hunter 4 Ultimate",
        )

        self.time_tracking.add_time(
            (now + timedelta(hours=1)).timestamp(),
            (now + timedelta(hours=1) + timedelta(minutes=13)).timestamp(),
            "1001",
            "Zelda BOTW",
        )

        first_play_time = datetime(2025, 1, 28, 1)

        self.time_tracking.add_time(
            first_play_time.timestamp(),
            (first_play_time + timedelta(seconds=14)).timestamp(),
            "3908342731",
            "Monster Hunter 4 Ultimate",
        )

        second_play_time = datetime(2025, 1, 28, 1)

        self.time_tracking.add_time(
            second_play_time.timestamp(),
            (second_play_time + timedelta(seconds=26)).timestamp(),
            "3908342731",
            "Monster Hunter 4 Ultimate",
        )

        third_play_time = datetime(2025, 7, 15, 21, 48, 13, 255000)

        self.time_tracking.add_time(
            third_play_time.timestamp(),
            (third_play_time + timedelta(hours=1)).timestamp(),
            "3908342731",
            "Monster Hunter 4 Ultimate",
        )

        self.time_tracking.add_time(
            (third_play_time + timedelta(hours=1, minutes=30)).timestamp(),
            (
                third_play_time
                + timedelta(hours=1, minutes=10)
                + timedelta(minutes=30, seconds=13)
            ).timestamp(),
            "1001",
            "Zelda BOTW",
        )

        self.games.save_game_checksum(
            "3393530879",
            "a3976a0553ba444ac96074ee2330a38a6b635e70a0c2a7ac2d0b568765ce2a0a",
            "SHA256",
            16 * 1024 * 1024,
            None,
            None,
        )

        self.games.save_game_checksum(
            "3908342731",
            "a3976a0553ba444ac96074ee2330a38a6b635e70a0c2a7ac2d0b568765ce2a0a",
            "SHA256",
            16 * 1024 * 1024,
            None,
            None,
        )

        result = self.playtime_statistics.per_game_overall_statistic()

        self.maxDiff = None
        self.assertEqual(
            result,
            [
                {
                    "game": {"id": "3393530879", "name": "Monster Hunter 4 Ultimate"},
                    "last_session": {
                        "date": "2025-07-15T21:48:13.255000",
                        "duration": 3600,
                        "migrated": None,
                        "checksum": "a3976a0553ba444ac96074ee2330a38a6b635e70a0c2a7ac2d0b568765ce2a0a",
                    },
                    "sessions": [
                        {
                            "date": "2025-07-13T01:00:00",
                            "duration": 58,
                            "migrated": None,
                            "checksum": "a3976a0553ba444ac96074ee2330a38a6b635e70a0c2a7ac2d0b568765ce2a0a",
                        },
                        {
                            "date": "2025-01-28T01:00:00",
                            "duration": 14,
                            "migrated": None,
                            "checksum": "a3976a0553ba444ac96074ee2330a38a6b635e70a0c2a7ac2d0b568765ce2a0a",
                        },
                        {
                            "date": "2025-01-28T01:00:00",
                            "duration": 26,
                            "migrated": None,
                            "checksum": "a3976a0553ba444ac96074ee2330a38a6b635e70a0c2a7ac2d0b568765ce2a0a",
                        },
                        {
                            "date": "2025-07-15T21:48:13.255000",
                            "duration": 3600,
                            "migrated": None,
                            "checksum": "a3976a0553ba444ac96074ee2330a38a6b635e70a0c2a7ac2d0b568765ce2a0a",
                        },
                    ],
                    "total_time": 3698,
                },
                {
                    "game": {"id": "1001", "name": "Zelda BOTW"},
                    "last_session": {
                        "checksum": None,
                        "date": "2025-07-15T23:18:13.255000",
                        "duration": 613,
                        "migrated": None,
                    },
                    "sessions": [
                        {
                            "checksum": None,
                            "date": "2025-07-13T02:00:00",
                            "duration": 780,
                            "migrated": None,
                        },
                        {
                            "checksum": None,
                            "date": "2025-07-15T23:18:13.255000",
                            "duration": 613,
                            "migrated": None,
                        },
                    ],
                    "total_time": 1393,
                },
            ],
        )

    def test_should_merge_correctly_daily_statistics_for_period_of_games_with_same_checksum_and_without(
        self,
    ):
        now = datetime(2025, 1, 1, 1)

        self.time_tracking.add_time(
            now.timestamp(),
            (now + timedelta(seconds=58)).timestamp(),
            "3393530879",
            "Monster Hunter 4 Ultimate",
        )

        self.time_tracking.add_time(
            (now + timedelta(hours=1)).timestamp(),
            (now + timedelta(hours=1) + timedelta(minutes=13)).timestamp(),
            "1001",
            "Zelda BOTW",
        )

        first_play_time = datetime(2025, 1, 2, 1)

        self.time_tracking.add_time(
            first_play_time.timestamp(),
            (first_play_time + timedelta(seconds=14)).timestamp(),
            "3908342731",
            "Monster Hunter 4 Ultimate",
        )
        self.time_tracking.add_time(
            (first_play_time + timedelta(minutes=30)).timestamp(),
            (first_play_time + timedelta(minutes=45)).timestamp(),
            "3393530879",
            "Monster Hunter 4 Ultimate",
        )

        second_play_time = datetime(2025, 1, 3, 1)

        self.time_tracking.add_time(
            second_play_time.timestamp(),
            (second_play_time + timedelta(seconds=26)).timestamp(),
            "3908342731",
            "Monster Hunter 4 Ultimate",
        )

        third_play_time = datetime(2025, 1, 4, 21, 48, 13, 255000)

        self.time_tracking.add_time(
            third_play_time.timestamp(),
            (third_play_time + timedelta(hours=1)).timestamp(),
            "3908342731",
            "Monster Hunter 4 Ultimate",
        )

        self.time_tracking.add_time(
            (third_play_time + timedelta(hours=1, minutes=30)).timestamp(),
            (
                third_play_time
                + timedelta(hours=1, minutes=10)
                + timedelta(minutes=30, seconds=13)
            ).timestamp(),
            "1001",
            "Zelda BOTW",
        )

        self.games.save_game_checksum(
            "3393530879",
            "a3976a0553ba444ac96074ee2330a38a6b635e70a0c2a7ac2d0b568765ce2a0a",
            "SHA256",
            16 * 1024 * 1024,
            None,
            None,
        )

        self.games.save_game_checksum(
            "3908342731",
            "a3976a0553ba444ac96074ee2330a38a6b635e70a0c2a7ac2d0b568765ce2a0a",
            "SHA256",
            16 * 1024 * 1024,
            None,
            None,
        )

        result = self.playtime_statistics.daily_statistics_for_period(
            datetime(2025, 1, 1).date(), datetime(2025, 1, 5).date()
        )

        self.maxDiff = None
        self.assertEqual(
            [dataclasses.asdict(r) for r in result.data],
            [
                {
                    "date": "2025-01-01",
                    "games": [
                        {
                            "game": {"id": "1001", "name": "Zelda BOTW"},
                            "last_session": {
                                "checksum": None,
                                "date": "2025-01-04T23:18:13.255000",
                                "duration": 613,
                                "migrated": None,
                            },
                            "sessions": [
                                {
                                    "checksum": None,
                                    "date": "2025-01-01T02:00:00",
                                    "duration": 780,
                                    "migrated": None,
                                }
                            ],
                            "total_time": 780,
                        },
                        {
                            "game": {
                                "id": "3393530879",
                                "name": "Monster Hunter 4 Ultimate",
                            },
                            "last_session": {
                                "checksum": "a3976a0553ba444ac96074ee2330a38a6b635e70a0c2a7ac2d0b568765ce2a0a",
                                "date": "2025-01-02T01:30:00",
                                "duration": 900,
                                "migrated": None,
                            },
                            "sessions": [
                                {
                                    "checksum": "a3976a0553ba444ac96074ee2330a38a6b635e70a0c2a7ac2d0b568765ce2a0a",
                                    "date": "2025-01-01T01:00:00",
                                    "duration": 58,
                                    "migrated": None,
                                }
                            ],
                            "total_time": 58,
                        },
                    ],
                    "total": 838.0,
                },
                {
                    "date": "2025-01-02",
                    "games": [
                        {
                            "game": {
                                "id": "3393530879",
                                "name": "Monster Hunter 4 Ultimate",
                            },
                            "last_session": {
                                "checksum": "a3976a0553ba444ac96074ee2330a38a6b635e70a0c2a7ac2d0b568765ce2a0a",
                                "date": "2025-01-02T01:30:00",
                                "duration": 900,
                                "migrated": None,
                            },
                            "sessions": [
                                {
                                    "checksum": "a3976a0553ba444ac96074ee2330a38a6b635e70a0c2a7ac2d0b568765ce2a0a",
                                    "date": "2025-01-02T01:30:00",
                                    "duration": 900,
                                    "migrated": None,
                                },
                                {
                                    "checksum": "a3976a0553ba444ac96074ee2330a38a6b635e70a0c2a7ac2d0b568765ce2a0a",
                                    "date": "2025-01-02T01:00:00",
                                    "duration": 14,
                                    "migrated": None,
                                },
                            ],
                            "total_time": 914,
                        },
                    ],
                    "total": 914.0,
                },
                {
                    "date": "2025-01-03",
                    "games": [
                        {
                            "game": {
                                "id": "3908342731",
                                "name": "Monster Hunter 4 Ultimate",
                            },
                            "last_session": {
                                "checksum": "a3976a0553ba444ac96074ee2330a38a6b635e70a0c2a7ac2d0b568765ce2a0a",
                                "date": "2025-01-04T21:48:13.255000",
                                "duration": 3600,
                                "migrated": None,
                            },
                            "sessions": [
                                {
                                    "checksum": "a3976a0553ba444ac96074ee2330a38a6b635e70a0c2a7ac2d0b568765ce2a0a",
                                    "date": "2025-01-03T01:00:00",
                                    "duration": 26,
                                    "migrated": None,
                                }
                            ],
                            "total_time": 26,
                        }
                    ],
                    "total": 26.0,
                },
                {
                    "date": "2025-01-04",
                    "games": [
                        {
                            "game": {"id": "1001", "name": "Zelda BOTW"},
                            "last_session": {
                                "checksum": None,
                                "date": "2025-01-04T23:18:13.255000",
                                "duration": 613,
                                "migrated": None,
                            },
                            "sessions": [
                                {
                                    "checksum": None,
                                    "date": "2025-01-04T23:18:13.255000",
                                    "duration": 613,
                                    "migrated": None,
                                }
                            ],
                            "total_time": 613,
                        },
                        {
                            "game": {
                                "id": "3908342731",
                                "name": "Monster Hunter 4 Ultimate",
                            },
                            "last_session": {
                                "checksum": "a3976a0553ba444ac96074ee2330a38a6b635e70a0c2a7ac2d0b568765ce2a0a",
                                "date": "2025-01-04T21:48:13.255000",
                                "duration": 3600,
                                "migrated": None,
                            },
                            "sessions": [
                                {
                                    "checksum": "a3976a0553ba444ac96074ee2330a38a6b635e70a0c2a7ac2d0b568765ce2a0a",
                                    "date": "2025-01-04T21:48:13.255000",
                                    "duration": 3600,
                                    "migrated": None,
                                }
                            ],
                            "total_time": 3600,
                        },
                    ],
                    "total": 4213.0,
                },
                {"date": "2025-01-05", "games": [], "total": 0.0},
            ],
        )


if __name__ == "__main__":
    unittest.main()
