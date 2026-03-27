import type { Settings } from "./settings";
import type { EventBus, Mountable } from "./system";

export class BreaksReminder implements Mountable {
	eventBus: EventBus;
	settings: Settings;
	timeoutId: NodeJS.Timeout | null = null;
	sessionStartedAt: number | null = null;

	constructor(eventBus: EventBus, settings: Settings) {
		this.eventBus = eventBus;
		this.settings = settings;
		eventBus.addSubscriber(async (event) => {
			switch (event.type) {
				case "GameWasRunningBefore":
				case "GameStarted":
					if (this.timeoutId == null && (await this.notificationsAllowed())) {
						this.setTimer();
					}
					break;
				case "GameStopped":
				case "Suspended":
					this.stopTimer();
					break;
			}
		});
	}

	private async notificationsAllowed(): Promise<boolean> {
		return (await this.settings.get()).reminderToTakeBreaksInterval > 0;
	}

	private async setTimer() {
		const timeoutMs =
			(await (await this.settings.get()).reminderToTakeBreaksInterval) *
			60 *
			1000;
		this.sessionStartedAt = Date.now();
		this.timeoutId = setTimeout(() => {
			this.onTime();
		}, timeoutMs);
	}

	private async onTime() {
		this.stopTimer();

		if (await this.notificationsAllowed()) {
			const playedMs = Date.now() - (this.sessionStartedAt as number);

			this.eventBus.emit({
				type: "NotifyToTakeBreak",
				playTimeSeconds: playedMs / 1000,
			});
			this.setTimer();
		}
	}

	private async stopTimer() {
		if (this.timeoutId != null) {
			clearTimeout(this.timeoutId);
		}
	}

	public mount() {}
	public unMount() {
		this.stopTimer();
	}
}
