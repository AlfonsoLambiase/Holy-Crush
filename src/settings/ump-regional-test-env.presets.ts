/**
 * Preset UMP per test in locale (EU vs USA).
 *
 * Next.js legge `process.env.NEXT_PUBLIC_*` in fase di **build** (`npm run build`).
 * Questo file NON imposta le variabili da solo: copia il contenuto del preset scelto
 * nel tuo `.env.local` (o in un file che carichi prima della build), poi:
 *   npm run build && npx cap sync android
 * e compila/installa l’APK come sempre.
 *
 * ---------------------------------------------------------------------------
 * PRODUZIONE — valori di default (disattiva il debug UMP)
 * ---------------------------------------------------------------------------
 * Per comportamento corretto sui dispositivi reali (geografia vera, nessuna simulazione):
 * - NON definire le variabili sotto, oppure commentale / eliminale da `.env.local`.
 * - In particolare `NEXT_PUBLIC_HOLY_CRUSH_UMP_DEBUG` non deve essere `"true"`.
 * - Così `buildConsentRequestOptions()` non passa `debugGeography` né `testDeviceIdentifiers`.
 *
 * Variabili opzionali anche in prod (solo se ti servono):
 * - `NEXT_PUBLIC_HOLY_CRUSH_UMP_ENABLE_RESET` — lascia assente o `false` (il reset
 *   consenso dall’app è solo per test in laboratorio).
 *
 * ---------------------------------------------------------------------------
 * TEST A — simulare Europa (EEA / GDPR)
 * ---------------------------------------------------------------------------
 */
export const UMP_TEST_ENV_PRESET_EEA_GDPR = `
# === Test A: EEA / GDPR (solo build di prova — rimuovi per produzione) ===
NEXT_PUBLIC_HOLY_CRUSH_UMP_DEBUG=true
NEXT_PUBLIC_HOLY_CRUSH_UMP_DEBUG_GEOGRAPHY=EEA
NEXT_PUBLIC_HOLY_CRUSH_UMP_TEST_DEVICE_IDS=SOSTITUISCI_CON_ID_DISPOSITIVO_TEST_ADMOB
# Log in console (Logcat: filtra "HolyCrush UMP") — vedi canRequestAds, status, ecc.
NEXT_PUBLIC_HOLY_CRUSH_UMP_LOG_CONSENT=true
# Opzionale: mostra il pulsante "Reset consenso (test UMP)" in Impostazioni
# NEXT_PUBLIC_HOLY_CRUSH_UMP_ENABLE_RESET=true
`.trim();

/**
 * ---------------------------------------------------------------------------
 * TEST B — simulare USA (messaggio privacy USA regolamentato)
 * ---------------------------------------------------------------------------
 */
export const UMP_TEST_ENV_PRESET_US = `
# === Test B: USA (solo build di prova — rimuovi per produzione) ===
NEXT_PUBLIC_HOLY_CRUSH_UMP_DEBUG=true
NEXT_PUBLIC_HOLY_CRUSH_UMP_DEBUG_GEOGRAPHY=US
NEXT_PUBLIC_HOLY_CRUSH_UMP_TEST_DEVICE_IDS=SOSTITUISCI_CON_ID_DISPOSITIVO_TEST_ADMOB
NEXT_PUBLIC_HOLY_CRUSH_UMP_LOG_CONSENT=true
# Opzionale:
# NEXT_PUBLIC_HOLY_CRUSH_UMP_ENABLE_RESET=true
`.trim();

/**
 * ---------------------------------------------------------------------------
 * Riferimento testo — produzione (nessuna riga da copiare obbligatoria)
 * ---------------------------------------------------------------------------
 * Esempio di `.env.local` minimale per release / store: nessuna delle chiavi UMP
 * sopra, oppure solo commenti. Il codice in `admob-consent.ts` tratta assenza =
 * debug disattivo e geografia non forzata.
 */
export const UMP_PRODUCTION_ENV_REFERENCE = `
# Produzione: niente override UMP — lascia vuoto o non definire:
# (non copiare le righe Test A/B)
`.trim();
