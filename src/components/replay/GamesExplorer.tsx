import { FocusableExt } from "@src/components/FocusableExt";
import { getGameCoverImage } from "@src/components/GameCard";
import { IoGrid } from "react-icons/io5";
import { useMemo } from "react";
import { ScrollPanelGroup } from "@decky/ui";

interface GamesExplorerProps {
	games: YearReplayGame[];
	year: number;
	handleGameClick: (gameId: string) => void;
}

export function GamesExplorer({
	games,
	year,
	handleGameClick,
}: GamesExplorerProps) {
	const sortedGames = useMemo(() => {
		return [...games].sort((a, b) =>
			a.firstPlayedDate.localeCompare(b.firstPlayedDate),
		);
	}, [games]);

	if (games.length === 0) {
		return null;
	}

	return (
		<ScrollPanelGroup
			// @ts-ignore - ScrollPanelGroup supports style at runtime
			style={{ flex: 1, minHeight: 0, height: "100%" }}
			scrollPaddingTop={32}
			className="replay-scroll-panel-group"
		>
			<div className="replay-section replay-explore">
				<div className="replay-section-title">
					<IoGrid className="replay-section-title-icon icon-explore" />
					Explore the games you played this year
				</div>

				<div className="replay-explore-grid">
					{sortedGames.map((game) => (
						<FocusableExt
							key={game.game.id}
							className="replay-game-cover-focusable"
							focusWithinClassName="gpfocuswithin"
							onActivate={() => handleGameClick(game.game.id)}
						>
							<div className="replay-explore-game">
								<div
									className="replay-explore-game-image"
									style={{
										backgroundImage: getGameCoverImage(game.game.id),
									}}
								/>
								{game.isFirstPlayedThisYear && (
									<div className="replay-explore-game-new-badge">
										First Played in {year}
									</div>
								)}
								<div className="replay-explore-game-name">{game.game.name}</div>
							</div>
						</FocusableExt>
					))}
				</div>
			</div>
		</ScrollPanelGroup>
	);
}
