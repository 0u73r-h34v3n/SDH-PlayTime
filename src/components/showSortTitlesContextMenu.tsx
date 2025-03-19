import { Menu, MenuItem, showContextMenu } from "@decky/ui";
import { SortBy, type SortByObjectKeys } from "@src/app/sortPlayTime";
import type { Locator } from "@src/app/system";

type ShowSortTitlesContextMenuProperties = {
	currentSettings: Locator["currentSettings"];
	settings: Locator["settings"];
	setCurrentSettings: Locator["setCurrentSettings"];
};

export function showSortTitlesContextMenu({
	currentSettings,
	settings,
	setCurrentSettings,
}: ShowSortTitlesContextMenuProperties) {
	return () => {
		const objectKeys = Object.keys(
			SortBy,
		) as unknown as Array<SortByObjectKeys>;

		const selectedOption = objectKeys.find(
			(item) => SortBy[item].key === currentSettings.selectedSortByOption,
		);

		showContextMenu(
			<Menu label="Sort titles">
				{objectKeys.map((key) => {
					return (
						<MenuItem
							key={SortBy[key].key}
							onSelected={() => {
								const selectedSortType = SortBy[key].key;

								settings
									.save({
										...currentSettings,
										selectedSortByOption: selectedSortType,
									})
									.then(() => {
										setCurrentSettings((value) => ({
											...value,
											selectedSortByOption: selectedSortType,
										}));
									});
							}}
							disabled={key === selectedOption}
						>
							{SortBy[key].name}
						</MenuItem>
					);
				})}
			</Menu>,
		);
	};
}
