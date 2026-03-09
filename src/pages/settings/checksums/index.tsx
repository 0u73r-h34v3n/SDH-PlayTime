import { toaster } from "@decky/api";
import {
	DialogButton,
	Focusable,
	Menu,
	MenuItem,
	ModalRoot,
	showContextMenu,
	showModal,
} from "@decky/ui";
import { useStore } from "@nanostores/react";
import { Backend } from "@src/app/backend";
import {
	getNonSteamGamesChecksumFromDataBase,
	initializeGameDetectionByChecksum,
} from "@src/app/games";
import { FocusableExt } from "@src/components/FocusableExt";
import {
	$gameCheksumsLoadingState,
	$generatingChecksumForAppWithIndex,
	$isGeneratingChecksumForGames,
	$isLoadingChecksumFromDataBase,
	$isSavingChecksumsIntoDataBase,
	$nonSteamAppsCount,
	gameChecksums,
} from "@src/stores/games";
import { TableCSS } from "@src/styles";
import { isNil } from "es-toolkit";
import logger from "@src/utils/logger";
import { useEffect, useState } from "react";

function verifyIfHasChecksumSaved(
	fileChecksum: Nullable<string>,
	dbChecksum: Nullable<Array<string>>,
) {
	if (isNil(fileChecksum) || isNil(dbChecksum)) {
		return false;
	}

	return dbChecksum.includes(fileChecksum);
}

const showGameInformation = (
	game: LocalNonSteamGame,
	hasChecksum: boolean,
	hasChecksumSaved: boolean,
) => {
	showModal(
		<ModalRoot>
			<h2>{game.name}</h2>

			<details>
				<summary>Raw information</summary>
				<pre
					style={{
						whiteSpace: "pre-wrap",
						wordWrap: "break-word",
						fontSize: "13px",
					}}
				>
					{JSON.stringify(game, null, 2)}
				</pre>
				{JSON.stringify(hasChecksum)} | {JSON.stringify(hasChecksumSaved)}
			</details>
		</ModalRoot>,
		window,
	);
};

function showChecksumContextMenu(
	gameInformation: LocalNonSteamGame,
	hasChecksum: boolean,
	hasChecksumSaved: boolean,
) {
	// TODO: Implement detection by ID

	showContextMenu(
		<Menu label="Actions">
			<MenuItem
				onSelected={() => {
					if (isNil(gameInformation.checksum)) {
						toaster.toast({
							title: "PlayTime",
							body: "Checksum is undefined",
						});

						return;
					}

					Backend.addGameChecksum(
						gameInformation.id,
						gameInformation.checksum,
						"SHA256",
						// NOTE(ynhhoJ): 16 MB
						16 * 1024 * 1024,
					).then(async () => {
						toaster.toast({
							title: "PlayTime",
							body: `Saved checksum for ${gameInformation.name}`,
						});
					});
				}}
				disabled={hasChecksum && hasChecksumSaved}
			>
				Save checksum in DataBase
			</MenuItem>

			<MenuItem
				onSelected={() => {
					if (isNil(gameInformation.checksum)) {
						toaster.toast({
							title: "PlayTime",
							body: "Checksum is undefined",
						});

						return;
					}

					Backend.removeGameChecksum(
						gameInformation.id,
						gameInformation.checksum,
					).then(async () => {
						toaster.toast({
							title: "PlayTime",
							body: `Removed "${gameInformation.name}" checksum`,
						});

						await initializeGameDetectionByChecksum();
					});
				}}
				disabled={hasChecksum && !hasChecksumSaved}
				tone="destructive"
			>
				Remove checksum
			</MenuItem>
		</Menu>,
	);
}

async function updateChecksumList() {
	$gameCheksumsLoadingState.set("loading");
	await getNonSteamGamesChecksumFromDataBase();
	$gameCheksumsLoadingState.set("loaded");
}

async function saveAllChecksums(tableRows: Array<LocalNonSteamGame>) {
	if ($isSavingChecksumsIntoDataBase.get()) {
		return;
	}

	$isSavingChecksumsIntoDataBase.set(true);

	const savedChecksumsForGames: Array<AddGameChecksumDTO> = [];

	for (const game of tableRows) {
		const { checksum } = game;
		const hasChecksum = !isNil(checksum);

		if (!hasChecksum) {
			continue;
		}

		const hasChecksumSaved = verifyIfHasChecksumSaved(
			game?.checksum,
			gameChecksums.dataBase.get(game.id)?.files.map((item) => item.checksum),
		);

		if (hasChecksumSaved) {
			continue;
		}

		const hasDuplicate = [...gameChecksums.dataBase]
			.map((item) => item[1])
			.find((item) =>
				item.files.find(
					(checksum) =>
						checksum.checksum === game?.checksum && item.game.id !== game?.id,
				),
			);

		if (hasDuplicate) {
			return;
		}

		savedChecksumsForGames.push({
			game_id: game.id,
			checksum,
			algorithm: "SHA256",
			chunk_size: 16 * 1024 * 1024,
		});
	}

	await Backend.addGameChecksumBulk(savedChecksumsForGames).then(async () => {
		toaster.toast({
			title: "PlayTime",
			body: `Saved checksum for ${savedChecksumsForGames.length} games`,
		});

		logger.debug(
			`Saved checksum for ${savedChecksumsForGames.length} games`,
			savedChecksumsForGames,
		);

		$isSavingChecksumsIntoDataBase.set(false);

		await updateChecksumList();
	});
}

async function removeAllChecksums() {
	return Backend.removeAllChecksums().then(async (response) => {
		toaster.toast({
			title: "PlayTime",
			body: `${response} checksums was removed from DataBase`,
		});

		await updateChecksumList();
	});
}

function FileChecksumStatus({
	hasChecksumSaved,
	game,
}: {
	game: LocalNonSteamGame;
	hasChecksumSaved: boolean;
}) {
	if (isNil(game?.pathToGame)) {
		return (
			<span className="inline-flex justify-center items-center rounded-md bg-red-400/10 px-2 py-1 text-xs font-medium text-red-400 ring-1 ring-red-400/20 ring-inset">
				File not found or unsupported path
			</span>
		);
	}

	if (isNil(game?.checksum)) {
		return (
			<span className="inline-flex justify-center items-center rounded-md bg-red-400/10 px-2 py-1 text-xs font-medium text-red-400 ring-1 ring-red-400/20 ring-inset">
				Unknown checksum
			</span>
		);
	}

	if (!hasChecksumSaved) {
		return (
			<span className="inline-flex justify-center items-center rounded-md bg-yellow-400/10 px-2 py-1 text-xs font-medium text-yellow-400 ring-1 ring-yellow-400/20 ring-inset">
				Not saved
			</span>
		);
	}

	return (
		<span className="inline-flex justify-center items-center rounded-md bg-green-400/10 px-2 py-1 text-xs font-medium text-green-400 ring-1 ring-green-400/20 ring-inset">
			Saved
		</span>
	);
}

export function FileChecksum() {
	const [tableRows, setTableRows] = useState<Array<LocalNonSteamGame>>([]);
	const gameCheksumsLoadingStateStore = useStore($gameCheksumsLoadingState);
	const isLoadingChecksumFromDataBase = useStore(
		$isLoadingChecksumFromDataBase,
	);
	const isGeneratingChecksumForGames = useStore($isGeneratingChecksumForGames);
	const nonSteamAppsCount = useStore($nonSteamAppsCount);
	const generatingChecksumForAppWithIndex = useStore(
		$generatingChecksumForAppWithIndex,
	);
	const isSavingChecksumsIntoDataBase = useStore(
		$isSavingChecksumsIntoDataBase,
	);
	const [hasMinRequiredPythonVersion, setHasMinRequiredPythonVersion] =
		useState<Nullable<boolean>>(undefined);

	useEffect(() => {
		Backend.hasMinRequiredPythonVersion().then((response) => {
			setHasMinRequiredPythonVersion(response);

			if (!response) {
				return;
			}

			if (gameCheksumsLoadingStateStore === "loaded") {
				setTableRows(
					Array.from(gameChecksums.nonSteam).map(([_name, value]) => value),
				);

				return;
			}

			if (
				gameCheksumsLoadingStateStore === "initialize" ||
				gameCheksumsLoadingStateStore === "empty"
			) {
				initializeGameDetectionByChecksum().then(() => {
					setTableRows(
						Array.from(gameChecksums.nonSteam).map(([_name, value]) => value),
					);
				});
			}
		});
	}, [gameCheksumsLoadingStateStore]);

	if (!isNil(hasMinRequiredPythonVersion) && !hasMinRequiredPythonVersion) {
		return <span>Python 3.11 or higher is required.</span>;
	}

	if (gameCheksumsLoadingStateStore === "loading") {
		if (isLoadingChecksumFromDataBase) {
			return <span>Loading checksums from database...</span>;
		}

		if (isGeneratingChecksumForGames) {
			return (
				<span>
					Generating checksum for {generatingChecksumForAppWithIndex}/
					{nonSteamAppsCount}
				</span>
			);
		}

		return <span>Loading...</span>;
	}

	return (
		<>
			<Focusable
				style={{ display: "flex", alignItems: "center", gap: "1rem" }}
				flow-children="horizontal"
			>
				<DialogButton onClick={removeAllChecksums}>
					Remove all checksums from DB
				</DialogButton>

				<DialogButton
					onClick={async () => await saveAllChecksums(tableRows)}
					disabled={isSavingChecksumsIntoDataBase}
				>
					Save all checksums in DB
				</DialogButton>
			</Focusable>

			<div style={TableCSS.table__container}>
				<div
					className="header-row"
					style={{
						gridTemplateColumns: "70% 30%",
						...TableCSS.header__row,
					}}
				>
					<div style={TableCSS.header__col}>Name</div>
					<div style={TableCSS.header__col}>Status</div>
				</div>
			</div>

			{tableRows.map((row) => {
				const hasChecksum = !isNil(row?.checksum);
				const hasChecksumSaved = verifyIfHasChecksumSaved(
					row?.checksum,
					gameChecksums.dataBase
						.get(row.id)
						?.files.map((item) => item.checksum),
				);

				return (
					<FocusableExt
						key={row.id}
						flow-children="horizontal"
						style={{
							gridTemplateColumns: "75% 25%",
							...TableCSS.table__row,
							textAlign: "left",
						}}
						onMenuActionDescription="Options"
						onMenuButton={() =>
							showChecksumContextMenu(row, hasChecksum, hasChecksumSaved)
						}
						onOKActionDescription="Details"
						onOKButton={() =>
							showGameInformation(row, hasChecksum, hasChecksumSaved)
						}
					>
						<div
							style={{
								padding: "0 0.5rem",
								display: "flex",
								alignItems: "center",
							}}
						>
							{row.name}
						</div>

						<FileChecksumStatus
							hasChecksumSaved={hasChecksumSaved}
							game={row}
						/>
					</FocusableExt>
				);
			})}
		</>
	);
}
