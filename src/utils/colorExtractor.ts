import { Vibrant } from "node-vibrant/browser";
import { memo } from "@utils/memo";
import { getGameCoverImageMemo } from "@src/steam/utils/getGameCoverImage";
import { isNil } from "@utils/isNil";
import { CHART_COLORS } from "@src/components/statistics/Chart";
import type { VibrantSwatch } from "@src/app/settings";
import type { Palette } from "@vibrant/color";

/**
 * Fallback swatch priority order when preferred swatch is not available
 */
const SWATCH_FALLBACK_ORDER: VibrantSwatch[] = [
	"Vibrant",
	"LightVibrant",
	"DarkVibrant",
	"Muted",
	"LightMuted",
	"DarkMuted",
];

/**
 * Image extensions to try when loading fails
 */
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];

/**
 * Replace the extension in a URL with a new one
 */
function replaceExtension(url: string, newExt: string): string {
	const [basePath, queryString] = url.split("?");
	const extPattern = /\.(png|jpg|jpeg|webp|gif|bmp)$/i;

	if (extPattern.test(basePath)) {
		const newBasePath = basePath.replace(extPattern, newExt);
		return queryString ? `${newBasePath}?${queryString}` : newBasePath;
	}

	return queryString
		? `${basePath}${newExt}?${queryString}`
		: `${basePath}${newExt}`;
}

/**
 * Try to load an image from a URL
 */
function tryLoadImage(imageUrl: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = "Anonymous";

		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error(`Failed to load: ${imageUrl}`));

		img.src = imageUrl;
	});
}

/**
 * Get the best available swatch hex color from a palette, trying the preferred one first,
 * then falling back through other swatches
 */
function getBestSwatchHex(
	palette: Palette,
	preferredSwatch: VibrantSwatch,
): string | null {
	// Try preferred swatch first
	if (palette[preferredSwatch]?.hex) {
		return palette[preferredSwatch].hex;
	}

	// Fall back through other swatches in priority order
	for (const swatchName of SWATCH_FALLBACK_ORDER) {
		if (swatchName !== preferredSwatch && palette[swatchName]?.hex) {
			return palette[swatchName].hex;
		}
	}

	return null;
}

/**
 * Extract color from image using node-vibrant, trying multiple formats if needed
 */
async function extractVibrantColor(
	imageUrl: string,
	swatchType: VibrantSwatch,
): Promise<string> {
	const urlsToTry = [imageUrl];

	for (const ext of IMAGE_EXTENSIONS) {
		const altUrl = replaceExtension(imageUrl, ext);
		if (altUrl !== imageUrl && !urlsToTry.includes(altUrl)) {
			urlsToTry.push(altUrl);
		}
	}

	for (const url of urlsToTry) {
		try {
			const img = await tryLoadImage(url);
			const palette = await Vibrant.from(img).quality(5).getPalette();

			const hex = getBestSwatchHex(palette, swatchType);

			if (isNil(hex)) {
				console.warn(`No swatch found for: ${url}`);
				continue;
			}

			return hex;
		} catch {
			console.warn(`Failed to extract color from: ${url}, trying next...`);
		}
	}

	return CHART_COLORS.primary;
}

/**
 * Get dominant color from a game's cover image using the specified swatch type
 */
async function getGameDominantColor(
	gameId: string,
	swatchType: VibrantSwatch,
): Promise<string> {
	let coverUrl = getGameCoverImageMemo(gameId);

	if (isNil(coverUrl)) {
		return CHART_COLORS.primary;
	}

	if (coverUrl.startsWith("/customimages")) {
		coverUrl = `https://steamloopback.host${coverUrl}`;
	}

	try {
		return await extractVibrantColor(coverUrl, swatchType);
	} catch {
		return CHART_COLORS.primary;
	}
}

// Cache dominant colors for 10 minutes
const TEN_MINUTES = 10 * 60 * 1000;

/**
 * Memoized function to get dominant color for a game.
 * The cache key includes both gameId and swatchType to support different swatch preferences.
 */
export const getGameDominantColorMemo = memo(
	(gameId: string, swatchType: VibrantSwatch = "Vibrant") =>
		getGameDominantColor(gameId, swatchType),
	{
		ttl: TEN_MINUTES,
		key: (gameId: string, swatchType: VibrantSwatch = "Vibrant") =>
			`${gameId}:${swatchType}`,
	},
);

/**
 * Get dominant colors for multiple games
 */
export async function getGamesDominantColors(
	gameIds: string[],
	swatchType: VibrantSwatch = "Vibrant",
): Promise<Map<string, string>> {
	const colors = new Map<string, string>();

	const colorPromises = gameIds.map(async (gameId) => {
		const color = await getGameDominantColorMemo(gameId, swatchType);
		colors.set(gameId, color);
	});

	await Promise.all(colorPromises);

	return colors;
}
