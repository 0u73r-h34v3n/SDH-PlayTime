import type { Clock, EventBus, Mountable } from "../../system";
import logger from "@src/utils/logger";

export abstract class SleepEventsListener implements Mountable {
	protected clock: Clock;
	protected eventBus: EventBus;

	protected activeHooks: Array<Unregisterable> = [];

	constructor(eventBus: EventBus, clock: Clock) {
		this.eventBus = eventBus;
		this.clock = clock;
	}

	public abstract mount(): boolean;

	public isMounted() {
		return this.activeHooks.length > 0;
	}

	protected emitSleepEvent(
		apps: Array<AppOverview>,
		eventType: "Suspended" | "ResumeFromSuspend",
	) {
		for (const app of apps) {
			if (!app?.appid || !app?.display_name) {
				continue;
			}

			this.eventBus.emit({
				type: eventType,
				createdAt: this.clock.getTimeMs(),
				game: {
					id: `${app.appid}`,
					name: app.display_name,
				},
			});
		}
	}

	public unMount() {
		for (const it of this.activeHooks.splice(0)) {
			try {
				it.unregister();
			} catch (error) {
				logger.error("Failed to unregister sleep listener", error);
			}
		}
	}
}
