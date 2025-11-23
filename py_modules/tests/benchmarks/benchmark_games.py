"""
Benchmarks for Games class methods.

Tests MEDIUM IMPACT optimizations:
- get_dictionary() - list comprehension intermediates
- Serialization overhead
"""

import sys
from pathlib import Path

# Add project to path
plugin_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(plugin_dir))

from py_modules.games import Games
from py_modules.tests.benchmarks import BenchmarkBase, DatabaseFixtures


class GamesBenchmark(BenchmarkBase):
    """Benchmark Games class methods."""
    
    def __init__(self):
        super().__init__()
        self.games = None
        
    def setup(self):
        """Set up database with test data."""
        super().setup()
        self.games = Games(self.dao)
        
    def benchmark_get_dictionary(self, scale: str = "medium"):
        """
        Benchmark get_dictionary() method.
        
        Tests:
        - List comprehension overhead
        - Nested loop performance
        - dataclasses.asdict() conversion
        - FileChecksum object creation
        """
        DatabaseFixtures.create_realistic_dataset(self.dao, scale=scale)
        
        def run():
            result = self.games.get_dictionary()
            return result
        
        result = run()
        data_size = len(result)
        
        self.run_benchmark(
            run,
            f"get_dictionary_{scale}",
            data_size=data_size,
            iterations=10
        )
        
    def benchmark_get_games_checksum(self, scale: str = "medium"):
        """
        Benchmark get_games_checksum() method.
        
        Tests checksum retrieval and serialization.
        """
        DatabaseFixtures.create_realistic_dataset(self.dao, scale=scale)
        
        def run():
            result = self.games.get_games_checksum()
            return result
        
        result = run()
        data_size = len(result)
        
        self.run_benchmark(
            run,
            f"get_games_checksum_{scale}",
            data_size=data_size,
            iterations=10
        )
        
    def benchmark_get_by_id(self, scale: str = "medium"):
        """
        Benchmark get_by_id() method.
        
        Tests single game retrieval performance.
        """
        DatabaseFixtures.create_realistic_dataset(self.dao, scale=scale)
        
        # Test with first game
        game_id = "game_00000"
        
        def run():
            result = self.games.get_by_id(game_id)
            return result
        
        self.run_benchmark(
            run,
            f"get_by_id_{scale}",
            data_size=1,
            iterations=100
        )
        
    def benchmark_save_game_checksum_bulk(self, num_checksums: int = 100):
        """
        Benchmark save_game_checksum_bulk() method.
        
        Tests bulk insert performance.
        """
        from py_modules.dto.save_game_checksum import AddGameChecksumDTO
        
        # Create test game
        self.dao.save_game_dict("bulk_test_game", "Bulk Test Game")
        
        # Create bulk checksum data
        checksums = [
            AddGameChecksumDTO(
                game_id="bulk_test_game",
                checksum=f"sha256_bulk_{i}",
                algorithm="sha256",
                chunk_size=65536,
                created_at=None,
                updated_at=None
            )
            for i in range(num_checksums)
        ]
        
        def run():
            self.games.save_game_checksum_bulk(checksums)
        
        self.run_benchmark(
            run,
            f"save_game_checksum_bulk_{num_checksums}",
            data_size=num_checksums,
            iterations=5
        )
        
    def run_all_benchmarks(self):
        """Run all games benchmarks across different scales."""
        import time
        scales = ["small", "medium", "large"]
        
        for scale in scales:
            print(f"\n{'='*80}")
            print(f"Running Games Benchmarks - {scale.upper()} dataset")
            print(f"{'='*80}\n")
            
            scale_start_time = time.time()
            
            # Reset for each scale
            self.teardown()
            self.setup()
            self.results = []
            
            self.benchmark_get_dictionary(scale)
            self.benchmark_get_games_checksum(scale)
            self.benchmark_get_by_id(scale)
            
            scale_elapsed = time.time() - scale_start_time
            self.print_results()
            print(f"\n⏱️  {scale.upper()} dataset completed in {scale_elapsed:.2f} seconds\n")
        
        # Bulk operations (separate)
        print(f"\n{'='*80}")
        print("Running Games Bulk Operations Benchmarks")
        print(f"{'='*80}\n")
        
        self.teardown()
        self.setup()
        self.results = []
        
        for size in [10, 100, 500]:
            self.benchmark_save_game_checksum_bulk(size)
        
        self.print_results()


def main():
    """Run all games benchmarks."""
    print("\n" + "="*80)
    print("GAMES MODULE BENCHMARKS")
    print("="*80)
    
    benchmark = GamesBenchmark()
    
    try:
        benchmark.setup()
        benchmark.run_all_benchmarks()
    finally:
        benchmark.teardown()


if __name__ == "__main__":
    main()
