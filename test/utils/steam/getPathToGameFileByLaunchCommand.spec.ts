// NOTE(ynhhoJ): https://github.com/0u73r-h34v3n/chrono-deck/blob/master/tests/utils/steam/getPathToGameFileByLaunchCommand.test.ts
import { describe, expect, it } from "bun:test";
import getPathToGameFileByLaunchCommand from "@src/utils/steam/getPathToGameFileByLaunchCommand";

describe("getPathToGameFileByLaunchCommand", () => {
	it('should return "/home/deck/EmuDeckROM/Emulation/roms/gc/The Legend of Zelda - Twilight Princess.iso"', () => {
		const command =
			'"/home/deck/EmuDeckROM/Emulation/tools/launchers/dolphin-emu.sh" vblank_mode=0 %command% -b -e "/home/deck/EmuDeckROM/Emulation/roms/gc/The Legend of Zelda - Twilight Princess.iso"';
		const result =
			"/home/deck/EmuDeckROM/Emulation/roms/gc/The Legend of Zelda - Twilight Princess.iso";

		const pathToGameFileByLaunchCommand =
			getPathToGameFileByLaunchCommand(command);

		expect(pathToGameFileByLaunchCommand).toBe(result);
	});

	it('should return "/home/deck/EmuDeckROM/Emulation/roms/snes/Chrono Trigger (RUS) (by Chief-NET).smc"', () => {
		const command =
			'"/home/deck/EmuDeckROM/Emulation/tools/launchers/retroarch.sh" -L /snes9x_libretro.so "/home/deck/EmuDeckROM/Emulation/roms/snes/Chrono Trigger (RUS) (by Chief-NET).smc"';
		const result =
			"/home/deck/EmuDeckROM/Emulation/roms/snes/Chrono Trigger (RUS) (by Chief-NET).smc";

		const pathToGameFileByLaunchCommand =
			getPathToGameFileByLaunchCommand(command);

		expect(pathToGameFileByLaunchCommand).toBe(result);
	});

	it('should return "/home/deck/EmuDeckROM/Emulation/roms/gc/The Legend of Zelda - Twilight Princess.iso"', () => {
		const command =
			'"/home/deck/EmuDeckROM/Emulation/tools/launchers/dolphin-emu.sh" vblank_mode=0 %command% -b -e "/home/deck/EmuDeckROM/Emulation/roms/gc/The Legend of Zelda - Twilight Princess.iso"';
		const result =
			"/home/deck/EmuDeckROM/Emulation/roms/gc/The Legend of Zelda - Twilight Princess.iso";

		const pathToGameFileByLaunchCommand =
			getPathToGameFileByLaunchCommand(command);

		expect(pathToGameFileByLaunchCommand).toBe(result);
	});

	it('should return "/home/deck/EmuDeckROM/Emulation/roms/ps2/The Simpsons Hit and Run/The Simpsons - Hit And Run.mdf"', () => {
		const command =
			'"/home/deck/EmuDeckROM/Emulation/tools/launchers/pcsx2-qt.sh" -batch -fullscreen "\'/home/deck/EmuDeckROM/Emulation/roms/ps2/The Simpsons Hit and Run/The Simpsons - Hit And Run.mdf\'"';
		const result =
			"/home/deck/EmuDeckROM/Emulation/roms/ps2/The Simpsons Hit and Run/The Simpsons - Hit And Run.mdf";

		const pathToGameFileByLaunchCommand =
			getPathToGameFileByLaunchCommand(command);

		expect(pathToGameFileByLaunchCommand).toBe(result);
	});

	it('should return "/home/deck/EmuDeckROM/Emulation/roms/psp/God of War - Ghost of Sparta.iso"', () => {
		const command =
			'"/home/deck/EmuDeckROM/Emulation/tools/launchers/ppsspp.sh" -f -g "/home/deck/EmuDeckROM/Emulation/roms/psp/God of War - Ghost of Sparta.iso" ';
		const result =
			"/home/deck/EmuDeckROM/Emulation/roms/psp/God of War - Ghost of Sparta.iso";

		const pathToGameFileByLaunchCommand =
			getPathToGameFileByLaunchCommand(command);

		expect(pathToGameFileByLaunchCommand).toBe(result);
	});
});
