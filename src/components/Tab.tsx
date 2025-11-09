import { Focusable, PanelSection, PanelSectionRow } from "@decky/ui";
import { focus_panel_no_padding } from "../styles";
import type { JSX } from "react";

interface TabProperties {
	children: JSX.Element;
}

export const Tab: React.FC<TabProperties> = ({ children }) => {
	return (
		<PanelSection>
			<PanelSectionRow>
				<Focusable style={{ minHeight: "100%", ...focus_panel_no_padding }}>
					{children}
				</Focusable>
			</PanelSectionRow>
		</PanelSection>
	);
};
