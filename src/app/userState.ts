import { call } from "@decky/api";
import logger from "@src/utils/logger";
import { BACK_END_API } from "@src/constants";
import { isNil } from "@src/utils/isNil";
import { EventBus } from "./system";

export class UserStateManager {
	private currentUserId: Nullable<string> = null;
	private settingUserPromise: Promise<void> | null = null;
	private eventBus: EventBus;

	constructor(eventBus: EventBus) {
		this.eventBus = eventBus;

		this.eventBus.addSubscriber(async (event) => {
			switch (event.type) {
				case "UserLoggedOut":
					this.clearCache();

					break;
			}
		});
	}

	// NOTE(ynhhoJ): Source from https://github.com/SteamGridDB/decky-steamgriddb/blob/main/src/utils/getCurrentSteamUserId.ts
	getAccountId(steamUserId: string): bigint {
		return BigInt.asUintN(32, BigInt(steamUserId));
	}

	/**
	 * Set the current Steam user ID for per-user data isolation.
	 * Converts the 64-bit Steam ID to a 32-bit account ID for internal use.
	 * Prevents race conditions by caching and queueing concurrent requests.
	 *
	 * @param steamUserId The 64-bit Steam ID as a string (from strSteamID)
	 */
	async setCurrentUser(steamUserId: string): Promise<void> {
		const accountId = this.getAccountId(steamUserId).toString();

		if (!accountId || accountId === "0") {
			return logger.debug(
				`Invalid Steam user ID provided: ${steamUserId}, skipping...`,
			);
		}

		if (this.currentUserId === accountId) {
			return logger.debug(
				`User ${accountId} is already set (client cache), skipping...`,
			);
		}

		if (this.settingUserPromise) {
			logger.debug("Set user operation in progress, waiting...");

			await this.settingUserPromise.catch(() => {});

			if (this.currentUserId !== accountId) {
				return;
			}

			return logger.debug(
				`User ${accountId} was set by concurrent call, skipping`,
			);
		}

		this.settingUserPromise = call<[string], void>(
			BACK_END_API.SET_CURRENT_USER,
			steamUserId,
		)
			.then(() => {
				this.currentUserId = steamUserId;
				this.eventBus.emit({
					type: "UserInitialized",
					createdAt: Date.now(),
					steamId: steamUserId,
				});

				logger.info(`User with ${steamUserId} ID initialized`);
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
