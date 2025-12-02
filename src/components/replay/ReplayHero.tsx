import { humanReadableTime } from "@src/utils/formatters";
import { useLocator } from "@src/locator";
import {
	IoGameController,
	IoTime,
	IoCalendar,
	IoRibbon,
	IoFlame,
	IoTrendingUp,
	IoHourglass,
	IoSparkles,
	IoStatsChart,
} from "react-icons/io5";

interface ReplayHeroProps {
	summary: YearReplaySummary;
	newGamesCount?: number;
	longestStreakDays?: number;
}

export function ReplayHero({
	summary,
	newGamesCount = 0,
	longestStreakDays = 0,
}: ReplayHeroProps) {
	const { currentSettings: settings } = useLocator();

	const stats = [
		// Row 1: Time-focused stats
		{
			icon: <IoTime />,
			value: humanReadableTime(
				settings.displayTime.showTimeInHours,
				summary.totalPlayTime,
				true,
			),
			label: "Total Playtime",
		},
		{
			icon: <IoTrendingUp />,
			value: humanReadableTime(
				settings.displayTime.showTimeInHours,
				summary.averageDailyPlayTime,
				true,
			),
			label: "Avg. Daily",
		},
		{
			icon: <IoHourglass />,
			value: humanReadableTime(
				settings.displayTime.showTimeInHours,
				summary.averageSessionLength,
				true,
			),
			label: "Avg. Session",
		},
		// Row 2: Activity stats
		{
			icon: <IoGameController />,
			value: summary.totalGamesPlayed.toString(),
			label: "Games Played",
		},
		{
			icon: <IoSparkles />,
			value: newGamesCount.toString(),
			label: "New Discoveries",
		},
		{
			icon: <IoRibbon />,
			value: summary.totalSessions.toString(),
			label: "Sessions",
		},
		// Row 3: Engagement stats
		{
			icon: <IoCalendar />,
			value: summary.totalDaysPlayed.toString(),
			label: "Days Played",
		},
		{
			icon: <IoFlame />,
			value: `${longestStreakDays}`,
			label: "Best Streak",
		},
		{
			icon: <IoStatsChart />,
			value: summary.mostPlayedMonth,
			label: "Peak Month",
		},
	];

	return (
		<div className="replay-hero">
			<div className="replay-hero-content">
				<div className="replay-hero-year">{summary.year}</div>
				<div className="replay-hero-subtitle">Your Year in Retrospective</div>

				<div className="replay-stats-grid">
					{stats.map((stat, index) => (
						<div className="replay-stat-card" key={`stat-${index}`}>
							<div className="replay-stat-icon">{stat.icon}</div>
							<div className="replay-stat-value">{stat.value}</div>
							<div className="replay-stat-label">{stat.label}</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
