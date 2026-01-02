import { PanelSectionRow } from "@decky/ui";

interface EmptyStateProps {
	title: string;
	description: string;
}

export const EmptyState = ({ title, description }: EmptyStateProps) => {
	return (
		<PanelSectionRow>
			<div
				style={{
					padding: "32px 0",
					color: "#8b929a",
					textAlign: "center",
					background: "rgba(255, 255, 255, 0.03)",
					borderRadius: "4px",
					border: "1px dashed rgba(255, 255, 255, 0.1)",
					marginTop: "16px",
				}}
			>
				<div style={{ fontSize: "14px", marginBottom: "8px" }}>{title}</div>
				<div style={{ fontSize: "12px", opacity: 0.7 }}>{description}</div>
			</div>
		</PanelSectionRow>
	);
};
