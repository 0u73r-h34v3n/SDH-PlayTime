import { isNil } from "es-toolkit";
import type { Clock, EventBus, Mountable } from "../system";
import {
	getMobxObservable,
	type MobxComputedValue,
	type MobxObservableValue,
} from "@src/utils/mobx";
import logger from "@src/utils/logger";

interface MobXSleepObservables {
	suspending:
		| MobxComputedValue<SuspendResumeStore["m_bSuspending"]>
		| MobxObservableValue<SuspendResumeStore["m_bSuspending"]>;
	resuming:
		| MobxComputedValue<SuspendResumeStore["m_bResuming"]>
		| MobxObservableValue<SuspendResumeStore["m_bResuming"]>;
}

export class SteamSleepEventsMiddleware implements Mountable {
	private clock: Clock;
	private eventBus: EventBus;

	private activeHooks: Array<Unregisterable> = [];

	constructor(eventBus: EventBus, clock: Clock) {
		this.eventBus = eventBus;
		this.clock = clock;
	}

	/**
	 * NOTE(ynhhoJ): Those methods was removed on
	 * `Steam Deck Beta Client Update: September 17th` update
	 */
	public static hasSystemSuspendEvents() {
		if (
			!isNil(SteamClient?.System?.RegisterForOnSuspendRequest) &&
			!isNil(SteamClient?.System?.RegisterForOnResumeFromSuspend)
		) {
			return true;
		}

		return false;
	}

	public static hasUserSuspendEvents() {
		if (
			!isNil(SteamClient?.User?.RegisterForPrepareForSystemSuspendProgress) &&
			!isNil(SteamClient?.User?.RegisterForResumeSuspendedGamesProgress)
		) {
			return true;
		}

		return false;
	}

	public static getMobXSleepEventsObservable(): Nullable<MobXSleepObservables> {
		const suspendingMobXObservable = getMobxObservable<
			SuspendResumeStore,
			SuspendResumeStore["m_bSuspending"]
		>(SuspendResumeStore, "m_bSuspending");

		if (isNil(suspendingMobXObservable)) {
			return;
		}

		const resumingMobXObservable = getMobxObservable<
			SuspendResumeStore,
			SuspendResumeStore["m_bResuming"]
		>(SuspendResumeStore, "m_bResuming");

		if (isNil(resumingMobXObservable)) {
			return;
		}

		return {
			suspending: suspendingMobXObservable,
			resuming: resumingMobXObservable,
		};
	}

	public emitSleepEvent(
		apps: Array<AppOverview>,
		eventType: "Suspended" | "ResumeFromSuspend",
	) {
		for (const app of apps) {
			if (!app?.appid || !app?.display_name) continue;

			this.eventBus.emit({
				type: eventType,
				createdAt: this.clock.getTimeMs(),
				game: {
					id: `${app.appid}`,
					name: app.display_name,
				},
			});
		}
	}

	public useSystemSleepEvents() {
		this.activeHooks.push(
			// @ts-expect-error If `useSystemSleepEvents` was called we knew what both methods exists
			SteamClient.System.RegisterForOnSuspendRequest(() => {
				this.emitSleepEvent(SteamUIStore.RunningApps, "Suspended");
			}),
		);

		this.activeHooks.push(
			// @ts-expect-error
			SteamClient.System.RegisterForOnResumeFromSuspend(() => {
				this.emitSleepEvent(SteamUIStore.RunningApps, "ResumeFromSuspend");
			}),
		);
	}

	public useUserSleepEvents() {
		this.activeHooks.push(
			// @ts-expect-error If `useSystemSleepEvents` was called we knew what both methods exists
			SteamClient.User.RegisterForPrepareForSystemSuspendProgress(() => {
				this.emitSleepEvent(SteamUIStore.RunningApps, "Suspended");
			}),
		);

		this.activeHooks.push(
			// @ts-expect-error
			SteamClient.User.RegisterForResumeSuspendedGamesProgress(() => {
				this.emitSleepEvent(SteamUIStore.RunningApps, "ResumeFromSuspend");
			}),
		);
	}

	public useMobXSleepEventsListener(
		mobXSleepEventsObservable: MobXSleepObservables,
	) {
		const unregisterSuspendingObservable =
			mobXSleepEventsObservable.suspending.observe_((change) => {
				const { newValue } = change;

				if (!newValue) {
					return;
				}

				this.emitSleepEvent(SteamUIStore.RunningApps, "Suspended");
			});

		this.activeHooks.push({
			unregister: () => {
				if (isNil(unregisterSuspendingObservable)) {
					return;
				}

				return unregisterSuspendingObservable();
			},
		});

		const unregisterResumingObservable =
			mobXSleepEventsObservable.resuming.observe_((change) => {
				const { newValue } = change;

				if (!newValue) {
					return;
				}

				this.emitSleepEvent(SteamUIStore.RunningApps, "ResumeFromSuspend");
			});

		this.activeHooks.push({
			unregister: () => {
				if (isNil(unregisterResumingObservable)) {
					return;
				}

				return unregisterResumingObservable();
			},
		});
	}

	public mount() {
		if (SteamSleepEventsMiddleware.hasSystemSuspendEvents()) {
			logger.info(
				"SteamClient.System sleep events are available. Starting use them...",
			);

			this.useSystemSleepEvents();

			return true;
		}

		if (SteamSleepEventsMiddleware.hasUserSuspendEvents()) {
			logger.info(
				"SteamClient.User sleep events are available. Starting use them...",
			);
			this.useUserSleepEvents();

			return true;
		}

		const mobXSleepEventsObservable =
			SteamSleepEventsMiddleware.getMobXSleepEventsObservable();

		if (!mobXSleepEventsObservable) {
			logger.error(
				"SteamClient.System & SteamClient.User sleep events are NOT available. Can't run MobX listener. STOP EVERYTHING!",
			);

			return false;
		}

		logger.info(
			"SteamClient.System & SteamClient.User sleep events are NOT available. Run MobX listener...",
		);

		this.useMobXSleepEventsListener(mobXSleepEventsObservable);

		return true;
	}

	public async unMount() {
		for (const it of this.activeHooks) {
			it.unregister();
		}
	}
}
