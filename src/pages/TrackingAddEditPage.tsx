import {
	Dropdown,
	Field,
	Focusable,
	PanelSection,
	PanelSectionRow,
	showModal,
	ConfirmModal,
} from "@decky/ui";
import { useState } from "react";
import { PageWrapper } from "@src/components/PageWrapper";
import { navigateBack } from "./navigation";
import { TRACKING_STATUS_OPTIONS } from "./tracking/constants";
import { useGamesList } from "./tracking/hooks/useGamesList";
import { useTrackingStatus } from "./tracking/hooks/useTrackingStatus";
import { SaveButton } from "./tracking/components/SaveButton";
import { StatusOptionCard } from "./tracking/components/StatusOptionCard";

interface TrackingAddEditPageProps {
	gameId?: string;
}

export function TrackingAddEditPage({ gameId }: TrackingAddEditPageProps) {
	const isEditMode = !!gameId;
	const [selectedGameId, setSelectedGameId] = useState<string>(gameId || "");

	const { games, loading: loadingGames } = useGamesList();
	const {
		status,
		setStatus,
		loading: savingStatus,
		saveStatus,
	} = useTrackingStatus(gameId);

	const handleSave = async () => {
		if (!selectedGameId) return;

		const success = await saveStatus(selectedGameId, status);
		if (success) {
			navigateBack();
		} else {
			showModal(
				<ConfirmModal
					strTitle="Error"
					strDescription="Failed to save tracking status. Please try again."
					bOKDisabled
				/>,
			);
		}
	};

	const currentGame = games.find((g) => g.id === selectedGameId);

	return (
		<PageWrapper>
			<Focusable style={{ height: "calc(100% - 40px)", overflow: "scroll" }}>
				<PanelSection
					title={isEditMode ? "Edit Tracking Status" : "Add Tracking Status"}
				>
					{!isEditMode && (
						<PanelSectionRow>
							<Field label="Game">
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
										rgOptions={games.map((g) => ({
											label: g.nameWithId,
											data: g.id,
										}))}
										selectedOption={selectedGameId}
										onChange={(option) => setSelectedGameId(option.data)}
									/>
								)}
							</Field>
						</PanelSectionRow>
					)}

					{isEditMode && currentGame && (
						<PanelSectionRow>
							<Field label="Game">
								<div
									style={{
										padding: "12px",
										color: "#dcdedf",
										fontWeight: 500,
										background: "rgba(255, 255, 255, 0.05)",
										borderRadius: "4px",
										border: "1px solid rgba(255, 255, 255, 0.1)",
									}}
								>
									{currentGame.nameWithId}
								</div>
							</Field>
						</PanelSectionRow>
					)}

					<PanelSectionRow>
						<Field label="Tracking Status">
							<Dropdown
								rgOptions={TRACKING_STATUS_OPTIONS}
								selectedOption={status}
								onChange={(option) => setStatus(option.data)}
							/>
						</Field>
					</PanelSectionRow>

					<PanelSectionRow>
						<SaveButton
							disabled={!selectedGameId || savingStatus}
							loading={savingStatus}
							onClick={handleSave}
						/>
					</PanelSectionRow>
				</PanelSection>

				<PanelSection title="Available Status Options">
					{TRACKING_STATUS_OPTIONS.map((option, index) => (
						<PanelSectionRow key={option.data}>
							<StatusOptionCard
								option={option}
								isFirst={index === 0}
								onSelect={() => setStatus(option.data)}
							/>
						</PanelSectionRow>
					))}
				</PanelSection>
			</Focusable>
		</PageWrapper>
	);
}
