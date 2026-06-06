# DigiSell — Admin Panel TODO (Stand: 05.06.2026)

## STATUS-LEGENDE
✅ = Vollständig implementiert
🟡 = Teilweise implementiert (API-Key nötig)
❌ = Noch nicht implementiert

---

## 1. ADMIN DASHBOARD
✅ Übersicht mit Statistiken (Gesamtumsatz, aktive Nutzer, Shops, Bestellungen)
✅ Letzte Aktivitäten (neue Nutzer, Bestellungen, Tickets, Meldungen)
✅ Systemstatus (CPU, RAM, DB, Redis, Uptime)
✅ Schnellzugriff auf wichtige Funktionen
✅ Umsatz-Chart (7 Tage / 30 Tage / 12 Monate)
✅ Top-Shops nach Umsatz
✅ Top-Produkte nach Verkäufen
✅ Offene Tickets und Meldungen

---

## 2. NUTZERVERWALTUNG
✅ Alle Nutzer anzeigen (Tabelle mit Suche und Filter)
✅ Nutzer nach Rolle filtern (Admin, Seller, Käufer)
✅ Nutzer nach Status filtern (aktiv, gesperrt, unverifiziert)
✅ Nutzerprofil anzeigen (Modal mit allen Details)
✅ Nutzer sperren/entsperren
✅ Nutzer löschen
✅ E-Mail-Verifizierung manuell bestätigen
✅ Nutzerrolle ändern
✅ Warnung an Nutzer senden
✅ Login-Historie anzeigen
✅ Aktivitäten des Nutzers anzeigen
✅ Bestellungen des Nutzers anzeigen
✅ Tickets des Nutzers anzeigen

---

## 3. SHOPVERWALTUNG
✅ Alle Shops anzeigen (Tabelle mit Suche und Filter)
✅ Shop nach Status filtern (aktiv, gesperrt, ausstehend)
✅ Shop-Details anzeigen (Modal)
✅ Shop sperren/entsperren
✅ Shop löschen
✅ Shop-Umsatz anzeigen
✅ Shop-Bestellungen anzeigen
✅ Shop-Produkte anzeigen
✅ Shop-Bewertungen anzeigen
✅ Meldungen gegen Shop anzeigen
✅ Shop-Inhaber kontaktieren

---

## 4. PRODUKTVERWALTUNG
✅ Alle Produkte anzeigen (Tabelle mit Suche und Filter)
✅ Produkt nach Kategorie filtern
✅ Produkt nach Status filtern
✅ Produkt sperren/entsperren
✅ Produkt löschen
✅ Produktdetails anzeigen
✅ Meldungen gegen Produkt anzeigen

---

## 5. BESTELLVERWALTUNG
✅ Alle Bestellungen anzeigen (Tabelle mit Suche und Filter)
✅ Bestellung nach Status filtern
✅ Bestellung nach Zahlungsmethode filtern
✅ Bestelldetails anzeigen
✅ Bestellung stornieren
✅ Rückerstattung auslösen
✅ Bestellstatus manuell ändern
✅ Bestellexport (CSV)

---

## 6. ZAHLUNGSVERWALTUNG
✅ Alle Zahlungen anzeigen (Tabelle mit Suche und Filter)
✅ Zahlung nach Status filtern
✅ Zahlung nach Methode filtern
✅ Zahlungsdetails anzeigen
✅ Rückerstattung auslösen
✅ Chargeback markieren
✅ Zahlungsexport (CSV)

---

## 7. TICKET-SYSTEM
✅ Alle Tickets anzeigen (Tabelle mit Suche und Filter)
✅ Ticket nach Status filtern
✅ Ticket nach Priorität filtern
✅ Ticket nach Kategorie filtern
✅ Ticketdetails anzeigen
✅ Ticket beantworten
✅ Ticket schließen
✅ Ticket-Priorität ändern
✅ Ticket-Kategorie ändern
✅ Ticket an anderen Admin zuweisen
✅ Dateianhänge in Tickets
✅ Ticketsuche

---

## 8. MELDUNGEN & MODERATION
✅ Alle Meldungen anzeigen (Tabelle mit Suche und Filter)
✅ Meldung nach Typ filtern (Produkt, Shop, Nutzer, Bewertung)
✅ Meldung nach Status filtern
✅ Meldungsdetails anzeigen
✅ Meldung bearbeiten (annehmen/ablehnen)
✅ Gemeldetes Objekt sperren
✅ Gemeldeten Nutzer sperren
✅ Meldung schließen
✅ Moderations-Log

---

## 9. AFFILIATE-VERWALTUNG
✅ Alle Affiliates anzeigen
✅ Affiliate-Statistiken (Klicks, Verkäufe, Provisionen)
✅ Provisionen bearbeiten
✅ Auszahlungen verwalten
✅ Auszahlung als bezahlt markieren
✅ Affiliate sperren/entsperren

---

## 10. ABONNEMENT-VERWALTUNG
✅ Alle Abonnements anzeigen
✅ Abonnement nach Status filtern
✅ Abonnementdetails anzeigen
✅ Abonnement kündigen
✅ Abonnement verlängern
✅ Abonnement-Statistiken

---

## 11. ANALYTICS
✅ Plattform-Umsatz (gesamt, nach Zeitraum)
✅ Nutzerwachstum (Registrierungen nach Zeitraum)
✅ Shop-Wachstum
✅ Bestellstatistiken
✅ Zahlungsstatistiken (nach Methode)
✅ Top-Kategorien
✅ Geografische Verteilung
✅ Conversion-Rate
✅ Export als CSV/PDF

---

## 12. SICHERHEIT
✅ Login-Logs (alle Anmeldeversuche)
✅ Fehlgeschlagene Login-Versuche
✅ Admin-Aktivitäten-Log
✅ IP-Sperrliste verwalten
✅ E-Mail-Sperrliste verwalten
✅ Domain-Sperrliste verwalten
✅ VPN/Proxy-Erkennung (Provider/API-Key in Admin-Einstellungen konfigurierbar)
✅ Fingerprinting (konfigurierbarer passiver/strikter Geräte-Fingerprint)
✅ CAPTCHA-Konfiguration (hCaptcha/Turnstile inklusive Site-/Secret-Key)

---

## 13. ADMIN-ROLLEN & BERECHTIGUNGEN
✅ Admin-Rollen anzeigen
✅ Neue Admin-Rolle erstellen
✅ Rolle bearbeiten (Name, Beschreibung, Berechtigungen)
✅ Rolle löschen
✅ Admin-Nutzer einer Rolle zuweisen
✅ Berechtigungen granular konfigurieren

---

## 14. SYSTEMVERWALTUNG
✅ System-Health-Check (CPU, RAM, DB, Redis)
✅ System-Logs anzeigen
✅ Datenbank-Backup erstellen
✅ Backup herunterladen
✅ Wartungsmodus aktivieren/deaktivieren
✅ E-Mail-Einstellungen konfigurieren
✅ Zahlungsanbieter konfigurieren
✅ Shop-Einstellungen
✅ Sicherheitsrichtlinien konfigurieren
✅ Monitoring (Prometheus-Metrics-Endpunkt und Grafana-URL konfigurierbar)
✅ Automatische Backups (Cron-Ausdruck, Retention und Backup-Skript konfigurierbar)

---

## 15. USER-PANEL (SELLER)
✅ Shop-Übersicht (Umsatz, Bestellungen, Produkte, Kunden)
✅ Kunden-Liste
✅ Kunden-Details
✅ Verkaufsstatistiken
✅ Zahlungsübersicht
✅ Auszahlungsanfragen

---

## ZUSAMMENFASSUNG
✅ Vollständig: 131 Features
✅ Teilweise: 0 Features
❌ Fehlt: 0 Features
