import { type RoutePatch, routerHook } from "@decky/api";
import { afterPatch } from "@decky/ui";
import type { Cache } from "@src/app/cache";
import type { Mountable } from "@src/app/system";
import { APP_TYPE } from "@src/constants";
import type { ReactElement } from "react";

function routePatch(path: string, patch: RoutePatch): Mountable {
	return {
		mount() {
			routerHook.addPatch(path, patch);
		},
		unMount() {
			routerHook.removePatch(path, patch);
		},
	};
}

export function patchAppPage(
	timeCache: Cache<
		Map<
			string,
			{
				time: number;
				lastDate: number;
			}
		>
	>,
): Mountable {
	return routePatch(
		"/library/app/:appid",
		(props: { path: string; children: ReactElement }) => {
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
					if (details && timeCache.isReady()) {
						const time = timeCache.get()?.get(app_id.toString())?.time || 0;

						details.nPlaytimeForever = +(time / 60.0).toFixed(1);
					}
				}

				// just getting value - it fixes blinking issue
				details.nPlaytimeForever;

				return ret1;
			});

			return props;
		},
	);
}
