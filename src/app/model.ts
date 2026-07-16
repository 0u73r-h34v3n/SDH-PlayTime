export { convertDailyStatisticsToGameWithTime };

function convertDailyStatisticsToGameWithTime(
	data: DailyStatistics[],
): GamePlaytimeDetails[] {
	const result = new Map<string, GamePlaytimeDetails>();

	for (const day of data) {
		for (const game of day.games) {
			const found = result.get(game.game.id);

			if (found) {
				found.totalTime += game.totalTime;
				found.sessions.push(...game.sessions);

				continue;
			}

			result.set(game.game.id, {
				...game,
				sessions: [...game.sessions],
			});
		}
	}

	return Array.from(result.values());
}
