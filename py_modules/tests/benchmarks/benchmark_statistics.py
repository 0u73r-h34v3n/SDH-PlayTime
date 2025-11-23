"""
Benchmarks for Statistics class methods.

Tests the HIGH IMPACT optimizations from the memory report:
- fetch_playtime_information() - alias duplication
- get_statistics_for_last_two_weeks() - alias duplication  
- daily_statistics_for_period() - dataclasses.asdict usage
- per_game_overall_statistic() - complex grouping
"""

import sys
from pathlib import Path

# Add project to path
plugin_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(plugin_dir))

from py_modules.statistics import Statistics
from py_modules.tests.benchmarks import BenchmarkBase, DatabaseFixtures
from datetime import datetime, timedelta


class StatisticsBenchmark(BenchmarkBase):
    """Benchmark Statistics class methods."""
    
    def __init__(self):
        super().__init__()
        self.statistics = None
        
    def setup(self):
        """Set up database with test data."""
        super().setup()
        self.statistics = Statistics(self.dao)
        
    def benchmark_fetch_playtime_information(self, scale: str = "medium"):
        """
        Benchmark fetch_playtime_information() method.
        
        Tests:
        - Alias duplication overhead
        - dataclasses.asdict() conversion
        - Large result set serialization
        """
        # Create test data
        DatabaseFixtures.create_realistic_dataset(self.dao, scale=scale)
        
        def run():
            result = self.statistics.fetch_playtime_information()
            return result
        
        # Get data size for reporting
        result = run()
        data_size = len(result)
        
        self.run_benchmark(
            run,
            f"fetch_playtime_information_{scale}",
            data_size=data_size,
            iterations=10,
            warmup=5  # Warmup simulates repeated queries in real usage
        )
        
    def benchmark_get_statistics_for_last_two_weeks(self, scale: str = "medium"):
        """
        Benchmark get_statistics_for_last_two_weeks() method.
        
        Tests:
        - Time-based filtering
        - Alias duplication
        - Result serialization
        """
        DatabaseFixtures.create_realistic_dataset(self.dao, scale=scale)
        
        def run():
            result = self.statistics.get_statistics_for_last_two_weeks()
            return result
        
        result = run()
        data_size = len(result)
        
        self.run_benchmark(
            run,
            f"get_statistics_for_last_two_weeks_{scale}",
            data_size=data_size,
            iterations=10,
            warmup=5  # Warmup simulates repeated queries in real usage
        )
        
    def benchmark_daily_statistics_for_period(self, scale: str = "medium"):
        """
        Benchmark daily_statistics_for_period() method.
        
        Tests:
        - Date range queries
        - Grouping by day
        - Heavy dataclasses.asdict() usage
        - Pagination logic
        """
        DatabaseFixtures.create_realistic_dataset(self.dao, scale=scale)
        
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=30)
        
        def run():
            result = self.statistics.daily_statistics_for_period(
                start_date,
                end_date,
                game_id=None
            )
            return result
        
        result = run()
        data_size = len(result.data) if result.data else 0
        
        self.run_benchmark(
            run,
            f"daily_statistics_for_period_30days_{scale}",
            data_size=data_size,
            iterations=10,
            warmup=3  # Warmup for this expensive operation
        )
        
    def benchmark_per_game_overall_statistic(self, scale: str = "medium"):
        """
        Benchmark per_game_overall_statistic() method.
        
        Tests:
        - Complex grouping logic
        - Session aggregation
        - Checksum-based deduplication
        - Full result serialization
        """
        DatabaseFixtures.create_realistic_dataset(self.dao, scale=scale)
        
        def run():
            result = self.statistics.per_game_overall_statistic()
            return result
        
        result = run()
        data_size = len(result)
        
        self.run_benchmark(
            run,
            f"per_game_overall_statistic_{scale}",
            data_size=data_size,
            iterations=10,
            warmup=3  # Warmup to simulate cache warming
        )
        
    def benchmark_combine_games_by_checksum(self, scale: str = "medium"):
        """
        Benchmark combine_games_by_checksum_per_day() method.
        
        Tests checksum-based game merging logic.
        """
        DatabaseFixtures.create_realistic_dataset(self.dao, scale=scale)
        
        # Get some data first
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=7)
        
        result = self.statistics.daily_statistics_for_period(
            start_date,
            end_date,
            game_id=None
        )
        
        days_data = result.data
        
        def run():
            combined = self.statistics.combine_games_by_checksum_per_day(days_data)
            return combined
        
        self.run_benchmark(
            run,
            f"combine_games_by_checksum_{scale}",
            data_size=len(days_data),
            iterations=50
        )
    
    def run_all_benchmarks(self):
        """Run all statistics benchmarks across different scales."""
        import time
        scales = ["small", "medium", "large"]
        
        for scale in scales:
            print(f"\n{'='*80}")
            print(f"Running Statistics Benchmarks - {scale.upper()} dataset")
            print(f"{'='*80}\n")
            
            scale_start_time = time.time()
            
            # Reset for each scale
            self.teardown()
            self.setup()
            self.results = []
            
            self.benchmark_fetch_playtime_information(scale)
            self.benchmark_get_statistics_for_last_two_weeks(scale)
            self.benchmark_daily_statistics_for_period(scale)
            self.benchmark_per_game_overall_statistic(scale)
            self.benchmark_combine_games_by_checksum(scale)
            
            scale_elapsed = time.time() - scale_start_time
            self.print_results()
            print(f"\n⏱️  {scale.upper()} dataset completed in {scale_elapsed:.2f} seconds\n")


def main():
    """Run all statistics benchmarks."""
    print("\n" + "="*80)
    print("STATISTICS MODULE BENCHMARKS")
    print("="*80)
    
    benchmark = StatisticsBenchmark()
    
    try:
        benchmark.setup()
        benchmark.run_all_benchmarks()
    finally:
        benchmark.teardown()


if __name__ == "__main__":
    main()
