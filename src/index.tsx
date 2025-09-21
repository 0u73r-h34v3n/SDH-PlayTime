import { routerHook, toaster } from "@decky/api";
import { definePlugin, findSP, staticClasses, useParams } from "@decky/ui";
import { patchAppPage } from "@src/steam/ui/routePatches";
import { SteamPlayTimePatches } from "@src/steam/ui/steamPlayTimePatches";
import { getDurationInHours } from "@utils/formatters";
import { FaClock } from "react-icons/fa";
import { SessionPlayTime } from "./app/SessionPlayTime";
import { Backend } from "./app/backend";
import { SteamEventMiddleware } from "./app/middleware";
import { BreaksReminder } from "./app/notification";
import { Reports } from "./app/reports";
import { Settings } from "./app/settings";
import {
	type Clock,
	EventBus,
	MountManager,
	type Mountable,
	systemClock,
} from "./app/system";
import { TimeManipulation } from "./app/timeManipulation";
import {
	createCachedLastTwoWeeksPlayTimes,
	createCachedPlayTimes,
} from "./cachables";
import { LocatorProvider } from "./locator";
import { DeckyPanelPage } from "./pages/DeckyPanelPage";
import { GameActivity } from "./pages/GameActivity";
import { ManuallyAdjustTimePage } from "./pages/ManuallyAdjustTimePage";
import { DetailedPage } from "./pages/ReportPage";
import { SettingsPage } from "./pages/settings/";
import {
	DETAILED_REPORT_ROUTE,
	GAME_REPORT_ROUTE,
	MANUALLY_ADJUST_TIME,
	SETTINGS_ROUTE,
} from "./pages/navigation";
import { log, error } from "./utils/logger";
import { getNonSteamGamesChecksumFromDataBase } from "./app/games";
import { isNil } from "./utils/isNil";
import PlayTimeStyle from "./styles/output.css";
import { unbindChecksumsLoadingStateListener } from "./stores/games";
import { unbindLastOpenedPageListener } from "./stores/ui";
import { useEffect } from "react";

function injectTailwind() {
	if (typeof document === "undefined") {
		error("Impossible to inject TailwindCSS styles into <head />");

		return;
	}

	if (!isNil(findSP()?.document?.head?.querySelector("#playTimeStyle"))) {
		findSP()?.document?.head?.querySelector("#playTimeStyle")?.remove();
	}

	const style = document.createElement("style");
	style.id = "playTimeStyle";
	style.innerHTML = PlayTimeStyle;

	findSP()?.document?.head?.appendChild(style);

	log("Inject TailwindCSS styles into <head />");
}

export default definePlugin(() => {
	log("PlayTime plugin loading...");
	injectTailwind();

	const clock = systemClock;
	const eventBus = new EventBus();
	const backend = new Backend(eventBus);
	const sessionPlayTime = new SessionPlayTime(eventBus);
	const settings = new Settings();
	const reports = new Reports(backend);
	const timeMigration = new TimeManipulation(backend);

	const mountManager = new MountManager(eventBus, clock);
	const mounts = createMountables(
		eventBus,
		clock,
		settings,
		reports,
		sessionPlayTime,
		timeMigration,
	);

	for (const mount of mounts) {
		mountManager.addMount(mount);
	}

	mountManager.mount();

	return {
		title: <div className={staticClasses.Title}>PlayTime</div>,
		content: (
			<LocatorProvider
				sessionPlayTime={sessionPlayTime}
				settings={settings}
				reports={reports}
				timeManipulation={timeMigration}
			>
				<DeckyPanelPage />
			</LocatorProvider>
		),
		icon: <FaClock />,
		onDismount() {
			mountManager.unMount();

			unbindChecksumsLoadingStateListener();
			unbindLastOpenedPageListener();
		},
	};
});

function createMountables(
	eventBus: EventBus,
	clock: Clock,
	settings: Settings,
	reports: Reports,
	sessionPlayTime: SessionPlayTime,
	timeMigration: TimeManipulation,
): Mountable[] {
	const cachedPlayTimes = createCachedPlayTimes(eventBus);
	const cachedLastTwoWeeksPlayTimes =
		createCachedLastTwoWeeksPlayTimes(eventBus);

	eventBus.addSubscriber(async (event) => {
		switch (event.type) {
			case "UserLoggedIn": {
				const userSettings = await settings.get();

				if (
					isNil(userSettings) ||
					!userSettings?.isEnabledDetectionOfGamesByFileChecksum
				) {
					return;
				}

				getNonSteamGamesChecksumFromDataBase();

				break;
			}
			case "NotifyToTakeBreak":
				toaster.toast({
					body: (
						<div>
							You've already been playing for{" "}
							{getDurationInHours(event.playTimeSeconds)},
						</div>
					),
					title: "PlayTime: remember to take a breaks",
					icon: <FaClock />,
					duration: 10 * 1000,
					critical: true,
				});
				break;
			case "NotifyAboutError":
				toaster.toast({
					body: <div>{event.message}</div>,
					title: "PlayTime: error",
					icon: <FaClock />,
					duration: 2 * 1000,
					critical: true,
				});
				break;
		}
	});

	const mounts: Mountable[] = [];

	mounts.push(new BreaksReminder(eventBus, settings));
	mounts.push(new SteamEventMiddleware(eventBus, clock));

	mounts.push({
		mount() {
			routerHook.addRoute(DETAILED_REPORT_ROUTE, () => {
				useEffect(() => {
					return () => {
						console.log("destroy DETAILED_REPORT_ROUTE");
					};
				});

				return (
					<LocatorProvider
						reports={reports}
						sessionPlayTime={sessionPlayTime}
						settings={settings}
						timeManipulation={timeMigration}
					>
						<DetailedPage />
					</LocatorProvider>
				);
			});
		},
		unMount() {
			routerHook.removeRoute(DETAILED_REPORT_ROUTE);
		},
	});

	mounts.push({
		mount() {
			routerHook.addRoute(SETTINGS_ROUTE, () => (
				<LocatorProvider
					reports={reports}
					sessionPlayTime={sessionPlayTime}
					settings={settings}
					timeManipulation={timeMigration}
				>
					<SettingsPage />
				</LocatorProvider>
			));
		},
		unMount() {
			routerHook.removeRoute(SETTINGS_ROUTE);
		},
	});

	mounts.push({
		mount() {
			routerHook.addRoute(MANUALLY_ADJUST_TIME, () => (
				<LocatorProvider
					reports={reports}
					sessionPlayTime={sessionPlayTime}
					settings={settings}
					timeManipulation={timeMigration}
				>
					<ManuallyAdjustTimePage />
				</LocatorProvider>
			));
		},
		unMount() {
			routerHook.removeRoute(MANUALLY_ADJUST_TIME);
		},
	});

	mounts.push({
		mount() {
			routerHook.addRoute(GAME_REPORT_ROUTE, () => {
				const { gameId } = useParams<{ gameId: string }>();

				return (
					<LocatorProvider
						reports={reports}
						sessionPlayTime={sessionPlayTime}
						settings={settings}
						timeManipulation={timeMigration}
					>
						<GameActivity gameId={gameId} />
					</LocatorProvider>
				);
			});
		},
		unMount() {
			routerHook.removeRoute(GAME_REPORT_ROUTE);

			findSP().document.head.querySelector("#playTimeStyle")?.remove();
		},
	});

	mounts.push(patchAppPage(cachedPlayTimes));
	mounts.push(
		new SteamPlayTimePatches(cachedPlayTimes, cachedLastTwoWeeksPlayTimes),
	);

	return mounts;
}
