import dataclasses
from datetime import datetime, date, time, timedelta
from typing import Dict, List, Any, Optional
from py_modules.db.dao import DailyGameTimeDto, Dao, GameTimeDto
from py_modules.helpers import format_date
from py_modules.schemas.common import Game
from py_modules.schemas.response import (
    DayStatistics,
    GamePlaytimeDetails,
    SessionInformation,
    PagedDayStatistics,
    GamePlaytimeReport,
)
from dataclasses import dataclass
from py_modules.helpers import start_of_week, end_of_week


@dataclass(slots=True)
class PlayTimeWithHash:
    game_id: str
    checksum: Optional[str]


class Statistics:
    __slots__ = ("dao",)
    dao: Dao

    def __init__(self, dao: Dao) -> None:
        self.dao = dao

    def combine_games_by_checksum_per_day(
        self, days: List[DayStatistics]
    ) -> List[DayStatistics]:
        """
        Combines games played on the same day that share the same file checksum.
        This version is slightly cleaner and adds comments on its assumptions.
        """
        result_days = []

        for day in days:
            # Group games by checksum for the current day
            checksum_to_games: Dict[Optional[str], List[GamePlaytimeDetails]] = {}
            for gwt in day.games:
                # Assumption: The checksum of the first session is representative
                # for the purpose of grouping. Handle cases with no sessions.
                checksum = gwt.sessions[0].checksum if gwt.sessions else None
                if checksum not in checksum_to_games:
                    checksum_to_games[checksum] = []
                checksum_to_games[checksum].append(gwt)

            merged_games: List[GamePlaytimeDetails] = []
            for checksum, game_group in checksum_to_games.items():
                # If checksum is None or only one game has it, no merging is needed
                if checksum is None or len(game_group) == 1:
                    merged_games.extend(game_group)
                    continue

                # Merge multiple games with the same checksum
                # Assumption: The game identity (name, id) of the first game in the
                # group is used for the merged entry.
                representative_game = game_group[0]

                total_time = sum(g.total_time for g in game_group)

                all_sessions = [s for g in game_group for s in g.sessions]
                all_sessions.sort(key=lambda s: s.date, reverse=True)

                merged_games.append(
                    GamePlaytimeDetails(
                        game=representative_game.game,
                        total_time=total_time,
                        sessions=all_sessions,
                        # Last session is kept from the representative game
                        last_session=representative_game.last_session,
                    )
                )

            # Re-calculate total time for the day after merging
            total_day_time = sum(gwt.total_time for gwt in merged_games)
            result_days.append(
                DayStatistics(date=day.date, games=merged_games, total=total_day_time)
            )

        return result_days

    def _get_statistics_for_period(
        self, start_time: datetime, end_time: datetime, game_id: Optional[str] = None
    ):
        daily_reports, sessions_by_day_and_game, last_sessions_map = (
            self.dao.fetch_statistics_data_batch(start_time, end_time, game_id)
        )

        reports_by_date: Dict[str, List[DailyGameTimeDto]] = {}

        for report in daily_reports:
            if report.date not in reports_by_date:
                reports_by_date[report.date] = []
            reports_by_date[report.date].append(report)

        result_days: List[DayStatistics] = []

        for day in self._generate_date_range(start_time, end_time):
            date_str = format_date(day)

            day_games: List[GamePlaytimeDetails] = []
            total_day_time = 0.0

            for report in reports_by_date.get(date_str, []):
                # Retrieve pre-fetched data from our lookups (fast, no DB call)
                game_sessions = sessions_by_day_and_game.get(date_str, {}).get(
                    report.game_id, []
                )
                last_session = last_sessions_map.get(report.game_id)

                day_games.append(
                    GamePlaytimeDetails(
                        game=Game(report.game_id, report.game_name),
                        total_time=report.time,
                        sessions=game_sessions,
                        last_session=last_session,
                    )
                )
                total_day_time += report.time

            result_days.append(
                DayStatistics(date=date_str, games=day_games, total=total_day_time)
            )

        return self.combine_games_by_checksum_per_day(result_days)

    def daily_statistics_for_period(
        self, start: date, end: date, game_id: Optional[str] = None
    ) -> PagedDayStatistics:
        start_time = datetime.combine(start, time.min)
        end_time = datetime.combine(end, time.max)

        combined_data = self._get_statistics_for_period(start_time, end_time, game_id)

        has_prev = self.dao.has_data_before(start_time, game_id)
        has_next = self.dao.has_data_after(end_time, game_id)

        return PagedDayStatistics(
            data=combined_data,
            has_prev=has_prev,
            has_next=has_next,
        )

    def get_last_sessions_from_grouped_sessions(
        self, sessions_by_checksum: Dict[str, List[SessionInformation]]
    ) -> Dict[str, SessionInformation]:
        """
        Gets the last session for each checksum from the grouped sessions.
        Returns a dictionary mapping checksum to the most recent SessionInformation based on date.
        """
        last_sessions_by_checksum: Dict[str, SessionInformation] = {}

        for checksum, sessions in sessions_by_checksum.items():
            if sessions:
                last_session = max(
                    sessions,
                    key=lambda s: datetime.fromisoformat(s.date.replace("Z", "+00:00")),
                )
                last_sessions_by_checksum[checksum] = last_session

        return last_sessions_by_checksum

    def get_statistics_for_last_two_weeks(self):
        now = datetime.now()

        start_current_week = start_of_week(now)
        two_weeks_ago_start = start_current_week - timedelta(weeks=1)

        two_weeks_ago_end = end_of_week(now)

        return [
            GamePlaytimeReport(
                game=Game(information.game_id, information.game_name),
                total_time=information.total_time,
                last_played_date=information.last_played_date,
                aliases_id=information.aliases_id,
            ).to_dict()
            for information in self.dao.fetch_playtime_information_for_period(
                two_weeks_ago_start, two_weeks_ago_end
            )
        ]

    def fetch_playtime_information(self) -> List[dict[str, GamePlaytimeReport]]:
        return [
            GamePlaytimeReport(
                game=Game(information.game_id, information.game_name),
                total_time=information.total_time,
                last_played_date=information.last_played_date,
                aliases_id=information.aliases_id,
            ).to_dict()
            for information in self.dao.fetch_playtime_information()
        ]

    def per_game_overall_statistic(self) -> List[Dict[str, Any]]:
        """
        Returns overall statistics per game, grouped by checksum (or game_id if checksum is missing).
        """
        data = self.dao.fetch_overall_playtime()
        all_sessions = self.dao.fetch_all_game_sessions_report()

        games_by_key: Dict[str, List[GameTimeDto]] = {}

        for game_stat in data:
            key = game_stat.checksum or game_stat.game_id
            if key not in games_by_key:
                games_by_key[key] = []
            games_by_key[key].append(game_stat)

        sessions_by_key: Dict[str, List[SessionInformation]] = {}

        for game_id, session in all_sessions:
            key = session.checksum or game_id
            if key not in sessions_by_key:
                sessions_by_key[key] = []
            sessions_by_key[key].append(
                SessionInformation(
                    date=session.date,
                    duration=session.duration,
                    migrated=session.migrated,
                    checksum=session.checksum,
                )
            )

        # Get last session per group
        last_sessions_by_key = self.get_last_sessions_from_grouped_sessions(
            sessions_by_key
        )

        # Build result list directly using list comprehension for efficiency
        return [
            GamePlaytimeDetails(
                game=Game(game_stats[0].game_id, game_stats[0].game_name),
                total_time=sum(g.time for g in game_stats),
                sessions=sessions_by_key.get(key, []),
                last_session=(
                    last_sessions_by_key.get(key)
                    or last_sessions_by_key.get(game_stats[0].game_id)
                ),
            ).to_dict()
            for key, game_stats in games_by_key.items()
        ]

    def _generate_date_range(self, start_date, end_date):
        curr_date = start_date
        while curr_date <= end_date:
            yield curr_date
            curr_date += timedelta(days=1)
