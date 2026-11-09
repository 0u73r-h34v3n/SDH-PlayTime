import type { TranslationKey } from "./en";

/**
 * French dictionary. Mirrors every key of the English source.
 * Register: vouvoiement.
 */
export const fr: Record<TranslationKey, string> = {
	// Common
	"common.loading": "Chargement…",
	"common.loadingGames": "Chargement des jeux…",
	"common.errorLoadingData": "Erreur lors du chargement des données",
	"common.error": "Erreur",
	"common.yes": "Oui",
	"common.no": "Non",
	"common.saving": "Enregistrement…",
	"common.saveConfiguration": "Enregistrer la configuration",
	"common.game": "Jeu",
	"common.status": "Statut",
	"common.actions": "Actions",
	"common.unknown": "Inconnu",
	"common.total": "Total",
	"common.all": "Tous",
	"common.options": "Options",
	"common.soon": "Bientôt™…",
	"common.showQrCode": "Afficher le QR code",
	"common.supportOnKofi": "Soutenir sur Ko-fi",
	"common.viewChangelog": "Voir le journal des modifications",
	"common.currentSuffix": " (actuel)",
	"common.sort": "Trier",

	// App / notifications
	"app.breakReminderTitle": "PlayTime\u00a0: pensez à faire des pauses",
	"app.breakReminderBody": "Vous jouez déjà depuis {duration}",
	"app.errorTitle": "PlayTime\u00a0: erreur",

	// Quick access menu
	"qam.misc": "Divers",
	"qam.replayAvailable": "Disponible du 10 décembre au 7 janvier",
	"qam.yourYear": "Votre {year} ❄️",
	"qam.detailedReport": "Rapport détaillé",
	"qam.settings": "Paramètres",
	"qam.changelogDescription":
		"Une mise à jour vient d'être installée\u00a0! Ce bouton sera masqué après consultation. Vous pouvez consulter le journal des modifications à tout moment dans Paramètres > À propos",

	// Reports
	"report.allTime": "Tout le temps",
	"report.byMonth": "Par mois",
	"report.byWeek": "Par semaine",
	"report.byDay": "Par jour",
	"report.byGame": "Par jeu",
	"report.sortBy": "Tri\u00a0: {name}",

	// Statistics
	"stats.averageAndOverall": "Moyenne et total",
	"stats.dailyAverage": "Moyenne quotidienne",
	"stats.overall": "Total",
	"stats.playtimeAverage": "Temps de jeu moyen",
	"stats.perMonthAverage": "Moyenne par mois",
	"stats.perDayAverage": "Moyenne par jour",
	"stats.currentPlaySession": "Session de jeu en cours",
	"stats.playtimeByGame": "Temps de jeu par jeu",
	"stats.playTime": "Temps de jeu",
	"stats.migrated": "Migré",
	"stats.dayTooltip": "Jour {day}",
	"stats.days": "Jours",
	"stats.hours": "Heures",
	"stats.averagePlaytime": "Temps de jeu moyen\u00a0: {time}",
	"stats.playedTimes": "Joué {count} fois",
	"stats.lastPlayed": "Dernière partie il y a {ago}",

	// Settings
	"settings.timeDisplay": "Affichage du temps",
	"settings.displayPlayedTimeIn": "Afficher le temps de jeu en",
	"settings.showSeconds": "Afficher les secondes",
	"settings.charts": "Graphiques",
	"settings.chartType": "Type de graphique",
	"settings.barCharts": "Histogrammes",
	"settings.barAndPieCharts": "Histogrammes et camemberts",
	"settings.stackedBarsPerGame": "Barres empilées par jeu",
	"settings.stackedBarsDescription":
		"Affiche le temps de jeu de chaque jeu dans des couleurs différentes au sein d'une même barre. Les couleurs proviennent des images de couverture.",
	"settings.chartColorStyle": "Style de couleur des graphiques",
	"settings.chartColorStyleDescription":
		"Palette de couleurs à utiliser à partir des images de couverture. La palette s'appuie sur la bibliothèque «\u00a0Vibrant-Colors/node-vibrant\u00a0».",
	"settings.pieChartGamesLimit": "Limite de jeux du camembert",
	"settings.showChartLegend": "Afficher la légende du graphique",
	"settings.showChartLegendDescription":
		"Affiche une légende avec le nom et la couleur des jeux sur les graphiques.",
	"settings.pieChartHeightQam":
		"Hauteur du camembert dans le menu d'accès rapide",
	"settings.pieChartHeightDescription": "La hauteur est exprimée en pixels.",
	"settings.weekStartsOn": "La semaine commence le",
	"settings.weekStartsOnDescription":
		"Premier jour de la semaine dans les statistiques hebdomadaires.",
	"settings.detailedReport": "Rapport détaillé",
	"settings.coversSizeScale": "Échelle de taille des couvertures",
	"settings.nonSteamGames": "Jeux non Steam",
	"settings.autoDetectByChecksum":
		"Détecter automatiquement le jeu par somme de contrôle [en cours]",
	"settings.notifications": "Notifications",
	"settings.remindBreaks": "M'avertir de faire des pauses",
	"settings.never": "Jamais",
	"settings.every15min": "Toutes les 15 min",
	"settings.every30min": "Toutes les 30 min",
	"settings.everyHour": "Toutes les heures",
	"settings.every2hours": "Toutes les 2 heures",
	"settings.support": "Soutien",
	"settings.showKofiQam":
		"Afficher le bouton Ko-fi dans le menu d'accès rapide",
	"settings.showKofiQamDescription":
		"Affiche un bouton de soutien dans le panneau principal du plugin. Tout soutien est apprécié et aide à faire vivre le développement\u00a0!",
	"settings.changeOverallPlayTime": "Modifier le temps de jeu total",
	"settings.change": "Modifier",
	"settings.links": "Liens",
	"settings.githubRepo": "Dépôt GitHub",
	"settings.supporters": "Soutiens ❤️",
	"settings.thanks":
		"Merci à toutes les personnes qui ont soutenu PlayTime\u00a0!",
	"settings.enjoyCoffee":
		"Si ce plugin vous plaît, envisagez de m'offrir un café\u00a0! ☕",
	"settings.madeWith": "Avec",
	"settings.madeBy": "par",
	"settings.general": "Général",
	"settings.gameManagement": "Gestion des jeux",
	"settings.gameTrackingStatus": "Statut de suivi des jeux",
	"settings.manageTrackingStatus": "Gérer les statuts de suivi",
	"settings.controlTrackedGames":
		"Contrôlez les jeux qui sont suivis et affichés dans les statistiques.",
	"settings.gameAssociations": "Associations de jeux",
	"settings.manageGameAssociations": "Gérer les associations de jeux",
	"settings.gameAssociationsDescription":
		"Associez des jeux pour combiner leurs statistiques de temps de jeu. Utile pour les jeux qui disposent de plusieurs versions ou plateformes.",
	"settings.timeManipulation": "Manipulation du temps",
	"settings.filesChecksum": "Somme de contrôle des fichiers",
	"settings.annualReplay": "Rétrospective annuelle",
	"settings.viewReplay": "Voir la rétrospective {year}",
	"settings.latest": " (dernière)",
	"settings.noReplayData":
		"Aucune rétrospective disponible pour le moment. Jouez à quelques jeux\u00a0! :-)",
	"settings.about": "À propos",
	"settings.generalIcon": "Icône générale",
	"settings.weekdayMonday": "Lundi",
	"settings.weekdaySunday": "Dimanche",
	"settings.colorStyleVibrant": "Éclatant",
	"settings.colorStyleDarkVibrant": "Éclatant sombre",
	"settings.colorStyleLightVibrant": "Éclatant clair",
	"settings.colorStyleMuted": "Atténué",
	"settings.colorStyleDarkMuted": "Atténué sombre",
	"settings.colorStyleLightMuted": "Atténué clair",
	"settings.legendNone": "Aucune",
	"settings.legendPieOnly": "Camemberts uniquement",
	"settings.legendBarOnly": "Histogrammes uniquement",
	"settings.legendBoth": "Les deux",

	// File checksums
	"checksum.rawInformation": "Informations brutes",
	"checksum.pythonRequired": "Python 3.11 ou supérieur est requis.",
	"checksum.loadingFromDatabase":
		"Chargement des sommes de contrôle depuis la base de données…",
	"checksum.generating": "Génération de la somme de contrôle {current}/{total}",
	"checksum.removeAll": "Supprimer toutes les sommes de contrôle de la base",
	"checksum.saveAll": "Enregistrer toutes les sommes de contrôle dans la base",
	"checksum.name": "Nom",
	"checksum.status": "Statut",
	"checksum.undefined": "La somme de contrôle est indéfinie",
	"checksum.generatingCount":
		"Génération du SHA256 pour {count} jeux non Steam.",
	"checksum.generatedCount":
		"SHA256 généré pour {done}/{total} jeux non Steam.",
	"checksum.errorGenerating":
		"Une erreur est survenue lors de la génération de la somme de contrôle du fichier",
	"checksum.pathNotDetected": "Impossible de détecter le chemin du jeu.",
	"checksum.fileChecksumUndefined":
		"La somme de contrôle du fichier est indéfinie.",
	"checksum.gameNotDetected":
		"Impossible de détecter le jeu pour lequel générer une somme de contrôle.",
	"checksum.savedFor": "Somme de contrôle enregistrée pour {name}",
	"checksum.savedForCount": "Somme de contrôle enregistrée pour {count} jeux",
	"checksum.removedFor": "Somme de contrôle de «\u00a0{name}\u00a0» supprimée",
	"checksum.removedCount": "{count} sommes de contrôle supprimées de la base",
	"checksum.saveInDatabase": "Enregistrer la somme de contrôle dans la base",
	"checksum.remove": "Supprimer la somme de contrôle",
	"checksum.fileNotFound": "Fichier introuvable ou chemin non pris en charge",
	"checksum.unknownChecksum": "Somme de contrôle inconnue",
	"checksum.notSaved": "Non enregistrée",
	"checksum.saved": "Enregistrée",
	"checksum.actions": "Actions",
	"checksum.details": "Détails",
	"checksum.groupTitle": "Somme de contrôle",
	"checksum.alreadyLinked":
		"Impossible de lier une somme de contrôle à un jeu qui en possède déjà une",
	"checksum.addByFile": "Ajouter la somme de contrôle d'un jeu par fichier",
	"checksum.linkToAnother":
		"Lier à un autre jeu disposant d'une somme de contrôle",
	"checksum.addToDb": "Ajouter la somme de contrôle d'un jeu à la base",
	"checksum.removeGameChecksum": "Supprimer la somme de contrôle du jeu",

	// Tracking statuses
	"tracking.title": "Statut de suivi",
	"tracking.addTitle": "Ajouter un statut de suivi",
	"tracking.editTitle": "Modifier le statut de suivi",
	"tracking.availableOptions": "Statuts disponibles",
	"tracking.addCustom": "Ajouter un statut de suivi personnalisé",
	"tracking.emptyTitle": "Aucun statut de suivi personnalisé configuré",
	"tracking.emptyDescription":
		"Tous les jeux utilisent le statut de suivi par défaut",
	"tracking.removeTitle": "Supprimer le statut de suivi personnalisé",
	"tracking.removeDescription":
		"Voulez-vous vraiment supprimer le statut de suivi personnalisé de «\u00a0{game}\u00a0»\u00a0? Le statut par défaut sera rétabli.",
	"tracking.default": "Par défaut",
	"tracking.pause": "Pause",
	"tracking.hidden": "Masqué",
	"tracking.ignore": "Ignoré",
	"tracking.defaultDescription":
		"Affiché dans toutes les statistiques. Les nouvelles sessions sont suivies.",
	"tracking.pauseDescription":
		"Affiché dans toutes les statistiques. Les nouvelles sessions ne sont pas suivies.",
	"tracking.hiddenDescription":
		"Masqué dans toutes les statistiques. Toujours suivi en arrière-plan.",
	"tracking.ignoreDescription":
		"Masqué dans toutes les statistiques. Non suivi.",
	"tracking.saveFailed":
		"Impossible d'enregistrer le statut de suivi. Veuillez réessayer.",
	"tracking.updated": "Statut de suivi défini sur «\u00a0{status}\u00a0»",
	"tracking.updateFailed": "Impossible de mettre à jour le statut de suivi",

	// Game associations
	"association.title": "Associations de jeux",
	"association.menuTitle": "Association de jeux",
	"association.addTitle": "Ajouter une association de jeux",
	"association.emptyTitle": "Aucune association de jeux configurée",
	"association.emptyDescription":
		"Associez des jeux pour combiner leurs statistiques de temps de jeu",
	"association.removeTitle": "Supprimer l'association de jeux",
	"association.removeDescription":
		"Voulez-vous vraiment supprimer l'association de «\u00a0{game}\u00a0»\u00a0? Le temps de jeu ne sera plus combiné.",
	"association.listDescription":
		"Associez des jeux pour combiner leur temps de jeu. Le temps de jeu du jeu enfant sera ajouté au total du jeu parent dans toutes les statistiques.",
	"association.addDescription":
		"Sélectionnez un jeu parent et un jeu enfant à associer. Le temps de jeu du jeu enfant sera combiné à celui du parent dans toutes les statistiques.",
	"association.parentGame": "Jeu parent",
	"association.childGame": "Jeu enfant",
	"association.parentGameLabel": "Jeu parent (reçoit le temps de jeu combiné)",
	"association.childGameLabel": "Jeu enfant (temps de jeu ajouté au parent)",
	"association.parentWithId": "Parent (ID\u00a0: {id})",
	"association.childWithId": "Enfant (ID\u00a0: {id})",
	"association.create": "Créer l'association",
	"association.createFailed":
		"Impossible de créer l'association. Veuillez réessayer.",
	"association.createFailedShort": "Impossible de créer l'association",
	"association.removeFailedFull":
		"Impossible de supprimer l'association. Veuillez réessayer.",
	"association.created": "Jeu associé à «\u00a0{game}\u00a0»",
	"association.removed": "Association supprimée",
	"association.removeFailed": "Impossible de supprimer l'association",
	"association.rules": "Règles des associations\u00a0:",
	"association.ruleMultipleChildren": "Un parent peut avoir plusieurs enfants",
	"association.ruleOneParent": "Un enfant ne peut avoir qu'un seul parent",
	"association.ruleNoGrandChildren":
		"Un enfant ne peut pas avoir ses propres enfants",
	"association.ruleParentNotChild":
		"Un parent ne peut pas devenir l'enfant d'un autre jeu",
	"association.associateToParent": "Associer à un parent…",
	"association.associateGameTo": "Associer «\u00a0{game}\u00a0» à\u00a0:",
	"association.associatedTo": "Associé à\u00a0: {game}",
	"association.parentOf": "Parent de {count} jeu(x)",
	"association.remove": "Supprimer l'association",
	"association.noAvailableGames": "Aucun jeu disponible",

	// Sorting
	"sort.menuTitle": "Trier les titres",
	"sort.byName": "Nom",
	"sort.byRecentlyLaunched": "Lancement récent",
	"sort.byFirstPlaytime": "Premier temps de jeu",
	"sort.byMostPlayedTime": "Temps de jeu le plus élevé",
	"sort.byLeastPlayedTime": "Temps de jeu le plus faible",
	"sort.byMostLaunched": "Le plus lancé",
	"sort.byLeastLaunched": "Le moins lancé",
	"sort.byMostAverageTimePlayed": "Temps moyen le plus élevé",
	"sort.byLeastAverageTimePlayed": "Temps moyen le plus faible",

	// Replay
	"playtime.subtitle": "Votre année en rétrospective",
	"playtime.totalPlaytime": "Temps de jeu total",
	"playtime.avgDaily": "Moy. quotidienne",
	"playtime.avgSession": "Moy. par session",
	"playtime.gamesPlayed": "Jeux joués",
	"playtime.newDiscoveries": "Nouvelles découvertes",
	"playtime.sessions": "Sessions",
	"playtime.daysPlayed": "Jours joués",
	"playtime.bestStreak": "Meilleure série",
	"playtime.peakMonth": "Mois record",
	"playtime.loading": "Chargement de votre rétrospective {year}…",
	"playtime.emptyTitle": "Aucune donnée pour le moment",
	"playtime.emptyText":
		"Commencez à jouer pour découvrir votre rétrospective {year}\u00a0!",
	"playtime.error": "Erreur",
	"playtime.longestStreak": "Plus longue série",
	"playtime.dayInARow": "jour d'affilée",
	"playtime.daysInARow": "jours d'affilée",
	"playtime.from": "Du",
	"playtime.to": "au",
	"playtime.playedGamesDuringStreak":
		"Pendant cette période, vous avez joué à {count} {game} différent(s)",
	"playtime.gameSingular": "jeu",
	"playtime.gamePlural": "jeux",
	"playtime.topGames": "Vos jeux préférés",
	"playtime.sessionsCount": "{count} sessions",
	"playtime.percentOfPlaytime": "{percent}\u00a0% du temps de jeu",
	"playtime.explore": "Explorez les jeux auxquels vous avez joué cette année",
	"playtime.firstPlayedIn": "Première partie en {year}",
	"playtime.closerLook": "Regardons de plus près vos jeux les plus joués…",
	"playtime.ofTotal": "du total",
	"playtime.dayStreak": "Jours d'affilée",
	"playtime.totalTime": "Temps total",
	"playtime.chartTitle": "Votre année de jeu",
	"playtime.chartPlayTime": "Temps de jeu\u00a0: {value}",
	"playtime.chartSessions": "Sessions\u00a0: {count}",
	"playtime.funFacts": "Anecdotes et analyses",
	"playtime.longestSingleSession": "Plus longue session de jeu",
	"playtime.favoriteDay": "Jour de jeu préféré",
	"playtime.avgPerDay": "Moy. {time} par {day}",
	"playtime.weekday": "Semaine",
	"playtime.weekend": "Week-end",
	"playtime.equivalent": "Vos {hours} heures de jeu équivalent à…",
	"playtime.moviesWatched": "Films regardés",
	"playtime.booksRead": "Livres lus",
	"playtime.transatlanticFlights": "Vols transatlantiques",
	"playtime.marathonsRun": "Marathons courus",
	"playtime.atHoursEach": "@ {hours} heures chacun",
	"playtime.achievements": "Vos succès",
	"playtime.rarityCommon": "Commun",
	"playtime.rarityUncommon": "Peu commun",
	"playtime.rarityRare": "Rare",
	"playtime.rarityEpic": "Épique",
	"playtime.rarityLegendary": "Légendaire",

	// Manual time adjustment
	"timeManipulation.migrate": "Migrer",
	"timeManipulation.tracked": "Suivi",
	"timeManipulation.adjustTime": "Ajuster le temps (H:M:S)",

	// Durations
	"duration.daysShort": "j",
	"duration.hoursShort": "h",
	"duration.minutesShort": "min",
	"duration.secondsShort": "s",
	"duration.dayOne": "jour",
	"duration.dayMany": "jours",
	"duration.hourOne": "heure",
	"duration.hourMany": "heures",
	"duration.minuteOne": "minute",
	"duration.minuteMany": "minutes",
	"duration.secondOne": "seconde",
	"duration.secondMany": "secondes",

	// Achievements
	"achievement.firstSteps.title": "Premiers pas",
	"achievement.firstSteps.description": "A joué à au moins un jeu cette année",
	"achievement.casualGamer.title": "Joueur occasionnel",
	"achievement.casualGamer.description": "A joué plus de 25 heures cette année",
	"achievement.centuryClub.title": "Club des cent",
	"achievement.centuryClub.description":
		"A joué plus de 100 heures cette année",
	"achievement.dedicatedFan.title": "Fan dévoué",
	"achievement.dedicatedFan.description":
		"A passé plus de 100 heures sur un seul jeu",
	"achievement.sessionStarter.title": "Débutant des sessions",
	"achievement.sessionStarter.description": "A lancé plus de 25 sessions",
	"achievement.sessionPro.title": "Pro des sessions",
	"achievement.sessionPro.description": "A lancé plus de 100 sessions",
	"achievement.marathonRunner.title": "Marathonien",
	"achievement.marathonRunner.description":
		"A terminé une session de plus de 4 heures",
	"achievement.ultraMarathon.title": "Ultra-marathon",
	"achievement.ultraMarathon.description":
		"A terminé une session de plus de 8 heures",
	"achievement.varietyGamer.title": "Joueur éclectique",
	"achievement.varietyGamer.description": "A joué à 10 jeux différents ou plus",
	"achievement.libraryExplorer.title": "Explorateur de bibliothèque",
	"achievement.libraryExplorer.description":
		"A joué à 25 jeux différents ou plus",
	"achievement.explorer.title": "Explorateur",
	"achievement.explorer.description": "A découvert 5 nouveaux jeux ou plus",
	"achievement.treasureHunter.title": "Chasseur de trésors",
	"achievement.treasureHunter.description":
		"A découvert 15 nouveaux jeux ou plus",
	"achievement.seasonal.title": "Joueur saisonnier",
	"achievement.seasonal.description": "A joué pendant 6 mois ou plus",
	"achievement.yearRound.title": "Joueur toute l'année",
	"achievement.yearRound.description": "A joué pendant les 12 mois",
	"achievement.streakStarter.title": "Série naissante",
	"achievement.streakStarter.description": "A enchaîné 5 jours de jeu ou plus",
	"achievement.streakMaster.title": "Maître des séries",
	"achievement.streakMaster.description": "A enchaîné 14 jours de jeu ou plus",
	"achievement.unstoppable.title": "Inarrêtable",
	"achievement.unstoppable.description": "A enchaîné 30 jours de jeu ou plus",
	"achievement.weekendWarrior.title": "Guerrier du week-end",
	"achievement.weekendWarrior.description":
		"A joué plus de 60\u00a0% de son temps le week-end",
	"achievement.workweekHero.title": "Héros de la semaine",
	"achievement.workweekHero.description":
		"A joué plus de 80\u00a0% de son temps en semaine",
	"achievement.favoriteDay.title": "Joueur du {day}",
	"achievement.favoriteDay.description":
		"Le {day} est votre jour de jeu préféré",
	"achievement.oneAndDone.title": "Une fois et puis s'en va",
	"achievement.oneAndDone.description":
		"A essayé un jeu puis est passé à autre chose",
	"achievement.loyalPlayer.title": "Joueur fidèle",
	"achievement.loyalPlayer.description":
		"A joué au même jeu pendant 30 jours consécutifs ou plus",
	"achievement.deckMaster.title": "Maître du Deck",
	"achievement.deckMaster.description":
		"A utilisé PlayTime pour suivre son parcours de joueur",
	"achievement.nightOwl.title": "Oiseau de nuit",
	"achievement.nightOwl.description":
		"Votre jour de jeu préféré tombe le week-end",
	"achievement.earlyBird.title": "Lève-tôt",
	"achievement.earlyBird.description":
		"Votre jour de jeu préféré tombe en semaine",
	"achievement.timeLord.title": "Seigneur du temps",
	"achievement.timeLord.description": "A joué plus de 500 heures cette année",
	"achievement.obsessed.title": "Obsédé",
	"achievement.obsessed.description":
		"A passé plus de 200 heures sur un seul jeu",
	"achievement.noLife.title": "Sans vie",
	"achievement.noLife.description":
		"A terminé une session de plus de 12 heures",
	"achievement.collector.title": "Collectionneur",
	"achievement.collector.description": "A joué à 50 jeux différents ou plus",
	"achievement.ironWill.title": "Volonté de fer",
	"achievement.ironWill.description": "A enchaîné 60 jours de jeu ou plus",
	"achievement.sessionManiac.title": "Maniaque des sessions",
	"achievement.sessionManiac.description": "A lancé plus de 500 sessions",
	"achievement.balanced.title": "Parfaitement équilibré",
	"achievement.balanced.description":
		"Temps de jeu presque égal en semaine et le week-end (45-55\u00a0%)",
	"achievement.comebackKid.title": "Revenant",
	"achievement.comebackKid.description":
		"Est revenu à un jeu après 6 mois ou plus",
	"achievement.focused.title": "Concentration laser",
	"achievement.focused.description":
		"A passé plus de 80\u00a0% de son temps sur ses 3 jeux préférés",
	"achievement.adventurer.title": "Aventurier",
	"achievement.adventurer.description":
		"Aucun jeu ne dépasse 25\u00a0% du temps de jeu",
	"achievement.dailyDriver.title": "Quotidien",
	"achievement.dailyDriver.description":
		"A joué chaque jour pendant un mois entier",
	"achievement.peakPerformer.title": "Au sommet",
	"achievement.peakPerformer.description":
		"A joué plus de 50 heures en un seul mois",
	"achievement.hibernator.title": "Hibernateur",
	"achievement.hibernator.description":
		"A pris un mois de pause puis est revenu en force",
	"achievement.dataCollector.title": "Collectionneur de données",
	"achievement.dataCollector.description": "A généré sa rétrospective annuelle",
	"achievement.valueDays": "{count} jours",
	"achievement.valueGames": "{count} jeu(x)",
	"achievement.valueMonthsOff": "{count} mois de pause",
	"achievement.valuePercentWeekend": "{percent}\u00a0% le week-end",
	"achievement.valuePercentMax": "{percent}\u00a0% max",
};
