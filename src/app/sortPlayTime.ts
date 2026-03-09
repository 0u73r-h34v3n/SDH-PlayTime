import { isNil } from "es-toolkit";

export const SortBy = {
	NAME: {
		key: "name",
		name: "By Name",
	},
	RECENTLY_LAUNCHED: {
		key: "recentlyLaunched",
		name: "By Recently Launched",
	},
	FIRST_PLAYTIME: {
		key: "firstPlaytime",
		name: "By First Playtime",
	},
	MOST_PLAYED: {
		key: "mostPlayed",
		name: "By Most Played Time",
	},
	LEAST_PLAYED: {
		key: "leastPlayed",
		name: "By Least Played Time",
	},
	MOST_LAUNCHED: {
		key: "mostLaunched",
		name: "By Most Launched",
	},
	LEAST_LAUNCHED: {
		key: "leastLaunched",
		name: "By Least Launched",
	},
	MOST_AVERAGE_TIME_PLAYED: {
		key: "mostAverageTimePlayed",
		name: "By Most Average Time Played",
	},
	LEAST_AVERAGE_TIME_PLAYED: {
		key: "leastAverageTimePlayed",
		name: "By Least Average Time Played",
	},
} as const;

export type SortByObjectKeys = keyof typeof SortBy;
export type SortByKeys = Pick<
	(typeof SortBy)[keyof typeof SortBy],
	"key"
>["key"];

export function getSelectedSortOptionByKey(key: SortByKeys) {
	const objectKeys = Object.keys(SortBy) as unknown as Array<SortByObjectKeys>;

	return objectKeys.find((item) => SortBy[item].key === key);
}

function sortByName(playedTime: Array<GamePlaytimeDetails>) {
	return playedTime.sort((a, b) => a.game.name.localeCompare(b.game.name));
}

function sortByFirstPlayTime(playedTime: Array<GamePlaytimeDetails>) {
	return playedTime.sort((a, b) => {
		const firstSessionA = a.sessions[0]?.date;
		const firstSessionB = b.sessions[0]?.date;

		if (isNil(firstSessionA) || isNil(firstSessionB)) return 0;

		return (
			new Date(firstSessionA).getTime() - new Date(firstSessionB).getTime()
		);
	});
}

function sortByMostPlayed(playedTime: Array<GamePlaytimeDetails>) {
	return playedTime.sort((a, b) => b.totalTime - a.totalTime);
}

function sortByLeastPlayed(playedTime: Array<GamePlaytimeDetails>) {
	return playedTime.sort((a, b) => a.totalTime - b.totalTime);
}

function sortByMostLaunched(playedTime: Array<GamePlaytimeDetails>) {
	return playedTime.sort((a, b) => b.sessions.length - a.sessions.length);
}

function sortByLeastLaunched(playedTime: Array<GamePlaytimeDetails>) {
	return playedTime.sort((a, b) => a.sessions.length - b.sessions.length);
}

function sortByMostAverageTimePlayed(playedTime: Array<GamePlaytimeDetails>) {
	return playedTime.sort((a, b) => {
		const avgTimeA = a.totalTime / a.sessions.length;
		const avgTimeB = b.totalTime / b.sessions.length;

		return avgTimeB - avgTimeA;
	});
}

function sortByLeastAverageTimePlayed(playedTime: Array<GamePlaytimeDetails>) {
	return playedTime.sort((a, b) => {
		const avgTimeA = a.totalTime / a.sessions.length;
		const avgTimeB = b.totalTime / b.sessions.length;

		return avgTimeA - avgTimeB;
	});
}

function sortByRecentlyLaunched(playedTime: Array<GamePlaytimeDetails>) {
	return playedTime.sort(
		(a, b) =>
			new Date(b?.lastSession?.date || 0).getTime() -
			new Date(a?.lastSession?.date || 0).getTime(),
	);
}

export function sortPlayedTime(
	playedTimeOriginal: Array<GamePlaytimeDetails>,
	sort?: SortByKeys,
) {
	if (isNil(playedTimeOriginal)) {
		return [];
	}

	const playedTime = playedTimeOriginal.slice(0);

	if (SortBy.NAME.key === sort) {
		return sortByName(playedTime);
	}

	if (SortBy.FIRST_PLAYTIME.key === sort) {
		return sortByFirstPlayTime(playedTime);
	}

	if (SortBy.MOST_PLAYED.key === sort) {
		return sortByMostPlayed(playedTime);
	}

	if (SortBy.LEAST_PLAYED.key === sort) {
		return sortByLeastPlayed(playedTime);
	}

	if (SortBy.MOST_LAUNCHED.key === sort) {
		return sortByMostLaunched(playedTime);
	}

	if (SortBy.LEAST_LAUNCHED.key === sort) {
		return sortByLeastLaunched(playedTime);
	}

	if (SortBy.MOST_AVERAGE_TIME_PLAYED.key === sort) {
		return sortByMostAverageTimePlayed(playedTime);
	}

	if (SortBy.LEAST_AVERAGE_TIME_PLAYED.key === sort) {
		return sortByLeastAverageTimePlayed(playedTime);
	}

	if (SortBy.RECENTLY_LAUNCHED.key === sort) {
		return sortByRecentlyLaunched(playedTime);
	}

	return sortByMostPlayed(playedTime);
}
