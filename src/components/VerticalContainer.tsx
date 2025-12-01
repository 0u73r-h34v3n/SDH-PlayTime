import { VerticalContainerCSS } from "../styles";
import { memo, type JSX } from "react";

interface VerticalContainerProperties {
	children: JSX.Element | Array<JSX.Element>;
}

export const VerticalContainer = memo<VerticalContainerProperties>(
	function VerticalContainer({ children }) {
		return (
			<div style={VerticalContainerCSS.vertical__container}>{children}</div>
		);
	},
);
