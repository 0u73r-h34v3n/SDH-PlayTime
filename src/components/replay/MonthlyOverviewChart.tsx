import { humanReadableTime } from "@src/utils/formatters";
import { useLocator } from "@src/locator";
import { Chart, CHART_COLORS } from "@src/components/statistics/Chart";
import { useMemo } from "react";
import { IoBarChart } from "react-icons/io5";
import type { ChartData, ChartOptions } from "chart.js";

interface MonthlyOverviewChartProps {
	monthlyBreakdown: MonthlyPlayTime[];
}

export function MonthlyOverviewChart({
	monthlyBreakdown,
}: MonthlyOverviewChartProps) {
	const { currentSettings: settings } = useLocator();

	const chartData: ChartData<"bar"> = useMemo(
		() => ({
			labels: monthlyBreakdown.map((m) => m.month),
			datasets: [
				{
					label: "Play Time",
					data: monthlyBreakdown.map((m) => m.playTime),
					backgroundColor: monthlyBreakdown.map((m) =>
						m.playTime === 0 ? CHART_COLORS.transparent : "#9B59B6",
					),
					barThickness: 20,
					borderRadius: 2,
				},
			],
		}),
		[monthlyBreakdown],
	);

	const maxValue = Math.max(...monthlyBreakdown.map((m) => m.playTime), 0);
	const yMax = maxValue === 0 ? 0.1 : maxValue * 1.15;

	const chartOptions: ChartOptions<"bar"> = useMemo(
		() => ({
			scales: {
				x: {
					grid: {
						display: false,
					},
					ticks: {
						color: "rgba(255, 255, 255, 0.7)",
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
						color: "rgba(255, 255, 255, 0.7)",
						callback: (value) =>
							humanReadableTime(
								settings.displayTime.showTimeInHours,
								value as number,
								true,
							),
						count: 5,
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
							const monthData = monthlyBreakdown[context.dataIndex];
							const formattedValue = humanReadableTime(
								settings.displayTime.showTimeInHours,
								value || 0,
							);
							return [
								`Play Time: ${formattedValue}`,
								`Sessions: ${monthData.sessions}`,
							];
						},
					},
				},
			},
		}),
		[yMax, settings.displayTime.showTimeInHours, monthlyBreakdown],
	);

	return (
		<div className="replay-section">
			<div className="replay-section-title">
				<IoBarChart className="replay-section-title-icon icon-chart" />
				Your Gaming Throughout the Year
			</div>

			<div className="replay-chart-container" style={{ height: 250 }}>
				<Chart
					type="bar"
					data={chartData}
					options={chartOptions}
					height={220}
				/>
			</div>
		</div>
	);
}
