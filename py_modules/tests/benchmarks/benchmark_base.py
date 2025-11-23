"""
Base classes and utilities for PlayTime benchmarking.

This module provides:
- Memory tracking utilities
- Database fixture generation
- Performance measurement decorators
- Benchmark result formatting
"""

import time
import tracemalloc
import gc
import sqlite3
import tempfile
import os
from dataclasses import dataclass
from typing import Callable, Any, Dict, List, Optional
from datetime import datetime, timedelta
from contextlib import contextmanager

from py_modules.db.sqlite_db import SqlLiteDb
from py_modules.db.dao import Dao
from py_modules.db.migration import DbMigration


@dataclass
class BenchmarkResult:
    """Results from a single benchmark run."""
    name: str
    execution_time_ms: float
    peak_memory_mb: float
    memory_allocated_mb: float
    iterations: int
    data_size: int  # Number of records processed
    
    def __str__(self) -> str:
        return (
            f"{self.name}:\n"
            f"  Time: {self.execution_time_ms:.2f}ms\n"
            f"  Peak Memory: {self.peak_memory_mb:.2f}MB\n"
            f"  Allocated: {self.memory_allocated_mb:.2f}MB\n"
            f"  Data Size: {self.data_size} records\n"
            f"  Iterations: {self.iterations}"
        )


@dataclass
class MemorySnapshot:
    """Memory usage snapshot."""
    current_mb: float
    peak_mb: float
    
    @staticmethod
    def take() -> 'MemorySnapshot':
        """Take a memory snapshot using tracemalloc."""
        current, peak = tracemalloc.get_traced_memory()
        return MemorySnapshot(
            current_mb=current / 1024 / 1024,
            peak_mb=peak / 1024 / 1024
        )


class BenchmarkBase:
    """Base class for all benchmark tests."""
    
    def __init__(self):
        self.results: List[BenchmarkResult] = []
        self.temp_db_path: Optional[str] = None
        self.db: Optional[SqlLiteDb] = None
        self.dao: Optional[Dao] = None
        
    def setup(self):
        """Set up test database and fixtures."""
        # Create temporary database
        fd, self.temp_db_path = tempfile.mkstemp(suffix='.db')
        os.close(fd)
        
        self.db = SqlLiteDb(self.temp_db_path)
        migration = DbMigration(self.db)
        migration.migrate()
        
        self.dao = Dao(self.db)
        
    def teardown(self):
        """Clean up test database."""
        if self.temp_db_path and os.path.exists(self.temp_db_path):
            os.remove(self.temp_db_path)
        self.db = None
        self.dao = None
        
    @contextmanager
    def measure_performance(self, name: str, data_size: int = 0, iterations: int = 1):
        """
        Context manager to measure execution time and memory usage.
        
        Usage:
            with self.measure_performance("test_name", data_size=100):
                # code to benchmark
                pass
        """
        # Force garbage collection before measurement
        gc.collect()
        
        # Start memory tracking
        tracemalloc.start()
        start_snapshot = MemorySnapshot.take()
        
        # Start timing
        start_time = time.perf_counter()
        
        try:
            yield
        finally:
            # Stop timing
            end_time = time.perf_counter()
            execution_time_ms = (end_time - start_time) * 1000
            
            # Get final memory snapshot
            end_snapshot = MemorySnapshot.take()
            tracemalloc.stop()
            
            # Record result
            result = BenchmarkResult(
                name=name,
                execution_time_ms=execution_time_ms,
                peak_memory_mb=end_snapshot.peak_mb,
                memory_allocated_mb=end_snapshot.current_mb - start_snapshot.current_mb,
                iterations=iterations,
                data_size=data_size
            )
            self.results.append(result)
    
    def run_benchmark(self, func: Callable, name: str, data_size: int = 0, iterations: int = 1, warmup: int = 0):
        """
        Run a benchmark function multiple times and measure performance.
        
        Args:
            func: Function to benchmark
            name: Name of the benchmark
            data_size: Number of records being processed
            iterations: Number of times to run the function
            warmup: Number of warmup iterations to run before measurement
        """
        # Run warmup iterations to simulate real-world usage
        for _ in range(warmup):
            func()
        
        with self.measure_performance(name, data_size, iterations):
            for _ in range(iterations):
                func()
                
    def print_results(self):
        """Print all benchmark results."""
        print("\n" + "=" * 80)
        print("BENCHMARK RESULTS")
        print("=" * 80 + "\n")
        
        for result in self.results:
            print(result)
            print("-" * 80)
            
    def get_results_dict(self) -> List[Dict[str, Any]]:
        """Get results as list of dictionaries for JSON export."""
        return [
            {
                'name': r.name,
                'execution_time_ms': r.execution_time_ms,
                'peak_memory_mb': r.peak_memory_mb,
                'memory_allocated_mb': r.memory_allocated_mb,
                'iterations': r.iterations,
                'data_size': r.data_size,
                'timestamp': datetime.now().isoformat()
            }
            for r in self.results
        ]


class DatabaseFixtures:
    """Utility class to generate test data for benchmarks."""
    
    @staticmethod
    def create_games_with_sessions(
        dao: Dao,
        num_games: int,
        sessions_per_game: int,
        with_aliases: bool = False,
        with_checksums: bool = False
    ):
        """
        Create test games with play sessions.
        
        Args:
            dao: DAO instance
            num_games: Number of games to create
            sessions_per_game: Number of play sessions per game
            with_aliases: Whether to create game aliases (for testing duplication)
            with_checksums: Whether to add save file checksums
        """
        base_date = datetime.now() - timedelta(days=30)
        
        for i in range(num_games):
            game_id = f"game_{i:05d}"
            game_name = f"Test Game {i}"
            
            # Save game
            dao.save_game_dict(game_id, game_name)
            
            # Create play sessions
            for session_idx in range(sessions_per_game):
                session_date = base_date + timedelta(
                    days=session_idx % 30,
                    hours=session_idx // 30
                )
                duration = 1800 + (session_idx * 300)  # 30 min to several hours
                
                # Use save_play_time: (start_datetime, duration_seconds, game_id)
                dao.save_play_time(
                    session_date,
                    duration,
                    game_id,
                    None  # source
                )
            
            # Create checksums BEFORE aliases (aliases link to games with checksums)
            if with_checksums and i % 2 == 0:  # 1/2 of games have checksums
                for checksum_idx in range(3):
                    # Use unique checksum based on timestamp to avoid UNIQUE constraint violations
                    import hashlib
                    import time
                    unique_suffix = hashlib.md5(f"{game_id}_{checksum_idx}_{time.time()}".encode()).hexdigest()[:8]
                    dao.save_game_checksum(
                        game_id,
                        f"sha256_{unique_suffix}_{checksum_idx}",
                        "SHA256",  # Use uppercase - database constraint requires it
                        65536,
                        None,
                        None
                    )
            
            # Create aliases AFTER checksums (if both requested and game has checksums)
            if with_aliases and with_checksums and i % 6 == 0:  # Only games that have checksums (every 6th)
                for alias_idx in range(2):
                    # Use timestamp-based unique alias to avoid duplicates across benchmark runs
                    import time
                    alias_id = f"alias_{i}_{alias_idx}_{int(time.time() * 1000000) % 1000000}"
                    dao.link_game_to_game_with_checksum(alias_id, game_id)
    
    @staticmethod
    def create_realistic_dataset(dao: Dao, scale: str = "small"):
        """
        Create a realistic dataset for benchmarking.
        
        Args:
            dao: DAO instance
            scale: "small" (10 games), "medium" (50 games), "large" (200 games)
        """
        config = {
            "small": {"games": 10, "sessions": 20},
            "medium": {"games": 50, "sessions": 50},
            "large": {"games": 100, "sessions": 75},  # 7,500 total sessions (reasonable large library)
            # "stress": {"games": 200, "sessions": 100}  # 20,000 sessions (stress test - very slow!)
        }
        
        settings = config.get(scale, config["small"])
        
        DatabaseFixtures.create_games_with_sessions(
            dao,
            num_games=settings["games"],
            sessions_per_game=settings["sessions"],
            with_aliases=True,
            with_checksums=True
        )
