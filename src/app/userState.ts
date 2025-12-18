import { call } from "@decky/api";
import logger from "@src/utils/logger";
import { BACK_END_API } from "@src/constants";
import { isNil } from "@src/utils/isNil";

export class UserStateManager {
	private currentUserId: Nullable<string> = null;
	private settingUserPromise: Promise<void> | null = null;

	/**
	 * Set the current Steam user ID for per-user data isolation.
	 * Prevents race conditions by caching and queueing concurrent requests.
	 *
	 * @param steamUserId The 64-bit Steam ID as a string (from strSteamID)
	 */
	async setCurrentUser(steamUserId: string): Promise<void> {
		if (!steamUserId) {
			return logger.debug(
				"setCurrentUser called with empty steamUserId, ignoring",
			);
		}

		if (this.currentUserId === steamUserId) {
			return logger.debug(
				`User ${steamUserId} is already set (client cache), skipping`,
			);
		}

		if (this.settingUserPromise) {
			logger.debug("Set user operation in progress, waiting...");

			await this.settingUserPromise.catch(() => {});

			if (this.currentUserId !== steamUserId) {
				return;
			}

			return logger.debug(
				`User ${steamUserId} was set by concurrent call, skipping`,
			);
		}

		this.settingUserPromise = call<[string], void>(
			BACK_END_API.SET_CURRENT_USER,
			steamUserId,
		)
			.then(() => {
				this.currentUserId = steamUserId;
			})
			.catch((error) => logger.error("Failed to set current user:", error))
			.finally(() => {
				this.settingUserPromise = null;
			});

		await this.settingUserPromise.catch(() => {});
	}

	async getCurrentUser(): Promise<Nullable<string>> {
		if (!isNil(this.currentUserId)) {
			return this.currentUserId;
		}

		const userId = await call<[], Nullable<string>>(
			BACK_END_API.GET_CURRENT_USER,
		).catch((error) => {
			logger.error("Failed to get current user:", error);

			return null;
		});

		if (userId) {
			this.currentUserId = userId;
		}

		return userId;
	}

	clearCache(): void {
		this.currentUserId = null;
	}
}
