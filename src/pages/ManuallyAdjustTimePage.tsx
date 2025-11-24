import {
	ButtonItem,
	Dropdown,
	type DropdownOption,
	Focusable,
	PanelSection,
	TextField,
} from "@decky/ui";
import { map } from "@src/utils/map";
import { humanReadableTime } from "@utils/formatters";
import { useEffect, useState } from "react";
import type { DeepNonNullable } from "ts-essentials";
import { excludeApps } from "../app/timeManipulation";
import { PageWrapper } from "../components/PageWrapper";
import { useLocator } from "../locator";
import { navigateBack } from "./navigation";

const timeToSeconds = (
	hours: number,
	minutes: number,
	seconds: number,
): number => {
	return (hours || 0) * 3600 + (minutes || 0) * 60 + (seconds || 0);
};

const secondsToTime = (
	totalSeconds: number,
): { hours: number; minutes: number; seconds: number } => {
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = Math.round(totalSeconds % 60);

	return { hours, minutes, seconds };
};

interface TableRowsProps {
	appId: string | undefined;
	playTimeTrackedSec: number | undefined;
	desiredHours: number | undefined;
	desiredMinutes: number | undefined;
	desiredSeconds: number | undefined;
}

export const ManuallyAdjustTimePage = () => {
	const { timeManipulation: timeMigration, currentSettings: settings } =
		useLocator();
	const [isLoading, setLoading] = useState<boolean>(true);
	const [gameWithTimeByAppId, setGameWithTimeByAppId] = useState<
		Map<string, GamePlaytimeDetails>
	>(new Map());
	const [tableRows, setTableRows] = useState<TableRowsProps[]>([]);

	useEffect(() => {
		setLoading(true);

		timeMigration.fetchPlayTimeForAllGames([excludeApps]).then((playTime) => {
			setGameWithTimeByAppId(playTime);

			setTableRows([
				{
					appId: undefined,
					desiredHours: undefined,
					desiredMinutes: undefined,
					desiredSeconds: undefined,
					playTimeTrackedSec: undefined,
				},
			]);

			setLoading(false);
		});
	}, []);

	if (isLoading) {
		return (
			<PageWrapper>
				<span>Loading...</span>
			</PageWrapper>
		);
	}

	const gameOptions = Array.from(gameWithTimeByAppId.values()).map((it) => {
		return {
			data: it.game.id,
			label: it.game.name,
		} as DropdownOption;
	});
	const onGameChange = (index: number, appId: string) => {
		const newRows = [...tableRows];
		newRows[index].appId = appId;
		newRows[index].playTimeTrackedSec =
			gameWithTimeByAppId.get(appId)?.totalTime;

		const tracked = gameWithTimeByAppId.get(appId)?.totalTime || 0;
		const { hours, minutes, seconds } = secondsToTime(tracked);

		newRows[index].desiredHours = hours;
		newRows[index].desiredMinutes = minutes;
		newRows[index].desiredSeconds = seconds;

		setTableRows(newRows);
	};

	const onDesiredHoursChange = (index: number, hours: string) => {
		const newRows = [...tableRows];
		newRows[index].desiredHours = Number.parseFloat(hours) || 0;
		setTableRows(newRows);
	};

	const onDesiredMinutesChange = (index: number, minutes: string) => {
		const newRows = [...tableRows];
		newRows[index].desiredMinutes = Number.parseFloat(minutes) || 0;

		setTableRows(newRows);
	};

	const onDesiredSecondsChange = (index: number, seconds: string) => {
		const newRows = [...tableRows];
		newRows[index].desiredSeconds = Number.parseFloat(seconds) || 0;
		setTableRows(newRows);
	};

	const isRowValid = (row: TableRowsProps) => {
		const totalSeconds = timeToSeconds(
			row.desiredHours || 0,
			row.desiredMinutes || 0,
			row.desiredSeconds || 0,
		);
		return (
			row.appId !== undefined &&
			totalSeconds > 0 &&
			gameWithTimeByAppId.get(row.appId) !== undefined
		);
	};

	const saveMigration = async () => {
		const gamesToMigrate = tableRows
			.filter((it) => isRowValid(it))
			.map((it) => {
				const { appId, desiredHours, desiredMinutes, desiredSeconds } =
					it as DeepNonNullable<
						Pick<
							TableRowsProps,
							"appId" | "desiredHours" | "desiredMinutes" | "desiredSeconds"
						>
					>;

				const totalSeconds = timeToSeconds(
					desiredHours,
					desiredMinutes,
					desiredSeconds,
				);

				return {
					game: gameWithTimeByAppId.get(appId)?.game,
					totalTime: totalSeconds,
				} as GamePlaytimeDetails;
			});

		await timeMigration
			.applyManualOverallTimeCorrection(gamesToMigrate[0])
			.then((hasBeenAppliedManualTimeCorrection) => {
				if (!hasBeenAppliedManualTimeCorrection) {
					return;
				}

				navigateBack();
			});
	};

	return (
		<PageWrapper>
			<Focusable style={{ height: "100%", overflow: "scroll" }}>
				<PanelSection>
					<ButtonItem layout="below" onClick={() => saveMigration()}>
						Migrate
					</ButtonItem>

					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "12px",
							marginTop: "16px",
						}}
					>
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "2fr 1.5fr 2fr",
								gap: "12px",
								padding: "12px",
								backgroundColor: "rgba(0, 0, 0, 0.3)",
								borderRadius: "4px",
								borderBottom: "2px solid rgba(255, 255, 255, 0.1)",
							}}
						>
							<div
								style={{
									fontWeight: 600,
									fontSize: "14px",
									color: "rgba(255, 255, 255, 0.8)",
									textTransform: "uppercase",
									letterSpacing: "0.5px",
								}}
							>
								Game
							</div>
							<div
								style={{
									fontWeight: 600,
									fontSize: "14px",
									color: "rgba(255, 255, 255, 0.8)",
									textTransform: "uppercase",
									letterSpacing: "0.5px",
									textAlign: "center",
								}}
							>
								Tracked
							</div>
							<div
								style={{
									fontWeight: 600,
									fontSize: "14px",
									color: "rgba(255, 255, 255, 0.8)",
									textTransform: "uppercase",
									letterSpacing: "0.5px",
									textAlign: "center",
								}}
							>
								Adjust Time (H:M:S)
							</div>
						</div>

						{tableRows.map((row, idx) => (
							<div
								key={row.appId || idx}
								style={{
									display: "grid",
									gridTemplateColumns: "2fr 1.5fr 2fr",
									gap: "12px",
									padding: "12px",
									borderRadius: "4px",
									backgroundColor: isRowValid(row)
										? "rgba(12, 39, 12, 0.6)"
										: "rgba(77, 0, 0, 0.6)",
									border: `1px solid ${isRowValid(row) ? "rgba(76, 175, 80, 0.3)" : "rgba(244, 67, 54, 0.3)"}`,
									transition: "all 0.2s ease",
								}}
							>
								<div>
									<Dropdown
										rgOptions={gameOptions}
										selectedOption={row.appId}
										onChange={(e) => onGameChange(idx, e.data)}
									/>
								</div>

								<div
									style={{
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										fontSize: "13px",
										color: "rgba(255, 255, 255, 0.8)",
										backgroundColor: "rgba(0, 0, 0, 0.2)",
										borderRadius: "3px",
										minHeight: "40px",
									}}
								>
									{map(row.playTimeTrackedSec, (it) =>
										humanReadableTime(
											settings.displayTime.showTimeInHours,
											it,
											true,
											settings.displayTime.showSeconds,
										),
									)}
								</div>

								<div
									style={{
										display: "flex",
										gap: "8px",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<div style={{ flex: 1 }}>
										<TextField
											mustBeNumeric
											value={(row.desiredHours || 0).toString()}
											onChange={(e) =>
												onDesiredHoursChange(idx, e.target.value)
											}
										/>
									</div>

									<span
										style={{
											fontWeight: "bold",
											fontSize: "16px",
											color: "rgba(255, 255, 255, 0.6)",
										}}
									>
										:
									</span>

									<div style={{ flex: 1 }}>
										<TextField
											mustBeNumeric
											value={(row.desiredMinutes || 0).toString()}
											onChange={(e) =>
												onDesiredMinutesChange(idx, e.target.value)
											}
										/>
									</div>

									<span
										style={{
											fontWeight: "bold",
											fontSize: "16px",
											color: "rgba(255, 255, 255, 0.6)",
										}}
									>
										:
									</span>

									<div style={{ flex: 1 }}>
										<TextField
											mustBeNumeric
											value={(row.desiredSeconds || 0).toString()}
											onChange={(e) =>
												onDesiredSecondsChange(idx, e.target.value)
											}
										/>
									</div>
								</div>
							</div>
						))}
					</div>
				</PanelSection>
			</Focusable>
		</PageWrapper>
	);
};
