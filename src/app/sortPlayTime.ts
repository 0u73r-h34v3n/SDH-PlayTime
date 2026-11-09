import { isNil } from "es-toolkit";
import { t } from "@src/i18n";

export const SortBy = {
	NAME: {
		key: "name",
		name: t("sort.byName"),
	},
	RECENTLY_LAUNCHED: {
		key: "recentlyLaunched",
		name: t("sort.byRecentlyLaunched"),
	},
	FIRST_PLAYTIME: {
		key: "firstPlaytime",
		name: t("sort.byFirstPlaytime"),
	},
	MOST_PLAYED: {
		key: "mostPlayed",
		name: t("sort.byMostPlayedTime"),
	},
	LEAST_PLAYED: {
		key: "leastPlayed",
		name: t("sort.byLeastPlayedTime"),
	},
	MOST_LAUNCHED: {
		key: "mostLaunched",
		name: t("sort.byMostLaunched"),
	},
	LEAST_LAUNCHED: {
		key: "leastLaunched",
		name: t("sort.byLeastLaunched"),
	},
	MOST_AVERAGE_TIME_PLAYED: {
		key: "mostAverageTimePlayed",
		name: t("sort.byMostAverageTimePlayed"),
	},
	LEAST_AVERAGE_TIME_PLAYED: {
		key: "leastAverageTimePlayed",
		name: t("sort.byLeastAverageTimePlayed"),
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
