import logger from "@src/utils/logger";
import { atom } from "nanostores";

export const gameChecksums = {
	dataBase: new Map<string, GameDictionary>(),
	nonSteam: new Map<string, LocalNonSteamGame>(),
};

export type LoadingStateValue = "empty" | "initialize" | "loading" | "loaded";

export const $gameChecksumsLoadingState = atom<LoadingStateValue>("empty");
export const $isLoadingChecksumFromDataBase = atom<boolean>(false);

export const $nonSteamAppsCount = atom<number>(0);
export const $generatingChecksumForAppWithIndex = atom<number>(0);
export const $isGeneratingChecksumForGames = atom<boolean>(false);

export const $isSavingChecksumsIntoDataBase = atom<boolean>(false);

export const unbindChecksumsLoadingStateListener =
	$gameChecksumsLoadingState.subscribe((value, oldValue) => {
		logger.debug(
			`$gameChecksumsLoadingState value changed from ${oldValue} to ${value}`,
		);

		if (value !== "empty") {
			return;
		}

		gameChecksums.dataBase.clear();
		gameChecksums.nonSteam.clear();
	});
