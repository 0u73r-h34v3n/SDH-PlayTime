import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { EGenre, IAppOverview } from "@decky/ui";
import {
	EAppCloudStatus,
	EAppType,
	EDisplayStatus,
	ESteamDeckCompatibilityCategory,
	type SteamAppOverviewRemoteClientData,
} from "@decky/ui/dist/globals/steam-client/App";
import type { Cache } from "@src/app/cache";
import { SteamPlayTimePatches } from "@src/steam/ui/steamPlayTimePatches";

type PlayTimeInformation = Map<
	string,
	{
		time: number;
		lastDate: number;
	}
>;

class FakeCache implements Cache<PlayTimeInformation> {
	public data: PlayTimeInformation | null = null;
	public subscribers: ((data: PlayTimeInformation) => void)[] = [];

	public isReady(): boolean {
		return this.data !== null;
	}

	public get(): PlayTimeInformation | null {
		return this.data;
	}

	public subscribe(callback: (data: PlayTimeInformation) => void): () => void {
		this.subscribers.push(callback);
		if (this.data !== null) {
			callback(this.data);
		}

		return () => {
			const index = this.subscribers.indexOf(callback);

			if (index === -1) {
				return;
			}

			this.subscribers.splice(index, 1);
		};
	}

	public emit(data: PlayTimeInformation) {
		this.data = data;

		for (const subscriber of this.subscribers) {
			subscriber(data);
		}
	}
}

const remoteClientData: SteamAppOverviewRemoteClientData = {
	clientid: "",
	client_name: "",
	display_status: EDisplayStatus.Invalid,
	status_percentage: 0,
	bytes_downloaded: "0",
	bytes_total: "0",
	is_available_on_current_platform: true,
	cloud_status: EAppCloudStatus.Unknown,
};

const overviewMethods = {
	BAreCategoriesEqual: () => false,
	BAreSetsEqual: () => false,
	BAreStoreTagsEqual: () => false,
	BHasCustomImages: () => false,
	BHasStoreCategory: () => false,
	BHasStoreTag: () => false,
	BIsAppBlocked: () => false,
	BIsAppInBlockList: () => false,
	BIsApplicationOrTool: () => false,
	BIsBorrowed: () => false,
	BIsDemo: () => false,
	BIsGameIDEqual: () => false,
	BIsHardware: () => false,
	BIsLastTimePlayedEqual: () => false,
	BIsModOrShortcut: () => false,
	BIsMusicAlbum: () => false,
	BIsNewToLibrary: () => false,
	BIsOwned: () => false,
	BIsOwnedByAnotherUser: () => false,
	BIsPerClientDataEqual: () => false,
	BIsPerClientDataLocal: () => false,
	BIsSelectedClientLocal: () => false,
	BIsShortcut: () => false,
	BIsSortAsEqual: () => false,
	BIsSteamDeckVerified: () => false,
	BIsSteamOSCompatible: () => false,
	BIsSteamVR: () => false,
	BIsUnreleased: () => false,
	BIsVisibleInMRUList: () => false,
	BSupportsVR: () => false,
	GetCanonicalReleaseDate: () => 0,
	GetCanonicalReleaseYear: () => "",
	GetGameID: () => "",
	GetLastPlayedSectionName: () => "",
	GetLastTimePlayed: () => 0,
	GetPerClientData: () => remoteClientData,
	GetPrimaryAppID(this: IAppOverview) {
		return this.appid;
	},
	GetStoreTags: () => new Set<EGenre>(),
};

describe("SteamPlayTimePatches", () => {
	let overallCache: FakeCache;
	let twoWeekCache: FakeCache;
	let patches: SteamPlayTimePatches;
	let mapApps: Map<number, IAppOverview>;
	let unpatchedMapSet: Map<number, IAppOverview>["set"];

	beforeEach(() => {
		overallCache = new FakeCache();
		twoWeekCache = new FakeCache();
		mapApps = new Map();

		unpatchedMapSet = mapApps.set;

		Object.defineProperty(globalThis, "appStore", {
			configurable: true,
			writable: true,
			value: {
				m_mapApps: mapApps,
				GetAppOverviewByAppID(id: number) {
					return mapApps.get(id) ?? null;
				},
			},
		});
		Object.defineProperty(globalThis, "appInfoStore", {
			configurable: true,
			writable: true,
			value: {
				OnAppOverviewChange() {},
			},
		});

		patches = new SteamPlayTimePatches(overallCache, twoWeekCache);
	});

	afterEach(() => {
		patches.unMount();
		Reflect.deleteProperty(globalThis, "appStore");
		Reflect.deleteProperty(globalThis, "appInfoStore");
	});

	function createOverview(
		id: number,
		type: IAppOverview["app_type"],
	): IAppOverview {
		return {
			appid: id,
			display_name: "",
			visible_in_game_list: true,
			sort_as: "",
			app_type: type,
			mru_index: undefined,
			rt_recent_activity_time: 0,
			minutes_playtime_forever: 10,
			minutes_playtime_last_two_weeks: 10,
			rt_last_time_played_or_installed: 1000,
			rt_last_time_played: 1000,
			association: [],
			rt_original_release_date: 0,
			rt_steam_release_date: 0,
			icon_hash: "",
			metacritic_score: 0,
			gameid: "",
			per_client_data: [remoteClientData],
			most_available_clientid: "",
			rt_store_asset_mtime: 0,
			review_score_with_bombs: 0,
			review_percentage_with_bombs: 0,
			review_score_without_bombs: 0,
			review_percentage_without_bombs: 0,
			steam_deck_compat_category: ESteamDeckCompatibilityCategory.Unknown,
			rt_last_time_locally_played: 1000,
			rt_purchased_time: 0,
			canonicalAppType: type,
			local_per_client_data: remoteClientData,
			most_available_per_client_data: remoteClientData,
			selected_per_client_data: remoteClientData,
			m_setStoreCategories: new Set(),
			m_setStoreTags: new Set(),
			...overviewMethods,
		};
	}

	function setOverview(app: IAppOverview) {
		return mapApps.set(app.appid, app);
	}

	test("missing overall record preserves native steam overview", () => {
		patches.mount();

		overallCache.data = new Map();
		twoWeekCache.data = new Map();

		const app = createOverview(123, EAppType.Shortcut);
		setOverview(app);

		expect(app.minutes_playtime_forever).toBe(10);
		expect(app.minutes_playtime_last_two_weeks).toBe(10);
		expect(app.rt_last_time_played).toBe(1000);
		expect(app.rt_last_time_locally_played).toBe(1000);
		expect(app.rt_last_time_played_or_installed).toBe(1000);
	});

	test("explicit zero-duration overall record still patches native values", () => {
		patches.mount();

		overallCache.data = new Map([["123", { time: 0, lastDate: 2000 }]]);
		twoWeekCache.data = new Map();

		const app = createOverview(123, EAppType.Shortcut);
		setOverview(app);

		expect(app.minutes_playtime_forever).toBe(0);
		expect(app.minutes_playtime_last_two_weeks).toBe(0);
		expect(app.rt_last_time_played).toBe(2000);
	});

	test("existing overall record with no two-week record patches total and sets two-week to zero", () => {
		patches.mount();

		overallCache.data = new Map([["123", { time: 300, lastDate: 3000 }]]);
		twoWeekCache.data = new Map();

		const app = createOverview(123, EAppType.Shortcut);
		setOverview(app);

		expect(app.minutes_playtime_forever).toBe(5);
		expect(app.minutes_playtime_last_two_weeks).toBe(0);
		expect(app.rt_last_time_played).toBe(3000);
	});

	test("existing overall and two-week records preserve fractional minute conversion", () => {
		patches.mount();

		overallCache.data = new Map([["123", { time: 390, lastDate: 4000 }]]);
		twoWeekCache.data = new Map([["123", { time: 90, lastDate: 4000 }]]);

		const app = createOverview(123, EAppType.Shortcut);
		setOverview(app);

		expect(app.minutes_playtime_forever).toBe(6.5);
		expect(app.minutes_playtime_last_two_weeks).toBe(1.5);
		expect(app.rt_last_time_played).toBe(4000);
		expect(app.rt_last_time_locally_played).toBe(4000);
		expect(app.rt_last_time_played_or_installed).toBe(4000);
	});

	test("non-third-party overview remains unchanged in every cache state", () => {
		patches.mount();

		overallCache.data = new Map([["123", { time: 300, lastDate: 3000 }]]);
		twoWeekCache.data = new Map([["123", { time: 120, lastDate: 3000 }]]);

		const app = createOverview(123, EAppType.Game);
		setOverview(app);

		expect(app.minutes_playtime_forever).toBe(10);
		expect(app.minutes_playtime_last_two_weeks).toBe(10);
		expect(app.rt_last_time_played).toBe(1000);
	});

	test("patches with the latest values regardless of cache update order", () => {
		patches.mount();

		const app = createOverview(123, EAppType.Shortcut);
		setOverview(app);

		twoWeekCache.emit(new Map([["123", { time: 120, lastDate: 4000 }]]));
		expect(app.minutes_playtime_forever).toBe(10);

		overallCache.emit(new Map([["123", { time: 360, lastDate: 4000 }]]));
		expect(app.minutes_playtime_forever).toBe(6);
		expect(app.minutes_playtime_last_two_weeks).toBe(2);

		overallCache.emit(new Map([["123", { time: 600, lastDate: 5000 }]]));
		expect(app.minutes_playtime_forever).toBe(10);
		expect(app.rt_last_time_played).toBe(5000);

		patches.unMount();
		twoWeekCache.emit(new Map([["123", { time: 600, lastDate: 6000 }]]));
		expect(app.minutes_playtime_last_two_weeks).toBe(2);
	});

	test("Map.set keeps chaining semantics and restores across remounts", () => {
		patches.mount();
		const patchedMapSet = mapApps.set;

		expect(setOverview(createOverview(123, EAppType.Shortcut))).toBe(mapApps);
		expect(patchedMapSet).not.toBe(unpatchedMapSet);

		patches.unMount();
		expect(mapApps.set).toBe(unpatchedMapSet);

		patches.mount();
		expect(mapApps.set).not.toBe(unpatchedMapSet);
	});
});
