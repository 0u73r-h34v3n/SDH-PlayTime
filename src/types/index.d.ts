declare module "*.css";

type Nullable<T> = T | null | undefined;

type DailyStatistics = DayStatistics;

type LocalNonSteamGame = {
	id: string;
	name: string;
	checksum?: string;
	pathToGame?: string;
};

type ReportPage = "all-time" | "by-month" | "by-week";
