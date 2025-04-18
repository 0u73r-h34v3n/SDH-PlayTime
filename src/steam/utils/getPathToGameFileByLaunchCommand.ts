// NOTE(ynhhoJ): https://github.com/0u73r-h34v3n/chrono-deck/blob/master/src/utils/steam/getPathToGameFileByLaunchCommand.ts
export default function getPathToGameFileByLaunchCommand(
	launchCommand: string,
) {
	const regex =
		/(["'])(\/home\/deck\/EmuDeckROM\/Emulation\/roms\/[^"']+\.[a-z0-9]+)\1/gi;

	const match = launchCommand.match(regex);

	return match ? match[0].replace(/['"]/g, "") : null;
}
