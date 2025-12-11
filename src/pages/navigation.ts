import { Navigation } from "@decky/ui";

export const DETAILED_REPORT_ROUTE = "/playtime/detailed-report";
export const GAME_REPORT_ROUTE = "/playtime/game-report-route/:gameId";
export const MANUALLY_ADJUST_TIME = "/playtime/manually-adjust-time";
export const SETTINGS_ROUTE = "/playtime/settings";
export const REPLAY_ROUTE = "/playtime/replay/:year";

export function navigateToReplay(year?: number) {
	const replayYear = year || new Date().getFullYear();

	navigateToPage(REPLAY_ROUTE.replace(":year", replayYear.toString()));
}

export function navigateToPage(url: string) {
	Navigation.CloseSideMenus();
	Navigation.Navigate(url);
}

export function navigateBack() {
	Navigation.CloseSideMenus();
	Navigation.NavigateBack();
}
