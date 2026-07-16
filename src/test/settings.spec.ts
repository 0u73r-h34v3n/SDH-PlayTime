import { beforeEach, describe, expect, spyOn, test } from "bun:test";
import type { PlayTimeSettings } from "@src/app/settings";

(
	globalThis as typeof globalThis & { __PLUGIN_VERSION__: string }
).__PLUGIN_VERSION__ = "test-version";

const {
	ChartStyle,
	CURRENT_SETTINGS_VERSION,
	DEFAULTS,
	PLUGIN_VERSION,
	Settings,
} = await import("@src/app/settings");

describe("Settings", () => {
	let stored: string | undefined;
	let writes: unknown[];
	let reads: number;

	function store(value: unknown): void {
		stored = typeof value === "string" ? value : JSON.stringify(value);
	}

	function storedObject(): Record<string, unknown> {
		return JSON.parse(stored ?? "null") as Record<string, unknown>;
	}

	beforeEach(() => {
		stored = undefined;
		writes = [];
		reads = 0;
		globalThis.SteamClient = {
			Storage: {
				GetJSON: async () => {
					reads += 1;
					if (stored === undefined) throw new Error("Not found");
					return stored;
				},
				SetObject: (_key: string, value: unknown) => {
					writes.push(value);
					store(value);
				},
			},
		} as unknown as typeof SteamClient;
	});

	test("creates and persists encoded defaults when storage is missing", async () => {
		const result = await new Settings().get();

		expect(result).toEqual(DEFAULTS);
		expect(result).not.toBe(DEFAULTS);
		expect(result.displayTime).not.toBe(DEFAULTS.displayTime);
		expect(writes).toHaveLength(1);
		expect(storedObject()).toEqual({
			...DEFAULTS,
			coverScale: "1",
			displayTime: { showTimeInHours: 1, showSeconds: 0 },
			isEnabledDetectionOfGamesByFileChecksum: 0,
			isStackedBarsPerGameEnabled: 0,
			showKofiInQAM: 1,
		});
	});

	test("migrates legacy settings and coerces every property", async () => {
		store({
			gameChartStyle: "0",
			reminderToTakeBreaksInterval: "60",
			displayTime: { showTimeInHours: "false", showSeconds: "1" },
			coverScale: "0.5",
			selectedSortByOption: "name",
			isEnabledDetectionOfGamesByFileChecksum: "true",
			isStackedBarsPerGameEnabled: 1,
			pieViewGamesLimit: "50",
			chartColorSwatch: "DarkMuted",
			showKofiInQAM: "0",
			chartLegendDisplay: "both",
			pieViewQAMHeight: "200",
			weekStartsOn: "0",
			lastSeenVersion: "3.1.0",
		});

		const result = await new Settings().get();

		expect(result).toEqual({
			settingsVersion: CURRENT_SETTINGS_VERSION,
			gameChartStyle: ChartStyle.PIE_AND_BARS,
			reminderToTakeBreaksInterval: 60,
			displayTime: { showTimeInHours: false, showSeconds: true },
			coverScale: 0.5,
			selectedSortByOption: "name",
			isEnabledDetectionOfGamesByFileChecksum: true,
			isStackedBarsPerGameEnabled: true,
			pieViewGamesLimit: 50,
			chartColorSwatch: "DarkMuted",
			showKofiInQAM: false,
			chartLegendDisplay: "both",
			pieViewQAMHeight: 200,
			weekStartsOn: 0,
			lastSeenVersion: "3.1.0",
		});
		expect(writes).toHaveLength(1);
	});

	test("replaces every invalid property with its default", async () => {
		store({
			settingsVersion: Number.MAX_SAFE_INTEGER,
			gameChartStyle: 7,
			reminderToTakeBreaksInterval: 45,
			displayTime: { showTimeInHours: "yes", showSeconds: null },
			coverScale: "Infinity",
			selectedSortByOption: "invalid",
			isEnabledDetectionOfGamesByFileChecksum: "yes",
			isStackedBarsPerGameEnabled: 2,
			pieViewGamesLimit: 17,
			chartColorSwatch: "Bright",
			showKofiInQAM: {},
			chartLegendDisplay: "sometimes",
			pieViewQAMHeight: 225,
			weekStartsOn: 2,
			lastSeenVersion: 123,
			extraProperty: "removed",
		});

		const result = await new Settings().get();

		expect(result).toEqual(DEFAULTS);
		expect(storedObject()).not.toHaveProperty("extraProperty");
		expect(writes).toHaveLength(1);
	});

	test("accepts every supported enum and option value", async () => {
		const cases = [
			{
				property: "gameChartStyle",
				values: [ChartStyle.PIE_AND_BARS, ChartStyle.BAR],
			},
			{
				property: "reminderToTakeBreaksInterval",
				values: [-1, 15, 30, 60, 120],
			},
			{
				property: "selectedSortByOption",
				values: [
					"name",
					"recentlyLaunched",
					"firstPlaytime",
					"mostPlayed",
					"leastPlayed",
					"mostLaunched",
					"leastLaunched",
					"mostAverageTimePlayed",
					"leastAverageTimePlayed",
				],
			},
			{
				property: "pieViewGamesLimit",
				values: [5, 10, 15, 25, 50, 100, -1],
			},
			{
				property: "chartColorSwatch",
				values: [
					"Vibrant",
					"DarkVibrant",
					"LightVibrant",
					"Muted",
					"DarkMuted",
					"LightMuted",
				],
			},
			{
				property: "chartLegendDisplay",
				values: ["none", "pie", "bar", "both"],
			},
			{ property: "pieViewQAMHeight", values: [200, 250, 300] },
			{ property: "weekStartsOn", values: [0, 1] },
		] as const;

		for (const { property, values } of cases) {
			for (const value of values) {
				store({ settingsVersion: CURRENT_SETTINGS_VERSION, [property]: value });
				const result = await new Settings().get();
				expect((result as unknown as Record<string, unknown>)[property]).toBe(
					value,
				);
			}
		}
	});

	test("coerces all supported boolean storage representations", async () => {
		for (const value of [true, 1, "1", "true"] as const) {
			store({ showKofiInQAM: value });
			expect((await new Settings().get()).showKofiInQAM).toBe(true);
		}

		for (const value of [false, 0, "0", "false"] as const) {
			store({ showKofiInQAM: value });
			expect((await new Settings().get()).showKofiInQAM).toBe(false);
		}
	});

	test("accepts cover-scale boundaries and rejects out-of-range values", async () => {
		for (const value of [0.5, 2, "1.25"] as const) {
			store({ coverScale: value });
			expect((await new Settings().get()).coverScale).toBe(Number(value));
		}

		for (const value of [0.49, 2.01, "", "not-a-number"] as const) {
			store({ coverScale: value });
			expect((await new Settings().get()).coverScale).toBe(DEFAULTS.coverScale);
		}
	});

	test("recovers safely from malformed and non-object JSON", async () => {
		for (const value of ["{broken", "null", "[]", "42", '"text"']) {
			store(value);
			writes = [];

			const result = await new Settings().get();

			expect(result).toEqual(DEFAULTS);
			expect(writes).toHaveLength(1);
		}
	});

	test("does not persist settings that are already normalized", async () => {
		await new Settings().get();
		expect(writes).toHaveLength(1);

		await new Settings().get();
		expect(writes).toHaveLength(1);
	});

	test("returns a fresh settings object on every read", async () => {
		const settings = new Settings();
		const first = await settings.get();
		first.coverScale = 2;
		first.displayTime.showSeconds = true;

		const second = await settings.get();

		expect(second.coverScale).toBe(1);
		expect(second.displayTime.showSeconds).toBe(false);
		expect(second).not.toBe(first);
		expect(second.displayTime).not.toBe(first.displayTime);
	});

	test("save validates data and uses the legacy storage encoding", async () => {
		const settings = new Settings();
		await settings.get();
		writes = [];

		await settings.save({
			...DEFAULTS,
			displayTime: { showTimeInHours: false, showSeconds: true },
			coverScale: 1.5,
			isEnabledDetectionOfGamesByFileChecksum: true,
			isStackedBarsPerGameEnabled: true,
			showKofiInQAM: false,
		});

		expect(writes).toHaveLength(1);
		expect(storedObject()).toMatchObject({
			settingsVersion: CURRENT_SETTINGS_VERSION,
			coverScale: "1.5",
			displayTime: { showTimeInHours: 0, showSeconds: 1 },
			isEnabledDetectionOfGamesByFileChecksum: 1,
			isStackedBarsPerGameEnabled: 1,
			showKofiInQAM: 0,
		});
	});

	test("save normalizes untrusted runtime input", async () => {
		const settings = new Settings();
		await settings.get();
		writes = [];

		await settings.save({
			settingsVersion: -1,
			coverScale: 9,
			displayTime: null,
			showKofiInQAM: "invalid",
		} as unknown as PlayTimeSettings);

		expect(await settings.get()).toEqual(DEFAULTS);
		expect(writes).toHaveLength(1);
	});

	test("detects unseen plugin versions and marks the current version seen", async () => {
		const settings = new Settings();
		await settings.get();

		expect(await settings.isVersionNew()).toBe(true);
		await settings.save({ ...DEFAULTS, lastSeenVersion: "older-version" });
		expect(await settings.isVersionNew()).toBe(true);
		await settings.markVersionAsSeen();
		expect(await settings.isVersionNew()).toBe(false);
		expect((await settings.get()).lastSeenVersion).toBe(PLUGIN_VERSION);
	});

	test("waits for constructor normalization before serving a read", async () => {
		store({ displayTime: { showSeconds: true } });

		const result = await new Settings().get();

		expect(result.displayTime).toEqual({
			showTimeInHours: true,
			showSeconds: true,
		});
		expect(reads).toBe(2);
		expect(writes).toHaveLength(1);
	});

	test("logs initialization failures and propagates later storage failures", async () => {
		const storageError = new Error("Storage unavailable");
		const consoleError = spyOn(console, "error").mockImplementation(() => {});
		globalThis.SteamClient.Storage.GetJSON = async () => {
			throw storageError;
		};

		const settings = new Settings();
		await expect(settings.get()).rejects.toThrow("Storage unavailable");

		expect(consoleError).toHaveBeenCalled();
		consoleError.mockRestore();
	});
});
