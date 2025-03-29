// NOTE(ynhhoJ): https://github.com/voidiz/decky-window-switcher/blob/main/src/types.d.ts#L59
type ControllerStateChange = {
	unControllerIndex: number;
	unPacketNum: number;
	/**
	 * Bitmask representing pressed upper buttons.
	 * - Bit 0-8: Unknown (@todo Please provide more details if known)
	 * - Bit 9: L4
	 * - Bit 10: R4
	 * - Bit 11-13: Unknown (@todo Please provide more details if known)
	 * - Bit 14: Left Joystick Touch
	 * - Bit 15: Right Joystick Touch
	 * - Bit 16-17: Unknown (@todo Please provide more details if known)
	 * - Bit 18: Quick Access Menu
	 */
	ulUpperButtons: number;
	/**
	 * Bitmask representing pressed buttons.
	 * - Bit 0: R2
	 * - Bit 1: L2
	 * - Bit 2: R1
	 * - Bit 3: L1
	 * - Bit 4: Y
	 * - Bit 5: B
	 * - Bit 6: X
	 * - Bit 7: A
	 * - Bit 8: D-Pad Up
	 * - Bit 9: D-Pad Right
	 * - Bit 10: D-Pad Left
	 * - Bit 11: D-Pad Down
	 * - Bit 12: Select
	 * - Bit 13: Steam/Home
	 * - Bit 14: Start
	 * - Bit 15: L5
	 * - Bit 16: R5
	 * - Bit 17: Left Touchpad Click
	 * - Bit 18: Right Touchpad Click
	 * - Bit 19: Left Touchpad Touch
	 * - Bit 20: Right Touchpad Touch
	 * - Bit 21: Unknown (@todo Please provide more details if known)
	 * - Bit 22: L3
	 * - Bit 23-25: Unknown (@todo Please provide more details if known)
	 * - Bit 26: R3
	 * - Bit 27-28: Unknown (@todo Please provide more details if known)
	 * - Bit 29: Mute (Dualsense)
	 * - Bit 30-31: Unknown (@todo Please provide more details if known)
	 */
	ulButtons: number;
	sLeftPadX: number;
	sLeftPadY: number;
	sRightPadX: number;
	sRightPadY: number;
	sCenterPadX: number;
	sCenterPadY: number;
	sLeftStickX: number;
	sLeftStickY: number;
	sRightStickX: number;
	sRightStickY: number;
	sTriggerL: number;
	sTriggerR: number;
	flTrustedGravityVectorX: number;
	flTrustedGravityVectorY: number;
	flTrustedGravityVectorZ: number;
	flSoftwareQuatW: number;
	flSoftwareQuatX: number;
	flSoftwareQuatY: number;
	flSoftwareQuatZ: number;
	flSoftwareGyroDegreesPerSecondPitch: number;
	flSoftwareGyroDegreesPerSecondYaw: number;
	flSoftwareGyroDegreesPerSecondRoll: number;
	flHardwareQuatW: number;
	flHardwareQuatX: number;
	flHardwareQuatY: number;
	flHardwareQuatZ: number;
	flHardwareGyroDegreesPerSecondPitch: number;
	flHardwareGyroDegreesPerSecondYaw: number;
	flHardwareGyroDegreesPerSecondRoll: number;
	flGyroNoiseLength: number;
	flGyroCalibrationProgress: number;
	flGravityVectorX: number;
	flGravityVectorY: number;
	flGravityVectorZ: number;
	flAccelerometerNoiseLength: number;
	sBatteryLevel: number;
	sPressurePadLeft: number;
	sPressurePadRight: number;
	sPressureBumperLeft: number;
	sPressureBumperRight: number;
	unHardwareUpdateInMicrosec: number;
};

interface SteamClient {
	Apps: {
		// NOTE(ynhhoJ): https://github.com/BossSloth/SteamTypes/blob/5e5df06cdef5d202e62e43423167415b05c3d6a5/src/types/SteamClient/Apps.ts#L361
		/**
		 * Registers a callback function to be called when app details change.
		 * @param appId The ID of the application to monitor.
		 * @param callback The callback function to be called.
		 * @returns An object that can be used to unregister the callback.
		 */
		RegisterForAppDetails(
			appId: number,
			callback: (appDetails: AppDetails) => void,
		): Unregisterable;
	};

	Input: {
		RegisterForControllerStateChanges: (
			callback: (controllerStateChanges: ControllerStateChange[]) => void,
		) => Unregisterable;
	};

	User: {
		RegisterForLoginStateChange: (
			callback: (username: string) => void,
		) => Unregisterer;
	};

	System: {
		RegisterForOnResumeFromSuspend: (callback: () => void) => Unregisterable;
		RegisterForOnSuspendRequest: (callback: () => void) => Unregisterable;
	};

	Storage: {
		GetJSON(key: string): Promise<string>;
		SetObject<T>(key: string, value: unknown): T;
	};
}
