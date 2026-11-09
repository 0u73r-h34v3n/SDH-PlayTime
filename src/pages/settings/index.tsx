import {
	ButtonItem,
	DialogButton,
	Dropdown,
	Field,
	Focusable,
	PanelSection,
	PanelSectionRow,
	SidebarNavigation,
	type SidebarNavigationPage,
} from "@decky/ui";
import { $gameChecksumsLoadingState } from "@src/stores/games";
import { useEffect, useRef, useState } from "react";
import { MdModeEdit } from "react-icons/md";
import {
	ChartStyle,
	DEFAULTS,
	type ChartLegendDisplay,
	type PieViewGamesLimit,
	type PieViewQAMHeight,
	type PlayTimeSettings,
	type VibrantSwatch,
	type WeekStartDay,
} from "@src/app/settings";
import { Tab } from "@src/components/Tab";
import { useLocator } from "@src/locator";
import { FileChecksum } from "./checksums";
import {
	MANUALLY_ADJUST_TIME,
	navigateToPage,
	navigateToExternalWeb,
	TRACKING_LIST_ROUTE,
	ASSOCIATION_LIST_ROUTE,
} from "@src/pages/navigation";
import { BsFileBinary, BsInfoCircle } from "react-icons/bs";
import { FaGithub, FaHeart, FaCalendarAlt } from "react-icons/fa";
import { HiQrCode } from "react-icons/hi2";
import { IoMdOptions } from "react-icons/io";
import { SiKofi } from "react-icons/si";
import { GITHUB_URL, KOFI_URL } from "@src/components/SupportBanner";
import showKofiQrModal from "@src/utils/showKofiQrModal";
import { navigateToReplay } from "@src/pages/navigation";
import {
	getDefaultReplayYear,
	getAvailableReplayYears,
} from "@src/app/replay.constants";
import logger from "@src/utils/logger";
import { t } from "@src/i18n";

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
	{ label: t("common.all"), data: -1 },
];

const COLOR_SWATCH_OPTIONS: Array<{ label: string; data: VibrantSwatch }> = [
	{ label: t("settings.colorStyleVibrant"), data: "Vibrant" },
	{ label: t("settings.colorStyleDarkVibrant"), data: "DarkVibrant" },
	{ label: t("settings.colorStyleLightVibrant"), data: "LightVibrant" },
	{ label: t("settings.colorStyleMuted"), data: "Muted" },
	{ label: t("settings.colorStyleDarkMuted"), data: "DarkMuted" },
	{ label: t("settings.colorStyleLightMuted"), data: "LightMuted" },
];

const LEGEND_DISPLAY_OPTIONS: Array<{
	label: string;
	data: ChartLegendDisplay;
}> = [
	{ label: t("settings.legendNone"), data: "none" },
	{ label: t("settings.legendPieOnly"), data: "pie" },
	{ label: t("settings.legendBarOnly"), data: "bar" },
	{ label: t("settings.legendBoth"), data: "both" },
];

const PIE_VIEW_QAM_HEIGHT_OPTIONS: Array<{
	label: string;
	data: PieViewQAMHeight;
}> = [
	{ label: "300px", data: 300 },
	{ label: "250px", data: 250 },
	{ label: "200px", data: 200 },
];

const WEEK_START_DAY_OPTIONS: Array<{
	label: string;
	data: WeekStartDay;
}> = [
	{ label: t("settings.weekdayMonday"), data: 1 },
	{ label: t("settings.weekdaySunday"), data: 0 },
];

const GeneralSettings = () => {
	const { settings, setCurrentSettings } = useLocator();
	const [current, setCurrent] = useState<PlayTimeSettings>(DEFAULTS);
	const [loaded, setLoaded] = useState<boolean>(false);
	const shouldSaveSettings = useRef(false);
	const saveQueue = useRef(Promise.resolve());

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

	const updateSettings = (
		update: (previous: PlayTimeSettings) => PlayTimeSettings,
	) => {
		shouldSaveSettings.current = true;
		setCurrent((previous) => update(previous));
	};

	useEffect(() => {
		if (!shouldSaveSettings.current) {
			return;
		}

		shouldSaveSettings.current = false;
		const updated = current;

		saveQueue.current = saveQueue.current.then(async () => {
			try {
				await settings.save(updated);

				setCurrentSettings(updated);
			} catch (error) {
				logger.error("Unable to save settings", error);
			}
		});
	}, [current, settings, setCurrentSettings]);

	if (!loaded) {
		return null;
	}

	return (
		<>
			<PanelSection title={t("settings.timeDisplay")}>
				<PanelSectionRow>
					<Field label={t("settings.displayPlayedTimeIn")}>
						<Dropdown
							selectedOption={current?.displayTime.showTimeInHours}
							rgOptions={[
								{
									label: t("stats.days"),
									data: false,
								},
								{
									label: t("stats.hours"),
									data: true,
								},
							]}
							onChange={(v) => {
								updateSettings((previous) => ({
									...previous,
									displayTime: {
										...previous.displayTime,
										showTimeInHours: v.data,
									},
								}));
							}}
						/>
					</Field>

					<Field label={t("settings.showSeconds")}>
						<Dropdown
							selectedOption={current?.displayTime.showSeconds}
							rgOptions={[
								{
									label: t("common.no"),
									data: false,
								},
								{
									label: t("common.yes"),
									data: true,
								},
							]}
							onChange={(v) => {
								updateSettings((previous) => ({
									...previous,
									displayTime: {
										...previous.displayTime,
										showSeconds: v.data,
									},
								}));
							}}
						/>
					</Field>
				</PanelSectionRow>
			</PanelSection>

			<PanelSection title={t("settings.charts")}>
				<PanelSectionRow>
					<Field label={t("settings.chartType")}>
						<Dropdown
							selectedOption={current?.gameChartStyle}
							rgOptions={[
								{
									label: t("settings.barCharts"),
									data: ChartStyle.BAR,
								},
								{
									label: t("settings.barAndPieCharts"),
									data: ChartStyle.PIE_AND_BARS,
								},
							]}
							onChange={(v) => {
								updateSettings((previous) => ({
									...previous,
									gameChartStyle: v.data,
								}));
							}}
						/>
					</Field>

					<Field
						label={t("settings.stackedBarsPerGame")}
						description={t("settings.stackedBarsDescription")}
					>
						<Dropdown
							selectedOption={current?.isStackedBarsPerGameEnabled}
							rgOptions={[
								{
									label: t("common.no"),
									data: false,
								},
								{
									label: t("common.yes"),
									data: true,
								},
							]}
							onChange={(v) => {
								updateSettings((previous) => ({
									...previous,
									isStackedBarsPerGameEnabled: v.data,
								}));
							}}
						/>
					</Field>

					{current?.isStackedBarsPerGameEnabled && (
						<Field
							label={t("settings.chartColorStyle")}
							description={t("settings.chartColorStyleDescription")}
						>
							<Dropdown
								selectedOption={current?.chartColorSwatch}
								rgOptions={COLOR_SWATCH_OPTIONS}
								onChange={(v) => {
									updateSettings((previous) => ({
										...previous,
										chartColorSwatch: v.data,
									}));
								}}
							/>
						</Field>
					)}

					<Field label={t("settings.pieChartGamesLimit")}>
						<Dropdown
							selectedOption={current?.pieViewGamesLimit}
							rgOptions={PIE_VIEW_LIMIT_OPTIONS}
							onChange={(v) => {
								updateSettings((previous) => ({
									...previous,
									pieViewGamesLimit: v.data,
								}));
							}}
						/>
					</Field>

					<Field
						label={t("settings.showChartLegend")}
						description={t("settings.showChartLegendDescription")}
					>
						<Dropdown
							selectedOption={current?.chartLegendDisplay}
							rgOptions={LEGEND_DISPLAY_OPTIONS}
							onChange={(v) => {
								updateSettings((previous) => ({
									...previous,
									chartLegendDisplay: v.data,
								}));
							}}
						/>
					</Field>

					<Field
						label={t("settings.pieChartHeightQam")}
						description={t("settings.pieChartHeightDescription")}
					>
						<Dropdown
							selectedOption={current?.pieViewQAMHeight}
							rgOptions={PIE_VIEW_QAM_HEIGHT_OPTIONS}
							onChange={(v) => {
								updateSettings((previous) => ({
									...previous,
									pieViewQAMHeight: v.data,
								}));
							}}
						/>
					</Field>

					<Field
						label={t("settings.weekStartsOn")}
						description={t("settings.weekStartsOnDescription")}
					>
						<Dropdown
							selectedOption={current?.weekStartsOn}
							rgOptions={WEEK_START_DAY_OPTIONS}
							onChange={(v) => {
								updateSettings((previous) => ({
									...previous,
									weekStartsOn: v.data,
								}));
							}}
						/>
					</Field>
				</PanelSectionRow>
			</PanelSection>

			<PanelSection title={t("settings.detailedReport")}>
				<PanelSectionRow>
					<Field label={t("settings.coversSizeScale")}>
						<Dropdown
							selectedOption={+current?.coverScale.toPrecision(2)}
							rgOptions={SCALE_OPTIONS.map((scale) => ({
								label: `${scale}`,
								data: scale,
							}))}
							onChange={(v) => {
								updateSettings((previous) => ({
									...previous,
									coverScale: v.data,
								}));
							}}
						/>
					</Field>
				</PanelSectionRow>
			</PanelSection>

			<PanelSection title={t("settings.nonSteamGames")}>
				<Field label={t("settings.autoDetectByChecksum")}>
					<Dropdown
						selectedOption={current?.isEnabledDetectionOfGamesByFileChecksum}
						rgOptions={[
							{
								label: t("common.no"),
								data: false,
							},
							{
								label: t("common.yes"),
								data: true,
							},
						]}
						onChange={(v) => {
							if (!v.data) {
								$gameChecksumsLoadingState.set("empty");
							}

							updateSettings((previous) => ({
								...previous,
								isEnabledDetectionOfGamesByFileChecksum: v.data,
							}));
						}}
					/>
				</Field>
			</PanelSection>

			<PanelSection title={t("settings.notifications")}>
				<PanelSectionRow>
					<Field label={t("settings.remindBreaks")}>
						<Dropdown
							selectedOption={current.reminderToTakeBreaksInterval}
							rgOptions={[
								{ label: t("settings.never"), data: -1 },
								{ label: t("settings.every15min"), data: 15 },
								{ label: t("settings.every30min"), data: 30 },
								{ label: t("settings.everyHour"), data: 60 },
								{ label: t("settings.every2hours"), data: 120 },
							]}
							onChange={(v) => {
								updateSettings((previous) => ({
									...previous,
									reminderToTakeBreaksInterval: v.data,
								}));
							}}
						/>
					</Field>
				</PanelSectionRow>
			</PanelSection>

			<PanelSection title={t("settings.support")}>
				<PanelSectionRow>
					<Field
						label={t("settings.showKofiQam")}
						description={t("settings.showKofiQamDescription")}
					>
						<Dropdown
							selectedOption={current?.showKofiInQAM}
							rgOptions={[
								{ label: t("common.yes"), data: true },
								{ label: t("common.no"), data: false },
							]}
							onChange={(v) => {
								updateSettings((previous) => ({
									...previous,
									showKofiInQAM: v.data,
								}));
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
			<PanelSection title={t("settings.changeOverallPlayTime")}>
				<PanelSectionRow>
					<ButtonItem onClick={() => navigateToPage(MANUALLY_ADJUST_TIME)}>
						{t("settings.change")}
					</ButtonItem>
				</PanelSectionRow>
			</PanelSection>
		</div>
	);
};

function GeneralIcon() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" fill="none">
			<title>{t("settings.generalIcon")}</title>

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
						{t("settings.madeWith")}{" "}
						<FaHeart style={{ color: "#ff6b6b", verticalAlign: "middle" }} />{" "}
						{t("settings.madeBy")} ynhhoJ
					</p>
				</div>
			</PanelSection>

			<PanelSection title={t("settings.links")}>
				<PanelSectionRow>
					<DialogButton
						style={linkButtonStyle}
						onClick={() => navigateToExternalWeb(GITHUB_URL)}
					>
						<FaGithub size={18} />
						{t("settings.githubRepo")}
					</DialogButton>
				</PanelSectionRow>

				<PanelSectionRow>
					<DialogButton
						style={{ ...linkButtonStyle, marginTop: "0.5rem" }}
						onClick={() => navigateToExternalWeb(CHANGELOG_URL)}
					>
						<BsInfoCircle size={16} />
						{t("common.viewChangelog")}
					</DialogButton>
				</PanelSectionRow>
			</PanelSection>

			<PanelSection title={t("settings.supporters")}>
				<div
					style={{
						padding: "8px 0",
						color: "#dcdedf",
						fontSize: "13px",
						lineHeight: "1.8",
						textAlign: "center",
					}}
				>
					<p
						style={{
							margin: "0 0 8px 0",
							color: "#8b929a",
							fontSize: "12px",
						}}
					>
						{t("settings.thanks")}
					</p>
					{[
						"basti",
						"mindxpert",
						"he",
						"techenthsiast99",
						"Vigz",
						"Ray",
						"MightyWolf_",
						"Somebody",
						"Blake Polzer",
						"Reusable-Box",
						"retroshelf.org",
						"burritobob",
					].map((name, i, arr) => (
						<span key={name}>
							<span style={{ color: "#ff9966", fontWeight: 500 }}>{name}</span>
							{i < arr.length - 1 && (
								<span style={{ color: "#8b929a" }}> · </span>
							)}
						</span>
					))}
				</div>
			</PanelSection>

			<PanelSection title={t("settings.support")}>
				<PanelSectionRow>
					<Focusable style={{ display: "flex" }}>
						<DialogButton
							className="kofi-button"
							style={{
								...linkButtonStyle,
								background: "linear-gradient(135deg, #ff5e5b 0%, #ff9966 100%)",
							}}
							onClick={() => navigateToExternalWeb(KOFI_URL)}
							onSecondaryButton={() => showKofiQrModal()}
							onSecondaryActionDescription={t("common.showQrCode")}
						>
							<SiKofi size={18} />
							{t("common.supportOnKofi")}
						</DialogButton>

						<DialogButton
							onClick={() => showKofiQrModal()}
							style={{
								display: "flex",
								justifyContent: "center",
								alignItems: "center",
								padding: "10px",
								maxWidth: "40px",
								minWidth: "auto",
								marginLeft: "0.5rem",
							}}
						>
							<HiQrCode />
						</DialogButton>
					</Focusable>
				</PanelSectionRow>

				<div
					style={{
						padding: "8px 0",
						color: "#8b929a",
						fontSize: "12px",
						textAlign: "center",
					}}
				>
					{t("settings.enjoyCoffee")}
				</div>
			</PanelSection>
		</div>
	);
};

export function SettingsPage() {
	const { currentSettings: settings } = useLocator();

	const pages: Array<SidebarNavigationPage | "separator"> = [
		{
			title: t("settings.general"),
			icon: <GeneralIcon />,
			content: (
				<Tab>
					<GeneralSettings />
				</Tab>
			),
		},
		{
			title: t("settings.gameManagement"),
			icon: <IoMdOptions />,
			content: (
				// @ts-expect-error Ignore ts for now
				<Tab>
					<PanelSection title={t("settings.gameTrackingStatus")}>
						<PanelSectionRow>
							<ButtonItem onClick={() => navigateToPage(TRACKING_LIST_ROUTE)}>
								{t("settings.manageTrackingStatus")}
							</ButtonItem>
						</PanelSectionRow>
						<div
							style={{
								padding: "8px 0",
								color: "#8b929a",
								fontSize: "12px",
							}}
						>
							{t("settings.controlTrackedGames")}
						</div>
					</PanelSection>

					<PanelSection title={t("settings.gameAssociations")}>
						<PanelSectionRow>
							<ButtonItem
								onClick={() => navigateToPage(ASSOCIATION_LIST_ROUTE)}
							>
								{t("settings.manageGameAssociations")}
							</ButtonItem>
						</PanelSectionRow>
						<div
							style={{
								padding: "8px 0",
								color: "#8b929a",
								fontSize: "12px",
							}}
						>
							{t("settings.gameAssociationsDescription")}
						</div>
					</PanelSection>
				</Tab>
			),
		},
		{
			title: t("settings.timeManipulation"),
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
					{t("settings.filesChecksum")}
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
		title: t("settings.annualReplay"),
		icon: <FaCalendarAlt />,
		content: (
			<Tab>
				<PanelSection>
					{availableYears.length > 0 ? (
						availableYears.map((year) => (
							<PanelSectionRow key={year}>
								<ButtonItem onClick={() => navigateToReplay(year)}>
									{t("settings.viewReplay", { year })}
									{year === replayYear && t("settings.latest")}
								</ButtonItem>
							</PanelSectionRow>
						))
					) : (
						<PanelSectionRow>
							<div style={{ padding: "8px 0", color: "#8b929a" }}>
								{t("settings.noReplayData")}
							</div>
						</PanelSectionRow>
					)}
				</PanelSection>
			</Tab>
		),
	});

	pages.push({
		title: t("settings.about"),
		icon: <BsInfoCircle />,
		content: (
			<Tab>
				<AboutSection />
			</Tab>
		),
	});

	return <SidebarNavigation pages={pages} />;
}
