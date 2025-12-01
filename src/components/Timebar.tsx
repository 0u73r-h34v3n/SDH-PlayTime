import { useLocator } from "@src/locator";
import { humanReadableTime } from "@utils/formatters";
import { memo } from "react";
import { TimeBarCSS } from "../styles";
import { VerticalContainer } from "./VerticalContainer";

interface TimebarProps {
	time: number;
	allTime: number;
}

export const Timebar = memo<TimebarProps>(function Timebar({ time, allTime }) {
	const { currentSettings: settings } = useLocator();

	const barWidth = allTime !== 0 ? `${(time / allTime) * 100}%` : "0%";

	return (
		<VerticalContainer>
			<div style={TimeBarCSS.time_bar__outline}>
				<div
					style={{
						...TimeBarCSS.time_bar__fill,
						width: barWidth,
					}}
				/>
			</div>
			<div style={TimeBarCSS.time_bar__time_text}>
				{humanReadableTime(
					settings.displayTime.showTimeInHours,
					time,
					true,
					settings.displayTime.showSeconds,
				)}
			</div>
		</VerticalContainer>
	);
});
