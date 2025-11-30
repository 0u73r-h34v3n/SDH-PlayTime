import { useLocator } from "@src/locator";
import { humanReadableTime } from "@utils/formatters";
import { Chart } from "./Chart";
import { format } from "date-fns";
import { useMemo } from "react";
import { FocusableExt } from "../FocusableExt";

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

	const statistics = useMemo(() => {
		return yearStatistics.reduce<Array<ChartsStatistics>>(
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
		);
	}, [yearStatistics]);

	const maxValue = Math.max(...statistics.map((s) => s.total + s.migrated));
	const yMax = maxValue === 0 ? 0.1 : maxValue * 1.15;

	return (
		<FocusableExt>
			<div className="playtime-chart">
				<div className="bar-by-month" style={{ width: "100%", height: 300 }}>
					<Chart
						type="bar"
						labels={statistics.map((s) => s.monthName)}
						datasets={[
							{
								label: "Total",
								data: statistics.map((s) => s.total),
								backgroundColor: statistics.map((s) =>
									s.total === 0 ? "rgba(0, 0, 0, 0)" : "#008ADA",
								),
								barThickness: 20,
								stack: "month-bar",
								borderRadius: 1,
							},
							{
								label: "Migrated",
								data: statistics.map((s) => s.migrated),
								backgroundColor: statistics.map((s) =>
									s.migrated === 0 ? "rgba(0, 0, 0, 0)" : "#FFD500",
								),
								barThickness: 20,
								stack: "month-bar",
								borderRadius: 1,
							},
						]}
						options={{
							responsive: true,
							maintainAspectRatio: false,
							animation: {},
							scales: {
								x: {
									grid: {
										display: true,
										color: "rgba(255, 255, 255, 0.1)",
									},
									ticks: {
										color: "rgba(255, 255, 255, 0.7)",
									},
								},
								y: {
									beginAtZero: false,
									max: yMax,
									grid: {
										display: true,
										color: "rgba(255, 255, 255, 0.1)",
									},
									ticks: {
										color: "rgba(255, 255, 255, 0.7)",
										callback: (value: string | number) => {
											return humanReadableTime(
												settings.displayTime.showTimeInHours,
												value as number,
												true,
											);
										},
										count: 6,
									},
								},
							},
							plugins: {
								legend: {
									display: true,
									position: "bottom",
									labels: {
										color: "rgba(255, 255, 255, 0.7)",
									},
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
						}}
						style={{ width: "100%" }}
						height={300}
					/>
				</div>
			</div>
		</FocusableExt>
	);
}
