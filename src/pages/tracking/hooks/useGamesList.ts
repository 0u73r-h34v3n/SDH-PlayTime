import { useState, useEffect } from "react";
import { useLocator } from "@src/locator";
import { Backend } from "@src/app/backend";

export interface GameOption {
	id: string;
	name: string;
	nameWithId: string;
}

export const useGamesList = () => {
	const { reports } = useLocator();
	const [games, setGames] = useState<GameOption[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		const loadGames = async () => {
			setLoading(true);
			setError(null);
			try {
				const statistics = await Backend.getGamesDictionary();
				const gamesList = statistics
					.map((g) => ({
						id: g.game.id,
						name: g.game.name,
						nameWithId: `${g.game.name} (ID: ${g.game.id})`,
					}))
					.sort((a, b) => a.name.localeCompare(b.name));
				setGames(gamesList);
			} catch (err) {
				setError(
					err instanceof Error ? err : new Error("Failed to load games"),
				);
				console.error("Failed to load games:", err);
			} finally {
				setLoading(false);
			}
		};

		loadGames();
	}, [reports]);

	return { games, loading, error };
};
