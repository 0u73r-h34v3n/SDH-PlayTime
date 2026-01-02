import { useState, useEffect, useCallback } from "react";
import type { GameTrackingConfig } from "@src/types/tracking";
import { useLocator } from "@src/locator";

export const useTrackingConfigs = () => {
	const { trackingService } = useLocator();
	const [configs, setConfigs] = useState<GameTrackingConfig[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	const loadConfigs = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await trackingService.getAllTrackingConfigs();
			setConfigs(data);
		} catch (err) {
			setError(
				err instanceof Error ? err : new Error("Failed to load configs"),
			);
			console.error("Failed to load tracking configs:", err);
		} finally {
			setLoading(false);
		}
	}, [trackingService]);

	useEffect(() => {
		loadConfigs();
	}, [loadConfigs]);

	const removeConfig = useCallback(
		async (gameId: string) => {
			await trackingService.removeGameTrackingStatus(gameId);
			await loadConfigs();
		},
		[trackingService, loadConfigs],
	);

	return { configs, loading, error, refresh: loadConfigs, removeConfig };
};
