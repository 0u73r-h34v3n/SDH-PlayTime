import { describe, expect, test } from "bun:test";
import { UpdateOnEventCache, UpdatableCache } from "@src/app/cache";
import { EventBus } from "@src/app/system";

async function flushPromises() {
	await Promise.resolve();
}

describe("cache subscriptions", () => {
	test("unsubscribe stops updates and is safe to call more than once", async () => {
		let resolveUpdate: ((value: number) => void) | undefined;
		const cache = new UpdatableCache(
			() =>
				new Promise<number>((resolve) => {
					resolveUpdate = resolve;
				}),
		);
		const received: number[] = [];
		const unsubscribe = cache.subscribe((value) => received.push(value));

		resolveUpdate?.(1);
		await flushPromises();
		expect(received).toEqual([1]);

		unsubscribe();
		unsubscribe();

		cache.update();
		resolveUpdate?.(2);
		await flushPromises();

		expect(received).toEqual([1]);
	});

	test("UpdateOnEventCache forwards its unsubscribe function", async () => {
		const cache = new UpdatableCache(async () => 1);
		const eventBus = new EventBus();
		const eventCache = new UpdateOnEventCache(cache, eventBus, ["Mount"]);
		const received: number[] = [];

		await flushPromises();
		const unsubscribe = eventCache.subscribe((value) => received.push(value));
		expect(received).toEqual([1]);

		unsubscribe();
		cache.update();
		await flushPromises();

		expect(received).toEqual([1]);
	});
});
