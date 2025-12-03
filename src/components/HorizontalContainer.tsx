import { HorizontalContainerCSS } from "../styles";
import { memo, type JSX } from "react";

interface HorizontalContainerProperties {
	children: JSX.Element | Array<JSX.Element>;
}

export const HorizontalContainer = memo<HorizontalContainerProperties>(
	function HorizontalContainer({ children }) {
		return (
			<div style={HorizontalContainerCSS.horizontal__container}>{children}</div>
		);
	},
);
