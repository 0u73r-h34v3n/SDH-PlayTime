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

export function AssociationListPage() {
	const { associations, loading, removeAssociation } = useAssociations();

	const handleDelete = (childGameId: string, childGameName: string) => {
		showModal(
			<ConfirmModal
				strTitle="Remove Game Association"
				strDescription={`Are you sure you want to remove the association for "${childGameName}"? The playtime will no longer be combined.`}
				onOK={async () => {
					await removeAssociation(childGameId);
				}}
			/>,
		);
	};

	if (loading) {
		return (
			<PageWrapper>
				<PanelSection title="Game Associations">
					<PanelSectionRow>
						<div style={{ padding: "8px 0", color: "#8b929a" }}>Loading...</div>
					</PanelSectionRow>
				</PanelSection>
			</PageWrapper>
		);
	}

	return (
		<PageWrapper>
			<Focusable style={{ height: "calc(100% - 40px)", overflow: "scroll" }}>
				<PanelSection title="Game Associations">
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
							Associate games to combine their playtime. Child game's playtime
							will be added to the parent game's total in all statistics.
						</div>
					</PanelSectionRow>

					{associations.length === 0 ? (
						<EmptyState
							title="No game associations configured"
							description="Associate games to combine their playtime statistics"
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
