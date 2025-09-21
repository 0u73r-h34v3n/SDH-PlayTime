import { useLocator } from "@src/locator";
import { humanReadableTime } from "@utils/formatters";
import { TimeBarCSS } from "../styles";
import { VerticalContainer } from "./VerticalContainer";

export const Timebar: React.FC<{ time: number; allTime: number }> = (props) => {
	const { currentSettings: settings } = useLocator();

	const barWidth =
		props.allTime !== 0 ? `${(props.time / props.allTime) * 100}%` : "0%";

	return (
		<VerticalContainer>
			<div style={TimeBarCSS.time_bar__outline}>
				<div
					style={{
						...TimeBarCSS.time_bar__fill,
						...{ width: barWidth },
					}}
				/>
			</div>
			<div style={TimeBarCSS.time_bar__time_text}>
				{humanReadableTime(
					settings.displayTime.showTimeInHours,
					props.time,
					true,
					settings.displayTime.showSeconds,
				)}
			</div>
		</VerticalContainer>
	);
};
