import { humanReadableTime } from "@src/utils/formatters";
import { useLocator } from "@src/locator";
import { localizeMonthName, t } from "@src/i18n";
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
			label: t("playtime.totalPlaytime"),
		},
		{
			icon: <IoTrendingUp />,
			value: humanReadableTime(
				settings.displayTime.showTimeInHours,
				summary.averageDailyPlayTime,
				true,
			),
			label: t("playtime.avgDaily"),
		},
		{
			icon: <IoHourglass />,
			value: humanReadableTime(
				settings.displayTime.showTimeInHours,
				summary.averageSessionLength,
				true,
			),
			label: t("playtime.avgSession"),
		},
		// Row 2: Activity stats
		{
			icon: <IoGameController />,
			value: summary.totalGamesPlayed.toString(),
			label: t("playtime.gamesPlayed"),
		},
		{
			icon: <IoSparkles />,
			value: newGamesCount.toString(),
			label: t("playtime.newDiscoveries"),
		},
		{
			icon: <IoRibbon />,
			value: summary.totalSessions.toString(),
			label: t("playtime.sessions"),
		},
		// Row 3: Engagement stats
		{
			icon: <IoCalendar />,
			value: summary.totalDaysPlayed.toString(),
			label: t("playtime.daysPlayed"),
		},
		{
			icon: <IoFlame />,
			value: `${longestStreakDays}`,
			label: t("playtime.bestStreak"),
		},
		{
			icon: <IoStatsChart />,
			value: localizeMonthName(summary.mostPlayedMonth),
			label: t("playtime.peakMonth"),
		},
	];

	return (
		<div className="replay-hero">
			<div className="replay-hero-content">
				<div className="replay-hero-year">{summary.year}</div>
				<div className="replay-hero-subtitle">{t("playtime.subtitle")}</div>

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
