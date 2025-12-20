import { FileSelectionType, openFilePicker, toaster } from "@decky/api";
import {
	DialogButton,
	Focusable,
	Menu,
	MenuGroup,
	MenuItem,
	ModalRoot,
	showContextMenu,
	showModal,
} from "@decky/ui";
import { Backend } from "@src/app/backend";
import { addGameChecksumByFile, addGameChecksumById } from "@src/app/games";
import { $toggleUpdateInListeningComponents } from "@src/stores/ui";
import { isNil } from "@src/utils/isNil";
import logger from "@src/utils/logger";
import { useEffect, useState } from "react";

type ShowGameOptionsContextMenuProperties = {
	gameName: string;
	gameId: string;
	hasChecksumEnabled: boolean;
};

async function linkToAnotherGameWithChecksum(
	childGameId: string,
	parentGameId: string,
) {
	await Backend.linkGameToGameWithChecksum(childGameId, parentGameId).then(
		() => {
			$toggleUpdateInListeningComponents.set(
				!$toggleUpdateInListeningComponents.get(),
			);
		},
	);
}

function showLinkToAnotherGameWithChecksumContextMenu(
	gameId: string,
	gameName: string,
	hasChecksum: boolean = false,
	gamesWithChecksums: Array<FileChecksum>,
) {
	if (hasChecksum) {
		toaster.toast({
			title: "PlayTime",
			body: "Can not link checksum for a game which already has checksum",
		});

		return;
	}

	const gamesWhichChecksums = [];

	for (const gameWithChecksum of gamesWithChecksums) {
		gamesWhichChecksums.push({
			id: gameWithChecksum.game.id,
			name: gameWithChecksum.game.name,
		});
	}

	showContextMenu(
		<Menu label={`${gameName} (ID: ${gameId})`}>
			{gamesWhichChecksums.map((item) => {
				if (gameId === item.id) {
					return undefined;
				}

				return (
					<MenuItem
						key={item.id}
						onClick={() => linkToAnotherGameWithChecksum(gameId, item.id)}
					>
						{item.name} (ID: {gameId})
					</MenuItem>
				);
			})}
		</Menu>,
	);
}

function ChecksumOptionsMenu({
	gameName,
	gameId,
	hasChecksumEnabled,
}: ShowGameOptionsContextMenuProperties) {
	const [isLoading, setIsLoading] = useState(true);
	const [gamesWithChecksums, setGamesWithChecksum] = useState<
		Array<FileChecksum>
	>([]);
	const [currentGameChecksum, setCurrentGameChecksum] =
		useState<Nullable<FileChecksum>>(undefined);

	useEffect(() => {
		if (!hasChecksumEnabled) {
			return;
		}

		Backend.getGamesChecksum().then((response) => {
			const gameIdWithChecksum = response.find(
				(item) => item?.game.id === gameId,
			);

			if (!isNil(gameIdWithChecksum)) {
				setCurrentGameChecksum(gameIdWithChecksum);
			}

			setGamesWithChecksum(response);
			setIsLoading(false);
		});
	}, []);

	if (!hasChecksumEnabled) {
		return undefined;
	}

	// NOTE(ynhhoJ): Only non-steam games have 10 number length of `ID`
	if (gameId.length < 10) {
		return undefined;
	}

	if (isLoading) {
		return <MenuItem disabled>Loading...</MenuItem>;
	}

	const hasChecksum = !isNil(currentGameChecksum);

	return (
		<MenuGroup label="Checksum">
			<MenuItem
				onClick={async () => {
					const path = await Backend.getDeckyHome();

					openFilePicker(
						FileSelectionType.FILE,
						path,
						true,
						true,
						undefined,
						undefined,
						false,
						false,
					).then((val) => {
						addGameChecksumByFile({ id: gameId, name: gameName }, val.path);
					});
				}}
				disabled={hasChecksum}
			>
				Add game checksum by file
			</MenuItem>

			<MenuItem
				onClick={() =>
					showLinkToAnotherGameWithChecksumContextMenu(
						gameId,
						gameName,
						hasChecksum,
						gamesWithChecksums,
					)
				}
				disabled={hasChecksum}
			>
				Link to another game with checksum
			</MenuItem>

			<MenuItem
				onClick={() => addGameChecksumById(gameId)}
				disabled={hasChecksum}
			>
				Add game checksum to DB
			</MenuItem>

			<MenuItem
				tone="destructive"
				disabled={!hasChecksum}
				onClick={() => {
					if (
						isNil(currentGameChecksum) ||
						isNil(currentGameChecksum?.checksum)
					) {
						return;
					}

					Backend.removeGameChecksum(
						gameId,
						currentGameChecksum?.checksum,
					).then(() => {
						$toggleUpdateInListeningComponents.set(
							!$toggleUpdateInListeningComponents.get(),
						);
					});
				}}
			>
				Remove game checksum
			</MenuItem>
		</MenuGroup>
	);
}

function showDeleteGameConfirmation(gameId: string, gameName: string) {
	const modalResult = showModal(
		<ModalRoot>
			<div style={{ padding: "20px" }}>
				<h2 style={{ marginBottom: "16px", color: "#ff5e5b" }}>
					Delete Game from Database
				</h2>
				<p style={{ marginBottom: "24px", lineHeight: "1.5" }}>
					Are you sure you want to delete <strong>"{gameName}"</strong> (ID:{" "}
					{gameId}) from the database?
				</p>
				<p
					style={{
						marginBottom: "24px",
						color: "#ff5e5b",
						fontSize: "14px",
						lineHeight: "1.5",
					}}
				>
					This action cannot be undone. All playtime data for this game will be permanently deleted.
				</p>
				<Focusable
					style={{
						display: "flex",
						gap: "12px",
						justifyContent: "flex-end",
					}}
					flow-children="horizontal"
				>
					<DialogButton onClick={() => modalResult.Close()}>
						Cancel
					</DialogButton>
					<DialogButton
						onClick={() => {
							modalResult.Close();
							Backend.deleteGame(gameId)
								.then(() => {
									toaster.toast({
										title: "PlayTime",
										body: `Deleted "${gameName}" from database`,
									});
									$toggleUpdateInListeningComponents.set(
										!$toggleUpdateInListeningComponents.get(),
									);
								})
								.catch((error) => {
									logger.error("deleteGame error:", error);
									toaster.toast({
										title: "PlayTime",
										body: `Failed to delete "${gameName}"`,
									});
								});
						}}
						className="delete-game-button"
						style={{
							background: "#ff5e5b",
							color: "#fff",
						}}
					>
						Delete
					</DialogButton>
				</Focusable>
				<style>
					{`
						.delete-game-button.gpfocus,
						.delete-game-button.gpfocuswithin {
							background: #ff7a77 !important;
							filter: brightness(1.1);
						}
					`}
				</style>
			</div>
		</ModalRoot>,
		window,
	);
}

export function showGameOptionsContextMenu({
	gameName,
	gameId,
	hasChecksumEnabled,
}: ShowGameOptionsContextMenuProperties) {
	return () => {
		showContextMenu(
			<Menu label={`${gameName} (ID: ${gameId})`}>
				<ChecksumOptionsMenu
					hasChecksumEnabled={hasChecksumEnabled}
					gameId={gameId}
					gameName={gameName}
				/>
				<MenuItem
					onClick={() => {
						showDeleteGameConfirmation(gameId, gameName);
					}}
				>
					Delete game from database
				</MenuItem>
			</Menu>,
		);
	};
}
