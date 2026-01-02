import { ButtonItem } from "@decky/ui";
import { MdAdd } from "react-icons/md";

interface AddButtonProps {
	onClick: () => void;
}

export const AddButton = ({ onClick }: AddButtonProps) => {
	return (
		<ButtonItem
			layout="below"
			onClick={onClick}
			// @ts-ignore
			style={{
				background:
					"linear-gradient(90deg, rgba(102, 192, 244, 0.15), rgba(102, 192, 244, 0.05))",
				border: "1px solid rgba(102, 192, 244, 0.3)",
				color: "#66c0f4",
			}}
		>
			<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
				<MdAdd size={20} />
				Add Custom Tracking Status
			</div>
		</ButtonItem>
	);
};
