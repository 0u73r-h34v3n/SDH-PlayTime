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

// Messages based on specific achievements the user has unlocked
const unlockedAchievementMessages: Record<string, string[]> = {
	// Legendary achievements - big flex
	"time-lord": [
		"500+ hours?! Bro you basically LIVED in games this year. Absolute legend status *crown*",
		'"Time Lord" unlocked! Your Steam Deck should be on your emergency contacts at this point xD',
		"Half a thousand hours... the dedication is immaculate. Grass is just a myth to you lol",
		"500 hours logged. At this point the Deck owes YOU money fr fr",
		'"Time Lord" energy! You didn\'t play games, games played a role in your LIFE',
		'Bow down to the "Time Lord"! 500+ hours is basically a full-time job but BETTER lol',
	],
	obsessed: [
		"200+ hours on ONE game?! That game owes you dinner at this point fr fr",
		'"Obsessed" achievement unlocked! You didn\'t play that game, you BECAME it',
		"One game, 200+ hours. The monogamy is strong with this one lmao",
		"200 hours on one game... that's not a hobby, that's a lifestyle choice xD",
		'"Obsessed" unlocked! You and that game need to get a room at this point lol',
		"That's not gaming, that's a committed relationship. \"Obsessed\" fits perfectly xD",
	],
	"no-life": [
		"12+ hour session?! Your gaming chair has a permanent imprint of you now xD",
		'"No Life" unlocked... but honestly? That\'s a life well lived. Built different',
		"12 hours straight! Sleep is for the weak and you proved it lol",
		'"No Life" gang! Your bladder is built different and we respect that',
		"12 hours in one sitting?! That's not a session, that's a SAGA xD",
		'The "No Life" badge of honor! Time zones are just suggestions anyway lmao',
	],
	collector: [
		"50+ games played?! Your backlog fears you. The Steam library trembles",
		"\"Collector\" unlocked! You're not playing games, you're speedrunning your entire library",
		"50 games conquered! The backlog didn't stand a chance lmao",
		"\"Collector\" status achieved! You don't just own games, you actually PLAY 'em xD",
	],
	"iron-will": [
		"60+ day streak?! That's not dedication, that's a lifestyle. Respect o7",
		'"Iron Will" unlocked! At this point gaming is your cardio routine lmao',
		"60 days straight! That's like... 2 months of pure dedication. Goated fr fr",
		'"Iron Will" energy! Real life tried to stop you and FAILED xD',
		'Two months without breaking the chain! "Iron Will" is an understatement tbh',
	],
	"session-maniac": [
		'"Session Maniac"! Your Steam Deck startup sound is basically your theme song now',
		"500 sessions! That power button knows your fingerprint by heart lmao",
		'"Session Maniac" unlocked! You\'ve mastered the art of "just one more game" lol',
		'500 launches later... the "Session Maniac" title was inevitable fr fr',
	],

	// Epic achievements
	"ultra-marathon": [
		"8+ hour session! Your bladder and you had an understanding that day lol",
		'"Ultra Marathon" unlocked! The snacks were definitely within arm\'s reach',
		"8 hours straight! That's a full workday... of GAMING. Respect the grind xD",
		'"Ultra Marathon" gang! You entered a flow state and didn\'t come back lmao',
		'8 hours of pure gaming! "Ultra Marathon" runners have nothing on you xD',
	],
	"loyal-player": [
		"30+ days on one game?! That game is basically your comfort character now",
		'"Loyal Player" unlocked! You and that game are in a committed relationship tbh',
		"30 days loyalty! That game put a ring on it and you said YES",
		'"Loyal Player" vibes! Other games are jealous of your dedication fr fr',
		'A whole month with one game! "Loyal Player" is the understatement of the year lol',
	],
	unstoppable: [
		"30+ day streak! You gaming every day for a month is lowkey inspirational ngl",
		'"Unstoppable"! Even your calendar said "gaming" for 30 days straight lmao',
		'30-day streak! Real life threw obstacles and you said "nah" xD',
		'"Unstoppable" energy! The grind doesn\'t stop, it only takes naps',
		'They call you "Unstoppable" for a reason - 30 days proves it fr fr',
	],

	// Rare achievements
	"century-club": [
		'100+ hours this year! You put in the work and it shows. "Century Club" gang',
		'Welcome to the "Century Club"! Triple digits hit different xD',
		"100 hours logged! That's like... watching Titanic 30 times. But better lmao",
		'"Century Club" unlocked! You officially have no right to say "I don\'t game much" lol',
		'Triple digit hours! The "Century Club" membership card is in the mail xD',
	],
	"dedicated-fan": [
		"100+ hours on one game! That game better have a good story cause you READ it all lol",
		'"Dedicated Fan" unlocked! You and that game have history now fr',
		"100 hours on one game! At this point you could speedrun it blindfolded xD",
		'"Dedicated Fan" energy! That game\'s wiki has nothing on your knowledge',
		'100 hours on a single game means "Dedicated Fan" is putting it lightly tbh',
	],
	"streak-master": [
		"14+ day streak! Two whole weeks of gaming daily. The commitment is real",
		'"Streak Master"! Your gaming streak lasted longer than most New Year\'s resolutions xD',
		"14-day streak! That's called consistency and we love to see it fr",
		'"Streak Master" unlocked! You built a habit and it\'s a GOOD one lmao',
		'Two weeks without missing a day! "Streak Master" has been earned xD',
	],
	"year-round": [
		"Played every month! 12/12 gaming consistency. Built different fr fr",
		'"Year-Round" Gamer! Not a single month without gaming. That\'s called dedication lol',
		"12/12 months! The calendar tried to stop you and failed miserably xD",
		'"Year-Round" unlocked! Every month is gaming month when you\'re built different',
		'Perfect attendance all year! The "Year-Round" achievement was destiny lmao',
	],
	"library-explorer": [
		"25+ games explored! Your library didn't stand a chance this year",
		'"Library Explorer" unlocked! The backlog is finally getting smaller... maybe xD',
		"25 games conquered! You're like a tourist but for video games lmao",
		'"Library Explorer" energy! No game is safe from your curiosity',
		'25 different games! True "Library Explorer" behavior right there fr',
	],
	"treasure-hunter": [
		"15+ new games discovered! You're out here finding gems like a pro",
		'"Treasure Hunter"! New games fear your discovery powers lol',
		"15 new games! You're basically a game sommelier at this point xD",
		'"Treasure Hunter" unlocked! The undiscovered games are no longer undiscovered',
		'15 new discoveries! The "Treasure Hunter" title suits you perfectly xD',
	],
	"session-pro": [
		"100+ sessions! You don't just play games, you COMMIT to them fr",
		'"Session Pro" unlocked! At this point you\'re basically a professional launcher xD',
		"100 sessions! That's called showing up consistently. Respect o7",
		'"Session Pro" energy! The games see you coming and they\'re READY',
		'Triple digit sessions earned you that "Session Pro" badge fr fr',
	],
	"peak-performer": [
		"50+ hours in one month?! That month was a GRIND and you crushed it",
		'"Peak Performer"! That was your anime training arc month lol',
		"50 hours in a month! That's like a part-time job... but fun xD",
		'"Peak Performer" unlocked! Some months you just hit different fr fr',
		'50 hours in 30 days! "Peak Performer" is the only way to describe it xD',
	],
	"comeback-kid": [
		"Returned to a game after 6+ months! The redemption arc is REAL",
		'"Comeback Kid" unlocked! That game waited for you and you came back. Beautiful tbh',
		"6+ month comeback! That's called unfinished business being FINISHED xD",
		'"Comeback Kid" energy! The game missed you and you missed it back',
		'Half a year later and you came back! "Comeback Kid" fits perfectly lol',
	],
	adventurer: [
		"No single game dominated your playtime! True variety gamer energy",
		'"Adventurer" unlocked! You spread the love equally. Wholesome gaming fr',
		"Variety is the spice of gaming and you're basically Gordon Ramsay xD",
		'"Adventurer" energy! Why play one game when you can play ALL of them lmao',
		'Perfect balance across games! "Adventurer" is your calling card xD',
	],
	balanced: [
		"Perfectly balanced weekday/weekend gaming! Thanos would be proud",
		'"Balanced" gamer! You don\'t discriminate between days. Every day is gaming day lol',
		"Perfect balance achieved! You're the Switzerland of gaming schedules xD",
		'"Balanced" unlocked! Work-life-gaming balance is REAL and you proved it',
		'Weekday/weekend equilibrium achieved! "Balanced" is truly deserved fr',
	],

	// Uncommon achievements
	"marathon-runner": [
		"4+ hour session! When you sit down, you COMMIT to the grind",
		'"Marathon Runner"! Snacks were definitely involved in that session lol',
		"4 hours straight! That's called getting IMMERSED xD",
		'"Marathon Runner" energy! Time flies when you\'re having fun fr fr',
		'Four solid hours! The "Marathon Runner" achievement chose you lmao',
	],
	"variety-gamer": [
		"10+ different games! You've got range and the library to prove it",
		'"Variety Gamer"! Commitment issues? Nah, you call it exploring xD',
		"10 games explored! You're building quite the portfolio there lol",
		'"Variety Gamer" unlocked! Why settle when you can sample?',
		'Ten different games! "Variety Gamer" describes your style perfectly fr',
	],
	explorer: [
		"5+ new games discovered! Always hunting for the next adventure",
		'"Explorer" unlocked! New games bow before your discovery powers lol',
		"5 new games! The frontier is calling and you ANSWERED xD",
		'"Explorer" energy! Curiosity didn\'t kill the cat, it made them a gamer :3',
		'Five fresh games found! The "Explorer" badge is yours xD',
	],
	seasonal: [
		"6+ months of gaming! Consistency is key and you've got the keys",
		'"Seasonal" Gamer! More than half the year spent gaming. That\'s commitment fr',
		"6 months of gaming! The other 6 months are jealous lol",
		'"Seasonal" unlocked! You didn\'t skip gaming season, you ARE gaming season xD',
		'Half the year gaming! "Seasonal" is a modest way to say it lmao',
	],
	"streak-starter": [
		"5+ day streak! Once you start, you don't stop easily. Momentum king/queen",
		'"Streak Starter"! The grind don\'t stop once it gets rolling xD',
		"5-day streak! That's called building momentum and we love it fr",
		'"Streak Starter" energy! The first step to a longer streak is THIS streak',
		'Five days in a row! "Streak Starter" is just the beginning lol',
	],
	"weekend-warrior": [
		"60%+ gaming on weekends! Weekends were MADE for gaming tbh",
		'"Weekend Warrior"! Saturdays and Sundays are sacred gaming time lol',
		'"Weekend Warrior" unlocked! The weekdays are for working, weekends are for GAMING xD',
		"Weekend gaming supremacy! Friday night to Sunday night is YOUR domain",
		'Weekends are yours! The "Weekend Warrior" title fits like a glove xD',
	],
	"workweek-hero": [
		"80%+ gaming on weekdays?! You game while others rest. Built different",
		'"Workweek Hero"! Who needs weekends when every day is game day xD',
		"Weekday gaming champion! You make time when others make excuses lol",
		'"Workweek Hero" unlocked! Monday through Friday is game time fr fr',
		'Monday to Friday grind! "Workweek Hero" is completely accurate lmao',
	],
	focused: [
		"80%+ time on top 3 games! You know what you like and you STICK to it",
		'"Focused"! No distractions, just pure gaming dedication lol',
		"Top 3 domination! You found your favorites and you're LOYAL xD",
		'"Focused" energy! Quality over quantity hits different when you\'re dedicated',
		'Top three games own your time! "Focused" is the perfect word for it fr',
	],
	hibernator: [
		"Took a break but came back strong! The comeback energy is immaculate",
		'"Hibernator" unlocked! Sometimes you gotta rest to game harder later xD',
		"Gaming break taken and gaming break ENDED. The return is real lol",
		'"Hibernator" energy! Even bears wake up eventually :3',
		'Rest and return! The "Hibernator" cycle is complete lmao',
	],

	// Common achievements
	"first-steps": [
		'"First Steps" taken! The journey of a thousand games begins with one',
		"You played games this year! That's already a W in my book lol",
		'"First Steps" unlocked! Every gamer legend started somewhere xD',
		'"First Steps" energy! The Deck is warming up to you already',
		'Everyone starts somewhere! "First Steps" is a badge of honor fr',
	],
	"casual-gamer": [
		"25+ hours! Casual but consistent. Respect the steady grind",
		'"Casual Gamer" unlocked! Quality over quantity is a valid strategy fr',
		"25 hours of gaming! That's 25 hours well spent ngl",
		'"Casual Gamer" energy! Not everyone needs to be a sweat lord xD',
		'25 hours logged! "Casual Gamer" but make it consistent lol',
	],
	"session-starter": [
		"25+ sessions! You show up consistently and that's what matters",
		'"Session Starter"! The games see you coming and they\'re ready lol',
		"25 sessions logged! Consistency is the real achievement fr",
		'"Session Starter" energy! Regular gaming hits different xD',
		'Two dozen plus sessions! "Session Starter" has been verified lmao',
	],
	"one-and-done": [
		"Tried games and moved on! Life's too short for games that don't click",
		'"One and Done"! Sometimes you just gotta know when to yeet xD',
		'"One and Done" unlocked! If it doesn\'t spark joy, NEXT lmao',
		'"One and Done" energy! Speed dating but for video games',
		'Quick samples, quick decisions! "One and Done" master right here fr',
	],
	"night-owl": [
		"Weekend gaming enthusiast! The night (and weekend) belongs to gamers",
		'"Night Owl" vibes! Weekends hit different when you\'re gaming lol',
		'"Night Owl" unlocked! The moon is your gaming buddy xD',
		"Weekend nights are YOUR domain. The Deck glows in the dark fr",
		'When darkness falls, you game! "Night Owl" status confirmed lmao',
	],
	"early-bird": [
		"Weekday gaming warrior! Who says you can only game on weekends?",
		'"Early Bird"! You make time for gaming any day of the week fr',
		'"Early Bird" unlocked! Mornings are for gaming apparently xD',
		"Weekday gamer energy! Every day is a good day to game",
		'Rise and grind... literally! "Early Bird" is your title now lol',
	],
};

// Messages based on specific achievements the user is MISSING
const lockedAchievementMessages: Record<string, string[]> = {
	// Tease about missing legendary achievements
	"time-lord": [
		'500 hours? Maybe next year you\'ll touch that "Time Lord" status xD',
		'The "Time Lord" achievement is waiting... just need a few hundred more hours lol',
		'"Time Lord" locked. Skill issue? Nah, time issue. Git gud at clocks xD',
		'Bro speedran touching grass instead of getting "Time Lord" smh',
		'"Time Lord" remains locked... those 500 hours won\'t grind themselves lmao',
	],
	obsessed: [
		"200+ hours on one game? You got commitment issues or something? jk jk",
		'No "Obsessed" achievement? Guess you haven\'t found "the one" game yet xD',
		'"Obsessed" locked... your love is spread too thin. Pick a main, coward lol',
		"Can't even commit to one game for 200 hours? Gamer card: revoked lol",
		'"Obsessed" still locked! Maybe you\'re just emotionally unavailable to games lmao',
	],
	"no-life": [
		"No 12-hour session? Bro, do you even have a day off? lmao",
		'The "No Life" achievement awaits... one epic gaming day away o.o',
		'"No Life" locked. Ironically, you have too much of a life for this one xD',
		"12 hours too long? Sounds like quitter talk to me ngl",
		'Your bladder said "thank you" but your gamer cred said "bruh" xD',
		'"No Life" is still waiting! Just dedicate 12 hours and it\'s yours fr fr',
	],
	collector: [
		"Under 50 games? Your Steam library is looking pretty chill rn xD",
		'"Collector" achievement locked... the backlog remains powerful lol',
		'"Collector" locked. The games are out there waiting. Go catch \'em all lol',
		"50 games too many? Your wallet is grateful, your Steam library is crying",
		'"Collector" status denied! Need more game diversity in your life lmao',
	],
	"iron-will": [
		"No 60-day streak? Real life diff, I get it ^^;",
		'"Iron Will" locked... your will is more like... aluminum? lmao',
		"60 days straight too hard? Understandable, grass exists I guess xD",
		'"Iron Will" remains elusive! Maybe your will is more like... paper? lol',
	],
	"session-maniac": [
		"Under 500 sessions? Those are rookie launch numbers lol",
		'"Session Maniac" locked. Your power button is underutilized fr fr',
		"500 sessions seemed like a lot until you didn't hit it xD",
		'"Session Maniac" denied! That power button needs more love tbh',
	],

	// Tease about missing epic achievements
	"ultra-marathon": [
		"No 8-hour session? Your bladder thanks you but your gamer card is sus xD",
		"\"Ultra Marathon\" locked... you're telling me you've never lost track of time? hmm",
		'8 hours too long? Back in my day we called that "Tuesday" lmao',
		'No "Ultra Marathon"? Do you even binge, bro? lol',
		"Skill issue: can't even sit still for 8 hours smh my head",
		'"Ultra Marathon" still locked! Eight hours is just a warm-up session lmao',
	],
	"loyal-player": [
		"No 30-day loyalty to one game? Variety is spice but loyalty is nice too lol",
		'"Loyal Player" locked... commitment issues with games? Same tbh xD',
		"30 days on one game too hard? The game is literally RIGHT THERE lol",
		'"Loyal Player" locked. You\'re the "it\'s not you, it\'s me" of gamers </3',
		'Can\'t stick with one game for a month? "Loyal Player" remains a dream lmao',
	],
	unstoppable: [
		"No 30-day streak? Life kept getting in the way huh? Relatable ^^;",
		'"Unstoppable" achievement locked... real life said "not today" apparently lol',
		"30 days straight? You stopped. You were, in fact, stoppable xD",
		'"Unstoppable" locked. More like "occasionally paused" energy tbh',
		'"Unstoppable" denied! Turns out you were quite stoppable after all lol',
	],
	"consistent-player": [
		'No "Daily Driver"? Your Deck missed you on some days ;_;',
		'"Daily Driver" locked... some days the games just didn\'t happen lol',
		'"Daily Driver" status not achieved! Consistency is hard, we get it xD',
	],

	// Tease about missing rare achievements
	"century-club": [
		"Under 100 hours? Rookie numbers! Time to pump those up xD",
		'"Century Club" locked... you\'re like 2 good weekends away tbh lol',
		"Can't even hit triple digits? That's a paddlin' lol",
		"100 hours too much? Tell me you're a casual without telling me lmao",
		'"Century Club" locked. Your Deck is literally begging you to play more fr',
		'Triple digits evaded! "Century Club" membership remains exclusive lmao',
	],
	"dedicated-fan": [
		"No 100 hours on any game? Jack of all trades, master of none vibes xD",
		'"Dedicated Fan" locked... you dabble, you don\'t commit. Fair enough lol',
		"100 hours on one game too scary? Commitment-phobe detected xD",
		'"Dedicated Fan" denied! Guess no game captured your heart that much lol',
	],
	"streak-master": [
		"No 14-day streak? Two weeks is all you needed! Maybe next year >:(",
		'"Streak Master" locked... so close yet so far fr',
		"14 days too long? Bro that's just two weekends with extra steps xD",
		'"Streak Master" locked. The streak... streaked away from you lmao',
		'Two weeks of consistency? Too much apparently. "Streak Master" remains locked lol',
	],
	"year-round": [
		"Didn't game every month? Some months just hit different I guess xD",
		'"Year-Round" locked... there\'s always that one month you forgot to game lol',
		"12/12 months too hard? Which month betrayed you? Name and shame lol",
		'"Year-Round" locked. The calendar is disappointed in you ngl',
		'Perfect yearly attendance? Nah. "Year-Round" stays locked for now lmao',
	],
	"library-explorer": [
		"Under 25 games? Your library is looking a little... minimalist xD",
		'"Library Explorer" locked. The backlog won this round lol',
		"25 games too many? Quality over quantity... copium detected lmao",
		'"Library Explorer" denied! The library remains unexplored territory tbh',
	],
	"session-pro": [
		"Under 100 sessions? You gotta pump those numbers up, those are rookie numbers",
		'"Session Pro" locked. Your power button is collecting dust smh',
		'"Session Pro" status not achieved! That power button needs more clicks lol',
	],
	"peak-performer": [
		"No 50-hour month? Some months you just coasted huh lol",
		'"Peak Performer" locked. Every month was a valley, no peaks xD',
		"50 hours in a month too sweaty? Understandable, hydration is important lol",
		'"Peak Performer" remains locked! No peak month this year apparently lmao',
	],
	"treasure-hunter": [
		"Under 15 new games? The undiscovered gems remain... undiscovered lol",
		'"Treasure Hunter" locked. The treasure is still buried out there xD',
		'"Treasure Hunter" denied! The hunt for new games was... brief lmao',
	],
	"comeback-kid": [
		"No 6-month comeback? Once you leave a game, it's GONE huh lmao",
		'"Comeback Kid" locked. You don\'t do reunions, respect the commitment xD',
		"\"Comeback Kid\" stays locked! When you're done, you're DONE apparently lol",
	],

	// Tease about missing uncommon achievements
	"marathon-runner": [
		"No 4-hour session? Bro do you even game or just menu surf? xD",
		'"Marathon Runner" locked. You\'re more of a sprinter apparently lol',
		"4 hours too long? *laughs in 12-hour session achievers* lmao",
		'"Marathon Runner" remains elusive! Four hours is just getting started tbh',
	],
	"variety-gamer": [
		"Under 10 games? Focusing on a few or just haven't found good ones? hmm",
		'"Variety Gamer" locked. Your library is giving "curated minimalist" vibes xD',
		'"Variety Gamer" denied! Ten games was apparently too much variety lmao',
	],
	"streak-starter": [
		"No 5-day streak? Five days bro, FIVE. That's basically nothing lmao",
		'"Streak Starter" locked. Even a 5-day streak was too much commitment? lol',
		"5 days too hard? The games are right there on your Deck smh",
		'"Streak Starter" not achieved! Five days in a row was the final boss lol',
	],
	"weekend-warrior": [
		'Not a "Weekend Warrior"? Weekdays gamer then? Or just... barely gaming? xD',
		'"Weekend Warrior" locked. What are you even doing on Saturdays lol',
		'"Weekend Warrior" stays locked! Weekends were for... not gaming? Sus tbh',
	],
	"workweek-hero": [
		'No "Workweek Hero"? Too busy touching grass during weekdays I see xD',
		'"Workweek Hero" locked. Monday through Friday said "nope" lol',
		'"Workweek Hero" denied! The 9-to-5 won this round apparently lmao',
	],
};

// Fallback messages by percentage (used when no specific achievement message applies)
const fallbackMessages: Record<string, string[]> = {
	zero: [
		'Bro... ZERO achievements? Speedrunning the "touch grass" category I see xD',
		"0 achievements unlocked, but infinite potential. Copium? Maybe. But still!",
		"Achievement list be like: 404 Not Found lmao",
		"Zero achievements? Your Deck is literally crying rn ;_;",
		"Skill issue detected: Can't even unlock achievements by accident smh",
		"The achievements are still in the tutorial area waiting for you lol",
		"Not a single achievement? Your Deck is starting to think it's decorative lmao",
		"Zero unlocked! The achievements are holding a meeting about you rn xD",
	],
	terrible: [
		"That's... a number. We're not gonna talk about HOW small, but it's a number xD",
		"Achievement speedrun but you hit the slow-mo button by accident :P",
		"Few achievements but each one tells a story. A short story. Very short lol",
		"Bro is gatekeeping achievements from themselves smh",
		"The achievements are playing hard to get and you're letting them WIN",
		'This is giving "I touched the game and left" energy ngl lol',
		"A handful of achievements! Quality over quantity... right? Right?? lmao",
		"The achievement percentage is shy. It doesn't like big numbers apparently xD",
	],
	bad: [
		"Look, it's not great, but I've seen worse. That's basically a compliment!",
		"Casual gaming enjoyer detected. No shame in that game... mostly ;)",
		"You're giving \"I play for the story\" energy and that's valid tbh",
		"The achievements are out there living their best life without you xD",
		"Skill tree looking a bit... sparse. Needs more points invested lol",
		"Achievement diff is real but at least you're trying fr",
		"You've unlocked SOME achievements! Baby steps are still steps lol",
		'Not terrible, not great. The definition of "it is what it is" xD',
	],
	meh: [
		"Perfectly mid, as all things should be. Thanos would be proud... kinda",
		'Certified "meh" moment but honestly that\'s a vibe too lol',
		"Not sweating, not slacking. Just existing in the middle lane lol",
		'The "I\'ll do it later" energy is strong with this one',
		"Mid-game boss level: You're the mid-game boss. Congrats? xD",
		"Half full or half empty? Either way, it's HALF something lmao",
		"C+ student energy! Not failing, not excelling, just vibing tbh",
		"You're in the middle of the pack. Comfortable mediocrity unlocked xD",
	],
	okay: [
		"Okay okay, we're cooking now! Little bit burnt but we're cooking! *fire*",
		"Now THIS is more like it. The gamer within is awakening",
		"Your power level is rising and the achievements are getting nervous xD",
		"Okay okay I see you! The grind is starting to show results fr",
		"We're in the training arc now. Main character moment incoming lol",
		'The achievements said "oh no, they\'re actually trying now" lol',
		"Above average! The achievement gods are starting to notice you fr",
		"Look at you go! This is what gaming looks like when you COMMIT xD",
	],
	almost: [
		"Soooo close! You can almost taste that 100%! Don't choke now xD",
		"The finish line is RIGHT THERE! Sprint, gamer, SPRINT!",
		"You're in the endgame now. Thanos snap those last achievements!",
		"Almost there! The remaining achievements are SHAKING rn lol",
		"So close to perfection... don't fumble the bag now fr fr",
		"Final boss energy! The last achievements are the secret boss fight xD",
		"The last few achievements are the only thing between you and glory lmao",
		"You can see the mountaintop! Just a few more steps to greatness fr",
	],
	one_left: [
		"ONE achievement left?! Bro, just ONE?! This is your villain origin story xD",
		"99% complete and that 1% is personally attacking you rn lol",
		"One. Single. Achievement. You're basically already goated tbh",
		"ONE LEFT?! That achievement is living rent free in your head now lol",
		"So close yet so far... that last achievement is trolling you hard lmao",
		"One achievement is holding your 100% hostage. Negotiate or dominate >:)",
		"That last achievement is the only thing standing between you and perfection fr",
		"99 problems and one achievement IS one. Get it! xD",
	],
	perfect: [
		"Wait... ALL of them?! You absolute LEGEND. Certified goated fr fr",
		"100%?! Who ARE you?? The chosen one exists and it's YOU",
		"PERFECTION. No notes. Chef's kiss. The prophecy is fulfilled *crown*",
		"Bruh you actually did it. Every. Single. One. I kneel. GG.",
		"100% gang! You didn't just play the game, you CONQUERED it xD",
		"All achievements unlocked! The completionist gods are PLEASED *trophy*",
		"Flawless victory! The achievements never stood a chance lmao",
		"100%?! Touch grass? Nah, grass should touch YOU at this point lol",
		"Full completion! You're not just a gamer, you're a COMPLETIONIST xD",
		"Every. Single. Achievement. The legends will speak of this day fr fr",
	],
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
