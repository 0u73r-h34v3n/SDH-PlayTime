import { describe, expect, test } from "bun:test";
import { parseLocalDate, toIsoDateOnly } from "@utils/formatters";

describe("parseLocalDate", () => {
	test("should parse date-only string preserving the correct year, month, and day", () => {
		const date = parseLocalDate("2024-01-15");

		expect(date.getFullYear()).toBe(2024);
		expect(date.getMonth()).toBe(0); // January = 0
		expect(date.getDate()).toBe(15);
	});

	test("should set time to local midnight (00:00:00)", () => {
		const date = parseLocalDate("2024-06-20");

		expect(date.getHours()).toBe(0);
		expect(date.getMinutes()).toBe(0);
		expect(date.getSeconds()).toBe(0);
	});

	test("should preserve the correct weekday (regression: off-by-one in negative UTC offsets)", () => {
		// 2024-01-15 is a Monday
		const date = parseLocalDate("2024-01-15");
		expect(date.getDay()).toBe(1); // Monday = 1

		// 2024-03-01 is a Friday
		const friday = parseLocalDate("2024-03-01");
		expect(friday.getDay()).toBe(5); // Friday = 5

		// 2024-07-04 is a Thursday
		const thursday = parseLocalDate("2024-07-04");
		expect(thursday.getDay()).toBe(4); // Thursday = 4
	});

	test("should handle month boundaries correctly", () => {
		// Last day of January
		const jan31 = parseLocalDate("2024-01-31");
		expect(jan31.getDate()).toBe(31);
		expect(jan31.getMonth()).toBe(0);

		// First day of February
		const feb1 = parseLocalDate("2024-02-01");
		expect(feb1.getDate()).toBe(1);
		expect(feb1.getMonth()).toBe(1);
	});

	test("should handle year boundaries correctly", () => {
		const newYearsEve = parseLocalDate("2024-12-31");
		expect(newYearsEve.getFullYear()).toBe(2024);
		expect(newYearsEve.getMonth()).toBe(11);
		expect(newYearsEve.getDate()).toBe(31);

		const newYearsDay = parseLocalDate("2025-01-01");
		expect(newYearsDay.getFullYear()).toBe(2025);
		expect(newYearsDay.getMonth()).toBe(0);
		expect(newYearsDay.getDate()).toBe(1);
	});

	test("should handle leap year date correctly", () => {
		const leapDay = parseLocalDate("2024-02-29");
		expect(leapDay.getFullYear()).toBe(2024);
		expect(leapDay.getMonth()).toBe(1);
		expect(leapDay.getDate()).toBe(29);
	});

	test("should NOT parse as UTC (the original bug)", () => {
		// The core regression test:
		// new Date("2024-01-15") parses as UTC midnight, which in EST (UTC-5)
		// becomes 2024-01-14 19:00:00 — getDate() returns 14 instead of 15.
		// parseLocalDate must always return the 15th regardless of timezone.
		const dateStr = "2024-01-15";
		const date = parseLocalDate(dateStr);

		// This is the exact check that would fail with `new Date("2024-01-15")`
		// in any timezone with a negative UTC offset (e.g., EST, CST, PST).
		expect(date.getDate()).toBe(15);
		expect(date.getMonth()).toBe(0);
		expect(date.getFullYear()).toBe(2024);
	});
});

describe("toIsoDateOnly", () => {
	test("should format a Date into YYYY-MM-DD with zero-padded month and day", () => {
		const date = new Date(2024, 0, 5); // Jan 5
		expect(toIsoDateOnly(date)).toBe("2024-01-05");
	});

	test("should handle double-digit months and days", () => {
		const date = new Date(2024, 11, 25); // Dec 25
		expect(toIsoDateOnly(date)).toBe("2024-12-25");
	});

	test("should zero-pad single-digit months and days", () => {
		const date = new Date(2024, 2, 9); // Mar 9
		expect(toIsoDateOnly(date)).toBe("2024-03-09");
	});
});

describe("parseLocalDate <-> toIsoDateOnly roundtrip", () => {
	const dateStrings = [
		"2024-01-01",
		"2024-01-15",
		"2024-02-29",
		"2024-06-15",
		"2024-07-04",
		"2024-09-30",
		"2024-12-31",
		"2025-03-09",
	];

	for (const dateStr of dateStrings) {
		test(`roundtrip: toIsoDateOnly(parseLocalDate("${dateStr}")) === "${dateStr}"`, () => {
			const parsed = parseLocalDate(dateStr);
			const formatted = toIsoDateOnly(parsed);

			expect(formatted).toBe(dateStr);
		});
	}
});

describe("Simulated WeekView weekday extraction (regression)", () => {
	test("should display correct weekday names for a week of dates", () => {
		// Simulates what WeekView does: takes date strings from the backend
		// and derives the weekday name. This was the user-reported bug —
		// weekdays were shifted by one day for EST/CST users.
		const weekDates = [
			{ date: "2024-01-15", expectedDay: "Monday" },
			{ date: "2024-01-16", expectedDay: "Tuesday" },
			{ date: "2024-01-17", expectedDay: "Wednesday" },
			{ date: "2024-01-18", expectedDay: "Thursday" },
			{ date: "2024-01-19", expectedDay: "Friday" },
			{ date: "2024-01-20", expectedDay: "Saturday" },
			{ date: "2024-01-21", expectedDay: "Sunday" },
		];

		for (const { date: dateStr, expectedDay } of weekDates) {
			const date = parseLocalDate(dateStr);
			const dayName = date.toLocaleString("en-us", { weekday: "long" });

			expect(dayName).toBe(expectedDay);
		}
	});
});

describe("Simulated MonthView day-of-month extraction (regression)", () => {
	test("should return correct day-of-month numbers from date strings", () => {
		// MonthView uses getDate() to get the day-of-month for bar chart labels.
		// With the UTC bug, a date like "2024-01-15" would return 14 in EST.
		const dates = [
			{ date: "2024-01-01", expectedDayOfMonth: 1 },
			{ date: "2024-01-15", expectedDayOfMonth: 15 },
			{ date: "2024-01-31", expectedDayOfMonth: 31 },
			{ date: "2024-02-29", expectedDayOfMonth: 29 },
		];

		for (const { date: dateStr, expectedDayOfMonth } of dates) {
			const date = parseLocalDate(dateStr);
			expect(date.getDate()).toBe(expectedDayOfMonth);
		}
	});
});
