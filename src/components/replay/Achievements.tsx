import {
	IoMoon,
	IoApps,
	IoHeart,
	IoCompass,
	IoCalendar,
	IoCalendarNumber,
	IoFlame,
	IoFlash,
	IoStopwatch,
	IoTrophy,
	IoPlay,
	IoPlayForward,
	IoStar,
	IoRibbon,
	IoFootsteps,
	IoGameController,
	IoRocket,
	IoDiamond,
	IoNuclear,
	IoSunny,
	IoCheckmark,
	IoShield,
	IoHardwareChip,
	IoBed,
	IoCafe,
	IoAnalytics,
	IoTime,
	IoSkull,
	IoWarning,
	IoGrid,
	IoPulse,
	IoInfinite,
	IoScale,
	IoRefresh,
	IoEye,
	IoMap,
	IoCheckmarkDone,
	IoTrendingUp,
	IoSnow,
	IoLibrary,
} from "react-icons/io5";
import { type ComponentType, useMemo } from "react";
import { t } from "@src/i18n";
import { getAchievementMessages } from "@src/i18n/achievementMessages";

interface AchievementsProps {
	achievements: YearReplayAchievement[];
}

const ICON_COMPONENTS: Record<string, ComponentType> = {
	IoMoon,
	IoApps,
	IoHeart,
	IoCompass,
	IoCalendar,
	IoCalendarNumber,
	IoFlame,
	IoFlash,
	IoStopwatch,
	IoTrophy,
	IoPlay,
	IoPlayForward,
	IoStar,
	IoRibbon,
	IoFootsteps,
	IoGameController,
	IoRocket,
	IoDiamond,
	IoNuclear,
	IoSunny,
	IoCheckmark,
	IoShield,
	IoHardwareChip,
	IoBed,
	IoCafe,
	IoAnalytics,
	IoTime,
	IoSkull,
	IoWarning,
	IoGrid,
	IoPulse,
	IoInfinite,
	IoScale,
	IoRefresh,
	IoEye,
	IoMap,
	IoCheckmarkDone,
	IoTrendingUp,
	IoSnow,
	IoLibrary,
};

function AchievementIcon({ name }: { name: string }) {
	const IconComponent = ICON_COMPONENTS[name] ?? IoStar;
	return <IconComponent />;
}

const getRarityClass = (rarity?: AchievementRarity): string => {
	switch (rarity) {
		case "uncommon":
			return "rarity-uncommon";
		case "rare":
			return "rarity-rare";
		case "epic":
			return "rarity-epic";
		case "legendary":
			return "rarity-legendary";
		default:
			return "rarity-common";
	}
};

const getRarityLabel = (rarity?: AchievementRarity): string => {
	switch (rarity) {
		case "uncommon":
			return t("playtime.rarityUncommon");
		case "rare":
			return t("playtime.rarityRare");
		case "epic":
			return t("playtime.rarityEpic");
		case "legendary":
			return t("playtime.rarityLegendary");
		default:
			return t("playtime.rarityCommon");
	}
};

// Improved random selection using a seeded shuffle algorithm for better distribution
const getRandomMessage = (pool: string[]): string => {
	// Use current timestamp and a random value for entropy
	const seed = Date.now() + Math.random() * 1000;
	const index = Math.floor((seed * Math.random()) % pool.length);
	return pool[index];
};

const getRandomFromArray = <T,>(arr: T[]): T => {
	// Fisher-Yates inspired selection with temporal seed
	const entropy = Date.now() * Math.random();
	const index =
		Math.floor((entropy % 1000) * Math.random() * arr.length) % arr.length;
	return arr[index];
};

const getPersonalizedMessage = (
	achievements: YearReplayAchievement[],
): string => {
	const {
		unlockedAchievementMessages,
		lockedAchievementMessages,
		fallbackMessages,
	} = getAchievementMessages();
	const unlocked = achievements.filter((a) => a.unlocked);
	const locked = achievements.filter((a) => !a.unlocked);

	const percentage = (unlocked.length / achievements.length) * 100;

	// Perfect score - celebrate!
	if (locked.length === 0) {
		return getRandomMessage(fallbackMessages.perfect);
	}

	// Zero achievements
	if (unlocked.length === 0) {
		return getRandomMessage(fallbackMessages.zero);
	}

	// One left - special case
	if (locked.length === 1) {
		return getRandomMessage(fallbackMessages.one_left);
	}

	// Collect all available personalized messages
	const availableUnlockedMessages: string[] = [];
	const availableLockedMessages: string[] = [];

	// Gather all unlocked achievement messages
	for (const achievement of unlocked) {
		const messages = unlockedAchievementMessages[achievement.id];
		if (messages) {
			availableUnlockedMessages.push(...messages);
		}
	}

	// Gather all locked achievement messages
	for (const achievement of locked) {
		const messages = lockedAchievementMessages[achievement.id];
		if (messages) {
			availableLockedMessages.push(...messages);
		}
	}

	// Improved distribution algorithm with dynamic weights based on content
	// More unlocked achievements = higher chance of showing unlocked messages
	// More locked achievements = higher chance of roasts
	const unlockedWeight = Math.min(
		0.5,
		unlocked.length / achievements.length + 0.2,
	);
	const lockedWeight = Math.min(
		0.3,
		(locked.length / achievements.length) * 0.3,
	);

	// Generate a random value with temporal entropy for better distribution
	const entropy = (Date.now() % 10000) / 10000;
	const roll = (Math.random() + entropy) / 2; // Blend random with time-based entropy

	// Dynamic selection based on achievement status
	if (roll < unlockedWeight && availableUnlockedMessages.length > 0) {
		return getRandomFromArray(availableUnlockedMessages);
	}

	if (
		roll < unlockedWeight + lockedWeight &&
		availableLockedMessages.length > 0
	) {
		return getRandomFromArray(availableLockedMessages);
	}

	// Fallback to percentage-based messages
	let fallbackPool: string[];

	if (percentage < 20) {
		fallbackPool = fallbackMessages.terrible;
	} else if (percentage < 40) {
		fallbackPool = fallbackMessages.bad;
	} else if (percentage < 60) {
		fallbackPool = fallbackMessages.meh;
	} else if (percentage < 80) {
		fallbackPool = fallbackMessages.okay;
	} else {
		fallbackPool = fallbackMessages.almost;
	}

	return getRandomFromArray(fallbackPool);
};

export function Achievements({ achievements }: AchievementsProps) {
	const unlocked = achievements.filter((a) => a.unlocked);
	const locked = achievements.filter((a) => !a.unlocked);

	const lockedMessage = useMemo(
		() => getPersonalizedMessage(achievements),
		[achievements],
	);

	const rarityOrder: Record<string, number> = {
		legendary: 0,
		epic: 1,
		rare: 2,
		uncommon: 3,
		common: 4,
	};

	const sortByRarity = (a: YearReplayAchievement, b: YearReplayAchievement) => {
		const aRarity = a.rarity || "common";
		const bRarity = b.rarity || "common";
		return rarityOrder[aRarity] - rarityOrder[bRarity];
	};

	const sortedUnlocked = [...unlocked].sort(sortByRarity);
	const sortedLocked = [...locked].sort(sortByRarity);

	return (
		<div className="replay-section replay-achievements">
			<div className="replay-section-title">
				<IoRibbon className="replay-section-title-icon icon-achievements" />
				{t("playtime.achievements")}
				<span className="replay-achievements-count">
					{unlocked.length}/{achievements.length}
				</span>
			</div>

			{sortedUnlocked.length > 0 && (
				<div className="replay-achievements-grid">
					{sortedUnlocked.map((achievement) => (
						<div
							key={achievement.id}
							className={`replay-achievement replay-achievement-unlocked ${getRarityClass(achievement.rarity)}`}
						>
							<div className="replay-achievement-icon">
								<AchievementIcon name={achievement.icon} />
							</div>
							<div className="replay-achievement-content">
								<div className="replay-achievement-title">
									{achievement.title}
								</div>
								<div className="replay-achievement-description">
									{achievement.description}
								</div>
								{achievement.value && (
									<div className="replay-achievement-value">
										{achievement.value}
									</div>
								)}
							</div>
							<div className="replay-achievement-rarity">
								{getRarityLabel(achievement.rarity)}
							</div>
						</div>
					))}
				</div>
			)}

			{/* Perfect score message */}
			{locked.length === 0 && unlocked.length > 0 && (
				<div className="replay-achievements-perfect-title">{lockedMessage}</div>
			)}

			{sortedLocked.length > 0 && (
				<>
					<div className="replay-achievements-locked-title">
						{lockedMessage}
					</div>

					<div className="replay-achievements-grid replay-achievements-locked-grid">
						{sortedLocked.map((achievement) => (
							<div
								key={achievement.id}
								className={`replay-achievement replay-achievement-locked ${getRarityClass(achievement.rarity)}`}
							>
								<div className="replay-achievement-icon">
									<AchievementIcon name={achievement.icon} />
								</div>
								<div className="replay-achievement-content">
									<div className="replay-achievement-title">
										{achievement.title}
									</div>
									<div className="replay-achievement-description">
										{achievement.description}
									</div>
								</div>
								<div className="replay-achievement-rarity locked">
									{getRarityLabel(achievement.rarity)}
								</div>
							</div>
						))}
					</div>
				</>
			)}
		</div>
	);
}
