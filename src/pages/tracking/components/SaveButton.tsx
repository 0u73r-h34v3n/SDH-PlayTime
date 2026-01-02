import { ButtonItem } from "@decky/ui";
import { FaSave } from "react-icons/fa";

interface SaveButtonProps {
	disabled: boolean;
	loading: boolean;
	onClick: () => void;
}

export const SaveButton = ({ disabled, loading, onClick }: SaveButtonProps) => {
	return (
		<ButtonItem
			layout="below"
			disabled={disabled}
			onClick={onClick}
			// @ts-ignore
			style={{
				background: disabled
					? undefined
					: "linear-gradient(90deg, rgba(92, 184, 92, 0.8), rgba(76, 175, 80, 0.8))",
				color: "#fff",
				fontWeight: 500,
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "8px",
					justifyContent: "center",
				}}
			>
				{loading ? (
					<div>Saving...</div>
				) : (
					<>
						<FaSave size={16} />
						<div>Save Configuration</div>
					</>
				)}
			</div>
		</ButtonItem>
	);
};
