type AddTimeDTO = {
	started_at: number;
	ended_at: number;
	game_id: string;
	game_name: string;
};

type DailyStatisticsForPeriodDTO = {
	start_date: string;
	end_date: string;
	game_id?: string;
};

type ApplyManualTimeCorrection = {
	game: Game;
	time: number;
};

type ApplyManualTimeCorrectionDTO = ApplyManualTimeCorrection[];

type GetGameDTO = string;

type GetFileSHA256DTO = string;

type AddGameChecksumDTO = {
	game_id: string;
	checksum: string;
	algorithm:
		| "SHA224"
		| "SHA256"
		| "SHA384"
		| "SHA512"
		| "SHA3_224"
		| "SHA3_256"
		| "SHA3_384"
		| "SHA3_512";
	chunk_size: number;
	created_at?: Date;
	updated_at?: Date;
};

type RemoveGameChecksumDTO = {
	game_id: string;
	checksum: string;
};

type HasDataBeforeDTO = {
	date: string;
	game_id: string;
};

type RemoveAllGameChecksumsDTO = string;
