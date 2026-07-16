import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

mock.module("@decky/api", () => ({
	call: async () => undefined,
	toaster: { toast: () => {} },
}));

const { Backend } = await import("@src/app/backend");
const { getNonSteamGamesChecksumFromDataBase } = await import("@src/app/games");
const { gameChecksums } = await import("@src/stores/games");

describe("getNonSteamGamesChecksumFromDataBase", () => {
	let originalGetGamesDictionary: typeof Backend.getGamesDictionary;

	beforeEach(() => {
		originalGetGamesDictionary = Backend.getGamesDictionary;
		gameChecksums.dataBase.clear();
		gameChecksums.nonSteam.clear();

		// @ts-expect-error Mocking global store
		globalThis.collectionStore = {
			deckDesktopApps: {
				apps: new Map([[123, {}]]),
			},
		};

		Backend.getGamesDictionary = async () => [
			{ game: { id: "00123", name: "Non-Steam Game" }, files: [] },
			{ game: { id: "456", name: "Steam Game" }, files: [] },
		];
	});

	afterEach(() => {
		Backend.getGamesDictionary = originalGetGamesDictionary;
		gameChecksums.dataBase.clear();
		gameChecksums.nonSteam.clear();
		// @ts-expect-error Removing mocked global store
		delete globalThis.collectionStore;
	});

	test("filters the dictionary by non-Steam numeric IDs", async () => {
		await getNonSteamGamesChecksumFromDataBase();

		expect(gameChecksums.dataBase.has("00123")).toBe(true);
		expect(gameChecksums.dataBase.has("456")).toBe(false);
	});
});
