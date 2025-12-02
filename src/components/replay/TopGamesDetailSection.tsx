import { TopGameDetail } from "./TopGameDetail";
import { IoEye } from "react-icons/io5";

interface TopGamesDetailSectionProps {
	games: YearReplayGame[];
}

export function TopGamesDetailSection({ games }: TopGamesDetailSectionProps) {
	if (games.length === 0) {
		return null;
	}

	// Show details for top 5 games
	const topGames = games.slice(0, 5);

	return (
		<div
			className="replay-section"
			style={{ background: "transparent", padding: 0, border: "none" }}
		>
			<div className="replay-section-title" style={{ marginBottom: 24 }}>
				<IoEye className="replay-section-title-icon icon-detail" />
				Let's take a closer look at your top played games...
			</div>

			{topGames.map((game, index) => (
				<TopGameDetail key={game.game.id} game={game} index={index} />
			))}
		</div>
	);
}
