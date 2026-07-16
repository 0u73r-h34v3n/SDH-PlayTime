import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { Cache } from "@src/app/cache";
import { APP_TYPE } from "@src/constants";
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

describe("SteamPlayTimePatches", () => {
	let overallCache: FakeCache;
	let twoWeekCache: FakeCache;
	let patches: SteamPlayTimePatches;

	let appOverviews: Map<number, unknown>;

	beforeEach(() => {
		overallCache = new FakeCache();
		twoWeekCache = new FakeCache();

		appOverviews = new Map();

		// @ts-expect-error Mocking global store
		globalThis.appStore = {
			m_mapApps: {
				set: (id: number, app: unknown) => {
					appOverviews.set(id, app);
				},
			},
			GetAppOverviewByAppID: (id: number) => {
				return appOverviews.get(id);
			},
		};

		// @ts-expect-error Mocking global store
		globalThis.appInfoStore = {
			OnAppOverviewChange: () => {},
		};

		patches = new SteamPlayTimePatches(overallCache, twoWeekCache);
	});

	afterEach(() => {
		patches.unMount();
		// @ts-expect-error Removing mocked global store
		delete globalThis.appStore;
		// @ts-expect-error Removing mocked global store
		delete globalThis.appInfoStore;
	});

	function createOverview(
		id: number,
		type: number,
		initialValues: unknown = {},
	) {
		return {
			appid: id,
			app_type: type,
			minutes_playtime_forever: "10.0",
			minutes_playtime_last_two_weeks: 10,
			rt_last_time_locally_played: 1000,
			rt_last_time_played: 1000,
			rt_last_time_played_or_installed: 1000,
			InitFromProto: (_proto: unknown) => {},
			// @ts-expect-error Object spread on unknown
			...initialValues,
		};
	}

	test("missing overall record preserves native steam overview", () => {
		patches.mount();

		overallCache.data = new Map();
		twoWeekCache.data = new Map();

		const app = createOverview(123, APP_TYPE.THIRD_PARTY);
		appStore.m_mapApps.set(123, app);

		expect(app.minutes_playtime_forever).toBe("10.0");
		expect(app.minutes_playtime_last_two_weeks).toBe(10);
		expect(app.rt_last_time_played).toBe(1000);
		expect(app.rt_last_time_locally_played).toBe(1000);
		expect(app.rt_last_time_played_or_installed).toBe(1000);
	});

	test("explicit zero-duration overall record still patches native values", () => {
		patches.mount();

		overallCache.data = new Map([["123", { time: 0, lastDate: 2000 }]]);
		twoWeekCache.data = new Map();

		const app = createOverview(123, APP_TYPE.THIRD_PARTY);
		appStore.m_mapApps.set(123, app);

		expect(app.minutes_playtime_forever).toBe("0.0");
		expect(app.minutes_playtime_last_two_weeks).toBe(0);
		expect(app.rt_last_time_played).toBe(2000);
	});

	test("existing overall record with no two-week record patches total and sets two-week to zero", () => {
		patches.mount();

		overallCache.data = new Map([["123", { time: 300, lastDate: 3000 }]]);
		twoWeekCache.data = new Map();

		const app = createOverview(123, APP_TYPE.THIRD_PARTY);
		appStore.m_mapApps.set(123, app);

		expect(app.minutes_playtime_forever).toBe("5.0"); // 300 / 60
		expect(app.minutes_playtime_last_two_weeks).toBe(0);
		expect(app.rt_last_time_played).toBe(3000);
	});

	test("existing overall and two-week records preserves unit conversion and patches intended values", () => {
		patches.mount();

		overallCache.data = new Map([["123", { time: 360, lastDate: 4000 }]]);
		twoWeekCache.data = new Map([["123", { time: 120, lastDate: 4000 }]]);

		const app = createOverview(123, APP_TYPE.THIRD_PARTY);
		appStore.m_mapApps.set(123, app);

		expect(app.minutes_playtime_forever).toBe("6.0");
		expect(app.minutes_playtime_last_two_weeks).toBe(2);
		expect(app.rt_last_time_played).toBe(4000);
		expect(app.rt_last_time_locally_played).toBe(4000);
		expect(app.rt_last_time_played_or_installed).toBe(4000);
	});

	test("non-third-party overview remains unchanged in every cache state", () => {
		patches.mount();

		overallCache.data = new Map([["123", { time: 300, lastDate: 3000 }]]);
		twoWeekCache.data = new Map([["123", { time: 120, lastDate: 3000 }]]);

		const app = createOverview(123, 1); // Not THIRD_PARTY
		appStore.m_mapApps.set(123, app);

		expect(app.minutes_playtime_forever).toBe("10.0");
		expect(app.minutes_playtime_last_two_weeks).toBe(10);
		expect(app.rt_last_time_played).toBe(1000);
	});

	test("subscribes once per cache and unsubscribes on unmount", () => {
		patches.mount();

		expect(overallCache.subscribers).toHaveLength(1);
		expect(twoWeekCache.subscribers).toHaveLength(1);

		overallCache.subscribers[0](new Map());
		expect(twoWeekCache.subscribers).toHaveLength(1);

		patches.unMount();

		expect(overallCache.subscribers).toHaveLength(0);
		expect(twoWeekCache.subscribers).toHaveLength(0);
	});

	test("patches with the latest values regardless of cache update order", () => {
		patches.mount();

		const app = createOverview(123, APP_TYPE.THIRD_PARTY);
		appStore.m_mapApps.set(123, app);

		twoWeekCache.emit(new Map([["123", { time: 120, lastDate: 4000 }]]));
		expect(app.minutes_playtime_forever).toBe("10.0");

		overallCache.emit(new Map([["123", { time: 360, lastDate: 4000 }]]));
		expect(app.minutes_playtime_forever).toBe("6.0");
		expect(app.minutes_playtime_last_two_weeks).toBe(2);

		overallCache.emit(new Map([["123", { time: 600, lastDate: 5000 }]]));
		expect(app.minutes_playtime_forever).toBe("10.0");
		expect(app.rt_last_time_played).toBe(5000);

		patches.unMount();
		twoWeekCache.emit(new Map([["123", { time: 600, lastDate: 6000 }]]));
		expect(app.minutes_playtime_last_two_weeks).toBe(2);
	});

	test("remounting does not duplicate cache subscriptions", () => {
		patches.mount();
		patches.mount();

		expect(overallCache.subscribers).toHaveLength(1);
		expect(twoWeekCache.subscribers).toHaveLength(1);
	});
});
