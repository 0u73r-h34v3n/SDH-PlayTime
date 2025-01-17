import { DialogButton, Focusable } from "@decky/ui";
import { focus_panel_no_padding, pager_container } from "../styles";

export const Pager: React.FC<{
	currentText: string;
	onNext: () => void;
	onPrev: () => void;
	hasNext: boolean;
	hasPrev: boolean;
	prevKey?: "l2";
	nextKey?: "r2";
}> = ({ currentText, prevKey, hasNext, hasPrev, onNext, onPrev, nextKey }) => {
	return (
		<Focusable
			style={{ ...pager_container, ...focus_panel_no_padding }}
			flow-children="horizontal"
		>
			{prevKey && (
				<img
					src={`/steaminputglyphs/sd_${prevKey}.svg`}
					alt={prevKey}
					style={{ opacity: hasPrev ? 1 : 0.5 }}
				/>
			)}

			<DialogButton
				style={{
					minWidth: "0px",
					padding: "10px 10px",
					width: "35px",
				}}
				disabled={!hasPrev}
				onClick={onPrev}
			>
				&lt;
			</DialogButton>

			<div className="title">{currentText}</div>

			<DialogButton
				style={{
					minWidth: "0px",
					padding: "10px 10px",
					width: "35px",
				}}
				disabled={!hasNext}
				onClick={onNext}
			>
				&gt;
			</DialogButton>

			{nextKey && (
				<img
					src={`/steaminputglyphs/sd_${nextKey}.svg`}
					alt={nextKey}
					style={{ opacity: hasNext ? 1 : 0.5 }}
				/>
			)}
		</Focusable>
	);
};
