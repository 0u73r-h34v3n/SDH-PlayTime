import { diffArray } from "@src/utils/diff";
import logger from "@src/utils/logger";
import { isNil } from "../utils/isNil";
import type { Clock, EventBus, Mountable } from "./system";
import { getMobxObservable } from "@src/utils/mobx";
import { SteamSleepEventsMiddleware } from "./middlewares/sleep";

export { SteamEventMiddleware };

class SteamEventMiddleware implements Mountable {
	private clock: Clock;
	private eventBus: EventBus;
	private sleepEventsMiddleware: SteamSleepEventsMiddleware;

	private activeHooks: Array<Unregisterable> = [];

	constructor(eventBus: EventBus, clock: Clock) {
		this.eventBus = eventBus;
		this.clock = clock;
		this.sleepEventsMiddleware = new SteamSleepEventsMiddleware(
			eventBus,
			clock,
		);
	}

	public mount() {
		const hasSleepEvents = this.sleepEventsMiddleware.mount();

		if (!hasSleepEvents) {
			return;
		}

		const runningAppsObservableValue = getMobxObservable<
			SteamUIStore,
			SteamUIStore["RunningApps"]
		>(SteamUIStore, "RunningApps");

		if (isNil(runningAppsObservableValue)) {
			logger.error(
				'Impossible to get "RunningApps" observe. Events will not be attached.',
			);

			return;
		}

		for (const app of SteamUIStore.RunningApps) {
			this.eventBus.emit({
				type: "GameWasRunningBefore",
				createdAt: this.clock.getTimeMs(),
				game: {
					id: `${app.appid}`,
					name: app.display_name,
				},
			});
		}

		// hook login state (user login/logout)
		this.activeHooks.push(
			SteamClient.User.RegisterForLoginStateChange(
				(username: string, ...rest) => {
					logger.debug("RegisterForLoginStateChange -> ", username, rest);

					if (username) {
						// Get the Steam ID from the global App object
						const steamId = App?.m_CurrentUser?.strSteamID ?? "";

						if (!steamId) {
							logger.debug("User logged in but Steam ID not available yet");
						}

						this.eventBus.emit({
							type: "UserLoggedIn",
							createdAt: this.clock.getTimeMs(),
							username: username,
							steamId: steamId,
						});

						return;
					}

					this.eventBus.emit({
						type: "UserLoggedOut",
						createdAt: this.clock.getTimeMs(),
					});
				},
			),
		);

		const unregisterAppsObservable = runningAppsObservableValue.observe_(
			(change) => {
				const { newValue: currentRunningApps, oldValue: oldRunnedApps = [] } =
					change;

				const runnedApps = diffArray(
					currentRunningApps,
					oldRunnedApps,
					"appid",
				);
				const closedApps = diffArray(
					oldRunnedApps,
					currentRunningApps,
					"appid",
				);

				for (const runnedApp of runnedApps) {
					const { appid, display_name } = runnedApp;

					if (isNil(appid) || isNil(display_name)) {
						continue;
					}

					this.eventBus.emit({
						type: "GameStarted",
						createdAt: this.clock.getTimeMs(),
						game: {
							id: `${appid}`,
							name: display_name,
						},
					});
				}

				for (const closedApp of closedApps) {
					const { appid, display_name } = closedApp;

					if (isNil(appid) || isNil(display_name)) {
						continue;
					}

					this.eventBus.emit({
						type: "GameStopped",
						createdAt: this.clock.getTimeMs(),
						game: {
							id: `${appid}`,
							name: display_name,
						},
					});
				}
			},
		);

		this.activeHooks.push({
			unregister: () => {
				if (isNil(unregisterAppsObservable)) {
					return;
				}

				return unregisterAppsObservable();
			},
		});

		this.activeHooks.push(
			(() => {
				const originalInitiateSleep = SuspendResumeStore.InitiateSleep;
				const instance = this;

				SuspendResumeStore.InitiateSleep = function () {
					for (const app of SteamUIStore.RunningApps) {
						instance.eventBus.emit({
							type: "Suspended",
							createdAt: instance.clock.getTimeMs(),
							game: {
								id: `${app.appid}`,
								name: app.display_name,
							},
						});
					}

					originalInitiateSleep.apply(this);
				};

				return {
					unregister: () => {
						SuspendResumeStore.InitiateSleep = function () {
							originalInitiateSleep.apply(this);
						};
					},
				};
			})(),
		);
	}

	public async unMount() {
		for (const it of this.activeHooks) {
			it.unregister();
		}

		this.sleepEventsMiddleware.unMount();
	}
}
