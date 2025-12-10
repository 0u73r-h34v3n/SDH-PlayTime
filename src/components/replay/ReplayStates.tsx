import { IoGameController } from "react-icons/io5";

export function ReplayLoading({ year }: { year: number }) {
	return (
		<div className="replay-loading">
			<div className="replay-loading-spinner" />
			<div className="replay-loading-text">
				Loading your {year} Year in Review...
			</div>
		</div>
	);
}

export function ReplayEmpty({ year }: { year: number }) {
	return (
		<div className="replay-empty">
			<IoGameController className="replay-empty-icon" />
			<div className="replay-empty-title">No Data Yet</div>
			<div className="replay-empty-text">
				Start playing games to see your {year} Year in Review!
			</div>
		</div>
	);
}
