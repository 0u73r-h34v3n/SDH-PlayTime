import unittest
from datetime import datetime
from py_modules.db.dao import Dao
from py_modules.db.migration import DbMigration
from py_modules.association_manager import AssociationManager
from py_modules.tests.helpers import AbstractDatabaseTest


class TestAssociationManager(AbstractDatabaseTest):
    dao: Dao
    association_manager: AssociationManager

    def setUp(self) -> None:
        super().setUp()
        DbMigration(db=self.database).migrate()
        self.dao = Dao(db=self.database)
        self.association_manager = AssociationManager(dao=self.dao)

    def _create_game(self, game_id: str, game_name: str, playtime_seconds: int = 3600):
        """Helper to create a game with playtime."""
        self.dao.save_game_dict(game_id, game_name)
        self.dao.save_play_time(
            start=datetime(2023, 1, 1, 10, 0),
            time_s=playtime_seconds,
            game_id=game_id,
            source=None,
        )

    # ========== create_association tests ==========

    def test_create_association_success(self):
        """Test successful association creation."""
        self._create_game("parent_game", "Parent Game")
        self._create_game("child_game", "Child Game")

        result = self.association_manager.create_association(
            "parent_game", "child_game"
        )

        self.assertIsNone(result)

        # Verify association exists
        associations = self.association_manager.get_all_associations()
        self.assertEqual(len(associations), 1)
        self.assertEqual(associations[0]["parent_game_id"], "parent_game")
        self.assertEqual(associations[0]["child_game_id"], "child_game")

    def test_create_association_self_association_error(self):
        """Test that a game cannot be associated with itself."""
        self._create_game("game_1", "Game 1")

        result = self.association_manager.create_association("game_1", "game_1")

        self.assertIsNotNone(result)
        self.assertEqual(result.code, "SELF_ASSOCIATION")

    def test_create_association_parent_not_found_error(self):
        """Test error when parent game doesn't exist."""
        self._create_game("child_game", "Child Game")

        result = self.association_manager.create_association(
            "nonexistent", "child_game"
        )

        self.assertIsNotNone(result)
        self.assertEqual(result.code, "PARENT_NOT_FOUND")

    def test_create_association_child_not_found_error(self):
        """Test error when child game doesn't exist."""
        self._create_game("parent_game", "Parent Game")

        result = self.association_manager.create_association(
            "parent_game", "nonexistent"
        )

        self.assertIsNotNone(result)
        self.assertEqual(result.code, "CHILD_NOT_FOUND")

    def test_create_association_child_already_associated_error(self):
        """Test error when child is already associated with another parent."""
        self._create_game("parent_1", "Parent 1")
        self._create_game("parent_2", "Parent 2")
        self._create_game("child_game", "Child Game")

        # First association should succeed
        result1 = self.association_manager.create_association("parent_1", "child_game")
        self.assertIsNone(result1)

        # Second association with different parent should fail
        result2 = self.association_manager.create_association("parent_2", "child_game")
        self.assertIsNotNone(result2)
        self.assertEqual(result2.code, "ALREADY_CHILD")

    def test_create_association_child_is_parent_error(self):
        """Test error when trying to make a parent game a child."""
        self._create_game("game_a", "Game A")
        self._create_game("game_b", "Game B")
        self._create_game("game_c", "Game C")

        # Make game_a a parent of game_b
        result1 = self.association_manager.create_association("game_a", "game_b")
        self.assertIsNone(result1)

        # Try to make game_a (which is a parent) a child of game_c
        result2 = self.association_manager.create_association("game_c", "game_a")
        self.assertIsNotNone(result2)
        self.assertEqual(result2.code, "IS_PARENT")

    def test_create_association_parent_is_child_error(self):
        """Test error when trying to use a child game as a parent."""
        self._create_game("game_a", "Game A")
        self._create_game("game_b", "Game B")
        self._create_game("game_c", "Game C")

        # Make game_b a child of game_a
        result1 = self.association_manager.create_association("game_a", "game_b")
        self.assertIsNone(result1)

        # Try to make game_b (which is a child) a parent of game_c
        result2 = self.association_manager.create_association("game_b", "game_c")
        self.assertIsNotNone(result2)
        self.assertEqual(result2.code, "PARENT_IS_CHILD")

    # ========== Multiple children tests ==========

    def test_parent_can_have_multiple_children(self):
        """Test that a parent can have multiple children."""
        self._create_game("parent_game", "Parent Game")
        self._create_game("child_1", "Child 1")
        self._create_game("child_2", "Child 2")
        self._create_game("child_3", "Child 3")

        result1 = self.association_manager.create_association("parent_game", "child_1")
        result2 = self.association_manager.create_association("parent_game", "child_2")
        result3 = self.association_manager.create_association("parent_game", "child_3")

        self.assertIsNone(result1)
        self.assertIsNone(result2)
        self.assertIsNone(result3)

        associations = self.association_manager.get_all_associations()
        self.assertEqual(len(associations), 3)

    # ========== remove_association tests ==========

    def test_remove_association_success(self):
        """Test successful association removal."""
        self._create_game("parent_game", "Parent Game")
        self._create_game("child_game", "Child Game")

        # Create and then remove
        self.association_manager.create_association("parent_game", "child_game")
        result = self.association_manager.remove_association("child_game")

        self.assertIsNone(result)
        associations = self.association_manager.get_all_associations()
        self.assertEqual(len(associations), 0)

    def test_remove_association_not_a_child_error(self):
        """Test error when trying to remove association from a non-child game."""
        self._create_game("game_1", "Game 1")

        result = self.association_manager.remove_association("game_1")

        self.assertIsNotNone(result)
        self.assertEqual(result.code, "NOT_A_CHILD")

    # ========== get_association_for_game tests ==========

    def test_get_association_for_parent_game(self):
        """Test getting association info for a parent game."""
        self._create_game("parent_game", "Parent Game")
        self._create_game("child_1", "Child 1")
        self._create_game("child_2", "Child 2")

        self.association_manager.create_association("parent_game", "child_1")
        self.association_manager.create_association("parent_game", "child_2")

        result = self.association_manager.get_association_for_game("parent_game")

        self.assertIsNotNone(result)
        self.assertEqual(result["role"], "parent")
        self.assertEqual(len(result["children"]), 2)

    def test_get_association_for_child_game(self):
        """Test getting association info for a child game."""
        self._create_game("parent_game", "Parent Game")
        self._create_game("child_game", "Child Game")

        self.association_manager.create_association("parent_game", "child_game")

        result = self.association_manager.get_association_for_game("child_game")

        self.assertIsNotNone(result)
        self.assertEqual(result["role"], "child")
        self.assertEqual(result["parent_game_id"], "parent_game")

    def test_get_association_for_unassociated_game(self):
        """Test getting association info for a game with no associations."""
        self._create_game("game_1", "Game 1")

        result = self.association_manager.get_association_for_game("game_1")

        self.assertIsNone(result)

    # ========== Combined playtime tests ==========

    def test_get_combined_playtime_with_children(self):
        """Test combined playtime calculation."""
        self._create_game("parent_game", "Parent Game", playtime_seconds=3600)  # 1 hour
        self._create_game("child_1", "Child 1", playtime_seconds=1800)  # 30 min
        self._create_game("child_2", "Child 2", playtime_seconds=900)  # 15 min

        self.association_manager.create_association("parent_game", "child_1")
        self.association_manager.create_association("parent_game", "child_2")

        combined = self.association_manager.get_combined_playtime("parent_game")

        # Total should be 1h + 30min + 15min = 6300 seconds
        self.assertEqual(combined, 6300)

    def test_get_combined_playtime_for_child(self):
        """Test combined playtime calculation when querying from child perspective."""
        self._create_game("parent_game", "Parent Game", playtime_seconds=3600)
        self._create_game("child_game", "Child Game", playtime_seconds=1800)

        self.association_manager.create_association("parent_game", "child_game")

        combined = self.association_manager.get_combined_playtime("child_game")

        # Should get same total (parent + child)
        self.assertEqual(combined, 5400)

    def test_get_combined_playtime_unassociated_game(self):
        """Test combined playtime for unassociated game returns its own playtime."""
        self._create_game("game_1", "Game 1", playtime_seconds=3600)

        combined = self.association_manager.get_combined_playtime("game_1")

        self.assertEqual(combined, 3600)

    # ========== can_be_parent / can_be_child tests ==========

    def test_can_be_parent_for_unassociated_game(self):
        """Test that an unassociated game can be a parent."""
        self._create_game("game_1", "Game 1")

        self.assertTrue(self.association_manager.can_be_parent("game_1"))

    def test_can_be_parent_for_child_game(self):
        """Test that a child game cannot be a parent."""
        self._create_game("parent_game", "Parent Game")
        self._create_game("child_game", "Child Game")

        self.association_manager.create_association("parent_game", "child_game")

        self.assertFalse(self.association_manager.can_be_parent("child_game"))

    def test_can_be_child_for_unassociated_game(self):
        """Test that an unassociated game can be a child."""
        self._create_game("game_1", "Game 1")

        self.assertTrue(self.association_manager.can_be_child("game_1"))

    def test_can_be_child_for_parent_game(self):
        """Test that a parent game cannot be a child."""
        self._create_game("parent_game", "Parent Game")
        self._create_game("child_game", "Child Game")

        self.association_manager.create_association("parent_game", "child_game")

        self.assertFalse(self.association_manager.can_be_child("parent_game"))

    def test_can_be_child_for_existing_child(self):
        """Test that an existing child cannot be a child again."""
        self._create_game("parent_game", "Parent Game")
        self._create_game("child_game", "Child Game")

        self.association_manager.create_association("parent_game", "child_game")

        self.assertFalse(self.association_manager.can_be_child("child_game"))


class TestPerGameOverallStatisticWithAssociations(AbstractDatabaseTest):
    """Test that per_game_overall_statistic properly applies game associations."""

    dao: Dao
    association_manager: AssociationManager

    def setUp(self) -> None:
        super().setUp()
        DbMigration(db=self.database).migrate()
        self.dao = Dao(db=self.database)
        self.association_manager = AssociationManager(dao=self.dao)

    def _create_game_with_session(
        self, game_id: str, game_name: str, playtime_seconds: int = 3600
    ):
        """Helper to create a game with a play session."""
        self.dao.save_game_dict(game_id, game_name)
        self.dao.save_play_time(
            start=datetime(2023, 1, 1, 10, 0),
            time_s=playtime_seconds,
            game_id=game_id,
            source=None,
        )

    def test_per_game_overall_statistic_excludes_child_games(self):
        """Test that child games are excluded from per_game_overall_statistic."""
        from py_modules.statistics import Statistics

        self._create_game_with_session("parent_game", "Parent Game", 3600)
        self._create_game_with_session("child_game", "Child Game", 1800)
        self._create_game_with_session("regular_game", "Regular Game", 900)

        # Create association
        self.association_manager.create_association("parent_game", "child_game")

        statistics = Statistics(
            dao=self.dao,
            tracking_manager=None,
            association_manager=self.association_manager,
        )

        result = statistics.per_game_overall_statistic()

        # Should only have 2 games: parent and regular (child is excluded)
        self.assertEqual(len(result), 2)
        game_ids = [r["game"]["id"] for r in result]
        self.assertIn("parent_game", game_ids)
        self.assertIn("regular_game", game_ids)
        self.assertNotIn("child_game", game_ids)

    def test_per_game_overall_statistic_merges_child_playtime_into_parent(self):
        """Test that child game playtime is merged into parent."""
        from py_modules.statistics import Statistics

        self._create_game_with_session("parent_game", "Parent Game", 3600)  # 1 hour
        self._create_game_with_session("child_game", "Child Game", 1800)  # 30 min

        # Create association
        self.association_manager.create_association("parent_game", "child_game")

        statistics = Statistics(
            dao=self.dao,
            tracking_manager=None,
            association_manager=self.association_manager,
        )

        result = statistics.per_game_overall_statistic()

        # Find parent game in results
        parent_result = next(
            (r for r in result if r["game"]["id"] == "parent_game"), None
        )
        self.assertIsNotNone(parent_result)

        # Total time should be combined: 3600 + 1800 = 5400
        self.assertEqual(parent_result["total_time"], 5400)

    def test_per_game_overall_statistic_merges_sessions_from_children(self):
        """Test that child game sessions are merged into parent."""
        from py_modules.statistics import Statistics

        self._create_game_with_session("parent_game", "Parent Game", 3600)
        self._create_game_with_session("child_game", "Child Game", 1800)

        # Create association
        self.association_manager.create_association("parent_game", "child_game")

        statistics = Statistics(
            dao=self.dao,
            tracking_manager=None,
            association_manager=self.association_manager,
        )

        result = statistics.per_game_overall_statistic()

        # Find parent game in results
        parent_result = next(
            (r for r in result if r["game"]["id"] == "parent_game"), None
        )
        self.assertIsNotNone(parent_result)

        # Sessions should include both parent and child sessions
        self.assertEqual(len(parent_result["sessions"]), 2)

    def test_per_game_overall_statistic_with_multiple_children(self):
        """Test merging multiple children into parent."""
        from py_modules.statistics import Statistics

        self._create_game_with_session("parent_game", "Parent Game", 3600)  # 1 hour
        self._create_game_with_session("child_1", "Child 1", 1800)  # 30 min
        self._create_game_with_session("child_2", "Child 2", 900)  # 15 min

        # Create associations
        self.association_manager.create_association("parent_game", "child_1")
        self.association_manager.create_association("parent_game", "child_2")

        statistics = Statistics(
            dao=self.dao,
            tracking_manager=None,
            association_manager=self.association_manager,
        )

        result = statistics.per_game_overall_statistic()

        # Should only have 1 game (parent)
        self.assertEqual(len(result), 1)

        # Total time should be combined: 3600 + 1800 + 900 = 6300
        self.assertEqual(result[0]["total_time"], 6300)

        # Sessions should include all 3
        self.assertEqual(len(result[0]["sessions"]), 3)


class TestDailyStatisticsWithAssociations(AbstractDatabaseTest):
    """Test that daily_statistics_for_period properly applies game associations."""

    dao: Dao
    association_manager: AssociationManager

    def setUp(self) -> None:
        super().setUp()
        DbMigration(db=self.database).migrate()
        self.dao = Dao(db=self.database)
        self.association_manager = AssociationManager(dao=self.dao)

    def _create_game_with_session_on_date(
        self,
        game_id: str,
        game_name: str,
        session_date: datetime,
        playtime_seconds: int = 3600,
    ):
        """Helper to create a game with a play session on a specific date."""
        self.dao.save_game_dict(game_id, game_name)
        self.dao.save_play_time(
            start=session_date,
            time_s=playtime_seconds,
            game_id=game_id,
            source=None,
        )

    def test_daily_statistics_excludes_child_games(self):
        """Test that child games are excluded from daily statistics."""
        from py_modules.statistics import Statistics
        from datetime import date

        session_date = datetime(2023, 1, 15, 10, 0)
        self._create_game_with_session_on_date(
            "parent_game", "Parent Game", session_date, 3600
        )
        self._create_game_with_session_on_date(
            "child_game", "Child Game", session_date, 1800
        )
        self._create_game_with_session_on_date(
            "regular_game", "Regular Game", session_date, 900
        )

        # Create association
        self.association_manager.create_association("parent_game", "child_game")

        statistics = Statistics(
            dao=self.dao,
            tracking_manager=None,
            association_manager=self.association_manager,
        )

        result = statistics.daily_statistics_for_period(
            date(2023, 1, 15), date(2023, 1, 15)
        )

        # Should have 1 day with 2 games (parent and regular, child excluded)
        self.assertEqual(len(result.data), 1)
        day_data = result.data[0]
        game_ids = [g["game"]["id"] for g in day_data.to_dict()["games"]]
        self.assertIn("parent_game", game_ids)
        self.assertIn("regular_game", game_ids)
        self.assertNotIn("child_game", game_ids)

    def test_daily_statistics_merges_child_playtime(self):
        """Test that child playtime is merged into parent in daily stats."""
        from py_modules.statistics import Statistics
        from datetime import date

        session_date = datetime(2023, 1, 15, 10, 0)
        self._create_game_with_session_on_date(
            "parent_game", "Parent Game", session_date, 3600
        )
        self._create_game_with_session_on_date(
            "child_game", "Child Game", session_date, 1800
        )

        # Create association
        self.association_manager.create_association("parent_game", "child_game")

        statistics = Statistics(
            dao=self.dao,
            tracking_manager=None,
            association_manager=self.association_manager,
        )

        result = statistics.daily_statistics_for_period(
            date(2023, 1, 15), date(2023, 1, 15)
        )

        # Find parent game in day's games
        day_data = result.data[0].to_dict()
        parent_result = next(
            (g for g in day_data["games"] if g["game"]["id"] == "parent_game"), None
        )
        self.assertIsNotNone(parent_result)

        # Total time should be combined: 3600 + 1800 = 5400
        self.assertEqual(parent_result["total_time"], 5400)


class TestGamesDictionaryWithAssociations(AbstractDatabaseTest):
    """Test that get_dictionary properly filters out child games."""

    dao: Dao
    association_manager: AssociationManager

    def setUp(self) -> None:
        super().setUp()
        DbMigration(db=self.database).migrate()
        self.dao = Dao(db=self.database)
        self.association_manager = AssociationManager(dao=self.dao)

    def _create_game(self, game_id: str, game_name: str):
        """Helper to create a game in the dictionary with playtime."""
        self.dao.save_game_dict(game_id, game_name)
        # Also add playtime so the game exists properly
        self.dao.save_play_time(
            start=datetime(2023, 1, 1, 10, 0),
            time_s=3600,
            game_id=game_id,
            source=None,
        )

    def test_get_dictionary_excludes_child_games(self):
        """Test that child games are excluded from games dictionary."""
        from py_modules.games import Games

        self._create_game("parent_game", "Parent Game")
        self._create_game("child_game", "Child Game")
        self._create_game("regular_game", "Regular Game")

        # Create association
        self.association_manager.create_association("parent_game", "child_game")

        games = Games(dao=self.dao, association_manager=self.association_manager)
        result = games.get_dictionary()

        # Should only have 2 games (parent and regular, child excluded)
        self.assertEqual(len(result), 2)
        game_ids = [g["game"]["id"] for g in result]
        self.assertIn("parent_game", game_ids)
        self.assertIn("regular_game", game_ids)
        self.assertNotIn("child_game", game_ids)

    def test_get_dictionary_without_associations(self):
        """Test that all games are returned when no associations exist."""
        from py_modules.games import Games

        self._create_game("game_1", "Game 1")
        self._create_game("game_2", "Game 2")
        self._create_game("game_3", "Game 3")

        games = Games(dao=self.dao, association_manager=self.association_manager)
        result = games.get_dictionary()

        # Should have all 3 games
        self.assertEqual(len(result), 3)


class TestGetGameWithAssociations(AbstractDatabaseTest):
    """Test that get_by_id properly combines playtime from associated games."""

    dao: Dao
    association_manager: AssociationManager

    def setUp(self) -> None:
        super().setUp()
        DbMigration(db=self.database).migrate()
        self.dao = Dao(db=self.database)
        self.association_manager = AssociationManager(dao=self.dao)

    def _create_game(self, game_id: str, game_name: str, playtime_seconds: int = 3600):
        """Helper to create a game with playtime."""
        self.dao.save_game_dict(game_id, game_name)
        self.dao.save_play_time(
            start=datetime(2023, 1, 1, 10, 0),
            time_s=playtime_seconds,
            game_id=game_id,
            source=None,
        )

    def test_get_by_id_combines_child_playtime(self):
        """Test that get_by_id returns combined playtime for parent game."""
        from py_modules.games import Games

        self._create_game("parent_game", "Parent Game", 3600)  # 1 hour
        self._create_game("child_1", "Child 1", 1800)  # 30 min
        self._create_game("child_2", "Child 2", 900)  # 15 min

        # Create associations
        self.association_manager.create_association("parent_game", "child_1")
        self.association_manager.create_association("parent_game", "child_2")

        games = Games(dao=self.dao, association_manager=self.association_manager)
        result = games.get_by_id("parent_game")

        self.assertIsNotNone(result)
        # Total should be 3600 + 1800 + 900 = 6300
        self.assertEqual(result.total_time, 6300)

    def test_get_by_id_child_game_returns_own_playtime(self):
        """Test that get_by_id for a child game returns only its own playtime."""
        from py_modules.games import Games

        self._create_game("parent_game", "Parent Game", 3600)
        self._create_game("child_game", "Child Game", 1800)

        self.association_manager.create_association("parent_game", "child_game")

        games = Games(dao=self.dao, association_manager=self.association_manager)
        result = games.get_by_id("child_game")

        self.assertIsNotNone(result)
        # Child should return its own playtime
        self.assertEqual(result.total_time, 1800)


class TestDailyStatisticsForSpecificGame(AbstractDatabaseTest):
    """Test daily_statistics_for_period with a specific game_id (parent)."""

    dao: Dao
    association_manager: AssociationManager

    def setUp(self) -> None:
        super().setUp()
        DbMigration(db=self.database).migrate()
        self.dao = Dao(db=self.database)
        self.association_manager = AssociationManager(dao=self.dao)

    def _create_game_with_session_on_date(
        self,
        game_id: str,
        game_name: str,
        session_date: datetime,
        playtime_seconds: int = 3600,
    ):
        """Helper to create a game with a play session on a specific date."""
        self.dao.save_game_dict(game_id, game_name)
        self.dao.save_play_time(
            start=session_date,
            time_s=playtime_seconds,
            game_id=game_id,
            source=None,
        )

    def test_daily_statistics_for_parent_includes_children_data(self):
        """Test that querying for parent game_id includes child game sessions."""
        from py_modules.statistics import Statistics
        from datetime import date

        session_date = datetime(2023, 1, 15, 10, 0)
        self._create_game_with_session_on_date(
            "parent_game", "Parent Game", session_date, 3600
        )
        self._create_game_with_session_on_date("child_1", "Child 1", session_date, 1800)
        self._create_game_with_session_on_date("child_2", "Child 2", session_date, 900)

        # Create associations
        self.association_manager.create_association("parent_game", "child_1")
        self.association_manager.create_association("parent_game", "child_2")

        statistics = Statistics(
            dao=self.dao,
            tracking_manager=None,
            association_manager=self.association_manager,
        )

        # Query specifically for parent game
        result = statistics.daily_statistics_for_period(
            date(2023, 1, 15), date(2023, 1, 15), game_id="parent_game"
        )

        # Should have 1 day with 1 game (parent with merged children)
        self.assertEqual(len(result.data), 1)
        day_data = result.data[0].to_dict()

        # Should only have parent game (children merged into it)
        self.assertEqual(len(day_data["games"]), 1)
        parent_result = day_data["games"][0]
        self.assertEqual(parent_result["game"]["id"], "parent_game")

        # Total time should be combined: 3600 + 1800 + 900 = 6300
        self.assertEqual(parent_result["total_time"], 6300)

        # Sessions should include all 3
        self.assertEqual(len(parent_result["sessions"]), 3)

    def test_daily_statistics_child_sessions_on_day_without_parent(self):
        """Test when child has sessions on a day but parent doesn't."""
        from py_modules.statistics import Statistics
        from datetime import date

        # Parent played on day 1
        self._create_game_with_session_on_date(
            "parent_game", "Parent Game", datetime(2023, 1, 10, 10, 0), 3600
        )
        # Child played on day 2 (parent didn't play)
        self._create_game_with_session_on_date(
            "child_game", "Child Game", datetime(2023, 1, 15, 10, 0), 1800
        )

        # Create association
        self.association_manager.create_association("parent_game", "child_game")

        statistics = Statistics(
            dao=self.dao,
            tracking_manager=None,
            association_manager=self.association_manager,
        )

        # Query for the day when only child played
        result = statistics.daily_statistics_for_period(
            date(2023, 1, 15), date(2023, 1, 15), game_id="parent_game"
        )

        # Should have 1 day with parent game (with child's data)
        self.assertEqual(len(result.data), 1)
        day_data = result.data[0].to_dict()

        # Should have parent game entry with child's session
        self.assertEqual(len(day_data["games"]), 1)
        parent_result = day_data["games"][0]
        self.assertEqual(parent_result["game"]["id"], "parent_game")

        # Total time should be child's time
        self.assertEqual(parent_result["total_time"], 1800)

        # Sessions should include child's session
        self.assertEqual(len(parent_result["sessions"]), 1)

    def test_daily_statistics_no_filter_excludes_children(self):
        """Test that calling without game_id excludes children and merges into parents."""
        from py_modules.statistics import Statistics
        from datetime import date

        session_date = datetime(2023, 1, 15, 10, 0)
        self._create_game_with_session_on_date(
            "parent_game", "Parent Game", session_date, 3600
        )
        self._create_game_with_session_on_date(
            "child_game", "Child Game", session_date, 1800
        )
        self._create_game_with_session_on_date(
            "other_game", "Other Game", session_date, 900
        )

        # Create association
        self.association_manager.create_association("parent_game", "child_game")

        statistics = Statistics(
            dao=self.dao,
            tracking_manager=None,
            association_manager=self.association_manager,
        )

        # Query without game_id filter
        result = statistics.daily_statistics_for_period(
            date(2023, 1, 15), date(2023, 1, 15)
        )

        # Should have 1 day
        self.assertEqual(len(result.data), 1)
        day_data = result.data[0].to_dict()

        # Should have 2 games (parent merged with child, and other_game)
        self.assertEqual(len(day_data["games"]), 2)
        game_ids = [g["game"]["id"] for g in day_data["games"]]
        self.assertIn("parent_game", game_ids)
        self.assertIn("other_game", game_ids)
        self.assertNotIn("child_game", game_ids)


if __name__ == "__main__":
    unittest.main()
