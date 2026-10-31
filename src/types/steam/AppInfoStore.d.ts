declare module "@decky/ui/dist/globals/stores/appinfostore" {
	interface CAppInfoStore {
		OnAppOverviewChange(apps: { appid(): number }[]): void;
	}
}

export {};
