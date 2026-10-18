import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { Cache } from "@src/app/cache";

type PlayTimeInformation = Map<
	string,
	{
		time: number;
		lastDate: number;
		isMerged?: boolean;
	}
>;

class FakeCache implements Cache<PlayTimeInformation> {
	public data: PlayTimeInformation | null = null;
	public isReady(): boolean {
		return this.data !== null;
	}
	public get(): PlayTimeInformation | null {
		return this.data;
	}
	public subscribe() {
		return () => {};
	}
}

type Details = { nPlaytimeForever: number };
type Overview = { appid: number; app_type: number };
type RenderResult = {
	props: {
		children: {
			props: {
				overview: Overview;
				details: Details;
			};
		};
	};
};
type RenderFunc = () => RenderResult;
type RouteProps = { children: { props: { renderFunc: RenderFunc } } };

let patchCallback: ((props: RouteProps) => void) | undefined;

mock.module("@decky/api", () => ({
	routerHook: {
		addPatch: (_path: string, patch: (props: RouteProps) => void) => {
			patchCallback = patch;
		},
		removePatch: () => {},
	},
	call: async () => undefined,
	toaster: { toast: () => {} },
}));

mock.module("@decky/ui", () => ({
	afterPatch: (
		obj: Record<string, (...args: unknown[]) => unknown>,
		funcName: string,
		patch: (args: unknown[], ret: unknown) => unknown,
	) => {
		const original = obj[funcName];
		obj[funcName] = (...args: unknown[]) => {
			const ret = original ? original(...args) : undefined;
			return patch(args, ret);
		};
	},
}));

const { patchAppPage } = await import("@src/steam/ui/routePatches");

describe("routePatches", () => {
	let timeCache: FakeCache;

	beforeEach(() => {
		timeCache = new FakeCache();
		patchCallback = undefined;
	});

	test("native app with isMerged receives the merged playtime", () => {
		const mountable = patchAppPage(timeCache, () => true);
		mountable.mount();

		timeCache.data = new Map([
			[
				"123",
				{
					time: 600,
					lastDate: 5000,
					isMerged: true,
				},
			],
		]);

		const details = { nPlaytimeForever: 5.0 };
		const overview = { appid: 123, app_type: 1 }; // Not THIRD_PARTY

		const props: RouteProps = {
			children: {
				props: {
					renderFunc: () => ({
						props: {
							children: {
								props: {
									overview,
									details,
								},
							},
						},
					}),
				},
			},
		};

		expect(patchCallback).toBeDefined();
		if (patchCallback) {
			patchCallback(props);
		}

		props.children.props.renderFunc();

		expect(details.nPlaytimeForever).toBe(10.0); // 600 / 60
	});

	test("disabled merged playtime preserves native app values", () => {
		const mountable = patchAppPage(timeCache, () => false);
		mountable.mount();

		timeCache.data = new Map([
			[
				"123",
				{
					time: 600,
					lastDate: 5000,
					isMerged: true,
				},
			],
		]);

		const details = { nPlaytimeForever: 5.0 };
		const overview = { appid: 123, app_type: 1 };
		const props: RouteProps = {
			children: {
				props: {
					renderFunc: () => ({
						props: {
							children: { props: { overview, details } },
						},
					}),
				},
			},
		};

		expect(patchCallback).toBeDefined();
		patchCallback?.(props);
		props.children.props.renderFunc();

		expect(details.nPlaytimeForever).toBe(5.0);
	});

	test("non-merged native app remains unchanged", () => {
		const mountable = patchAppPage(timeCache);
		mountable.mount();

		timeCache.data = new Map([
			[
				"123",
				{
					time: 600,
					lastDate: 5000,
				},
			],
		]);

		const details = { nPlaytimeForever: 5.0 };
		const overview = { appid: 123, app_type: 1 }; // Not THIRD_PARTY

		const props: RouteProps = {
			children: {
				props: {
					renderFunc: () => ({
						props: {
							children: {
								props: {
									overview,
									details,
								},
							},
						},
					}),
				},
			},
		};

		expect(patchCallback).toBeDefined();
		if (patchCallback) {
			patchCallback(props);
		}

		props.children.props.renderFunc();

		expect(details.nPlaytimeForever).toBe(5.0); // Untouched
	});

	test("setting changes immediately patch and restore loaded app details", () => {
		let enabled = false;
		const settingSubscribers: Array<(enabled: boolean) => void> = [];
		const mountable = patchAppPage(
			timeCache,
			() => enabled,
			(callback) => {
				settingSubscribers.push(callback);
				return () => {
					settingSubscribers.splice(0);
				};
			},
		);
		mountable.mount();
		timeCache.data = new Map([
			["123", { time: 600, lastDate: 5000, isMerged: true }],
		]);
		const details = { nPlaytimeForever: 5.0 };
		const overview = { appid: 123, app_type: 1 };
		const props: RouteProps = {
			children: {
				props: {
					renderFunc: () => ({
						props: {
							children: { props: { overview, details } },
						},
					}),
				},
			},
		};
		patchCallback?.(props);
		props.children.props.renderFunc();

		enabled = true;
		settingSubscribers[0](true);
		expect(details.nPlaytimeForever).toBe(10.0);

		enabled = false;
		settingSubscribers[0](false);
		expect(details.nPlaytimeForever).toBe(5.0);

		details.nPlaytimeForever = 7.0;
		props.children.props.renderFunc();
		expect(details.nPlaytimeForever).toBe(7.0);

		enabled = true;
		settingSubscribers[0](true);
		expect(details.nPlaytimeForever).toBe(10.0);
		enabled = false;
		settingSubscribers[0](false);
		expect(details.nPlaytimeForever).toBe(7.0);

		mountable.unMount();
		expect(settingSubscribers).toHaveLength(0);
	});
});
