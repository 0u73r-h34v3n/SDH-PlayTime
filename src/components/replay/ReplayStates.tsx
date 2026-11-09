import { IoGameController } from "react-icons/io5";
import { t } from "@src/i18n";

export function ReplayLoading({ year }: { year: number }) {
	return (
		<div className="replay-loading">
			<div className="replay-loading-spinner" />
			<div className="replay-loading-text">
				{t("playtime.loading", { year })}
			</div>
		</div>
	);
}

export function ReplayEmpty({ year }: { year: number }) {
	return (
		<div className="replay-empty">
			<IoGameController className="replay-empty-icon" />
			<div className="replay-empty-title">{t("playtime.emptyTitle")}</div>
			<div className="replay-empty-text">
				{t("playtime.emptyText", { year })}
			</div>
		</div>
	);
}
