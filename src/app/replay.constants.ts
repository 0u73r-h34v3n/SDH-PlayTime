/**
 * Constants for the Year Replay feature
 */

/** The year for which the replay is generated */
export const REPLAY_YEAR = 2025;

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
