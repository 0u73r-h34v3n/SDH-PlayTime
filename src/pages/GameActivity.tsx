import { PanelSection, PanelSectionRow } from "@decky/ui";
import { FocusableExt } from "@src/components/FocusableExt";
import { getGameCoverImage } from "@src/components/GameCard";
import { VerticalContainer } from "@src/components/VerticalContainer";
import { YearView } from "@src/components/statistics/YearView";
import { YearlyAverageAndOverall } from "@src/components/statistics/YearlyAverageAndOverall";
import { isNil } from "@src/utils/isNil";
import logger from "@src/utils/logger";
import {
	formatYearInterval,
	humanReadableTime,
	parseLocalDate,
} from "@utils/formatters";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { type Paginated, empty } from "../app/reports";
import { PageWrapper } from "../components/PageWrapper";
import { Pager } from "../components/Pager";
import { useLocator } from "../locator";

interface GameActivityProperties {
	gameId: string;
}

type SessionByDay = Record<string, Array<SessionInformation>>;

interface SessionsProperties {
	sessionsList: SessionByDay;
	showTimeInHours: boolean;
	showSeconds: boolean;
}

interface HeaderProperties {
	gameId: string;
}

function Header({ gameId }: HeaderProperties) {
	const { reports, currentSettings: settings } = useLocator();
	const [gameName, setGameName] = useState("");
	const [playedTime, setPlayedTime] = useState("");

	useEffect(() => {
		reports
			.getGame(gameId)
			.then((response) => {
				if (!response) {
					return;
				}

				const { game, totalTime } = response;
				const { name } = game;

				setGameName(name);
				setPlayedTime(
					humanReadableTime(
						settings.displayTime.showTimeInHours,
						totalTime,
						false,
						settings.displayTime.showSeconds,
					),
				);
			})
			.catch((error) => {
				logger.error(error);
			});
	}, []);

	return (
		<header
			style={{
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
				borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
				marginBottom: "16px",
				paddingBottom: "8px",
			}}
		>
			<div style={{ display: "flex", alignItems: "center" }}>
				<div
					style={{
						backgroundImage: getGameCoverImage(gameId),
						width: "25px",
						height: "25px",
						backgroundSize: "cover",
						backgroundPosition: "center",
					}}
				/>

				<FocusableExt>
					<span style={{ marginLeft: "8px", fontWeight: "bold" }}>
						{gameName}
					</span>
				</FocusableExt>
			</div>

			<span>{playedTime}</span>
		</header>
	);
}

function SessionsList({
	sessions,
	sessionDateKey,
	showTimeInHours = true,
	showSeconds = true,
}: {
	sessions: Array<SessionInformation>;
	sessionDateKey: string;
	showTimeInHours: boolean;
	showSeconds: boolean;
}) {
	return sessions.map((session) => {
		const { duration, date, migrated } = session;
		const isMigrated = !isNil(migrated) && migrated.length !== 0;
		const startSessionTime = new Date(date);
		const startSessionTimeFormatted = format(startSessionTime, "HH:mm:ss");
		const endSessionTime = new Date(new Date(date).getTime() + duration * 1000);
		const endSessionTimeFormatted = format(endSessionTime, "HH:mm:ss");

		const readableDuration = humanReadableTime(
			showTimeInHours,
			duration,
			false,
			showSeconds,
		);

		return (
			<FocusableExt key={`${sessionDateKey}_${duration}_${date}`}>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						margin: "4px 0",
						paddingLeft: "8px",
					}}
				>
					<div>
						<span>
							{`${startSessionTimeFormatted} - ${endSessionTimeFormatted}`}
						</span>

						{isMigrated && <span> — {migrated}</span>}
					</div>

					<span style={{ color: "rgba(255, 255, 255, 0.5)" }}>
						{readableDuration}
					</span>
				</div>
			</FocusableExt>
		);
	});
}

function Sessions({
	sessionsList,
	showSeconds,
	showTimeInHours,
}: SessionsProperties) {
	return Object.keys(sessionsList).map((sessionDateKey) => {
		const [month, day] = sessionDateKey.split("-");

		return (
			<VerticalContainer key={sessionDateKey}>
				<div
					style={{
						color: "rgb(0, 138, 218)",
						fontSize: "18px",
						marginTop: "18px",
					}}
				>
					<div
						style={{
							textWrap: "nowrap",
							display: "flex",
							alignItems: "center",
						}}
					>
						<span style={{ paddingRight: "16px" }}>
							{`${month.toUpperCase()} ${day}`}
						</span>

						<div
							style={{
								borderTop: "1px solid rgba(255, 255, 255, 0.1)",
								width: "100%",
							}}
						/>
					</div>
				</div>

				<SessionsList
					sessions={sessionsList[sessionDateKey]}
					sessionDateKey={sessionDateKey}
					showTimeInHours={showTimeInHours}
					showSeconds={showSeconds}
				/>
			</VerticalContainer>
		);
	});
}

function sortDateDesc(
	a: DailyStatistics | SessionInformation,
	b: DailyStatistics | SessionInformation,
) {
	return b.date.localeCompare(a.date);
}

export function GameActivity({ gameId }: GameActivityProperties) {
	const { reports, currentSettings: settings } = useLocator();
	const [isLoading, setLoading] = useState<boolean>(false);

	const [currentPage, setCurrentPage] = useState<Paginated<DailyStatistics>>(
		empty(),
	);

	useEffect(() => {
		setLoading(true);

		reports.yearlyStatistics(gameId).then((yearlyStatistics) => {
			setCurrentPage(yearlyStatistics);
			setLoading(false);
		});
	}, []);

	const sessionsList = useMemo(() => {
		return currentPage
			.current()
			.data // NOTE: Copy original array
			.slice(0)
			.filter((statistics) => statistics.total)
			.sort(sortDateDesc)
			.reduce<SessionByDay>((accumulator, session) => {
				const { date } = session;
				const formattedDate = format(parseLocalDate(date), "MMMM-d");

				const sessionsByDay = [];

				for (const games of session.games) {
					for (const sessions of games.sessions) {
						sessionsByDay.push(sessions);
					}
				}

				if (isNil(accumulator[formattedDate])) {
					accumulator[formattedDate] = sessionsByDay.sort(sortDateDesc);

					return accumulator;
				}

				accumulator[formattedDate].push(...sessionsByDay.sort(sortDateDesc));

				return accumulator;
			}, {});
	}, [currentPage.current().interval.start.getTime()]);

	const onNextYear = () => {
		setLoading(true);

		currentPage?.next().then((it) => {
			setCurrentPage(it);
			setLoading(false);
		});
	};

	const onPrevYear = () => {
		setLoading(true);

		currentPage?.prev().then((it) => {
			setCurrentPage(it);
			setLoading(false);
		});
	};

	return (
		<PageWrapper
			style={{
				paddingLeft: "2.8vw",
				paddingRight: "2.8vw",
				overflow: "auto",
				margin: "40px 0",
				position: "relative",
			}}
		>
			<Header gameId={gameId} />

			<PanelSection>
				<PanelSectionRow>
					<Pager
						onNext={onNextYear}
						onPrev={onPrevYear}
						currentText={formatYearInterval(currentPage.current().interval)}
						hasNext={currentPage.hasNext()}
						hasPrev={currentPage.hasPrev()}
						isEnabledChangePagesWithTriggers={true}
					/>
				</PanelSectionRow>
			</PanelSection>

			{isLoading && <div>Loading...</div>}

			{!isLoading && !currentPage && <div>Error while loading data</div>}

			{!isLoading && currentPage && (
				<>
					<YearlyAverageAndOverall statistics={currentPage.current().data} />

					<YearView statistics={currentPage.current().data} />

					<Sessions
						sessionsList={sessionsList}
						showTimeInHours={settings.displayTime.showTimeInHours}
						showSeconds={settings.displayTime.showSeconds}
					/>
				</>
			)}
		</PageWrapper>
	);
}
