import unittest
from datetime import datetime
from py_modules.db.dao import Dao
from py_modules.db.migration import DbMigration
from py_modules.tracking_manager import TrackingManager
from py_modules.statistics import Statistics
from py_modules.time_tracking import TimeTracking
from py_modules.tests.helpers import AbstractDatabaseTest


class TestTrackingStatusBehavior(AbstractDatabaseTest):
    """
    Comprehensive tests for tracking status behavior across all statuses.

    Expected behavior:
    - Default: Shown in statistics, tracked
    - Pause: Shown in statistics, NOT tracked
    - Hidden: NOT shown in statistics, tracked
    - Ignore: NOT shown in statistics, NOT tracked
    """

    dao: Dao
    tracking_manager: TrackingManager
    time_tracking: TimeTracking
    statistics: Statistics

    def setUp(self) -> None:
        super().setUp()
        DbMigration(db=self.database).migrate()
        self.dao = Dao(db=self.database)
        self.tracking_manager = TrackingManager(dao=self.dao)
        self.time_tracking = TimeTracking(dao=self.dao)
        self.statistics = Statistics(
            dao=self.dao, tracking_manager=self.tracking_manager
        )

        # Create test games
        self.dao.save_game_dict("game1", "Test Game 1")
        self.dao.save_game_dict("game2", "Test Game 2")
        self.dao.save_game_dict("game3", "Test Game 3")
        self.dao.save_game_dict("game4", "Test Game 4")

    def _add_playtime(self, game_id: str, game_name: str, hours: int = 1):
        """Helper to add playtime for a game"""
        self.time_tracking.add_time(
            started_at=datetime(2023, 1, 1, 10, 0).timestamp(),
            ended_at=datetime(2023, 1, 1, 10 + hours, 0).timestamp(),
            game_id=game_id,
            game_name=game_name,
        )

    def _get_visible_game_ids(self):
        """Helper to get visible game IDs from statistics"""
        stats = self.statistics.per_game_overall_statistic()
        return [s["game"]["id"] for s in stats]

    def test_default_status_behavior(self):
        """
        Test DEFAULT status: game should appear in statistics and be tracked.

        Steps:
        1. Add game with playtime
        2. Verify game appears in statistics
        3. Verify should_track_session returns True
        4. Verify should_show_in_ui returns True
        """
        # Add playtime
        self._add_playtime("game1", "Test Game 1")

        # Should appear in statistics
        visible_games = self._get_visible_game_ids()
        self.assertIn(
            "game1",
            visible_games,
            "Game with default status should appear in statistics",
        )

        # Should track new sessions
        self.assertTrue(
            self.tracking_manager.should_track_session("game1"),
            "Default status should allow tracking new sessions",
        )

        # Should show in UI
        self.assertTrue(
            self.tracking_manager.should_show_in_ui("game1"),
            "Default status should show in UI",
        )

    def test_pause_status_behavior(self):
        """
        Test PAUSE status: game should appear in statistics but NOT be tracked.

        Steps:
        1. Add game with playtime
        2. Change status to pause
        3. Verify game still appears in statistics
        4. Verify should_track_session returns False
        5. Verify should_show_in_ui returns True
        """
        # Add playtime first
        self._add_playtime("game2", "Test Game 2")

        # Set to pause
        self.tracking_manager.set_tracking_status("game2", "pause")

        # Should still appear in statistics (existing time)
        visible_games = self._get_visible_game_ids()
        self.assertIn(
            "game2", visible_games, "Game with pause status should appear in statistics"
        )

        # Should NOT track new sessions
        self.assertFalse(
            self.tracking_manager.should_track_session("game2"),
            "Pause status should NOT allow tracking new sessions",
        )

        # Should show in UI
        self.assertTrue(
            self.tracking_manager.should_show_in_ui("game2"),
            "Pause status should show in UI",
        )

    def test_hidden_status_behavior(self):
        """
        Test HIDDEN status: game should NOT appear in statistics but still be tracked.

        Steps:
        1. Add game with playtime
        2. Verify game appears in statistics initially
        3. Change status to hidden
        4. Verify game no longer appears in statistics
        5. Verify should_track_session returns True
        6. Verify should_show_in_ui returns False
        """
        # Add playtime first
        self._add_playtime("game3", "Test Game 3")

        # Initially should appear
        visible_games = self._get_visible_game_ids()
        self.assertIn(
            "game3", visible_games, "Game should initially appear in statistics"
        )

        # Set to hidden
        self.tracking_manager.set_tracking_status("game3", "hidden")

        # Should NOT appear in statistics
        visible_games = self._get_visible_game_ids()
        self.assertNotIn(
            "game3",
            visible_games,
            "Game with hidden status should NOT appear in statistics",
        )

        # Should still track new sessions
        self.assertTrue(
            self.tracking_manager.should_track_session("game3"),
            "Hidden status should still allow tracking new sessions",
        )

        # Should NOT show in UI
        self.assertFalse(
            self.tracking_manager.should_show_in_ui("game3"),
            "Hidden status should NOT show in UI",
        )

    def test_ignore_status_behavior(self):
        """
        Test IGNORE status: game should NOT appear in statistics and NOT be tracked.

        Steps:
        1. Add game with playtime
        2. Change status to ignore
        3. Verify game no longer appears in statistics
        4. Verify should_track_session returns False
        5. Verify should_show_in_ui returns False
        """
        # Add playtime first
        self._add_playtime("game4", "Test Game 4")

        # Set to ignore
        self.tracking_manager.set_tracking_status("game4", "ignore")

        # Should NOT appear in statistics
        visible_games = self._get_visible_game_ids()
        self.assertNotIn(
            "game4",
            visible_games,
            "Game with ignore status should NOT appear in statistics",
        )

        # Should NOT track new sessions
        self.assertFalse(
            self.tracking_manager.should_track_session("game4"),
            "Ignore status should NOT allow tracking new sessions",
        )

        # Should NOT show in UI
        self.assertFalse(
            self.tracking_manager.should_show_in_ui("game4"),
            "Ignore status should NOT show in UI",
        )

    def test_status_change_default_to_hidden_to_default(self):
        """
        Test changing status: default → hidden → default

        Steps:
        1. Add game with playtime (default status)
        2. Verify appears in statistics
        3. Change to hidden
        4. Verify doesn't appear in statistics
        5. Change back to default
        6. Verify appears in statistics again
        """
        # Add playtime
        self._add_playtime("game1", "Test Game 1")

        # Initially visible (default)
        visible_games = self._get_visible_game_ids()
        self.assertIn(
            "game1", visible_games, "Game should be visible with default status"
        )

        # Set to hidden
        self.tracking_manager.set_tracking_status("game1", "hidden")
        visible_games = self._get_visible_game_ids()
        self.assertNotIn(
            "game1", visible_games, "Game should be hidden after status change"
        )

        # Set back to default
        self.tracking_manager.set_tracking_status("game1", "default")
        visible_games = self._get_visible_game_ids()
        self.assertIn(
            "game1", visible_games, "Game should be visible again with default status"
        )

    def test_all_statuses_mixed(self):
        """
        Test all statuses together in one scenario.

        Setup:
        - game1: default (visible, tracked)
        - game2: pause (visible, not tracked)
        - game3: hidden (not visible, tracked)
        - game4: ignore (not visible, not tracked)
        """
        # Add playtime for all games
        self._add_playtime("game1", "Test Game 1", hours=1)
        self._add_playtime("game2", "Test Game 2", hours=2)
        self._add_playtime("game3", "Test Game 3", hours=3)
        self._add_playtime("game4", "Test Game 4", hours=4)

        # Set statuses
        # game1: default (not set)
        self.tracking_manager.set_tracking_status("game2", "pause")
        self.tracking_manager.set_tracking_status("game3", "hidden")
        self.tracking_manager.set_tracking_status("game4", "ignore")

        # Check visibility in statistics
        visible_games = self._get_visible_game_ids()
        self.assertIn("game1", visible_games, "Default status should be visible")
        self.assertIn("game2", visible_games, "Pause status should be visible")
        self.assertNotIn("game3", visible_games, "Hidden status should NOT be visible")
        self.assertNotIn("game4", visible_games, "Ignore status should NOT be visible")

        # Check tracking behavior
        self.assertTrue(
            self.tracking_manager.should_track_session("game1"), "Default should track"
        )
        self.assertFalse(
            self.tracking_manager.should_track_session("game2"),
            "Pause should NOT track",
        )
        self.assertTrue(
            self.tracking_manager.should_track_session("game3"), "Hidden should track"
        )
        self.assertFalse(
            self.tracking_manager.should_track_session("game4"),
            "Ignore should NOT track",
        )

    def test_fetch_playtime_information_respects_status(self):
        """Test that fetch_playtime_information also filters by status"""
        # Add playtime for all games
        self._add_playtime("game1", "Test Game 1")
        self._add_playtime("game2", "Test Game 2")
        self._add_playtime("game3", "Test Game 3")
        self._add_playtime("game4", "Test Game 4")

        # Set statuses
        self.tracking_manager.set_tracking_status("game3", "hidden")
        self.tracking_manager.set_tracking_status("game4", "ignore")

        # Get playtime information
        playtime_info = self.statistics.fetch_playtime_information()
        visible_game_ids = [info["game"]["id"] for info in playtime_info]

        # Only game1 (default) and game2 (default) should be visible
        self.assertIn("game1", visible_game_ids)
        self.assertIn("game2", visible_game_ids)
        self.assertNotIn("game3", visible_game_ids, "Hidden game should not appear")
        self.assertNotIn("game4", visible_game_ids, "Ignored game should not appear")

    def test_set_tracking_status_default_removes_entry(self):
        """Test that setting status to 'default' removes the database entry"""
        self.tracking_manager.set_tracking_status("game1", "pause")
        self.assertEqual(self.tracking_manager.get_tracking_status("game1"), "pause")

        # Set back to default - should remove entry
        self.tracking_manager.set_tracking_status("game1", "default")
        self.assertEqual(self.tracking_manager.get_tracking_status("game1"), "default")

        # Verify it's not in configs
        configs = self.tracking_manager.get_all_tracking_configs()
        game_ids = [c["game_id"] for c in configs]
        self.assertNotIn("game1", game_ids, "Default status should not be in configs")

    def test_invalid_status_raises_error(self):
        """Test that setting an invalid status raises ValueError"""
        with self.assertRaises(ValueError) as context:
            self.tracking_manager.set_tracking_status("game1", "invalid_status")
        self.assertIn("Invalid status", str(context.exception))

    def test_case_sensitive_status_validation(self):
        """Test that status validation is case-sensitive"""
        with self.assertRaises(ValueError):
            self.tracking_manager.set_tracking_status("game1", "PAUSE")
        with self.assertRaises(ValueError):
            self.tracking_manager.set_tracking_status("game1", "Hidden")

    def test_get_all_tracking_configs_sorted(self):
        """Test getting all configs sorted by game name"""
        self.tracking_manager.set_tracking_status("game3", "pause")
        self.tracking_manager.set_tracking_status("game1", "hidden")
        self.tracking_manager.set_tracking_status("game2", "ignore")

        configs = self.tracking_manager.get_all_tracking_configs()
        self.assertEqual(len(configs), 3)

        # Should be sorted by game name
        self.assertEqual(configs[0]["game_name"], "Test Game 1")
        self.assertEqual(configs[1]["game_name"], "Test Game 2")
        self.assertEqual(configs[2]["game_name"], "Test Game 3")

    def test_get_bulk_visibility_empty_list(self):
        """Test bulk visibility with empty list"""
        result = self.tracking_manager.get_bulk_visibility([])
        self.assertEqual(result, {})

    def test_get_bulk_visibility_all_default(self):
        """Test bulk visibility when all games have default status"""
        result = self.tracking_manager.get_bulk_visibility(["game1", "game2", "game3"])

        self.assertEqual(len(result), 3)
        self.assertTrue(result["game1"])
        self.assertTrue(result["game2"])
        self.assertTrue(result["game3"])

    def test_get_bulk_visibility_mixed_statuses(self):
        """Test bulk visibility with mixed statuses"""
        # Set different statuses
        self.tracking_manager.set_tracking_status("game1", "pause")  # visible
        self.tracking_manager.set_tracking_status("game2", "hidden")  # not visible
        self.tracking_manager.set_tracking_status("game3", "ignore")  # not visible
        # game4 stays default (visible)

        result = self.tracking_manager.get_bulk_visibility(
            ["game1", "game2", "game3", "game4"]
        )

        self.assertEqual(len(result), 4)
        self.assertTrue(result["game1"], "Pause status should be visible")
        self.assertFalse(result["game2"], "Hidden status should not be visible")
        self.assertFalse(result["game3"], "Ignore status should not be visible")
        self.assertTrue(result["game4"], "Default status should be visible")

    def test_get_bulk_visibility_performance(self):
        """Test that bulk visibility is more efficient than individual calls"""
        # This test verifies the bulk method works with many games
        # In production, it reduces DB queries from N to 1

        # Create many games
        for i in range(5, 25):  # game5 through game24
            self.dao.save_game_dict(f"game{i}", f"Test Game {i}")

        # Set various statuses
        for i in range(5, 10):
            self.tracking_manager.set_tracking_status(f"game{i}", "hidden")
        for i in range(10, 15):
            self.tracking_manager.set_tracking_status(f"game{i}", "pause")

        # Get bulk visibility for all games
        all_game_ids = [f"game{i}" for i in range(1, 25)]
        result = self.tracking_manager.get_bulk_visibility(all_game_ids)

        self.assertEqual(len(result), 24)

        # Verify correctness
        for i in range(1, 5):
            self.assertTrue(result[f"game{i}"], f"game{i} should be visible (default)")
        for i in range(5, 10):
            self.assertFalse(
                result[f"game{i}"], f"game{i} should not be visible (hidden)"
            )
        for i in range(10, 15):
            self.assertTrue(result[f"game{i}"], f"game{i} should be visible (pause)")
        for i in range(15, 25):
            self.assertTrue(result[f"game{i}"], f"game{i} should be visible (default)")


class TestTrackingIntegrationWithProperChecking(AbstractDatabaseTest):
    """
    Integration tests that SIMULATE the fix by checking should_track_session
    before calling time_tracking.add_time(), exactly as main.py now does.

    These tests verify the CORRECT behavior after the fix is applied.
    """

    dao: Dao
    tracking_manager: TrackingManager
    time_tracking: TimeTracking
    statistics: Statistics

    def setUp(self) -> None:
        super().setUp()
        DbMigration(db=self.database).migrate()
        self.dao = Dao(db=self.database)
        self.tracking_manager = TrackingManager(dao=self.dao)
        self.time_tracking = TimeTracking(dao=self.dao)
        self.statistics = Statistics(
            dao=self.dao, tracking_manager=self.tracking_manager
        )

        # Create test games
        self.dao.save_game_dict("game1", "Test Game 1")
        self.dao.save_game_dict("game2", "Test Game 2")
        self.dao.save_game_dict("game3", "Test Game 3")

    def _add_time_with_tracking_check(self, game_id: str, game_name: str):
        """Helper that simulates main.py's add_time with tracking check"""
        if self.tracking_manager.should_track_session(game_id):
            self.time_tracking.add_time(
                started_at=datetime(2023, 1, 1, 10, 0).timestamp(),
                ended_at=datetime(2023, 1, 1, 11, 0).timestamp(),
                game_id=game_id,
                game_name=game_name,
            )

    def test_pause_status_prevents_tracking(self):
        """Test that pause status prevents tracking when properly checked"""
        self.tracking_manager.set_tracking_status("game1", "pause")

        # Try to add time with tracking check
        self._add_time_with_tracking_check("game1", "Test Game 1")

        # Should NOT have any playtime
        result = self.dao.fetch_overall_playtime()
        game_ids = [g.game_id for g in result]
        self.assertNotIn("game1", game_ids, "Pause should prevent tracking")

    def test_ignore_status_prevents_tracking(self):
        """Test that ignore status prevents tracking when properly checked"""
        self.tracking_manager.set_tracking_status("game1", "ignore")

        # Try to add time with tracking check
        self._add_time_with_tracking_check("game1", "Test Game 1")

        # Should NOT have any playtime
        result = self.dao.fetch_overall_playtime()
        game_ids = [g.game_id for g in result]
        self.assertNotIn("game1", game_ids, "Ignore should prevent tracking")

    def test_default_allows_tracking(self):
        """Test that default status allows tracking"""
        # Try to add time with tracking check (default status)
        self._add_time_with_tracking_check("game1", "Test Game 1")

        # Should have playtime
        result = self.dao.fetch_overall_playtime()
        game_ids = [g.game_id for g in result]
        self.assertIn("game1", game_ids, "Default should allow tracking")

    def test_hidden_allows_tracking(self):
        """Test that hidden status allows tracking but hides from UI"""
        self.tracking_manager.set_tracking_status("game1", "hidden")

        # Try to add time with tracking check
        self._add_time_with_tracking_check("game1", "Test Game 1")

        # Should have playtime in DB
        result = self.dao.fetch_overall_playtime()
        game_ids = [g.game_id for g in result]
        self.assertIn("game1", game_ids, "Hidden should allow tracking")

        # But should NOT appear in statistics
        stats = self.statistics.per_game_overall_statistic()
        stat_ids = [s["game"]["id"] for s in stats]
        self.assertNotIn("game1", stat_ids, "Hidden should hide from UI")

    def test_multiple_sessions_with_status_changes(self):
        """Test tracking behavior across status changes"""
        # Session 1: Default - should track
        self._add_time_with_tracking_check("game1", "Test Game 1")

        # Change to pause
        self.tracking_manager.set_tracking_status("game1", "pause")

        # Session 2: Paused - should NOT track
        if self.tracking_manager.should_track_session("game1"):
            self.time_tracking.add_time(
                started_at=datetime(2023, 1, 2, 10, 0).timestamp(),
                ended_at=datetime(2023, 1, 2, 11, 0).timestamp(),
                game_id="game1",
                game_name="Test Game 1",
            )

        # Should only have 1 hour tracked (first session)
        result = self.dao.fetch_overall_playtime()
        game1 = next(g for g in result if g.game_id == "game1")
        self.assertEqual(game1.time, 3600, "Only first session should be tracked")


if __name__ == "__main__":
    unittest.main()
