import { isNil } from "es-toolkit";
import {
	getMobxObservable,
	type MobxComputedValue,
	type MobxObservableValue,
} from "@src/utils/mobx";
import logger from "@src/utils/logger";
import { SleepEventsListener } from "./SleepEventsListener";

interface MobXSleepObservables {
	suspending:
		| MobxComputedValue<SuspendResumeStore["m_bSuspending"]>
		| MobxObservableValue<SuspendResumeStore["m_bSuspending"]>;
	resuming:
		| MobxComputedValue<SuspendResumeStore["m_bResuming"]>
		| MobxObservableValue<SuspendResumeStore["m_bResuming"]>;
}

export class MobXSleepEvents extends SleepEventsListener {
	private static getMobXSleepEventsObservable(): Nullable<MobXSleepObservables> {
		if (typeof SuspendResumeStore === "undefined" || !SuspendResumeStore) {
			return;
		}

		const suspendingMobXObservable = getMobxObservable<
			SuspendResumeStore,
			SuspendResumeStore["m_bSuspending"]
		>(SuspendResumeStore, "m_bSuspending");

		if (typeof suspendingMobXObservable?.observe_ !== "function") {
			return;
		}

		const resumingMobXObservable = getMobxObservable<
			SuspendResumeStore,
			SuspendResumeStore["m_bResuming"]
		>(SuspendResumeStore, "m_bResuming");

		if (typeof resumingMobXObservable?.observe_ !== "function") {
			return;
		}

		return {
			suspending: suspendingMobXObservable,
			resuming: resumingMobXObservable,
		};
	}

	private useMobXSleepEventsListener(
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
		try {
			const mobXSleepEventsObservable =
				MobXSleepEvents.getMobXSleepEventsObservable();

			if (!mobXSleepEventsObservable) {
				return false;
			}

			logger.info("Steam sleep events are unavailable. Run MobX listener...");
			this.useMobXSleepEventsListener(mobXSleepEventsObservable);

			return true;
		} catch (error) {
			this.unMount();
			logger.error("Failed to register MobX sleep listener", error);

			return false;
		}
	}
}
