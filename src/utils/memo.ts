// NOTE: https://github.com/radashi-org/radashi/blob/main/src/curry/memo.ts
/**
 * Prevent type inference on type `T`.
 *
 * @see https://github.com/microsoft/TypeScript/issues/14829#issuecomment-504042546
 */
// biome-ignore lint/suspicious/noExplicitAny: `any` is allowed here
export type NoInfer<T> = [T][T extends any ? 0 : never];

type Cache<T> = Record<string, { exp: number | null; value: T }>;

// biome-ignore lint/suspicious/noExplicitAny: `any` is allowed here
function memoize<TArgs extends any[], TResult>(
	cache: Cache<TResult>,
	func: (...args: TArgs) => TResult,
	keyFunc: ((...args: TArgs) => string) | null,
	ttl: number | null,
) {
	// biome-ignore lint/suspicious/noExplicitAny: `any` is allowed here
	return function callWithMemo(...args: any): TResult {
		const key = keyFunc ? keyFunc(...args) : JSON.stringify({ args });
		const existing = cache[key];
		if (existing !== undefined) {
			if (!existing.exp) {
				return existing.value;
			}
			if (existing.exp > new Date().getTime()) {
				return existing.value;
			}
		}
		const result = func(...args);
		cache[key] = {
			exp: ttl ? new Date().getTime() + ttl : null,
			value: result,
		};
		return result;
	};
}

// biome-ignore lint/suspicious/noExplicitAny: `any` is allowed here
export interface MemoOptions<TArgs extends any[]> {
	key?: (...args: TArgs) => string;
	ttl?: number;
}

/**
 * Creates a memoized function. The returned function will only
 * execute the source function when no value has previously been
 * computed. If a ttl (milliseconds) is given previously computed
 * values will be checked for expiration before being returned.
 *
 * @see https://radashi.js.org/reference/curry/memo
 * @example
 * ```ts
 * const calls: number[] = []
 * const fib = memo((x: number) => {
 *   calls.push(x)
 *   return x < 2 ? x : fib(x - 1) + fib(x - 2)
 * })
 *
 * fib(10) // 55
 * fib(10) // 55
 * // calls === [10]
 *
 * fib(11) // 89
 * // calls === [10, 11]
 * ```
 * @version 12.1.0
 */
// biome-ignore lint/suspicious/noExplicitAny: `any` is allowed here
export function memo<TArgs extends any[], TResult>(
	func: (...args: TArgs) => TResult,
	options: MemoOptions<NoInfer<TArgs>> = {},
): (...args: TArgs) => TResult {
	return memoize({}, func, options.key ?? null, options.ttl ?? null);
}
