import { en, type TranslationKey } from "./locales/en";
import { fr } from "./locales/fr";

export type { TranslationKey };
export type Locale = "en" | "fr";

const DICTIONARIES: Record<Locale, Record<TranslationKey, string>> = {
	en,
	fr,
};

/** Short month names, indexed from January. Index 0-11. */
const MONTH_NAMES: Record<Locale, readonly string[]> = {
	en: [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	],
	fr: [
		"janv.",
		"févr.",
		"mars",
		"avr.",
		"mai",
		"juin",
		"juil.",
		"août",
		"sept.",
		"oct.",
		"nov.",
		"déc.",
	],
};

/** Full day names, indexed from Sunday (JavaScript `Date#getDay`). */
const DAY_NAMES: Record<Locale, readonly string[]> = {
	en: [
		"Sunday",
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
	],
	fr: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
};

const CANONICAL_MONTHS = MONTH_NAMES.en;
const CANONICAL_FULL_MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
] as const;
const CANONICAL_DAYS = DAY_NAMES.en;

function detectLocale(): Locale {
	try {
		const candidates = [
			navigator.language,
			...(navigator.languages ?? []),
		].filter(Boolean);

		for (const candidate of candidates) {
			if (candidate.toLowerCase().startsWith("fr")) {
				return "fr";
			}
		}
	} catch {
		// `navigator` is not available in every runtime (e.g. tests).
	}

	return "en";
}

let currentLocale: Locale = detectLocale();

export function getLocale(): Locale {
	return currentLocale;
}

export function setLocale(locale: Locale): void {
	currentLocale = locale;
}

/** BCP 47 tag used for `toLocale*` formatting. */
export function getDateLocale(): string {
	return currentLocale === "fr" ? "fr-FR" : "en-US";
}

export function getMonthNames(): readonly string[] {
	return MONTH_NAMES[currentLocale] ?? MONTH_NAMES.en;
}

export function getDayNames(): readonly string[] {
	return DAY_NAMES[currentLocale] ?? DAY_NAMES.en;
}

export function t(
	key: TranslationKey,
	vars?: Record<string, string | number>,
): string {
	const dictionary = DICTIONARIES[currentLocale] ?? DICTIONARIES.en;
	const value = dictionary[key] ?? DICTIONARIES.en[key] ?? key;

	if (!vars) {
		return value;
	}

	return value.replace(/\{(\w+)\}/g, (match, name: string) =>
		name in vars ? String(vars[name]) : match,
	);
}

/** Translate a canonical English month name (short or full) for display. */
export function localizeMonthName(month: string): string {
	const shortIndex = CANONICAL_MONTHS.indexOf(month);

	if (shortIndex !== -1) {
		return getMonthNames()[shortIndex] ?? month;
	}

	const fullIndex = CANONICAL_FULL_MONTHS.indexOf(
		month as (typeof CANONICAL_FULL_MONTHS)[number],
	);

	return fullIndex === -1 ? month : (getMonthNames()[fullIndex] ?? month);
}

/** Translate a canonical English full day name for display. */
export function localizeDayName(day: string): string {
	const index = CANONICAL_DAYS.indexOf(day);

	return index === -1 ? day : (getDayNames()[index] ?? day);
}
