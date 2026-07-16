import { describe, expect, test } from "bun:test";
import { convertDailyStatisticsToGameWithTime } from "@src/app/model";

describe("convertDailyStatisticsToGameWithTime", () => {
	test("aggregates games across days while preserving order and sessions", () => {
		const firstSession = {
			date: "2026-07-14",
			duration: 60,
		};
		const secondSession = {
			date: "2026-07-15",
			duration: 120,
		};
		const data: DailyStatistics[] = [
			{
				date: "2026-07-14",
				total: 180,
				games: [
					{
						game: { id: "1", name: "Game One" },
						totalTime: 60,
						sessions: [firstSession],
					},
					{
						game: { id: "2", name: "Game Two" },
						totalTime: 120,
						sessions: [],
					},
				],
			},
			{
				date: "2026-07-15",
				total: 180,
				games: [
					{
						game: { id: "1", name: "Game One" },
						totalTime: 120,
						sessions: [secondSession],
					},
					{
						game: { id: "3", name: "Game Three" },
						totalTime: 60,
						sessions: [],
					},
				],
			},
		];

		const result = convertDailyStatisticsToGameWithTime(data);

		expect(result).toEqual([
			{
				game: { id: "1", name: "Game One" },
				totalTime: 180,
				sessions: [firstSession, secondSession],
			},
			{
				game: { id: "2", name: "Game Two" },
				totalTime: 120,
				sessions: [],
			},
			{
				game: { id: "3", name: "Game Three" },
				totalTime: 60,
				sessions: [],
			},
		]);
	});

	test("returns an empty list for empty statistics", () => {
		expect(convertDailyStatisticsToGameWithTime([])).toEqual([]);
	});
});
