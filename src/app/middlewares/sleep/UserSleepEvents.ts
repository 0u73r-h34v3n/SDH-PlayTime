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
			// @ts-expect-error If `useSystemSleepEvents` was called we knew what both methods exists
			SteamClient.User.RegisterForPrepareForSystemSuspendProgress(() => {
				this.emitSleepEvent(SteamUIStore.RunningApps, "Suspended");
			}),
		);

		this.activeHooks.push(
			// @ts-expect-error
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
