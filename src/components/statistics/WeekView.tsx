import { toDate } from "date-fns";
import type { FC } from "react";
import { FocusableExt } from "../FocusableExt";
import { HorizontalContainer } from "../HorizontalContainer";
import { Timebar } from "../Timebar";

interface DayTime {
	dayOfWeek: string;
	time: number;
	date: Date;
}

export const WeekView: FC<{ statistics: DailyStatistics[] }> = (props) => {
	const dayTimes = props.statistics.map((it) => {
		const date = toDate(it.date);
		return {
			dayOfWeek: date.toLocaleString(undefined, { weekday: "long" }),
			time: it.total,
			date: date,
		} as DayTime;
	});
	const overall = dayTimes.map((it) => it.time).reduce((a, c) => a + c, 0);

	return (
		<FocusableExt>
			<div className="playtime-chart">
				<div className="playtime-chart">
					{dayTimes.map((dayTime, index) => (
						<HorizontalContainer key={`${dayTime.dayOfWeek}${index}`}>
							<div style={{ width: "10%" }}>{dayTime.dayOfWeek.charAt(0)}</div>
							<div style={{ width: "90%" }}>
								<Timebar time={dayTime.time} allTime={overall} />
							</div>
						</HorizontalContainer>
					))}
				</div>
			</div>
		</FocusableExt>
	);
};
