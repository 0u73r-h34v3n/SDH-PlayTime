import { Focusable, ScrollPanelGroup } from "@decky/ui";
import { FocusableExt } from "@src/components/FocusableExt";
import { getGameCoverImage } from "@src/components/GameCard";
import { parseLocalDate } from "@utils/formatters";
import { getDateLocale, t } from "@src/i18n";
import { IoFlame } from "react-icons/io5";

interface LongestStreakProps {
	streak: PlayStreak;
	handleGameClick?: (gameId: string) => void;
}

export function LongestStreak({ streak, handleGameClick }: LongestStreakProps) {
	if (streak.days === 0) {
		return null;
	}

	const dateFormat: Intl.DateTimeFormatOptions = {
		day: "numeric",
		month: "short",
		year: "numeric",
	};
	const startDateFormatted = streak.startDate
		? parseLocalDate(streak.startDate).toLocaleDateString(
				getDateLocale(),
				dateFormat,
			)
		: "";
	const endDateFormatted = streak.endDate
		? parseLocalDate(streak.endDate).toLocaleDateString(
				getDateLocale(),
				dateFormat,
			)
		: "";

	return (
		<ScrollPanelGroup
			// @ts-expect-error - ScrollPanelGroup supports style at runtime
			style={{ flex: 1, minHeight: 0, height: "100%" }}
			scrollPaddingTop={32}
			className="replay-scroll-panel-group"
		>
			<div className="replay-section replay-streak">
				<div className="replay-section-title">
					<IoFlame className="replay-section-title-icon icon-streak" />
					{t("playtime.longestStreak")}
				</div>

				<div className="replay-streak-header">
					<div>
						<div className="replay-streak-days">{streak.days}</div>
						<div className="replay-streak-days-label">
							{t(
								streak.days === 1
									? "playtime.dayInARow"
									: "playtime.daysInARow",
							)}
						</div>
					</div>
				</div>

				<div className="replay-streak-dates">
					{t("playtime.from")} <strong>{startDateFormatted}</strong>{" "}
					{t("playtime.to")} <strong>{endDateFormatted}</strong>
				</div>

				<div className="replay-streak-games-title">
					{t("playtime.playedGamesDuringStreak", {
						count: streak.gamesPlayed.length,
						game: t(
							streak.gamesPlayed.length === 1
								? "playtime.gameSingular"
								: "playtime.gamePlural",
						),
					})}
				</div>

				<Focusable flow-children="horizontal" className="replay-games-grid">
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
				</Focusable>
			</div>
		</ScrollPanelGroup>
	);
}
