import {
	Focusable,
	PanelSection,
	PanelSectionRow,
	showModal,
	ConfirmModal,
} from "@decky/ui";
import { PageWrapper } from "@src/components/PageWrapper";
import { navigateToPage, ASSOCIATION_ADD_ROUTE } from "./navigation";
import { useAssociations } from "./association/hooks/useAssociations";
import { AddAssociationButton } from "./association/components/AddAssociationButton";
import { EmptyState } from "./association/components/EmptyState";
import { ListHeader } from "./association/components/ListHeader";
import { AssociationListItem } from "./association/components/AssociationListItem";
import { t } from "@src/i18n";

export function AssociationListPage() {
	const { associations, loading, removeAssociation } = useAssociations();

	const handleDelete = (childGameId: string, childGameName: string) => {
		showModal(
			<ConfirmModal
				strTitle={t("association.removeTitle")}
				strDescription={t("association.removeDescription", {
					game: childGameName,
				})}
				onOK={async () => {
					await removeAssociation(childGameId);
				}}
			/>,
		);
	};

	if (loading) {
		return (
			<PageWrapper>
				<PanelSection title={t("association.title")}>
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
				<PanelSection title={t("association.title")}>
					<PanelSectionRow>
						<AddAssociationButton
							onClick={() => navigateToPage(ASSOCIATION_ADD_ROUTE)}
						/>
					</PanelSectionRow>

					<PanelSectionRow>
						<div
							style={{
								padding: "8px 0",
								fontSize: "12px",
								color: "#8b929a",
								lineHeight: 1.4,
							}}
						>
							{t("association.listDescription")}
						</div>
					</PanelSectionRow>

					{associations.length === 0 ? (
						<EmptyState
							title={t("association.emptyTitle")}
							description={t("association.emptyDescription")}
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
							{associations.map((assoc) => (
								<AssociationListItem
									key={assoc.childGameId}
									association={assoc}
									onDelete={() =>
										handleDelete(assoc.childGameId, assoc.childGameName)
									}
								/>
							))}
						</div>
					)}
				</PanelSection>
			</Focusable>
		</PageWrapper>
	);
}
