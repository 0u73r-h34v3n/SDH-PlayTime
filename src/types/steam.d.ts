import type { AppStore } from "./steam/AppStore";
import type { SuspendResumeStore as SuspendResumeStoreTypes } from "./steam/SuspendResumeStore";

/**
 * Current Steam user information available from the global App object.
 */
interface SteamCurrentUser {
	/** Whether the account is a limited account */
	bIsLimited: boolean;
	/** Whether Steam is in offline mode */
	bIsOfflineMode: boolean;
	/** Whether there's an active support alert */
	bSupportAlertActive: boolean;
	/** Whether the user can invite friends */
	bCanInviteFriends: boolean;
	/** Account balance as formatted string */
	strAccountBalance: string;
	/** Account username (login name) */
	strAccountName: string;
	/** 64-bit Steam ID as string */
	strSteamID: string;
}

/**
 * Global App object provided by Steam client.
 */
interface SteamApp {
	m_CurrentUser: SteamCurrentUser;
}

declare global {
	let appStore: AppStore;
	let appInfoStore: AppInfoStore;
	let SteamUIStore: SteamUIStore;
	let SteamClient: SteamClient;
	let SuspendResumeStore: SuspendResumeStoreTypes;
	let collectionStore: CollectionStore;
	/** Global App object containing current user information */
	let App: SteamApp | undefined;
}
