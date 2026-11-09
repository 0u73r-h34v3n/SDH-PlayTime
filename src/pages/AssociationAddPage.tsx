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
import { t } from "@src/i18n";

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
					strTitle={t("common.error")}
					strDescription={
						result.error?.message || t("association.createFailed")
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
				<PanelSection title={t("association.addTitle")}>
					<PanelSectionRow>
						<div
							style={{
								padding: "8px 0",
								fontSize: "12px",
								color: "#8b929a",
								lineHeight: 1.4,
							}}
						>
							{t("association.addDescription")}
						</div>
					</PanelSectionRow>

					<PanelSectionRow>
						<Field label={t("association.parentGameLabel")}>
							{loadingGames ? (
								<div
									style={{
										color: "#8b929a",
										padding: "8px",
										textAlign: "center",
									}}
								>
									{t("common.loadingGames")}
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
						<Field label={t("association.childGameLabel")}>
							{loadingGames ? (
								<div
									style={{
										color: "#8b929a",
										padding: "8px",
										textAlign: "center",
									}}
								>
									{t("common.loadingGames")}
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
							// @ts-expect-error Just ignore it bro, everything is ok
							style={{
								padding: "12px 16px",
							}}
						>
							{saving ? t("common.saving") : t("association.create")}
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
								{t("association.rules")}
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
								<li>{t("association.ruleMultipleChildren")}</li>
								<li>{t("association.ruleOneParent")}</li>
								<li>{t("association.ruleNoGrandChildren")}</li>
								<li>{t("association.ruleParentNotChild")}</li>
							</ul>
						</div>
					</PanelSectionRow>
				</PanelSection>
			</Focusable>
		</PageWrapper>
	);
}
