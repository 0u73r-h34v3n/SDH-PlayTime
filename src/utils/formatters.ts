import type { Interval } from "@src/app/reports";
import { getDateLocale, t, type TranslationKey } from "@src/i18n";
import { isNil } from "es-toolkit";
import { type Duration, intervalToDuration } from "date-fns";

type DurationUnit = "days" | "hours" | "minutes" | "seconds";

const SHORT_UNIT_KEYS: Record<DurationUnit, TranslationKey> = {
	days: "duration.daysShort",
	hours: "duration.hoursShort",
	minutes: "duration.minutesShort",
	seconds: "duration.secondsShort",
};

const LONG_UNIT_KEYS: Record<DurationUnit, [TranslationKey, TranslationKey]> = {
	days: ["duration.dayOne", "duration.dayMany"],
	hours: ["duration.hourOne", "duration.hourMany"],
	minutes: ["duration.minuteOne", "duration.minuteMany"],
	seconds: ["duration.secondOne", "duration.secondMany"],
};

export {
	formatMonthInterval,
	formatWeekInterval,
	formatYearInterval,
	getDurationInDays,
	getDurationInHours,
	humanReadableTime,
	parseLocalDate,
	toIsoDateOnly,
};

function reduceDuration(
	accumulator: Array<string>,
	key: string,
	duration: Duration,
	withSeconds: boolean,
	short: boolean,
) {
	if (
		key === "seconds" &&
		!withSeconds &&
		// NOTE(ynhhoJ): If `seconds` key is only one in object then we should display it
		Object.keys(duration).length !== 1
	) {
		return accumulator;
	}

	const durationValue = duration[key as keyof Duration];

	if (isNil(durationValue)) {
		return accumulator;
	}

	if (short) {
		const shortKey = SHORT_UNIT_KEYS[key as DurationUnit];
		const suffix = shortKey ? t(shortKey) : key[0];

		accumulator.push(`${durationValue}${suffix}`);

		return accumulator;
	}

	const longKeys = LONG_UNIT_KEYS[key as DurationUnit];
	const durationTime = longKeys
		? t(durationValue === 1 ? longKeys[0] : longKeys[1])
		: durationValue === 1
			? key.slice(0, key.length - 1)
			: key;

	accumulator.push(`${durationValue} ${durationTime}`);

	return accumulator;
}

function getDurationInDays(
	durationInSeconds: number,
	short = true,
	withSeconds = false,
): string {
	let duration: Duration = {};

	if (durationInSeconds === 0) {
		duration = {
			seconds: 0,
		};
	} else {
		duration = intervalToDuration({
			start: new Date(),
			end: Date.now() + durationInSeconds * 1000,
		});
	}

	return Object.keys(duration)
		.reduce<Array<string>>(
			(accumulator, key) =>
				reduceDuration(accumulator, key, duration, withSeconds, short),
			[],
		)
		.join(" ");
}

function getDurationInHours(
	durationInSeconds: number,
	short = true,
	withSeconds = false,
): string {
	const duration: Duration = {};

	const hours = Math.floor(durationInSeconds / 3600);

	if (hours !== 0) {
		duration.hours = hours;
	}

	const minutes = Math.floor((durationInSeconds % 3600) / 60);

	if (minutes !== 0) {
		duration.minutes = minutes;
	}

	const seconds = Math.floor((durationInSeconds % 3600) % 60);

	if ((withSeconds && seconds !== 0) || Object.keys(duration).length === 0) {
		duration.seconds = seconds;
	}

	return Object.keys(duration)
		.reduce<Array<string>>(
			(accumulator, key) =>
				reduceDuration(accumulator, key, duration, withSeconds, short),
			[],
		)
		.join(" ");
}

function humanReadableTime(
	showTimeInHours: boolean,
	durationInSeconds: number,
	short = true,
	withSeconds = false,
) {
	if (showTimeInHours) {
		return getDurationInHours(durationInSeconds, short, withSeconds);
	}

	return getDurationInDays(durationInSeconds, short, withSeconds);
}

/**
 * Parse a date-only string (YYYY-MM-DD) as local midnight.
 *
 * `new Date("YYYY-MM-DD")` and `parseISO("YYYY-MM-DD")` parse date-only strings
 * as UTC midnight, causing off-by-one day errors in negative UTC offset timezones
 * (e.g., EST/UTC-5, CST/UTC-6). Appending "T00:00:00" (without "Z") makes the
 * parser treat it as local time instead.
 */
function parseLocalDate(dateStr: string): Date {
	return new Date(`${dateStr}T00:00:00`);
}

function toIsoDateOnly(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

function formatMonthInterval(interval: Interval) {
	return interval.start.toLocaleDateString(getDateLocale(), {
		month: "long",
		year: "numeric",
	});
}

function formatWeekInterval(interval: Interval) {
	return `${interval.start.toLocaleDateString(getDateLocale(), {
		day: "2-digit",
		month: "long",
	})} - ${interval.end.toLocaleDateString(getDateLocale(), {
		day: "2-digit",
		month: "long",
	})}`;
}

function formatYearInterval(interval: Interval) {
	return `${interval.start.toLocaleDateString(getDateLocale(), {
		year: "numeric",
	})}`;
}
