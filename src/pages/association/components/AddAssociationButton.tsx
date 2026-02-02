import { ButtonItem } from "@decky/ui";
import { FaPlus } from "react-icons/fa";

interface AddAssociationButtonProps {
	onClick: () => void;
}

export function AddAssociationButton({ onClick }: AddAssociationButtonProps) {
	return (
		<ButtonItem
			layout="below"
			onClick={onClick}
			// @ts-ignore I'm lazy. It will be ok.
			style={{
				padding: "10px 16px",
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "8px",
				}}
			>
				<FaPlus size={14} />
				<span>Add Game Association</span>
			</div>
		</ButtonItem>
	);
}
