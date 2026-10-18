export type Language = 'de' | 'en';

export const LANGUAGES: Language[] = ['de', 'en'];

const de = {
  'header.subtitle': 'Lernmaterial-Verteiler',
  'header.language': 'Sprache',
  'common.ok': 'Okay',

  'signup.title': 'Anmeldung zum Lernmaterial-Verteiler',
  'signup.intro': 'Auf dieser Seite kannst du dich mit deiner Uni-Mail für Lernmaterialien der Fachschaft Informatik anmelden. Du erhältst anschließend eine Mail mit einem personalisierten Zugang. Wir speichern keinerlei Informationen von dir! Deine E-Mail-Adresse wird lediglich zur Validierung und für den Versand benötigt.',
  'signup.emailLabel': 'Uni-Mail-Adresse',
  'signup.emailHint': 'Gib bitte deine E-Mail Adresse der Uni an.',
  'signup.errorRequired': 'Die E-Mail-Adresse muss angegeben werden!',
  'signup.errorPattern': 'Bitte verwende deine Uni-E-Mail-Adresse!',
  'signup.errorEmail': 'Bitte gib eine gültige E-Mail-Adresse ein',
  'signup.submit': 'Zugang beantragen',
  'signup.rateLimited': 'Zu viele Anfragen. Bitte versuche es in 15 Minuten erneut.',
  'signup.failed': 'Die Anmeldung hat nicht geklappt. Bitte versuche es später erneut.',

  'thanks.title': 'Vielen Dank!',
  'thanks.text': 'Du erhältst nun eine Mail von uns, in der ein personalisierter Link enthalten ist. Mit diesem Link gelangst du immer auf unseren Lernmaterial-Verteiler und kannst so immer das neueste Lernmaterial bekommen.',
  'thanks.mailbox': 'Zum Uni-Mail-Postfach',

  'browse.intro': 'Hier kannst du dir alle Ordner aussuchen, für die du Lernmaterial bekommen möchtest. Wir schicken dir anschließend entsprechende Links per Mail, die 7 Tage lang gültig sind. Bitte lade dir die Dokumente herunter oder beantrage die Links zu einem späteren Zeitpunkt einfach erneut.',
  'browse.getLinks': 'Links erhalten',
  'browse.selectModule': 'Wähle bitte ein Lernmaterial-Modul aus!',
  'browse.loadFailed': 'Die Module konnten nicht geladen werden. Bitte lade die Seite neu.',
  'browse.linksFailed': 'Die Links konnten nicht verschickt werden. Bitte versuche es später erneut.',
  'browse.search': 'Module durchsuchen',
  'browse.onlyRecent': 'Nur kürzlich aktualisierte',
  'browse.new': 'Neu',
  'browse.updated': 'Aktualisiert am {date}',
  'browse.noResults': 'Keine Module gefunden.',
  'browse.selectedCount': '{count} ausgewählt',
  'browse.clearSelection': 'Auswahl aufheben',

  'success.title': 'Erfolg 🎉',
  'success.text': 'Du erhältst in Kürze eine E-Mail mit den Links. Bitte überprüfe dein Uni-Mail-Postfach!',
};

const en: Record<keyof typeof de, string> = {
  'header.subtitle': 'Study Materials',
  'header.language': 'Language',
  'common.ok': 'Okay',

  'signup.title': 'Sign up for the study material distribution',
  'signup.intro': 'Sign up with your university email address to get study materials from the Computer Science student council. You will then receive an email with your personal access link. We do not store any of your data! Your email address is only used for validation and for sending the email.',
  'signup.emailLabel': 'University email address',
  'signup.emailHint': 'Please enter your university email address.',
  'signup.errorRequired': 'Please enter your email address!',
  'signup.errorPattern': 'Please use your university email address!',
  'signup.errorEmail': 'Please enter a valid email address',
  'signup.submit': 'Request access',
  'signup.rateLimited': 'Too many requests. Please try again in 15 minutes.',
  'signup.failed': 'Sign-up failed. Please try again later.',

  'thanks.title': 'Thank you!',
  'thanks.text': 'You will now receive an email with your personal link. This link always takes you to the study material distribution, so you can always get the latest materials.',
  'thanks.mailbox': 'Go to university webmail',

  'browse.intro': 'Select all folders you would like to get study materials for. We will then email you links that are valid for 7 days. Please download the documents in time, or simply request the links again later.',
  'browse.getLinks': 'Get links',
  'browse.selectModule': 'Please select a module!',
  'browse.loadFailed': 'The modules could not be loaded. Please reload the page.',
  'browse.linksFailed': 'The links could not be sent. Please try again later.',
  'browse.search': 'Search modules',
  'browse.onlyRecent': 'Recently updated only',
  'browse.new': 'New',
  'browse.updated': 'Updated on {date}',
  'browse.noResults': 'No modules found.',
  'browse.selectedCount': '{count} selected',
  'browse.clearSelection': 'Clear selection',

  'success.title': 'Success 🎉',
  'success.text': 'You will shortly receive an email with the links. Please check your university mailbox!',
};

export type TranslationKey = keyof typeof de;

export const TRANSLATIONS: Record<Language, Record<TranslationKey, string>> = { de, en };
