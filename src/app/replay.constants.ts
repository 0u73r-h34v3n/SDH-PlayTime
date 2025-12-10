/**
 * Constants for the Year Replay feature
 */

/** The minimum year for which replay is available */
export const REPLAY_MIN_YEAR = 2025;

/**
 * Get the default replay year based on current date
 * From December 15 [year] to January 7 [year+1], shows replay for [year]
 * Otherwise shows replay for the most recent completed year
 */
export function getDefaultReplayYear(): number {
	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth(); // 0-11
	const currentDay = now.getDate();

	// From Dec 15 to Dec 31
	if (currentMonth === 11 && currentDay >= 15) {
		return currentYear;
	}

	// From Jan 1 to Jan 7
	if (currentMonth === 0 && currentDay <= 7) {
		return currentYear - 1;
	}

	return currentYear;
}

export function getAvailableReplayYears(): number[] {
	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth();
	const currentDay = now.getDate();

	// Determine the latest available year
	let latestYear: number;

	if (currentMonth === 11 && currentDay >= 15) {
		// Dec 15-31: current year is available
		latestYear = currentYear;
	} else if (currentMonth === 0 && currentDay <= 7) {
		// Jan 1-7: previous year is available
		latestYear = currentYear - 1;
	} else {
		// Rest of year: previous year is the latest
		latestYear = currentYear - 1;
	}

	const years: number[] = [];

	for (let year = REPLAY_MIN_YEAR; year <= latestYear; year++) {
		years.push(year);
	}

	return years.reverse();
}

/** The year for which the replay is generated (for backward compatibility) */
export const REPLAY_YEAR = getDefaultReplayYear();

/** Gamepad button constants */
export const GAMEPAD_BUTTON_B = 2;

/** Short month names for charts and displays */
export const MONTH_NAMES = [
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
] as const;

/** Full day names for insights */
export const DAY_NAMES = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
] as const;

/** Time conversion constants (in seconds) */
export const TIME_CONSTANTS = {
	HOURS_IN_SECONDS: 3600,
	MOVIE_DURATION_HOURS: 2,
	BOOK_READING_HOURS: 8,
	TRANSATLANTIC_FLIGHT_HOURS: 12,
	MARATHON_HOURS: 4,
} as const;

/** Fun facts comparison types */
export type FunFactComparison = {
	id: string;
	icon: string;
	label: string;
	subtitle: string;
	hoursPerUnit: number;
};

export const FUN_FACT_COMPARISONS: FunFactComparison[] = [
	{
		id: "movies",
		icon: "IoFilm",
		label: "Movies Watched",
		subtitle: "@ 2 hours each",
		hoursPerUnit: 2,
	},
	{
		id: "books",
		icon: "IoBook",
		label: "Books Read",
		subtitle: "@ 8 hours each",
		hoursPerUnit: 8,
	},
	{
		id: "flights",
		icon: "IoAirplane",
		label: "Transatlantic Flights",
		subtitle: "@ 12 hours each",
		hoursPerUnit: 12,
	},
	{
		id: "marathons",
		icon: "IoBody",
		label: "Marathons Run",
		subtitle: "@ 4 hours each",
		hoursPerUnit: 4,
	},
];
