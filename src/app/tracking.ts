import { call } from "@decky/api";
import { BACK_END_API } from "@src/constants";
import type {
	GameTrackingConfig,
	SetGameTrackingStatusDTO,
	TrackingStatus,
} from "@src/types/tracking";
import logger from "@src/utils/logger";

export class TrackingService {
	/**
	 * Get all non-default tracking configurations
	 */
	async getAllTrackingConfigs(): Promise<GameTrackingConfig[]> {
		return await call<[], GameTrackingConfig[]>(
			BACK_END_API.GET_ALL_TRACKING_CONFIGS,
		).catch((error) => {
			logger.error("Failed to get tracking configs:", error);
			return [];
		});
	}

	/**
	 * Set tracking status for a game
	 */
	async setGameTrackingStatus(
		gameId: string,
		status: TrackingStatus,
	): Promise<boolean> {
		return await call<[SetGameTrackingStatusDTO], boolean>(
			BACK_END_API.SET_GAME_TRACKING_STATUS,
			{
				game_id: gameId,
				status,
			},
		).catch((error) => {
			logger.error("Failed to set tracking status:", error);
			return false;
		});
	}

	/**
	 * Remove tracking status for a game (revert to default)
	 */
	async removeGameTrackingStatus(gameId: string): Promise<boolean> {
		return await call<[string], boolean>(
			BACK_END_API.REMOVE_GAME_TRACKING_STATUS,
			gameId,
		).catch((error) => {
			logger.error("Failed to remove tracking status:", error);
			return false;
		});
	}

	/**
	 * Get tracking status for a specific game
	 */
	async getGameTrackingStatus(gameId: string): Promise<TrackingStatus> {
		return await call<[string], TrackingStatus>(
			BACK_END_API.GET_GAME_TRACKING_STATUS,
			gameId,
		).catch((error) => {
			logger.error("Failed to get tracking status:", error);
			return "default";
		});
	}
}
