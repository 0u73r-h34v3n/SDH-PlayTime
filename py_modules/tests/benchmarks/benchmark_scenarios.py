"""
Benchmarks for real-world usage scenarios.

Simulates actual Steam Deck usage patterns:
- Game launch and tracking
- Viewing statistics in UI
- Multiple games played in sequence
- Long-running background operation
"""

import sys
import os
import tempfile
from pathlib import Path
from unittest.mock import MagicMock
from datetime import datetime, timedelta
import random

# Add project to path
plugin_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(plugin_dir))

# Mock decky module
sys.modules['decky'] = MagicMock()

from py_modules.tests.benchmarks import BenchmarkBase, DatabaseFixtures


class ScenarioBenchmark(BenchmarkBase):
    """Benchmark real-world usage scenarios."""
    
    def __init__(self):
        super().__init__()
        self.plugin = None
        
    def setup(self):
        """Set up plugin with mocked environment."""
        import asyncio
        
        # Set up environment variables BEFORE importing main
        self.temp_dir = tempfile.mkdtemp()
        os.chmod(self.temp_dir, 0o755)
        
        # Set environment before importing main module
        os.environ["DECKY_USER_HOME"] = self.temp_dir
        os.environ["DECKY_PLUGIN_RUNTIME_DIR"] = self.temp_dir
        os.environ["DECKY_PLUGIN_DIR"] = str(plugin_dir)
        
        # Force fresh import of main module to pick up new env vars
        if 'main' in sys.modules:
            del sys.modules['main']
        
        # Now import main - it will read the correct env vars
        import main
        self.plugin = main.Plugin()
        
        # Initialize plugin (creates database)
        asyncio.run(self.plugin._main())
        
    def teardown(self):
        """Clean up."""
        import shutil
        if self.temp_dir and os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)
    
    def scenario_user_opens_plugin_panel(self, scale: str = "medium"):
        """
        Scenario: User opens Decky plugin panel to view playtime.
        
        This typically triggers:
        1. fetch_playtime_information (to show game list)
        2. Maybe per_game_overall_statistics (for detailed view)
        """
        import asyncio
        
        # Populate database with historical data
        DatabaseFixtures.create_realistic_dataset(self.plugin.statistics.dao, scale=scale)
        
        async def run():
            # Simulate what happens when panel opens
            playtime_info = await self.plugin.fetch_playtime_information()
            overall_stats = await self.plugin.per_game_overall_statistics()
            return playtime_info, overall_stats
        
        def sync_run():
            return asyncio.run(run())
        
        self.run_benchmark(
            sync_run,
            f"scenario_open_plugin_panel_{scale}",
            data_size=1,
            iterations=10,
            warmup=5  # User opens panel multiple times - warm up caches
        )
    
    def scenario_view_weekly_report(self, scale: str = "medium"):
        """
        Scenario: User navigates to weekly report page.
        
        Triggers:
        - get_statistics_for_last_two_weeks
        """
        import asyncio
        
        DatabaseFixtures.create_realistic_dataset(self.plugin.statistics.dao, scale=scale)
        
        async def run():
            weekly_stats = await self.plugin.statistics_for_last_two_weeks()
            return weekly_stats
        
        def sync_run():
            return asyncio.run(run())
        
        self.run_benchmark(
            sync_run,
            f"scenario_view_weekly_report_{scale}",
            data_size=1,
            iterations=10,
            warmup=5  # User views report multiple times
        )
    
    def scenario_view_detailed_game_history(self, scale: str = "medium"):
        """
        Scenario: User clicks on a game to see detailed play history.
        
        Triggers:
        - daily_statistics_for_period (for specific game)
        - get_game (to get game info)
        """
        import asyncio
        
        DatabaseFixtures.create_realistic_dataset(self.plugin.statistics.dao, scale=scale)
        
        game_id = "game_00000"
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=60)
        
        async def run():
            # Get game info
            game_info = await self.plugin.get_game(game_id)
            
            # Get detailed statistics
            dto_dict = {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "game_id": game_id
            }
            stats = await self.plugin.daily_statistics_for_period(dto_dict)
            
            return game_info, stats
        
        def sync_run():
            return asyncio.run(run())
        
        self.run_benchmark(
            sync_run,
            f"scenario_view_game_history_{scale}",
            data_size=1,
            iterations=10,
            warmup=5  # User browses game history repeatedly
        )
    
    def scenario_play_session_tracking(self, num_sessions: int = 10):
        """
        Scenario: Multiple game sessions tracked during gaming session.
        
        Simulates:
        - User plays several games
        - Each game session tracked via add_time
        - Periodic UI refreshes to check playtime
        """
        import asyncio
        
        games = [
            ("game_001", "Elden Ring"),
            ("game_002", "Baldur's Gate 3"),
            ("game_003", "Hades"),
            ("game_004", "Hollow Knight"),
            ("game_005", "Celeste"),
        ]
        
        async def run():
            current_time = datetime.now()
            
            for i in range(num_sessions):
                # Pick random game
                game_id, game_name = random.choice(games)
                
                # Random session duration (30 min to 3 hours)
                duration_minutes = random.randint(30, 180)
                
                started_at = current_time - timedelta(minutes=duration_minutes)
                ended_at = current_time
                
                # Track time
                await self.plugin.add_time({
                    "started_at": int(started_at.timestamp()),
                    "ended_at": int(ended_at.timestamp()),
                    "game_id": game_id,
                    "game_name": game_name
                })
                
                # Simulate UI refresh after every 3 sessions
                if i % 3 == 0:
                    await self.plugin.fetch_playtime_information()
                
                current_time += timedelta(minutes=duration_minutes + 10)
        
        def sync_run():
            return asyncio.run(run())
        
        self.run_benchmark(
            sync_run,
            f"scenario_play_session_tracking_{num_sessions}_sessions",
            data_size=num_sessions,
            iterations=3,
            warmup=2  # Simulate ongoing tracking
        )
    
    def scenario_checksum_operations(self, num_games: int = 50):
        """
        Scenario: User uses save file management features.
        
        Triggers:
        - get_games_dictionary (to show games with checksums)
        - save_game_checksum_bulk (when scanning save files)
        - get_games_checksum (to display current checksums)
        """
        import asyncio
        from py_modules.dto.save_game_checksum import AddGameChecksumDTO
        
        # Create some base games
        for i in range(num_games):
            self.plugin.games.dao.save_game_dict(f"game_{i:03d}", f"Test Game {i}")
        
        async def run():
            # Step 1: Get games dictionary
            games_dict = await self.plugin.get_games_dictionary()
            
            # Step 2: Simulate scanning save files for 10 games
            checksums_to_add = []
            for i in range(10):
                checksums_to_add.append({
                    "game_id": f"game_{i:03d}",
                    "checksum": f"sha256_save_{i}_v1",
                    "algorithm": "SHA256",
                    "chunk_size": 65536,
                    "created_at": None,
                    "updated_at": None
                })
            
            await self.plugin.save_game_checksum_bulk(checksums_to_add)
            
            # Step 3: Get all checksums to display
            all_checksums = await self.plugin.get_games_checksum()
            
            return games_dict, all_checksums
        
        def sync_run():
            return asyncio.run(run())
        
        self.run_benchmark(
            sync_run,
            f"scenario_checksum_operations_{num_games}_games",
            data_size=num_games,
            iterations=5,
            warmup=3  # Checksum operations happen repeatedly
        )
    
    def scenario_memory_pressure_test(self, scale: str = "large"):
        """
        Scenario: Heavy memory load - multiple operations in succession.
        
        Tests memory retention and garbage collection.
        """
        import asyncio
        import gc
        
        DatabaseFixtures.create_realistic_dataset(self.plugin.statistics.dao, scale=scale)
        
        async def run():
            # Multiple heavy operations
            results = []
            
            # 1. Get all playtime info
            results.append(await self.plugin.fetch_playtime_information())
            
            # 2. Get overall statistics
            results.append(await self.plugin.per_game_overall_statistics())
            
            # 3. Get weekly stats
            results.append(await self.plugin.statistics_for_last_two_weeks())
            
            # 4. Get games dictionary
            results.append(await self.plugin.get_games_dictionary())
            
            # 5. Multiple daily statistics queries
            end_date = datetime.now().date()
            for days_back in [7, 14, 30, 60]:
                start_date = end_date - timedelta(days=days_back)
                dto = {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat(),
                    "game_id": None
                }
                results.append(await self.plugin.daily_statistics_for_period(dto))
            
            # Force GC to see if memory is released
            gc.collect()
            
            return len(results)
        
        def sync_run():
            return asyncio.run(run())
        
        self.run_benchmark(
            sync_run,
            f"scenario_memory_pressure_{scale}",
            data_size=1,
            iterations=3
        )
    
    def run_all_benchmarks(self):
        """Run all scenario benchmarks."""
        import time
        print(f"\n{'='*80}")
        print("Running Real-World Scenario Benchmarks")
        print(f"{'='*80}\n")
        
        scales = ["small", "medium", "large"]
        
        for scale in scales:
            print(f"\nScale: {scale.upper()}")
            print("-" * 80)
            
            scale_start_time = time.time()
            
            # Reset for each scale
            self.teardown()
            self.setup()
            
            self.scenario_user_opens_plugin_panel(scale)
            self.scenario_view_weekly_report(scale)
            self.scenario_view_detailed_game_history(scale)
            
            scale_elapsed = time.time() - scale_start_time
            print(f"⏱️  {scale.upper()} scenarios completed in {scale_elapsed:.2f} seconds")
        
        print("\nSpecialized Scenarios")
        print("-" * 80)
        
        self.teardown()
        self.setup()
        
        self.scenario_play_session_tracking(10)
        self.scenario_checksum_operations(50)
        
        # Memory pressure test
        self.teardown()
        self.setup()
        self.scenario_memory_pressure_test("large")
        
        self.print_results()


def main():
    """Run all scenario benchmarks."""
    print("\n" + "="*80)
    print("REAL-WORLD SCENARIO BENCHMARKS")
    print("="*80)
    
    benchmark = ScenarioBenchmark()
    
    try:
        benchmark.setup()
        benchmark.run_all_benchmarks()
    finally:
        benchmark.teardown()


if __name__ == "__main__":
    main()
