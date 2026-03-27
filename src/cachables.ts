import { Backend } from "./app/backend";
import { UpdatableCache, UpdateOnEventCache } from "./app/cache";
import type { EventBus } from "./app/system";

type PlayTimeEntry = { time: number; lastDate: number };

function buildPlayTimeMap(
	records: Array<{
		game: { id: string };
		totalTime: number;
		lastPlayedDate: string;
	}>,
): Map<string, PlayTimeEntry> {
	const map = new Map<string, PlayTimeEntry>();

	for (const record of records) {
		map.set(record.game.id, {
			time: record.totalTime,
			lastDate: new Date(record.lastPlayedDate).getTime() / 1000,
		});
	}

	return map;
}

export const createCachedPlayTimes = (eventBus: EventBus) =>
	new UpdateOnEventCache(
		new UpdatableCache(async () => {
			const records = await Backend.getPlaytimeInformation();

			return buildPlayTimeMap(records);
		}),
		eventBus,
		["CommitInterval", "TimeManuallyAdjusted", "UserInitialized"],
	);

export const createCachedLastTwoWeeksPlayTimes = (eventBus: EventBus) =>
	new UpdateOnEventCache(
		new UpdatableCache(async () => {
			const records = await Backend.getStatisticsForLastTwoWeeks();

			return buildPlayTimeMap(records);
		}),
		eventBus,
		["CommitInterval", "TimeManuallyAdjusted", "UserInitialized"],
	);
