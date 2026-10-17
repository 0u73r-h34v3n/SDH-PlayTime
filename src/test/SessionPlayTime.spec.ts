import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { SessionPlayTime } from "@src/app/SessionPlayTime";
import { EventBus } from "@src/app/system";

const gameInfo_01: Game = {
	id: "1",
	name: "Game name 001",
};

const gameInfo_02: Game = {
	id: "2",
	name: "Game name 002",
};

let originalWindow: PropertyDescriptor | undefined;

beforeEach(() => {
	originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
	Object.defineProperty(globalThis, "window", {
		configurable: true,
		value: new EventTarget(),
	});
});

afterEach(() => {
	if (originalWindow) {
		Object.defineProperty(globalThis, "window", originalWindow);
	} else {
		Reflect.deleteProperty(globalThis, "window");
	}
});

describe("SessionPlayTime should calculate time", () => {
	test("Should calculate ", () => {
		const eventBus = new EventBus();
		const sessionPlayTime = new SessionPlayTime(eventBus);

		eventBus.emit({
			type: "GameStarted",
			createdAt: 0,
			game: gameInfo_01,
		});

		expect(sessionPlayTime.getPlayTime(1000 * 60 * 5)).toEqual([
			{
				gameName: "Game name 001",
				playTime: 300,
			},
		]);
	});

	test("should ignore interval of game_01, when we received game start event game_02 without ending game_01 event ", () => {
		const eventBus = new EventBus();
		const sessionPlayTime = new SessionPlayTime(eventBus);

		eventBus.emit({
			type: "GameStarted",
			createdAt: 0,
			game: gameInfo_01,
		});

		eventBus.emit({
			type: "GameStarted",
			createdAt: 1000 * 60 * 2,
			game: gameInfo_02,
		});

		expect(sessionPlayTime.getPlayTime(1000 * 60 * 5)).toEqual([
			{
				gameName: "Game name 001",
				playTime: 300,
			},
			{
				gameName: "Game name 002",
				playTime: 180,
			},
		]);
	});
});

describe("SessionPlayTime should send commit interval", () => {
	test("when we received games start and game end events sequentially", () => {
		const eventBus = new EventBus();
		// @ts-expect-error
		const _sessionPlayTime = new SessionPlayTime(eventBus);

		let committedInterval: unknown;

		eventBus.addSubscriber((event) => {
			switch (event.type) {
				case "CommitInterval":
					committedInterval = {
						type: event.type,
						startedAt: event.startedAt,
						endedAt: event.endedAt,
						game: event.game,
					};
					break;
			}
		});

		eventBus.emit({
			type: "GameStarted",
			createdAt: 0,
			game: gameInfo_01,
		});

		eventBus.emit({
			type: "GameStopped",
			createdAt: 50,
			game: gameInfo_01,
		});

		expect(committedInterval).toStrictEqual({
			type: "CommitInterval",
			startedAt: 0,
			endedAt: 50,
			game: gameInfo_01,
		});
	});

	test("when we received Suspend and ResumeFromSuspend events sequentially, Interval should be deleted", () => {
		const eventBus = new EventBus();
		const sessionPlayTime = new SessionPlayTime(eventBus);

		let committedInterval: unknown;

		eventBus.addSubscriber((event) => {
			switch (event.type) {
				case "CommitInterval":
					committedInterval = {
						type: event.type,
						startedAt: event.startedAt,
						endedAt: event.endedAt,
						game: event.game,
					};
					break;
			}
		});

		eventBus.emit({
			type: "GameStarted",
			createdAt: 0,
			game: gameInfo_01,
		});

		eventBus.emit({
			type: "Suspended",
			createdAt: 5 * 1000 * 60,
			game: gameInfo_01,
		});

		expect(committedInterval).toStrictEqual({
			type: "CommitInterval",
			startedAt: 0,
			endedAt: 5 * 1000 * 60,
			game: gameInfo_01,
		});

		eventBus.emit({
			type: "ResumeFromSuspend",
			createdAt: 10 * 1000 * 60,
			game: gameInfo_01,
		});

		expect(sessionPlayTime.getPlayTime(11 * 1000 * 60)).toEqual([
			{
				gameName: "Game name 001",
				playTime: 60,
			},
		]);
	});

	test("should not commit interval two time when is called two Suspended events sequentially", () => {
		const eventBus = new EventBus();
		const sessionPlayTime = new SessionPlayTime(eventBus);

		let committedInterval: unknown;

		eventBus.addSubscriber((event) => {
			switch (event.type) {
				case "CommitInterval":
					committedInterval = {
						type: event.type,
						startedAt: event.startedAt,
						endedAt: event.endedAt,
						game: event.game,
					};
					break;
			}
		});

		eventBus.emit({
			type: "GameStarted",
			createdAt: 0,
			game: gameInfo_01,
		});

		eventBus.emit({
			type: "Suspended",
			createdAt: 5 * 1000 * 60,
			game: gameInfo_01,
		});

		eventBus.emit({
			type: "Suspended",
			createdAt: 5 * 1000 * 60 + 5,
			game: gameInfo_01,
		});

		expect(committedInterval).toStrictEqual({
			type: "CommitInterval",
			startedAt: 0,
			endedAt: 5 * 1000 * 60,
			game: gameInfo_01,
		});

		eventBus.emit({
			type: "Suspended",
			createdAt: 5 * 1000 * 60 + 5,
			game: gameInfo_01,
		});

		eventBus.emit({
			type: "Suspended",
			createdAt: 5 * 1000 * 60 + 5,
			game: gameInfo_01,
		});

		eventBus.emit({
			type: "ResumeFromSuspend",
			createdAt: 10 * 1000 * 60,
			game: gameInfo_01,
		});

		expect(sessionPlayTime.getPlayTime(11 * 1000 * 60)).toEqual([
			{
				gameName: "Game name 001",
				playTime: 60,
			},
		]);
	});
});

describe("public interval commit event", () => {
	test.each(["GameStopped", "Suspended"] as const)(
		"publishes a short interval immediately on %s and ignores repeated commits",
		(type) => {
			const eventBus = new EventBus();
			new SessionPlayTime(eventBus);
			const received: unknown[] = [];
			window.addEventListener("playtime:interval-committed:v1", (event) => {
				received.push((event as CustomEvent).detail);
			});

			eventBus.emit({
				type: "GameStarted",
				createdAt: 1000,
				game: gameInfo_01,
			});
			eventBus.emit({ type, createdAt: 1050, game: gameInfo_01 });
			expect(received).toEqual([
				{ startedAt: 1000, endedAt: 1050, game: gameInfo_01 },
			]);

			eventBus.emit({ type, createdAt: 1100, game: gameInfo_01 });
			expect(received).toEqual([
				{ startedAt: 1000, endedAt: 1050, game: gameInfo_01 },
			]);
		},
	);

	test("does not publish when the stopped game has no active interval", () => {
		const eventBus = new EventBus();
		new SessionPlayTime(eventBus);
		const received: unknown[] = [];
		window.addEventListener("playtime:interval-committed:v1", (event) => {
			received.push((event as CustomEvent).detail);
		});

		eventBus.emit({
			type: "GameStopped",
			createdAt: 1000,
			game: gameInfo_01,
		});
		eventBus.emit({
			type: "GameStarted",
			createdAt: 1000,
			game: gameInfo_01,
		});
		eventBus.emit({
			type: "GameStopped",
			createdAt: 1100,
			game: gameInfo_02,
		});
		expect(received).toEqual([]);
	});
});
