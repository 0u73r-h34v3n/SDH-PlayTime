import { isNil } from "@src/utils/isNil";
import { Chart, CHART_COLORS } from "./Chart";
import { FocusableExt } from "../FocusableExt";
import { useEffect, useMemo, useState } from "react";
import type { ChartData, ChartOptions } from "chart.js";
import { getGameDominantColorMemo } from "@utils/colorExtractor";
import { useLocator } from "@src/locator";

interface TimeByGame {
	gameId: string;
	gameName: string;
	totalTime: number;
}

/**
 * Fallback: Generate a visually distinct color from a string using HSL color space.
 */
function stringToColor(str: string): string {
	let hash = 0;

	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}

	const hue = Math.abs(hash) % 360;
	const saturation = 65 + (Math.abs(hash >> 8) % 20);
	const lightness = 45 + (Math.abs(hash >> 16) % 20);

	return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function isDailyStatistics(
	statistics: Array<DailyStatistics | GamePlaytimeDetails>,
): statistics is Array<DailyStatistics> {
	return (statistics[0] as DailyStatistics)?.games !== undefined;
}

interface ProcessedChartData {
	gameIds: string[];
	labels: string[];
	values: number[];
}

export function PieView({
	statistics,
	height = 300,
}: {
	statistics: Array<DailyStatistics> | Array<GamePlaytimeDetails>;
	height?: number;
}) {
	const { currentSettings: settings } = useLocator();
	const [gameColors, setGameColors] = useState<Map<string, string>>(new Map());

	const gamesLimit = settings.pieViewGamesLimit;
	const showLegend =
		settings.chartLegendDisplay === "pie" ||
		settings.chartLegendDisplay === "both";

	const chartData = useMemo<ProcessedChartData | null>(() => {
		if (isNil(statistics) || statistics.length === 0) {
			return null;
		}

		let rawData: Array<{ gameId: string; name: string; value: number }>;

		if (isDailyStatistics(statistics)) {
			rawData = sumTimeAndGroupByGame(statistics)
				.map((value) => ({
					gameId: value.gameId,
					name: value.gameName,
					value: value.totalTime / 60.0,
				}))
				.sort((a, b) => b.value - a.value);
		} else {
			rawData = statistics
				.sort((a, b) => b.totalTime - a.totalTime)
				.map((item) => ({
					gameId: item.game.id,
					name: item.game.name,
					value: item.totalTime / 60.0,
				}));
		}

		if (gamesLimit > 0) {
			rawData = rawData.slice(0, gamesLimit);
		}

		return {
			gameIds: rawData.map((d) => d.gameId),
			labels: rawData.map((d) => d.name),
			values: rawData.map((d) => d.value),
		};
	}, [statistics, gamesLimit]);

	useEffect(() => {
		async function extractColors() {
			if (!chartData) return;

			const colors = new Map<string, string>();

			for (let i = 0; i < chartData.gameIds.length; i++) {
				const gameId = chartData.gameIds[i];
				const gameName = chartData.labels[i];

				try {
					const color = await getGameDominantColorMemo(
						gameId,
						settings.chartColorSwatch,
					);
					colors.set(gameId, color);
				} catch {
					colors.set(gameId, stringToColor(gameName));
				}
			}

			setGameColors(colors);
		}

		if (chartData && chartData.gameIds.length > 0) {
			extractColors();
		}
	}, [chartData, settings.chartColorSwatch]);

	const data: ChartData<"pie"> | null = useMemo(() => {
		if (!chartData) return null;

		const colors = chartData.gameIds.map(
			(gameId, index) =>
				gameColors.get(gameId) || stringToColor(chartData.labels[index]),
		);

		return {
			labels: chartData.labels,
			datasets: [
				{
					data: chartData.values,
					backgroundColor: colors,
					label: "Playtime by Game",
				},
			],
		};
	}, [chartData, gameColors]);

	const options: ChartOptions<"pie"> = useMemo(
		() => ({
			plugins: {
				legend: {
					display: showLegend,
					position: "bottom",
					labels: {
						color: CHART_COLORS.text,
					},
				},
				tooltip: {
					enabled: true,
					callbacks: {
						label: (context) => {
							const value = context.parsed;
							const hours = Math.floor(value / 60);
							const minutes = Math.round(value % 60);
							return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
						},
					},
				},
			},
		}),
		[],
	);

	if (!data) {
		return null;
	}

	return (
		<FocusableExt>
			<div className="pie-by-week" style={{ width: "100%", height: height }}>
				<Chart
					type="pie"
					data={data}
					options={options}
					style={{ width: "100%" }}
					height={height}
				/>
			</div>
		</FocusableExt>
	);
}

function sumTimeAndGroupByGame(statistics: DailyStatistics[]): TimeByGame[] {
	const timeByGameId = new Map<string, number>();
	const titleByGameId = new Map<string, string>();

	for (const el of statistics.flatMap((it) => it.games)) {
		timeByGameId.set(
			el.game.id,
			(timeByGameId.get(el.game.id) || 0) + el.totalTime,
		);
		titleByGameId.set(el.game.id, el.game.name);
	}

	const timeByGames: TimeByGame[] = [];

	timeByGameId.forEach((v, k) => {
		timeByGames.push({
			gameId: k,
			gameName: titleByGameId.get(k) || "Unknown",
			totalTime: v,
		} as TimeByGame);
	});

	timeByGames.sort((a, b) => b.totalTime - a.totalTime);

	return timeByGames;
}
