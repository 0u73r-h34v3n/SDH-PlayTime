import { differenceInDays } from "date-fns";
import { parseLocalDate } from "@utils/formatters";
import { localizeDayName, t } from "@src/i18n";

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
		title: t("achievement.firstSteps.title"),
		description: t("achievement.firstSteps.description"),
		icon: "IoFootsteps",
		rarity: "common",
		isUnlocked: (ctx) => ctx.totalHours > 0,
		getValue: (ctx) => ctx.totalGamesPlayed,
	},
	{
		id: "casual-gamer",
		title: t("achievement.casualGamer.title"),
		description: t("achievement.casualGamer.description"),
		icon: "IoGameController",
		rarity: "common",
		isUnlocked: (ctx) => ctx.totalHours >= 25,
		getValue: (ctx) => `${Math.round(ctx.totalHours)}h`,
	},
	{
		id: "century-club",
		title: t("achievement.centuryClub.title"),
		description: t("achievement.centuryClub.description"),
		icon: "IoTrophy",
		rarity: "rare",
		isUnlocked: (ctx) => ctx.totalHours >= 100,
		getValue: (ctx) => `${Math.round(ctx.totalHours)}h`,
	},
	{
		id: "dedicated-fan",
		title: t("achievement.dedicatedFan.title"),
		description: t("achievement.dedicatedFan.description"),
		icon: "IoHeart",
		rarity: "rare",
		isUnlocked: (ctx) => ctx.mostPlayedHours >= 100,
		getValue: (ctx) => ctx.mostPlayedGameName,
	},

	// SESSION ACHIEVEMENTS
	{
		id: "session-starter",
		title: t("achievement.sessionStarter.title"),
		description: t("achievement.sessionStarter.description"),
		icon: "IoPlay",
		rarity: "common",
		isUnlocked: (ctx) => ctx.totalSessions >= 25,
		getValue: (ctx) => ctx.totalSessions,
	},
	{
		id: "session-pro",
		title: t("achievement.sessionPro.title"),
		description: t("achievement.sessionPro.description"),
		icon: "IoPlayForward",
		rarity: "rare",
		isUnlocked: (ctx) => ctx.totalSessions >= 100,
		getValue: (ctx) => ctx.totalSessions,
	},
	{
		id: "marathon-runner",
		title: t("achievement.marathonRunner.title"),
		description: t("achievement.marathonRunner.description"),
		icon: "IoStopwatch",
		rarity: "uncommon",
		isUnlocked: (ctx) => ctx.longestSessionHours >= 4,
		getValue: (ctx) => `${Math.round(ctx.longestSessionHours * 10) / 10}h`,
	},
	{
		id: "ultra-marathon",
		title: t("achievement.ultraMarathon.title"),
		description: t("achievement.ultraMarathon.description"),
		icon: "IoRocket",
		rarity: "epic",
		isUnlocked: (ctx) => ctx.longestSessionHours >= 8,
		getValue: (ctx) => `${Math.round(ctx.longestSessionHours * 10) / 10}h`,
	},

	// VARIETY ACHIEVEMENTS
	{
		id: "variety-gamer",
		title: t("achievement.varietyGamer.title"),
		description: t("achievement.varietyGamer.description"),
		icon: "IoApps",
		rarity: "uncommon",
		isUnlocked: (ctx) => ctx.totalGamesPlayed >= 10,
		getValue: (ctx) => ctx.totalGamesPlayed,
	},
	{
		id: "library-explorer",
		title: t("achievement.libraryExplorer.title"),
		description: t("achievement.libraryExplorer.description"),
		icon: "IoLibrary",
		rarity: "rare",
		isUnlocked: (ctx) => ctx.totalGamesPlayed >= 25,
		getValue: (ctx) => ctx.totalGamesPlayed,
	},
	{
		id: "explorer",
		title: t("achievement.explorer.title"),
		description: t("achievement.explorer.description"),
		icon: "IoCompass",
		rarity: "uncommon",
		isUnlocked: (ctx) => ctx.newGamesCount >= 5,
		getValue: (ctx) => ctx.newGamesCount,
	},
	{
		id: "treasure-hunter",
		title: t("achievement.treasureHunter.title"),
		description: t("achievement.treasureHunter.description"),
		icon: "IoDiamond",
		rarity: "rare",
		isUnlocked: (ctx) => ctx.newGamesCount >= 15,
		getValue: (ctx) => ctx.newGamesCount,
	},

	// CONSISTENCY ACHIEVEMENTS
	{
		id: "seasonal",
		title: t("achievement.seasonal.title"),
		description: t("achievement.seasonal.description"),
		icon: "IoCalendar",
		rarity: "uncommon",
		isUnlocked: (ctx) => ctx.monthsPlayed >= 6,
		getValue: (ctx) => `${ctx.monthsPlayed}/12`,
	},
	{
		id: "year-round",
		title: t("achievement.yearRound.title"),
		description: t("achievement.yearRound.description"),
		icon: "IoCalendarNumber",
		rarity: "rare",
		isUnlocked: (ctx) => ctx.monthsPlayed === 12,
		getValue: (ctx) => `${ctx.monthsPlayed}/12`,
	},
	{
		id: "streak-starter",
		title: t("achievement.streakStarter.title"),
		description: t("achievement.streakStarter.description"),
		icon: "IoFlash",
		rarity: "uncommon",
		isUnlocked: (ctx) => ctx.longestStreakDays >= 5,
		getValue: (ctx) =>
			t("achievement.valueDays", { count: ctx.longestStreakDays }),
	},
	{
		id: "streak-master",
		title: t("achievement.streakMaster.title"),
		description: t("achievement.streakMaster.description"),
		icon: "IoFlame",
		rarity: "rare",
		isUnlocked: (ctx) => ctx.longestStreakDays >= 14,
		getValue: (ctx) =>
			t("achievement.valueDays", { count: ctx.longestStreakDays }),
	},
	{
		id: "unstoppable",
		title: t("achievement.unstoppable.title"),
		description: t("achievement.unstoppable.description"),
		icon: "IoNuclear",
		rarity: "epic",
		isUnlocked: (ctx) => ctx.longestStreakDays >= 30,
		getValue: (ctx) =>
			t("achievement.valueDays", { count: ctx.longestStreakDays }),
	},

	// DAY PREFERENCE ACHIEVEMENTS
	{
		id: "weekend-warrior",
		title: t("achievement.weekendWarrior.title"),
		description: t("achievement.weekendWarrior.description"),
		icon: "IoMoon",
		rarity: "uncommon",
		isUnlocked: (ctx) => ctx.weekendPercentage >= 60,
		getValue: (ctx) => `${Math.round(ctx.weekendPercentage)}%`,
	},
	{
		id: "workweek-hero",
		title: t("achievement.workweekHero.title"),
		description: t("achievement.workweekHero.description"),
		icon: "IoSunny",
		rarity: "uncommon",
		isUnlocked: (ctx) => ctx.weekdayPercentage >= 80,
		getValue: (ctx) => `${Math.round(ctx.weekdayPercentage)}%`,
	},

	// FUN ACHIEVEMENTS
	{
		id: "favorite-day",
		title: (ctx) =>
			t("achievement.favoriteDay.title", {
				day: localizeDayName(ctx.mostActiveDayName),
			}),
		description: (ctx) =>
			t("achievement.favoriteDay.description", {
				day: localizeDayName(ctx.mostActiveDayName),
			}),
		icon: "IoStar",
		rarity: "common",
		isUnlocked: () => true,
		getValue: (ctx) => ctx.mostActiveDayName,
	},
	{
		id: "one-and-done",
		title: t("achievement.oneAndDone.title"),
		description: t("achievement.oneAndDone.description"),
		icon: "IoCheckmark",
		rarity: "common",
		isUnlocked: (ctx) => ctx.oneAndDoneCount > 0,
		getValue: (ctx) =>
			t("achievement.valueGames", { count: ctx.oneAndDoneCount }),
	},
	{
		id: "loyal-player",
		title: t("achievement.loyalPlayer.title"),
		description: t("achievement.loyalPlayer.description"),
		icon: "IoShield",
		rarity: "epic",
		isUnlocked: (ctx) => ctx.hasLoyalGame,
		getValue: (ctx) => ctx.loyalGameName || "N/A",
	},
	{
		id: "deck-master",
		title: t("achievement.deckMaster.title"),
		description: t("achievement.deckMaster.description"),
		icon: "IoHardwareChip",
		rarity: "common",
		isUnlocked: () => true,
		getValue: () => "Steam Deck",
	},
	{
		id: "night-owl",
		title: t("achievement.nightOwl.title"),
		description: t("achievement.nightOwl.description"),
		icon: "IoBed",
		rarity: "common",
		isUnlocked: (ctx) => ctx.isWeekendGamer,
		getValue: (ctx) => ctx.mostActiveDayName,
	},
	{
		id: "early-bird",
		title: t("achievement.earlyBird.title"),
		description: t("achievement.earlyBird.description"),
		icon: "IoCafe",
		rarity: "common",
		isUnlocked: (ctx) => !ctx.isWeekendGamer && ctx.mostActiveDayName !== "N/A",
		getValue: (ctx) => ctx.mostActiveDayName,
	},

	// LEGENDARY ACHIEVEMENTS
	{
		id: "time-lord",
		title: t("achievement.timeLord.title"),
		description: t("achievement.timeLord.description"),
		icon: "IoTime",
		rarity: "legendary",
		isUnlocked: (ctx) => ctx.totalHours >= 500,
		getValue: (ctx) => `${Math.round(ctx.totalHours)}h`,
	},
	{
		id: "obsessed",
		title: t("achievement.obsessed.title"),
		description: t("achievement.obsessed.description"),
		icon: "IoSkull",
		rarity: "legendary",
		isUnlocked: (ctx) => ctx.mostPlayedHours >= 200,
		getValue: (ctx) => ctx.mostPlayedGameName,
	},
	{
		id: "no-life",
		title: t("achievement.noLife.title"),
		description: t("achievement.noLife.description"),
		icon: "IoWarning",
		rarity: "legendary",
		isUnlocked: (ctx) => ctx.longestSessionHours >= 12,
		getValue: (ctx) => `${Math.round(ctx.longestSessionHours * 10) / 10}h`,
	},
	{
		id: "collector",
		title: t("achievement.collector.title"),
		description: t("achievement.collector.description"),
		icon: "IoGrid",
		rarity: "legendary",
		isUnlocked: (ctx) => ctx.totalGamesPlayed >= 50,
		getValue: (ctx) => ctx.totalGamesPlayed,
	},
	{
		id: "iron-will",
		title: t("achievement.ironWill.title"),
		description: t("achievement.ironWill.description"),
		icon: "IoPulse",
		rarity: "legendary",
		isUnlocked: (ctx) => ctx.longestStreakDays >= 60,
		getValue: (ctx) =>
			t("achievement.valueDays", { count: ctx.longestStreakDays }),
	},
	{
		id: "session-maniac",
		title: t("achievement.sessionManiac.title"),
		description: t("achievement.sessionManiac.description"),
		icon: "IoInfinite",
		rarity: "legendary",
		isUnlocked: (ctx) => ctx.totalSessions >= 500,
		getValue: (ctx) => ctx.totalSessions,
	},

	// SPECIAL ACHIEVEMENTS
	{
		id: "balanced",
		title: t("achievement.balanced.title"),
		description: t("achievement.balanced.description"),
		icon: "IoScale",
		rarity: "rare",
		isUnlocked: (ctx) =>
			ctx.weekendPercentage >= 45 && ctx.weekendPercentage <= 55,
		getValue: (ctx) =>
			t("achievement.valuePercentWeekend", {
				percent: Math.round(ctx.weekendPercentage),
			}),
	},
	{
		id: "comeback-kid",
		title: t("achievement.comebackKid.title"),
		description: t("achievement.comebackKid.description"),
		icon: "IoRefresh",
		rarity: "rare",
		isUnlocked: (ctx) => ctx.hasComebackGame,
		getValue: (ctx) => ctx.comebackGameName || "N/A",
	},
	{
		id: "focused",
		title: t("achievement.focused.title"),
		description: t("achievement.focused.description"),
		icon: "IoEye",
		rarity: "uncommon",
		isUnlocked: (ctx) => ctx.top3Percentage >= 80,
		getValue: (ctx) => `${Math.round(ctx.top3Percentage)}%`,
	},
	{
		id: "adventurer",
		title: t("achievement.adventurer.title"),
		description: t("achievement.adventurer.description"),
		icon: "IoMap",
		rarity: "rare",
		isUnlocked: (ctx) =>
			ctx.allGamesCount >= 4 && ctx.mostPlayedPercentage <= 25,
		getValue: (ctx) =>
			t("achievement.valuePercentMax", {
				percent: Math.round(ctx.mostPlayedPercentage),
			}),
	},
	{
		id: "consistent-player",
		title: t("achievement.dailyDriver.title"),
		description: t("achievement.dailyDriver.description"),
		icon: "IoCheckmarkDone",
		rarity: "epic",
		isUnlocked: (ctx) => ctx.longestStreakDays >= 30,
		getValue: (ctx) =>
			t("achievement.valueDays", { count: ctx.longestStreakDays }),
	},
	{
		id: "peak-performer",
		title: t("achievement.peakPerformer.title"),
		description: t("achievement.peakPerformer.description"),
		icon: "IoTrendingUp",
		rarity: "rare",
		isUnlocked: (ctx) => ctx.peakMonthHours >= 50,
		getValue: (ctx) => `${Math.round(ctx.peakMonthHours)}h`,
	},
	{
		id: "hibernator",
		title: t("achievement.hibernator.title"),
		description: t("achievement.hibernator.description"),
		icon: "IoSnow",
		rarity: "uncommon",
		isUnlocked: (ctx) => ctx.zeroMonths >= 1 && ctx.monthsPlayed >= 6,
		getValue: (ctx) =>
			t("achievement.valueMonthsOff", { count: ctx.zeroMonths }),
	},
	{
		id: "data-collector",
		title: t("achievement.dataCollector.title"),
		description: t("achievement.dataCollector.description"),
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
		const first = parseLocalDate(g.firstPlayedDate);
		const last = parseLocalDate(g.lastPlayedDate);
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
