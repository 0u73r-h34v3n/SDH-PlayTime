from dataclasses import dataclass

from py_modules.db.sqlite_db import SqlLiteDb


@dataclass
class Migration:
    version: int
    statements: list[str]


_migrations = [
    Migration(
        1,
        [
            """
        CREATE TABLE play_time(
            date_time TEXT,
            duration INT,
            game_id TEXT
        )
        """,
            """
        CREATE TABLE overall_time(
            game_id TEXT PRIMARY KEY,
            duration INT
        )
        """,
            """
        CREATE TABLE game_dict(
            game_id TEXT PRIMARY KEY,
            name TEXT
        )
        """,
        ],
    ),
    Migration(
        2,
        [
            """
        CREATE INDEX play_time_date_time_epoch_idx
            ON play_time(STRFTIME('%s', date_time))
        """,
            """
        CREATE INDEX play_time_game_id_idx
            ON play_time(game_id)
        """,
            """
        CREATE INDEX overall_time_game_id_idx
            ON overall_time(game_id)
        """,
        ],
    ),
    Migration(3, ["ALTER TABLE play_time ADD COLUMN migrated TEXT"]),
    Migration(
        4,
        [
            """
        DROP INDEX play_time_date_time_epoch_idx
        """,
            """
        CREATE INDEX play_time_date_time_epoch_idx
            ON play_time(STRFTIME('%s', date_time))
        """,
        ],
    ),
    Migration(
        5,
        [
            """
        CREATE TABLE game_file_checksum(
            checksum_id INTEGER PRIMARY KEY AUTOINCREMENT,
            game_id TEXT NOT NULL,
            checksum TEXT NOT NULL,
            algorithm TEXT NOT NULL CHECK(algorithm IN (
                'BLAKE2B', 'BLAKE2S',
                'SHA224', 'SHA256', 'SHA384', 'SHA512', 'SHA512_224', 'SHA512_256',
                'SHA3_224', 'SHA3_256', 'SHA3_384', 'SHA3_512',
                'SHAKE_128', 'SHAKE_256'
            )),
            chunk_size INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (game_id) REFERENCES game_dict(game_id),
            UNIQUE (game_id, checksum, algorithm)
        );
        """,
            """
            CREATE INDEX 
                game_file_checksum_checksum_algorithm_idx
            ON
                game_file_checksum(checksum, algorithm);
            """,
        ],
    ),
    Migration(
        6,
        [
            """
            DROP INDEX IF EXISTS overall_time_game_id_idx;
            """,
            """
            DROP INDEX IF EXISTS  play_time_game_id_idx;
            """,
            """
            DROP INDEX IF EXISTS play_time_date_time_epoch_idx;
            """,
            """
            CREATE INDEX IF NOT EXISTS play_time_date_time_idx ON play_time(date_time);
            """,
            """
            CREATE INDEX IF NOT EXISTS 
                play_time_game_id_date_time_idx
            ON
                play_time(game_id, date_time);
            """,
        ],
    ),
]


class DbMigration:
    def __init__(self, db: SqlLiteDb):
        self.db = db

    def _current_migration_version(self):
        with self.db.transactional() as con:
            con.execute("CREATE TABLE IF NOT EXISTS migration (id INT PRIMARY KEY);")
            return con.execute(
                "SELECT coalesce(max(id), 0) as max_id FROM migration"
            ).fetchone()[0]

    def _migration(self, migration: Migration):
        version = self._current_migration_version()
        latest_version_in_migration = max(_migrations, key=lambda m: m.version).version

        if latest_version_in_migration < version:
            raise Exception(
                "Database have been updated with latest version. Please update plugin"
            )

        if migration.version > version:
            with self.db.transactional() as connection:
                for stm in migration.statements:
                    connection.execute(stm)

                connection.execute(
                    "INSERT INTO migration (id) VALUES (?)", [migration.version]
                )

    def migrate(self):
        for migration in _migrations:
            self._migration(migration)
