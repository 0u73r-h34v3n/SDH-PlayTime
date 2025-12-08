import decky
import dataclasses
import os
import sys
import asyncio
from pathlib import Path
from typing import List


decky_user_home = os.environ["DECKY_USER_HOME"]
data_dir = os.environ["DECKY_PLUGIN_RUNTIME_DIR"]
plugin_dir = Path(os.environ["DECKY_PLUGIN_DIR"])


def add_plugin_to_path():
    directories = [["./"], ["py_modules"]]

    for import_dir in directories:
        sys.path.append(str(plugin_dir.joinpath(*import_dir)))


add_plugin_to_path()

# pylint: disable=wrong-import-order, wrong-import-position
# ruff: noqa: E402
from py_modules.db.dao import Dao
from py_modules.db.migration import DbMigration
from py_modules.db.sqlite_db import SqlLiteDb
from py_modules.files import Files
from py_modules.games import Games
from py_modules.helpers import parse_date
from py_modules.statistics import Statistics
from py_modules.time_tracking import TimeTracking
from py_modules.schemas.request import (
    AddGameChecksumDict,
    AddTimeDict,
    ApplyManualTimeCorrectionDict,
    DailyStatisticsForPeriodDict,
    GetFileSHA256DTO,
    GetGameDTO,
    HasDataBeforeDict,
    RemoveAllGameChecksumsDTO,
    RemoveGameChecksumDTO,
)
from py_modules.dto.save_game_checksum import AddGameChecksumDTO
from py_modules.dto.statistics.daily_statistics_for_period import (
    DailyStatisticsForPeriodDTO,
)
from py_modules.dto.time.add_time import AddTimeDTO
from py_modules.utils.camel_case import convert_keys_to_camel_case
from py_modules.dto.time.apply_manual_time_correction import (
    ApplyManualTimeCorrectionDTO,
)
from py_modules.user_manager import UserManager


# pylint: enable=wrong-import-order, wrong-import-position
# autopep8: on


class Plugin:
    files: Files = Files()
    games: Games
    statistics: Statistics
    time_tracking: TimeTracking
    user_manager: UserManager

    async def _main(self):
        try:
            # Initialize UserManager for per-user database handling
            self.user_manager = UserManager(data_dir, decky.logger)

            # NOTE: Services (games, statistics, time_tracking) will be initialized
            # when set_current_user is called from the frontend.
            # For backward compatibility, if no user is set, we'll use legacy DB.
            self._initialize_legacy_fallback()
        except Exception as e:
            decky.logger.exception("[main] Unhandled exception: %s", e)
            raise e

    def _initialize_legacy_fallback(self):
        """
        Initialize services with legacy DB as fallback.
        This ensures backward compatibility if frontend doesn't send user ID.
        """
        legacy_dao = self.user_manager.get_legacy_dao()

        if legacy_dao is not None:
            self.games = Games(legacy_dao)
            self.statistics = Statistics(legacy_dao)
            self.time_tracking = TimeTracking(legacy_dao)
        else:
            # No legacy DB exists - services will be None until user is set
            self.games = None  # type: ignore
            self.statistics = None  # type: ignore
            self.time_tracking = None  # type: ignore

    def _get_current_dao(self) -> Dao:
        """
        Get the DAO for the current user.
        Falls back to legacy if no user is set.
        """
        dao = self.user_manager.get_current_dao()

        if dao is not None:
            return dao

        # Fallback to legacy
        legacy_dao = self.user_manager.get_legacy_dao()
        if legacy_dao is not None:
            return legacy_dao

        raise RuntimeError(
            "No user is set and no legacy database exists. "
            "Please call set_current_user first."
        )

    def _ensure_services_initialized(self):
        """Ensure services are initialized with current user's DAO."""
        dao = self._get_current_dao()

        # Re-initialize services if DAO has changed
        if self.games is None or self.games.dao is not dao:
            self.games = Games(dao)
            self.statistics = Statistics(dao)
            self.time_tracking = TimeTracking(dao)

    async def set_current_user(self, steam_user_id: str):
        """
        Set the current Steam user ID for per-user data isolation.

        This should be called from the frontend when a user logs in.
        If legacy storage.db exists and this user doesn't have their own DB yet,
        the legacy data will be migrated to their personal database.

        Args:
            steam_user_id: The 64-bit Steam ID as a string
        """
        try:
            decky.logger.info(f"[set_current_user] Setting user: {steam_user_id}")

            dao = self.user_manager.set_current_user(steam_user_id)

            # Update services to use new user's DAO
            self.games = Games(dao)
            self.statistics = Statistics(dao)
            self.time_tracking = TimeTracking(dao)

            decky.logger.info(
                f"[set_current_user] Successfully set user: {steam_user_id}"
            )
        except Exception as e:
            decky.logger.exception("[set_current_user] Unhandled exception: %s", e)
            raise e

    async def get_current_user(self) -> str | None:
        """
        Get the current Steam user ID.

        Returns:
            The current user's Steam ID, or None if not set
        """
        return self.user_manager.current_user_id

    async def add_time(self, dto_dict: AddTimeDict):
        try:
            self._ensure_services_initialized()
            dto = AddTimeDTO.from_dict(dto_dict)

            self.time_tracking.add_time(
                dto.started_at,
                dto.ended_at,
                dto.game_id,
                dto.game_name,
            )
        except Exception as e:
            decky.logger.exception("[add_time] Unhandled exception: %s", e)
            raise e

    async def daily_statistics_for_period(self, dto_dict: DailyStatisticsForPeriodDict):
        try:
            self._ensure_services_initialized()
            dto = DailyStatisticsForPeriodDTO.from_dict(dto_dict)

            return convert_keys_to_camel_case(
                self.statistics.daily_statistics_for_period(
                    parse_date(dto.start_date),
                    parse_date(dto.end_date),
                    dto.game_id,
                ).to_dict()
            )
        except Exception as e:
            decky.logger.exception(
                "[daily_statistics_for_period] Unhandled exception: %s", e
            )
            raise e

    async def statistics_for_last_two_weeks(self):
        try:
            self._ensure_services_initialized()
            return convert_keys_to_camel_case(
                self.statistics.get_statistics_for_last_two_weeks()
            )

        except Exception as e:
            decky.logger.exception(
                "[statistics_for_GameDictionary_weeks] Unhandled exception: %s", e
            )
            raise e

    async def fetch_playtime_information(self):
        try:
            self._ensure_services_initialized()
            return convert_keys_to_camel_case(
                self.statistics.fetch_playtime_information()
            )

        except Exception as e:
            decky.logger.exception(
                "[fetch_playtime_information] Unhandled exception: %s", e
            )
            raise e

    async def per_game_overall_statistics(self):
        try:
            self._ensure_services_initialized()
            return convert_keys_to_camel_case(
                self.statistics.per_game_overall_statistic()
            )
        except Exception as e:
            decky.logger.exception(
                "[per_game_overall_statistics] Unhandled exception: %s", e
            )
            raise e

    async def short_per_game_overall_statistics(self):
        try:
            self._ensure_services_initialized()
            return convert_keys_to_camel_case(
                self.statistics.per_game_overall_statistic()
            )
        except Exception as e:
            decky.logger.exception(
                "[per_game_overall_statistics] Unhandled exception: %s", e
            )
            raise e

    async def apply_manual_time_correction(
        self, list_of_game_stats: ApplyManualTimeCorrectionDict
    ):
        try:
            self._ensure_services_initialized()
            dto = ApplyManualTimeCorrectionDTO.from_dict(list_of_game_stats)
            return self.time_tracking.apply_manual_time_for_games(
                list_of_game_stats=dto, source="manually-changed"
            )
        except Exception as e:
            decky.logger.exception(
                "[apply_manual_time_correction] Unhandled exception: %s", e
            )
            raise e

    async def get_game(self, game_id: GetGameDTO):
        try:
            self._ensure_services_initialized()
            game_by_id = self.games.get_by_id(game_id)

            if game_by_id is None:
                return None

            return convert_keys_to_camel_case(game_by_id.to_dict())
        except Exception as e:
            decky.logger.exception("[get_game] Unhandled exception: %s", e)
            raise e

    async def has_min_required_python_version(self) -> bool:
        if sys.version_info < (3, 11):
            return False

        return True

    async def get_file_sha256(self, path: GetFileSHA256DTO):
        try:
            return await asyncio.to_thread(self.files.get_file_sha256, path)
        except Exception as e:
            decky.logger.exception("[get_file_sha256] Unhandled exception: %s", e)
            raise e

    async def get_games_dictionary(self):
        try:
            self._ensure_services_initialized()
            return convert_keys_to_camel_case(self.games.get_dictionary())
        except Exception as e:
            decky.logger.exception("[get_games_dictionary] Unhandled exception: %s", e)
            raise e

    async def save_game_checksum(self, dto_dict: AddGameChecksumDict):
        try:
            self._ensure_services_initialized()
            dto = AddGameChecksumDTO.from_dict(dto_dict)

            return self.games.save_game_checksum(
                dto.game_id,
                dto.checksum,
                dto.algorithm,
                dto.chunk_size,
                dto.created_at,
                dto.updated_at,
            )
        except Exception as e:
            decky.logger.exception("[save_game_checksum] Unhandled exception: %s", e)
            raise e

    async def save_game_checksum_bulk(self, dtos_list: List[AddGameChecksumDict]):
        try:
            self._ensure_services_initialized()
            dtos = [AddGameChecksumDTO.from_dict(dto_dict) for dto_dict in dtos_list]

            return self.games.save_game_checksum_bulk(dtos)
        except Exception as e:
            decky.logger.exception(
                "[save_game_checksum_bulk] Unhandled exception: %s", e
            )
            raise e

    async def remove_game_checksum(self, dto: RemoveGameChecksumDTO):
        try:
            self._ensure_services_initialized()
            return convert_keys_to_camel_case(
                self.games.remove_game_checksum(dto["game_id"], dto["checksum"])
            )
        except Exception as e:
            decky.logger.exception("[remove_game_checksum] Unhandled exception: %s", e)
            raise e

    async def remove_all_game_checksum(self, game_id: RemoveAllGameChecksumsDTO):
        try:
            self._ensure_services_initialized()
            return convert_keys_to_camel_case(
                self.games.remove_all_game_checksums(game_id)
            )
        except Exception as e:
            decky.logger.exception("[remove_game_checksum] Unhandled exception: %s", e)
            raise e

    async def remove_all_checksums(self):
        try:
            self._ensure_services_initialized()
            return self.games.remove_all_checksums()
        except Exception as e:
            decky.logger.exception("[remove_all_checksums] Unhandled exception: %s", e)
            raise e

    async def get_games_checksum(
        self,
    ):
        try:
            self._ensure_services_initialized()
            return convert_keys_to_camel_case(self.games.get_games_checksum())
        except Exception as e:
            decky.logger.exception("[get_games_checksum] Unhandled exception: %s", e)
            raise e

    async def link_game_to_game_with_checksum(
        self, child_game_id: str, parent_game_id: str
    ):
        try:
            self._ensure_services_initialized()
            return self.games.link_game_to_game_with_checksum(
                child_game_id, parent_game_id
            )
        except Exception as e:
            decky.logger.exception(
                "[link_game_to_game_with_checksum] Unhandled exception: %s", e
            )
            raise e

    async def get_decky_home(self):
        try:
            return decky_user_home
        except Exception as e:
            decky.logger.exception("[get_decky_home] Unhandled exception: %s", e)
            raise e

    async def has_data_before(self, dto_dict: HasDataBeforeDict):
        try:
            self._ensure_services_initialized()
            date = parse_date(dto_dict["date"])
            game_id = dto_dict["game_id"]
            return self.statistics.dao.has_data_before(date, game_id)
        except Exception as e:
            decky.logger.exception("[has_data_before] Unhandled exception: %s", e)
            raise e

    async def _unload(self):
        decky.logger.info("Goodnight, World!")

    async def _uninstall(self):
        decky.logger.info("Goodbye, World!")
