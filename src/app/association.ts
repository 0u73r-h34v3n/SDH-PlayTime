import { call } from "@decky/api";
import { BACK_END_API } from "@src/constants";
import type {
	GameAssociation,
	CreateGameAssociationDTO,
	AssociationResult,
	GameAssociationInfo,
} from "@src/types/association";
import logger from "@src/utils/logger";

export class AssociationService {
	/**
	 * Get all game associations
	 */
	async getAllAssociations(): Promise<GameAssociation[]> {
		return await call<[], GameAssociation[]>(
			BACK_END_API.GET_ALL_GAME_ASSOCIATIONS,
		).catch((error) => {
			logger.error("Failed to get game associations:", error);
			return [];
		});
	}

	/**
	 * Create an association between a parent and child game
	 */
	async createAssociation(
		parentGameId: string,
		childGameId: string,
	): Promise<AssociationResult> {
		return await call<[CreateGameAssociationDTO], AssociationResult>(
			BACK_END_API.CREATE_GAME_ASSOCIATION,
			{
				parent_game_id: parentGameId,
				child_game_id: childGameId,
			},
		).catch((error) => {
			logger.error("Failed to create game association:", error);
			return {
				success: false,
				error: {
					code: "NETWORK_ERROR",
					message: "Failed to create association. Please try again.",
				},
			};
		});
	}

	/**
	 * Remove an association for a child game
	 */
	async removeAssociation(childGameId: string): Promise<AssociationResult> {
		return await call<[string], AssociationResult>(
			BACK_END_API.REMOVE_GAME_ASSOCIATION,
			childGameId,
		).catch((error) => {
			logger.error("Failed to remove game association:", error);
			return {
				success: false,
				error: {
					code: "NETWORK_ERROR",
					message: "Failed to remove association. Please try again.",
				},
			};
		});
	}

	/**
	 * Get association info for a specific game
	 */
	async getGameAssociation(gameId: string): Promise<GameAssociationInfo> {
		return await call<[string], GameAssociationInfo>(
			BACK_END_API.GET_GAME_ASSOCIATION,
			gameId,
		).catch((error) => {
			logger.error("Failed to get game association:", error);
			return null;
		});
	}

	/**
	 * Check if a game can be a parent (not already a child)
	 */
	async canBeParent(gameId: string): Promise<boolean> {
		return await call<[string], boolean>(
			BACK_END_API.CAN_GAME_BE_PARENT,
			gameId,
		).catch((error) => {
			logger.error("Failed to check if game can be parent:", error);
			return false;
		});
	}

	/**
	 * Check if a game can be a child (not already a child or parent)
	 */
	async canBeChild(gameId: string): Promise<boolean> {
		return await call<[string], boolean>(
			BACK_END_API.CAN_GAME_BE_CHILD,
			gameId,
		).catch((error) => {
			logger.error("Failed to check if game can be child:", error);
			return false;
		});
	}
}
