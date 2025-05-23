import dataclasses
from datetime import datetime, date, time, timedelta
from typing import Dict, List
from python.db.dao import DailyGameTimeDto, Dao
from python.helpers import format_date
from python.models import (
    DayStatistics,
    Game,
    GameInformationDto,
    GameWithTime,
    SessionInformation,
    PagedDayStatistics,
)


class Statistics:
    dao: Dao

    def __init__(self, dao: Dao) -> None:
        self.dao = dao

    def daily_statistics_for_period(
        self, start: date, end: date, game_id: str = None
    ) -> PagedDayStatistics:
        start_time = datetime.combine(start, time(00, 00, 00))
        end_time = datetime.combine(end, time(23, 59, 59, 999999))

        data = self.dao.fetch_per_day_time_report(start_time, end_time, game_id)

        data_as_dict: Dict[str, List[DailyGameTimeDto]] = {}

        for it in data:
            if it.date in data_as_dict:
                data_as_dict[it.date].append(it)
            else:
                data_as_dict[it.date] = [it]

        result: List[DayStatistics] = []
        date_range = self._generate_date_range(start, end)

        for day in date_range:
            date_str = format_date(day)

            if date_str in data_as_dict:
                games: List[Game] = []
                total_time = 0

                for el in data_as_dict[date_str]:
                    last_playtime_session_information = (
                        self.dao.fetch_last_playtime_session_information(el.game_id)
                    )
                    per_day_game_sessions_report = (
                        self.dao.fetch_per_day_game_sessions_report(
                            date_str, el.game_id
                        )
                    )

                    games.append(
                        GameWithTime(
                            Game(el.game_id, el.game_name),
                            el.time,
                            per_day_game_sessions_report,
                            SessionInformation(
                                date=last_playtime_session_information.date,
                                duration=last_playtime_session_information.duration,
                            ),
                        )
                    )

                    total_time += el.time

                result.append(
                    DayStatistics(date=date_str, games=games, total=total_time)
                )
            else:
                result.append(DayStatistics(date_str, [], 0))

        return PagedDayStatistics(
            data=result,
            hasPrev=self.dao.is_there_is_data_before(start_time, game_id),
            hasNext=self.dao.is_there_is_data_after(end_time, game_id),
        )

    def per_game_overall_statistic(self) -> List[GameWithTime]:
        data = self.dao.fetch_overall_playtime()
        result: List[GameWithTime] = []

        for g in data:
            last_playtime_session_information = (
                self.dao.fetch_last_playtime_session_information(g.game_id)
            )

            per_day_game_sessions_report = self.dao.fetch_game_sessions_report(
                g.game_id
            )

            result.append(
                dataclasses.asdict(
                    GameWithTime(
                        Game(g.game_id, g.game_name),
                        g.time,
                        per_day_game_sessions_report,
                        SessionInformation(
                            date=last_playtime_session_information.date,
                            duration=last_playtime_session_information.duration,
                        ),
                    )
                )
            )

        return result

    def _generate_date_range(self, start_date, end_date):
        date_list = []
        curr_date = start_date

        while curr_date <= end_date:
            date_list.append(curr_date)
            curr_date += timedelta(days=1)

        return date_list

    def get_game(self, game_id: int) -> GameInformationDto:
        response = self.dao.get_game(game_id)

        return GameInformationDto(id=response[0], name=response[1], time=response[2])
