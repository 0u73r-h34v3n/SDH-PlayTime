"""
Tracking status manager for controlling game tracking behavior.
"""

from typing import Optional, List, Dict
from py_modules.db.dao import Dao


class TrackingManager:
    """
    Manages tracking status configuration for games.

    Tracking statuses:
    - default: Shown in all statistics UI. New sessions are tracked.
    - pause: Shown in all statistics UI. New sessions aren't tracked.
    - hidden: Hidden from all statistics UI. Still tracked in background.
    - ignore: Hidden from all statistics UI. Not tracked.
    """

    VALID_STATUSES = ["default", "pause", "hidden", "ignore"]

    def __init__(self, dao: Dao):
        self.dao = dao

    def set_tracking_status(self, game_id: str, status: str) -> None:
        """
        Set the tracking status for a game.

        Args:
            game_id: The game ID
            status: One of 'default', 'pause', 'hidden', 'ignore'

        Raises:
            ValueError: If status is not valid
        """
        if status not in self.VALID_STATUSES:
            raise ValueError(
                f"Invalid status '{status}'. Must be one of: {', '.join(self.VALID_STATUSES)}"
            )

        # If setting to default, remove the entry (default is the absence of config)
        if status == "default":
            self.remove_tracking_status(game_id)
            return

        # Insert or update the tracking status
        self.dao.upsert_tracking_status(game_id, status)

    def get_tracking_status(self, game_id: str) -> str:
        """
        Get the tracking status for a game.

        Args:
            game_id: The game ID

        Returns:
            The tracking status ('default', 'pause', 'hidden', 'ignore')
        """
        status = self.dao.get_tracking_status(game_id)
        return status if status else "default"

    def remove_tracking_status(self, game_id: str) -> None:
        """
        Remove the tracking status for a game (revert to default).

        Args:
            game_id: The game ID
        """
        self.dao.delete_tracking_status(game_id)

    def get_all_tracking_configs(self) -> List[Dict[str, str]]:
        """
        Get all non-default tracking configurations.

        Returns:
            List of dicts with 'game_id', 'game_name', and 'status'
        """
        configs = self.dao.get_all_tracking_configs()
        return [
            {
                "game_id": config["game_id"],
                "game_name": config["game_name"],
                "status": config["status"],
            }
            for config in configs
        ]

    def should_track_session(self, game_id: str) -> bool:
        """
        Check if new sessions should be tracked for this game.

        Args:
            game_id: The game ID

        Returns:
            True if sessions should be tracked, False otherwise
        """
        status = self.get_tracking_status(game_id)
        return status in ["default", "hidden"]

    def should_show_in_ui(self, game_id: str) -> bool:
        """
        Check if this game should be shown in statistics UI.

        Args:
            game_id: The game ID

        Returns:
            True if game should be shown in UI, False otherwise
        """
        status = self.get_tracking_status(game_id)
        return status in ["default", "pause"]

    def get_bulk_visibility(self, game_ids: List[str]) -> Dict[str, bool]:
        """
        Efficiently check visibility for multiple games at once.

        This is more efficient than calling should_show_in_ui() for each game
        individually, especially when dealing with large lists of games.

        Args:
            game_ids: List of game IDs to check

        Returns:
            Dict mapping game_id to visibility status (True = visible, False = hidden)
        """
        if not game_ids:
            return {}

        # Get all non-default statuses from database in one query
        configs = self.dao.get_all_tracking_configs()
        status_map = {config["game_id"]: config["status"] for config in configs}

        # Build result: games not in status_map have default status (visible)
        # Games with 'default' or 'pause' status are visible
        # Games with 'hidden' or 'ignore' status are not visible
        result = {}
        for game_id in game_ids:
            status = status_map.get(game_id, "default")
            result[game_id] = status in ["default", "pause"]

        return result
