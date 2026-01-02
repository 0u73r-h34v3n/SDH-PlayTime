import { useState, useEffect, useCallback } from "react";
import type { TrackingStatus } from "@src/types/tracking";
import { useLocator } from "@src/locator";

export const useTrackingStatus = (gameId?: string) => {
	const { trackingService } = useLocator();
	const [status, setStatus] = useState<TrackingStatus>("pause");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		if (gameId) {
			loadStatus(gameId);
		}
	}, [gameId]);

	const loadStatus = async (id: string) => {
		setLoading(true);
		setError(null);
		try {
			const currentStatus = await trackingService.getGameTrackingStatus(id);
			setStatus(currentStatus);
		} catch (err) {
			setError(err instanceof Error ? err : new Error("Failed to load status"));
			console.error("Failed to load tracking status:", err);
		} finally {
			setLoading(false);
		}
	};

	const saveStatus = useCallback(
		async (gameId: string, newStatus: TrackingStatus) => {
			setLoading(true);
			setError(null);
			try {
				await trackingService.setGameTrackingStatus(gameId, newStatus);
				setStatus(newStatus);
				return true;
			} catch (err) {
				setError(
					err instanceof Error ? err : new Error("Failed to save status"),
				);
				console.error("Failed to save tracking status:", err);
				return false;
			} finally {
				setLoading(false);
			}
		},
		[trackingService],
	);

	return { status, setStatus, loading, error, saveStatus };
};
