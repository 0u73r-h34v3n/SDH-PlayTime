import { useLocator } from "@src/locator";
import { GAME_REPORT_ROUTE, navigateToPage } from "@src/pages/navigation";
import { isNil } from "es-toolkit";
import { humanReadableTime } from "@utils/formatters";
import { formatDistanceToNow } from "date-fns";

import { hide_text_on_overflow } from "../../styles";
import { FocusableExt } from "../FocusableExt";
import { GameCard, GameCoverStyle } from "../GameCard";
import { Timebar } from "../Timebar";
import { VerticalContainer } from "../VerticalContainer";

type GamesTimeBarViewProperties = {
	data: Array<GamePlaytimeDetails>;
	showCovers?: boolean;
	onOptionsPress: () => void;
	onMenuPress: (
		gameName: string,
		gameId: string,
		hasChecksumEnabled: boolean,
	) => void;
};

type GamesTimeBarViewCoversProperties = Omit<
	GamesTimeBarViewProperties,
	"showCovers"
>;

type PlayedSessionsInformation = {
	game: GamePlaytimeDetails;
};

function getLastPlayedTime(game: GamePlaytimeDetails) {
	const { lastSession } = game;

	if (isNil(lastSession)) {
		return undefined;
	}

	const { date, duration } = lastSession;

	if (isNil(date) || isNil(duration)) {
		return undefined;
	}

	const lastPlayedDate = new Date(new Date(date).getTime() + duration * 1000);

	return formatDistanceToNow(lastPlayedDate, { includeSeconds: true });
}

function PlayedSessionsInformation({ game }: PlayedSessionsInformation) {
	const { currentSettings: settings } = useLocator();

	if (
		["mostAverageTimePlayed", "leastAverageTimePlayed"].includes(
			settings.selectedSortByOption,
		)
	) {
		const averagePlayedTime = game.totalTime / game.sessions.length;

		return (
			<span>
				Average playtime:{" "}
				{humanReadableTime(
					settings.displayTime.showTimeInHours,
					averagePlayedTime,
					true,
					settings.displayTime.showSeconds,
				)}
			</span>
		);
	}

	return (
		<span>
			Played {game.sessions.length} time
			{game.sessions.length === 1 ? "" : "s"}
		</span>
	);
}

function GamesTimeBarViewWithCovers({
	data,
	onOptionsPress,
	onMenuPress,
}: GamesTimeBarViewCoversProperties) {
	const { currentSettings: settings } = useLocator();
	const allTime = data.reduce((acc, it) => acc + it.totalTime, 0);

	return (
		<div className="games-by-week">
			<GameCoverStyle />

			{data.map((it, index) => {
				const lastPlayedDate = getLastPlayedTime(it);

				return (
					<FocusableExt
						key={`${it.game.name}${index}`}
						focusWithinClassName="deck-focused"
						onOptionsButton={onOptionsPress}
						onOptionsActionDescription={
							<div style={{ display: "flex", gap: "4px" }}>
								<text>Sort</text>
							</div>
						}
						onActivate={() => {
							navigateToPage(
								GAME_REPORT_ROUTE.replace(":gameId", `${it.game.id}`),
							);
						}}
						onMenuActionDescription={<span>Options</span>}
						onMenuButton={() =>
							onMenuPress(
								it.game.name,
								it.game.id,
								settings.isEnabledDetectionOfGamesByFileChecksum,
							)
						}
					>
						<VerticalContainer>
							<div
								className="game-card"
								style={{
									display: "flex",
									alignItems: "center",
									borderTop: "1px solid rgba(255, 255, 255, .1)",
									borderBottom: "1px solid rgba(255, 255, 255, .1)",
									padding: "0.5rem 0",
								}}
							>
								<GameCard
									gameId={it.game.id}
									coverScale={settings.coverScale}
								/>

								<div
									style={{
										width: "100%",
										display: "flex",
										flexDirection: "column",
										justifyContent: "center",
										padding: "0 1rem",
									}}
								>
									<div
										style={{ display: "flex", justifyContent: "space-between" }}
									>
										<div style={hide_text_on_overflow}>{it.game.name}</div>

										<span style={{ color: "rgba(255, 255, 255, 0.1)" }}>
											#{index + 1}
										</span>
									</div>

									<Timebar time={it.totalTime} allTime={allTime} />

									<div
										style={{
											display: "flex",
											justifyContent: "space-between",
											color: "rgba(255, 255, 255, 0.5)",
											fontSize: "12px",
										}}
									>
										<span>Last played {lastPlayedDate} ago</span>

										<PlayedSessionsInformation game={it} />
									</div>
								</div>
							</div>
						</VerticalContainer>
					</FocusableExt>
				);
			})}
		</div>
	);
}

export const GamesTimeBarView: React.FC<GamesTimeBarViewProperties> = ({
	data,
	showCovers = false,
	onOptionsPress,
	onMenuPress,
}) => {
	if (showCovers) {
		return (
			<GamesTimeBarViewWithCovers
				data={data}
				onOptionsPress={onOptionsPress}
				onMenuPress={onMenuPress}
			/>
		);
	}

	const allTime = data.reduce((acc, it) => acc + it.totalTime, 0);
	const sortedByTime = [...data].sort((a, b) => b.totalTime - a.totalTime);

	return (
		<div className="games-by-week">
			{sortedByTime.map((it, index) => (
				<FocusableExt key={`${it.game.name}${index}`}>
					<VerticalContainer>
						<div style={hide_text_on_overflow}>{it.game.name}</div>

						<Timebar time={it.totalTime} allTime={allTime} />
					</VerticalContainer>
				</FocusableExt>
			))}
		</div>
	);
};
