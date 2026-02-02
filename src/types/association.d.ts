/**
 * A game association links a child game to a parent game.
 * When associated, the child game's playtime is combined with the parent's in statistics.
 */
export type GameAssociation = {
	parentGameId: string;
	parentGameName: string;
	childGameId: string;
	childGameName: string;
	createdAt?: string;
};

/**
 * DTO for creating a game association
 */
export type CreateGameAssociationDTO = {
	parent_game_id: string;
	child_game_id: string;
};

/**
 * Response from association API operations
 */
export type AssociationResult = {
	success: boolean;
	error?: {
		code: string;
		message: string;
	};
};

/**
 * Association info for a specific game
 */
export type GameAssociationInfo =
	| {
			role: "parent";
			children: Array<{
				gameId: string;
				gameName: string;
			}>;
	  }
	| {
			role: "child";
			parentGameId: string;
			parentGameName: string;
	  }
	| null;
