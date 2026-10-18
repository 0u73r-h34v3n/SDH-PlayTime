import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { SteamSleepEventsMiddleware } from "@src/app/middlewares/SteamSleepEventsMiddleware";
import { SessionPlayTime } from "@src/app/SessionPlayTime";
import { EventBus } from "@src/app/system";
import type { Events } from "@src/app/events";

const globals = ["SteamClient", "SteamUIStore", "SuspendResumeStore", "window"];

let originals: Array<PropertyDescriptor | undefined>;
let middleware: SteamSleepEventsMiddleware;
let events: Events[];
let eventBus: EventBus;
let user: {
	PrepareForSystemSuspend: () => Promise<{ result: number }>;
	RegisterForPrepareForSystemSuspendProgress: (
		callback: () => void,
	) => Unregisterable;
	RegisterForResumeSuspendedGamesProgress: (
		callback: () => void,
	) => Unregisterable;
};
let suspend: () => void;
let resume: () => void;
let resumeUnregistered: boolean;

beforeEach(() => {
	originals = globals.map((key) =>
		Object.getOwnPropertyDescriptor(globalThis, key),
	);
	events = [];
	suspend = () => {};
	resume = () => {};
	resumeUnregistered = false;
	user = {
		PrepareForSystemSuspend: () => Promise.resolve({ result: 1 }),
		RegisterForPrepareForSystemSuspendProgress: (callback) => {
			suspend = callback;

			return { unregister() {} };
		},
		RegisterForResumeSuspendedGamesProgress: (callback) => {
			resume = callback;

			return {
				unregister: () => {
					resumeUnregistered = true;
				},
			};
		},
	};
	for (const [key, value] of Object.entries({
		SteamClient: { User: user },
		SteamUIStore: { RunningApps: [{ appid: 123, display_name: "Game" }] },
		SuspendResumeStore: {},
		window: new EventTarget(),
	})) {
		Object.defineProperty(globalThis, key, {
			configurable: true,
			writable: true,
			value,
		});
	}
	eventBus = new EventBus();
	eventBus.addSubscriber((event) => events.push(event));
	middleware = new SteamSleepEventsMiddleware(eventBus, {
		getTimeMs: () => 60_000,
	});
});

afterEach(() => {
	middleware.unMount();

	for (const [index, key] of globals.entries()) {
		const descriptor = originals[index];

		if (!descriptor) {
			Reflect.deleteProperty(globalThis, key);
			continue;
		}

		Object.defineProperty(globalThis, key, descriptor);
	}
});

describe("guarded Steam suspend preparation", () => {
	test("dispatches suspension before Steam's continuation, closes intervals, then resumes", async () => {
		const session = new SessionPlayTime(eventBus);

		for (const game of [
			{ id: "123", name: "Game" },
			{ id: "456", name: "Other game" },
		]) {
			eventBus.emit({ type: "GameStarted", createdAt: 0, game });
		}

		const original = user.PrepareForSystemSuspend;

		middleware.mount();
		middleware.mount();
		await user.PrepareForSystemSuspend().then(() => {
			expect(events.filter((event) => event.type === "Suspended")).toHaveLength(
				1,
			);
			expect(events.filter((event) => event.type === "CommitInterval")).toEqual(
				[
					{
						type: "CommitInterval",
						startedAt: 0,
						endedAt: 60_000,
						game: { id: "123", name: "Game" },
					},
					{
						type: "CommitInterval",
						startedAt: 0,
						endedAt: 60_000,
						game: { id: "456", name: "Other game" },
					},
				],
			);
			expect(session.getPlayTime(60_000)).toEqual([]);
		});
		resume();
		expect(session.getPlayTime(61_000)).toEqual([
			{ gameName: "Game", playTime: 1 },
		]);
		middleware.unMount();
		middleware.unMount();
		expect(user.PrepareForSystemSuspend).toBe(original);
		expect(resumeUnregistered).toBe(true);
	});

	test("preserves failed preparation results without closing playtime", async () => {
		const failure = { result: 2 };

		user.PrepareForSystemSuspend = () => Promise.resolve(failure);
		middleware.mount();
		expect(await user.PrepareForSystemSuspend()).toBe(failure);
		expect(events).toEqual([]);
	});

	test("preserves native promise rejection and synchronous exceptions", async () => {
		const failure = new Error("native failure");

		user.PrepareForSystemSuspend = () => Promise.reject(failure);
		middleware.mount();
		await expect(user.PrepareForSystemSuspend()).rejects.toBe(failure);
		expect(events).toEqual([]);
		middleware.unMount();
		user.PrepareForSystemSuspend = () => {
			throw failure;
		};
		middleware.mount();
		expect(() => user.PrepareForSystemSuspend()).toThrow(failure);
		expect(events).toEqual([]);
	});

	test("does not emit for preparation still pending during unload", async () => {
		const { promise, resolve: complete } = Promise.withResolvers<{
			result: number;
		}>();

		user.PrepareForSystemSuspend = () => promise;
		middleware.mount();

		const pending = user.PrepareForSystemSuspend();

		middleware.unMount();

		const result = { result: 1 };

		complete(result);
		expect(await pending).toBe(result);
		expect(events).toEqual([]);
	});

	test("dispatch failure preserves Steam's result and tracks subsequent legacy sleep cycles", async () => {
		const session = new SessionPlayTime(eventBus);

		const game = { id: "123", name: "Game" };

		eventBus.emit({ type: "GameStarted", createdAt: 0, game });

		let now = 60_000;

		middleware = new SteamSleepEventsMiddleware(eventBus, {
			getTimeMs: () => now,
		});

		const result = { result: 1 };

		user.PrepareForSystemSuspend = () => Promise.resolve(result);

		const original = user.PrepareForSystemSuspend;

		let fail = true;

		eventBus.addSubscriber((event) => {
			if (event.type === "Suspended" && fail) {
				fail = false;
				throw new Error("subscriber failure");
			}
		});
		middleware.mount();

		const experimentalResume = resume;

		expect(await user.PrepareForSystemSuspend()).toBe(result);
		expect(user.PrepareForSystemSuspend).toBe(original);
		experimentalResume();
		expect(session.getPlayTime(61_000)).toEqual([]);
		resume();
		expect(session.getPlayTime(61_000)).toEqual([
			{ gameName: "Game", playTime: 1 },
		]);
		expect(middleware.mount()).toBe(true);
		expect(user.PrepareForSystemSuspend).toBe(original);
		now = 120_000;
		suspend();
		expect(events.filter((event) => event.type === "CommitInterval")).toEqual([
			{ type: "CommitInterval", startedAt: 0, endedAt: 60_000, game },
			{ type: "CommitInterval", startedAt: 60_000, endedAt: 120_000, game },
		]);
		resume();
		expect(session.getPlayTime(121_000)).toEqual([
			{ gameName: "Game", playTime: 1 },
		]);
	});

	test("resume dispatch failure falls back and suppresses an older pending preparation", async () => {
		const session = new SessionPlayTime(eventBus);

		const game = { id: "123", name: "Game" };

		eventBus.emit({ type: "GameStarted", createdAt: 0, game });

		const { promise, resolve } = Promise.withResolvers<{ result: number }>();

		user.PrepareForSystemSuspend = () => promise;
		middleware.mount();

		const pending = user.PrepareForSystemSuspend();

		let fail = true;

		eventBus.addSubscriber((event) => {
			if (event.type === "ResumeFromSuspend" && fail) {
				fail = false;
				throw new Error("resume subscriber failure");
			}
		});
		resume();

		const result = { result: 1 };

		resolve(result);
		expect(await pending).toBe(result);
		expect(events.filter((event) => event.type === "Suspended")).toEqual([]);
		suspend();
		expect(events.filter((event) => event.type === "CommitInterval")).toEqual([
			{ type: "CommitInterval", startedAt: 0, endedAt: 60_000, game },
		]);
		resume();
		expect(session.getPlayTime(61_000)).toEqual([
			{ gameName: "Game", playTime: 1 },
		]);
	});

	test("does not report stale hooks as mounted when runtime failure has no fallback", async () => {
		Object.assign(user, {
			PrepareForSystemSuspend: () => Promise.resolve(undefined),
		});
		middleware.mount();
		Object.assign(user, {
			RegisterForPrepareForSystemSuspendProgress: undefined,
			RegisterForResumeSuspendedGamesProgress: undefined,
		});
		await user.PrepareForSystemSuspend();
		expect(middleware.mount()).toBe(false);
	});

	test.each([undefined, { unexpected: true }])(
		"unexpected native result %p disables the hook without changing the result",
		async (result) => {
			const original = () => Promise.resolve(result);

			Object.assign(user, { PrepareForSystemSuspend: original });
			middleware.mount();
			expect<unknown>(await user.PrepareForSystemSuspend()).toBe(result);
			expect<unknown>(user.PrepareForSystemSuspend).toBe(original);
			expect(resumeUnregistered).toBe(true);
			expect(events).toEqual([]);
			suspend();
			resume();
			expect(events.map((event) => event.type)).toEqual([
				"Suspended",
				"ResumeFromSuspend",
			]);
		},
	);

	test("a non-promise native return disables the hook and passes through unchanged", () => {
		const result = { result: 1 };

		const original = () => result;

		Object.assign(user, { PrepareForSystemSuspend: original });
		middleware.mount();
		expect<unknown>(user.PrepareForSystemSuspend()).toBe(result);
		expect<unknown>(user.PrepareForSystemSuspend).toBe(original);
		expect(events).toEqual([]);
		suspend();
		resume();
		expect(events.map((event) => event.type)).toEqual([
			"Suspended",
			"ResumeFromSuspend",
		]);
	});

	test("missing preparation method leaves legacy suspend and resume listeners available", () => {
		Reflect.deleteProperty(user, "PrepareForSystemSuspend");
		expect(middleware.mount()).toBe(true);
		expect(
			Object.getOwnPropertyDescriptor(user, "PrepareForSystemSuspend"),
		).toBeUndefined();
		resume();
		expect(events.map((event) => event.type)).toEqual(["ResumeFromSuspend"]);
	});

	test("read-only native methods stay untouched and use existing listeners", () => {
		const original = user.PrepareForSystemSuspend;

		Object.defineProperty(user, "PrepareForSystemSuspend", { writable: false });
		middleware.mount();
		expect(user.PrepareForSystemSuspend).toBe(original);
		resume();
		expect(events).toEqual([
			{
				type: "ResumeFromSuspend",
				createdAt: 60_000,
				game: { id: "123", name: "Game" },
			},
		]);
	});

	test("rolls back when Decky fails after replacing the native method", () => {
		const original = user.PrepareForSystemSuspend;

		Object.defineProperty(original, "unsafe", {
			enumerable: true,
			get: () => {
				throw new Error("patch metadata failure");
			},
		});
		middleware.mount();
		expect(user.PrepareForSystemSuspend).toBe(original);
		resume();
		expect(events.map((event) => event.type)).toEqual(["ResumeFromSuspend"]);
	});

	test("rolls back if resume registration fails", () => {
		const original = user.PrepareForSystemSuspend;

		user.RegisterForResumeSuspendedGamesProgress = () => {
			throw new Error("registration failure");
		};
		// Legacy System listeners remain available as the safe fallback.
		Object.assign(SteamClient, {
			System: {
				RegisterForOnSuspendRequest: () => ({ unregister() {} }),
				RegisterForOnResumeFromSuspend: () => ({ unregister() {} }),
			},
		});
		expect(middleware.mount()).toBe(true);
		expect(user.PrepareForSystemSuspend).toBe(original);
	});

	test("missing Steam globals disable the experimental hook without throwing", () => {
		Reflect.deleteProperty(globalThis, "SteamClient");
		Reflect.deleteProperty(globalThis, "SuspendResumeStore");
		expect(middleware.mount()).toBe(false);
	});
});
