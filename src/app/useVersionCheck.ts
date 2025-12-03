import { useEffect, useState } from "react";
import { useLocator } from "@src/locator";

/**
 * Hook to manage version checking and changelog visibility
 * Returns whether the changelog button should be shown and a function to mark it as seen
 */
export function useVersionCheck() {
	const { settings } = useLocator();
	const [showChangelogButton, setShowChangelogButton] = useState(false);

	useEffect(() => {
		settings.isVersionNew().then((isNew) => {
			setShowChangelogButton(isNew);
		});
	}, [settings]);

	const markVersionAsSeen = async () => {
		await settings.markVersionAsSeen();
		setShowChangelogButton(false);
	};

	return {
		showChangelogButton,
		markVersionAsSeen,
	};
}
