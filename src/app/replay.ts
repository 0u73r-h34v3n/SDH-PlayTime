import {
	startOfYear,
	endOfYear,
	format,
	differenceInDays,
	parseISO,
	getDay,
	isWeekend,
	getYear,
} from "date-fns";
import type { Reports } from "./reports";
import { buildAchievementContext, computeAchievements } from "./achievements";
import { REPLAY_YEAR, MONTH_NAMES, DAY_NAMES } from "./replay.constants";
import { Backend } from "./backend";
import { toIsoDateOnly } from "@utils/formatters";

/**
 * Service to compute Year Replay statistics from existing data
 */
export class ReplayService {
	private reports: Reports;
	private year: number;

	constructor(reports: Reports, year?: number) {
		this.reports = reports;
		this.year = year || REPLAY_YEAR;
	}

	async fetchYearData(): Promise<DailyStatistics[]> {
		const yearStart = startOfYear(new Date(this.year, 0, 1));
		const yearEnd = endOfYear(yearStart);
		const today = new Date();
		const effectiveEnd = yearEnd > today ? today : yearEnd;

		const paginated = await this.reports.yearlyStatisticsForReplay(
			yearStart,
			effectiveEnd,
		);

		return paginated.current().data;
	}

	async computeReplayData(): Promise<YearReplayData> {
		const dailyData = await this.fetchYearData();
		const yearStart = startOfYear(new Date(this.year, 0, 1));

		const summary = this.computeSummary(dailyData);
		const allGames = await this.computeGameStats(
			dailyData,
			summary.totalPlayTime,
			yearStart,
		);
		const topGames = [...allGames]
			.sort((a, b) => b.totalTime - a.totalTime)
			.slice(0, 10);
		const longestStreak = this.computeLongestStreak(dailyData);
		const newGamesThisYear = allGames.filter((g) => g.isFirstPlayedThisYear);
		const monthlyBreakdown = this.computeMonthlyBreakdown(dailyData);
		const insights = this.computeInsights(
			dailyData,
			allGames,
			monthlyBreakdown,
		);

		const achievementContext = buildAchievementContext(
			summary,
			allGames,
			longestStreak,
			newGamesThisYear,
			monthlyBreakdown,
			insights,
		);
		const achievements = computeAchievements(achievementContext);

		return {
			summary,
			topGames,
			allGames,
			longestStreak,
			newGamesThisYear,
			monthlyBreakdown,
			insights,
			achievements,
		};
	}

	private computeSummary(dailyData: DailyStatistics[]): YearReplaySummary {
		const daysWithPlayTime = dailyData.filter((d) => d.total > 0);
		const totalPlayTime = dailyData.reduce((sum, d) => sum + d.total, 0);
		const totalSessions = dailyData.reduce(
			(sum, d) => sum + d.games.reduce((gs, g) => gs + g.sessions.length, 0),
			0,
		);

		const uniqueGames = new Set<string>();
		for (const day of dailyData) {
			for (const game of day.games) {
				uniqueGames.add(game.game.id);
			}
		}

		const monthlyTotals: Record<string, number> = {};
		for (const day of dailyData) {
			const month = format(parseISO(day.date), "MMMM");
			monthlyTotals[month] = (monthlyTotals[month] || 0) + day.total;
		}

		let mostPlayedMonth = "";
		let mostPlayedMonthTime = 0;
		for (const [month, time] of Object.entries(monthlyTotals)) {
			if (time > mostPlayedMonthTime) {
				mostPlayedMonth = month;
				mostPlayedMonthTime = time;
			}
		}

		return {
			year: getYear(parseISO(dailyData[0].date)) || REPLAY_YEAR,
			totalPlayTime,
			totalSessions,
			totalGamesPlayed: uniqueGames.size,
			totalDaysPlayed: daysWithPlayTime.length,
			averageSessionLength:
				totalSessions > 0 ? totalPlayTime / totalSessions : 0,
			averageDailyPlayTime:
				daysWithPlayTime.length > 0
					? totalPlayTime / daysWithPlayTime.length
					: 0,
			mostPlayedMonth,
			mostPlayedMonthTime,
		};
	}

	/**
	 * Compute per-game statistics
	 */
	private async computeGameStats(
		dailyData: DailyStatistics[],
		totalPlayTime: number,
		yearStart: Date,
	): Promise<YearReplayGame[]> {
		const gameMap = new Map<
			string,
			{
				game: Game;
				totalTime: number;
				sessions: SessionInformation[];
				datesPlayed: Set<string>;
				firstPlayedDate: string;
				lastPlayedDate: string;
				monthlyPlayTime: Map<number, { time: number; sessions: number }>;
			}
		>();

		for (const day of dailyData) {
			for (const gameData of day.games) {
				const gameId = gameData.game.id;
				let entry = gameMap.get(gameId);

				if (!entry) {
					entry = {
						game: gameData.game,
						totalTime: 0,
						sessions: [],
						datesPlayed: new Set(),
						firstPlayedDate: day.date,
						lastPlayedDate: day.date,
						monthlyPlayTime: new Map(),
					};
					gameMap.set(gameId, entry);
				}

				entry.totalTime += gameData.totalTime;
				entry.sessions.push(...gameData.sessions);
				entry.datesPlayed.add(day.date);
				entry.lastPlayedDate = day.date;

				const monthIndex = parseISO(day.date).getMonth();
				const monthData = entry.monthlyPlayTime.get(monthIndex) || {
					time: 0,
					sessions: 0,
				};
				monthData.time += gameData.totalTime;
				monthData.sessions += gameData.sessions.length;
				entry.monthlyPlayTime.set(monthIndex, monthData);
			}
		}

		const games: YearReplayGame[] = [];
		const yearStartIso = toIsoDateOnly(yearStart);

		for (const [gameId, entry] of gameMap) {
			const longestSession = Math.max(
				...entry.sessions.map((s) => s.duration),
				0,
			);
			const longestStreak = this.computeGameStreak(
				Array.from(entry.datesPlayed),
			);

			const hadDataBeforeYear = await Backend.hasDataBefore(
				yearStartIso,
				gameId,
			);
			const isFirstPlayedThisYear = !hadDataBeforeYear;

			const monthlyPlayTime: MonthlyPlayTime[] = MONTH_NAMES.map((month, i) => {
				const monthData = entry.monthlyPlayTime.get(i) || {
					time: 0,
					sessions: 0,
				};
				return {
					month,
					monthIndex: i,
					playTime: monthData.time,
					sessions: monthData.sessions,
				};
			});

			games.push({
				game: entry.game,
				totalTime: entry.totalTime,
				sessions: entry.sessions.length,
				firstPlayedDate: entry.firstPlayedDate,
				lastPlayedDate: entry.lastPlayedDate,
				percentageOfTotal:
					totalPlayTime > 0 ? (entry.totalTime / totalPlayTime) * 100 : 0,
				longestSession,
				averageSessionLength:
					entry.sessions.length > 0
						? entry.totalTime / entry.sessions.length
						: 0,
				isFirstPlayedThisYear,
				monthlyPlayTime,
				longestStreak,
			});
		}

		return games.sort((a, b) => b.totalTime - a.totalTime);
	}

	/**
	 * Compute longest consecutive day streak for a game
	 */
	private computeGameStreak(dates: string[]): number {
		if (dates.length === 0) return 0;

		const sortedDates = [...dates].sort();
		let maxStreak = 1;
		let currentStreak = 1;

		for (let i = 1; i < sortedDates.length; i++) {
			const prevDate = parseISO(sortedDates[i - 1]);
			const currDate = parseISO(sortedDates[i]);
			const diff = differenceInDays(currDate, prevDate);

			if (diff === 1) {
				currentStreak++;
				maxStreak = Math.max(maxStreak, currentStreak);
			} else if (diff > 1) {
				currentStreak = 1;
			}
		}

		return maxStreak;
	}

	/**
	 * Compute the longest play streak across all games
	 */
	private computeLongestStreak(dailyData: DailyStatistics[]): PlayStreak {
		const daysWithPlay = dailyData
			.filter((d) => d.total > 0)
			.sort((a, b) => a.date.localeCompare(b.date));

		if (daysWithPlay.length === 0) {
			return {
				startDate: "",
				endDate: "",
				days: 0,
				gamesPlayed: [],
			};
		}

		const uniqueDays: DailyStatistics[] = [];
		const seenDates = new Set<string>();

		for (const day of daysWithPlay) {
			if (!seenDates.has(day.date)) {
				seenDates.add(day.date);
				uniqueDays.push(day);
			}
		}

		if (uniqueDays.length === 0) {
			return {
				startDate: "",
				endDate: "",
				days: 0,
				gamesPlayed: [],
			};
		}

		let maxStreak = { start: 0, end: 0, days: 1 };
		let currentStreak = { start: 0, end: 0, days: 1 };

		for (let i = 1; i < uniqueDays.length; i++) {
			const prevDate = parseISO(uniqueDays[i - 1].date);
			const currDate = parseISO(uniqueDays[i].date);
			const diff = differenceInDays(currDate, prevDate);

			if (diff === 1) {
				currentStreak.end = i;
				currentStreak.days++;

				if (currentStreak.days > maxStreak.days) {
					maxStreak = { ...currentStreak };
				}
			} else {
				currentStreak = { start: i, end: i, days: 1 };
			}
		}

		const streakDays = uniqueDays.slice(maxStreak.start, maxStreak.end + 1);
		const gamesInStreak = new Map<
			string,
			{ game: Game; totalTime: number; sessions: number }
		>();

		for (const day of streakDays) {
			for (const gameData of day.games) {
				const entry = gamesInStreak.get(gameData.game.id) || {
					game: gameData.game,
					totalTime: 0,
					sessions: 0,
				};
				entry.totalTime += gameData.totalTime;
				entry.sessions += gameData.sessions.length;
				gamesInStreak.set(gameData.game.id, entry);
			}
		}

		return {
			startDate: uniqueDays[maxStreak.start]?.date || "",
			endDate: uniqueDays[maxStreak.end]?.date || "",
			days: maxStreak.days,
			gamesPlayed: Array.from(gamesInStreak.values()).sort(
				(a, b) => b.totalTime - a.totalTime,
			),
		};
	}

	private computeMonthlyBreakdown(
		dailyData: DailyStatistics[],
	): MonthlyPlayTime[] {
		const monthlyData = new Map<number, { time: number; sessions: number }>();

		for (const day of dailyData) {
			const monthIndex = parseISO(day.date).getMonth();
			const entry = monthlyData.get(monthIndex) || { time: 0, sessions: 0 };
			entry.time += day.total;
			entry.sessions += day.games.reduce(
				(sum, g) => sum + g.sessions.length,
				0,
			);
			monthlyData.set(monthIndex, entry);
		}

		return MONTH_NAMES.map((month, index) => {
			const data = monthlyData.get(index) || { time: 0, sessions: 0 };
			return {
				month,
				monthIndex: index,
				playTime: data.time,
				sessions: data.sessions,
			};
		});
	}

	private computeInsights(
		dailyData: DailyStatistics[],
		allGames: YearReplayGame[],
		monthlyBreakdown: MonthlyPlayTime[],
	): YearReplayInsights {
		let longestSingleSession: YearReplayInsights["longestSingleSession"] = null;
		for (const day of dailyData) {
			for (const gameData of day.games) {
				for (const session of gameData.sessions) {
					if (
						!longestSingleSession ||
						session.duration > longestSingleSession.duration
					) {
						longestSingleSession = {
							game: gameData.game,
							duration: session.duration,
							date: day.date,
						};
					}
				}
			}
		}

		let weekdayTime = 0;
		let weekendTime = 0;
		for (const day of dailyData) {
			const date = parseISO(day.date);
			if (isWeekend(date)) {
				weekendTime += day.total;
			} else {
				weekdayTime += day.total;
			}
		}
		const totalTime = weekdayTime + weekendTime;

		const dayTotals: Record<number, { total: number; count: number }> = {};

		for (const day of dailyData) {
			if (day.total > 0) {
				const dayOfWeek = getDay(parseISO(day.date));
				if (!dayTotals[dayOfWeek]) {
					dayTotals[dayOfWeek] = { total: 0, count: 0 };
				}
				dayTotals[dayOfWeek].total += day.total;
				dayTotals[dayOfWeek].count++;
			}
		}

		let mostActiveDay = { dayName: "N/A", totalTime: 0, averageTime: 0 };
		for (const [dayIndex, data] of Object.entries(dayTotals)) {
			if (data.total > mostActiveDay.totalTime) {
				mostActiveDay = {
					dayName: DAY_NAMES[Number(dayIndex)],
					totalTime: data.total,
					averageTime: data.count > 0 ? data.total / data.count : 0,
				};
			}
		}

		const monthsPlayed = monthlyBreakdown.filter((m) => m.playTime > 0).length;

		const oneSessionGames = allGames.filter((g) => g.sessions === 1).length;

		const totalHours = totalTime / 3600;
		const funTimeComparisons = {
			movies: Math.floor(totalHours / 2), // ~2h per movie
			books: Math.floor(totalHours / 8), // ~8h per book
			flights: Math.round((totalHours / 12) * 10) / 10, // ~12h transatlantic flight
			marathons: Math.round((totalHours / 4) * 10) / 10, // ~4h per marathon
		};

		return {
			longestSingleSession,
			weekdayVsWeekend: {
				weekdayHours: weekdayTime,
				weekendHours: weekendTime,
				weekdayPercentage: totalTime > 0 ? (weekdayTime / totalTime) * 100 : 0,
			},
			mostActiveDay,
			monthsPlayed,
			oneSessionGames,
			funTimeComparisons,
		};
	}
}
