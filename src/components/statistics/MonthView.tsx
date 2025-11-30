import { useLocator } from "@src/locator";
import { humanReadableTime } from "@utils/formatters";
import { Chart } from "./Chart";
import { FocusableExt } from "../FocusableExt";
import { useMemo } from "react";

interface MonthViewProps {
	statistics: DailyStatistics[];
}

export function MonthView({ statistics }: MonthViewProps) {
	const { currentSettings: settings } = useLocator();

	const dayTimes = useMemo(
		() =>
			statistics.map((it) => {
				const date = new Date(it.date);

				return {
					day: date.getDate() + 1,
					time: it.total,
				};
			}),
		[statistics],
	);

	const maxValue = Math.max(...dayTimes.map((d) => d.time));
	const yMax = maxValue * 1.05;

	return (
		<FocusableExt>
			<div className="playtime-chart">
				<div className="bar-by-month" style={{ width: "100%", height: 300 }}>
					<Chart
						type="bar"
						labels={dayTimes.map((d) => d.day.toString())}
						datasets={[
							{
								label: "Time",
								data: dayTimes.map((d) => d.time),
								backgroundColor: "#008ADA",
								borderRadius: 1,
								barThickness: 20,
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
										callback: (value: string | number) => value,
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
										callback: (value: string | number) =>
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
											const value = context.parsed.y;
											return humanReadableTime(
												settings.displayTime.showTimeInHours,
												value || 0,
											);
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
