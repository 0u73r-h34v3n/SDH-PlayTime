"""
Benchmarks for Main.py Plugin endpoints.

Tests the full request/response cycle including:
- API method execution
- JSON serialization (convert_keys_to_camel_case)
- dataclasses.asdict() overhead
- Realistic workload simulation
"""

import sys
import os
import tempfile
from pathlib import Path
from unittest.mock import MagicMock

# Add project to path
plugin_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(plugin_dir))

# Mock decky module before importing main
sys.modules['decky'] = MagicMock()

from py_modules.tests.benchmarks import BenchmarkBase, DatabaseFixtures
from datetime import datetime, timedelta


class MainEndpointsBenchmark(BenchmarkBase):
    """Benchmark Plugin class endpoints from main.py."""
    
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
        
    def benchmark_fetch_playtime_information_endpoint(self, scale: str = "medium"):
        """
        Benchmark fetch_playtime_information endpoint.
        
        Tests full API call including:
        - Statistics method execution
        - convert_keys_to_camel_case
        - Exception handling
        """
        import asyncio
        
        # Populate database
        DatabaseFixtures.create_realistic_dataset(self.plugin.statistics.dao, scale=scale)
        
        async def run():
            result = await self.plugin.fetch_playtime_information()
            return result
        
        # Get data size
        result = asyncio.run(run())
        data_size = len(result)
        
        def sync_run():
            return asyncio.run(run())
        
        self.run_benchmark(
            sync_run,
            f"endpoint_fetch_playtime_information_{scale}",
            data_size=data_size,
            iterations=10
        )
        
    def benchmark_per_game_overall_statistics_endpoint(self, scale: str = "medium"):
        """
        Benchmark per_game_overall_statistics endpoint.
        """
        import asyncio
        
        DatabaseFixtures.create_realistic_dataset(self.plugin.statistics.dao, scale=scale)
        
        async def run():
            result = await self.plugin.per_game_overall_statistics()
            return result
        
        result = asyncio.run(run())
        data_size = len(result)
        
        def sync_run():
            return asyncio.run(run())
        
        self.run_benchmark(
            sync_run,
            f"endpoint_per_game_overall_statistics_{scale}",
            data_size=data_size,
            iterations=10
        )
        
    def benchmark_daily_statistics_endpoint(self, scale: str = "medium"):
        """
        Benchmark daily_statistics_for_period endpoint.
        """
        import asyncio
        
        DatabaseFixtures.create_realistic_dataset(self.plugin.statistics.dao, scale=scale)
        
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=30)
        
        dto_dict = {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "game_id": None
        }
        
        async def run():
            result = await self.plugin.daily_statistics_for_period(dto_dict)
            return result
        
        result = asyncio.run(run())
        data_size = len(result.get('data', []))
        
        def sync_run():
            return asyncio.run(run())
        
        self.run_benchmark(
            sync_run,
            f"endpoint_daily_statistics_30days_{scale}",
            data_size=data_size,
            iterations=10
        )
        
    def benchmark_get_games_dictionary_endpoint(self, scale: str = "medium"):
        """
        Benchmark get_games_dictionary endpoint.
        """
        import asyncio
        
        DatabaseFixtures.create_realistic_dataset(self.plugin.games.dao, scale=scale)
        
        async def run():
            result = await self.plugin.get_games_dictionary()
            return result
        
        result = asyncio.run(run())
        data_size = len(result)
        
        def sync_run():
            return asyncio.run(run())
        
        self.run_benchmark(
            sync_run,
            f"endpoint_get_games_dictionary_{scale}",
            data_size=data_size,
            iterations=10
        )
        
    def benchmark_add_time_endpoint(self):
        """
        Benchmark add_time endpoint (write operation).
        """
        import asyncio
        
        started_at = datetime.now() - timedelta(hours=2)
        ended_at = datetime.now()
        
        dto_dict = {
            "started_at": int(started_at.timestamp()),
            "ended_at": int(ended_at.timestamp()),
            "game_id": "benchmark_game_001",
            "game_name": "Benchmark Game"
        }
        
        async def run():
            await self.plugin.add_time(dto_dict)
        
        def sync_run():
            return asyncio.run(run())
        
        self.run_benchmark(
            sync_run,
            "endpoint_add_time",
            data_size=1,
            iterations=50
        )
        
    def run_all_benchmarks(self):
        """Run all endpoint benchmarks."""
        import time
        scales = ["small", "medium", "large"]
        
        for scale in scales:
            print(f"\n{'='*80}")
            print(f"Running Endpoint Benchmarks - {scale.upper()} dataset")
            print(f"{'='*80}\n")
            
            scale_start_time = time.time()
            
            # Reset for each scale
            self.teardown()
            self.setup()
            self.results = []
            
            self.benchmark_fetch_playtime_information_endpoint(scale)
            self.benchmark_per_game_overall_statistics_endpoint(scale)
            self.benchmark_daily_statistics_endpoint(scale)
            self.benchmark_get_games_dictionary_endpoint(scale)
            
            scale_elapsed = time.time() - scale_start_time
            self.print_results()
            print(f"\n⏱️  {scale.upper()} dataset completed in {scale_elapsed:.2f} seconds\n")
        
        # Write operations (separate)
        print(f"\n{'='*80}")
        print("Running Write Operation Benchmarks")
        print(f"{'='*80}\n")
        
        self.teardown()
        self.setup()
        self.results = []
        
        self.benchmark_add_time_endpoint()
        
        self.print_results()


def main():
    """Run all endpoint benchmarks."""
    print("\n" + "="*80)
    print("MAIN.PY ENDPOINT BENCHMARKS")
    print("="*80)
    
    benchmark = MainEndpointsBenchmark()
    
    try:
        benchmark.setup()
        benchmark.run_all_benchmarks()
    finally:
        benchmark.teardown()


if __name__ == "__main__":
    main()
