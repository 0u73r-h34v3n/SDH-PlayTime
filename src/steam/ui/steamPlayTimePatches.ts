import type { Cache } from "@src/app/cache";
import type { Mountable } from "@src/app/system";
import { APP_TYPE } from "@src/constants";
import { isNil } from "es-toolkit";
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

	constructor(
		cachedOverallTime: Cache<PlayTimeInformation>,
		cachedLastTwoWeeksTimes: Cache<PlayTimeInformation>,
	) {
		this.cachedOverallTime = cachedOverallTime;
		this.cachedLastTwoWeeksTimes = cachedLastTwoWeeksTimes;
	}

	public mount() {
		this.ReplaceAppInfoStoreOnAppOverviewChange();
		this.ReplaceAppStoreMapAppsSet();

		this.cachedOverallTime.subscribe((overallTimes) => {
			this.cachedLastTwoWeeksTimes.subscribe((lastTwoWeeksTimes) => {
				const changedApps = [];

				for (const [appId, time] of overallTimes) {
					const appOverview = appStore.GetAppOverviewByAppID(
						Number.parseInt(appId, 10),
					);

					if (appOverview?.app_type === APP_TYPE.THIRD_PARTY) {
						this.patchOverviewWithValues(
							appOverview,
							time.time,
							lastTwoWeeksTimes.get(appId)?.time || 0,
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
			});
		});
	}

	public unMount() {
		this.RestoreOnAppOverviewChange();
		this.RestoreAppStoreMapAppsSet();
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

			if (appOverview?.app_type === APP_TYPE.THIRD_PARTY) {
				appOverview.OriginalInitFromProto = appOverview.InitFromProto;

				appOverview.InitFromProto = (proto: unknown) => {
					appOverview.OriginalInitFromProto(proto);

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
			appOverview?.app_type === APP_TYPE.THIRD_PARTY &&
			this.cachedOverallTime.isReady() &&
			this.cachedLastTwoWeeksTimes.isReady()
		) {
			const { appid: appId } = appOverview;

			const overallTime =
				this.cachedOverallTime.get()?.get(`${appId}`)?.time || 0;
			const lastTwoWeeksTime =
				this.cachedLastTwoWeeksTimes.get()?.get(`${appId}`)?.time || 0;

			this.patchOverviewWithValues(
				appOverview,
				overallTime,
				lastTwoWeeksTime,
				this.cachedOverallTime.get()?.get(`${appId}`)?.lastDate,
			);
		}

		return appOverview;
	}

	private patchOverviewWithValues(
		appOverview: AppOverview,
		overallTime: number,
		lastTwoWeeksTime: number,
		lastPlayedDate: number = 0,
	): AppOverview {
		if (appOverview?.app_type === APP_TYPE.THIRD_PARTY) {
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
}
