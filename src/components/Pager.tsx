import { DialogButton, Focusable, findClass, findSP } from "@decky/ui";
import { isNil } from "@src/utils/isNil";
import { useEffect } from "react";
import { focus_panel_no_padding, pager_container } from "../styles";
import { ControllerInputGamepadButton } from "@src/constants";

async function focusOnCurrentActiveTab(): Promise<boolean> {
	return new Promise((resolve) => {
		const selectedTab = findSP().document.querySelector(
			`.${findClass("62645", "Selected")}`,
		);

		if (isNil(selectedTab)) {
			resolve(false);

			return;
		}

		(selectedTab as HTMLElement).focus();

		queueMicrotask(() => {
			resolve(true);
		});
	});
}

export const Pager: React.FC<{
	currentText: string;
	onNext: () => void;
	onPrev: () => void;
	hasNext: boolean;
	hasPrev: boolean;
	prevKey?: "l2";
	nextKey?: "r2";
	isEnabledChangePagesWithTriggers?: boolean;
}> = ({
	currentText,
	prevKey = "l2",
	hasNext,
	hasPrev,
	onNext,
	onPrev,
	nextKey = "r2",
	isEnabledChangePagesWithTriggers = false,
}) => {
	useEffect(() => {
		if (!isEnabledChangePagesWithTriggers) {
			return;
		}

		const unregisterRegisterForInputEvent =
			SteamClient.Input.RegisterForControllerInputMessages(
				async (_controllerIndex, gamepadButton, isPressed) => {
					if (!isPressed) {
						return;
					}

					// NOTE(ynhhoJ): Aproximative value
					const isLeftTriggerPressed =
						ControllerInputGamepadButton.GAMEPAD_BUTTON_LTRIGGER ===
						gamepadButton;

					if (isLeftTriggerPressed && hasPrev) {
						await focusOnCurrentActiveTab();

						onPrev();
					}

					const isRightTriggerPressed =
						ControllerInputGamepadButton.GAMEPAD_BUTTON_RTRIGGER ===
						gamepadButton;

					if (isRightTriggerPressed && hasNext) {
						await focusOnCurrentActiveTab();

						onNext();
					}
				},
			);

		return () => {
			unregisterRegisterForInputEvent?.unregister();
		};
	}, [isEnabledChangePagesWithTriggers, hasNext, hasPrev, onNext, onPrev]);

	return (
		<Focusable
			style={{ ...pager_container, ...focus_panel_no_padding }}
			flow-children="horizontal"
		>
			{prevKey && isEnabledChangePagesWithTriggers && (
				<img
					src={`/steaminputglyphs/sd_${prevKey}.svg`}
					alt={prevKey}
					style={{
						opacity: hasPrev ? 1 : 0.5,
						width: "32px",
						height: "32px",
						position: "absolute",
						left: "2.8vw",
					}}
				/>
			)}

			<DialogButton
				style={{
					minWidth: "0px",
					padding: "10px 10px",
					width: "35px",
					margin: "0 2.8vw",
				}}
				disabled={!hasPrev}
				onClick={onPrev}
			>
				&lt;
			</DialogButton>

			<div className="title">{currentText}</div>

			<DialogButton
				style={{
					minWidth: "0px",
					padding: "10px 10px",
					width: "35px",
					margin: "0 2.8vw",
				}}
				disabled={!hasNext}
				onClick={onNext}
			>
				&gt;
			</DialogButton>

			{nextKey && isEnabledChangePagesWithTriggers && (
				<img
					src={`/steaminputglyphs/sd_${nextKey}.svg`}
					alt={nextKey}
					style={{
						opacity: hasNext ? 1 : 0.5,
						width: "32px",
						height: "32px",
						position: "absolute",
						right: "2.8vw",
					}}
				/>
			)}
		</Focusable>
	);
};
