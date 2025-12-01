import { Focusable } from "@decky/ui";
import { memo, type CSSProperties, type ReactNode, type JSX } from "react";
import { focus_panel_no_padding } from "../styles";

interface FocusableExtProperties {
	autoFocus?: boolean;
	children: JSX.Element | Array<JSX.Element>;
	focusWithinClassName?: string;
	onActivate?: () => void;
	onMenuActionDescription?: ReactNode;
	onMenuButton?: () => void;
	onOKActionDescription?: ReactNode;
	onOKButton?: () => void;
	onOptionsActionDescription?: ReactNode;
	onOptionsButton?: () => void;
	style?: CSSProperties;
}

export const FocusableExt = memo<FocusableExtProperties>(function FocusableExt({
	autoFocus = undefined,
	children,
	focusWithinClassName,
	onActivate = () => {},
	onMenuActionDescription,
	onMenuButton,
	onOKActionDescription,
	onOKButton,
	onOptionsActionDescription,
	onOptionsButton,
	style = {},
}) {
	return (
		<Focusable
			autoFocus={autoFocus}
			focusWithinClassName={focusWithinClassName}
			onActivate={onActivate}
			onMenuActionDescription={onMenuActionDescription}
			onMenuButton={onMenuButton}
			onOKActionDescription={onOKActionDescription}
			onOKButton={onOKButton}
			onOptionsActionDescription={onOptionsActionDescription}
			onOptionsButton={onOptionsButton}
			style={{ ...focus_panel_no_padding, ...style }}
		>
			{children}
		</Focusable>
	);
});
