import { getGameCoverImage } from "@src/components/GameCard";
import { humanReadableTime } from "@src/utils/formatters";
import { useLocator } from "@src/locator";
import { Chart, CHART_COLORS } from "@src/components/statistics/Chart";
import { useMemo } from "react";
import {
	IoStatsChart,
	IoTime,
	IoGameController,
	IoFlame,
} from "react-icons/io5";
import type { ChartData, ChartOptions } from "chart.js";

interface TopGameDetailProps {
	game: YearReplayGame;
	index: number;
}

export function TopGameDetail({ game, index }: TopGameDetailProps) {
	const { currentSettings: settings } = useLocator();

	const chartData: ChartData<"bar"> = useMemo(
		() => ({
			labels: game.monthlyPlayTime.map((m) => m.month),
			datasets: [
				{
					label: "Play Time",
					data: game.monthlyPlayTime.map((m) => m.playTime),
					backgroundColor: game.monthlyPlayTime.map((m) =>
						m.playTime === 0 ? CHART_COLORS.transparent : "#D4606B",
					),
					barThickness: 16,
					borderRadius: 2,
				},
			],
		}),
		[game.monthlyPlayTime],
	);

	const maxValue = Math.max(...game.monthlyPlayTime.map((m) => m.playTime), 0);
	const yMax = maxValue === 0 ? 0.1 : maxValue * 1.15;

	const chartOptions: ChartOptions<"bar"> = useMemo(
		() => ({
			scales: {
				x: {
					grid: {
						display: false,
					},
					ticks: {
						color: "rgba(255, 255, 255, 0.6)",
						font: { size: 10 },
					},
				},
				y: {
					beginAtZero: true,
					max: yMax,
					grid: {
						display: true,
						color: "rgba(255, 255, 255, 0.1)",
					},
					ticks: {
						color: "rgba(255, 255, 255, 0.6)",
						callback: (value) =>
							humanReadableTime(
								settings.displayTime.showTimeInHours,
								value as number,
								true,
							),
						count: 4,
					},
				},
			},
			plugins: {
				legend: {
					display: false,
				},
				tooltip: {
					callbacks: {
						label: (context) => {
							const value = context.parsed.y;
							return humanReadableTime(
								settings.displayTime.showTimeInHours,
								value || 0,
							);
						},
					},
				},
			},
		}),
		[yMax, settings.displayTime.showTimeInHours],
	);

	return (
		<div className="replay-game-detail">
			<div className="replay-game-detail-header">
				<div className="replay-game-detail-cover">
					<div
						className="replay-game-cover-image"
						style={{
							backgroundImage: getGameCoverImage(game.game.id),
						}}
					/>
				</div>

				<div className="replay-game-detail-info">
					<div className="replay-game-detail-name">
						#{index + 1} {game.game.name}
					</div>

					<div className="replay-game-detail-stats">
						<div className="replay-game-detail-stat">
							<div className="replay-game-detail-stat-value">
								{game.percentageOfTotal.toFixed(1)}%
							</div>
							<div className="replay-game-detail-stat-label">
								<IoTime style={{ marginRight: 4 }} />
								of Total
							</div>
						</div>

						<div className="replay-game-detail-stat">
							<div className="replay-game-detail-stat-value">
								{game.sessions}
							</div>
							<div className="replay-game-detail-stat-label">
								<IoGameController style={{ marginRight: 4 }} />
								Sessions
							</div>
						</div>

						<div className="replay-game-detail-stat">
							<div className="replay-game-detail-stat-value">
								{game.longestStreak}
							</div>
							<div className="replay-game-detail-stat-label">
								<IoFlame style={{ marginRight: 4 }} />
								Day Streak
							</div>
						</div>

						<div className="replay-game-detail-stat">
							<div className="replay-game-detail-stat-value">
								{humanReadableTime(
									settings.displayTime.showTimeInHours,
									game.totalTime,
									true,
								)}
							</div>
							<div className="replay-game-detail-stat-label">
								<IoStatsChart style={{ marginRight: 4 }} />
								Total Time
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="replay-chart-container">
				<Chart
					type="bar"
					data={chartData}
					options={chartOptions}
					height={200}
				/>
			</div>
		</div>
	);
}
