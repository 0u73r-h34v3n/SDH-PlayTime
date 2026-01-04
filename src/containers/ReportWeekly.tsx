import { PanelSection } from "@decky/ui";
import { sortPlayedTime } from "@src/app/sortPlayTime";
import { SortBy, getSelectedSortOptionByKey } from "@src/app/sortPlayTime";
import { showGameOptionsContextMenu } from "@src/components/showOptionsMenu";
import { showSortTitlesContextMenu } from "@src/components/showSortTitlesContextMenu";
import { formatWeekInterval } from "@utils/formatters";
import { useEffect, useMemo, useState } from "react";
import { convertDailyStatisticsToGameWithTime } from "../app/model";
import { empty, type Paginated } from "../app/reports";
import { ChartStyle } from "../app/settings";
import { Pager } from "../components/Pager";
import { AverageAndOverall } from "../components/statistics/AverageAndOverall";
import { GamesTimeBarView } from "../components/statistics/GamesTimeBarView";
import { PieView } from "../components/statistics/PieView";
import { StackedWeekView } from "../components/statistics/StackedWeekView";
import { WeekView } from "../components/statistics/WeekView";
import { useLocator } from "../locator";
import { $lastWeeklyStatisticsPage } from "@src/stores/ui";
import { isNil } from "es-toolkit";

interface ReportWeeklyProperties {
	isFromQAM?: boolean;
}

export const ReportWeekly = ({ isFromQAM = false }: ReportWeeklyProperties) => {
	const {
		reports,
		currentSettings,
		settings,
		setCurrentSettings,
		trackingService,
	} = useLocator();
	const [isLoading, setLoading] = useState<boolean>(false);
	const [currentPage, setCurrentPage] = useState<Paginated<DayStatistics>>(
		isFromQAM ? empty() : $lastWeeklyStatisticsPage.get(),
	);
	const sortType = currentSettings.selectedSortByOption || "mostPlayed";

	const selectedSortOptionByKey =
		getSelectedSortOptionByKey(currentSettings.selectedSortByOption) ||
		"MOST_PLAYED";
	const sortOptionName = SortBy[selectedSortOptionByKey].name;
	const sectionTitle = isFromQAM ? "By Game" : `Sort ${sortOptionName}`;

	const { interval } = currentPage.current();
	const { start, end } = interval;

	const sortedData = useMemo(
		() =>
			sortPlayedTime(
				convertDailyStatisticsToGameWithTime(currentPage.current().data),
				currentSettings.selectedSortByOption,
			),
		[sortType, `${start} - ${end}`],
	);

	useEffect(() => {
		if (isNil(currentPage?.isEmpty)) {
			return;
		}

		setLoading(true);

		reports.weeklyStatistics().then((it) => {
			setCurrentPage(it);
			$lastWeeklyStatisticsPage.set(it);
			setLoading(false);
		});
	}, []);

	const onNextWeek = () => {
		setLoading(true);

		currentPage?.next().then((it) => {
			setCurrentPage(it);
			$lastWeeklyStatisticsPage.set(it);
			setLoading(false);
		});
	};

	const onPrevWeek = () => {
		setLoading(true);

		currentPage?.prev().then((it) => {
			setCurrentPage(it);
			$lastWeeklyStatisticsPage.set(it);
			setLoading(false);
		});
	};

	const data = currentPage.current().data;
	const isAnyGames =
		data
			.map((it) => {
				return it.games.length;
			})
			.reduce((a, b) => a + b, 0) > 0;

	const onOptionsPress = () => {
		showSortTitlesContextMenu({
			currentSettings,
			settings,
			setCurrentSettings,
		})();
	};

	const onMenuPress = (
		gameName: string,
		gameId: string,
		hasChecksumEnabled: boolean = false,
	) => {
		showGameOptionsContextMenu({
			gameName,
			gameId,
			hasChecksumEnabled,
			trackingService,
		})();
	};

	return (
		<div>
			<Pager
				onNext={onNextWeek}
				onPrev={onPrevWeek}
				currentText={formatWeekInterval(currentPage.current().interval)}
				hasNext={currentPage.hasNext()}
				hasPrev={currentPage.hasPrev()}
				prevKey={isFromQAM ? undefined : "l2"}
				nextKey={isFromQAM ? undefined : "r2"}
				isEnabledChangePagesWithTriggers={!isFromQAM}
			/>

			{isLoading && <div>Loading...</div>}

			{!isLoading && !currentPage && <div>Error while loading data</div>}

			{!isLoading && currentPage && (
				<div>
					<AverageAndOverall statistics={data} />

					<PanelSection title="By day">
						{currentSettings.isStackedBarsPerGameEnabled ? (
							<StackedWeekView statistics={data} />
						) : (
							<WeekView statistics={data} />
						)}
					</PanelSection>

					{isAnyGames && (
						<PanelSection title={sectionTitle}>
							<GamesTimeBarView
								data={sortedData}
								showCovers={!isFromQAM}
								onOptionsPress={onOptionsPress}
								onMenuPress={onMenuPress}
							/>

							{currentSettings.gameChartStyle === ChartStyle.PIE_AND_BARS && (
								<PieView
									statistics={data}
									height={isFromQAM ? currentSettings.pieViewQAMHeight : 300}
								/>
							)}
						</PanelSection>
					)}
				</div>
			)}
		</div>
	);
};
