import { t } from "@src/i18n";

export const ListHeader = () => {
	return (
		<div
			style={{
				display: "grid",
				gridTemplateColumns: "2fr 1.2fr 140px",
				gap: "12px",
				padding: "12px",
				backgroundColor: "rgba(0, 0, 0, 0.3)",
				borderRadius: "4px",
				borderBottom: "2px solid rgba(255, 255, 255, 0.1)",
			}}
		>
			<HeaderCell>{t("common.game")}</HeaderCell>
			<HeaderCell center>{t("common.status")}</HeaderCell>
			<HeaderCell center>{t("common.actions")}</HeaderCell>
		</div>
	);
};

const HeaderCell = ({
	children,
	center = false,
}: {
	children: React.ReactNode;
	center?: boolean;
}) => (
	<div
		style={{
			fontWeight: 600,
			fontSize: "14px",
			color: "rgba(255, 255, 255, 0.8)",
			textTransform: "uppercase",
			letterSpacing: "0.5px",
			textAlign: center ? "center" : "left",
		}}
	>
		{children}
	</div>
);
