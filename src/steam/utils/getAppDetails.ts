// NOTE(ynhhoJ): https://github.com/SteamGridDB/decky-steamgriddb/blob/main/src/utils/getAppDetails.ts
import logger from "@src/utils/logger";

/**
 * Tries to retrieve the app details from Steam.
 *
 * @param appId id to get details for.
 * @returns AppDetails if succeeded or null otherwise.
 */
export default async function getAppDetails(
	appId: number,
): Promise<AppDetails | null> {
	return await new Promise((resolve) => {
		let timeoutId: number | undefined | NodeJS.Timeout = undefined;

		try {
			const { unregister } = SteamClient.Apps.RegisterForAppDetails(
				appId,
				(details) => {
					clearTimeout(timeoutId);
					unregister();
					resolve(details);
				},
			);

			timeoutId = setTimeout(() => {
				unregister();
				resolve(null);
			}, 300);
		} catch (error) {
			clearTimeout(timeoutId);
			resolve(null);

			logger.debug("[utils][getAppDetails] Error: ", error);
		}
	});
}
