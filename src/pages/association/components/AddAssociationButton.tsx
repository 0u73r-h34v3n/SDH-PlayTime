import { ButtonItem } from "@decky/ui";
import { FaPlus } from "react-icons/fa";
import { t } from "@src/i18n";

interface AddAssociationButtonProps {
	onClick: () => void;
}

export function AddAssociationButton({ onClick }: AddAssociationButtonProps) {
	return (
		<ButtonItem
			layout="below"
			onClick={onClick}
			// @ts-expect-error I'm lazy. It will be ok.
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
				<span>{t("association.addTitle")}</span>
			</div>
		</ButtonItem>
	);
}
