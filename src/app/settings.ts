import { isEqual, isPlainObject, merge } from "es-toolkit";
import logger from "@src/utils/logger";
import { SortBy, type SortByKeys, type SortByObjectKeys } from "./sortPlayTime";

/** Limit options for PieView games display. -1 means "All" */
export type PieViewGamesLimit = 5 | 10 | 15 | 25 | 50 | 100 | -1;

/** Height options for PieView in Quick Access Menu */
export type PieViewQAMHeight = 200 | 250 | 300;

/** First day of the week: 0 = Sunday, 1 = Monday */
export type WeekStartDay = 0 | 1;

/** Color swatch options from node-vibrant */
export type VibrantSwatch =
	| "Vibrant"
	| "DarkVibrant"
	| "LightVibrant"
	| "Muted"
	| "DarkMuted"
	| "LightMuted";

/** Chart legend display options */
export type ChartLegendDisplay = "none" | "pie" | "bar" | "both";

export interface PlayTimeSettings {
	settingsVersion: number;
	gameChartStyle: ChartStyle;
	reminderToTakeBreaksInterval: number;
	displayTime: {
		showSeconds: boolean;
		/**
		 * When `false` time will be shown as `2d 2h`
		 * When `true` time will be shown as `50h` (`48h` + `2h`)
		 */
		showTimeInHours: boolean;
	};
	coverScale: number;
	selectedSortByOption: SortByKeys;
	isEnabledDetectionOfGamesByFileChecksum: boolean;
	/** When true, MonthView shows stacked bars per game; otherwise shows aggregated bars */
	isStackedBarsPerGameEnabled: boolean;
	/** Maximum number of games to display in PieView. -1 means show all */
	pieViewGamesLimit: PieViewGamesLimit;
	/** Which color swatch to use from game cover images */
	chartColorSwatch: VibrantSwatch;
	/** Whether to show the Ko-fi support button in Quick Access Menu */
	showKofiInQAM: boolean;
	/** Which charts should display legends */
	chartLegendDisplay: ChartLegendDisplay;
	/** Height of PieView chart in Quick Access Menu (in pixels) */
	pieViewQAMHeight: PieViewQAMHeight;
	/** First day of the week: 0 = Sunday, 1 = Monday */
	weekStartsOn: WeekStartDay;
	/** Last version seen by the user (for showing changelog after updates) */
	lastSeenVersion?: string;
}

export enum ChartStyle {
	PIE_AND_BARS = 0,
	BAR = 1,
}

const PLAY_TIME_SETTINGS_KEY = "decky-loader-SDH-Playtime";

export const CURRENT_SETTINGS_VERSION = 1;

/** Current plugin version from package.json (injected at build time) */
declare const __PLUGIN_VERSION__: string;
export const PLUGIN_VERSION = __PLUGIN_VERSION__;

function createDefaultSettings(): PlayTimeSettings {
	return {
		settingsVersion: CURRENT_SETTINGS_VERSION,
		gameChartStyle: ChartStyle.BAR,
		reminderToTakeBreaksInterval: -1,
		displayTime: {
			showTimeInHours: true,
			showSeconds: false,
		},
		coverScale: 1,
		selectedSortByOption: "mostPlayed",
		isEnabledDetectionOfGamesByFileChecksum: false,
		isStackedBarsPerGameEnabled: false,
		pieViewGamesLimit: -1,
		chartColorSwatch: "Vibrant",
		showKofiInQAM: true,
		chartLegendDisplay: "none",
		pieViewQAMHeight: 300,
		weekStartsOn: 1,
		lastSeenVersion: "",
	};
}

export const DEFAULTS: PlayTimeSettings = createDefaultSettings();

type UnknownRecord = Record<string, unknown>;

const migrations: Record<number, (settings: UnknownRecord) => UnknownRecord> = {
	0: (settings) => ({
		...settings,
		settingsVersion: 1,
	}),
};

const pieViewGamesLimits: readonly PieViewGamesLimit[] = [
	5, 10, 15, 25, 50, 100, -1,
];
const vibrantSwatches: readonly VibrantSwatch[] = [
	"Vibrant",
	"DarkVibrant",
	"LightVibrant",
	"Muted",
	"DarkMuted",
	"LightMuted",
];
const chartLegendDisplays: readonly ChartLegendDisplay[] = [
	"none",
	"pie",
	"bar",
	"both",
];
const pieViewQAMHeights: readonly PieViewQAMHeight[] = [200, 250, 300];
const weekStartDays: readonly WeekStartDay[] = [0, 1];
const breakIntervals = [-1, 15, 30, 60, 120] as const;
const sortByKeys = (Object.keys(SortBy) as Array<SortByObjectKeys>).map(
	(key) => SortBy[key].key,
);

function parseSettings(value: unknown): unknown {
	if (typeof value !== "string") return value;

	try {
		return JSON.parse(value) as unknown;
	} catch {
		return undefined;
	}
}

function toFiniteNumber(value: unknown): number | undefined {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value !== "string" || value.trim() === "") return undefined;

	const number = Number(value);
	return Number.isFinite(number) ? number : undefined;
}

function toBoolean(value: unknown): boolean | undefined {
	if (typeof value === "boolean") return value;
	if (value === 1 || value === "1" || value === "true") return true;
	if (value === 0 || value === "0" || value === "false") return false;
	return undefined;
}

function oneOf<T>(value: unknown, options: readonly T[], fallback: T): T {
	return options.includes(value as T) ? (value as T) : fallback;
}

function migrateSettings(value: unknown): UnknownRecord {
	let settings: UnknownRecord = isPlainObject(value) ? { ...value } : {};
	const storedVersion = toFiniteNumber(settings.settingsVersion);
	let version =
		storedVersion !== undefined &&
		Number.isInteger(storedVersion) &&
		storedVersion >= 0 &&
		storedVersion <= CURRENT_SETTINGS_VERSION
			? storedVersion
			: 0;

	while (version < CURRENT_SETTINGS_VERSION) {
		settings = migrations[version](settings);
		version += 1;
	}

	return settings;
}

function normalizeSettings(value: unknown): PlayTimeSettings {
	const defaults = createDefaultSettings();
	const migrated = migrateSettings(value);
	const merged: UnknownRecord = merge(createDefaultSettings(), migrated);
	const displayTime = isPlainObject(merged.displayTime)
		? merged.displayTime
		: defaults.displayTime;
	const coverScale = toFiniteNumber(merged.coverScale);
	const gameChartStyle = toFiniteNumber(merged.gameChartStyle);
	const reminderInterval = toFiniteNumber(merged.reminderToTakeBreaksInterval);

	return {
		settingsVersion: CURRENT_SETTINGS_VERSION,
		gameChartStyle: oneOf(
			gameChartStyle,
			[ChartStyle.PIE_AND_BARS, ChartStyle.BAR],
			defaults.gameChartStyle,
		),
		reminderToTakeBreaksInterval: oneOf(
			reminderInterval,
			breakIntervals,
			defaults.reminderToTakeBreaksInterval,
		),
		displayTime: {
			showTimeInHours:
				toBoolean(displayTime.showTimeInHours) ??
				defaults.displayTime.showTimeInHours,
			showSeconds:
				toBoolean(displayTime.showSeconds) ?? defaults.displayTime.showSeconds,
		},
		coverScale:
			coverScale !== undefined && coverScale >= 0.5 && coverScale <= 2
				? coverScale
				: defaults.coverScale,
		selectedSortByOption: oneOf(
			merged.selectedSortByOption,
			sortByKeys,
			defaults.selectedSortByOption,
		),
		isEnabledDetectionOfGamesByFileChecksum:
			toBoolean(merged.isEnabledDetectionOfGamesByFileChecksum) ??
			defaults.isEnabledDetectionOfGamesByFileChecksum,
		isStackedBarsPerGameEnabled:
			toBoolean(merged.isStackedBarsPerGameEnabled) ??
			defaults.isStackedBarsPerGameEnabled,
		pieViewGamesLimit: oneOf(
			toFiniteNumber(merged.pieViewGamesLimit),
			pieViewGamesLimits,
			defaults.pieViewGamesLimit,
		),
		chartColorSwatch: oneOf(
			merged.chartColorSwatch,
			vibrantSwatches,
			defaults.chartColorSwatch,
		),
		showKofiInQAM: toBoolean(merged.showKofiInQAM) ?? defaults.showKofiInQAM,
		chartLegendDisplay: oneOf(
			merged.chartLegendDisplay,
			chartLegendDisplays,
			defaults.chartLegendDisplay,
		),
		pieViewQAMHeight: oneOf(
			toFiniteNumber(merged.pieViewQAMHeight),
			pieViewQAMHeights,
			defaults.pieViewQAMHeight,
		),
		weekStartsOn: oneOf(
			toFiniteNumber(merged.weekStartsOn),
			weekStartDays,
			defaults.weekStartsOn,
		),
		lastSeenVersion:
			typeof merged.lastSeenVersion === "string"
				? merged.lastSeenVersion
				: defaults.lastSeenVersion,
	};
}

function toStoredSettings(settings: PlayTimeSettings): UnknownRecord {
	return {
		...settings,
		coverScale: `${settings.coverScale}`,
		displayTime: {
			showTimeInHours: +settings.displayTime.showTimeInHours,
			showSeconds: +settings.displayTime.showSeconds,
		},
		isEnabledDetectionOfGamesByFileChecksum:
			+settings.isEnabledDetectionOfGamesByFileChecksum,
		isStackedBarsPerGameEnabled: +settings.isStackedBarsPerGameEnabled,
		showKofiInQAM: +settings.showKofiInQAM,
	};
}

export class Settings {
	private readonly initialization: Promise<void>;

	constructor() {
		this.initialization = this.normalizeStoredSettings()
			.then(() => undefined)
			.catch((error: unknown) => {
				logger.error("Unable to normalize settings", error);
			});
	}

	private async normalizeStoredSettings(): Promise<PlayTimeSettings> {
		let raw: unknown;
		try {
			raw = await SteamClient.Storage.GetJSON(PLAY_TIME_SETTINGS_KEY);
		} catch (error) {
			if (error instanceof Error && error.message === "Not found") {
				const defaults = createDefaultSettings();

				await SteamClient.Storage.SetObject(
					PLAY_TIME_SETTINGS_KEY,
					toStoredSettings(defaults),
				);

				return defaults;
			}
			throw error;
		}

		const parsed = parseSettings(raw);
		const normalized = normalizeSettings(parsed);
		const stored = toStoredSettings(normalized);

		if (!isEqual(parsed, stored)) {
			await SteamClient.Storage.SetObject(PLAY_TIME_SETTINGS_KEY, stored);
		}

		return normalized;
	}

	async get(): Promise<PlayTimeSettings> {
		await this.initialization;

		const settings = await this.normalizeStoredSettings();

		return {
			...settings,
			displayTime: { ...settings.displayTime },
		};
	}

	async isVersionNew(): Promise<boolean> {
		const settings = await this.get();
		const lastSeenVersion = settings.lastSeenVersion;

		if (!lastSeenVersion || lastSeenVersion.length === 0) {
			return true;
		}

		return lastSeenVersion !== PLUGIN_VERSION;
	}

	async markVersionAsSeen(): Promise<void> {
		const settings = await this.get();

		await this.save({
			...settings,
			lastSeenVersion: PLUGIN_VERSION,
		});
	}

	async save(data: PlayTimeSettings): Promise<void> {
		await this.initialization;

		const normalized = normalizeSettings(data);

		await SteamClient.Storage.SetObject(
			PLAY_TIME_SETTINGS_KEY,
			toStoredSettings(normalized),
		);
	}
}
