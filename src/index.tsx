import { routerHook, toaster } from "@decky/api";
import { definePlugin, staticClasses, useParams } from "@decky/ui";
import { patchAppPage } from "@src/steam/ui/routePatches";
import { SteamPlayTimePatches } from "@src/steam/ui/SteamPlayTimePatches";
import { getDurationInHours } from "@utils/formatters";
import { FaClock } from "react-icons/fa";
import { SessionPlayTime } from "./app/SessionPlayTime";
import { Backend } from "./app/backend";
import { getCurrentNonSteamGamesChecksum } from "./app/games";
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
import { FileChecksum } from "./pages/FileChecksum";
import { GameActivity } from "./pages/GameActivity";
import { ManuallyAdjustTimePage } from "./pages/ManuallyAdjustTimePage";
import { DetailedPage } from "./pages/ReportPage";
import { SettingsPage } from "./pages/SettingsPage";
import {
	DETAILED_REPORT_ROUTE,
	FILE_CHECKSUM_ROUTE,
	GAME_REPORT_ROUTE,
	MANUALLY_ADJUST_TIME,
	SETTINGS_ROUTE,
} from "./pages/navigation";
import { log } from "./utils/logger";

export default definePlugin(() => {
	log("PlayTime plugin loading...");

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
		backend,
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
		},
	};
});

function createMountables(
	eventBus: EventBus,
	backend: Backend,
	clock: Clock,
	settings: Settings,
	reports: Reports,
	sessionPlayTime: SessionPlayTime,
	timeMigration: TimeManipulation,
): Mountable[] {
	const cachedPlayTimes = createCachedPlayTimes(backend, eventBus);
	const cachedLastTwoWeeksPlayTimes = createCachedLastTwoWeeksPlayTimes(
		backend,
		eventBus,
	);

	eventBus.addSubscriber((event) => {
		switch (event.type) {
			case "UserLoggedIn": {
				getCurrentNonSteamGamesChecksum();

				break;
			}

			case "NotifyToTakeBreak":
				toaster.toast({
					body: (
						<div>
							You already playing for{" "}
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
			routerHook.addRoute(DETAILED_REPORT_ROUTE, () => (
				<LocatorProvider
					reports={reports}
					sessionPlayTime={sessionPlayTime}
					settings={settings}
					timeManipulation={timeMigration}
				>
					<DetailedPage />
				</LocatorProvider>
			));
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
		},
	});

	mounts.push({
		mount() {
			routerHook.addRoute(FILE_CHECKSUM_ROUTE, () => (
				<LocatorProvider
					reports={reports}
					sessionPlayTime={sessionPlayTime}
					settings={settings}
					timeManipulation={timeMigration}
				>
					<FileChecksum />
				</LocatorProvider>
			));
		},
		unMount() {
			routerHook.removeRoute(FILE_CHECKSUM_ROUTE);
		},
	});

	mounts.push(patchAppPage(cachedPlayTimes));
	mounts.push(
		new SteamPlayTimePatches(cachedPlayTimes, cachedLastTwoWeeksPlayTimes),
	);

	return mounts;
}
