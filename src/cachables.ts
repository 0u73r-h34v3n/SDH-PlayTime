import { Backend } from "./app/backend";
import { UpdatableCache, UpdateOnEventCache } from "./app/cache";
import type { EventBus } from "./app/system";

export const createCachedPlayTimes = (eventBus: EventBus) =>
	new UpdateOnEventCache(
		new UpdatableCache(async () => {
			return Backend.getPlaytimeInformation().then((r) => {
				const map = new Map<
					string,
					{
						time: number;
						lastDate: number;
					}
				>();

				for (const time of r) {
					map.set(time.game.id, {
						time: time.totalTime,
						lastDate: new Date(time.lastPlayedDate).getTime() / 1000,
					});
				}

				return map;
			});
		}),
		eventBus,
		["CommitInterval", "TimeManuallyAdjusted", "UserInitialized"],
	);

export const createCachedLastTwoWeeksPlayTimes = (eventBus: EventBus) =>
	new UpdateOnEventCache(
		new UpdatableCache(async () => {
			const map = new Map<
				string,
				{
					time: number;
					lastDate: number;
				}
			>();

			return Backend.getStatisticsForLastTwoWeeks().then((r) => {
				for (const game of r) {
					map.set(game.game.id, {
						time: game.totalTime,
						lastDate: new Date(game.lastPlayedDate).getTime() / 1000,
					});
				}

				return map;
			});
		}),
		eventBus,
		["CommitInterval", "TimeManuallyAdjusted", "UserInitialized"],
	);
