/**
 * Tracking status for games
 * - Default: Shown in all statistics UI. New sessions are tracked.
 * - Pause: Shown in all statistics UI. New sessions aren't tracked.
 * - Hidden: Hidden from all statistics UI. Still tracked in background.
 * - Ignore: Hidden from all statistics UI. Not tracked.
 */
export type TrackingStatus = "default" | "pause" | "hidden" | "ignore";

/**
 * Tracking configuration for a specific game
 */
export type GameTrackingConfig = {
	gameId: string;
	gameName: string;
	status: TrackingStatus;
};

/**
 * DTO for setting a game's tracking status
 */
export type SetGameTrackingStatusDTO = {
	game_id: string;
	status: TrackingStatus;
};

/**
 * DTO for removing a game's tracking status (revert to default)
 */
export type RemoveGameTrackingStatusDTO = {
	game_id: string;
};
