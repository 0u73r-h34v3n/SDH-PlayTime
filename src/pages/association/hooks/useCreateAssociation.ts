import { useState, useCallback } from "react";
import { useLocator } from "@src/locator";
import type { AssociationResult } from "@src/types/association";

export const useCreateAssociation = () => {
	const { associationService } = useLocator();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const createAssociation = useCallback(
		async (
			parentGameId: string,
			childGameId: string,
		): Promise<AssociationResult> => {
			setLoading(true);
			setError(null);
			try {
				const result = await associationService.createAssociation(
					parentGameId,
					childGameId,
				);
				if (!result.success && result.error) {
					setError(result.error.message);
				}
				return result;
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Failed to create association";
				setError(errorMessage);
				return {
					success: false,
					error: { code: "UNKNOWN", message: errorMessage },
				};
			} finally {
				setLoading(false);
			}
		},
		[associationService],
	);

	return {
		createAssociation,
		loading,
		error,
		clearError: () => setError(null),
	};
};
