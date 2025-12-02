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
			return "Uncommon";
		case "rare":
			return "Rare";
		case "epic":
			return "Epic";
		case "legendary":
			return "Legendary";
		default:
			return "Common";
	}
};

const messagesByPercentage: Record<string, string[]> = {
	perfect: [
		"Wait... ALL of them?! Okay I take back everything I said, you're actually goated",
		"100%?! Who ARE you?? Touch grass maybe?? ...jk respect",
		"Absolutely flawless. I'm not crying, you're crying (T_T)",
		"PERFECTION. The prophecy was true. The chosen one exists.",
		"All achievements unlocked... now go outside, the sun misses you xD",
		"Bruh you actually did it. I doubted you. I was wrong. GG.",
		"10/10 no notes. Chef's kiss. Magnificent. I kneel.",
		"You madlad, you actually 100%'d it. I have nothing but respect o7",
	],
	zero: [
		"Bro... ZERO achievements? Were you even trying or just staring at the screen? xD",
		"Not a single one?! Did your controller even work this year? o_O",
		"0 achievements... I'm not mad, just disappointed ._.",
		"Achievement count: 0. Skill issue detected lmao",
		"You had 365 days and got NOTHING?? That's actually impressive in a bad way",
		"Even my pet rock could've unlocked something by accident tbh",
	],
	terrible: [
		"Lmao that's it?? My grandma has more achievements and she plays Solitaire :/",
		"That's... a number I guess. A really small, sad number xD",
		"Bro did you play with your monitor off or something??",
		"I've seen better stats from someone who just installed the game yesterday",
		"Are you speedrunning failure? Because you're winning at that :P",
		"Plot twist: the real achievement was the friends we-- nah who am I kidding, git gud",
	],
	bad: [
		"Bruh, you call yourself a gamer? This is embarrassing tbh...",
		"My disappointment is immeasurable and my day is ruined -_-",
		"You're not even halfway there... yikes",
		"I'm trying to find something positive to say... still looking...",
		"At this rate you'll unlock everything by 2087 lol",
		"Casual detected, opinion rejected ;)",
	],
	meh: [
		"Meh, could be worse I guess... but also could be A LOT better lol",
		"Perfectly mediocre. The human equivalent of room temperature water",
		"Not great, not terrible. Just... there. Existing. Barely.",
		"You're like a participation trophy come to life xD",
		"Congratulations on being aggressively average I guess?",
		"The council has reviewed your achievements and said 'meh'",
	],
	okay: [
		"Okay okay, not terrible... but I've seen better. Git gud maybe? ;)",
		"You're getting there! Slowly. Very slowly. Like a sleepy snail.",
		"Not bad! I mean, not GOOD either, but not bad ¯\\_(ツ)_/¯",
		"Respect for trying but also... try harder next time lol",
		"You've unlocked: being almost decent. Keep it up!",
		"This is acceptable. Barely. Don't let it get to your head :P",
	],
	almost: [
		"Soooo close! What happened, got tired? Need a snack break? :P",
		"You can almost taste perfection but nope, not quite xD",
		"SO close yet so far... the story of your gaming life apparently",
		"Just a few more! Unless you choke. No pressure tho (◕‿◕)",
		"The finish line is RIGHT THERE and you stopped for a nap??",
		"Almost had it all... 'almost' being the key word here lol",
	],
	one_left: [
		"ONE achievement left and you couldn't get it?! That's rough buddy ಠ_ಠ",
		"Just ONE more... ONE... and you gave up?? Bruh.",
		"99% there and you said 'nah I'm good'?? SERIOUSLY?!",
		"So close to perfection, yet here we are. Tragic really.",
		"One. Single. Achievement. I believe in you... kinda.",
		"You're literally ONE away from greatness but chose mediocrity smh",
	],
};

const getRandomMessage = (pool: string[]): string => {
	const index = Math.floor(Math.random() * pool.length);
	return pool[index];
};

const getLockedMessage = (lockedCount: number, totalCount: number): string => {
	const unlockedCount = totalCount - lockedCount;
	const percentage = (unlockedCount / totalCount) * 100;

	if (lockedCount === 0) {
		return getRandomMessage(messagesByPercentage.perfect);
	}

	if (percentage === 0) {
		return getRandomMessage(messagesByPercentage.zero);
	}

	if (percentage < 20) {
		return getRandomMessage(messagesByPercentage.terrible);
	}

	if (percentage < 40) {
		return getRandomMessage(messagesByPercentage.bad);
	}

	if (percentage < 60) {
		return getRandomMessage(messagesByPercentage.meh);
	}

	if (percentage < 80) {
		return getRandomMessage(messagesByPercentage.okay);
	}

	if (lockedCount === 1) {
		return getRandomMessage(messagesByPercentage.one_left);
	}

	return getRandomMessage(messagesByPercentage.almost);
};

export function Achievements({ achievements }: AchievementsProps) {
	const unlocked = achievements.filter((a) => a.unlocked);
	const locked = achievements.filter((a) => !a.unlocked);

	const lockedMessage = useMemo(
		() => getLockedMessage(locked.length, achievements.length),
		[locked.length, achievements.length],
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
				Your Achievements
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
