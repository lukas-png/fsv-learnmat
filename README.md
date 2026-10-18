# FSV Learnmat

Lernmaterial-Verteiler der Fachschaft Informatik an der Universität Hildesheim.

Studierende registrieren sich mit ihrer Uni-Mail, erhalten einen Link per E-Mail und können darüber Altklausuren als temporäre 7-Tage-Links aus der Academic Cloud herunterladen.

---

## Stack

| | |
|---|---|
| Frontend | Angular 20 + Angular Material |
| Backend | Express.js (Node 22) |
| Monorepo | Nx 21 |
| Storage | Academic Cloud via WebDAV |
| Mail | SMTP Uni Hildesheim |
| Deploy | Docker + Watchtower + GitHub Actions, hinter NetBird (TLS) |

---

## Lokale Entwicklung

```bash
# Dependencies installieren
npm install --legacy-peer-deps

# API starten (Port 3000)
nx serve api

# Frontend starten (Port 4200)
npm start

# Lint, Tests und Build für alle Projekte (läuft so auch in CI)
npx nx run-many -t lint test build
```

Die Konfiguration kommt aus Umgebungsvariablen (Zuordnung in `apps/api/src/configs/custom-environment-variables.json`). Lokal kann eine `.env` im Projektroot verwendet werden, sie wird per `dotenv` geladen. Nicht-geheime Standardwerte stehen in `apps/api/src/configs/default.json`, Zugangsdaten gehören **nicht** dort hinein.

### Umgebungsvariablen

| Variable | Beschreibung |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | Port des HTTP-Servers (Standard: `80`) |
| `SECRET_KEY` | JWT-Signing-Secret |
| `UNI_USERNAME` | SMTP-Username der Uni |
| `UNI_PASSWORD` | SMTP-Passwort |
| `UNI_MAIL` | Absender-E-Mail-Adresse |
| `ACC_USERNAME` | AcademicCloud-Username |
| `ACC_PASSWORD` | AcademicCloud App-Passwort |
| `ACC_HOST` | WebDAV-URL (Standard: Academic Cloud) |
| `DOMAIN` | Öffentliche Domain, z.B. `https://learnmat.example.de` |
| `TRUST_PROXY` | `true` hinter einem Reverse Proxy (NetBird), nötig für das Rate-Limit pro IP |

### AcademicCloud Struktur

```
/altklausuren/          ← Module (Ordner direkt hierunter)
├── Algorithmen und Datenstrukturen/
├── Datenbanken/
└── ...
/einreichungen/         ← Hochgeladenes Material (Beta), wird automatisch angelegt
/statistik/             ← Anonyme Nutzungsstatistik, eine CSV pro Monat
```

Nur Ordner direkt unter `/altklausuren` werden als Module angezeigt. Das Änderungsdatum eines Ordners wird als „Aktualisiert am …“ angezeigt; Module, die sich in den letzten 30 Tagen geändert haben, bekommen eine „Neu“-Markierung.

---

## Funktionen

- **Deutsch/Englisch:** Umschalter im Header, Standard nach Browsersprache. Mails werden in der gewählten Sprache verschickt. Texte stehen in `apps/learnmat/src/app/i18n/translations.ts` und `apps/api/src/utils/mail-texts.ts`.
- **Suche und Filter** in der Modulliste, Auswahl bleibt beim Filtern erhalten.
- **Material einreichen (Beta):** Unter `/submit` (verlinkt aus der Modulliste) können Studierende PDF, JPG oder PNG bis 20 MB hochladen. Die Dateien landen anonym in `/einreichungen` als `<Datum>_<Modul>_<Zufall>.<Endung>`, eine optionale Notiz als `.txt` daneben. Die Fachschaft prüft sie und verschiebt freigegebenes Material selbst nach `/altklausuren`. Limit: 10 Uploads pro Stunde und IP.
- **Anonyme Statistik:** `/statistik/JJJJ-MM.csv` mit den Spalten `typ;name;anzahl` (`anmeldung` je Sprache, `modul` je angefragtem Modul, `einreichung` je Modul). Nur Monatssummen, keine personenbezogenen Daten. Wird alle 10 Minuten und beim Stoppen des Containers geschrieben.
- **Impressum und Datenschutz:** Impressum verlinkt auf den AStA, die Datenschutzerklärung liegt unter `/datenschutz`.

---

## Auth-Flow

```
Signup (Uni-Mail) → JWT per Mail → Link öffnen → Module auswählen → 7-Tage-Links per Mail
```

Passwortlos — Authentifizierung ausschließlich über JWT-Links.

- `POST /api/signup` ist auf 5 Anfragen pro 15 Minuten und IP begrenzt, weil jede Anfrage eine Mail über das Fachschaftskonto verschickt.
- Tokens werden in den Access-Logs als `token=***` maskiert.
- `GET /api/` antwortet ohne externe Aufrufe mit `200` und eignet sich als Health-Check.

---

## GitHub Secrets

Für den CI/CD-Workflow werden folgende Secrets benötigt:

| Secret | Beschreibung |
|---|---|
| `SSH_PRIVATE_KEY` | SSH-Key für den Server (falls SSH-Deploy) |
| `SSH_KNOWN_HOSTS` | Output von `ssh-keyscan SERVER_IP` |
