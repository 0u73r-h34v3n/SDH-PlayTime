import { ScrollPanelGroup } from "@decky/ui";
import { FocusableExt } from "@src/components/FocusableExt";
import { getGameCoverImage } from "@src/components/GameCard";
import { format, parseISO } from "date-fns";
import { IoFlame } from "react-icons/io5";

interface LongestStreakProps {
	streak: PlayStreak;
	handleGameClick?: (gameId: string) => void;
}

export function LongestStreak({ streak, handleGameClick }: LongestStreakProps) {
	if (streak.days === 0) {
		return null;
	}

	const startDateFormatted = streak.startDate
		? format(parseISO(streak.startDate), "MMM d, yyyy")
		: "";
	const endDateFormatted = streak.endDate
		? format(parseISO(streak.endDate), "MMM d, yyyy")
		: "";

	return (
		<ScrollPanelGroup
			// @ts-ignore - ScrollPanelGroup supports style at runtime
			style={{ flex: 1, minHeight: 0, height: "100%" }}
			scrollPaddingTop={32}
			className="replay-scroll-panel-group"
		>
			<div className="replay-section replay-streak">
				<div className="replay-section-title">
					<IoFlame className="replay-section-title-icon icon-streak" />
					Longest Streak
				</div>

				<div className="replay-streak-header">
					<div>
						<div className="replay-streak-days">{streak.days}</div>
						<div className="replay-streak-days-label">
							{streak.days === 1 ? "Day" : "Days"} in a Row
						</div>
					</div>
				</div>

				<div className="replay-streak-dates">
					From <strong>{startDateFormatted}</strong> to{" "}
					<strong>{endDateFormatted}</strong>
				</div>

				<div className="replay-streak-games-title">
					During this time, you played {streak.gamesPlayed.length} different{" "}
					{streak.gamesPlayed.length === 1 ? "game" : "games"}
				</div>

				<div className="replay-games-grid">
					{streak.gamesPlayed.map((gameEntry) => (
						<FocusableExt
							key={gameEntry.game.id}
							focusWithinClassName="game-cover-focusable"
							onActivate={() => handleGameClick?.(gameEntry.game.id)}
						>
							<div className="replay-game-cover">
								<div
									className="replay-game-cover-image"
									style={{
										backgroundImage: getGameCoverImage(gameEntry.game.id),
									}}
								/>
								<div className="replay-game-cover-name">
									{gameEntry.game.name}
								</div>
							</div>
						</FocusableExt>
					))}
				</div>
			</div>
		</ScrollPanelGroup>
	);
}
