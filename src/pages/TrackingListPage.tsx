import {
	Focusable,
	PanelSection,
	PanelSectionRow,
	showModal,
	ConfirmModal,
} from "@decky/ui";
import { PageWrapper } from "@src/components/PageWrapper";
import {
	navigateToPage,
	TRACKING_ADD_ROUTE,
	TRACKING_EDIT_ROUTE,
} from "./navigation";
import { useTrackingConfigs } from "./tracking/hooks/useTrackingConfigs";
import { AddButton } from "./tracking/components/AddButton";
import { EmptyState } from "./tracking/components/EmptyState";
import { ListHeader } from "./tracking/components/ListHeader";
import { GameListItem } from "./tracking/components/GameListItem";
import { t } from "@src/i18n";

export function TrackingListPage() {
	const { configs, loading, removeConfig } = useTrackingConfigs();

	const handleDelete = (gameId: string, gameName: string) => {
		showModal(
			<ConfirmModal
				strTitle={t("tracking.removeTitle")}
				strDescription={t("tracking.removeDescription", { game: gameName })}
				onOK={() => removeConfig(gameId)}
			/>,
		);
	};

	if (loading) {
		return (
			<PageWrapper>
				<PanelSection title={t("tracking.title")}>
					<PanelSectionRow>
						<div style={{ padding: "8px 0", color: "#8b929a" }}>
							{t("common.loading")}
						</div>
					</PanelSectionRow>
				</PanelSection>
			</PageWrapper>
		);
	}

	return (
		<PageWrapper>
			<Focusable style={{ height: "calc(100% - 40px)", overflow: "scroll" }}>
				<PanelSection title={t("tracking.title")}>
					<PanelSectionRow>
						<AddButton onClick={() => navigateToPage(TRACKING_ADD_ROUTE)} />
					</PanelSectionRow>

					{configs.length === 0 ? (
						<EmptyState
							title={t("tracking.emptyTitle")}
							description={t("tracking.emptyDescription")}
						/>
					) : (
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								gap: "4px",
								marginTop: "8px",
							}}
						>
							<ListHeader />
							{configs.map((config) => (
								<GameListItem
									key={config.gameId}
									config={config}
									onEdit={() =>
										navigateToPage(
											TRACKING_EDIT_ROUTE.replace(":gameId", config.gameId),
										)
									}
									onDelete={() => handleDelete(config.gameId, config.gameName)}
								/>
							))}
						</div>
					)}
				</PanelSection>
			</Focusable>
		</PageWrapper>
	);
}
