import logger from "@src/utils/logger";
import type { Dispatch, SetStateAction } from "react";
import type { SessionPlayTime } from "./SessionPlayTime";
import type { Events } from "./events";
import type { Reports } from "./reports";
import type { PlayTimeSettings, Settings } from "./settings";
import type { TimeManipulation } from "./timeManipulation";
import type { TrackingService } from "./tracking";
import type { AssociationService } from "./association";

export {
	type Clock,
	EventBus,
	MountManager,
	systemClock,
	type Mountable,
	type LocatorDependencies,
	type Locator,
};

const systemClock = {
	getTimeMs() {
		return Date.now();
	},
} as Clock;

interface Clock {
	getTimeMs: () => number;
}

interface Mountable {
	mount: () => void;
	unMount: () => void;
}

class MountManager {
	private mounts: Array<Mountable> = [];
	private eventBus: EventBus;
	private clock: Clock;

	constructor(eventBus: EventBus, clock: Clock) {
		this.eventBus = eventBus;
		this.clock = clock;
	}

	addMount(mount: Mountable) {
		this.mounts.push(mount);
	}

	mount() {
		for (const mount of this.mounts) {
			mount.mount();
		}

		this.eventBus.emit({
			type: "Mount",
			createdAt: this.clock.getTimeMs(),
			mounts: this.mounts,
		});
	}

	unMount() {
		for (const mount of this.mounts) {
			mount.unMount();
		}

		this.eventBus.emit({
			type: "Unmount",
			createdAt: this.clock.getTimeMs(),
			mounts: this.mounts,
		});
	}
}

class EventBus {
	private subscribers: ((event: Events) => void)[] = [];

	public emit(event: Events) {
		logger.info("New event", event);

		for (const it of this.subscribers) {
			it(event);
		}
	}

	public addSubscriber(subscriber: (event: Events) => void) {
		this.subscribers.push(subscriber);
	}
}

interface Locator {
	reports: Reports;
	currentSettings: PlayTimeSettings;
	settings: Settings;
	sessionPlayTime: SessionPlayTime;
	timeManipulation: TimeManipulation;
	trackingService: TrackingService;
	associationService: AssociationService;
	setCurrentSettings: Dispatch<SetStateAction<PlayTimeSettings>>;
}

interface LocatorDependencies {
	reports: Reports;
	settings: Settings;
	sessionPlayTime: SessionPlayTime;
	timeManipulation: TimeManipulation;
	trackingService: TrackingService;
	associationService: AssociationService;
}
