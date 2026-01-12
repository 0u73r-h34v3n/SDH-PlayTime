import { PanelSection } from "@decky/ui";
import { sortPlayedTime } from "@src/app/sortPlayTime";
import { SortBy, getSelectedSortOptionByKey } from "@src/app/sortPlayTime";
import { showGameOptionsContextMenu } from "@src/components/showOptionsMenu";
import { showSortTitlesContextMenu } from "@src/components/showSortTitlesContextMenu";
import { useEffect, useMemo, useState } from "react";
import { ChartStyle } from "../app/settings";
import { GamesTimeBarView } from "../components/statistics/GamesTimeBarView";
import { PieView } from "../components/statistics/PieView";
import { useLocator } from "../locator";
import { useStore } from "@nanostores/react";
import { $toggleUpdateInListeningComponents } from "@src/stores/ui";

export const ReportOverall = () => {
	const {
		reports,
		currentSettings,
		settings,
		setCurrentSettings,
		trackingService,
	} = useLocator();
	const [data, setData] = useState<GamePlaytimeDetails[]>([]);
	const [isLoading, setLoading] = useState<boolean>(false);
	const sortType = currentSettings.selectedSortByOption || "mostPlayed";
	const toggleUpdateInListeningComponents = useStore(
		$toggleUpdateInListeningComponents,
	);

	const selectedSortOptionByKey =
		getSelectedSortOptionByKey(currentSettings.selectedSortByOption) ||
		"MOST_PLAYED";
	const sortOptionName = SortBy[selectedSortOptionByKey].name;
	const sectionTitle = `Sort ${sortOptionName}`;

	useEffect(() => {
		setLoading(true);

		reports.overallStatistics().then((it) => {
			setData(it);
			setLoading(false);
		});
	}, [toggleUpdateInListeningComponents]);

	const sortedData = useMemo(
		() => sortPlayedTime(data, currentSettings.selectedSortByOption),
		[sortType, data],
	);

	if (isLoading) {
		return <div>Loading...</div>;
	}

	if (!data) {
		return <div>Error while loading data</div>;
	}

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
			<PanelSection title={sectionTitle}>
				<GamesTimeBarView
					data={sortedData}
					showCovers={true}
					onOptionsPress={onOptionsPress}
					onMenuPress={onMenuPress}
				/>

				{currentSettings.gameChartStyle === ChartStyle.PIE_AND_BARS && (
					<PieView statistics={data} />
				)}
			</PanelSection>
		</div>
	);
};
