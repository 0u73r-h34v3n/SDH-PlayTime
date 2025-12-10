import { useEffect, useState } from "react";
import { PageWrapper } from "@src/components/PageWrapper";
import { useLocator } from "@src/locator";
import { ReplayService } from "@src/app/replay";
import {
	ReplayHero,
	LongestStreak,
	TopGamesList,
	TopGamesDetailSection,
	GamesExplorer,
	MonthlyOverviewChart,
	ReplayLoading,
	ReplayEmpty,
	FunFacts,
	Achievements,
} from "@src/components/replay";
import { GameCoverStyle } from "@src/components/GameCard";
import logger from "@src/utils/logger";
import { Navigation, ScrollPanelGroup } from "@decky/ui";
import { FaHeart } from "react-icons/fa";
import { KOFI_URL } from "@src/components/SupportBanner";
import { SiKofi } from "react-icons/si";
import { FocusableExt } from "@src/components/FocusableExt";
import { GAME_REPORT_ROUTE, navigateToPage } from "./navigation";
import {
	GAMEPAD_BUTTON_B,
	getDefaultReplayYear,
} from "@src/app/replay.constants";

const handleGameClick = (gameId: string) => {
	navigateToPage(GAME_REPORT_ROUTE.replace(":gameId", gameId));
};

export function ReplayPage({ year }: { year?: number }) {
	const { reports } = useLocator();
	const [replayData, setReplayData] = useState<YearReplayData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [currentYear, setCurrentYear] = useState<number>(
		year || getDefaultReplayYear(),
	);

	useEffect(() => {
		let isMounted = true;

		const yearToUse = year || getDefaultReplayYear();
		setCurrentYear(yearToUse);
		const replayService = new ReplayService(reports, yearToUse);

		replayService
			.computeReplayData()
			.then((data) => {
				if (isMounted) {
					setReplayData(data);
					setIsLoading(false);
				}
			})
			.catch((err) => {
				if (isMounted) {
					logger.error("Failed to load replay data", err);
					setErrorMessage(err.message);
					setIsLoading(false);
				}
			});

		return () => {
			isMounted = false;
		};
	}, [reports, year]);

	if (isLoading) {
		return (
			<PageWrapper>
				<ReplayLoading year={currentYear} />
			</PageWrapper>
		);
	}

	if (errorMessage) {
		return (
			<PageWrapper>
				<div className="replay-empty">
					<div className="replay-empty-title">Error</div>
					<div className="replay-empty-text">{errorMessage}</div>
				</div>
			</PageWrapper>
		);
	}

	if (!replayData || replayData.summary.totalPlayTime === 0) {
		return (
			<PageWrapper>
				<ReplayEmpty year={currentYear} />
			</PageWrapper>
		);
	}

	return (
		<PageWrapper
			style={{
				backgroundColor: "rgba(28, 35, 47, 1)",
				margin: "40px 0",
				height: "calc(100% - 80px)",
				position: "relative",
			}}
		>
			<GameCoverStyle />

			<ScrollPanelGroup
				// @ts-expect-error - focusable prop is not in types but works
				focusable={false}
				style={{ flex: 1, minHeight: 0, height: "100%" }}
				scrollPaddingTop={32}
				onButtonDown={(event: {
					detail: { button: number };
					target?: { className?: string };
				}) => {
					if (
						!event?.target?.className?.includes("replay-scroll-panel-group")
					) {
						return;
					}

					if (event?.detail?.button !== GAMEPAD_BUTTON_B) {
						return;
					}

					Navigation.NavigateBack();
				}}
			>
				{/* Hero Section with Summary Stats */}
				<ReplayHero
					summary={replayData.summary}
					newGamesCount={replayData.newGamesThisYear.length}
					longestStreakDays={replayData.longestStreak.days}
				/>

				<div className="replay-container">
					<MonthlyOverviewChart
						monthlyBreakdown={replayData.monthlyBreakdown}
					/>

					<LongestStreak
						streak={replayData.longestStreak}
						handleGameClick={handleGameClick}
					/>

					<TopGamesList
						games={replayData.topGames}
						handleGameClick={handleGameClick}
					/>

					<TopGamesDetailSection games={replayData.topGames} />

					<FunFacts
						insights={replayData.insights}
						totalPlayTime={replayData.summary.totalPlayTime}
					/>

					<Achievements achievements={replayData.achievements} />

					<GamesExplorer
						games={replayData.allGames}
						year={replayData.summary.year}
						handleGameClick={handleGameClick}
					/>

					<div className="replay-footer">
						<div className="replay-footer-support-container">
							<FocusableExt
								onActivate={() => Navigation.NavigateToExternalWeb(KOFI_URL)}
								className="replay-scroll-panel-group replay-footer-support-wrapper"
							>
								<button
									onClick={() => Navigation.NavigateToExternalWeb(KOFI_URL)}
									type="button"
									className="replay-footer-support-btn"
								>
									<SiKofi size={18} />
									<span>Support on Ko-fi</span>
								</button>
							</FocusableExt>
						</div>

						<p className="replay-footer-text">
							If you enjoy this plugin, consider buying me a coffee! ☕
						</p>

						<p className="replay-footer-credits">
							With <FaHeart className="replay-footer-heart" /> by ynhhoJ
						</p>
					</div>
				</div>
			</ScrollPanelGroup>
		</PageWrapper>
	);
}
