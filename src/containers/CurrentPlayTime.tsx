import { Field, PanelSection, PanelSectionRow } from "@decky/ui";
import type { PlayTime } from "@src/app/SessionPlayTime";
import { humanReadableTime } from "@utils/formatters";
import { useLocator } from "../locator";
import { useEffect, useState } from "react";
import { isNil } from "es-toolkit";

function PlaySessionsInformation({
	currentPlayTime,
}: {
	currentPlayTime: Array<PlayTime>;
}) {
	const { currentSettings: settings } = useLocator();

	if (currentPlayTime.length === 1) {
		const currentSessionTimeAsText = humanReadableTime(
			settings.displayTime.showTimeInHours,
			currentPlayTime[0].playTime,
			true,
			true,
		);

		return <span>{currentSessionTimeAsText}</span>;
	}

	return (
		<div style={{ display: "flex", flexDirection: "column" }}>
			{currentPlayTime.map((game) => (
				<span key={game.gameName}>
					{game.gameName} -{" "}
					{humanReadableTime(
						settings.displayTime.showTimeInHours,
						game.playTime,
						true,
						true,
					)}
				</span>
			))}
		</div>
	);
}

export const CurrentPlayTime = () => {
	const { sessionPlayTime } = useLocator();
	const [currentPlayTime, setTimePlayed] = useState(
		sessionPlayTime.getPlayTime(Date.now()),
	);

	useEffect(() => {
		if (currentPlayTime.length === 0) {
			return;
		}

		const timer = setInterval(() => {
			setTimePlayed(sessionPlayTime.getPlayTime(Date.now()));
		}, 1000);

		return () => {
			if (isNil(timer)) {
				return;
			}

			clearInterval(timer);
		};
	}, []);

	if (currentPlayTime.length === 0) {
		return null;
	}

	return (
		<div>
			<PanelSection>
				<PanelSectionRow>
					<Field label="Current play session">
						<PlaySessionsInformation currentPlayTime={currentPlayTime} />
					</Field>
				</PanelSectionRow>
			</PanelSection>
		</div>
	);
};
