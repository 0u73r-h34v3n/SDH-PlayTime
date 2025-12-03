import {
	ButtonItem,
	Navigation,
	PanelSection,
	PanelSectionRow,
} from "@decky/ui";
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
import { GITHUB_URL } from "@src/components/SupportBanner";
import { useVersionCheck } from "@src/app/useVersionCheck";
import { BsInfoCircle } from "react-icons/bs";

const useShowReplayButton = (): boolean => {
	return useMemo(() => {
		const now = new Date();
		// January 8th
		const cutoffDate = new Date(REPLAY_YEAR + 1, 0, 8);

		return now < cutoffDate;
	}, []);
};

const CHANGELOG_URL = `${GITHUB_URL}/blob/master/CHANGELOG.md`;

export function DeckyPanelPage() {
	const { currentSettings } = useLocator();
	const showReplayButton = useShowReplayButton();
	const { showChangelogButton, markVersionAsSeen } = useVersionCheck();

	useEffect(() => {
		$lastOpenedPage.set("all-time");
	}, []);

	const handleChangelogClick = async () => {
		await markVersionAsSeen();
		Navigation.NavigateToExternalWeb(CHANGELOG_URL);
	};

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
							description="Will be removed after January 7th, 2026"
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

				{showChangelogButton && (
					<PanelSectionRow>
						<ButtonItem
							layout="below"
							onClick={handleChangelogClick}
							description="You just got an update! This button will be hidden once accessed. View changelog anytime from Settings > About"
							// @ts-ignore - ButtonItem supports style at runtime
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<BsInfoCircle size={16} style={{ marginRight: "0.5rem" }} /> View
							Changelog
						</ButtonItem>
					</PanelSectionRow>
				)}

				{currentSettings.showKofiInQAM && (
					<PanelSectionRow>
						<SupportBanner variant="compact" />
					</PanelSectionRow>
				)}
			</PanelSection>
		</div>
	);
}
