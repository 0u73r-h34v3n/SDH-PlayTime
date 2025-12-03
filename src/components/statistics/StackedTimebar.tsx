import { useLocator } from "@src/locator";
import { humanReadableTime } from "@utils/formatters";
import { memo } from "react";
import { TimeBarCSS } from "../../styles";
import { VerticalContainer } from "../VerticalContainer";

interface GameSegment {
	gameId: string;
	gameName: string;
	time: number;
	color: string;
}

interface StackedTimebarProps {
	games: GameSegment[];
	totalTime: number;
	maxTime: number;
}

export const StackedTimebar = memo<StackedTimebarProps>(
	function StackedTimebar({ games, totalTime, maxTime }) {
		const { currentSettings: settings } = useLocator();

		const barWidth = maxTime !== 0 ? `${(totalTime / maxTime) * 100}%` : "0%";

		return (
			<VerticalContainer>
				<div style={TimeBarCSS.time_bar__outline}>
					<div
						style={{
							display: "flex",
							flexDirection: "row",
							height: "10px",
							width: barWidth,
							borderRadius: "3px",
							overflow: "hidden",
						}}
					>
						{games.map((game) => {
							const segmentWidth =
								totalTime !== 0 ? `${(game.time / totalTime) * 100}%` : "0%";
							return (
								<div
									key={game.gameId}
									style={{
										width: segmentWidth,
										height: "100%",
										backgroundColor: game.color,
									}}
									title={`${game.gameName}: ${humanReadableTime(
										settings.displayTime.showTimeInHours,
										game.time,
										true,
										settings.displayTime.showSeconds,
									)}`}
								/>
							);
						})}
					</div>
				</div>
				<div style={TimeBarCSS.time_bar__time_text}>
					{humanReadableTime(
						settings.displayTime.showTimeInHours,
						totalTime,
						true,
						settings.displayTime.showSeconds,
					)}
				</div>
			</VerticalContainer>
		);
	},
);
