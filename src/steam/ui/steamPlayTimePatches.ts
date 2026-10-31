import type { IAppOverview } from "@decky/ui";
import type { CAppInfoStore } from "@decky/ui/dist/globals/stores/appinfostore";
import {
	EAppType,
	type SteamAppOverview,
} from "@decky/ui/dist/globals/steam-client/App";
import type { Cache } from "@src/app/cache";
import type { Mountable } from "@src/app/system";
import logger from "@utils/logger";

type PlayTimeInformation = Map<
	string,
	{
		time: number;
		lastDate: number;
	}
>;

export class SteamPlayTimePatches implements Mountable {
	private cachedOverallTime: Cache<PlayTimeInformation>;
	private cachedLastTwoWeeksTimes: Cache<PlayTimeInformation>;
	private latestOverallTimes: PlayTimeInformation | null = null;
	private latestLastTwoWeeksTimes: PlayTimeInformation | null = null;
	private unsubscribeOverallTime: (() => void) | null = null;
	private unsubscribeLastTwoWeeksTimes: (() => void) | null = null;
	private originalOnAppOverviewChange:
		| CAppInfoStore["OnAppOverviewChange"]
		| null = null;
	private patchedAppInfoStore: CAppInfoStore | null = null;
	private originalAppStoreMapAppsSet: Map<number, IAppOverview>["set"] | null =
		null;
	private patchedAppStoreMapApps: Map<number, IAppOverview> | null = null;
	private initFromProtoPatches = new WeakSet<SteamAppOverview>();

	constructor(
		cachedOverallTime: Cache<PlayTimeInformation>,
		cachedLastTwoWeeksTimes: Cache<PlayTimeInformation>,
	) {
		this.cachedOverallTime = cachedOverallTime;
		this.cachedLastTwoWeeksTimes = cachedLastTwoWeeksTimes;
	}

	public mount() {
		this.unsubscribeFromCaches();
		this.ReplaceAppInfoStoreOnAppOverviewChange();
		this.ReplaceAppStoreMapAppsSet();

		this.unsubscribeOverallTime = this.cachedOverallTime.subscribe(
			(overallTimes) => {
				this.latestOverallTimes = overallTimes;
				this.patchOverviewsFromCaches();
			},
		);
		this.unsubscribeLastTwoWeeksTimes = this.cachedLastTwoWeeksTimes.subscribe(
			(lastTwoWeeksTimes) => {
				this.latestLastTwoWeeksTimes = lastTwoWeeksTimes;
				this.patchOverviewsFromCaches();
			},
		);
	}

	private patchOverviewsFromCaches() {
		if (!this.latestOverallTimes || !this.latestLastTwoWeeksTimes) {
			return;
		}

		for (const [appId, time] of this.latestOverallTimes) {
			const appOverview = appStore.GetAppOverviewByAppID(
				Number.parseInt(appId, 10),
			);

			if (appOverview?.app_type === EAppType.Shortcut) {
				this.patchOverviewWithValues(
					appOverview,
					time.time,
					this.latestLastTwoWeeksTimes.get(appId)?.time || 0,
					time.lastDate,
				);
			}
		}
	}

	public unMount() {
		this.unsubscribeFromCaches();
		this.RestoreOnAppOverviewChange();
		this.RestoreAppStoreMapAppsSet();
	}

	private unsubscribeFromCaches() {
		this.unsubscribeOverallTime?.();
		this.unsubscribeLastTwoWeeksTimes?.();
		this.unsubscribeOverallTime = null;
		this.unsubscribeLastTwoWeeksTimes = null;
		this.latestOverallTimes = null;
		this.latestLastTwoWeeksTimes = null;
	}

	private ReplaceAppInfoStoreOnAppOverviewChange() {
		this.RestoreOnAppOverviewChange();

		const store = appInfoStore;

		if (!store) {
			return;
		}

		logger.debug("ReplaceAppInfoStoreOnAppOverviewChange");
		const originalOnAppOverviewChange = store.OnAppOverviewChange;
		const instance = this;

		this.patchedAppInfoStore = store;
		this.originalOnAppOverviewChange = originalOnAppOverviewChange;
		store.OnAppOverviewChange = function (apps) {
			const appIds = apps
				.filter((app) => typeof app.appid() === "number")
				.map((app) => app.appid());

			instance.appInfoStoreOnAppOverviewChange(appIds);
			logger.debug("AppInfoStore.OnAppOverviewChange: calling original");
			originalOnAppOverviewChange.call(this, apps);
		};
	}

	private RestoreOnAppOverviewChange() {
		if (!this.patchedAppInfoStore || !this.originalOnAppOverviewChange) {
			return;
		}

		this.patchedAppInfoStore.OnAppOverviewChange =
			this.originalOnAppOverviewChange;
		this.patchedAppInfoStore = null;
		this.originalOnAppOverviewChange = null;
	}

	private ReplaceAppStoreMapAppsSet() {
		this.RestoreAppStoreMapAppsSet();

		// @decky/ui currently reverses this map's key/value types.
		// TODO(ynhhoJ): Fix later after the correct types are merged
		const mapApps = appStore.m_mapApps as unknown as Map<number, IAppOverview>;
		const originalSet = mapApps.set;
		const instance = this;

		this.patchedAppStoreMapApps = mapApps;
		this.originalAppStoreMapAppsSet = originalSet;
		mapApps.set = function (appId, appOverview) {
			instance.patchAppOverviewFromCache(appOverview);

			return originalSet.call(this, appId, appOverview);
		};
	}

	private RestoreAppStoreMapAppsSet() {
		if (!this.patchedAppStoreMapApps || !this.originalAppStoreMapAppsSet) {
			return;
		}

		this.patchedAppStoreMapApps.set = this.originalAppStoreMapAppsSet;
		this.patchedAppStoreMapApps = null;
		this.originalAppStoreMapAppsSet = null;
	}

	private appInfoStoreOnAppOverviewChange(appIds: number[]) {
		logger.debug(`AppInfoStore.OnAppOverviewChange (${appIds.length})`);

		for (const appId of appIds) {
			const appOverview = appStore.GetAppOverviewByAppID(appId);
			const initFromProto = appOverview?.InitFromProto;

			if (
				appOverview?.app_type !== EAppType.Shortcut ||
				!initFromProto ||
				this.initFromProtoPatches.has(appOverview)
			) {
				continue;
			}

			const instance = this;
			const patchedInitFromProto = function (
				this: SteamAppOverview,
				proto: unknown,
			) {
				try {
					initFromProto.call(this, proto);
					instance.patchAppOverviewFromCache(appOverview);
				} finally {
					if (appOverview.InitFromProto === patchedInitFromProto) {
						appOverview.InitFromProto = initFromProto;
					}

					instance.initFromProtoPatches.delete(appOverview);
				}
			};

			this.initFromProtoPatches.add(appOverview);
			appOverview.InitFromProto = patchedInitFromProto;
		}
	}

	private patchAppOverviewFromCache(
		appOverview: SteamAppOverview,
	): SteamAppOverview {
		if (
			appOverview.app_type === EAppType.Shortcut &&
			this.cachedOverallTime.isReady() &&
			this.cachedLastTwoWeeksTimes.isReady()
		) {
			const appIdStr = `${appOverview.appid}`;
			const overallRecord = this.cachedOverallTime.get()?.get(appIdStr);

			if (!overallRecord) {
				return appOverview;
			}

			const lastTwoWeeksTime =
				this.cachedLastTwoWeeksTimes.get()?.get(appIdStr)?.time || 0;

			this.patchOverviewWithValues(
				appOverview,
				overallRecord.time,
				lastTwoWeeksTime,
				overallRecord.lastDate,
			);
		}

		return appOverview;
	}

	private patchOverviewWithValues(
		appOverview: SteamAppOverview,
		overallTime: number,
		lastTwoWeeksTime: number,
		lastPlayedDate: number,
	): SteamAppOverview {
		if (appOverview.app_type === EAppType.Shortcut) {
			appOverview.minutes_playtime_forever = Number.parseFloat(
				(overallTime / 60).toFixed(1),
			);
			appOverview.minutes_playtime_last_two_weeks = Number.parseFloat(
				(lastTwoWeeksTime / 60).toFixed(1),
			);
			appOverview.rt_last_time_locally_played = lastPlayedDate;
			appOverview.rt_last_time_played = lastPlayedDate;
			appOverview.rt_last_time_played_or_installed = lastPlayedDate;
		}

		return appOverview;
	}
}
