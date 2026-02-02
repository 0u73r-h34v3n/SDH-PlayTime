import { Focusable } from "@decky/ui";
import { FaTrash, FaLink } from "react-icons/fa";
import type { GameAssociation } from "@src/types/association";

interface AssociationListItemProps {
	association: GameAssociation;
	onDelete: () => void;
}

export function AssociationListItem({
	association,
	onDelete,
}: AssociationListItemProps) {
	return (
		<Focusable
			style={{
				display: "flex",
				alignItems: "center",
				padding: "12px",
				background: "rgba(255, 255, 255, 0.05)",
				borderRadius: "4px",
				gap: "12px",
			}}
		>
			{/* Parent Game */}
			<div style={{ flex: 1, minWidth: 0 }}>
				<div
					style={{
						fontSize: "13px",
						fontWeight: 500,
						color: "#dcdedf",
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis",
					}}
				>
					{association.parentGameName || "[Unknown]"}
				</div>
				<div
					style={{
						fontSize: "11px",
						color: "#8b929a",
					}}
				>
					Parent (ID: {association.parentGameId})
				</div>
			</div>

			{/* Link Icon */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					color: "#8b929a",
				}}
			>
				<FaLink size={14} />
			</div>

			{/* Child Game */}
			<div style={{ flex: 1, minWidth: 0 }}>
				<div
					style={{
						fontSize: "13px",
						fontWeight: 500,
						color: "#dcdedf",
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis",
					}}
				>
					{association.childGameName || "[Unknown]"}
				</div>
				<div
					style={{
						fontSize: "11px",
						color: "#8b929a",
					}}
				>
					Child (ID: {association.childGameId})
				</div>
			</div>

			{/* Delete Button */}
			<Focusable
				style={{
					padding: "8px",
					cursor: "pointer",
					color: "#dc3545",
					borderRadius: "4px",
				}}
				onClick={onDelete}
				onActivate={onDelete}
			>
				<FaTrash size={14} />
			</Focusable>
		</Focusable>
	);
}
