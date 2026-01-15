import {
	ButtonItem,
	DialogButton,
	Dropdown,
	Field,
	Navigation,
	PanelSection,
	PanelSectionRow,
	SidebarNavigation,
	type SidebarNavigationPage,
} from "@decky/ui";
import { $gameCheksumsLoadingState } from "@src/stores/games";
import { useEffect, useState } from "react";
import { MdModeEdit } from "react-icons/md";
import {
	ChartStyle,
	DEFAULTS,
	type ChartLegendDisplay,
	type PieViewGamesLimit,
	type PieViewQAMHeight,
	type PlayTimeSettings,
	type VibrantSwatch,
} from "@src/app/settings";
import { Tab } from "@src/components/Tab";
import { useLocator } from "@src/locator";
import { FileChecksum } from "./checksums";
import {
	MANUALLY_ADJUST_TIME,
	navigateToPage,
	TRACKING_LIST_ROUTE,
	ASSOCIATION_LIST_ROUTE,
} from "@src/pages/navigation";
import { BsFileBinary, BsInfoCircle } from "react-icons/bs";
import { FaGithub, FaHeart, FaCalendarAlt } from "react-icons/fa";
import { IoMdOptions } from "react-icons/io";
import { SiKofi } from "react-icons/si";
import { GITHUB_URL, KOFI_URL } from "@src/components/SupportBanner";
import { navigateToReplay } from "@src/pages/navigation";
import {
	getDefaultReplayYear,
	getAvailableReplayYears,
} from "@src/app/replay.constants";

const SCALE_OPTIONS = [
	0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2,
];

const PIE_VIEW_LIMIT_OPTIONS: Array<{
	label: string;
	data: PieViewGamesLimit;
}> = [
	{ label: "5", data: 5 },
	{ label: "10", data: 10 },
	{ label: "15", data: 15 },
	{ label: "25", data: 25 },
	{ label: "50", data: 50 },
	{ label: "100", data: 100 },
	{ label: "All", data: -1 },
];

const COLOR_SWATCH_OPTIONS: Array<{ label: string; data: VibrantSwatch }> = [
	{ label: "Vibrant", data: "Vibrant" },
	{ label: "Dark Vibrant", data: "DarkVibrant" },
	{ label: "Light Vibrant", data: "LightVibrant" },
	{ label: "Muted", data: "Muted" },
	{ label: "Dark Muted", data: "DarkMuted" },
	{ label: "Light Muted", data: "LightMuted" },
];

const LEGEND_DISPLAY_OPTIONS: Array<{
	label: string;
	data: ChartLegendDisplay;
}> = [
	{ label: "None", data: "none" },
	{ label: "Pie charts only", data: "pie" },
	{ label: "Bar charts only", data: "bar" },
	{ label: "Both", data: "both" },
];

const PIE_VIEW_QAM_HEIGHT_OPTIONS: Array<{
	label: string;
	data: PieViewQAMHeight;
}> = [
	{ label: "300px", data: 300 },
	{ label: "250px", data: 250 },
	{ label: "200px", data: 200 },
];

const GeneralSettings = () => {
	const { settings, setCurrentSettings } = useLocator();
	const [current, setCurrent] = useState<PlayTimeSettings>(DEFAULTS);
	const [loaded, setLoaded] = useState<boolean>(false);

	const loadSettings = () => {
		setLoaded(false);

		settings.get().then((r) => {
			setCurrent(r);
			setLoaded(true);
		});
	};

	useEffect(() => {
		loadSettings();
	}, []);

	const updateSettings = async () => {
		await settings.save(current);

		loadSettings();
	};

	if (!loaded) {
		return null;
	}

	return (
		<>
			<PanelSection title="Time Display">
				<PanelSectionRow>
					<Field label="Display played time in">
						<Dropdown
							selectedOption={current?.displayTime.showTimeInHours}
							rgOptions={[
								{
									label: "Days",
									data: false,
								},
								{
									label: "Hours",
									data: true,
								},
							]}
							onChange={(v) => {
								current.displayTime.showTimeInHours = v.data;
								updateSettings();
							}}
						/>
					</Field>

					<Field label="Show seconds">
						<Dropdown
							selectedOption={current?.displayTime.showSeconds}
							rgOptions={[
								{
									label: "No",
									data: false,
								},
								{
									label: "Yes",
									data: true,
								},
							]}
							onChange={(v) => {
								current.displayTime.showSeconds = v.data;
								updateSettings();
							}}
						/>
					</Field>
				</PanelSectionRow>
			</PanelSection>

			<PanelSection title="Charts">
				<PanelSectionRow>
					<Field label="Chart type">
						<Dropdown
							selectedOption={current?.gameChartStyle}
							rgOptions={[
								{
									label: "Bar charts",
									data: ChartStyle.BAR,
								},
								{
									label: "Bar and Pie charts",
									data: ChartStyle.PIE_AND_BARS,
								},
							]}
							onChange={(v) => {
								current.gameChartStyle = v.data;
								updateSettings();
							}}
						/>
					</Field>

					<Field
						label="Stacked bars per game"
						description="Shows each game's playtime in different colors within the same bar. Colors are based on game cover images."
					>
						<Dropdown
							selectedOption={current?.isStackedBarsPerGameEnabled}
							rgOptions={[
								{
									label: "No",
									data: false,
								},
								{
									label: "Yes",
									data: true,
								},
							]}
							onChange={(v) => {
								current.isStackedBarsPerGameEnabled = v.data;
								updateSettings();
							}}
						/>
					</Field>

					{current?.isStackedBarsPerGameEnabled && (
						<Field
							label="Chart color style"
							description={`Which color palette to use from cover images. Palette is based on "Vibrant-Colors/node-vibrant" library.`}
						>
							<Dropdown
								selectedOption={current?.chartColorSwatch}
								rgOptions={COLOR_SWATCH_OPTIONS}
								onChange={(v) => {
									current.chartColorSwatch = v.data;
									updateSettings();
								}}
							/>
						</Field>
					)}

					<Field label="Pie chart games limit">
						<Dropdown
							selectedOption={current?.pieViewGamesLimit}
							rgOptions={PIE_VIEW_LIMIT_OPTIONS}
							onChange={(v) => {
								current.pieViewGamesLimit = v.data;
								updateSettings();
							}}
						/>
					</Field>

					<Field
						label="Show chart legend"
						description="Display a legend with game names and colors on charts."
					>
						<Dropdown
							selectedOption={current?.chartLegendDisplay}
							rgOptions={LEGEND_DISPLAY_OPTIONS}
							onChange={(v) => {
								current.chartLegendDisplay = v.data;
								updateSettings();
							}}
						/>
					</Field>

					<Field
						label="Pie chart height in Quick Access Menu"
						description="Height is in pixels."
					>
						<Dropdown
							selectedOption={current?.pieViewQAMHeight}
							rgOptions={PIE_VIEW_QAM_HEIGHT_OPTIONS}
							onChange={(v) => {
								current.pieViewQAMHeight = v.data;
								updateSettings();
							}}
						/>
					</Field>
				</PanelSectionRow>
			</PanelSection>

			<PanelSection title="Detailed Report">
				<PanelSectionRow>
					<Field label="Covers size scale">
						<Dropdown
							selectedOption={+current?.coverScale.toPrecision(2)}
							rgOptions={SCALE_OPTIONS.map((scale) => ({
								label: `${scale}`,
								data: scale,
							}))}
							onChange={(v) => {
								current.coverScale = v.data;
								updateSettings();
							}}
						/>
					</Field>
				</PanelSectionRow>
			</PanelSection>

			<PanelSection title="Non-steam games">
				<Field label="Automatically detect game by checksum [Work in Progress]">
					<Dropdown
						selectedOption={current?.isEnabledDetectionOfGamesByFileChecksum}
						rgOptions={[
							{
								label: "No",
								data: false,
							},
							{
								label: "Yes",
								data: true,
							},
						]}
						onChange={(v) => {
							current.isEnabledDetectionOfGamesByFileChecksum = v.data;

							if (!v.data) {
								$gameCheksumsLoadingState.set("empty");
							}

							settings
								.save({
									...current,
									isEnabledDetectionOfGamesByFileChecksum: v.data,
								})
								.then(() => {
									setCurrentSettings((value) => ({
										...value,
										isEnabledDetectionOfGamesByFileChecksum: v.data,
									}));
								});
						}}
					/>
				</Field>
			</PanelSection>

			<PanelSection title="Notifications">
				<PanelSectionRow>
					<Field label="Remind me to take breaks">
						<Dropdown
							selectedOption={current.reminderToTakeBreaksInterval}
							rgOptions={[
								{ label: "Never", data: -1 },
								{ label: "Every 15 min", data: 15 },
								{ label: "Every 30 min", data: 30 },
								{ label: "Every hour", data: 60 },
								{ label: "Every 2 hours", data: 120 },
							]}
							onChange={(v) => {
								current.reminderToTakeBreaksInterval = v.data;
								updateSettings();
							}}
						/>
					</Field>
				</PanelSectionRow>
			</PanelSection>

			<PanelSection title="Support">
				<PanelSectionRow>
					<Field
						label="Show Ko-fi button in Quick Access Menu"
						description="Display a support button in the main plugin panel. Any support is appreciated! It helps keep development going."
					>
						<Dropdown
							selectedOption={current?.showKofiInQAM}
							rgOptions={[
								{ label: "Yes", data: true },
								{ label: "No", data: false },
							]}
							onChange={(v) => {
								current.showKofiInQAM = v.data;
								updateSettings();
							}}
						/>
					</Field>
				</PanelSectionRow>
			</PanelSection>
		</>
	);
};

const TimeManipulation = () => {
	return (
		<div>
			<PanelSection title="Change overall play time">
				<PanelSectionRow>
					<ButtonItem onClick={() => navigateToPage(MANUALLY_ADJUST_TIME)}>
						Change
					</ButtonItem>
				</PanelSectionRow>
			</PanelSection>
		</div>
	);
};

function GeneralIcon() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" fill="none">
			<title>General Icon</title>

			<path
				d="M33 20.38V15.62L29.07 14.9C28.8121 14.015 28.453 13.1628 28 12.36L30.27 9.08L26.92 5.71L23.64 8C22.8372 7.54696 21.985 7.18793 21.1 6.93L20.38 3H15.62L14.9 6.93C14.015 7.18793 13.1628 7.54696 12.36 8L9.08 5.71L5.71 9.08L8 12.36C7.54696 13.1628 7.18793 14.015 6.93 14.9L3 15.62V20.38L6.93 21.1C7.18793 21.985 7.54696 22.8372 8 23.64L5.71 26.92L9.08 30.29L12.36 28C13.1637 28.4461 14.0159 28.7984 14.9 29.05L15.62 33H20.38L21.1 29.07C21.985 28.8121 22.8372 28.453 23.64 28L26.92 30.27L30.29 26.9L28 23.64C28.4461 22.8363 28.7984 21.9841 29.05 21.1L33 20.38ZM18 23C17.0111 23 16.0444 22.7068 15.2221 22.1573C14.3999 21.6079 13.759 20.827 13.3806 19.9134C13.0022 18.9998 12.9031 17.9945 13.0961 17.0245C13.289 16.0546 13.7652 15.1637 14.4645 14.4645C15.1637 13.7652 16.0546 13.289 17.0245 13.0961C17.9945 12.9031 18.9998 13.0022 19.9134 13.3806C20.827 13.759 21.6079 14.3999 22.1573 15.2221C22.7068 16.0444 23 17.0111 23 18C23 18.6566 22.8707 19.3068 22.6194 19.9134C22.3681 20.52 21.9998 21.0712 21.5355 21.5355C21.0712 21.9998 20.52 22.3681 19.9134 22.6194C19.3068 22.8707 18.6566 23 18 23Z"
				fill="currentColor"
			/>
		</svg>
	);
}

const CHANGELOG_URL = `${GITHUB_URL}/blob/master/CHANGELOG.md`;

const linkButtonStyle = {
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	gap: "8px",
	padding: "10px 16px",
	minWidth: "100%",
};

const AboutSection = () => {
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
			<PanelSection title="PlayTime">
				<div
					style={{
						padding: "8px 0",
						color: "#dcdedf",
						fontSize: "13px",
						lineHeight: "1.5",
					}}
				>
					<p style={{ margin: 0, color: "#8b929a", textAlign: "center" }}>
						With{" "}
						<FaHeart style={{ color: "#ff6b6b", verticalAlign: "middle" }} /> by
						ynhhoJ
					</p>
				</div>
			</PanelSection>

			<PanelSection title="Links">
				<PanelSectionRow>
					<DialogButton
						style={linkButtonStyle}
						onClick={() => Navigation.NavigateToExternalWeb(GITHUB_URL)}
					>
						<FaGithub size={18} />
						GitHub Repository
					</DialogButton>
				</PanelSectionRow>

				<PanelSectionRow>
					<DialogButton
						style={{ ...linkButtonStyle, marginTop: "0.5rem" }}
						onClick={() => Navigation.NavigateToExternalWeb(CHANGELOG_URL)}
					>
						<BsInfoCircle size={16} />
						View Changelog
					</DialogButton>
				</PanelSectionRow>
			</PanelSection>

			<PanelSection title="Support">
				<PanelSectionRow>
					<DialogButton
						className="kofi-button"
						style={{
							...linkButtonStyle,
							background: "linear-gradient(135deg, #ff5e5b 0%, #ff9966 100%)",
						}}
						onClick={() => Navigation.NavigateToExternalWeb(KOFI_URL)}
					>
						<SiKofi size={18} />
						Support on Ko-fi
					</DialogButton>
				</PanelSectionRow>

				<div
					style={{
						padding: "8px 0",
						color: "#8b929a",
						fontSize: "12px",
						textAlign: "center",
					}}
				>
					If you enjoy this plugin, consider buying me a coffee! ☕
				</div>
			</PanelSection>
		</div>
	);
};

export function SettingsPage() {
	const { currentSettings: settings } = useLocator();

	const pages: Array<SidebarNavigationPage | "separator"> = [
		{
			title: "General",
			icon: <GeneralIcon />,
			content: (
				<Tab>
					<GeneralSettings />
				</Tab>
			),
		},
		{
			title: "Game Management",
			icon: <IoMdOptions />,
			content: (
				<Tab>
					<PanelSection title="Game Tracking Status">
						<PanelSectionRow>
							<ButtonItem onClick={() => navigateToPage(TRACKING_LIST_ROUTE)}>
								Manage Tracking Status
							</ButtonItem>
						</PanelSectionRow>
						<div
							style={{
								padding: "8px 0",
								color: "#8b929a",
								fontSize: "12px",
							}}
						>
							Control which games are tracked and shown in statistics.
						</div>
					</PanelSection>

					<PanelSection title="Game Associations">
						<PanelSectionRow>
							<ButtonItem
								onClick={() => navigateToPage(ASSOCIATION_LIST_ROUTE)}
							>
								Manage Game Associations
							</ButtonItem>
						</PanelSectionRow>
						<div
							style={{
								padding: "8px 0",
								color: "#8b929a",
								fontSize: "12px",
							}}
						>
							Associate games to combine their playtime statistics. Useful for
							games that have multiple versions or platforms.
						</div>
					</PanelSection>
				</Tab>
			),
		},
		{
			title: "Time manipulation",
			icon: <MdModeEdit />,
			content: (
				<Tab>
					<TimeManipulation />
				</Tab>
			),
		},
	];

	if (settings.isEnabledDetectionOfGamesByFileChecksum) {
		pages.push({
			title: (
				<span style={{ display: "flex", alignItems: "center" }}>
					Files checksum
					<span
						style={{
							fontSize: "8px",
							fontWeight: 500,
							marginLeft: "4px",
							color: "#ff6467",
						}}
					>
						BETA
					</span>
				</span>
			),
			icon: <BsFileBinary />,
			content: (
				<Tab>
					<FileChecksum />
				</Tab>
			),
		});
	}

	const replayYear = getDefaultReplayYear();
	const availableYears = getAvailableReplayYears();

	pages.push({
		title: "Annual Replay",
		icon: <FaCalendarAlt />,
		content: (
			<Tab>
				<PanelSection>
					{availableYears.length > 0 ? (
						availableYears.map((year) => (
							<PanelSectionRow key={year}>
								<ButtonItem onClick={() => navigateToReplay(year)}>
									View Replay {year}
									{year === replayYear && " (Latest)"}
								</ButtonItem>
							</PanelSectionRow>
						))
					) : (
						<PanelSectionRow>
							<div style={{ padding: "8px 0", color: "#8b929a" }}>
								No replay data available yet. Play some games! :-)
							</div>
						</PanelSectionRow>
					)}
				</PanelSection>
			</Tab>
		),
	});

	pages.push({
		title: "About",
		icon: <BsInfoCircle />,
		content: (
			<Tab>
				<AboutSection />
			</Tab>
		),
	});

	return <SidebarNavigation pages={pages} />;
}
