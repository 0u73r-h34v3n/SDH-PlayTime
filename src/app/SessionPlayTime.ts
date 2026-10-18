import { isNil } from "es-toolkit";
import logger from "@src/utils/logger";

import type { EventBus } from "./system";
import type { Events } from "./events";

export { SessionPlayTime, type PlayTime };

interface ActiveInterval {
	startedAt: number;
	game: Game;
}

type PlayTime = {
	gameName: string;
	playTime: number;
};

class SessionPlayTime {
	private activeInterval: Map<string, ActiveInterval> = new Map();
	private eventBus: EventBus;

	constructor(eventBus: EventBus) {
		this.eventBus = eventBus;

		eventBus.addSubscriber((event) => this.onEvent(event));
	}

	private onEvent(event: Events) {
		switch (event.type) {
			case "GameWasRunningBefore":
			case "GameStarted":
				this.startInterval(event.createdAt, event.game);

				return;

			case "GameStopped":
				this.commitInterval(event.createdAt, event.game);

				return;

			case "Suspended":
			case "Unmount":
				this.commitAllIntervals(event.createdAt);

				return;

			case "ResumeFromSuspend":
				if (event.game == null) {
					return;
				}

				this.startInterval(event.createdAt, event.game);
		}
	}

	private commitAllIntervals(endedAt: number) {
		for (const key of [...this.activeInterval.keys()]) {
			const intervalInformation = this.activeInterval.get(key);

			if (isNil(intervalInformation)) {
				continue;
			}

			this.commitInterval(endedAt, intervalInformation.game);
		}
	}

	public getPlayTime(requestedAt: number): Array<PlayTime> {
		const response: Array<PlayTime> = [];

		for (const key of this.activeInterval.keys()) {
			const currentGame = this.activeInterval.get(`${key}`);

			if (isNil(currentGame)) {
				continue;
			}

			const { game, startedAt } = currentGame;

			response.push({
				gameName: game.name,
				playTime: (requestedAt - startedAt) / 1000,
			});
		}

		return response;
	}

	private startInterval(startedAt: number, game: Game) {
		if (this.activeInterval.size !== 0 && this.activeInterval.has(game.id)) {
			logger.error(
				`Getting same game (${game.name}) start interval, ignoring it`,
			);

			return;
		}

		this.activeInterval.set(`${game.id}`, {
			startedAt: startedAt,
			game: game,
		});
	}

	private commitInterval(endedAt: number, game: Game) {
		if (this.activeInterval.size === 0) {
			logger.error("There is no active interval, ignoring commit");

			return;
		}

		if (isNil(game)) {
			return;
		}

		const currentGameInterval = this.activeInterval.get(`${game?.id}`);

		if (isNil(currentGameInterval)) {
			logger.error(
				`There is no active interval for ${game.name} (ID: ${game.id}), ignoring commit`,
			);

			return;
		}

		this.eventBus.emit({
			type: "CommitInterval",
			startedAt: currentGameInterval.startedAt,
			endedAt: endedAt,
			game: currentGameInterval.game,
		});
		this.activeInterval.delete(currentGameInterval.game.id);

		window.dispatchEvent(
			new CustomEvent("playtime:interval-committed:v1", {
				detail: {
					startedAt: currentGameInterval.startedAt,
					endedAt,
					game: {
						id: currentGameInterval.game.id,
						name: currentGameInterval.game.name,
					},
				},
			}),
		);
	}
}
