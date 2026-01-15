import {
	Dropdown,
	Field,
	Focusable,
	PanelSection,
	PanelSectionRow,
	showModal,
	ConfirmModal,
	ButtonItem,
} from "@decky/ui";
import { useState, useMemo } from "react";
import { PageWrapper } from "@src/components/PageWrapper";
import { navigateBack } from "./navigation";
import { useGamesForAssociation } from "./association/hooks/useGamesForAssociation";
import { useCreateAssociation } from "./association/hooks/useCreateAssociation";

export function AssociationAddPage() {
	const [selectedParentId, setSelectedParentId] = useState<string>("");
	const [selectedChildId, setSelectedChildId] = useState<string>("");

	const { games, loading: loadingGames } = useGamesForAssociation();
	const { createAssociation, loading: saving, error } = useCreateAssociation();

	// Filter games that can be parents
	const parentOptions = useMemo(
		() =>
			games
				.filter((g) => g.canBeParent)
				.map((g) => ({
					label: g.nameWithId,
					data: g.id,
				})),
		[games],
	);

	// Filter games that can be children (exclude selected parent)
	const childOptions = useMemo(
		() =>
			games
				.filter((g) => g.canBeChild && g.id !== selectedParentId)
				.map((g) => ({
					label: g.nameWithId,
					data: g.id,
				})),
		[games, selectedParentId],
	);

	const handleSave = async () => {
		if (!selectedParentId || !selectedChildId) return;

		const result = await createAssociation(selectedParentId, selectedChildId);

		if (result.success) {
			navigateBack();
		} else {
			showModal(
				<ConfirmModal
					strTitle="Error"
					strDescription={
						result.error?.message ||
						"Failed to create association. Please try again."
					}
					bOKDisabled
				/>,
			);
		}
	};

	const canSave = selectedParentId && selectedChildId && !saving;

	return (
		<PageWrapper>
			<Focusable style={{ height: "calc(100% - 40px)", overflow: "scroll" }}>
				<PanelSection title="Add Game Association">
					<PanelSectionRow>
						<div
							style={{
								padding: "8px 0",
								fontSize: "12px",
								color: "#8b929a",
								lineHeight: 1.4,
							}}
						>
							Select a parent game and a child game to associate. The child
							game's playtime will be combined with the parent's in all
							statistics.
						</div>
					</PanelSectionRow>

					<PanelSectionRow>
						<Field label="Parent Game (receives combined playtime)">
							{loadingGames ? (
								<div
									style={{
										color: "#8b929a",
										padding: "8px",
										textAlign: "center",
									}}
								>
									Loading games...
								</div>
							) : (
								<Dropdown
									rgOptions={parentOptions}
									selectedOption={selectedParentId}
									onChange={(option) => {
										setSelectedParentId(option.data);
										// Reset child if it equals the new parent
										if (selectedChildId === option.data) {
											setSelectedChildId("");
										}
									}}
								/>
							)}
						</Field>
					</PanelSectionRow>

					<PanelSectionRow>
						<Field label="Child Game (playtime added to parent)">
							{loadingGames ? (
								<div
									style={{
										color: "#8b929a",
										padding: "8px",
										textAlign: "center",
									}}
								>
									Loading games...
								</div>
							) : (
								<Dropdown
									rgOptions={childOptions}
									selectedOption={selectedChildId}
									onChange={(option) => setSelectedChildId(option.data)}
									disabled={!selectedParentId}
								/>
							)}
						</Field>
					</PanelSectionRow>

					{error && (
						<PanelSectionRow>
							<div
								style={{
									padding: "8px 12px",
									background: "rgba(220, 53, 69, 0.1)",
									border: "1px solid rgba(220, 53, 69, 0.3)",
									borderRadius: "4px",
									color: "#dc3545",
									fontSize: "12px",
								}}
							>
								{error}
							</div>
						</PanelSectionRow>
					)}

					<PanelSectionRow>
						<ButtonItem
							layout="below"
							disabled={!canSave}
							onClick={handleSave}
							// @ts-ignore Just ignore it bro, everything is ok
							style={{
								padding: "12px 16px",
							}}
						>
							{saving ? "Saving..." : "Create Association"}
						</ButtonItem>
					</PanelSectionRow>

					<PanelSectionRow>
						<div
							style={{
								padding: "12px",
								background: "rgba(255, 255, 255, 0.03)",
								borderRadius: "4px",
								marginTop: "8px",
							}}
						>
							<div
								style={{
									fontSize: "12px",
									fontWeight: 600,
									color: "#dcdedf",
									marginBottom: "8px",
								}}
							>
								Association Rules:
							</div>
							<ul
								style={{
									fontSize: "11px",
									color: "#8b929a",
									paddingLeft: "16px",
									margin: 0,
									lineHeight: 1.6,
								}}
							>
								<li>One parent can have multiple children</li>
								<li>A child can only have one parent</li>
								<li>A child cannot have its own children</li>
								<li>A parent cannot become a child of another game</li>
							</ul>
						</div>
					</PanelSectionRow>
				</PanelSection>
			</Focusable>
		</PageWrapper>
	);
}
