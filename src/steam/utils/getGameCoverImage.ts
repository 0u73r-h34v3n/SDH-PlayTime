import { EAppType } from "@decky/ui/dist/globals/steam-client/App";
import { isNil } from "es-toolkit";
import { memo } from "@utils/memo";

function getGameCoverImage(gameId: string): string | undefined {
	const gameOverview = appStore.GetAppOverviewByGameID(gameId);

	if (isNil(gameOverview)) {
		return undefined;
	}

	if (gameOverview.app_type === EAppType.Shortcut) {
		const images = appStore.GetCustomVerticalCapsuleURLs(gameOverview);

		if (isNil(images) || images.length === 0) {
			return undefined;
		}

		return images[0]?.replace("undefined", "p")?.replace("jpg", "png") ?? "";
	}

	const image = appStore.GetVerticalCapsuleURLForApp(gameOverview) ?? "";

	return image;
}

const TWO_MINUTES = 2 * 60 * 1000;
export const getGameCoverImageMemo = memo(
	(gameId: string) => getGameCoverImage(gameId),
	{
		ttl: TWO_MINUTES,
	},
);
