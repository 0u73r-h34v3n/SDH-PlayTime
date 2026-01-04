import type { TrackingStatus } from "@src/types/tracking";
import { getStatusColor, getStatusIcon, getStatusLabel } from "../utils";

interface StatusBadgeProps {
	status: TrackingStatus;
	size?: "small" | "medium" | "large";
}

const sizeStyles = {
	small: {
		padding: "4px 8px",
		fontSize: "11px",
		iconSize: 14,
	},
	medium: {
		padding: "6px 12px",
		fontSize: "12px",
		iconSize: 16,
	},
	large: {
		padding: "8px 16px",
		fontSize: "14px",
		iconSize: 18,
	},
};

export const StatusBadge = ({ status, size = "medium" }: StatusBadgeProps) => {
	const color = getStatusColor(status);
	const styles = sizeStyles[size];

	return (
		<div
			style={{
				display: "inline-flex",
				alignItems: "center",
				gap: "6px",
				padding: styles.padding,
				background: `${color}20`,
				border: `1px solid ${color}40`,
				borderRadius: "12px",
				color: color,
				fontSize: styles.fontSize,
				fontWeight: 500,
			}}
		>
			{getStatusIcon(status, styles.iconSize)}
			{getStatusLabel(status)}
		</div>
	);
};
