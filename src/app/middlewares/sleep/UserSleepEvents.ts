import logger from "@src/utils/logger";
import { SleepEventsListener } from "./SleepEventsListener";

export class UserSleepEvents extends SleepEventsListener {
	private static hasUserSuspendEvents() {
		return (
			typeof SteamClient !== "undefined" &&
			typeof SteamClient?.User?.RegisterForPrepareForSystemSuspendProgress ===
				"function" &&
			typeof SteamClient?.User?.RegisterForResumeSuspendedGamesProgress ===
				"function"
		);
	}

	private useUserSleepEvents() {
		this.activeHooks.push(
			SteamClient.User.RegisterForPrepareForSystemSuspendProgress(() => {
				this.emitSleepEvent(SteamUIStore.RunningApps, "Suspended");
			}),
		);

		this.activeHooks.push(
			SteamClient.User.RegisterForResumeSuspendedGamesProgress(() => {
				this.emitSleepEvent(SteamUIStore.RunningApps, "ResumeFromSuspend");
			}),
		);
	}

	public mount() {
		try {
			if (!UserSleepEvents.hasUserSuspendEvents()) {
				return false;
			}

			logger.info(
				"SteamClient.User sleep events are available. Starting use them...",
			);
			this.useUserSleepEvents();

			return true;
		} catch (error) {
			this.unMount();
			logger.error("Failed to register User sleep events", error);

			return false;
		}
	}
}
