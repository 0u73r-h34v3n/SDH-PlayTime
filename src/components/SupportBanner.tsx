import { ButtonItem, Navigation } from "@decky/ui";
import { SiKofi } from "react-icons/si";

export const KOFI_URL = "https://ko-fi.com/ynhhoj";
export const GITHUB_URL = "https://github.com/0u73r-h34v3n/SDH-PlayTime";

interface SupportBannerProps {
	/** Variant style: 'compact' for small inline, 'full' for larger banner */
	variant?: "compact" | "full";
}

/**
 * A reusable Ko-fi support banner that can be placed anywhere in the plugin.
 * Use 'compact' variant for subtle placement, 'full' for prominent display.
 */
export function SupportBanner({ variant = "compact" }: SupportBannerProps) {
	const handleClick = () => {
		Navigation.NavigateToExternalWeb(KOFI_URL);
	};

	if (variant === "compact") {
		return (
			<ButtonItem
				onClick={handleClick}
				layout="below"
				// @ts-ignore `style` is not officially supported on ButtonItem, but works fine.
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					gap: "6px",
					padding: "6px 12px",
					margin: "8px 0",
					background: "rgba(255, 94, 91, 0.15)",
					border: "1px solid rgba(255, 94, 91, 0.3)",
					borderRadius: "4px",
					color: "#ff9966",
					fontSize: "12px",
					cursor: "pointer",
					width: "100%",
					transition: "background 0.2s ease",
				}}
			>
				<SiKofi size={14} />
				<span>Support on Ko-fi</span>
			</ButtonItem>
		);
	}

	return (
		<ButtonItem
			onClick={handleClick}
			layout="below"
			// @ts-ignore `style` is not officially supported on ButtonItem, but works fine.
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				gap: "8px",
				padding: "12px 16px",
				margin: "12px 0",
				background: "linear-gradient(135deg, #ff5e5b 0%, #ff9966 100%)",
				border: "none",
				borderRadius: "6px",
				color: "#fff",
				fontSize: "14px",
				fontWeight: 500,
				cursor: "pointer",
				width: "100%",
				boxShadow: "0 2px 8px rgba(255, 94, 91, 0.3)",
				transition: "transform 0.2s ease, box-shadow 0.2s ease",
			}}
		>
			<SiKofi size={18} />
			<span>Enjoying PlayTime? Support on Ko-fi! ☕</span>
		</ButtonItem>
	);
}
