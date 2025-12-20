import { toDate } from "date-fns";
import { type FC, useEffect, useMemo, useState } from "react";
import { FocusableExt } from "../FocusableExt";
import { HorizontalContainer } from "../HorizontalContainer";
import { useLocator } from "@src/locator";
import { getGameDominantColorMemo } from "@utils/colorExtractor";
import { CHART_COLORS } from "./Chart";
import { StackedTimebar } from "./StackedTimebar";

interface GameSegment {
	gameId: string;
	gameName: string;
	time: number;
	color: string;
}

interface StackedDayTime {
	dayOfWeek: string;
	totalTime: number;
	date: Date;
	games: GameSegment[];
}

function processStatisticsForStackedBars(
	statistics: DailyStatistics[],
): StackedDayTime[] {
	return statistics.map((day) => {
		const date = toDate(day.date);
		const games: GameSegment[] = day.games.map((game) => ({
			gameId: game.game.id,
			gameName: game.game.name,
			time: game.totalTime,
			color: CHART_COLORS.primary,
		}));

		games.sort((a, b) => b.time - a.time);

		return {
			dayOfWeek: date.toLocaleString(undefined, { weekday: "long" }),
			totalTime: day.total,
			date,
			games,
		};
	});
}

export const StackedWeekView: FC<{ statistics: DailyStatistics[] }> = ({
	statistics,
}) => {
	const { currentSettings: settings } = useLocator();
	const [gameColors, setGameColors] = useState<Map<string, string>>(new Map());

	const stackedDayTimes = useMemo(
		() => processStatisticsForStackedBars(statistics),
		[statistics],
	);

	const allGameIds = useMemo(() => {
		const gameSet = new Set<string>();
		for (const day of stackedDayTimes) {
			for (const game of day.games) {
				gameSet.add(game.gameId);
			}
		}
		return Array.from(gameSet);
	}, [stackedDayTimes]);

	useEffect(() => {
		if (allGameIds.length === 0) {
			return;
		}

		let isMounted = true;

		async function extractColors() {
			const colors = new Map<string, string>();

			for (const gameId of allGameIds) {
				try {
					const color = await getGameDominantColorMemo(
						gameId,
						settings.chartColorSwatch,
					);
					colors.set(gameId, color);
				} catch {
					colors.set(gameId, CHART_COLORS.primary);
				}
			}

			if (isMounted) {
				setGameColors(colors);
			}
		}

		extractColors();

		return () => {
			isMounted = false;
		};
	}, [allGameIds, settings.chartColorSwatch]);

	const overall = Math.max(...stackedDayTimes.map((day) => day.totalTime), 0);

	const coloredStackedDayTimes = useMemo(
		() =>
			stackedDayTimes.map((day) => ({
				...day,
				games: day.games.map((game) => ({
					...game,
					color: gameColors.get(game.gameId) || CHART_COLORS.primary,
				})),
			})),
		[stackedDayTimes, gameColors],
	);

	return (
		<FocusableExt>
			<div className="playtime-chart">
				<div className="playtime-chart">
					{coloredStackedDayTimes.map((dayTime, index) => (
						<HorizontalContainer key={`${dayTime.dayOfWeek}${index}`}>
							<div style={{ width: "10%" }}>{dayTime.dayOfWeek.charAt(0)}</div>
							<div style={{ width: "90%" }}>
								<StackedTimebar
									games={dayTime.games}
									totalTime={dayTime.totalTime}
									maxTime={overall}
								/>
							</div>
						</HorizontalContainer>
					))}
				</div>
			</div>
		</FocusableExt>
	);
};
