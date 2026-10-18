import logger from "@src/utils/logger";
import { SleepEventsListener } from "./SleepEventsListener";

export class SystemSleepEvents extends SleepEventsListener {
	/**
	 * NOTE(ynhhoJ): Those methods was removed on
	 * `Steam Deck Beta Client Update: September 17th` update
	 */
	private static hasSystemSuspendEvents() {
		return (
			typeof SteamClient !== "undefined" &&
			typeof SteamClient?.System?.RegisterForOnSuspendRequest === "function" &&
			typeof SteamClient?.System?.RegisterForOnResumeFromSuspend === "function"
		);
	}

	private useSystemSleepEvents() {
		this.activeHooks.push(
			// @ts-expect-error If `useSystemSleepEvents` was called we knew what both methods exists
			SteamClient.System.RegisterForOnSuspendRequest(() => {
				this.emitSleepEvent(SteamUIStore.RunningApps, "Suspended");
			}),
		);

		this.activeHooks.push(
			// @ts-expect-error
			SteamClient.System.RegisterForOnResumeFromSuspend(() => {
				this.emitSleepEvent(SteamUIStore.RunningApps, "ResumeFromSuspend");
			}),
		);
	}

	public mount() {
		try {
			if (!SystemSleepEvents.hasSystemSuspendEvents()) {
				return false;
			}

			logger.info(
				"SteamClient.System sleep events are available. Starting use them...",
			);
			this.useSystemSleepEvents();

			return true;
		} catch (error) {
			this.unMount();
			logger.error("Failed to register System sleep events", error);

			return false;
		}
	}
}
