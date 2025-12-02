import { getGameCoverImage } from "@src/components/GameCard";
import { humanReadableTime } from "@src/utils/formatters";
import { useLocator } from "@src/locator";
import { IoTrophy } from "react-icons/io5";
import { ScrollPanelGroup } from "@decky/ui";
import { FocusableExt } from "../FocusableExt";

interface TopGamesListProps {
	games: YearReplayGame[];
	handleGameClick: (gameId: string) => void;
}

// Helper to get rank class for medal styling
const getRankClass = (index: number): string => {
	return `rank-${index + 1}`;
};

export function TopGamesList({ games, handleGameClick }: TopGamesListProps) {
	const { currentSettings: settings } = useLocator();

	if (games.length === 0) {
		return null;
	}

	// Show top 5 games
	const topGames = games.slice(0, 5);

	return (
		<ScrollPanelGroup
			style={{ flex: 1, minHeight: 0, height: "100%" }}
			scrollPaddingTop={32}
			className="replay-scroll-panel-group"
		>
			<div className="replay-section replay-top-games">
				<div className="replay-section-title">
					<IoTrophy className="replay-section-title-icon icon-trophy" />
					Your Top Games
				</div>

				<div className="replay-top-games-list">
					{topGames.map((game, index) => (
						<FocusableExt
							key={game.game.id}
							focusWithinClassName="gpfocuswithin"
							onActivate={() => handleGameClick(game.game.id)}
						>
							<div className={`replay-top-game-item ${getRankClass(index)}`}>
								<div className={`replay-top-game-rank ${getRankClass(index)}`}>
									#{index + 1}
								</div>

								<div className="replay-top-game-cover">
									<div
										className="replay-game-cover-image"
										style={{
											backgroundImage: getGameCoverImage(game.game.id),
										}}
									/>
								</div>

								<div className="replay-top-game-info">
									<div className="replay-top-game-name">{game.game.name}</div>
									<div className="replay-top-game-stats">
										<span>{game.sessions} sessions</span>
										<span>
											{game.percentageOfTotal.toFixed(1)}% of playtime
										</span>
									</div>
								</div>

								<div className="replay-top-game-time">
									{humanReadableTime(
										settings.displayTime.showTimeInHours,
										game.totalTime,
										true,
									)}
								</div>
							</div>
						</FocusableExt>
					))}
				</div>
			</div>
		</ScrollPanelGroup>
	);
}
