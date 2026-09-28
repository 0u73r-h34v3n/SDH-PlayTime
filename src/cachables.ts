import { Backend } from "./app/backend";
import { UpdatableCache, UpdateOnEventCache } from "./app/cache";
import type { EventBus } from "./app/system";

type PlayTimeEntry = { time: number; lastDate: number; isMerged?: boolean };

export function buildPlayTimeMap(
	records: Array<{
		game: { id: string };
		totalTime: number;
		lastPlayedDate: string;
		aliasesId?: string;
	}>,
): Map<string, PlayTimeEntry> {
	const map = new Map<string, PlayTimeEntry>();

	for (const record of records) {
		const entry: PlayTimeEntry = {
			time: record.totalTime,
			lastDate: new Date(record.lastPlayedDate).getTime() / 1000,
			isMerged: !!record.aliasesId,
		};

		map.set(record.game.id, entry);

		if (record.aliasesId) {
			const aliases = record.aliasesId.split(",");
			for (const alias of aliases) {
				if (alias.trim()) {
					map.set(alias.trim(), entry);
				}
			}
		}
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
