import {
	ButtonItem,
	Dropdown,
	type DropdownOption,
	Focusable,
	PanelSection,
	TextField,
} from "@decky/ui";
import { ifNull } from "@src/utils/ifNull";
import { map } from "@src/utils/map";
import { humanReadableTime } from "@utils/formatters";
import { useEffect, useState } from "react";
import type { DeepNonNullable } from "ts-essentials";
import { excludeApps } from "../app/timeManipulation";
import { PageWrapper } from "../components/PageWrapper";
import { useLocator } from "../locator";
import { TableCSS } from "../styles";
import { navigateBack } from "./navigation";

interface TableRowsProps {
	appId: string | undefined;
	playTimeTrackedSec: number | undefined;
	desiredHours: number | undefined;
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
		newRows[index].desiredHours =
			ifNull(newRows[index].playTimeTrackedSec, 0) / 3600;
		setTableRows(newRows);
	};

	const onDesiredHoursChange = (index: number, hours: string) => {
		const newRows = [...tableRows];
		newRows[index].desiredHours = Number.parseFloat(hours);
		setTableRows(newRows);
	};

	const isRowValid = (row: TableRowsProps) => {
		return (
			row.appId !== undefined &&
			row.desiredHours !== undefined &&
			row.desiredHours > 0 &&
			gameWithTimeByAppId.get(row.appId) !== undefined
		);
	};

	const saveMigration = async () => {
		const gamesToMigrate = tableRows
			.filter((it) => isRowValid(it))
			.map((it) => {
				const { appId, desiredHours } = it as DeepNonNullable<TableRowsProps>;

				return {
					game: gameWithTimeByAppId.get(appId)?.game,
					totalTime: desiredHours * 3600,
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

	const rowCorrectnessClass = (row: TableRowsProps) => {
		return isRowValid(row)
			? TableCSS.table__row_correct
			: TableCSS.table__row_not_correct;
	};

	return (
		<PageWrapper>
			<Focusable style={{ height: "100%", overflow: "scroll" }}>
				<PanelSection>
					<ButtonItem layout="below" onClick={() => saveMigration()}>
						Migrate
					</ButtonItem>
					<div style={TableCSS.table__container}>
						<div
							className="header-row"
							style={{
								gridTemplateColumns: "50% 25% 25%",
								...TableCSS.header__row,
							}}
						>
							<div style={TableCSS.header__col}>Game</div>
							<div style={TableCSS.header__col}>Tracked Time</div>
							<div style={TableCSS.header__col}>Should be Hours</div>
						</div>

						{tableRows.map((row, idx) => (
							<Focusable
								key={row.appId}
								flow-children="horizontal"
								style={{
									gridTemplateColumns: "50% 25% 25%",
									...TableCSS.table__row,
									...rowCorrectnessClass(row),
								}}
							>
								<Dropdown
									rgOptions={gameOptions}
									selectedOption={row.appId}
									onChange={(e) => onGameChange(idx, e.data)}
								/>

								<div>
									{map(row.playTimeTrackedSec, (it) =>
										humanReadableTime(
											settings.displayTime.showTimeInHours,
											it,
											true,
											settings.displayTime.showSeconds,
										),
									)}
								</div>

								<TextField
									mustBeNumeric
									onChange={(e) => onDesiredHoursChange(idx, e.target.value)}
								/>
							</Focusable>
						))}
					</div>
				</PanelSection>
			</Focusable>
		</PageWrapper>
	);
};
