import { PanelSection } from "@decky/ui";
import { sortPlayedTime } from "@src/app/sortPlayTime";
import { SortBy, getSelectedSortOptionByKey } from "@src/app/sortPlayTime";
import { showGameOptionsContextMenu } from "@src/components/showOptionsMenu";
import { showSortTitlesContextMenu } from "@src/components/showSortTitlesContextMenu";
import { useEffect, useMemo, useState } from "react";
import { GamesTimeBarView } from "../components/statistics/GamesTimeBarView";
import { useLocator } from "../locator";

export const ReportOverall = () => {
	const { reports, currentSettings, settings, setCurrentSettings } =
		useLocator();
	const [data, setData] = useState<GameWithTime[]>([]);
	const [isLoading, setLoading] = useState<boolean>(false);
	const sortType = currentSettings.selectedSortByOption || "mostPlayed";

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
	}, []);

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

	const onMenuPress = (gameName: string, gameId: string) => {
		showGameOptionsContextMenu({ gameName, gameId })();
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
			</PanelSection>
		</div>
	);
};
