import { differenceInDays, parseISO } from "date-fns";

type AchievementContext = {
	totalHours: number;
	mostPlayedHours: number;
	mostPlayedGameName: string;
	longestSessionHours: number;
	totalSessions: number;
	totalGamesPlayed: number;
	newGamesCount: number;
	monthsPlayed: number;
	longestStreakDays: number;
	weekendPercentage: number;
	weekdayPercentage: number;
	mostActiveDayName: string;
	oneAndDoneCount: number;
	loyalGameName: string | null;
	isWeekendGamer: boolean;
	top3Percentage: number;
	mostPlayedPercentage: number;
	peakMonthHours: number;
	zeroMonths: number;
	hasLoyalGame: boolean;
	hasComebackGame: boolean;
	comebackGameName: string;
	allGamesCount: number;
};

type AchievementDefinition = {
	id: string;
	title: string | ((ctx: AchievementContext) => string);
	description: string | ((ctx: AchievementContext) => string);
	icon: string;
	rarity: AchievementRarity;
	isUnlocked: (ctx: AchievementContext) => boolean;
	getValue: (ctx: AchievementContext) => string | number;
};

const ACHIEVEMENTS: AchievementDefinition[] = [
	// PLAYTIME ACHIEVEMENTS
	{
		id: "first-steps",
		title: "First Steps",
		description: "Played at least one game this year",
		icon: "IoFootsteps",
		rarity: "common",
		isUnlocked: (ctx) => ctx.totalHours > 0,
		getValue: (ctx) => ctx.totalGamesPlayed,
	},
	{
		id: "casual-gamer",
		title: "Casual Gamer",
		description: "Played 25+ hours total this year",
		icon: "IoGameController",
		rarity: "common",
		isUnlocked: (ctx) => ctx.totalHours >= 25,
		getValue: (ctx) => `${Math.round(ctx.totalHours)}h`,
	},
	{
		id: "century-club",
		title: "Century Club",
		description: "Played 100+ hours total this year",
		icon: "IoTrophy",
		rarity: "rare",
		isUnlocked: (ctx) => ctx.totalHours >= 100,
		getValue: (ctx) => `${Math.round(ctx.totalHours)}h`,
	},
	{
		id: "dedicated-fan",
		title: "Dedicated Fan",
		description: "Spent 100+ hours on a single game",
		icon: "IoHeart",
		rarity: "rare",
		isUnlocked: (ctx) => ctx.mostPlayedHours >= 100,
		getValue: (ctx) => ctx.mostPlayedGameName,
	},

	// SESSION ACHIEVEMENTS
	{
		id: "session-starter",
		title: "Session Starter",
		description: "Started 25+ gaming sessions",
		icon: "IoPlay",
		rarity: "common",
		isUnlocked: (ctx) => ctx.totalSessions >= 25,
		getValue: (ctx) => ctx.totalSessions,
	},
	{
		id: "session-pro",
		title: "Session Pro",
		description: "Started 100+ gaming sessions",
		icon: "IoPlayForward",
		rarity: "rare",
		isUnlocked: (ctx) => ctx.totalSessions >= 100,
		getValue: (ctx) => ctx.totalSessions,
	},
	{
		id: "marathon-runner",
		title: "Marathon Runner",
		description: "Completed a 4+ hour gaming session",
		icon: "IoStopwatch",
		rarity: "uncommon",
		isUnlocked: (ctx) => ctx.longestSessionHours >= 4,
		getValue: (ctx) => `${Math.round(ctx.longestSessionHours * 10) / 10}h`,
	},
	{
		id: "ultra-marathon",
		title: "Ultra Marathon",
		description: "Completed an 8+ hour gaming session",
		icon: "IoRocket",
		rarity: "epic",
		isUnlocked: (ctx) => ctx.longestSessionHours >= 8,
		getValue: (ctx) => `${Math.round(ctx.longestSessionHours * 10) / 10}h`,
	},

	// VARIETY ACHIEVEMENTS
	{
		id: "variety-gamer",
		title: "Variety Gamer",
		description: "Played 10 or more different games",
		icon: "IoApps",
		rarity: "uncommon",
		isUnlocked: (ctx) => ctx.totalGamesPlayed >= 10,
		getValue: (ctx) => ctx.totalGamesPlayed,
	},
	{
		id: "library-explorer",
		title: "Library Explorer",
		description: "Played 25 or more different games",
		icon: "IoLibrary",
		rarity: "rare",
		isUnlocked: (ctx) => ctx.totalGamesPlayed >= 25,
		getValue: (ctx) => ctx.totalGamesPlayed,
	},
	{
		id: "explorer",
		title: "Explorer",
		description: "Discovered 5 or more new games",
		icon: "IoCompass",
		rarity: "uncommon",
		isUnlocked: (ctx) => ctx.newGamesCount >= 5,
		getValue: (ctx) => ctx.newGamesCount,
	},
	{
		id: "treasure-hunter",
		title: "Treasure Hunter",
		description: "Discovered 15 or more new games",
		icon: "IoDiamond",
		rarity: "rare",
		isUnlocked: (ctx) => ctx.newGamesCount >= 15,
		getValue: (ctx) => ctx.newGamesCount,
	},

	// CONSISTENCY ACHIEVEMENTS
	{
		id: "seasonal",
		title: "Seasonal Gamer",
		description: "Played in 6 or more months",
		icon: "IoCalendar",
		rarity: "uncommon",
		isUnlocked: (ctx) => ctx.monthsPlayed >= 6,
		getValue: (ctx) => `${ctx.monthsPlayed}/12`,
	},
	{
		id: "year-round",
		title: "Year-Round Gamer",
		description: "Played in all 12 months",
		icon: "IoCalendarNumber",
		rarity: "rare",
		isUnlocked: (ctx) => ctx.monthsPlayed === 12,
		getValue: (ctx) => `${ctx.monthsPlayed}/12`,
	},
	{
		id: "streak-starter",
		title: "Streak Starter",
		description: "Achieved a 5+ day gaming streak",
		icon: "IoFlash",
		rarity: "uncommon",
		isUnlocked: (ctx) => ctx.longestStreakDays >= 5,
		getValue: (ctx) => `${ctx.longestStreakDays} days`,
	},
	{
		id: "streak-master",
		title: "Streak Master",
		description: "Achieved a 14+ day gaming streak",
		icon: "IoFlame",
		rarity: "rare",
		isUnlocked: (ctx) => ctx.longestStreakDays >= 14,
		getValue: (ctx) => `${ctx.longestStreakDays} days`,
	},
	{
		id: "unstoppable",
		title: "Unstoppable",
		description: "Achieved a 30+ day gaming streak",
		icon: "IoNuclear",
		rarity: "epic",
		isUnlocked: (ctx) => ctx.longestStreakDays >= 30,
		getValue: (ctx) => `${ctx.longestStreakDays} days`,
	},

	// DAY PREFERENCE ACHIEVEMENTS
	{
		id: "weekend-warrior",
		title: "Weekend Warrior",
		description: "Played 60%+ of your time on weekends",
		icon: "IoMoon",
		rarity: "uncommon",
		isUnlocked: (ctx) => ctx.weekendPercentage >= 60,
		getValue: (ctx) => `${Math.round(ctx.weekendPercentage)}%`,
	},
	{
		id: "workweek-hero",
		title: "Workweek Hero",
		description: "Played 80%+ of your time on weekdays",
		icon: "IoSunny",
		rarity: "uncommon",
		isUnlocked: (ctx) => ctx.weekdayPercentage >= 80,
		getValue: (ctx) => `${Math.round(ctx.weekdayPercentage)}%`,
	},

	// FUN ACHIEVEMENTS
	{
		id: "favorite-day",
		title: (ctx) => `${ctx.mostActiveDayName} Gamer`,
		description: (ctx) =>
			`${ctx.mostActiveDayName} is your favorite gaming day`,
		icon: "IoStar",
		rarity: "common",
		isUnlocked: () => true,
		getValue: (ctx) => ctx.mostActiveDayName,
	},
	{
		id: "one-and-done",
		title: "One and Done",
		description: "Tried a game and moved on",
		icon: "IoCheckmark",
		rarity: "common",
		isUnlocked: (ctx) => ctx.oneAndDoneCount > 0,
		getValue: (ctx) => `${ctx.oneAndDoneCount} game(s)`,
	},
	{
		id: "loyal-player",
		title: "Loyal Player",
		description: "Played the same game for 30+ consecutive days",
		icon: "IoShield",
		rarity: "epic",
		isUnlocked: (ctx) => ctx.hasLoyalGame,
		getValue: (ctx) => ctx.loyalGameName || "N/A",
	},
	{
		id: "deck-master",
		title: "Deck Master",
		description: "Used PlayTime to track your gaming journey",
		icon: "IoHardwareChip",
		rarity: "common",
		isUnlocked: () => true,
		getValue: () => "Steam Deck",
	},
	{
		id: "night-owl",
		title: "Night Owl",
		description: "Your favorite gaming day is on the weekend",
		icon: "IoBed",
		rarity: "common",
		isUnlocked: (ctx) => ctx.isWeekendGamer,
		getValue: (ctx) => ctx.mostActiveDayName,
	},
	{
		id: "early-bird",
		title: "Early Bird",
		description: "Your favorite gaming day is on a weekday",
		icon: "IoCafe",
		rarity: "common",
		isUnlocked: (ctx) => !ctx.isWeekendGamer && ctx.mostActiveDayName !== "N/A",
		getValue: (ctx) => ctx.mostActiveDayName,
	},

	// LEGENDARY ACHIEVEMENTS
	{
		id: "time-lord",
		title: "Time Lord",
		description: "Played 500+ hours total this year",
		icon: "IoTime",
		rarity: "legendary",
		isUnlocked: (ctx) => ctx.totalHours >= 500,
		getValue: (ctx) => `${Math.round(ctx.totalHours)}h`,
	},
	{
		id: "obsessed",
		title: "Obsessed",
		description: "Spent 200+ hours on a single game",
		icon: "IoSkull",
		rarity: "legendary",
		isUnlocked: (ctx) => ctx.mostPlayedHours >= 200,
		getValue: (ctx) => ctx.mostPlayedGameName,
	},
	{
		id: "no-life",
		title: "No Life",
		description: "Completed a 12+ hour gaming session",
		icon: "IoWarning",
		rarity: "legendary",
		isUnlocked: (ctx) => ctx.longestSessionHours >= 12,
		getValue: (ctx) => `${Math.round(ctx.longestSessionHours * 10) / 10}h`,
	},
	{
		id: "collector",
		title: "Collector",
		description: "Played 50 or more different games",
		icon: "IoGrid",
		rarity: "legendary",
		isUnlocked: (ctx) => ctx.totalGamesPlayed >= 50,
		getValue: (ctx) => ctx.totalGamesPlayed,
	},
	{
		id: "iron-will",
		title: "Iron Will",
		description: "Achieved a 60+ day gaming streak",
		icon: "IoPulse",
		rarity: "legendary",
		isUnlocked: (ctx) => ctx.longestStreakDays >= 60,
		getValue: (ctx) => `${ctx.longestStreakDays} days`,
	},
	{
		id: "session-maniac",
		title: "Session Maniac",
		description: "Started 500+ gaming sessions",
		icon: "IoInfinite",
		rarity: "legendary",
		isUnlocked: (ctx) => ctx.totalSessions >= 500,
		getValue: (ctx) => ctx.totalSessions,
	},

	// SPECIAL ACHIEVEMENTS
	{
		id: "balanced",
		title: "Perfectly Balanced",
		description: "Almost equal weekday and weekend playtime (45-55%)",
		icon: "IoScale",
		rarity: "rare",
		isUnlocked: (ctx) =>
			ctx.weekendPercentage >= 45 && ctx.weekendPercentage <= 55,
		getValue: (ctx) => `${Math.round(ctx.weekendPercentage)}% weekend`,
	},
	{
		id: "comeback-kid",
		title: "Comeback Kid",
		description: "Returned to a game after 6+ months",
		icon: "IoRefresh",
		rarity: "rare",
		isUnlocked: (ctx) => ctx.hasComebackGame,
		getValue: (ctx) => ctx.comebackGameName || "N/A",
	},
	{
		id: "focused",
		title: "Laser Focused",
		description: "Spent 80%+ of your time on your top 3 games",
		icon: "IoEye",
		rarity: "uncommon",
		isUnlocked: (ctx) => ctx.top3Percentage >= 80,
		getValue: (ctx) => `${Math.round(ctx.top3Percentage)}%`,
	},
	{
		id: "adventurer",
		title: "Adventurer",
		description: "No single game is more than 25% of your playtime",
		icon: "IoMap",
		rarity: "rare",
		isUnlocked: (ctx) =>
			ctx.allGamesCount >= 4 && ctx.mostPlayedPercentage <= 25,
		getValue: (ctx) => `${Math.round(ctx.mostPlayedPercentage)}% max`,
	},
	{
		id: "consistent-player",
		title: "Daily Driver",
		description: "Played every day for an entire month",
		icon: "IoCheckmarkDone",
		rarity: "epic",
		isUnlocked: (ctx) => ctx.longestStreakDays >= 30,
		getValue: (ctx) => `${ctx.longestStreakDays} days`,
	},
	{
		id: "peak-performer",
		title: "Peak Performer",
		description: "Played 50+ hours in a single month",
		icon: "IoTrendingUp",
		rarity: "rare",
		isUnlocked: (ctx) => ctx.peakMonthHours >= 50,
		getValue: (ctx) => `${Math.round(ctx.peakMonthHours)}h`,
	},
	{
		id: "hibernator",
		title: "Hibernator",
		description: "Took a month off but came back strong",
		icon: "IoSnow",
		rarity: "uncommon",
		isUnlocked: (ctx) => ctx.zeroMonths >= 1 && ctx.monthsPlayed >= 6,
		getValue: (ctx) => `${ctx.zeroMonths} month(s) off`,
	},
	{
		id: "data-collector",
		title: "Data Collector",
		description: "Generated your Year Replay",
		icon: "IoAnalytics",
		rarity: "common",
		isUnlocked: () => true,
		getValue: () => "2025",
	},
];

export function buildAchievementContext(
	summary: YearReplaySummary,
	allGames: YearReplayGame[],
	longestStreak: PlayStreak,
	newGamesThisYear: YearReplayGame[],
	monthlyBreakdown: MonthlyPlayTime[],
	insights: YearReplayInsights,
): AchievementContext {
	const mostPlayedGame = allGames[0];
	const weekendPercentage = 100 - insights.weekdayVsWeekend.weekdayPercentage;
	const oneAndDoneGames = allGames.filter((g) => g.sessions === 1);
	const loyalGames = allGames.filter((g) => g.longestStreak >= 30);
	const isWeekendGamer =
		insights.mostActiveDay.dayName === "Saturday" ||
		insights.mostActiveDay.dayName === "Sunday";

	const top3Time = allGames
		.slice(0, 3)
		.reduce((sum, g) => sum + g.totalTime, 0);
	const top3Percentage =
		summary.totalPlayTime > 0 ? (top3Time / summary.totalPlayTime) * 100 : 0;

	const comebackGames = allGames.filter((g) => {
		if (!g.firstPlayedDate || !g.lastPlayedDate) return false;
		const first = parseISO(g.firstPlayedDate);
		const last = parseISO(g.lastPlayedDate);
		return differenceInDays(last, first) >= 180;
	});

	const zeroMonths = monthlyBreakdown.filter((m) => m.playTime === 0).length;
	const peakMonthHours =
		Math.max(...monthlyBreakdown.map((m) => m.playTime)) / 3600;

	return {
		totalHours: summary.totalPlayTime / 3600,
		mostPlayedHours: mostPlayedGame ? mostPlayedGame.totalTime / 3600 : 0,
		mostPlayedGameName: mostPlayedGame?.game.name || "N/A",
		longestSessionHours: insights.longestSingleSession
			? insights.longestSingleSession.duration / 3600
			: 0,
		totalSessions: summary.totalSessions,
		totalGamesPlayed: summary.totalGamesPlayed,
		newGamesCount: newGamesThisYear.length,
		monthsPlayed: insights.monthsPlayed,
		longestStreakDays: longestStreak.days,
		weekendPercentage,
		weekdayPercentage: insights.weekdayVsWeekend.weekdayPercentage,
		mostActiveDayName: insights.mostActiveDay.dayName,
		oneAndDoneCount: oneAndDoneGames.length,
		loyalGameName: loyalGames[0]?.game.name || null,
		isWeekendGamer,
		top3Percentage,
		mostPlayedPercentage: mostPlayedGame?.percentageOfTotal || 0,
		peakMonthHours,
		zeroMonths,
		hasLoyalGame: loyalGames.length > 0,
		hasComebackGame: comebackGames.length > 0,
		comebackGameName: comebackGames[0]?.game.name || "N/A",
		allGamesCount: allGames.length,
	};
}

export function computeAchievements(
	context: AchievementContext,
): YearReplayAchievement[] {
	return ACHIEVEMENTS.map((def) => ({
		id: def.id,
		title: typeof def.title === "function" ? def.title(context) : def.title,
		description:
			typeof def.description === "function"
				? def.description(context)
				: def.description,
		icon: def.icon,
		rarity: def.rarity,
		unlocked: def.isUnlocked(context),
		value: def.getValue(context),
	}));
}
