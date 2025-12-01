import { useLocator } from "@src/locator";
import { humanReadableTime } from "@utils/formatters";
import { Chart, CHART_COLORS } from "./Chart";
import { format } from "date-fns";
import { useMemo } from "react";
import { FocusableExt } from "../FocusableExt";
import type { ChartData, ChartOptions } from "chart.js";

interface YearViewProperties {
	statistics: Array<DailyStatistics>;
}

type ChartsStatistics = {
	monthName: string;
	total: number;
	migrated: number;
};

export function YearView({ statistics: yearStatistics }: YearViewProperties) {
	const { currentSettings: settings } = useLocator();

	const statistics = useMemo(
		() =>
			yearStatistics.reduce<Array<ChartsStatistics>>(
				(accumulator, currentValue) => {
					const { date, total } = currentValue;
					const monthName = format(date, "MMM");
					const index = accumulator.findIndex(
						(item) => item.monthName === monthName,
					);

					if (index === -1) {
						accumulator.push({ monthName, total, migrated: 0 });

						return accumulator;
					}

					accumulator[index] = {
						...accumulator[index],
						total: accumulator[index].total + total,
					};

					return accumulator;
				},
				[],
			),
		[yearStatistics],
	);

	const maxValue = Math.max(...statistics.map((s) => s.total + s.migrated), 0);
	const yMax = maxValue === 0 ? 0.1 : maxValue * 1.15;

	const data: ChartData<"bar"> = useMemo(
		() => ({
			labels: statistics.map((s) => s.monthName),
			datasets: [
				{
					label: "Total",
					data: statistics.map((s) => s.total),
					backgroundColor: statistics.map((s) =>
						s.total === 0 ? CHART_COLORS.transparent : CHART_COLORS.primary,
					),
					barThickness: 20,
					stack: "month-bar",
					borderRadius: 1,
				},
				{
					label: "Migrated",
					data: statistics.map((s) => s.migrated),
					backgroundColor: statistics.map((s) =>
						s.migrated === 0
							? CHART_COLORS.transparent
							: CHART_COLORS.secondary,
					),
					barThickness: 20,
					stack: "month-bar",
					borderRadius: 1,
				},
			],
		}),
		[statistics],
	);

	const options: ChartOptions<"bar"> = useMemo(
		() => ({
			scales: {
				x: {
					grid: {
						display: true,
						color: CHART_COLORS.grid,
					},
					ticks: {
						color: CHART_COLORS.text,
					},
				},
				y: {
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
						label: (context) => {
							const label = context.dataset.label || "";
							const value = context.parsed.y;
							const formattedValue = humanReadableTime(
								settings.displayTime.showTimeInHours,
								value || 0,
							);
							return `${label}: ${formattedValue}`;
						},
					},
				},
			},
		}),
		[yMax, settings.displayTime.showTimeInHours],
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
