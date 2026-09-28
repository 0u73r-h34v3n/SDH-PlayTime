import { routerHook } from "@decky/api";
import { afterPatch } from "@decky/ui";
import type { Cache } from "@src/app/cache";
import type { Mountable } from "@src/app/system";
import { APP_TYPE } from "@src/constants";
import type { ReactElement } from "react";

type SubscribeMergedPlaytimeEnabled = (
	callback: (enabled: boolean) => void,
) => () => void;

type NativeDetailSnapshot = {
	details: AppDetails;
	nativeTime: number;
	lastMergedTime: number | null;
};

export function patchAppPage(
	timeCache: Cache<
		Map<
			string,
			{
				time: number;
				lastDate: number;
				isMerged?: boolean;
			}
		>
	>,
	isMergedPlaytimeEnabled: () => boolean = () => false,
	subscribeMergedPlaytimeEnabled: SubscribeMergedPlaytimeEnabled | null = null,
): Mountable {
	const nativeDetailSnapshots = new Map<number, NativeDetailSnapshot>();
	let unsubscribeMergedPlaytimeEnabled: (() => void) | null = null;

	const mergedTimeFor = (appId: number): number | null => {
		const record = timeCache.get()?.get(appId.toString());
		if (!record?.isMerged || !timeCache.isReady()) {
			return null;
		}

		return +(record.time / 60.0).toFixed(1);
	};

	const restoreNativeDetails = (clear: boolean) => {
		for (const [appId, snapshot] of nativeDetailSnapshots) {
			snapshot.details.nPlaytimeForever = snapshot.nativeTime;
			snapshot.lastMergedTime = null;

			if (clear) {
				nativeDetailSnapshots.delete(appId);
			}
		}
	};

	const applyMergedDetails = () => {
		for (const [appId, snapshot] of nativeDetailSnapshots) {
			const mergedTime = mergedTimeFor(appId);
			if (mergedTime === null) {
				snapshot.details.nPlaytimeForever = snapshot.nativeTime;
				nativeDetailSnapshots.delete(appId);
				continue;
			}

			if (
				snapshot.lastMergedTime === null ||
				snapshot.details.nPlaytimeForever !== snapshot.lastMergedTime
			) {
				snapshot.nativeTime = snapshot.details.nPlaytimeForever;
			}

			snapshot.details.nPlaytimeForever = mergedTime;
			snapshot.lastMergedTime = mergedTime;
		}
	};

	const patch = (props: { path: string; children: ReactElement }) => {
		afterPatch(props.children.props, "renderFunc", (_, ret1) => {
			const overview: AppOverview = ret1?.props?.children?.props?.overview;

			if (!overview) return ret1;

			const details: AppDetails = ret1?.props?.children?.props?.details;

			if (!details) return ret1;

			const app_id: number = overview?.appid;

			if (!app_id) return ret1;

			// just getting value - it fixes blinking issue
			details.nPlaytimeForever;

			if (overview.app_type === APP_TYPE.THIRD_PARTY) {
				if (timeCache.isReady()) {
					const time = timeCache.get()?.get(app_id.toString())?.time || 0;
					details.nPlaytimeForever = +(time / 60.0).toFixed(1);
				}
			} else {
				const mergedTime = mergedTimeFor(app_id);
				let snapshot = nativeDetailSnapshots.get(app_id);

				if (mergedTime === null) {
					if (snapshot?.details === details) {
						details.nPlaytimeForever = snapshot.nativeTime;
						nativeDetailSnapshots.delete(app_id);
					}
				} else {
					if (snapshot?.details !== details) {
						snapshot = {
							details,
							nativeTime: details.nPlaytimeForever,
							lastMergedTime: null,
						};
						nativeDetailSnapshots.set(app_id, snapshot);
					}

					if (isMergedPlaytimeEnabled()) {
						if (
							snapshot.lastMergedTime === null ||
							details.nPlaytimeForever !== snapshot.lastMergedTime
						) {
							snapshot.nativeTime = details.nPlaytimeForever;
						}

						details.nPlaytimeForever = mergedTime;
						snapshot.lastMergedTime = mergedTime;
					} else {
						if (snapshot.lastMergedTime === null) {
							snapshot.nativeTime = details.nPlaytimeForever;
						} else {
							details.nPlaytimeForever = snapshot.nativeTime;
							snapshot.lastMergedTime = null;
						}
					}
				}
			}

			// just getting value - it fixes blinking issue
			details.nPlaytimeForever;

			return ret1;
		});

		return props;
	};

	return {
		mount() {
			routerHook.addPatch("/library/app/:appid", patch);
			unsubscribeMergedPlaytimeEnabled =
				subscribeMergedPlaytimeEnabled?.((enabled) => {
					if (enabled) {
						applyMergedDetails();
						return;
					}

					restoreNativeDetails(false);
				}) ?? null;
		},
		unMount() {
			unsubscribeMergedPlaytimeEnabled?.();
			unsubscribeMergedPlaytimeEnabled = null;
			restoreNativeDetails(true);
			routerHook.removePatch("/library/app/:appid", patch);
		},
	};
}
