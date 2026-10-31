import type { SteamAppOverview } from "@decky/ui/dist/globals/steam-client/App";
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

mock.module("@decky/api", () => ({
	call: async () => undefined,
	toaster: { toast: () => {} },
}));

const { Backend } = await import("@src/app/backend");
const { getNonSteamGamesChecksumFromDataBase } = await import("@src/app/games");
const { gameChecksums } = await import("@src/stores/games");

type DeckDesktopAppsFixture = {
	allApps: Array<Pick<SteamAppOverview, "appid">>;
};

describe("getNonSteamGamesChecksumFromDataBase", () => {
	let originalGetGamesDictionary: typeof Backend.getGamesDictionary;

	beforeEach(() => {
		originalGetGamesDictionary = Backend.getGamesDictionary;
		gameChecksums.dataBase.clear();
		gameChecksums.nonSteam.clear();

		const deckDesktopApps: DeckDesktopAppsFixture = {
			allApps: [{ appid: 123 }],
		};

		Object.defineProperty(globalThis, "collectionStore", {
			configurable: true,
			writable: true,
			value: { deckDesktopApps },
		});

		Backend.getGamesDictionary = async () => [
			{ game: { id: "00123", name: "Non-Steam Game" }, files: [] },
			{ game: { id: "456", name: "Steam Game" }, files: [] },
		];
	});

	afterEach(() => {
		Backend.getGamesDictionary = originalGetGamesDictionary;
		gameChecksums.dataBase.clear();
		gameChecksums.nonSteam.clear();
		Reflect.deleteProperty(globalThis, "collectionStore");
	});

	test("filters the dictionary by non-Steam numeric IDs", async () => {
		await getNonSteamGamesChecksumFromDataBase();

		expect(gameChecksums.dataBase.has("00123")).toBe(true);
		expect(gameChecksums.dataBase.has("456")).toBe(false);
	});
});
