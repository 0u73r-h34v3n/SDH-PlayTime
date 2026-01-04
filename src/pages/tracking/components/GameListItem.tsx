import { DialogButton, Focusable } from "@decky/ui";
import { MdDelete, MdEdit } from "react-icons/md";
import type { GameTrackingConfig } from "@src/types/tracking";
import { StatusBadge } from "./StatusBadge";

interface GameListItemProps {
	config: GameTrackingConfig;
	onEdit: () => void;
	onDelete: () => void;
}

export const GameListItem = ({
	config,
	onEdit,
	onDelete,
}: GameListItemProps) => {
	return (
		<div
			style={{
				display: "grid",
				gridTemplateColumns: "2fr 1.2fr 140px",
				gap: "12px",
				padding: "12px",
				borderRadius: "4px",
				backgroundColor: "rgba(255, 255, 255, 0.03)",
				border: "1px solid rgba(255, 255, 255, 0.05)",
				transition: "all 0.2s ease",
				alignItems: "center",
			}}
		>
			<div
				style={{
					fontSize: "14px",
					fontWeight: 500,
					color: "#dcdedf",
					overflow: "hidden",
					textOverflow: "ellipsis",
					whiteSpace: "nowrap",
				}}
			>
				{config.gameName}
			</div>

			<div style={{ display: "flex", justifyContent: "center" }}>
				<StatusBadge status={config.status as any} />
			</div>

			<Focusable
				flow-children="horizontal"
				style={{
					display: "flex",
					gap: "8px",
					justifyContent: "center",
				}}
			>
				<DialogButton
					style={{
						minWidth: "40px",
						height: "40px",
						padding: "8px",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						borderRadius: "4px",
					}}
					onClick={onEdit}
				>
					<MdEdit size={18} />
				</DialogButton>
				<DialogButton
					style={{
						minWidth: "40px",
						height: "40px",
						padding: "8px",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						borderRadius: "4px",
					}}
					onClick={onDelete}
				>
					<MdDelete size={18} />
				</DialogButton>
			</Focusable>
		</div>
	);
};
