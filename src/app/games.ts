import { toaster } from "@decky/api";
import { getPathToGame } from "@src/steam/utils/GamePaths";
import {
	$gameChecksumsLoadingState,
	$generatingChecksumForAppWithIndex,
	$isGeneratingChecksumForGames,
	$isLoadingChecksumFromDataBase,
	$nonSteamAppsCount,
	gameChecksums,
} from "@src/stores/games";
import { isNil } from "es-toolkit";
import logger from "@src/utils/logger";
import { Backend } from "./backend";
import { APP_TYPE } from "@src/constants";
import { $toggleUpdateInListeningComponents } from "@src/stores/ui";

export function getAllNonSteamAppIds() {
	if (isNil(collectionStore.deckDesktopApps)) {
		return appStore.allApps
			.filter((item) => item.app_type === APP_TYPE.THIRD_PARTY)
			.map((item) => Number.parseInt(item.gameid, 10));
	}

	return Array.from(collectionStore.deckDesktopApps.apps.keys());
}

export async function getFileSHA256(applicationId: number) {
	try {
		const pathToGame = await getPathToGame(applicationId);
		const { display_name: displayName } =
			appStore.GetAppOverviewByAppID(applicationId);

		if (isNil(pathToGame)) {
			logger.debug(
				"[getFileSHA256] null or empty path to game. App ID: ",
				applicationId,
			);

			return {
				id: `${applicationId}`,
				name: displayName,
			};
		}

		const fileSHA256 = await Backend.getFileSHA256(pathToGame);

		if (isNil(fileSHA256)) {
			return {
				id: `${applicationId}`,
				name: displayName,
				pathToGame: pathToGame,
			};
		}

		return {
			id: `${applicationId}`,
			name: displayName,
			checksum: fileSHA256,
			pathToGame,
		};
	} catch (error) {
		logger.error(error);

		return undefined;
	}
}

export async function getNonSteamGamesChecksumFromDataBase() {
	$isLoadingChecksumFromDataBase.set(true);

	return await Backend.getGamesDictionary()
		.then((response) => {
			if (isNil(response)) {
				return;
			}

			const nonSteamKeys = getAllNonSteamAppIds();
			const onlyNonSteamGames = response
				.filter((game) =>
					nonSteamKeys.includes(Number.parseInt(game.game.id, 10)),
				)
				.sort((a, b) => a.game.name.localeCompare(b.game.name))
				.map((item) => ({
					...item,
					...gameChecksums.nonSteam.get(item.game.id),
				}));

			for (const nonSteamGame of onlyNonSteamGames) {
				gameChecksums.dataBase.set(nonSteamGame.game.id, nonSteamGame);
			}
		})
		.finally(() => {
			$isLoadingChecksumFromDataBase.set(false);
		});
}

export async function getCurrentNonSteamGamesChecksum(
	allNonSteamAppIds: Array<number>,
) {
	if (gameChecksums.nonSteam.size !== 0) {
		return;
	}

	$isGeneratingChecksumForGames.set(true);

	for (const [index, applicationId] of allNonSteamAppIds.entries()) {
		$generatingChecksumForAppWithIndex.set(index);

		await getFileSHA256(applicationId).then((response) => {
			if (isNil(response)) {
				return;
			}

			gameChecksums.nonSteam.set(`${applicationId}`, response);
		});
	}

	$isGeneratingChecksumForGames.set(false);
}

export async function findGameWithSameChecksum(appId: number) {
	const fileSHA256 = await getFileSHA256(appId);

	const array = [...gameChecksums.dataBase].map((item) => item[1]);

	const gameWithSameSHA256 = array.find((item) =>
		item.files.find((checksum) => checksum.checksum === fileSHA256?.checksum),
	);

	return gameWithSameSHA256;
}

export async function initializeGameDetectionByChecksum() {
	if ($gameChecksumsLoadingState.get() === "loading") {
		return;
	}

	$gameChecksumsLoadingState.set("loading");

	const allNonSteamAppIds = getAllNonSteamAppIds();
	const allNonSteamAppIdsLength = allNonSteamAppIds.length;

	$nonSteamAppsCount.set(allNonSteamAppIdsLength);

	toaster.toast({
		title: "PlayTime",
		body: `Generating SHA256 for ${allNonSteamAppIdsLength} non-steam games.`,
	});

	await getNonSteamGamesChecksumFromDataBase();
	await getCurrentNonSteamGamesChecksum(allNonSteamAppIds);

	$gameChecksumsLoadingState.set("loaded");

	toaster.toast({
		title: "PlayTime",
		body: `Generated SHA256 for ${gameChecksums.nonSteam.size}/${allNonSteamAppIdsLength} non-steam games.`,
	});
}

export async function addGameChecksumById(gameId: string) {
	const checksum = await getFileSHA256(Number.parseInt(gameId, 10));

	if (isNil(checksum)) {
		toaster.toast({
			title: "PlayTime",
			body: "An error happened while generating file checksum",
		});

		return;
	}

	if (isNil(checksum?.pathToGame)) {
		toaster.toast({
			title: "PlayTime",
			body: "Impossible to detect path to game.",
		});

		return;
	}

	if (isNil(checksum.checksum)) {
		toaster.toast({
			title: "PlayTime",
			body: "File checksum is undefined.",
		});

		return;
	}

	return await Backend.addGameChecksum(
		gameId,
		checksum.checksum,
		"SHA256",
		// NOTE(ynhhoJ): 16 MB
		16 * 1024 * 1024,
	).then(async () => {
		$toggleUpdateInListeningComponents.set(
			!$toggleUpdateInListeningComponents.get(),
		);

		toaster.toast({
			title: "PlayTime",
			body: `Saved checksum for ${checksum.name}`,
		});
	});
}

export async function addGameChecksumByFile(game: Game, filePath?: string) {
	if (isNil(game) || isNil(game.id) || isNil(game.name)) {
		toaster.toast({
			title: "PlayTime",
			body: "Impossible to detect game for what should be generated checksum.",
		});

		return;
	}

	if (isNil(filePath)) {
		toaster.toast({
			title: "PlayTime",
			body: "Impossible to detect path to game.",
		});

		return;
	}

	const checksum = await Backend.getFileSHA256(filePath);

	if (isNil(checksum)) {
		toaster.toast({
			title: "PlayTime",
			body: "An error happened while generating file checksum",
		});

		return;
	}

	return await Backend.addGameChecksum(
		game.id,
		checksum,
		"SHA256",
		// NOTE(ynhhoJ): 16 MB
		16 * 1024 * 1024,
	).then(async () => {
		$toggleUpdateInListeningComponents.set(
			!$toggleUpdateInListeningComponents.get(),
		);

		toaster.toast({
			title: "PlayTime",
			body: `Saved checksum for ${game.name}`,
		});
	});
}
