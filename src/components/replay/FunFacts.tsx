import { humanReadableTime } from "@src/utils/formatters";
import { useLocator } from "@src/locator";
import { getGameCoverImage } from "@src/components/GameCard";
import {
	IoFilm,
	IoBook,
	IoAirplane,
	IoBody,
	IoStopwatch,
	IoSunny,
	IoBulb,
} from "react-icons/io5";

interface FunFactsProps {
	insights: YearReplayInsights;
	totalPlayTime: number;
}

export function FunFacts({ insights, totalPlayTime }: FunFactsProps) {
	const { currentSettings: settings } = useLocator();
	const totalHours = Math.round(totalPlayTime / 3600);

	const comparisons = [
		{
			id: "movies",
			icon: <IoFilm />,
			value: insights.funTimeComparisons.movies,
			label: "Movies Watched",
			subtitle: "@ 2 hours each",
		},
		{
			id: "books",
			icon: <IoBook />,
			value: insights.funTimeComparisons.books,
			label: "Books Read",
			subtitle: "@ 8 hours each",
		},
		{
			id: "flights",
			icon: <IoAirplane />,
			value: insights.funTimeComparisons.flights,
			label: "Transatlantic Flights",
			subtitle: "@ 12 hours each",
		},
		{
			id: "marathons",
			icon: <IoBody />,
			value: insights.funTimeComparisons.marathons,
			label: "Marathons Run",
			subtitle: "@ 4 hours each",
		},
	];

	return (
		<div className="replay-section replay-fun-facts">
			<div className="replay-section-title">
				<IoBulb className="replay-section-title-icon icon-fun-facts" />
				Fun Facts & Insights
			</div>

			{insights.longestSingleSession && (
				<div className="replay-fun-fact-highlight">
					<div className="replay-fun-fact-highlight-icon">
						<IoStopwatch />
					</div>
					<div className="replay-fun-fact-highlight-content">
						<div className="replay-fun-fact-highlight-label">
							Longest Gaming Session
						</div>
						<div className="replay-fun-fact-highlight-value">
							{humanReadableTime(
								settings.displayTime.showTimeInHours,
								insights.longestSingleSession.duration,
								false,
							)}
						</div>
						<div className="replay-fun-fact-highlight-game">
							<div
								className="replay-fun-fact-game-cover"
								style={{
									backgroundImage: getGameCoverImage(
										insights.longestSingleSession.game.id,
									),
								}}
							/>
							<span>{insights.longestSingleSession.game.name}</span>
						</div>
					</div>
				</div>
			)}

			<div className="replay-fun-fact-highlight">
				<div className="replay-fun-fact-highlight-icon">
					<IoSunny />
				</div>
				<div className="replay-fun-fact-highlight-content">
					<div className="replay-fun-fact-highlight-label">
						Favorite Gaming Day
					</div>
					<div className="replay-fun-fact-highlight-value">
						{insights.mostActiveDay.dayName}
					</div>
					<div className="replay-fun-fact-highlight-subtitle">
						Avg.{" "}
						{humanReadableTime(
							settings.displayTime.showTimeInHours,
							insights.mostActiveDay.averageTime,
							true,
						)}{" "}
						per {insights.mostActiveDay.dayName}
					</div>
				</div>
			</div>

			<div className="replay-fun-fact-bar-section">
				<div className="replay-fun-fact-bar-label">
					<span>Weekday</span>
					<span>Weekend</span>
				</div>
				<div className="replay-fun-fact-bar">
					<div
						className="replay-fun-fact-bar-weekday"
						style={{
							width: `${insights.weekdayVsWeekend.weekdayPercentage}%`,
						}}
					/>
					<div
						className="replay-fun-fact-bar-weekend"
						style={{
							width: `${100 - insights.weekdayVsWeekend.weekdayPercentage}%`,
						}}
					/>
				</div>
				<div className="replay-fun-fact-bar-values">
					<span>
						{humanReadableTime(
							settings.displayTime.showTimeInHours,
							insights.weekdayVsWeekend.weekdayHours,
							true,
						)}
					</span>
					<span>
						{humanReadableTime(
							settings.displayTime.showTimeInHours,
							insights.weekdayVsWeekend.weekendHours,
							true,
						)}
					</span>
				</div>
			</div>

			<div className="replay-fun-fact-comparisons-title">
				Your {totalHours} hours of gaming is equivalent to...
			</div>
			<div className="replay-fun-fact-comparisons">
				{comparisons.map((comp) => (
					<div className="replay-fun-fact-comparison" key={comp.id}>
						<div className="replay-fun-fact-comparison-icon">{comp.icon}</div>
						<div className="replay-fun-fact-comparison-value">{comp.value}</div>
						<div className="replay-fun-fact-comparison-label">{comp.label}</div>
						<div className="replay-fun-fact-comparison-label">
							{comp.subtitle}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
