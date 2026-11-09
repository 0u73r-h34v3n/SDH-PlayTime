import { Field, PanelSection, PanelSectionRow } from "@decky/ui";
import { useLocator } from "@src/locator";
import { humanReadableTime } from "@utils/formatters";
import { format } from "date-fns";
import { type FC, useMemo } from "react";
import { FocusableExt } from "../FocusableExt";
import { t } from "@src/i18n";

function calculateAverages(yearlyStats: Array<DailyStatistics>): {
	averagePlaytime: number;
	averagePerMonth: number;
	averagePerDay: number;
} {
	const totalMonths = new Map();
	let totalPlaytime = 0;
	let totalSessions = 0;
	const totalDays = new Map();

	const daysWithStatistics = yearlyStats
		.slice(0)
		.filter((statistics) => statistics.total);

	for (const dailyStatistics of daysWithStatistics) {
		const { games } = dailyStatistics;

		for (const game of games) {
			const { sessions } = game;

			totalSessions += sessions.length;
			totalPlaytime += game.totalTime;

			for (const session of sessions) {
				const formattedDate = format(new Date(session.date), "M-d");
				const formattedMonth = format(new Date(session.date), "M");

				if (!totalMonths.has(formattedMonth)) {
					totalMonths.set(formattedMonth, true);
				}

				if (totalDays.has(formattedDate)) {
					continue;
				}

				totalDays.set(formattedDate, true);
			}
		}
	}

	const averagePlaytime = totalPlaytime / totalSessions || 0;
	const averagePerMonth = totalPlaytime / totalMonths.size || 0;
	const averagePerDay = totalPlaytime / totalDays.size || 0;

	return {
		averagePlaytime,
		averagePerMonth,
		averagePerDay,
	};
}

export const YearlyAverageAndOverall: FC<{
	statistics: Array<DailyStatistics>;
}> = ({ statistics }) => {
	const { currentSettings: settings } = useLocator();

	const averages = useMemo(() => calculateAverages(statistics), [statistics]);

	return (
		<FocusableExt style={{ marginTop: "16px" }}>
			<PanelSection title={t("stats.averageAndOverall")}>
				<PanelSectionRow>
					<Field label={t("stats.playtimeAverage")} bottomSeparator="none">
						{humanReadableTime(
							settings.displayTime.showTimeInHours,
							averages.averagePlaytime,
							true,
							settings.displayTime.showSeconds,
						)}
					</Field>
				</PanelSectionRow>

				<PanelSectionRow>
					<Field label={t("stats.perMonthAverage")} bottomSeparator="none">
						{humanReadableTime(
							settings.displayTime.showTimeInHours,
							averages.averagePerMonth,
							true,
							settings.displayTime.showSeconds,
						)}
					</Field>
				</PanelSectionRow>

				<PanelSectionRow>
					<Field label={t("stats.perDayAverage")} bottomSeparator="none">
						{humanReadableTime(
							settings.displayTime.showTimeInHours,
							averages.averagePerDay,
							true,
							settings.displayTime.showSeconds,
						)}
					</Field>
				</PanelSectionRow>
			</PanelSection>
		</FocusableExt>
	);
};
