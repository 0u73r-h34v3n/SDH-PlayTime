import {
	endOfMonth,
	endOfWeek,
	endOfYear,
	startOfMonth,
	startOfWeek,
	startOfYear,
} from "date-fns";
import type { Backend } from "./backend";

export interface Interval {
	start: Date;
	end: Date;
}

interface IntervalPager {
	next(): IntervalPager;
	prev(): IntervalPager;
	current(): Interval;
}

interface Page<T> {
	data: T[];
	interval: Interval;
}

export interface Paginated<T> {
	isEmpty?: boolean;

	next(): Promise<Paginated<T>>;
	hasNext(): boolean;

	prev(): Promise<Paginated<T>>;
	hasPrev(): boolean;

	current(): Page<T>;
}

export function empty<T>() {
	return {
		isEmpty: true,
		next: async () => empty<T>(),
		hasNext: () => false,
		prev: async () => empty<T>(),
		hasPrev: () => false,
		current: () => ({
			data: [],
			interval: { start: new Date(), end: new Date() },
		}),
	};
}

export enum IntervalType {
	Weekly = 0,
	Monthly = 1,
	Yearly = 2,
}

export class Reports {
	private backend: Backend;

	constructor(backend: Backend) {
		this.backend = backend;
	}

	public async weeklyStatistics(): Promise<Paginated<DailyStatistics>> {
		return PerDayPaginatedImpl.create(
			this.backend,
			IntervalPagerImpl.create(IntervalType.Weekly, new Date()),
		);
	}

	public async monthlyStatistics(): Promise<Paginated<DailyStatistics>> {
		return PerDayPaginatedImpl.create(
			this.backend,
			IntervalPagerImpl.create(IntervalType.Monthly, new Date()),
		);
	}

	public async yearlyStatistics(
		gameId: string,
	): Promise<Paginated<DailyStatistics>> {
		return PerDayPaginatedImpl.create(
			this.backend,
			IntervalPagerImpl.create(IntervalType.Yearly, new Date()),
			gameId,
		);
	}

	public async yearlyStatisticsForReplay(
		start: Date,
		end: Date,
	): Promise<Paginated<DailyStatistics>> {
		return PerDayPaginatedImpl.createWithDates(this.backend, start, end);
	}

	public async overallStatistics(): Promise<GamePlaytimeDetails[]> {
		return await this.backend.fetchPerGameOverallStatistics();
	}

	public async getGame(gameId: string): Promise<Nullable<GamePlaytimeSummary>> {
		return await this.backend.getGame(gameId);
	}
}

class PerDayPaginatedImpl implements Paginated<DailyStatistics> {
	private backend: Backend;
	private intervalPager: IntervalPager;
	private data: DailyStatistics[];
	private hasPrevPage: boolean;
	private gameId?: string;

	private constructor(
		backend: Backend,
		intervalPager: IntervalPager,
		data: DailyStatistics[],
		hasPrevPage: boolean,
		gameId?: string,
	) {
		this.backend = backend;
		this.intervalPager = intervalPager;
		this.data = data;
		this.hasPrevPage = hasPrevPage;
		this.gameId = gameId;
	}

	hasNext(): boolean {
		const nextInterval = this.intervalPager.next().current();
		const today = new Date();

		return nextInterval.start <= today;
	}

	hasPrev(): boolean {
		return this.hasPrevPage;
	}

	static async create(
		backend: Backend,
		intervalPager: IntervalPager,
		gameId?: string,
	): Promise<Paginated<DailyStatistics>> {
		const data = await backend.fetchDailyStatisticForInterval(
			intervalPager.current().start,
			intervalPager.current().end,
			gameId,
		);

		return new PerDayPaginatedImpl(
			backend,
			intervalPager,
			data.data,
			data.hasPrev,
			gameId,
		);
	}

	static async createWithDates(
		backend: Backend,
		start: Date,
		end: Date,
	): Promise<Paginated<DailyStatistics>> {
		const data = await backend.fetchDailyStatisticForInterval(start, end);
		const intervalPager = IntervalPagerImpl.create(IntervalType.Yearly, start);

		return new PerDayPaginatedImpl(
			backend,
			intervalPager,
			data.data,
			data.hasPrev,
		);
	}

	next(): Promise<Paginated<DailyStatistics>> {
		const nextIntervalPager = this.intervalPager.next();

		return PerDayPaginatedImpl.create(
			this.backend,
			nextIntervalPager,
			this.gameId,
		);
	}

	prev(): Promise<Paginated<DailyStatistics>> {
		const prevIntervalPager = this.intervalPager.prev();

		return PerDayPaginatedImpl.create(
			this.backend,
			prevIntervalPager,
			this.gameId,
		);
	}

	current(): Page<DailyStatistics> {
		return {
			data: this.data,
			interval: this.intervalPager.current(),
		};
	}
}

export class IntervalPagerImpl {
	private type: IntervalType;
	private interval: Interval;

	constructor(type: IntervalType, interval: Interval) {
		this.type = type;
		this.interval = interval;
	}

	static create(type: IntervalType, date: Date): IntervalPager {
		if (type === IntervalType.Weekly) {
			const start = startOfWeek(date, { weekStartsOn: 1 });
			const end = endOfWeek(start, { weekStartsOn: 1 });

			return new IntervalPagerImpl(type, { start, end });
		}

		if (type === IntervalType.Yearly) {
			const start = startOfYear(date);
			const end = endOfYear(start);

			return new IntervalPagerImpl(type, { start, end });
		}

		const start = startOfMonth(date);
		const end = endOfMonth(start);

		return new IntervalPagerImpl(type, { start, end });
	}

	public next(): IntervalPager {
		const nextDate = new Date(this.interval.end);
		nextDate.setDate(this.interval.end.getDate() + 1);

		if (this.type === IntervalType.Weekly) {
			const start = startOfWeek(nextDate, { weekStartsOn: 1 });
			const end = endOfWeek(start, { weekStartsOn: 1 });

			return new IntervalPagerImpl(this.type, { start, end });
		}

		if (this.type === IntervalType.Yearly) {
			const nextDate = new Date(this.interval.end);
			nextDate.setFullYear(this.interval.end.getFullYear() + 1);

			const start = startOfYear(nextDate);
			const end = endOfYear(start);

			return new IntervalPagerImpl(this.type, { start, end });
		}

		const start = startOfMonth(nextDate);
		const end = endOfMonth(start);

		return new IntervalPagerImpl(this.type, { start, end });
	}

	public prev(): IntervalPager {
		const prevDate = new Date(this.interval.start);
		prevDate.setDate(this.interval.start.getDate() - 1);

		if (this.type === IntervalType.Weekly) {
			const start = startOfWeek(prevDate, { weekStartsOn: 1 });
			const end = endOfWeek(start, { weekStartsOn: 1 });

			return new IntervalPagerImpl(this.type, { start, end });
		}

		if (this.type === IntervalType.Yearly) {
			const prevDate = new Date(this.interval.end);
			prevDate.setFullYear(this.interval.end.getFullYear() - 1);

			const start = startOfYear(prevDate);
			const end = endOfYear(start);

			return new IntervalPagerImpl(this.type, { start, end });
		}

		const start = startOfMonth(prevDate);
		const end = endOfMonth(start);

		return new IntervalPagerImpl(this.type, { start, end });
	}

	public current(): Interval {
		return this.interval;
	}
}
