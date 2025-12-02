import { ButtonItem, PanelSection, PanelSectionRow } from "@decky/ui";
import { CurrentPlayTime } from "../containers/CurrentPlayTime";
import { ReportWeekly } from "../containers/ReportWeekly";
import {
	DETAILED_REPORT_ROUTE,
	SETTINGS_ROUTE,
	REPLAY_ROUTE,
	navigateToPage,
} from "./navigation";
import { useEffect, useMemo } from "react";
import { $lastOpenedPage } from "@src/stores/ui";
import { useLocator } from "@src/locator";
import { SupportBanner } from "@src/components/SupportBanner";
import { REPLAY_YEAR } from "@src/app/replay.constants";

const useShowReplayButton = (): boolean => {
	return useMemo(() => {
		const now = new Date();
		// January 8th
		const cutoffDate = new Date(REPLAY_YEAR + 1, 0, 8);

		return now < cutoffDate;
	}, []);
};

export function DeckyPanelPage() {
	const { currentSettings } = useLocator();
	const showReplayButton = useShowReplayButton();

	useEffect(() => {
		$lastOpenedPage.set("all-time");
	}, []);

	return (
		<div>
			<CurrentPlayTime />

			<ReportWeekly isFromQAM={true} />

			<PanelSection title="Misc">
				{showReplayButton && (
					<PanelSectionRow>
						<ButtonItem
							layout="below"
							onClick={() => navigateToPage(REPLAY_ROUTE)}
							// @ts-ignore - ButtonItem supports style at runtime
							style={{
								background:
									"repeating-linear-gradient(45deg, rgba(196, 30, 58, 0.4), rgba(196, 30, 58, 0.4) 10px, rgba(255, 255, 255, 0.2) 10px, rgba(255, 255, 255, 0.2) 20px)",
								color: "#ffffff",
								fontWeight: "bold",
							}}
						>
							Your 2025 ❄️
						</ButtonItem>
					</PanelSectionRow>
				)}

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

				{currentSettings.showKofiInQAM && (
					<PanelSectionRow>
						<SupportBanner variant="compact" />
					</PanelSectionRow>
				)}
			</PanelSection>
		</div>
	);
}
