import { getLocale } from "./index";
import * as en from "./locales/achievementMessages.en";
import * as fr from "./locales/achievementMessages.fr";

export interface AchievementMessageSet {
	unlockedAchievementMessages: Record<string, string[]>;
	lockedAchievementMessages: Record<string, string[]>;
	fallbackMessages: Record<string, string[]>;
}

const MESSAGE_SETS: Record<string, AchievementMessageSet> = { en, fr };

export function getAchievementMessages(): AchievementMessageSet {
	return MESSAGE_SETS[getLocale()] ?? en;
}
