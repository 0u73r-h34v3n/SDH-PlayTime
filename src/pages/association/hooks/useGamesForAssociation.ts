import { useState, useEffect, useCallback } from "react";
import { useLocator } from "@src/locator";
import { Backend } from "@src/app/backend";

export interface GameForAssociation {
	id: string;
	name: string;
	nameWithId: string;
	canBeParent: boolean;
	canBeChild: boolean;
}

export const useGamesForAssociation = () => {
	const { associationService } = useLocator();
	const [games, setGames] = useState<GameForAssociation[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	const loadGames = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			// Get all games from dictionary
			const dictionary = await Backend.getGamesDictionary();

			// Check which games can be parent/child
			const gamesWithStatus = await Promise.all(
				dictionary.map(async (g) => {
					const [canBeParent, canBeChild] = await Promise.all([
						associationService.canBeParent(g.game.id),
						associationService.canBeChild(g.game.id),
					]);
					return {
						id: g.game.id,
						name: g.game.name,
						nameWithId: `${g.game.name} (ID: ${g.game.id})`,
						canBeParent,
						canBeChild,
					};
				}),
			);

			// Sort by name
			gamesWithStatus.sort((a, b) => a.name.localeCompare(b.name));
			setGames(gamesWithStatus);
		} catch (err) {
			setError(err instanceof Error ? err : new Error("Failed to load games"));
			console.error("Failed to load games for association:", err);
		} finally {
			setLoading(false);
		}
	}, [associationService]);

	useEffect(() => {
		loadGames();
	}, [loadGames]);

	return { games, loading, error, refresh: loadGames };
};
