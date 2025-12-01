import { useLocator } from "@src/locator";
import { humanReadableTime } from "@utils/formatters";
import { Chart, CHART_COLORS } from "./Chart";
import { FocusableExt } from "../FocusableExt";
import { useEffect, useMemo, useState } from "react";
import type { ChartData, ChartOptions } from "chart.js";
import { getGameDominantColorMemo } from "@utils/colorExtractor";

interface MonthViewProps {
	statistics: DailyStatistics[];
}

interface GameTimePerDay {
	gameId: string;
	gameName: string;
	timePerDay: Map<number, number>;
	color: string;
}

/**
 * Process statistics to get per-game time for each day (stacked mode)
 * Returns a map of gameId -> GameTimePerDay
 */
function processStatisticsForStackedBars(statistics: DailyStatistics[]): {
	games: GameTimePerDay[];
	days: number[];
} {
	const gameMap = new Map<
		string,
		{ gameName: string; timePerDay: Map<number, number> }
	>();
	const daysSet = new Set<number>();

	for (const day of statistics) {
		const date = new Date(day.date);
		const dayOfMonth = date.getDate();
		daysSet.add(dayOfMonth);

		for (const game of day.games) {
			const existing = gameMap.get(game.game.id);

			if (existing) {
				const currentTime = existing.timePerDay.get(dayOfMonth) || 0;
				existing.timePerDay.set(dayOfMonth, currentTime + game.totalTime);
			} else {
				const timePerDay = new Map<number, number>();
				timePerDay.set(dayOfMonth, game.totalTime);
				gameMap.set(game.game.id, {
					gameName: game.game.name,
					timePerDay,
				});
			}
		}
	}

	const days = Array.from(daysSet).sort((a, b) => a - b);
	const games: GameTimePerDay[] = [];

	gameMap.forEach((value, gameId) => {
		games.push({
			gameId,
			gameName: value.gameName,
			timePerDay: value.timePerDay,
			color: CHART_COLORS.primary, // Will be updated with actual colors
		});
	});

	// Sort games by total time (most played first)
	games.sort((a, b) => {
		const totalA = Array.from(a.timePerDay.values()).reduce(
			(sum, t) => sum + t,
			0,
		);
		const totalB = Array.from(b.timePerDay.values()).reduce(
			(sum, t) => sum + t,
			0,
		);
		return totalB - totalA;
	});

	return { games, days };
}

/**
 * Process statistics for aggregated bars (non-stacked mode)
 * Returns aggregated time per day
 */
function processStatisticsForAggregatedBars(statistics: DailyStatistics[]): {
	days: number[];
	totals: number[];
} {
	const dayTotals = new Map<number, number>();

	for (const day of statistics) {
		const date = new Date(day.date);
		const dayOfMonth = date.getDate();
		const totalTime = day.games.reduce((sum, g) => sum + g.totalTime, 0);
		dayTotals.set(dayOfMonth, (dayTotals.get(dayOfMonth) || 0) + totalTime);
	}

	const days = Array.from(dayTotals.keys()).sort((a, b) => a - b);
	const totals = days.map((day) => dayTotals.get(day) || 0);

	return { days, totals };
}

export function MonthView({ statistics }: MonthViewProps) {
	const { currentSettings: settings } = useLocator();
	const isStacked = settings.isStackedBarsPerGameEnabled;
	const [gameColors, setGameColors] = useState<Map<string, string>>(new Map());

	// Process data based on mode
	const stackedData = useMemo(
		() => (isStacked ? processStatisticsForStackedBars(statistics) : null),
		[statistics, isStacked],
	);

	const aggregatedData = useMemo(
		() => (isStacked ? null : processStatisticsForAggregatedBars(statistics)),
		[statistics, isStacked],
	);

	const games = stackedData?.games ?? [];
	const days = stackedData?.days ?? aggregatedData?.days ?? [];
	const totals = aggregatedData?.totals ?? [];

	// Extract colors from game covers (only in stacked mode)
	useEffect(() => {
		if (!isStacked || games.length === 0) {
			return;
		}

		async function extractColors() {
			const colors = new Map<string, string>();

			for (const game of games) {
				try {
					const color = await getGameDominantColorMemo(
						game.gameId,
						settings.chartColorSwatch,
					);
					colors.set(game.gameId, color);
				} catch {
					colors.set(game.gameId, CHART_COLORS.primary);
				}
			}

			setGameColors(colors);
		}

		extractColors();
	}, [games, isStacked, settings.chartColorSwatch]);

	// Calculate max value for Y axis
	const maxValue = useMemo(() => {
		if (isStacked) {
			let max = 0;

			for (const day of days) {
				let dayTotal = 0;

				for (const game of games) {
					dayTotal += game.timePerDay.get(day) || 0;
				}

				if (dayTotal > max) {
					max = dayTotal;
				}
			}

			return max;
		}

		return Math.max(...totals, 0);
	}, [games, days, totals, isStacked]);

	const yMax = maxValue * 1.05 || 0.1;

	const data: ChartData<"bar"> = useMemo(() => {
		if (isStacked) {
			const datasets = games.map((game) => ({
				label: game.gameName,
				data: days.map((day) => game.timePerDay.get(day) || 0),
				backgroundColor: gameColors.get(game.gameId) || CHART_COLORS.primary,
				borderRadius: 1,
				barThickness: 20,
				stack: "games",
			}));

			return {
				labels: days.map((d) => d.toString()),
				datasets,
			};
		}

		// Aggregated mode - single dataset
		return {
			labels: days.map((d) => d.toString()),
			datasets: [
				{
					label: "Play Time",
					data: totals,
					backgroundColor: CHART_COLORS.primary,
					borderRadius: 1,
					barThickness: 20,
				},
			],
		};
	}, [games, days, gameColors, isStacked, totals]);

	const options: ChartOptions<"bar"> = useMemo(
		() => ({
			scales: {
				x: {
					stacked: isStacked,
					grid: {
						display: true,
						color: CHART_COLORS.grid,
					},
					ticks: {
						color: CHART_COLORS.text,
					},
				},
				y: {
					stacked: isStacked,
					beginAtZero: true,
					max: yMax,
					grid: {
						display: true,
						color: CHART_COLORS.grid,
					},
					ticks: {
						color: CHART_COLORS.text,
						callback: (value) =>
							humanReadableTime(
								settings.displayTime.showTimeInHours,
								value as number,
								true,
							),
						count: 6,
					},
				},
			},
			plugins: {
				legend: {
					display: false,
				},
				tooltip: {
					callbacks: {
						title: (context) => {
							const dayLabel = context[0]?.label;

							return `Day ${dayLabel}`;
						},
						label: (context) => {
							const gameName = isStacked
								? context.dataset.label || "Unknown"
								: "Total";
							const value = context.parsed.y;
							const formattedTime = humanReadableTime(
								settings.displayTime.showTimeInHours,
								value || 0,
							);
							return isStacked
								? `${gameName}: ${formattedTime}`
								: formattedTime;
						},
					},
				},
			},
		}),
		[yMax, settings.displayTime.showTimeInHours, games.length, isStacked],
	);

	return (
		<FocusableExt>
			<div className="playtime-chart">
				<div className="bar-by-month" style={{ width: "100%", height: 300 }}>
					<Chart
						type="bar"
						data={data}
						options={options}
						style={{ width: "100%" }}
						height={300}
					/>
				</div>
			</div>
		</FocusableExt>
	);
}
