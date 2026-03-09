import { isNil } from "@src/utils/isNil";
import logger from "@src/utils/logger";

import type { EventBus } from "./system";

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

		eventBus.addSubscriber(async (event) => {
			switch (event.type) {
				case "GameWasRunningBefore":
					this.startInterval(event.createdAt, event.game);
					break;

				case "GameStarted":
					this.startInterval(event.createdAt, event.game);
					break;

				case "GameStopped":
					await this.commitInterval(event.createdAt, event.game);

					this.activeInterval.delete(event.game.id);
					break;

				case "Suspended":
					for (const key of [...this.activeInterval.keys()]) {
						const intervalInformation = this.activeInterval.get(key);

						if (isNil(intervalInformation)) {
							continue;
						}

						await this.commitInterval(
							event.createdAt,
							intervalInformation.game,
						);
						this.activeInterval.delete(key);
					}

					break;

				case "ResumeFromSuspend":
					if (event.game != null) {
						this.startInterval(event.createdAt, event.game);
					}
					break;

				case "Unmount":
					for (const key of [...this.activeInterval.keys()]) {
						const intervalInformation = this.activeInterval.get(key);

						if (isNil(intervalInformation)) {
							continue;
						}

						await this.commitInterval(
							event.createdAt,
							intervalInformation.game,
						);
						this.activeInterval.delete(key);
					}
					break;
			}
		});
	}

	public getPlayTime(requestedAt: number): Array<PlayTime> {
		if (this.activeInterval.size !== 0) {
			const response = [];

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

		return [];
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

	private async commitInterval(endedAt: number, game: Game) {
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

		return new Promise((resolve) => resolve(true));
	}
}
