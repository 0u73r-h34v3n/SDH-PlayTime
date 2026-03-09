import {
	ButtonItem,
	DialogButton,
	Field,
	Focusable,
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
import { KOFI_URL } from "@src/components/SupportBanner";
import { getDefaultReplayYear } from "@src/app/replay.constants";
import { GITHUB_URL } from "@src/components/SupportBanner";
import { useVersionCheck } from "@src/app/useVersionCheck";
import { BsInfoCircle } from "react-icons/bs";
import { HiQrCode } from "react-icons/hi2";
import showKofiQrModal from "@src/utils/showKofiQrModal";

const useShowReplayButton = (): { show: boolean; year: number } => {
	return useMemo(() => {
		const now = new Date();
		const currentYear = now.getFullYear();
		const currentMonth = now.getMonth(); // 0-11
		const currentDay = now.getDate();

		// Show from Dec 10 to Dec 31
		if (currentMonth === 11 && currentDay >= 10) {
			return { show: true, year: currentYear };
		}

		// Show from Jan 1 to Jan 7
		if (currentMonth === 0 && currentDay <= 7) {
			return { show: true, year: currentYear - 1 };
		}

		return { show: false, year: getDefaultReplayYear() };
	}, []);
};

const CHANGELOG_URL = `${GITHUB_URL}/blob/master/CHANGELOG.md`;

export function DeckyPanelPage() {
	const { currentSettings } = useLocator();
	const { show: showReplayButton, year: replayYear } = useShowReplayButton();
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
							onClick={() =>
								navigateToPage(
									REPLAY_ROUTE.replace(":year", replayYear.toString()),
								)
							}
							// @ts-ignore - ButtonItem supports style at runtime
							style={{
								background:
									"repeating-linear-gradient(45deg, rgba(196, 30, 58, 0.4), rgba(196, 30, 58, 0.4) 10px, rgba(255, 255, 255, 0.2) 10px, rgba(255, 255, 255, 0.2) 20px)",
								color: "#ffffff",
								fontWeight: "bold",
							}}
							description={`Available from Dec 10 to Jan 7`}
						>
							Your {replayYear} ❄️
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
						<Field
							bottomSeparator="none"
							icon={null}
							label={null}
							childrenLayout={undefined}
							inlineWrap="keep-inline"
							padding="none"
							spacingBetweenLabelAndChild="none"
							childrenContainerWidth="max"
						>
							<style>
								{`.kofi-dialog-button.gpfocus.gpfocuswithin {
  background-color: rgba(255, 94, 91, 0.45) !important
}`}
							</style>
							<Focusable style={{ display: "flex" }}>
								<DialogButton
									onClick={() => {
										Navigation.CloseSideMenus();
										Navigation.NavigateToExternalWeb(KOFI_URL);
									}}
									onSecondaryButton={() => showKofiQrModal()}
									onSecondaryActionDescription={"Show QR Code"}
									className="kofi-dialog-button"
									style={{
										// padding: "10px",
										// fontSize: "14px",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										gap: "6px",
										padding: "6px 12px",
										margin: "8px 3px 8px 0px",
										background: "rgba(255, 94, 91, 0.15)",
										border: "1px solid rgba(255, 94, 91, 0.3)",
										borderRadius: "4px",
										color: "#ff9966",
										fontSize: "12px",
										cursor: "pointer",
										width: "100%",
										transition: "background 0.2s ease",
									}}
								>
									Support on Ko-fi
								</DialogButton>

								<DialogButton
									onOKActionDescription={"Show QR Code"}
									onClick={() => showKofiQrModal()}
									className="kofi-dialog-button"
									style={{
										display: "flex",
										justifyContent: "center",
										alignItems: "center",
										padding: "10px",
										maxWidth: "40px",
										minWidth: "auto",
										marginLeft: ".5em",

										// display: "flex",
										// alignItems: "center",
										// justifyContent: "center",
										gap: "6px",
										// padding: "6px 12px",
										margin: "8px 0",
										background: "rgba(255, 94, 91, 0.15)",
										border: "1px solid rgba(255, 94, 91, 0.3)",
										borderRadius: "4px",
										color: "#ff9966",
										fontSize: "12px",
										cursor: "pointer",
										width: "100%",
										transition: "background 0.2s ease",
									}}
								>
									<HiQrCode />
								</DialogButton>
							</Focusable>
						</Field>
					</PanelSectionRow>
				)}
			</PanelSection>
		</div>
	);
}
