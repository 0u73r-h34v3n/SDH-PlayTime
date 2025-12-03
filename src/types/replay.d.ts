/**
 * Types for the Steam Replay-like Year in Review feature
 */

/** Summary statistics for the entire year */
type YearReplaySummary = {
	year: number;
	totalPlayTime: number;
	totalSessions: number;
	totalGamesPlayed: number;
	totalDaysPlayed: number;
	averageSessionLength: number;
	averageDailyPlayTime: number;
	mostPlayedMonth: string;
	mostPlayedMonthTime: number;
};

/** Information about a game played during the year */
type YearReplayGame = {
	game: Game;
	totalTime: number;
	sessions: number;
	firstPlayedDate: string;
	lastPlayedDate: string;
	percentageOfTotal: number;
	longestSession: number;
	averageSessionLength: number;
	isFirstPlayedThisYear: boolean;
	monthlyPlayTime: MonthlyPlayTime[];
	longestStreak: number;
};

/** Monthly breakdown of play time */
type MonthlyPlayTime = {
	month: string;
	monthIndex: number;
	playTime: number;
	sessions: number;
};

/** Streak information */
type PlayStreak = {
	startDate: string;
	endDate: string;
	days: number;
	gamesPlayed: GamePlayedDuringStreak[];
};

/** Game played during a streak */
type GamePlayedDuringStreak = {
	game: Game;
	totalTime: number;
	sessions: number;
};

/** Complete Year Replay data */
type YearReplayData = {
	summary: YearReplaySummary;
	topGames: YearReplayGame[];
	allGames: YearReplayGame[];
	longestStreak: PlayStreak;
	newGamesThisYear: YearReplayGame[];
	monthlyBreakdown: MonthlyPlayTime[];
	insights: YearReplayInsights;
	achievements: YearReplayAchievement[];
};

/** Insights and fun facts */
type YearReplayInsights = {
	longestSingleSession: {
		game: Game;
		duration: number;
		date: string;
	} | null;
	weekdayVsWeekend: {
		weekdayHours: number;
		weekendHours: number;
		weekdayPercentage: number;
	};
	mostActiveDay: {
		dayName: string;
		totalTime: number;
		averageTime: number;
	};
	monthsPlayed: number;
	oneSessionGames: number;
	funTimeComparisons: {
		movies: number; // ~2h per movie
		books: number; // ~8h per book
		flights: number; // ~12h transatlantic flight
		marathons: number; // ~4h per marathon
	};
};

/** Achievement rarity levels */
type AchievementRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

/** Achievement badge */
type YearReplayAchievement = {
	id: string;
	title: string;
	description: string;
	icon: string;
	unlocked: boolean;
	value?: string | number;
	rarity?: AchievementRarity;
};
