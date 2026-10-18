import type { ObservableMap } from "mobx";

export interface AppStore {
	UpdateAppOverview: unknown;
	GetAppOverviewByAppID: (id: number) => AppOverview;
	GetAppOverviewByGameID: (id: string) => AppOverview;
	CompareSortAs: unknown;
	allApps: AppOverview[];
	storeTagCounts: unknown;
	GetTopStoreTags: unknown;
	OnLocalizationChanged: unknown;
	GetStoreTagLocalization: unknown;
	GetLocalizationForStoreTag: unknown;
	AsyncGetLocalizationForStoreTag: unknown;
	sharedLibraryAccountIds: unknown;
	siteLicenseApps: unknown;
	GetIconURLForApp: unknown;
	GetLandscapeImageURLForApp: unknown;
	GetCachedLandscapeImageURLForApp: unknown;
	GetVerticalCapsuleURLForApp: (
		gameOverview: AppOverview,
	) => string | undefined;
	GetPregeneratedVerticalCapsuleForApp: unknown;
	GetCachedVerticalCapsuleURL: unknown;
	GetCustomImageURLs: (appOverview: AppOverview) => Array<string>;
	GetCustomVerticalCapsuleURLs: (appOverview: AppOverview) => Array<string>;
	GetCustomLandcapeImageURLs: (appOverview: AppOverview) => Array<string>;
	GetCustomHeroImageURLs: unknown;
	GetCustomLogoImageURLs: unknown;
	GetStorePageURLForApp: unknown;
	m_mapApps: ObservableMap<number, AppOverview> & {
		originalSet?: Nullable<ObservableMap<number, AppOverview>["set"]>;
	};
}
