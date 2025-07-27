// type Game = {
// 	id: string;
// 	name: string;
// };
//
// type SessionInformation = {
// 	date: string;
// 	duration: number;
// 	migrated?: string;
// 	checksum?: string;
// };
//
// type GameWithTime = {
// 	game: Game;
// 	time: number;
// 	sessions: Array<SessionInformation>;
// 	last_session?: SessionInformation;
// };
//
// type DayStatistics = {
// 	date: string;
// 	games: Array<GameWithTime>;
// 	total: number;
// };
//
// type PagedDayStatistics = {
// 	data: Array<DayStatistics>;
// 	has_prev: boolean;
// 	has_next: boolean;
// };
//
// type GameInformation = {
// 	game: Game;
// 	time: number;
// };
//
// type FileChecksum = {
// 	game_id: string;
// 	checksum: string;
// 	algorithm: string;
// 	chunk_size: number;
// 	created_at?: string;
// 	updated_at?: string;
// };
//
// type GameDictionary = {
// 	game: Game;
// 	files_checksum: Array<FileChecksum>;
// };
//
// type GamesChecksum = {
// 	game_id: string;
// 	checksum: string;
// };
//
// type PlaytimeInformation = {
// 	game_id: string;
// 	total_time: number;
// 	last_played_date: string;
// 	game_name: string;
// 	aliases_id?: string;
// };
//
type Checksum =
	| "SHA224"
	| "SHA256"
	| "SHA384"
	| "SHA512"
	| "SHA3_224"
	| "SHA3_256"
	| "SHA3_384"
	| "SHA3_512";

type Game = {
	id: string;
	name: string;
};

type SessionInformation = {
	date: string;
	duration: number;
	migrated?: string;
	checksum?: string;
};

type GamePlaytimeSummary = {
	game: Game;
	totalTime: number;
};

interface GamePlaytimeDetails extends GamePlaytimeSummary {
	sessions: SessionInformation[];
	lastSession?: SessionInformation;
}

interface GamePlaytimeReport extends GamePlaytimeSummary {
	lastPlayedDate: string;
	aliasesId?: string;
}

type DayStatistics = {
	date: string;
	games: GamePlaytimeDetails[];
	total: number;
};

type PagedDayStatistics = {
	data: DayStatistics[];
	hasPrev: boolean;
	hasNext: boolean;
};

type FileChecksum = {
	game: Game;
	checksum: Checksum;
	algorithm: string;
	chunkSize: number;
	createdAt?: string;
	updatedAt?: string;
};

type GameDictionary = {
	game: Game;
	files: FileChecksum[];
};
