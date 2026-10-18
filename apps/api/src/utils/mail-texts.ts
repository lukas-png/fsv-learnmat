export type Language = 'de' | 'en';

export const LANGUAGES: Language[] = ['de', 'en'];

export const accessMail = (lang: Language, email: string, link: string, expires: Date): { subject: string, text: string } =>
  lang === 'en'
    ? {
        subject: "Your access to the study material distribution",
        text: "Hello " + email + ",\n\nwith the following link you get your personal access to the study material collection "
          + "\nof the Computer Science student council. Please keep this email, as this link is your only way to "
          + "\naccess the collection. If you lose it, you can simply request a new one. "
          + "\n\nYour link: \n\n " + link
          + "\n\nThe link is valid until " + expires.toLocaleDateString("en-GB") + ". After that, you can request a new one on the website."
          + "\n\nBest regards,\nyour Computer Science student council 💻!",
      }
    : {
        subject: "Dein Lernmaterial-Verteiler Zugang",
        text: "Hallo " + email + ", \n\nmit dem folgenden Link erhältst du deinen persönlichen Zugang zur Lernmaterial-Sammlung "
          + "\nder Fachschaft Informatik. Behalte diese E-Mail gut auf, da du nur mit diesem Link Zugang zur "
          + "\nSammlung erhältst. Solltest du den Link trotzdem mal verlieren, kannst du dir ebenfalls einen "
          + "\nneuen zuschicken lassen. "
          + "\n\nDein Link lautet: \n\n " + link
          + "\n\nDer Link ist gültig bis zum " + expires.toLocaleDateString("de-DE") + ". Danach kannst du dir auf der Website einfach einen neuen zuschicken lassen."
          + "\n\nViele Grüße,\ndeine Informatik Fachschaft 💻!",
      };

export const linksMail = (lang: Language, linksFormatted: string, expire: Date): { subject: string, text: string } =>
  lang === 'en'
    ? {
        subject: "Study material links",
        text: "Hello,\nyou can download the study materials using the following links: \n\n" + linksFormatted
          + "\n\nThe links are valid until: " + expire.toLocaleDateString("en-GB") + ", please download the materials before then!"
          + "\nIf you need more materials, you can request them via the study material distribution as well. "
          + "\n\nBest regards,\nyour Computer Science student council 💻!",
      }
    : {
        subject: "Lernunterlagen Links",
        text: "Hallo,\ndu kannst die Lernunterlagen unter den folgenden Links herunterladen: \n\n" + linksFormatted
          + "\n\nDie Links sind gültig bis: " + expire.toLocaleDateString("de-DE") + ", bitte lade die Unterlagen vorher herunter!"
          + "\nSolltest du weitere Unterlagen benötigen, kannst du sie ebenfalls über den Lernmaterial-Verteiler beantragen. "
          + "\n\nViele Grüße,\ndeine Informatik Fachschaft 💻!",
      };
