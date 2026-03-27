import { getGameCoverImageMemo } from "@src/steam/utils/getGameCoverImage";
import { isNil } from "es-toolkit";
import Card from "../styles/card.css";

interface GameCardProperties {
	gameId: string;
	coverScale?: number;
}

function getGameCoverFromPluginDataFolder(gameId: string): string {
	const coversPath = "http://127.0.0.1:1337/plugins/PlayTime/data/assets";

	return `url(${coversPath}/${gameId}.png), url(${coversPath}/${gameId}.jpg), url(/images/defaultappimage.png)`;
}

export function getGameCoverImage(gameId: string) {
	const image = getGameCoverImageMemo(gameId);

	if (isNil(image)) {
		return getGameCoverFromPluginDataFolder(gameId);
	}

	return `url(${image}), url(${image.replace(/\.png$/, ".jpg")}), url(/images/defaultappimage.png)`;
}

export function GameCoverStyle() {
	return <style>{Card}</style>;
}

export function GameCard({ gameId, coverScale = 1 }: GameCardProperties) {
	const url = getGameCoverImage(gameId);

	return (
		<div
			className="cards"
			style={{
				gridTemplateColumns: `repeat(auto-fill, ${60 * coverScale}px)`,
				gridAutoRows: `${90 * coverScale}px`,
			}}
		>
			<div className="card _54PuCatl_tYG836TOs4Mv">
				<div className="main-cover">
					<div className="inline-block cover-background aspect-ratio absolute-full-height unknown-b unknown-a">
						<div
							className="full-width-block opacity-transition"
							style={{
								backgroundImage: url,
								backgroundSize: "cover",
							}}
						/>
					</div>
				</div>

				<div
					className="background-overlay"
					style={{
						backgroundImage: url,
						backgroundSize: "cover",
					}}
				/>
			</div>
		</div>
	);
}
