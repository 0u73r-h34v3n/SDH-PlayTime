import { APP_TYPE } from "@src/constants";
import type { Backend } from "./backend";

export const nonSteamGamesPredicate = (app: AppOverview) =>
	app.app_type === APP_TYPE.THIRD_PARTY;

export const excludeApps = (app: AppOverview) => app.app_type !== 4;

export class TimeManipulation {
	private backend: Backend;

	constructor(backend: Backend) {
		this.backend = backend;
	}

	async applyManualOverallTimeCorrection(game: GamePlaytimeDetails) {
		return await this.backend.applyManualOverallTimeCorrection([game]);
	}

	/**
	 * @returns Map of all tracked games with their playtime (AppOverview.appid, GamePlaytimeDetails)
	 */
	async fetchPlayTimeForAllGames(
		predicates: Array<(app: AppOverview) => boolean> = [excludeApps],
	): Promise<Map<string, GamePlaytimeDetails>> {
		const gameOverallStatistics =
			await this.backend.fetchPerGameOverallStatistics();
		const trackedGamesByAppId = new Map<string, GamePlaytimeDetails>();

		for (const game of gameOverallStatistics) {
			trackedGamesByAppId.set(game.game.id, game);
		}

		const allSteamAppsAsGamePlaytimeDetails = appStore.allApps
			.filter((it) => predicates.every((predicate) => predicate(it)))
			.map((app) => {
				return {
					game: {
						id: `${app.appid}`,
						name: app.display_name,
					},
					totalTime: 0,
				} as GamePlaytimeDetails;
			});

		const result = new Map<string, GamePlaytimeDetails>();

		for (const game of allSteamAppsAsGamePlaytimeDetails) {
			const trackedGame = trackedGamesByAppId.get(game.game.id);

			if (trackedGame != null) {
				result.set(game.game.id, trackedGame);

				continue;
			}

			result.set(game.game.id, game);
		}

		return result;
	}
}
