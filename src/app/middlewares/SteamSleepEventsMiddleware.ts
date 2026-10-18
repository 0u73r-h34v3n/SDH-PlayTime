import type { Clock, EventBus, Mountable } from "../system";
import logger from "@src/utils/logger";
import type { SleepEventsListener } from "./sleep/SleepEventsListener";
import { SuspendPreparationSleepEvents } from "./sleep/SuspendPreparationSleepEvents";
import { SystemSleepEvents } from "./sleep/SystemSleepEvents";
import { UserSleepEvents } from "./sleep/UserSleepEvents";
import { MobXSleepEvents } from "./sleep/MobXSleepEvents";

export class SteamSleepEventsMiddleware implements Mountable {
	private suspendPreparation: SuspendPreparationSleepEvents;
	private legacyListeners: Array<SleepEventsListener>;
	private activeListener?: SleepEventsListener;

	constructor(eventBus: EventBus, clock: Clock) {
		this.suspendPreparation = new SuspendPreparationSleepEvents(
			eventBus,
			clock,
			() => this.useLegacySleepEvents(),
		);
		this.legacyListeners = [
			new SystemSleepEvents(eventBus, clock),
			new UserSleepEvents(eventBus, clock),
			new MobXSleepEvents(eventBus, clock),
		];
	}

	public mount() {
		if (this.activeListener?.isMounted()) {
			return true;
		}

		if (this.suspendPreparation.mount()) {
			this.activeListener = this.suspendPreparation;

			return true;
		}

		return this.useLegacySleepEvents();
	}

	private useLegacySleepEvents() {
		this.activeListener = undefined;

		for (const listener of this.legacyListeners) {
			if (listener.mount()) {
				this.activeListener = listener;

				return true;
			}
		}

		logger.error("No supported Steam sleep events available");

		return false;
	}

	public unMount() {
		this.activeListener?.unMount();
		this.activeListener = undefined;
	}
}
