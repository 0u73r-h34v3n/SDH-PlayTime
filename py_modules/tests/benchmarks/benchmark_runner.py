"""
Benchmark runner - executes all benchmarks and generates reports.

Usage:
    python benchmark_runner.py                    # Run all benchmarks
    python benchmark_runner.py --stats-only       # Only statistics benchmarks
    python benchmark_runner.py --compare baseline.json  # Compare with baseline
    python benchmark_runner.py --export results.json    # Export results to JSON
"""

import sys
import json
import argparse
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any

# Add project to path
plugin_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(plugin_dir))


def run_statistics_benchmarks():
    """Run statistics module benchmarks."""
    from py_modules.tests.benchmarks.benchmark_statistics import StatisticsBenchmark
    
    benchmark = StatisticsBenchmark()
    try:
        benchmark.setup()
        benchmark.run_all_benchmarks()
        return benchmark.get_results_dict()
    finally:
        benchmark.teardown()


def run_games_benchmarks():
    """Run games module benchmarks."""
    from py_modules.tests.benchmarks.benchmark_games import GamesBenchmark
    
    benchmark = GamesBenchmark()
    try:
        benchmark.setup()
        benchmark.run_all_benchmarks()
        return benchmark.get_results_dict()
    finally:
        benchmark.teardown()


def run_endpoint_benchmarks():
    """Run main.py endpoint benchmarks."""
    from py_modules.tests.benchmarks.benchmark_main_endpoints import MainEndpointsBenchmark
    
    benchmark = MainEndpointsBenchmark()
    try:
        benchmark.setup()
        benchmark.run_all_benchmarks()
        return benchmark.get_results_dict()
    finally:
        benchmark.teardown()


def run_scenario_benchmarks():
    """Run real-world scenario benchmarks."""
    from py_modules.tests.benchmarks.benchmark_scenarios import ScenarioBenchmark
    
    benchmark = ScenarioBenchmark()
    try:
        benchmark.setup()
        benchmark.run_all_benchmarks()
        return benchmark.get_results_dict()
    finally:
        benchmark.teardown()


def generate_summary(all_results: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Any]:
    """Generate summary statistics from all results."""
    total_benchmarks = sum(len(results) for results in all_results.values())
    
    # Calculate totals
    total_time = 0
    total_peak_memory = 0
    total_allocated_memory = 0
    
    for category_results in all_results.values():
        for result in category_results:
            total_time += result['execution_time_ms']
            total_peak_memory = max(total_peak_memory, result['peak_memory_mb'])
            total_allocated_memory += result['memory_allocated_mb']
    
    # Find slowest and most memory-intensive operations
    all_flat_results = []
    for category, results in all_results.items():
        for result in results:
            result['category'] = category
            all_flat_results.append(result)
    
    slowest = sorted(all_flat_results, key=lambda x: x['execution_time_ms'], reverse=True)[:5]
    memory_hogs = sorted(all_flat_results, key=lambda x: x['peak_memory_mb'], reverse=True)[:5]
    
    return {
        'total_benchmarks': total_benchmarks,
        'total_execution_time_ms': total_time,
        'peak_memory_mb': total_peak_memory,
        'total_allocated_memory_mb': total_allocated_memory,
        'slowest_operations': [
            {
                'name': r['name'],
                'category': r['category'],
                'time_ms': r['execution_time_ms']
            }
            for r in slowest
        ],
        'most_memory_intensive': [
            {
                'name': r['name'],
                'category': r['category'],
                'memory_mb': r['peak_memory_mb']
            }
            for r in memory_hogs
        ]
    }


def compare_with_baseline(current: Dict[str, Any], baseline_path: str) -> Dict[str, Any]:
    """Compare current results with baseline."""
    with open(baseline_path, 'r') as f:
        baseline = json.load(f)
    
    comparison = {
        'timestamp': datetime.now().isoformat(),
        'baseline_timestamp': baseline.get('metadata', {}).get('timestamp', 'unknown'),
        'improvements': [],
        'regressions': [],
        'summary': {}
    }
    
    # Compare each benchmark
    baseline_results = {}
    for category, results in baseline.get('results', {}).items():
        for result in results:
            baseline_results[result['name']] = result
    
    for category, results in current.get('results', {}).items():
        for result in results:
            name = result['name']
            if name in baseline_results:
                base = baseline_results[name]
                
                time_diff_pct = ((result['execution_time_ms'] - base['execution_time_ms']) 
                               / base['execution_time_ms'] * 100)
                mem_diff_pct = ((result['peak_memory_mb'] - base['peak_memory_mb']) 
                              / base['peak_memory_mb'] * 100) if base['peak_memory_mb'] > 0 else 0
                
                item = {
                    'name': name,
                    'category': category,
                    'time_change_pct': time_diff_pct,
                    'memory_change_pct': mem_diff_pct,
                    'time_current': result['execution_time_ms'],
                    'time_baseline': base['execution_time_ms'],
                    'memory_current': result['peak_memory_mb'],
                    'memory_baseline': base['peak_memory_mb']
                }
                
                if time_diff_pct < -5 or mem_diff_pct < -5:
                    comparison['improvements'].append(item)
                elif time_diff_pct > 5 or mem_diff_pct > 5:
                    comparison['regressions'].append(item)
    
    # Summary
    total_time_current = current['summary']['total_execution_time_ms']
    total_time_baseline = baseline['summary']['total_execution_time_ms']
    total_mem_current = current['summary']['peak_memory_mb']
    total_mem_baseline = baseline['summary']['peak_memory_mb']
    
    comparison['summary'] = {
        'overall_time_change_pct': ((total_time_current - total_time_baseline) 
                                   / total_time_baseline * 100),
        'overall_memory_change_pct': ((total_mem_current - total_mem_baseline) 
                                     / total_mem_baseline * 100) if total_mem_baseline > 0 else 0,
        'improvements_count': len(comparison['improvements']),
        'regressions_count': len(comparison['regressions'])
    }
    
    return comparison


def print_comparison(comparison: Dict[str, Any]):
    """Print comparison results in a readable format."""
    print("\n" + "="*80)
    print("BENCHMARK COMPARISON WITH BASELINE")
    print("="*80 + "\n")
    
    summary = comparison['summary']
    
    print("OVERALL CHANGES:")
    print(f"  Time: {summary['overall_time_change_pct']:+.2f}%")
    print(f"  Memory: {summary['overall_memory_change_pct']:+.2f}%")
    print(f"  Improvements: {summary['improvements_count']}")
    print(f"  Regressions: {summary['regressions_count']}")
    
    if comparison['improvements']:
        print("\nTOP IMPROVEMENTS:")
        for item in sorted(comparison['improvements'], 
                          key=lambda x: min(x['time_change_pct'], x['memory_change_pct']))[:10]:
            print(f"  {item['name']}")
            print(f"    Time: {item['time_change_pct']:+.2f}% "
                  f"({item['time_baseline']:.2f}ms → {item['time_current']:.2f}ms)")
            print(f"    Memory: {item['memory_change_pct']:+.2f}% "
                  f"({item['memory_baseline']:.2f}MB → {item['memory_current']:.2f}MB)")
    
    if comparison['regressions']:
        print("\nREGRESSIONS:")
        for item in sorted(comparison['regressions'], 
                          key=lambda x: max(x['time_change_pct'], x['memory_change_pct']), 
                          reverse=True)[:10]:
            print(f"  {item['name']}")
            print(f"    Time: {item['time_change_pct']:+.2f}% "
                  f"({item['time_baseline']:.2f}ms → {item['time_current']:.2f}ms)")
            print(f"    Memory: {item['memory_change_pct']:+.2f}% "
                  f"({item['memory_baseline']:.2f}MB → {item['memory_current']:.2f}MB)")


def print_summary(summary: Dict[str, Any]):
    """Print benchmark summary."""
    print("\n" + "="*80)
    print("BENCHMARK SUMMARY")
    print("="*80 + "\n")
    
    print(f"Total Benchmarks: {summary['total_benchmarks']}")
    print(f"Total Execution Time: {summary['total_execution_time_ms']:.2f}ms")
    print(f"Peak Memory Usage: {summary['peak_memory_mb']:.2f}MB")
    print(f"Total Memory Allocated: {summary['total_allocated_memory_mb']:.2f}MB")
    
    print("\nSLOWEST OPERATIONS:")
    for op in summary['slowest_operations']:
        print(f"  {op['name']} ({op['category']}): {op['time_ms']:.2f}ms")
    
    print("\nMOST MEMORY-INTENSIVE OPERATIONS:")
    for op in summary['most_memory_intensive']:
        print(f"  {op['name']} ({op['category']}): {op['memory_mb']:.2f}MB")


def main():
    parser = argparse.ArgumentParser(description="Run PlayTime benchmarks")
    parser.add_argument('--statistics', action='store_true', help='Run only statistics benchmarks')
    parser.add_argument('--games', action='store_true', help='Run only games benchmarks')
    parser.add_argument('--endpoints', action='store_true', help='Run only endpoint benchmarks')
    parser.add_argument('--scenarios', action='store_true', help='Run only scenario benchmarks')
    parser.add_argument('--export', type=str, help='Export results to JSON file')
    parser.add_argument('--compare', type=str, help='Compare with baseline JSON file')
    
    args = parser.parse_args()
    
    # Determine which benchmarks to run
    run_all = not (args.statistics or args.games or args.endpoints or args.scenarios)
    
    all_results = {}
    
    print("\n" + "="*80)
    print("PLAYTIME PLUGIN - BENCHMARK SUITE")
    print("="*80)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80 + "\n")
    
    if run_all or args.statistics:
        print("Running Statistics benchmarks...")
        all_results['statistics'] = run_statistics_benchmarks()
    
    if run_all or args.games:
        print("Running Games benchmarks...")
        all_results['games'] = run_games_benchmarks()
    
    if run_all or args.endpoints:
        print("Running Endpoint benchmarks...")
        all_results['endpoints'] = run_endpoint_benchmarks()
    
    if run_all or args.scenarios:
        print("Running Scenario benchmarks...")
        all_results['scenarios'] = run_scenario_benchmarks()
    
    # Generate summary
    summary = generate_summary(all_results)
    print_summary(summary)
    
    # Build full report
    report = {
        'metadata': {
            'timestamp': datetime.now().isoformat(),
            'python_version': sys.version,
            'platform': sys.platform
        },
        'results': all_results,
        'summary': summary
    }
    
    # Export if requested
    if args.export:
        with open(args.export, 'w') as f:
            json.dump(report, f, indent=2)
        print(f"\nResults exported to: {args.export}")
    
    # Compare if requested
    if args.compare:
        comparison = compare_with_baseline(report, args.compare)
        print_comparison(comparison)
        
        # Export comparison
        comparison_path = args.compare.replace('.json', '_comparison.json')
        with open(comparison_path, 'w') as f:
            json.dump(comparison, f, indent=2)
        print(f"\nComparison exported to: {comparison_path}")
    
    print("\n" + "="*80)
    print("BENCHMARK SUITE COMPLETED")
    print("="*80 + "\n")


if __name__ == "__main__":
    main()
