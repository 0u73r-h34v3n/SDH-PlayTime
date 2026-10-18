import { describe, expect, it, mock } from "bun:test";

mock.module("@decky/api", () => ({
	call: async () => undefined,
	toaster: { toast: () => {} },
	routerHook: { addPatch: () => {}, removePatch: () => {} },
}));

const { buildPlayTimeMap } = await import("../cachables");

describe("buildPlayTimeMap", () => {
	it("maps unmerged record to its own game ID with falsey isMerged", () => {
		const records = [
			{
				game: { id: "game1" },
				totalTime: 3600,
				lastPlayedDate: "2023-01-01T12:00:00Z",
			},
		];

		const map = buildPlayTimeMap(records);
		expect(map.size).toBe(1);

		const entry = map.get("game1");
		expect(entry).toBeDefined();
		expect(entry?.time).toBe(3600);
		expect(entry?.isMerged).toBeFalse();
	});

	it("maps a record with aliasesId to parent ID and every trimmed, non-empty alias ID", () => {
		const records = [
			{
				game: { id: "parent_game" },
				totalTime: 7200,
				lastPlayedDate: "2023-01-01T12:00:00Z",
				aliasesId: "child1, child2 ,child3",
			},
		];

		const map = buildPlayTimeMap(records);

		// parent + 3 children = 4 entries, pointing to the SAME object.
		expect(map.size).toBe(4);

		const parentEntry = map.get("parent_game");
		expect(parentEntry?.isMerged).toBeTrue();
		expect(parentEntry?.time).toBe(7200);

		expect(map.get("child1")).toBe(parentEntry);
		expect(map.get("child2")).toBe(parentEntry);
		expect(map.get("child3")).toBe(parentEntry);
	});

	it("covers whitespace and empty alias tokens so malformed separators do not create empty cache keys", () => {
		const records = [
			{
				game: { id: "parent_game" },
				totalTime: 7200,
				lastPlayedDate: "2023-01-01T12:00:00Z",
				aliasesId: "child1,, , child2",
			},
		];

		const map = buildPlayTimeMap(records);

		expect(map.has("")).toBeFalse();
		expect(map.has(" ")).toBeFalse();

		// parent + 2 children = 3 entries
		expect(map.size).toBe(3);
		expect(map.has("parent_game")).toBeTrue();
		expect(map.has("child1")).toBeTrue();
		expect(map.has("child2")).toBeTrue();
	});
});
