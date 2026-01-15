import { useState, useEffect, useCallback } from "react";
import type { GameAssociation } from "@src/types/association";
import { useLocator } from "@src/locator";

export const useAssociations = () => {
	const { associationService } = useLocator();
	const [associations, setAssociations] = useState<GameAssociation[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	const loadAssociations = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await associationService.getAllAssociations();
			setAssociations(data);
		} catch (err) {
			setError(
				err instanceof Error ? err : new Error("Failed to load associations"),
			);
			console.error("Failed to load associations:", err);
		} finally {
			setLoading(false);
		}
	}, [associationService]);

	useEffect(() => {
		loadAssociations();
	}, [loadAssociations]);

	const removeAssociation = useCallback(
		async (childGameId: string) => {
			const result = await associationService.removeAssociation(childGameId);
			if (result.success) {
				await loadAssociations();
			}
			return result;
		},
		[associationService, loadAssociations],
	);

	return {
		associations,
		loading,
		error,
		refresh: loadAssociations,
		removeAssociation,
	};
};
