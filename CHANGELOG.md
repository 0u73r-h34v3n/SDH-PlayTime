<div align="center">

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/ynhhoj)

</div>

# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!--
Recommendation: for ease of reading, use the following order:
- Added
- Changed
- Fixed
-->
## [3.2.4] - 2026-03-09

### Added
- Ko-Fi QR code for easy support: now you can quickly access the plugin's Ko-Fi page by scanning the QR code in the Quick Access Menu or Settings. A simple way to show your appreciation and help fund future updates!
- In **Settings > About** was added nicknames of users who supported me on Ko-Fi!

### Fixed
- Fixed various bugs across the plugin for improved stability and performance.

## [3.2.3] - 2026-03-09

### Changed
- Upgraded internal dependencies to keep everything up to date and secure.

## [3.2.2] - 2026-02-18

### Added
- Game associations: link two games together so their playtime is combined into one entry in statistics. Useful when the same game is installed as both a Steam game and a Non-Steam shortcut, or when a game was re-added under a different name.
  - **Create associations** — pick a "parent" game and a "child" game; the child's playtime merges into the parent in all reports.
  - **Remove associations** — unlink games at any time; their playtime goes back to being counted separately.
  - Association management is available in **Settings > Game Management**.
- Tracking statuses are now visible in reports and the game options menu — see at a glance which games are paused, hidden, or ignored.

### Changed
- "Tracking" section in Settings renamed to **"Game Management"**.

### Fixed
- Time interval calculations for more accurate playtime tracking.
- Date formatting in reports.

## [3.2.1] - 2026-01-02

### Added
- Game Tracking Statuses: control how each game is tracked and displayed in statistics via **Settings > Game Management**.

  | Status | Visible in Stats? | Tracks New Sessions? |
  |---|---|---|
  | **Default** | Yes | Yes |
  | **Pause** | Yes | No — useful for games you're taking a break from |
  | **Hidden** | No — removed from all charts and reports | Yes — still records time in the background |
  | **Ignore** | No | No — completely excluded |

  - Full management UI to browse, search, and change statuses for all your games.

### Fixed
- 64-bit Steam IDs are now correctly detected, preventing data loading problems.

## [3.2.0] - 2025-12-19

### Added
- Multi-user support: PlayTime now keeps separate playtime data for each Steam user on the device. If multiple people share the same Steam Deck, each person's statistics are fully isolated.
  - Each user automatically gets their own database the first time they log in.
  - Existing playtime data is **automatically migrated** to the user profile — no manual steps needed.
  - The legacy database is preserved as a backup and is never modified.

> [!NOTE]
> If you share your Steam Deck with family or friends, everyone now has their own independent playtime history!

## [3.1.4] - 2025-12-20

### Fixed
- Fixed a bug where the plugin **would not start on a brand-new device** (or a freshly reset one) due to a settings initialization issue.

## [3.1.3] - 2025-12-16

### Changed
- Upgraded internal dependencies. No user-facing changes.

## [3.1.2] - 2025-12-10

### Added
- Year Retrospective (Replay) now supports **browsing multiple years**, starting from 2025.
- A **changelog button** now appears in Settings whenever the plugin is updated, so you can easily see what changed.

### Changed
- Achievement messages in the Year Retrospective are now more **personalized and fun**.
- Replay streak calculation is more accurate — only counts unique days you played.
- Settings descriptions for chart options are clearer.
- Minor UI cleanup.

### Fixed
- Replay now shows the correct year based on the actual date.

## [3.1.1] - 2025-12-03

### Added

The `Monthly View` statistics are now more detailed. See how much time you played each day for specific games.
Bar colors are generated based on game covers, with dominant colors calculated by [vibrant.dev](https://vibrant.dev/).

To enable this feature, set `Stacked bars per game` to `Yes` in `Settings > General > Charts`.
 
![20251201173724_1](https://github.com/user-attachments/assets/a9b0a6c9-c1ce-4046-934a-aaf470fda64e)

> [!TIP]
> Press the `STEAM` button and use the `Right Trackpad` as a mouse to interact with charts

<details>
  <summary>You can choose a color palette that suits you best</summary>

![20251201174321_12](https://github.com/user-attachments/assets/0207d057-92fd-4fcf-9680-91d7936ca0f4)

</details>

- 2025 Year Retrospective: end-of-year recap with top games, total playtime, longest streak, and more.
- The Weekly statistics view now shows a **chart legend** so you can easily identify which game corresponds to which bar color.
- **Ko-fi support button** added to the Quick Access Menu and Settings.
- **Pie chart height** in the Quick Access Menu is now adjustable in Settings.

### Changed
- All charts rebuilt using a **faster, lighter charting library** — migrated from [recharts](https://recharts.github.io/) to [chartjs](https://www.chartjs.org/).

  The plugin now has a smaller build size:

<details>
  <summary>master</summary>

<img width="1157" height="1073" alt="image" src="https://github.com/user-attachments/assets/b2ba54f0-e562-46bc-8132-d893ac229b99" />

</details>

<details>
  <summary>current + additional dependencies for new features</summary>

<img width="1157" height="1073" alt="image" src="https://github.com/user-attachments/assets/aed8fea6-f42e-48ab-b268-a68d89d7c814" />

</details>

### Fixed
- **D-Pad navigation** improved in the Games Explorer.
- Fixed an issue where first-time game data from the library was not loaded correctly.
- Fixed replay visual glitch when navigating away and back.

---

Don't forget to check your `2025` retrospective by accessing the button below in the `Quick Access Menu`:
<img width="297" height="124" alt="image" src="https://github.com/user-attachments/assets/ae88479f-4af3-4141-a34b-9d276f296187" />

<img width="1095" height="300" alt="image" src="https://github.com/user-attachments/assets/8f1ba061-e98b-40aa-a475-7de8441bb1b6" />

> [!Important]
> Consider sharing your Year Stats on the Steam Deck subreddit! ^_^

---

<div align="center">

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/ynhhoj)

</div>

## [3.0.9] - 2025-11-24

### Changed
- The **Manually Adjust Time** screen has been redesigned with dedicated **hour, minute, and second inputs**, making it much easier to fine-tune playtime.

<img width="1280" height="800" alt="image" src="https://github.com/user-attachments/assets/bbee2cc4-b497-436d-87f2-e288477872b7" />
<img width="1280" height="800" alt="image" src="https://github.com/user-attachments/assets/15195185-50d4-482c-85d2-d7b17e6c6a4d" />

## [3.0.8] - 2025-11-24

### Added
- Enforced `Foreign Key` constraints for data integrity.

### Changed
- Performance and memory optimizations: 17.5% faster overall execution, 61.2% less memory allocation, 24–35% faster plugin panels, 30–31% faster game history views, 7–9% faster large statistics, 25% faster under memory pressure.

### Fixed
- Fixed a bug where games could be saved with `Null` (or invalid) names.

## [3.0.7] - 2025-11-23

### Added
- Migrated to React 19

## [3.0.6] - 2025-10-08

### Added
- You can now **add a game checksum by selecting a specific file**, giving you more control over game detection.

### Fixed
- **Manually Adjust Time** now works as expected — time corrections are applied correctly and the page navigates back only after a successful save.

## [3.0.5] - 2025-09-21

### Added
- Was written a new [**sleep** middleware](https://github.com/0u73r-h34v3n/SDH-PlayTime/blob/master/src/app/middlewares/sleep.ts) which auto-detects which STEAM functions should be used in case if STEAM decide to remove one of them in the future
- New guide on how to **add custom covers for deleted Non-Steam games** in your stats. [Read it](https://github.com/0u73r-h34v3n/SDH-PlayTime/blob/master/docs/covers.md)
- Plugin now has an **About** tab in Settings

### Fixed
- Use `Steam.Input.RegisterForControllerInputMessage` instead of deleted `SteamClient.Input.RegisterForControllerStateChanges`. Plugin now should not crash on startup.

## [3.0.4] - 2025-09-18

### Added
- UI improvements across layouts and visuals.
- Controller Trigger Navigation — use L2/R2 to quickly navigate between pages.
- File Checksum Management — detect duplicate games by file checksum for Non-Steam games **[Work in progress]**.
- Custom covers for Non-Steam games. [Read the guide](/docs/covers.md).

### Changed
- Performance optimizations — statistics load noticeably faster, especially with large libraries.

### Fixed
- Resolved a crash caused by Steam removing some internal methods the plugin relied on.
- Corrected a typo in the reminder message when playtime exceeds healthy limits.

> [!CAUTION]
> Restart your device after updating the plugin to the latest version.

> [!TIP]
> For faster support, find `PlayTime Support` in [Decky Loader Discord](https://deckbrew.xyz/discord).

## [3.0.3] - 2025-08-03

### Fixed
- Playtime stats now properly update when the Quick Access Panel is opened.

## [3.0.2] - 2025-08-01

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

## [3.0.1] - 2025-07-29

### Added
- Bulk add & remove checksums for faster operations.
- Progress indicators when generating checksums.
- API check to ensure required Python version is installed.
- Automatic handling of undefined desktop apps.

### Changed
- “Save all checksums” button is now disabled during active processes.

### Fixed
- Correct search results for games with/without checksums.

## [3.0.0] - 2025-07-27

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

## [2.1.5] - 2025-03-26

### Added
- Plugin now loads images from its own assets for **cleaner and faster visuals**.
- **Game Activity** page is now smoother — reduced unnecessary screen refreshes.
- **"Sort By" options** are shown directly in playtime charts for easier access.

## [2.1.4] - 2025-03-20

### Added
- Default key bindings for smoother navigation (Prev / Next).

### Changed
- Removed dependency on the `moment` library (lighter, faster code).

## [2.1.3] - 2025-03-19

### Added
- Navigation using **L2/R2 triggers**.
- Average playtime insights in time bar view.
- Centralized menu for **sorting titles**.
- Autofocus improvements.

### Fixed
- Game statistics now handle missing data without breaking.
- Settings scale options now show more precise values.

## [2.1.2] - 2025-03-16

### Added
- Total played time is now shown in the game header.

### Fixed
- Sorting options won’t break if time data is missing.
- Backend more robust with conditional date checks.

## [2.1.1] - 2025-03-15

### Added
- **Sort By** option is remembered across sessions.
- New settings option to store user’s preferred sorting method.
- Extra properties for seamless navigation on game activity pages.

### Fixed
- Jumping across years in game activity timeline now works smoothly.

## [2.1.0] - 2025-03-14

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

