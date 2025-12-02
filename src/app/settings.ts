import { isNil } from "@src/utils/isNil";
import logger from "@src/utils/logger";
import { SortBy, type SortByKeys, type SortByObjectKeys } from "./sortPlayTime";

/** Limit options for PieView games display. -1 means "All" */
export type PieViewGamesLimit = 5 | 10 | 15 | 25 | 50 | 100 | -1;

/** Height options for PieView in Quick Access Menu */
export type PieViewQAMHeight = 200 | 250 | 300;

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
}

export enum ChartStyle {
	PIE_AND_BARS = 0,
	BAR = 1,
}

const PLAY_TIME_SETTINGS_KEY = "decky-loader-SDH-Playtime";

export const DEFAULTS: PlayTimeSettings = {
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
};

export class Settings {
	constructor() {
		SteamClient.Storage.GetJSON(PLAY_TIME_SETTINGS_KEY)
			.then(async (json) => {
				const parsedJson = JSON.parse(json) as PlayTimeSettings;

				// TODO(ynhhoJ): Instead of multiple methods, we should modify everythin in `batch` by
				// creating Object keys
				await this.setDefaultDisplayTimeIfNeeded(parsedJson);
				await this.setDefaultCoverScaleIfNeeded(parsedJson);
				await this.setDefaultSortByOptionIfNeeded(parsedJson);
				await this.setDefaultDetectionOfFilesByCkechsumValueIfNeeded(
					parsedJson,
				);
				await this.setDefaultStackedBarsPerGameIfNeeded(parsedJson);
				await this.setDefaultPieViewGamesLimitIfNeeded(parsedJson);
				await this.setDefaultChartColorSwatchIfNeeded(parsedJson);
				await this.setDefaultShowKofiInQAMIfNeeded(parsedJson);
				await this.setDefaultChartLegendDisplayIfNeeded(parsedJson);
				await this.setDefaultPieViewQAMHeightIfNeeded(parsedJson);
			})
			.catch((e: Error) => {
				if (e.message === "Not found") {
					logger.error("Unable to get settings, saving defaults", e);

					SteamClient.Storage.SetObject(PLAY_TIME_SETTINGS_KEY, DEFAULTS);

					return;
				}

				logger.error("Unable to get settings", e);
			});
	}

	async get(): Promise<PlayTimeSettings> {
		const settings = await SteamClient.Storage.GetJSON(PLAY_TIME_SETTINGS_KEY);

		if (isNil(settings)) {
			return DEFAULTS;
		}

		let data = JSON.parse(settings);

		data = {
			...data,
			coverScale: +data.coverScale,
			displayTime: {
				showTimeInHours: !!data.displayTime.showTimeInHours,
				showSeconds: !!data.displayTime.showSeconds,
			},
			isEnabledDetectionOfGamesByFileChecksum:
				!!data.isEnabledDetectionOfGamesByFileChecksum,
			isStackedBarsPerGameEnabled: !!data.isStackedBarsPerGameEnabled,
			showKofiInQAM: !!data.showKofiInQAM,
		};

		return data;
	}

	async save(data: PlayTimeSettings) {
		await SteamClient.Storage.SetObject(PLAY_TIME_SETTINGS_KEY, {
			...data,
			coverScale: `${data.coverScale}`,
			displayTime: {
				showTimeInHours: +data.displayTime.showTimeInHours,
				showSeconds: +data.displayTime.showSeconds,
			},
			isEnabledDetectionOfGamesByFileChecksum:
				+data.isEnabledDetectionOfGamesByFileChecksum,
			isStackedBarsPerGameEnabled: +data.isStackedBarsPerGameEnabled,
			showKofiInQAM: +data.showKofiInQAM,
		});
	}

	private async setDefaultDisplayTimeIfNeeded(settings: PlayTimeSettings) {
		// NOTE(ynhhoJ): If fore some reason `settings` is `null` or `undefined` we should set it
		if (isNil(settings)) {
			SteamClient.Storage.SetObject(PLAY_TIME_SETTINGS_KEY, DEFAULTS);

			return;
		}

		const { displayTime } = settings;

		if (!isNil(displayTime)) {
			return;
		}

		await SteamClient.Storage.SetObject(PLAY_TIME_SETTINGS_KEY, {
			...settings,
			displayTime: DEFAULTS.displayTime,
		});
	}

	async setDefaultCoverScaleIfNeeded(settings: PlayTimeSettings) {
		// NOTE(ynhhoJ): If fore some reason `settings` is `null` or `undefined` we should set it
		if (isNil(settings)) {
			SteamClient.Storage.SetObject(PLAY_TIME_SETTINGS_KEY, DEFAULTS);

			return;
		}

		const { coverScale } = settings;

		if (!isNil(coverScale) || (coverScale >= 0.5 && coverScale <= 2)) {
			return;
		}

		await SteamClient.Storage.SetObject(PLAY_TIME_SETTINGS_KEY, {
			...settings,
			coverScale: DEFAULTS.coverScale,
		});
	}

	async setDefaultSortByOptionIfNeeded(settings: PlayTimeSettings) {
		// NOTE(ynhhoJ): If fore some reason `settings` is `null` or `undefined` we should set it
		if (isNil(settings)) {
			SteamClient.Storage.SetObject(PLAY_TIME_SETTINGS_KEY, DEFAULTS);

			return;
		}

		const { selectedSortByOption } = settings;
		const sortByObjectKeys = Object.keys(
			SortBy,
		) as unknown as Array<SortByObjectKeys>;
		const sortByKeys = sortByObjectKeys.map((item) => SortBy[item].key);

		if (
			!isNil(selectedSortByOption) &&
			sortByKeys.includes(selectedSortByOption)
		) {
			return;
		}

		await SteamClient.Storage.SetObject(PLAY_TIME_SETTINGS_KEY, {
			...settings,
			selectedSortByOption: DEFAULTS.selectedSortByOption,
		});
	}

	private async setDefaultDetectionOfFilesByCkechsumValueIfNeeded(
		settings: PlayTimeSettings,
	) {
		// NOTE(ynhhoJ): If fore some reason `settings` is `null` or `undefined` we should set it
		if (isNil(settings)) {
			SteamClient.Storage.SetObject(PLAY_TIME_SETTINGS_KEY, DEFAULTS);

			return;
		}

		const { isEnabledDetectionOfGamesByFileChecksum } = settings;

		if (!isNil(isEnabledDetectionOfGamesByFileChecksum)) {
			return;
		}

		await SteamClient.Storage.SetObject(PLAY_TIME_SETTINGS_KEY, {
			...settings,
			isEnabledDetectionOfGamesByFileChecksum:
				DEFAULTS.isEnabledDetectionOfGamesByFileChecksum,
		});
	}

	private async setDefaultStackedBarsPerGameIfNeeded(
		settings: PlayTimeSettings,
	) {
		// NOTE(ynhhoJ): If fore some reason `settings` is `null` or `undefined` we should set it
		if (isNil(settings)) {
			SteamClient.Storage.SetObject(PLAY_TIME_SETTINGS_KEY, DEFAULTS);

			return;
		}

		const { isStackedBarsPerGameEnabled } = settings;

		if (!isNil(isStackedBarsPerGameEnabled)) {
			return;
		}

		await SteamClient.Storage.SetObject(PLAY_TIME_SETTINGS_KEY, {
			...settings,
			isStackedBarsPerGameEnabled: DEFAULTS.isStackedBarsPerGameEnabled,
		});
	}

	private async setDefaultPieViewGamesLimitIfNeeded(
		settings: PlayTimeSettings,
	) {
		// NOTE(ynhhoJ): If fore some reason `settings` is `null` or `undefined` we should set it
		if (isNil(settings)) {
			SteamClient.Storage.SetObject(PLAY_TIME_SETTINGS_KEY, DEFAULTS);

			return;
		}

		const { pieViewGamesLimit } = settings;

		if (!isNil(pieViewGamesLimit)) {
			return;
		}

		await SteamClient.Storage.SetObject(PLAY_TIME_SETTINGS_KEY, {
			...settings,
			pieViewGamesLimit: DEFAULTS.pieViewGamesLimit,
		});
	}

	private async setDefaultChartColorSwatchIfNeeded(settings: PlayTimeSettings) {
		// NOTE(ynhhoJ): If fore some reason `settings` is `null` or `undefined` we should set it
		if (isNil(settings)) {
			SteamClient.Storage.SetObject(PLAY_TIME_SETTINGS_KEY, DEFAULTS);

			return;
		}

		const { chartColorSwatch } = settings;

		if (!isNil(chartColorSwatch)) {
			return;
		}

		await SteamClient.Storage.SetObject(PLAY_TIME_SETTINGS_KEY, {
			...settings,
			chartColorSwatch: DEFAULTS.chartColorSwatch,
		});
	}

	private async setDefaultShowKofiInQAMIfNeeded(settings: PlayTimeSettings) {
		// NOTE(ynhhoJ): If fore some reason `settings` is `null` or `undefined` we should set it
		if (isNil(settings)) {
			SteamClient.Storage.SetObject(PLAY_TIME_SETTINGS_KEY, DEFAULTS);

			return;
		}

		const { showKofiInQAM } = settings;

		if (!isNil(showKofiInQAM)) {
			return;
		}

		await SteamClient.Storage.SetObject(PLAY_TIME_SETTINGS_KEY, {
			...settings,
			showKofiInQAM: DEFAULTS.showKofiInQAM,
		});
	}

	private async setDefaultChartLegendDisplayIfNeeded(
		settings: PlayTimeSettings,
	) {
		// NOTE(ynhhoJ): If fore some reason `settings` is `null` or `undefined` we should set it
		if (isNil(settings)) {
			SteamClient.Storage.SetObject(PLAY_TIME_SETTINGS_KEY, DEFAULTS);

			return;
		}

		const { chartLegendDisplay } = settings;

		if (!isNil(chartLegendDisplay)) {
			return;
		}

		await SteamClient.Storage.SetObject(PLAY_TIME_SETTINGS_KEY, {
			...settings,
			chartLegendDisplay: DEFAULTS.chartLegendDisplay,
		});
	}

	private async setDefaultPieViewQAMHeightIfNeeded(settings: PlayTimeSettings) {
		// NOTE(ynhhoJ): If fore some reason `settings` is `null` or `undefined` we should set it
		if (isNil(settings)) {
			SteamClient.Storage.SetObject(PLAY_TIME_SETTINGS_KEY, DEFAULTS);

			return;
		}

		const { pieViewQAMHeight } = settings;

		if (!isNil(pieViewQAMHeight)) {
			return;
		}

		await SteamClient.Storage.SetObject(PLAY_TIME_SETTINGS_KEY, {
			...settings,
			pieViewQAMHeight: DEFAULTS.pieViewQAMHeight,
		});
	}
}
