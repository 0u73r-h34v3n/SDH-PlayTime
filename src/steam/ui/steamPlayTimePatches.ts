import type { Cache } from "@src/app/cache";
import type { Mountable } from "@src/app/system";
import { APP_TYPE } from "@src/constants";
import logger from "@utils/logger";
import { isNil } from "es-toolkit";

type PlayTimeInformation = Map<
	string,
	{
		time: number;
		lastDate: number;
		isMerged?: boolean;
	}
>;

type NativeOverviewSnapshot = Pick<
	AppOverview,
	| "minutes_playtime_forever"
	| "minutes_playtime_last_two_weeks"
	| "rt_last_time_locally_played"
	| "rt_last_time_played"
	| "rt_last_time_played_or_installed"
>;

type SubscribeMergedPlaytimeEnabled = (
	callback: (enabled: boolean) => void,
) => () => void;

export class SteamPlayTimePatches implements Mountable {
	private cachedOverallTime: Cache<PlayTimeInformation>;
	private cachedLastTwoWeeksTimes: Cache<PlayTimeInformation>;
	private latestOverallTimes: PlayTimeInformation | null = null;
	private latestLastTwoWeeksTimes: PlayTimeInformation | null = null;
	private unsubscribeOverallTime: (() => void) | null = null;
	private unsubscribeLastTwoWeeksTimes: (() => void) | null = null;
	private unsubscribeMergedPlaytimeEnabled: (() => void) | null = null;
	private isMergedPlaytimeEnabled: () => boolean;
	private subscribeMergedPlaytimeEnabled: SubscribeMergedPlaytimeEnabled | null;
	private nativeOverviewSnapshots = new Map<
		number,
		{ overview: AppOverview; values: NativeOverviewSnapshot }
	>();

	constructor(
		cachedOverallTime: Cache<PlayTimeInformation>,
		cachedLastTwoWeeksTimes: Cache<PlayTimeInformation>,
		isMergedPlaytimeEnabled: () => boolean = () => false,
		subscribeMergedPlaytimeEnabled: SubscribeMergedPlaytimeEnabled | null = null,
	) {
		this.cachedOverallTime = cachedOverallTime;
		this.cachedLastTwoWeeksTimes = cachedLastTwoWeeksTimes;
		this.isMergedPlaytimeEnabled = isMergedPlaytimeEnabled;
		this.subscribeMergedPlaytimeEnabled = subscribeMergedPlaytimeEnabled;
	}

	public mount() {
		this.unsubscribeFromCaches();
		this.unsubscribeFromSettings();
		this.RestoreOnAppOverviewChange();
		this.RestoreAppStoreMapAppsSet();
		this.restoreNativeMergedOverviews();
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
		this.unsubscribeMergedPlaytimeEnabled =
			this.subscribeMergedPlaytimeEnabled?.((enabled) => {
				if (enabled) {
					this.patchOverviewsFromCaches();
					return;
				}

				this.restoreNativeMergedOverviews();
			}) ?? null;
	}

	private patchOverviewsFromCaches() {
		if (!this.latestOverallTimes || !this.latestLastTwoWeeksTimes) {
			return;
		}

		const mergedNativeAppIds = new Set<number>();
		if (this.isMergedPlaytimeEnabled()) {
			for (const [appId, record] of this.latestOverallTimes) {
				if (record.isMerged) {
					mergedNativeAppIds.add(Number.parseInt(appId, 10));
				}
			}
		}
		this.restoreNativeMergedOverviews(mergedNativeAppIds);

		const changedApps = [];

		for (const [appId, time] of this.latestOverallTimes) {
			const appOverview = appStore.GetAppOverviewByAppID(
				Number.parseInt(appId, 10),
			);

			if (this.isEligibleForPatch(appOverview)) {
				this.patchOverviewWithValues(
					appOverview,
					time.time,
					this.latestLastTwoWeeksTimes.get(appId)?.time || 0,
					time.lastDate,
				);
				changedApps.push(appOverview);
			}
		}

		// NOTE: Fix from: https://github.com/ma3a/SDH-PlayTime/pull/71
		// appInfoStore.OnAppOverviewChange(changedApps);

		for (const app of changedApps) {
			appStore.m_mapApps.set(app.appid, app);
		}
	}

	public unMount() {
		this.unsubscribeFromCaches();
		this.unsubscribeFromSettings();
		this.RestoreOnAppOverviewChange();
		this.RestoreAppStoreMapAppsSet();
		this.restoreNativeMergedOverviews();
	}

	private unsubscribeFromCaches() {
		this.unsubscribeOverallTime?.();
		this.unsubscribeLastTwoWeeksTimes?.();
		this.unsubscribeOverallTime = null;
		this.unsubscribeLastTwoWeeksTimes = null;
		this.latestOverallTimes = null;
		this.latestLastTwoWeeksTimes = null;
	}

	private unsubscribeFromSettings() {
		this.unsubscribeMergedPlaytimeEnabled?.();
		this.unsubscribeMergedPlaytimeEnabled = null;
	}

	private restoreNativeMergedOverviews(keepPatched = new Set<number>()) {
		for (const [appId, snapshot] of this.nativeOverviewSnapshots) {
			if (keepPatched.has(appId)) {
				continue;
			}

			if (appStore.GetAppOverviewByAppID(appId) !== snapshot.overview) {
				this.nativeOverviewSnapshots.delete(appId);
				continue;
			}

			Object.assign(snapshot.overview, snapshot.values);
			appStore.m_mapApps.set(appId, snapshot.overview);
			this.nativeOverviewSnapshots.delete(appId);
		}
	}

	// here we patch AppInfoStore OnAppOverviewChange method so we can prepare changed app overviews for the next part of the patch (AppOverview.InitFromProto)
	private ReplaceAppInfoStoreOnAppOverviewChange() {
		this.RestoreOnAppOverviewChange();

		if (appInfoStore && !appInfoStore.OriginalOnAppOverviewChange) {
			logger.debug("ReplaceAppInfoStoreOnAppOverviewChange");
			appInfoStore.OriginalOnAppOverviewChange =
				appInfoStore.OnAppOverviewChange;
			const instance = this;
			appInfoStore.OnAppOverviewChange = function (apps) {
				const appIds = apps
					.filter((_) => typeof _.appid() === "number")
					.map((_) => _.appid() as number);
				instance.appInfoStoreOnAppOverviewChange(appIds);
				logger.debug("AppInfoStore.OnAppOverviewChange: calling original");

				if (isNil(this.OriginalOnAppOverviewChange)) {
					logger.debug(
						'Impossible to call "OriginalOnAppOverviewChange" because function is null or undefined',
					);

					return;
				}

				this.OriginalOnAppOverviewChange(apps);
			};
		}
	}

	private RestoreOnAppOverviewChange() {
		if (!appInfoStore?.OriginalOnAppOverviewChange) {
			return;
		}

		//logger.trace(`RestoreOnAppOverviewChange`);
		appInfoStore.OnAppOverviewChange = appInfoStore.OriginalOnAppOverviewChange;
		appInfoStore.OriginalOnAppOverviewChange = null;
	}

	// here we patch AppStore m_mapApps Map set method so we can overwrite playtime before setting AppOverview
	private ReplaceAppStoreMapAppsSet() {
		this.RestoreAppStoreMapAppsSet();

		if (appStore.m_mapApps && !appStore.m_mapApps.originalSet) {
			//logger.trace(`ReplaceAppStoreMapAppsSet`);
			appStore.m_mapApps.originalSet = appStore.m_mapApps.set;

			const appStoreInstance = appStore;

			// @ts-expect-error TODO(ynhhoJ): Should be added type definition for this case too
			appStore.m_mapApps.set = (
				appId: number,
				appOverview: AppOverview,
			): void => {
				this.appStoreMapAppsSet(appId, appOverview);

				const { originalSet } = appStoreInstance.m_mapApps;

				if (isNil(originalSet)) {
					logger.error(
						'Unable to execute "originalSet" function because it is null or undefined.',
					);

					return;
				}

				// @ts-expect-error NOTE(ynhhoJ): We already checked if `originalSet` exists above
				appStoreInstance.m_mapApps.originalSet(appId, appOverview);
			};
		}
	}

	private RestoreAppStoreMapAppsSet() {
		if (appStore.m_mapApps?.originalSet) {
			//logger.trace(`RestoreAppStoreMapAppsSet`);
			appStore.m_mapApps.set = appStore.m_mapApps.originalSet;
			appStore.m_mapApps.originalSet = null;
		}
	}

	// here we patch AppOverview InitFromProto method so we can overwrite playtime after original method
	private appInfoStoreOnAppOverviewChange(appIds: Array<number> | null) {
		logger.debug(
			`AppInfoStore.OnAppOverviewChange (${appIds ? "[]" : "null"})`,
		);
		if (!appIds) {
			return;
		}

		for (const appId of appIds) {
			const appOverview = appStore.GetAppOverviewByAppID(appId);

			if (this.isEligibleForPatch(appOverview)) {
				appOverview.OriginalInitFromProto = appOverview.InitFromProto;

				appOverview.InitFromProto = (proto: unknown) => {
					appOverview.OriginalInitFromProto(proto);

					// Capture the newly refreshed Steam values before applying merged time.
					this.nativeOverviewSnapshots.delete(appOverview.appid);
					this.patchAppOverviewFromCache(appOverview);

					appOverview.InitFromProto = appOverview.OriginalInitFromProto;
				};
			}
		}
	}

	// here we set playtime to appOverview before the appOverview is added to AppStore_m_mapApps map
	private appStoreMapAppsSet(appId: number, appOverview: AppOverview) {
		//logger.trace(`AppStore.m_mapApps.set (${appId})`);
		if (appId && appOverview) {
			this.patchAppOverviewFromCache(appOverview);
		}
	}

	private patchAppOverviewFromCache(appOverview: AppOverview): AppOverview {
		if (
			this.isEligibleForPatch(appOverview) &&
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
		appOverview: AppOverview,
		overallTime: number,
		lastTwoWeeksTime: number,
		lastPlayedDate: number,
	): AppOverview {
		if (this.isEligibleForPatch(appOverview)) {
			if (appOverview.app_type !== APP_TYPE.THIRD_PARTY) {
				this.rememberNativeOverview(appOverview);
			}

			appOverview.minutes_playtime_forever = (overallTime / 60.0).toFixed(1);
			appOverview.minutes_playtime_last_two_weeks = Number.parseFloat(
				(lastTwoWeeksTime / 60.0).toFixed(1),
			);
			appOverview.rt_last_time_locally_played = lastPlayedDate;
			appOverview.rt_last_time_played = lastPlayedDate;
			appOverview.rt_last_time_played_or_installed = lastPlayedDate;
		}

		return appOverview;
	}

	private rememberNativeOverview(appOverview: AppOverview) {
		const existing = this.nativeOverviewSnapshots.get(appOverview.appid);
		if (existing?.overview === appOverview) {
			return;
		}

		// Retain Steam's values so disabling the feature is immediately reversible.
		this.nativeOverviewSnapshots.set(appOverview.appid, {
			overview: appOverview,
			values: {
				minutes_playtime_forever: appOverview.minutes_playtime_forever,
				minutes_playtime_last_two_weeks:
					appOverview.minutes_playtime_last_two_weeks,
				rt_last_time_locally_played: appOverview.rt_last_time_locally_played,
				rt_last_time_played: appOverview.rt_last_time_played,
				rt_last_time_played_or_installed:
					appOverview.rt_last_time_played_or_installed,
			},
		});
	}

	private isEligibleForPatch(
		appOverview: AppOverview | null | undefined,
	): boolean {
		if (!appOverview) {
			return false;
		}
		// Third-party patching predates merged playtime and stays independently active.
		return (
			appOverview.app_type === APP_TYPE.THIRD_PARTY ||
			(this.isMergedPlaytimeEnabled() &&
				!!this.cachedOverallTime.get()?.get(`${appOverview.appid}`)?.isMerged)
		);
	}
}
