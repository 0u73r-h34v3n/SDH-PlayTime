# Changelog

## 3.0.6 - 2025-10-08

### Fixed
- Manually adjust time now work as expected.

## 3.0.5 - 2025-09-21

### Added
- Was written a new [**sleep** middleware](https://github.com/0u73r-h34v3n/SDH-PlayTime/blob/master/src/app/middlewares/sleep.ts) which auto-detects which STEAM functions should be used in case if STEAM decide to remove one of them in the future
- Updated doc file with tutorial of how users can add their custom covers for deleted non-steam games from stats. [Read it](https://github.com/0u73r-h34v3n/SDH-PlayTime/blob/master/docs/covers.md)
- Plugin now has an `About` tab

### Fixed
- Use `Steam.Input.RegisterForControllerInputMessage` instead of deleted `SteamClient.Input.RegisterForControllerStateChanges`. Plugin now should not crash on startup.

## 3.0.4 - 2025-09-18

---
### ✨ Highlights

PlayTime plugin has undergone a major evolution — from performance boosts and smarter game tracking to beautiful UI enhancements and future-proof architecture. Whether you're analyzing playtime, managing game files, or just browsing your library, everything is now smoother, faster, and more intuitive.

Where is still a lot of things which needs to be done. Stay tuned!

This release introduces:
- 💅 **User Interface improvements**
- 🕹️ **Controller Trigger Navigation** (L2/R2 support offers better User Experience)
- 🧠 **MobX Event System Upgrade** (removes some of legacy Steam event dependency)
- ⚡ **Performance Optimizations** across **Front-End** and **Back-End**. Now plugin should work
more faster while collecting statistics from DataBase
- 🧩 **Rewritten Back-End & Front-End** offers more robust FE/BE communication and easier
development process
- 🔍 **File Checksum Management** (Detect same games by their checksum for non-Steam games) **[Work in progress]**
- 👀 **Custom covers for Non-Steam games** [Read guide about how to add custom covers for deleted Non-Steam Games](/docs/covers.md)

> [!CAUTION]
> * Restart your device after updating plugin to latest version

> [!TIP]
> * For a faster communication you can find `PlayTime Support` in [Decky Loader Discord](https://deckbrew.xyz/discord).

---

### Fixed
- Resolved issue caused by removed of some Steam methods which plugin used
- Corrected typo in reminder message when playtime exceeds healthy limits.

## 3.0.3 - 2025-08-03

### Fixed
- Playtime stats now properly update when the Quick Access Panel is opened.

## 3.0.2 - 2025-08-01

### Added
- The app now remembers the **last page location** you visited for easier navigation.
- New **Options Menu** to manage game checksums.
- Ability to **link different games** together using checksums.
- UI improvements for empty states and usability.
- Better integration with your Steam library: tries to resolve unknown game names.

### Changed
- Backend optimizations when managing game checksum data.

### Fixed
- Corrected backend issue when handling file checksums.

## 3.0.1 - 2025-07-29

### Added
- Bulk add & remove checksums for faster operations.
- Progress indicators when generating checksums.
- API check to ensure required Python version is installed.
- Automatic handling of undefined desktop apps.

### Changed
- “Save all checksums” button is now disabled during active processes.

### Fixed
- Correct search results for games with/without checksums.

## 3.0.0 - 2025-07-27

### Added
- A **big rewrite and overhaul** with improved speed and reliability.
- Beautiful **badges showing file checksum status**.
- Full support for **file checksum settings & management**.
- Sorting by **recently launched games**.
- More powerful database queries for advanced playtime insights.
- Improved statistics (weekly, monthly, yearly playtime).
- Additional **error logging and user-friendly feedback** for backend issues.

### Changed
- Unified terminology: `sha256` → `checksum` everywhere.
- Greatly improved layout and structure of the codebase, making future upgrades smoother.

### Fixed
- Non-Steam games are no longer mistakenly listed when checksum setting is off.
- Backend bug fixes for file detection and SQL queries.

## 2.1.5 - 2025-03-26

### Added
- Plugin now supports images directly from its assets for cleaner visuals.
- Highlights in **Game Activity** now prevent unnecessary re-renders for smoother performance.
- New API methods and backend improvements.
- “Sort By” options are shown directly in playtime charts.

## 2.1.4 - 2025-03-20

### Added
- Default key bindings for smoother navigation (Prev / Next).

### Changed
- Removed dependency on the `moment` library (lighter, faster code).

## 2.1.3 2025-03-19

### Added
- Navigation using **L2/R2 triggers**.
- Average playtime insights in time bar view.
- Centralized menu for **sorting titles**.
- Autofocus improvements.

### Fixed
- Game statistics now handle missing data without breaking.
- Settings scale options now show more precise values.

## 2.1.2 - 2025-03-16

### Added
- Total played time is now shown in the game header.

### Fixed
- Sorting options won’t break if time data is missing.
- Backend more robust with conditional date checks.

## 2.1.1 - 2025-03-15

### Added
- **Sort By** option is remembered across sessions.
- New settings option to store user’s preferred sorting method.
- Extra properties for seamless navigation on game activity pages.

### Fixed
- Jumping across years in game activity timeline now works smoothly.

## 2.1.0 - 2025-03-14

### Added
- Complete overhaul of statistics:
- **Yearly**, **Monthly**, **Weekly**, and **Per-Game** playtime tracking.
- **Game covers displayed directly in activity views.**
- **Detailed session history** grouped by months.
- Per-game activity summaries.
- New **sort options** for better insights (first play, last session, total time).
- Enhanced **reports & filters** for clearer statistics.
- Fully integrated navigation routes for the new reports.
- Ability to resize game cover displays.

