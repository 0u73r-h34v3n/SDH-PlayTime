import { FileSelectionType, openFilePicker, toaster } from "@decky/api";
import { Menu, MenuGroup, MenuItem, showContextMenu } from "@decky/ui";
import { Backend } from "@src/app/backend";
import { addGameChecksumByFile, addGameChecksumById } from "@src/app/games";
import { $toggleUpdateInListeningComponents } from "@src/stores/ui";
import { isNil } from "@src/utils/isNil";
import { useEffect, useState } from "react";
import type { TrackingService } from "@src/app/tracking";
import { TRACKING_STATUS_OPTIONS } from "@src/pages/tracking/constants";
import type { TrackingStatus } from "@src/types/tracking";
import { getStatusLabel } from "@src/pages/tracking/utils";

type ShowGameOptionsContextMenuProperties = {
	gameName: string;
	gameId: string;
	hasChecksumEnabled: boolean;
	trackingService: TrackingService;
};

type ChecksumOptionsMenuProperties = {
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
}: ChecksumOptionsMenuProperties) {
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

async function changeTrackingStatus(
	gameId: string,
	status: TrackingStatus,
	trackingService: TrackingService,
) {
	const success = await trackingService.setGameTrackingStatus(gameId, status);
	if (success) {
		toaster.toast({
			title: "PlayTime",
			body: `Tracking status updated to "${getStatusLabel(status)}"`,
		});
		$toggleUpdateInListeningComponents.set(
			!$toggleUpdateInListeningComponents.get(),
		);
	} else {
		toaster.toast({
			title: "PlayTime",
			body: "Failed to update tracking status",
		});
	}
}

function GameTrackingMenu({
	gameId,
	trackingService,
}: {
	gameId: string;
	trackingService: TrackingService;
}) {
	const [isLoading, setIsLoading] = useState(true);
	const [currentStatus, setCurrentStatus] = useState<TrackingStatus>("default");

	useEffect(() => {
		trackingService.getGameTrackingStatus(gameId).then((status) => {
			setCurrentStatus(status);
			setIsLoading(false);
		});
	}, [gameId]);

	if (isLoading) {
		return (
			<MenuGroup label="Tracking Status">
				<MenuItem disabled>Loading...</MenuItem>
			</MenuGroup>
		);
	}

	return (
		<MenuGroup label="Tracking Status">
			{TRACKING_STATUS_OPTIONS.map((option) => (
				<MenuItem
					key={option.data}
					onClick={() =>
						changeTrackingStatus(gameId, option.data, trackingService)
					}
					disabled={currentStatus === option.data}
				>
					<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
						<div style={{ color: option.color }}>{option.icon}</div>
						<div>
							<div style={{ color: option.color, fontWeight: 500 }}>
								{option.label}
								{currentStatus === option.data && " (Current)"}
							</div>

							<div
								style={{
									fontSize: "11px",
									color: "#8b929a",
									marginTop: "2px",
								}}
							>
								{option.description}
							</div>
						</div>
					</div>
				</MenuItem>
			))}
		</MenuGroup>
	);
}

export function showGameOptionsContextMenu({
	gameName,
	gameId,
	hasChecksumEnabled,
	trackingService,
}: ShowGameOptionsContextMenuProperties) {
	return () => {
		showContextMenu(
			<Menu label={`${gameName} (ID: ${gameId})`}>
				<ChecksumOptionsMenu
					hasChecksumEnabled={hasChecksumEnabled}
					gameId={gameId}
					gameName={gameName}
				/>
				<GameTrackingMenu gameId={gameId} trackingService={trackingService} />
				<MenuItem disabled>Soon™...</MenuItem>
			</Menu>,
		);
	};
}
