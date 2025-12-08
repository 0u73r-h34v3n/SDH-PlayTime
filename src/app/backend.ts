import { call } from "@decky/api";
import logger from "@src/utils/logger";
import { toIsoDateOnly } from "@utils/formatters";
import type { EventBus } from "./system";
import { BACK_END_API } from "@src/constants";

export interface OverallPlayTimes {
	[gameId: string]: number;
}

export class Backend {
	private eventBus: EventBus;

	constructor(eventBus: EventBus) {
		this.eventBus = eventBus;

		eventBus.addSubscriber(async (event) => {
			switch (event.type) {
				case "CommitInterval":
					await this.addTime(event.startedAt, event.endedAt, event.game);
					break;

				case "TimeManuallyAdjusted":
					break;

				case "UserLoggedIn":
					await Backend.setCurrentUser(event.steamId);
					break;
			}
		});
	}

	/**
	 * Set the current Steam user ID for per-user data isolation.
	 * This should be called when a user logs in.
	 * @param steamUserId The 64-bit Steam ID as a string (from strSteamID)
	 */
	public static async setCurrentUser(steamUserId: string): Promise<void> {
		return await call<[string], void>(
			BACK_END_API.SET_CURRENT_USER,
			steamUserId,
		).catch((error) => {
			logger.error("Failed to set current user:", error);
		});
	}

	/**
	 * Get the current Steam user ID.
	 * @returns The current user's Steam ID, or null if not set
	 */
	public static async getCurrentUser(): Promise<Nullable<string>> {
		return await call<[], Nullable<string>>(
			BACK_END_API.GET_CURRENT_USER,
		).catch((error) => {
			logger.error("Failed to get current user:", error);
			return null;
		});
	}

	private async addTime(startedAt: number, endedAt: number, game: Game) {
		const MIN_SECONDS = 5;
		const playTimeInSeconds = (endedAt - startedAt) / 1000;

		if (playTimeInSeconds < MIN_SECONDS) {
			logger.info(
				`Session ignored because play time iss less than ${MIN_SECONDS}. Current play time: ${playTimeInSeconds}`,
			);

			return;
		}

		await call<[AddTimeDTO], void>(BACK_END_API.ADD_TIME, {
			started_at: startedAt / 1000,
			ended_at: endedAt / 1000,
			game_id: game.id,
			game_name: game.name,
		}).catch(() => {
			this.errorOnBackend(
				"Can't save interval, because of backend error (add_time)",
			);
		});
	}

	async fetchDailyStatisticForInterval(
		start: Date,
		end: Date,
		gameId?: string,
	): Promise<PagedDayStatistics> {
		return await call<[DailyStatisticsForPeriodDTO], PagedDayStatistics>(
			BACK_END_API.DAILY_STATISTICS_FOR_PERIOD,
			{
				start_date: toIsoDateOnly(start),
				end_date: toIsoDateOnly(end),
				game_id: gameId,
			},
		).catch((error) => {
			logger.error(error);

			return {
				hasNext: false,
				hasPrev: false,
				data: [],
			} as PagedDayStatistics;
		});
	}

	async fetchPerGameOverallStatistics(): Promise<GamePlaytimeDetails[]> {
		return await call<[], Array<GamePlaytimeDetails>>(
			BACK_END_API.PER_GAME_OVERALL_STATISTICS,
		).catch((error) => {
			logger.error(error);

			return [];
		});
	}

	async applyManualOverallTimeCorrection(
		games: GamePlaytimeDetails[],
	): Promise<boolean> {
		return await call<[list_of_game_stats: ApplyManualTimeCorrectionDTO], void>(
			BACK_END_API.APPLY_MANUAL_TIME_CORRECTION,
			games.map((item) => ({
				game: item.game,
				time: item.totalTime,
			})),
		)
			.then(() => {
				this.eventBus.emit({ type: "TimeManuallyAdjusted" });

				return true;
			})
			.catch((error) => {
				logger.error(error);

				return false;
			});
	}

	private errorOnBackend(message: string) {
		logger.error(`There is an error: ${message}`);

		this.eventBus.emit({
			type: "NotifyAboutError",
			message: message,
		});
	}

	async getGame(gameId: string): Promise<Nullable<GamePlaytimeSummary>> {
		return await call<[GetGameDTO], Nullable<GamePlaytimeSummary>>(
			BACK_END_API.GET_GAME,
			gameId,
		).catch((error) => {
			logger.error(error);

			return null;
		});
	}

	public static async getFileSHA256(path: string): Promise<Nullable<string>> {
		return await call<[GetFileSHA256DTO], Nullable<string>>(
			BACK_END_API.GET_FILE_SHA256,
			path,
		);
	}

	public static async getGamesDictionary(): Promise<Array<GameDictionary>> {
		return await call<[], Array<GameDictionary>>(
			BACK_END_API.GET_GAMES_DICTIONARY,
		);
	}

	public static async addGameChecksum(
		id: string,
		hashChecksum: string,
		hashAlgorithm:
			| "SHA224"
			| "SHA256"
			| "SHA384"
			| "SHA512"
			| "SHA3_224"
			| "SHA3_256"
			| "SHA3_384"
			| "SHA3_512",
		hashChunkSize: number,
		createdAt?: Date,
		updatedAt?: Date,
	): Promise<void> {
		return await call<[AddGameChecksumDTO], void>(
			BACK_END_API.SAVE_GAME_CHECKSUM,
			{
				game_id: id,
				checksum: hashChecksum,
				algorithm: hashAlgorithm,
				chunk_size: hashChunkSize,
				created_at: createdAt,
				updated_at: updatedAt,
			},
		);
	}

	public static async addGameChecksumBulk(
		checksumsToAdd: Array<AddGameChecksumDTO>,
	): Promise<void> {
		return await call<[Array<AddGameChecksumDTO>], void>(
			BACK_END_API.SAVE_GAME_CHECKSUM_BULK,
			checksumsToAdd,
		);
	}

	public static async removeGameChecksum(
		id: string,
		checksum: string,
	): Promise<void> {
		return await call<[RemoveGameChecksumDTO], void>(
			BACK_END_API.REMOVE_GAME_CHECKSUM,
			{
				game_id: id,
				checksum,
			},
		);
	}

	public static async removeAllChecksums(): Promise<number> {
		return await call<[], number>(BACK_END_API.REMOVE_ALL_CHECKSUMS);
	}

	public static async getGamesChecksum(): Promise<Array<FileChecksum>> {
		return await call<[], Array<FileChecksum>>(
			BACK_END_API.GET_GAMES_CHECKSUM,
		).then((response) =>
			response.map((item) => ({
				...item,
				game: {
					id: item.game.id,
					name:
						item?.game?.name === "[Unknown name]"
							? appStore.GetAppOverviewByGameID(item.game.id)?.display_name ||
								"[Unknown name]"
							: item.game.name,
				},
			})),
		);
	}

	public static async getStatisticsForLastTwoWeeks(): Promise<
		Array<GamePlaytimeReport>
	> {
		return await call<[], Array<GamePlaytimeReport>>(
			BACK_END_API.GET_STATISTICS_FOR_LAST_TWO_WEEKS,
		);
	}

	public static async getPlaytimeInformation(): Promise<
		Array<GamePlaytimeReport>
	> {
		return await call<[], Array<GamePlaytimeReport>>(
			BACK_END_API.FETCH_PLAYTIME_INFORMATION,
		);
	}

	public static async hasMinRequiredPythonVersion() {
		return await call<[], boolean>(
			BACK_END_API.HAS_MIN_REQUIRED_PYTHON_VERSION,
		);
	}

	public static async linkGameToGameWithChecksum(
		childGameId: string,
		parentGameId: string,
	) {
		return await call<[childGameId: string, parentGameId: string]>(
			BACK_END_API.LINK_GAME_TO_GAME_WITH_CHECKSUM,
			childGameId,
			parentGameId,
		);
	}

	public static async getDeckyHome() {
		return await call<[], string>(BACK_END_API.GET_DECKY_HOME);
	}

	public static async hasDataBefore(
		date: string,
		gameId: string,
	): Promise<boolean> {
		return await call<[HasDataBeforeDTO], boolean>(
			BACK_END_API.HAS_DATA_BEFORE,
			{
				date,
				game_id: gameId,
			},
		).catch((error) => {
			logger.error("hasDataBefore error:", error);
			return false;
		});
	}
}
