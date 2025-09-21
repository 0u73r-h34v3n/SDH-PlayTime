import { ButtonItem, PanelSection, PanelSectionRow } from "@decky/ui";
import { CurrentPlayTime } from "../containers/CurrentPlayTime";
import { ReportWeekly } from "../containers/ReportWeekly";
import {
	DETAILED_REPORT_ROUTE,
	SETTINGS_ROUTE,
	navigateToPage,
} from "./navigation";
import { useEffect } from "react";
import { $lastOpenedPage } from "@src/stores/ui";

export function DeckyPanelPage() {
	useEffect(() => {
		$lastOpenedPage.set("all-time");
	}, []);

	return (
		<div>
			<CurrentPlayTime />

			<ReportWeekly isFromQAM={true} />

			<PanelSection title="Misc">
				<PanelSectionRow>
					<ButtonItem
						layout="below"
						onClick={() => navigateToPage(DETAILED_REPORT_ROUTE)}
					>
						Detailed report
					</ButtonItem>
				</PanelSectionRow>

				<PanelSectionRow>
					<ButtonItem
						layout="below"
						onClick={() => navigateToPage(SETTINGS_ROUTE)}
					>
						Settings
					</ButtonItem>
				</PanelSectionRow>
			</PanelSection>
		</div>
	);
}
