import { isNil } from "@src/utils/isNil";
import { Chart } from "./Chart";
import { FocusableExt } from "../FocusableExt";

interface TimeByGame {
	gameId: string;
	gameName: string;
	totalTime: number;
}

function stringToColor(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}
	const c = (hash & 0x00ffffff).toString(16).toUpperCase();

	return "#" + "00000".substring(0, 6 - c.length) + c;
}

function isDailyStatistics(
	statistics: Array<DailyStatistics | GamePlaytimeDetails>,
): statistics is Array<DailyStatistics> {
	return (statistics[0] as DailyStatistics)?.games !== undefined;
}

export function PieView({
	statistics,
}: {
	statistics: Array<DailyStatistics> | Array<GamePlaytimeDetails>;
}) {
	if (isNil(statistics) || statistics.length === 0) {
		return null;
	}

	let raw_data: Array<{ name: string; value: number }>;

	if (isDailyStatistics(statistics)) {
		raw_data = sumTimeAndGroupByGame(statistics)
			.map((value) => ({
				name: value.gameName,
				value: value.totalTime / 60.0,
			}))
			.sort((a, b) => b.value - a.value);
	} else {
		raw_data = statistics
			.sort((a, b) => b.totalTime - a.totalTime)
			.map((item) => ({
				name: item.game.name,
				value: item.totalTime / 60.0,
			}));
	}

	// Show all games, each with a unique color
	const data: Array<{ name: string; value: number }> = raw_data;
	const labels = data.map((d) => d.name);
	const values = data.map((d) => d.value);
	const colors = labels.map((name) => stringToColor(name));

	return (
		<FocusableExt>
			<div className="pie-by-week" style={{ width: "100%", height: 300 }}>
				<Chart
					type="pie"
					labels={labels}
					datasets={[
						{
							data: values,
							backgroundColor: colors,
							label: "Playtime by Game",
						},
					]}
					options={{
						responsive: true,
						maintainAspectRatio: false,
						plugins: {
							legend: {
								display: true,
								position: "bottom",
								labels: {
									color: "rgba(255,255,255,0.7)",
								},
							},
							tooltip: { enabled: false },
						},
					}}
					style={{ width: "100%" }}
					height={300}
				/>
			</div>
		</FocusableExt>
	);
}

function sumTimeAndGroupByGame(statistics: DailyStatistics[]): TimeByGame[] {
	const timeByGameId = new Map<string, number>();
	const titleByGameId = new Map<string, string>();

	for (const el of statistics.flatMap((it) => it.games)) {
		timeByGameId.set(
			el.game.id,
			(timeByGameId.get(el.game.id) || 0) + el.totalTime,
		);
		titleByGameId.set(el.game.id, el.game.name);
	}

	const timeByGames: TimeByGame[] = [];

	timeByGameId.forEach((v, k) => {
		timeByGames.push({
			gameId: k,
			gameName: titleByGameId.get(k) || "Unknown",
			totalTime: v,
		} as TimeByGame);
	});

	timeByGames.sort((a, b) => b.totalTime - a.totalTime);

	return timeByGames;
}
