import { afterPatch, type Patch } from "@decky/ui/dist/utils/patcher";
import { EResult } from "@decky/ui/dist/globals/steam-client/shared";
import type { Clock, EventBus } from "../../system";
import logger from "@src/utils/logger";
import { SleepEventsListener } from "./SleepEventsListener";

interface SuspendPreparationTarget {
	user: SteamClient["User"];
	original: PropertyDescriptor;
}

interface SuspendPreparationHook {
	enabled: boolean;
	patch?: Patch;
	resume?: Unregisterable;
}

export class SuspendPreparationSleepEvents extends SleepEventsListener {
	private onFailure: () => void;

	constructor(eventBus: EventBus, clock: Clock, onFailure: () => void) {
		super(eventBus, clock);
		this.onFailure = onFailure;
	}

	private static getSuspendPreparationTarget(): Nullable<SuspendPreparationTarget> {
		if (
			typeof SteamClient === "undefined" ||
			!SteamClient?.User ||
			typeof SteamUIStore === "undefined" ||
			!Array.isArray(SteamUIStore?.RunningApps)
		) {
			return;
		}

		const user = SteamClient.User;

		const original = Object.getOwnPropertyDescriptor(
			user,
			"PrepareForSystemSuspend",
		);

		if (
			!original?.writable ||
			!original.configurable ||
			typeof original.value !== "function"
		) {
			return;
		}

		return { user, original };
	}

	private stopSuspendPreparation(hook: SuspendPreparationHook) {
		hook.enabled = false;

		const { resume, patch } = hook;

		hook.resume = undefined;
		hook.patch = undefined;

		try {
			resume?.unregister();
		} catch (error) {
			logger.error("Failed to unregister experimental resume listener", error);
		}

		try {
			patch?.unpatch();
		} catch (error) {
			logger.error("Failed to remove experimental suspend patch", error);
		}
	}

	private disableSuspendPreparation(
		hook: SuspendPreparationHook,
		error: unknown,
	) {
		if (!hook.enabled) {
			return;
		}

		this.unMount();
		logger.error(
			"Disabling experimental suspend patch; using existing listeners",
			error,
		);
		this.onFailure();
	}

	private onSuspendPrepared(hook: SuspendPreparationHook, result: unknown) {
		if (!hook.enabled) {
			return result;
		}

		try {
			if (
				!result ||
				typeof result !== "object" ||
				!("result" in result) ||
				typeof result.result !== "number"
			) {
				throw new Error("Unexpected Steam suspend preparation result");
			}

			if (result.result !== EResult.OK) {
				return result;
			}

			this.eventBus.emit({
				type: "Suspended",
				createdAt: this.clock.getTimeMs(),
				game: null,
			});
		} catch (error) {
			this.disableSuspendPreparation(hook, error);
		}

		return result;
	}

	private onSuspendPreparation(
		hook: SuspendPreparationHook,
		preparation: unknown,
	) {
		if (!hook.enabled) {
			return preparation;
		}

		try {
			if (
				!preparation ||
				typeof (preparation as PromiseLike<unknown>).then !== "function"
			) {
				throw new Error("Unexpected Steam suspend preparation return value");
			}

			return Promise.resolve(preparation as PromiseLike<unknown>).then(
				(result) => this.onSuspendPrepared(hook, result),
			);
		} catch (error) {
			this.disableSuspendPreparation(hook, error);

			return preparation;
		}
	}

	private onResumeSuspendedGames(hook: SuspendPreparationHook) {
		if (!hook.enabled) {
			return;
		}

		try {
			this.emitSleepEvent(SteamUIStore.RunningApps, "ResumeFromSuspend");
		} catch (error) {
			this.disableSuspendPreparation(hook, error);
		}
	}

	private installSuspendPreparation(
		user: SteamClient["User"],
		hook: SuspendPreparationHook,
	) {
		if (typeof user.RegisterForResumeSuspendedGamesProgress !== "function") {
			return false;
		}

		hook.patch = afterPatch(user, "PrepareForSystemSuspend", (_, preparation) =>
			this.onSuspendPreparation(hook, preparation),
		);

		if (
			Object.getOwnPropertyDescriptor(user, "PrepareForSystemSuspend")
				?.value !== hook.patch.patchedFunction
		) {
			throw new Error("Steam suspend patch was not installed");
		}

		hook.resume = user.RegisterForResumeSuspendedGamesProgress(() =>
			this.onResumeSuspendedGames(hook),
		);

		if (typeof hook.resume?.unregister !== "function") {
			throw new Error("Steam resume registration is not unregisterable");
		}

		this.activeHooks.push({
			unregister: () => this.stopSuspendPreparation(hook),
		});
		hook.enabled = true;

		return true;
	}

	private restoreSuspendPreparation(
		target: Nullable<SuspendPreparationTarget>,
	) {
		if (!target) {
			return;
		}

		try {
			Object.defineProperty(
				target.user,
				"PrepareForSystemSuspend",
				target.original,
			);
		} catch (error) {
			logger.error("Failed to roll back experimental suspend patch", error);
		}
	}

	public mount(): boolean {
		let target: Nullable<SuspendPreparationTarget>;

		const hook: SuspendPreparationHook = { enabled: false };

		try {
			target = SuspendPreparationSleepEvents.getSuspendPreparationTarget();

			if (!target) {
				return false;
			}

			return this.installSuspendPreparation(target.user, hook);
		} catch (error) {
			this.stopSuspendPreparation(hook);

			this.restoreSuspendPreparation(target);

			logger.error(
				"Experimental suspend patch unavailable; using existing listeners",
				error,
			);

			return false;
		}
	}
}
