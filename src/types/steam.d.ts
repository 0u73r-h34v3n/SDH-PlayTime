import "@decky/ui/dist/globals";
import type { CAppInfoStore } from "@decky/ui/dist/globals/stores/appinfostore";
import type { SuspendResumeStore as SuspendResumeStoreType } from "./steam/SuspendResumeStore";

declare global {
	var appInfoStore: CAppInfoStore;
	var SuspendResumeStore: SuspendResumeStoreType;
	interface Window {
		appInfoStore: CAppInfoStore;
		SuspendResumeStore: SuspendResumeStoreType;
	}
}
