import datetime
import sqlite3
from collections import defaultdict
from collections.abc import Collection
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

from py_modules.db.sqlite_db import SqlLiteDb
from py_modules.schemas.common import ChecksumAlgorithm


@dataclass
class GameTimeDto:
    game_id: str
    game_name: str
    time: int
    checksum: str


@dataclass
class DailyGameTimeDto:
    date: str
    game_id: str
    game_name: str
    time: int
    sessions: int
    checksum: str | None


@dataclass
class SessionInformation:
    date: str
    duration: float
    migrated: str | None
    checksum: str | None


@dataclass
class OverallGamesTimeDto:
    game_id: str
    game_name: str
    last_play_duration_time: float
    last_play_time_date: str
    time: int
    total_sessions: int


@dataclass
class GameInformationDto:
    game_id: str
    name: str
    time: float


@dataclass
class FileChecksum:
    checksum_id: int
    game_id: str
    game_name: str
    checksum: str
    algorithm: ChecksumAlgorithm
    chunk_size: int
    created_at: None | str
    updated_at: None | str


@dataclass
class GameDictionary:
    id: str
    name: str


@dataclass
class GamesChecksum:
    checksum_id: str
    game_id: str
    game_name: None | str
    checksum: str
    algorithm: ChecksumAlgorithm
    chunk_size: int
    created_at: None | str
    updated_at: None | str


@dataclass
class PlaytimeInformation:
    game_id: str
    total_time: float
    last_played_date: str
    game_name: str
    aliases_id: str | None


class Dao:
    def __init__(self, db: SqlLiteDb):
        self._db = db

    def save_game_dict(self, game_id: str, game_name: str) -> None:
        connection: sqlite3.Connection

        with self._db.transactional() as connection:
            self._save_game_dict(connection, game_id, game_name)

    def save_play_time(
        self,
        start: datetime.datetime,
        time_s: int,
        game_id: str,
        source: str | None = None,
    ) -> None:
        with self._db.transactional() as connection:
            self._save_play_time(connection, start, time_s, game_id, source)

    def apply_manual_time_for_game(
        self,
        create_at: datetime.datetime,
        game_id: str,
        game_name: str,
        new_overall_time: float,
        source: str,
    ) -> None:
        with self._db.transactional() as connection:
            self._save_game_dict(connection, game_id, game_name)
            current_time = connection.execute(
                "SELECT sum(duration) FROM play_time WHERE game_id = ?", (game_id,)
            ).fetchone()[0]
            delta_time = new_overall_time - (
                current_time if current_time is not None else 0
            )
            if delta_time != 0:
                self._save_play_time(connection, create_at, delta_time, game_id, source)

    def fetch_per_day_time_report(
        self,
        begin: datetime.datetime,
        end: datetime.datetime,
        game_id: str | None = None,
    ) -> List[DailyGameTimeDto]:
        with self._db.transactional() as connection:
            return self._fetch_per_day_time_report(connection, begin, end, game_id)

    def has_data_before(
        self, date: datetime.datetime, game_id: str | None = None
    ) -> bool:
        with self._db.transactional() as connection:
            return self._has_data_before(connection, date, game_id)

    def has_data_after(
        self, date: datetime.datetime, game_id: str | None = None
    ) -> bool:
        with self._db.transactional() as connection:
            return self._has_data_after(connection, date, game_id)

    def _has_data_before(
        self,
        connection: sqlite3.Connection,
        date: datetime.datetime,
        game_id: str | None = None,
    ) -> bool:
        if game_id:
            return (
                connection.execute(
                    """
                    SELECT EXISTS(SELECT 1 FROM play_time pt WHERE date_time < ? AND pt.game_id = ?)
                    """,
                    (
                        date.isoformat(),
                        game_id,
                    ),
                ).fetchone()[0]
                == 1
            )

        return (
            connection.execute(
                """
                SELECT EXISTS(SELECT 1 FROM play_time pt WHERE date_time < ?)
                """,
                (date.isoformat(),),
            ).fetchone()[0]
            == 1
        )

    def _has_data_after(
        self,
        connection: sqlite3.Connection,
        date: datetime.datetime,
        game_id: str | None = None,
    ) -> bool:
        if game_id:
            return (
                connection.execute(
                    """
                    SELECT EXISTS(SELECT 1 FROM play_time pt WHERE date_time > ? AND pt.game_id = ?)
                    """,
                    (
                        date.isoformat(),
                        game_id,
                    ),
                ).fetchone()[0]
                == 1
            )

        return (
            connection.execute(
                """
                    SELECT EXISTS(SELECT 1 FROM play_time pt WHERE date_time > ?)
            """,
                (date.isoformat(),),
            ).fetchone()[0]
            == 1
        )

    def _save_game_dict(
        self, connection: sqlite3.Connection, game_id: str, game_name: str
    ):
        connection.execute(
            """
                INSERT INTO game_dict (game_id, name)
                VALUES (:game_id, :game_name)
                ON CONFLICT (game_id) DO UPDATE SET name = :game_name
                WHERE name != :game_name
                """,
            {"game_id": game_id, "game_name": game_name},
        )

    def fetch_overall_playtime(self) -> List[GameTimeDto]:
        with self._db.transactional() as connection:
            return self._fetch_overall_playtime(connection)

    def _save_play_time(
        self,
        connection: sqlite3.Connection,
        start: datetime.datetime,
        time_s: float,
        game_id: str,
        source: str | None = None,
    ):
        connection.execute(
            """
                INSERT INTO play_time(date_time, duration, game_id, migrated)
                VALUES (?,?,?,?)
                """,
            (start.isoformat(), time_s, game_id, source),
        )
        self._append_overall_time(connection, game_id, time_s)

    # TODO: Add `_remove_play_time`

    def _append_overall_time(
        self, connection: sqlite3.Connection, game_id: str, delta_time_s: float
    ):
        connection.execute(
            """
                INSERT INTO overall_time (game_id, duration)
                VALUES (:game_id, :delta_time_s)
                ON CONFLICT (game_id)
                    DO UPDATE SET duration = duration + :delta_time_s
            """,
            {"game_id": game_id, "delta_time_s": delta_time_s},
        )

    def _fetch_overall_playtime(
        self,
        connection: sqlite3.Connection,
    ) -> List[GameTimeDto]:
        connection.row_factory = lambda c, row: GameTimeDto(
            game_id=row[0],
            game_name=row[1],
            time=row[2],
            checksum=row[3],
        )

        return connection.execute(
            """
            SELECT
                ot.game_id,
                gd.name AS game_name,
                ot.duration,
                gfc.checksum
            FROM
                overall_time ot
            JOIN 
                game_dict gd ON ot.game_id = gd.game_id
            LEFT JOIN (
                SELECT game_id, MIN(checksum) AS checksum
                FROM game_file_checksum
                GROUP BY game_id
            ) gfc ON ot.game_id = gfc.game_id;
            """
        ).fetchall()

    def fetch_playtime_information(self) -> List[PlaytimeInformation]:
        with self._db.transactional() as connection:
            return self._fetch_playtime_information(connection)

    def _fetch_playtime_information(
        self,
        connection: sqlite3.Connection,
    ) -> List[PlaytimeInformation]:
        connection.row_factory = lambda c, row: PlaytimeInformation(
            game_id=row[0],
            total_time=row[1],
            last_played_date=row[2],
            game_name=row[3],
            aliases_id=row[4],
        )

        return connection.execute(
            """
            WITH RECURSIVE
            -- Step 1: Find all direct alias pairs, simplified and optimized.
            -- We only need pairs where game_id_1 < game_id_2 to make the graph directed
            -- and reduce the number of pairs by half. This is a major optimization.
            AliasPairs (id1, id2) AS (
                SELECT DISTINCT gfc1.game_id, gfc2.game_id
                FROM game_file_checksum gfc1
                JOIN game_file_checksum gfc2 
                  ON gfc1.checksum = gfc2.checksum AND gfc1.algorithm = gfc2.algorithm
                WHERE gfc1.game_id < gfc2.game_id
            ),
            -- Step 2: Recursively find the component leader for each game.
            -- The "leader" is the smallest game_id in a connected component.
            ComponentLeaders (game_id, leader_id) AS (
                -- Anchor: Every game starts as its own leader.
                SELECT game_id, game_id FROM game_dict
                UNION -- In recursion, UNION is appropriate as it implicitly handles duplicates across iterations.
                -- Recursive part: Propagate the smallest leader_id across connections.
                -- If game 'c.game_id' has a leader 'c.leader_id', and it's connected to another
                -- game via an alias pair, propagate that leader.
                -- We check both directions of the edge.
                SELECT
                    ap.id2,           -- The game receiving the new leader
                    cl.leader_id      -- The leader being propagated
                FROM ComponentLeaders cl
                JOIN AliasPairs ap ON cl.game_id = ap.id1
                UNION
                SELECT
                    ap.id1,           -- The game receiving the new leader
                    cl.leader_id      -- The leader being propagated
                FROM ComponentLeaders cl
                JOIN AliasPairs ap ON cl.game_id = ap.id2
            ),
            -- Step 3: Find the definitive leader for each group.
            -- After recursion, a game might have been assigned multiple potential leaders.
            -- The true leader is the smallest one (the MIN).
            ComponentMapping AS (
                SELECT
                    game_id,
                    MIN(leader_id) as component_leader_id
                FROM ComponentLeaders
                GROUP BY game_id
            ),
            -- Step 4: Aggregate raw stats for each individual game_id.
            -- This CTE remains largely the same as it's clear and efficient.
            IndividualGameStats AS (
                SELECT
                    gd.game_id,
                    gd.name,
                    COALESCE(ot.duration, 0) AS total_duration,
                    pt_agg.last_played_date
                FROM game_dict gd
                LEFT JOIN overall_time ot ON gd.game_id = ot.game_id
                LEFT JOIN (
                    SELECT game_id, MAX(date_time) as last_played_date
                    FROM play_time
                    GROUP BY game_id
                ) pt_agg ON gd.game_id = pt_agg.game_id
            )
            -- Final Step: Group the individual stats by the component leader ID.
            SELECT
                cm.component_leader_id as game_id,
                SUM(igs.total_duration) AS total_time,
                MAX(igs.last_played_date) AS last_played_date,
                GROUP_CONCAT(DISTINCT igs.name) AS game_name,
                -- A cleaner way to list aliases: aggregate all IDs that are not the leader.
                NULLIF(GROUP_CONCAT(DISTINCT CASE WHEN igs.game_id <> cm.component_leader_id THEN igs.game_id END), '') AS aliases_id
            FROM ComponentMapping cm
            JOIN IndividualGameStats igs ON cm.game_id = igs.game_id
            GROUP BY cm.component_leader_id
            ORDER BY last_played_date DESC, game_id DESC;
            """
        ).fetchall()

    def fetch_playtime_information_for_period(
        self,
        start_time: datetime.datetime,
        end_time: datetime.datetime,
    ) -> List[PlaytimeInformation]:
        with self._db.transactional() as connection:
            return self._fetch_playtime_information_for_period(
                connection, start_time, end_time
            )

    def _fetch_playtime_information_for_period(
        self,
        connection: sqlite3.Connection,
        start_time: datetime.datetime,
        end_time: datetime.datetime,
    ) -> List[PlaytimeInformation]:
        connection.row_factory = lambda c, row: PlaytimeInformation(
            game_id=row[0],
            total_time=row[1],
            last_played_date=row[2],
            game_name=row[3],
            aliases_id=row[4],
        )
        return connection.execute(
            """
            WITH RECURSIVE
            AliasPairs (id1, id2) AS (
                SELECT DISTINCT gfc1.game_id, gfc2.game_id
                FROM game_file_checksum gfc1
                JOIN game_file_checksum gfc2
                    ON gfc1.checksum = gfc2.checksum AND gfc1.algorithm = gfc2.algorithm
                WHERE gfc1.game_id < gfc2.game_id
            ),
            ComponentLeaders (game_id, leader_id) AS (
                SELECT game_id, game_id FROM game_dict
                UNION
                SELECT ap.id2, cl.leader_id FROM ComponentLeaders cl JOIN AliasPairs ap ON cl.game_id = ap.id1
                UNION
                SELECT ap.id1, cl.leader_id FROM ComponentLeaders cl JOIN AliasPairs ap ON cl.game_id = ap.id2
            ),
            ComponentMapping AS (
                SELECT
                    game_id,
                    MIN(leader_id) as component_leader_id
                FROM ComponentLeaders
                GROUP BY game_id
            ),
            GameStats AS (
                SELECT
                    game_id,
                    -- Sum duration ONLY for sessions within the specified period.
                    SUM(CASE WHEN date_time >= :start AND date_time < :end THEN duration ELSE 0 END) AS period_duration,
                    -- Get the absolute last played date for the game across all time.
                    MAX(date_time) AS last_played_date
                FROM play_time
                GROUP BY game_id
            )
            -- Join all data, aggregate by group, and filter using HAVING.
            SELECT
                cm.component_leader_id AS game_id,
                SUM(gs.period_duration) AS total_time,
                MAX(gs.last_played_date) AS last_played_date,
                MAX(CASE WHEN gd.game_id = cm.component_leader_id THEN gd.name END) AS game_name,
                NULLIF(GROUP_CONCAT(DISTINCT CASE WHEN gd.game_id <> cm.component_leader_id THEN gd.game_id END), '') AS aliases_id
            FROM ComponentMapping cm
            -- Join to get the calculated stats for each game. INNER JOIN naturally filters out
            -- games that have never been played at all.
            JOIN GameStats gs ON cm.game_id = gs.game_id
            -- Join to get the names of the games.
            JOIN game_dict gd ON cm.game_id = gd.game_id
            -- Optional filter for a specific game group
            GROUP BY cm.component_leader_id
            -- HAVING clause filters the results AFTER grouping.
            -- This ensures we only see groups with playtime > 0 in the selected period.
            HAVING SUM(gs.period_duration) > 0
            ORDER BY last_played_date DESC, game_id DESC;
        """,
            {
                "start": start_time.isoformat(),
                "end": end_time.isoformat(),
            },
        ).fetchall()

    def _fetch_per_day_time_report(
        self,
        connection: sqlite3.Connection,
        begin: datetime.datetime,
        end: datetime.datetime,
        game_id: str | None = None,
    ) -> List[DailyGameTimeDto]:
        connection.row_factory = lambda c, row: DailyGameTimeDto(
            date=row[0],
            game_id=row[1],
            game_name=row[2],
            time=row[3],
            sessions=row[4],
            checksum=row[5],
        )

        if game_id:
            return connection.execute(
                """
                SELECT
                    STRFTIME('%Y-%m-%d', pt.date_time) AS date,
                    pt.game_id,
                    gd.name AS game_name,
                    SUM(pt.duration) AS total_time,
                    COUNT(*) AS sessions,
                    gfc.checksum
                FROM
                    play_time pt
                    LEFT JOIN game_dict gd ON pt.game_id = gd.game_id
                    LEFT JOIN game_file_checksum gfc ON gfc.game_id = pt.game_id
                WHERE
                    EXISTS (SELECT 1 FROM game_file_checksum WHERE game_id = :game_id)
                    AND pt.game_id IN (
                        SELECT DISTINCT gfc_alias.game_id
                        FROM game_file_checksum gfc_alias
                        WHERE gfc_alias.checksum IN (
                            SELECT gfc_base.checksum
                            FROM game_file_checksum gfc_base
                            WHERE gfc_base.game_id = :game_id
                        )
                    )
                    AND pt.date_time BETWEEN :begin AND :end
                    AND pt.migrated IS NULL
                GROUP BY
                    date, pt.game_id, gd.name, gfc.checksum
                UNION ALL
                SELECT
                    STRFTIME('%Y-%m-%d', pt.date_time) AS date,
                    pt.game_id,
                    gd.name AS game_name,
                    SUM(pt.duration) AS total_time,
                    COUNT(*) AS sessions,
                    NULL AS checksum -- Checksum is guaranteed to be NULL in this case
                FROM
                    play_time pt
                    LEFT JOIN game_dict gd ON pt.game_id = gd.game_id
                WHERE
                    NOT EXISTS (SELECT 1 FROM game_file_checksum WHERE game_id = :game_id)
                    AND pt.game_id = :game_id
                    AND pt.date_time BETWEEN :begin AND :end
                    AND pt.migrated IS NULL
                GROUP BY
                    date, pt.game_id, gd.name
                ORDER BY
                    date, game_name;
            """,
                {
                    "begin": begin.isoformat(),
                    "end": end.isoformat(),
                    "game_id": game_id,
                },
            ).fetchall()

        result = connection.execute(
            """
            SELECT
                STRFTIME('%Y-%m-%d', pt.date_time) AS date,
                pt.game_id,
                gd.name AS game_name,
                SUM(pt.duration) AS total_time,
                COUNT(*) AS sessions,
                gfc.checksum
            FROM play_time pt
            LEFT JOIN game_dict gd ON pt.game_id = gd.game_id
            LEFT JOIN game_file_checksum gfc ON gfc.game_id = pt.game_id
            WHERE pt.date_time BETWEEN :begin AND :end
                AND pt.migrated IS NULL
            GROUP BY
                STRFTIME('%Y-%m-%d', pt.date_time),
                pt.game_id,
                gfc.checksum;
            """,
            {"begin": begin.isoformat(), "end": end.isoformat()},
        ).fetchall()
        return result

    def fetch_all_game_sessions_report(self) -> List[tuple[str, SessionInformation]]:
        with self._db.transactional() as connection:
            connection.row_factory = lambda c, row: (
                row[0],  # game_id
                SessionInformation(
                    date=row[1], duration=row[2], migrated=row[3], checksum=row[4]
                ),
            )

            return connection.execute(
                """
                SELECT
                    pt.game_id,
                    pt.date_time,
                    pt.duration,
                    pt.migrated,
                    gfc.checksum
                FROM
                    play_time pt
                LEFT JOIN
                    game_file_checksum gfc
                ON
                    pt.game_id = gfc.game_id
                ORDER BY
                    pt.game_id, pt.date_time;
            """
            ).fetchall()

    def fetch_all_last_playtime_session_information(
        self,
    ) -> Dict[str, SessionInformation]:
        with self._db.transactional() as connection:
            connection.row_factory = lambda c, row: (
                row[0],  # game_id
                SessionInformation(
                    date=row[1],
                    duration=row[2],
                    migrated=row[3],
                    checksum=row[4],
                ),
            )

            return dict(
                connection.execute(
                    """
                SELECT
                    pt.game_id,
                    pt.date_time,
                    pt.duration,
                    pt.migrated,
                    gfc.checksum
                FROM (
                    SELECT
                        *,
                        ROW_NUMBER() OVER (PARTITION BY game_id ORDER BY date_time DESC) AS rn
                    FROM play_time
                ) pt
                LEFT JOIN game_file_checksum gfc ON gfc.game_id = pt.game_id
                WHERE pt.rn = 1;
                """
                ).fetchall()
            )

    def fetch_sessions_for_period(
        self,
        start_time: datetime.datetime,
        end_time: datetime.datetime,
        game_id: Optional[str] = None,
    ) -> Dict[str, Dict[str, List[SessionInformation]]]:
        with self._db.transactional() as connection:
            return self._fetch_sessions_for_period(
                connection,
                start_time,
                end_time,
                game_id,
            )

    def _fetch_sessions_for_period(
        self,
        connection: sqlite3.Connection,
        start_time: datetime.datetime,
        end_time: datetime.datetime,
        game_id: Optional[str] = None,
    ) -> Dict[str, Dict[str, List[SessionInformation]]]:
        query = ""

        if game_id is not None:
            query = """
            WITH TargetChecksums AS (
                SELECT DISTINCT checksum
                FROM game_file_checksum
                WHERE game_id = :game_id
            )
            SELECT
                strftime('%Y-%m-%d', pt.date_time) as session_date,
                pt.game_id,
                pt.date_time,
                pt.duration,
                pt.migrated,
                gfc.checksum
            FROM
                play_time pt
            LEFT JOIN
                game_file_checksum gfc ON pt.game_id = gfc.game_id
            WHERE
                pt.date_time >= :start AND pt.date_time < :end
                AND (
                    pt.game_id = :game_id
                    OR
                    gfc.checksum IN (SELECT checksum FROM TargetChecksums)
                )
            ORDER BY
                session_date, pt.game_id, pt.date_time;
            """
        else:
            query = """
            SELECT
                strftime('%Y-%m-%d', pt.date_time) as session_date,
                pt.game_id,
                pt.date_time,
                pt.duration,
                pt.migrated,
                gfc.checksum
            FROM
                play_time pt
            LEFT JOIN
                game_file_checksum gfc ON pt.game_id = gfc.game_id
            WHERE
                pt.date_time >= :start AND pt.date_time < :end
            ORDER BY
                session_date, pt.game_id, pt.date_time;
            """

        params = {
            "start": start_time.isoformat(),
            "end": end_time.isoformat(),
        }

        game_id_filter = ""
        if game_id is not None:
            game_id_filter = "AND pt.game_id = :game_id"
            params["game_id"] = game_id

        query = query.format(game_id_filter=game_id_filter)

        sessions_by_day_and_game: Dict[str, Dict[str, List[SessionInformation]]] = (
            defaultdict(lambda: defaultdict(list))
        )

        connection.row_factory = lambda c, row: (
            row[0],  # session_date
            row[1],  # game_id
            SessionInformation(
                date=row[2],
                duration=row[3],
                migrated=row[4],
                checksum=row[5],
            ),
        )

        rows = connection.execute(query, params).fetchall()

        for session_date, game_id_val, session_info in rows:
            sessions_by_day_and_game[session_date][game_id_val].append(session_info)

        return sessions_by_day_and_game

    def fetch_last_sessions_for_games(
        self,
        game_ids: Collection[str],
    ) -> Dict[str, SessionInformation]:
        with self._db.transactional() as connection:
            return self._fetch_last_sessions_for_games(
                connection,
                game_ids,
            )

    def _fetch_last_sessions_for_games(
        self,
        connection: sqlite3.Connection,
        game_ids: Collection[str],
    ) -> Dict[str, SessionInformation]:
        game_ids_list = list(game_ids)
        placeholders = ", ".join("?" for _ in game_ids_list)

        connection.row_factory = lambda c, row: (
            row[0],
            SessionInformation(
                date=row[1],
                duration=row[2],
                migrated=row[3],
                checksum=row[4],
            ),
        )

        query = f"""
            SELECT
                pt.game_id,
                pt.date_time,
                pt.duration,
                pt.migrated,
                gfc.checksum
            FROM (
                SELECT
                    *,
                    ROW_NUMBER() OVER (PARTITION BY game_id ORDER BY date_time DESC) AS rn
                FROM play_time
                WHERE game_id IN ({placeholders})
            ) pt
            LEFT JOIN game_file_checksum gfc ON gfc.game_id = pt.game_id
            WHERE pt.rn = 1;
        """

        rows = connection.execute(query, game_ids_list).fetchall()

        return dict(rows)

    def get_game(self, game_id: str) -> GameInformationDto | None:
        with self._db.transactional() as connection:
            return self._get_game(connection, game_id)

    def _get_game(
        self, connection: sqlite3.Connection, game_id: str
    ) -> GameInformationDto | None:
        connection.row_factory = lambda c, row: GameInformationDto(
            game_id=row[0], name=row[1], time=row[2]
        )

        return connection.execute(
            """
            SELECT
                gd.game_id,
                gd.name,
                ot.duration as time
            FROM
                game_dict gd
            INNER JOIN overall_time ot
                ON gd.game_id = ot.game_id
            WHERE
                gd.game_id = ?
            """,
            (game_id,),
        ).fetchone()

    def get_games_dictionary(self) -> List[GameDictionary]:
        with self._db.transactional() as connection:
            return self._get_games_dictionary(connection)

    def _get_games_dictionary(
        self, connection: sqlite3.Connection
    ) -> List[GameDictionary]:
        connection.row_factory = lambda c, row: GameDictionary(
            id=row[0],
            name=row[1],
        )

        return connection.execute(
            """
            SELECT
                gd.game_id,
                gd.name
            FROM
                game_dict gd;
            """,
        ).fetchall()

    def get_game_files_checksum(self, game_id: str) -> List[FileChecksum]:
        with self._db.transactional() as connection:
            return self._get_game_files_checksum(connection, game_id)

    def _get_game_files_checksum(
        self, connection: sqlite3.Connection, game_id: str
    ) -> List[FileChecksum]:
        connection.row_factory = lambda c, row: FileChecksum(
            row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7]
        )

        return connection.execute(
            """
            SELECT
                gfc.checksum_id,
                gfc.game_id,
                gd.name,
                gfc.checksum,
                gfc.algorithm,
                gfc.chunk_size,
                gfc.created_at,
                gfc.updated_at
            FROM
                game_file_checksum gfc
            LEFT JOIN game_dict gd ON gd.game_id = gfc.game_id
            WHERE
                gfc.game_id = ?
            """,
            (game_id,),
        ).fetchall()

    def save_game_checksum(
        self,
        game_id: str,
        hash_checksum: str,
        hash_algorithm: str,
        hash_chunk_size: int,
        hash_created_at: None | str,
        hash_updated_at: None | str,
    ) -> None:
        with self._db.transactional() as connection:
            self._save_game_checksum(
                connection,
                game_id,
                hash_checksum,
                hash_algorithm,
                hash_chunk_size,
                hash_created_at,
                hash_updated_at,
            )

    def _save_game_checksum(
        self,
        connection: sqlite3.Connection,
        game_id: str,
        hash_checksum: str,
        hash_algorithm: str,
        hash_chunk_size: int,
        hash_created_at: None | str,
        hash_updated_at: None | str,
    ):
        connection.execute(
            """
                INSERT INTO game_file_checksum(game_id, checksum, algorithm, chunk_size, created_at, updated_at)
                VALUES (?, ?, ?, ?, IFNULL(?, CURRENT_TIMESTAMP), IFNULL(?, CURRENT_TIMESTAMP))
                """,
            (
                game_id,
                hash_checksum,
                hash_algorithm,
                hash_chunk_size,
                hash_created_at,
                hash_updated_at,
            ),
        )

    def save_game_checksum_bulk(
        self,
        checksums_data: List[Tuple[str, str, str, int, Optional[str], Optional[str]]],
    ) -> None:
        with self._db.transactional() as connection:
            self._save_game_checksum_bulk(connection, checksums_data)

    def _save_game_checksum_bulk(
        self,
        connection: sqlite3.Connection,
        checksums_data: List[Tuple[str, str, str, int, Optional[str], Optional[str]]],
    ):
        connection.executemany(
            """
            INSERT OR IGNORE INTO game_file_checksum(game_id, checksum, algorithm, chunk_size, created_at, updated_at)
            VALUES (?, ?, ?, ?, IFNULL(?, CURRENT_TIMESTAMP), IFNULL(?, CURRENT_TIMESTAMP))
            """,
            checksums_data,
        )

    def remove_game_checksum(
        self,
        game_id: str,
        checksum: str,
    ) -> None:
        with self._db.transactional() as connection:
            self._remove_game_checksum(
                connection,
                game_id,
                checksum,
            )

    def _remove_game_checksum(
        self,
        connection: sqlite3.Connection,
        game_id: str,
        checksum: str,
    ):
        connection.execute(
            """
                DELETE FROM game_file_checksum WHERE game_id = ? AND checksum = ?
                """,
            (
                game_id,
                checksum,
            ),
        )

    def remove_all_game_checksums(
        self,
        game_id: str,
    ) -> None:
        with self._db.transactional() as connection:
            self._remove_all_game_checksums(
                connection,
                game_id,
            )

    def _remove_all_game_checksums(
        self,
        connection: sqlite3.Connection,
        game_id: str,
    ):
        connection.execute(
            """
                DELETE FROM game_file_checksum WHERE game_id = ?
                """,
            (game_id,),
        )

    def get_games_checksum(
        self,
    ) -> List[GamesChecksum]:
        with self._db.transactional() as connection:
            return self._get_games_checksum(
                connection,
            )

    def _get_games_checksum(
        self,
        connection: sqlite3.Connection,
    ) -> List[GamesChecksum]:
        connection.row_factory = lambda c, row: GamesChecksum(
            row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7]
        )

        return connection.execute(
            """
            SELECT
                checksum_id,
                gfc.game_id,
                gd.name,
                checksum,
                algorithm,
                chunk_size,
                created_at,
                updated_at
            FROM
                game_file_checksum gfc
            LEFT JOIN
                game_dict gd
            ON gfc.game_id = gd.game_id;
            """,
        ).fetchall()

    def remove_all_checksums(
        self,
    ) -> int:
        with self._db.transactional() as connection:
            return self._remove_all_checksums(
                connection,
            )

    def _remove_all_checksums(
        self,
        connection: sqlite3.Connection,
    ) -> int:
        cursor = connection.execute(
            """
            DELETE
            FROM
                game_file_checksum;
            """,
        )

        return cursor.rowcount

    def link_game_to_game_with_checksum(
        self, child_game_id: str, parent_game_id: str
    ) -> None:
        with self._db.transactional() as connection:
            self._link_game_to_game_with_checksum(
                connection, child_game_id, parent_game_id
            )

    def _link_game_to_game_with_checksum(
        self,
        connection: sqlite3.Connection,
        child_game_id,
        parent_game_id,
    ):
        return connection.execute(
            """
                INSERT INTO game_file_checksum(game_id, checksum, algorithm, chunk_size)
                SELECT
                    ?,
                    gfc.checksum,
                    gfc.algorithm,
                    gfc.chunk_size
                FROM
                    game_file_checksum AS gfc
                WHERE
                    gfc.game_id = ?
                LIMIT 1;
                """,
            (
                child_game_id,
                parent_game_id,
            ),
        )
