import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULTS, type PlayTimeSettings } from "./app/settings";
import type { Locator, LocatorDependencies } from "./app/system";
import type { JSX } from "react";

const LocatorContext = createContext<Locator | null>(null);

interface LocatorProviderProperties {
	children: JSX.Element;
}

export const LocatorProvider: React.FC<
	LocatorDependencies & LocatorProviderProperties
> = ({ children, ...deps }) => {
	const [isLoaded, setIsLoaded] = useState(false);
	const [currentSettings, setCurrentSettings] =
		useState<PlayTimeSettings>(DEFAULTS);

	useEffect(() => {
		setIsLoaded(false);

		deps.settings.get().then((it) => {
			setCurrentSettings(it);
			setIsLoaded(true);
		});
	}, []);

	const locator: Locator = {
		...deps,
		currentSettings: currentSettings,
		setCurrentSettings,
	};

	if (!isLoaded) {
		return <div />;
	}

	return (
		<LocatorContext.Provider value={locator}>
			{children}
		</LocatorContext.Provider>
	);
};

export const useLocator = () => {
	const locator = useContext(LocatorContext);

	if (!locator) {
		throw new Error("Locator not found");
	}

	return locator;
};
