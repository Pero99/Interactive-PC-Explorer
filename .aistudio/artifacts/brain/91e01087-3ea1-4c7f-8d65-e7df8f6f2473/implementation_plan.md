# 3D-Einzelteil-Isolierung per Doppelklick (PC, Laptop, Server & Smartphone)

Durch einen Doppelklick (oder Doppeltipp auf Touch-Geräten) auf ein beliebiges Bauteil wird dieses plattformübergreifend als freigestelltes 3D-Einzelteil isoliert und die Kamera fährt nah an das Bauteil heran. Ein erneuter Doppelklick auf das Bauteil oder in den leeren Hintergrund kehrt nahtlos zur Gesamtansicht des Geräts zurück.

## User Review & Bestätigte Entscheidungen

> [!IMPORTANT]
> Alle Rückfragen aus der Planungsphase wurden geklärt und fließen direkt in die Umsetzung ein:

- **Auslöser für den Doppelklick**: Funktioniert einheitlich **direkt am 3D-Bauteil im Modell**, **in der linken Bauteilliste** sowie **auf den 3D-Nummern-Pins** für alle 4 Plattformen (Desktop-PC, Laptop, Rack-Server, Smartphone).
- **Verlassen der Einzelteil-Isolierung**: Ein **erneuter Doppelklick auf das isolierte Bauteil** oder ein **Doppelklick ins Leere** (Hintergrund der 3D-Szene) sowie die vorhandenen Zurück-Schaltflächen und die `Esc`-Taste heben die Isolierung wieder auf.
- **Darstellung nach Doppelklick**: Das Bauteil wird **kompakt als Einzelteil isoliert** (`explodeFactor = 0`), alle übrigen Bauteile und Gehäuseschalen werden ausgeblendet und die 3D-Kamera zoomt automatisch in eine optimale Nahaufnahme.

---

## 1. Überblick & Kernkonzept

- **Was die Funktion bietet**: Nutzer können jedes Hardware-Modul (z. B. CPU, GPU, Mainboard, Laptop-Kühlsystem, Server-RAID-Backplane oder Smartphone-Periskopkamera) sofort per Doppelklick aus dem Gesamtsystem herauslösen und von allen Seiten im 360°-Studio betrachten.
- **Zielgruppe & Mehrwert**: Beschleunigt die Bedienung beim Erkunden komplexer Teardown-Modelle erheblich, da kein Wechsel mehr in das Detail-Panel nötig ist, um die 360°-Einzelteil-Ansicht zu aktivieren oder zu beenden.

---

## 2. Nutzererlebnis & Interaktionsdesign

- **Ablauf beim Isolieren (Doppelklick / Doppeltipp)**:
  1. **Auswahl & Isolierung**: Ein Doppelklick auf ein 3D-Mesh, einen 3D-Pin oder einen Eintrag in der Bauteilliste wählt das Bauteil aus, aktiviert den 360°-Isolationsmodus und setzt die Schicht-Explosion zunächst auf kompakt (`0`), damit das Bauteil als ganzes Modul im Fokus steht.
  2. **Kamera-Fokus**: Die Orbit-Kamera fährt sanft an das isolierte Bauteil heran; selbst halbtransparente Gehäuseteile (wie Smartphone-OLED-Display, Laptop-Topcase oder Server-Air-Shroud) werden im isolierten Zustand automatisch zu 100 % sichtbar dargestellt.
  3. **Mobiles Verhalten**: Wird ein Bauteil auf kleinen Bildschirmen in der linken Suchliste doppelt angetippt, schließt sich das Such-Overlay automatisch, damit das isolierte 3D-Einzelteil sofort frei sichtbar ist.
- **Ablauf beim Zurückkehren (De-Isolieren)**:
  - Ein Doppelklick auf das bereits isolierte Bauteil (im 3D-Modell, auf dem Pin oder in der Liste) oder ein Doppelklick in den freien 3D-Hintergrund beendet die Einzelteil-Ansicht und fährt die Kamera wieder auf das gesamte Gerät zurück.

---

## 3. Wichtige Produktentscheidungen & Abwägungen

- **Entscheidung 1: Kombinierte Maus-Doppelklick- und Touch-Doppeltipp-Erkennung im 3D-Viewport**
  - *Gewählter Ansatz*: Neben dem nativen `dblclick`-Event für Desktop-Mäuse wird eine zeit- und distanzbasierte Doppeltipp-Erkennung (`< 320 ms`, geringer Finger-Versatz) für Touchscreens integriert, die Kameradrehungen (`OrbitControls`) sauber von echten Bauteil-Doppeltipps unterscheidet.
  - *Warum*: So funktioniert die Geste sowohl mit der Maus am PC als auch per Fingerzeig auf Smartphone und Tablet zuverlässig, ohne beim Drehen der Kamera versehentlich auszulösen.
- **Entscheidung 2: Deaktivierung im aktiven Quiz-Modus**
  - *Gewählter Ansatz*: Während das interaktive Hardware-Quiz läuft, bleibt die Gesamtansicht geschützt, damit schnelle Klicks bei der Beantwortung von Quizfragen nicht unbeabsichtigt das Modell ausblenden.
  - *Warum*: Verhindert Spielabbrüche oder Orientierungsverlust während einer laufenden Quizrunde.

---

## 4. Technische Architektur & Zustandsfluss

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Doppelklick-Eingabequellen                       │
├───────────────────────┬─────────────────────────┬───────────────────────┤
│   3D-Modell (Canvas)  │    3D-Callout-Pins      │   Linke Bauteilliste  │
│  (Raycasting & Touch) │  (DOM-Pin onDoubleClick)│ (Eintrag onDoubleClick│
└───────────┬───────────┴────────────┬────────────┴───────────┬───────────┘
            │                        │                        │
            ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│             Zentraler Handler: handleDoubleClickComponent(id)           │
├─────────────────────────────────────────────────────────────────────────┤
│ • Doppelklick auf Bauteil (wenn noch nicht isoliert oder anderes Teil): │
│   -> selectedId = id, isIsolatedView = true, explodeFactor = 0          │
│ • Doppelklick auf bereits isoliertes Bauteil ODER ins Leere (id = null):│
│   -> isIsolatedView = false (kehrt zur Geräte-Gesamtansicht zurück)     │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                3D-Szenen-Synchronisation (Alle 4 Geräte)                │
├─────────────────────────────────────────────────────────────────────────┤
│ • Sichtbarkeit: Nur ausgewähltes Bauteil sichtbar, Gehäuse ausgeblendet │
│ • Material-Deckkraft: Isoliertes Bauteil erhält 100 % Deckkraft         │
│ • Kamera-Lerp: Sanfter Zoom auf plattformspezifische Nahaufnahme        │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Zustands-Mapping**:
  - `handleDoubleClickComponent(id: ComponentId | null)` koordiniert plattformübergreifend (`pc`, `laptop`, `server`, `smartphone`) den Wechsel zwischen Gesamtansicht und 360°-Einzelteil-Isolierung.
  - Sowohl die 3D-Arbeitsfläche (inklusive Raycasting auf allen Bauteil-Meshes) als auch die HTML-Overlays (3D-Pins und Suchliste) leiten Doppelklick-Ereignisse direkt an diesen zentralen Handler weiter.
