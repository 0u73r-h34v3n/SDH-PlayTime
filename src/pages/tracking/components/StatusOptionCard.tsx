import { Focusable } from "@decky/ui";
import type { TrackingStatusOption } from "../constants";

interface StatusOptionCardProps {
	option: TrackingStatusOption;
	isFirst?: boolean;
	onSelect: () => void;
}

export const StatusOptionCard = ({
	option,
	isFirst = false,
	onSelect,
}: StatusOptionCardProps) => {
	return (
		<Focusable
			style={{
				padding: "10px 12px",
				display: "flex",
				alignItems: "flex-start",
				gap: "10px",
				background: "rgba(255, 255, 255, 0.02)",
				borderRadius: "4px",
				border: `1px solid ${option.color}20`,
				borderLeft: `3px solid ${option.color}`,
				transition: "all 0.2s ease",
				cursor: "pointer",
				marginTop: isFirst ? 0 : "4px",
			}}
			onActivate={onSelect}
		>
			<div style={{ color: option.color, paddingTop: "2px" }}>
				{option.icon}
			</div>
			<div>
				<div
					style={{
						fontSize: "14px",
						fontWeight: 500,
						color: option.color,
						marginBottom: "3px",
					}}
				>
					{option.label}
				</div>
				<div style={{ fontSize: "12px", color: "#8b929a" }}>
					{option.description}
				</div>
			</div>
		</Focusable>
	);
};
