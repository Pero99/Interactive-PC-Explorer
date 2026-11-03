export type PlatformType = 'pc' | 'laptop' | 'server' | 'smartphone';

export type PCComponentId =
  | 'mainboard'
  | 'cpu'
  | 'cpu_cooler'
  | 'water_cooling'
  | 'ram'
  | 'gpu'
  | 'psu'
  | 'nvme'
  | 'ssd'
  | 'hdd'
  | 'case_fan'
  | 'cmos_battery'
  | 'bios_chip'
  | 'sata_ports'
  | 'pcie_slots'
  | 'audio_chip'
  | 'network_chip'
  | 'front_panel'
  | 'power_connectors';

export type LaptopComponentId =
  | 'laptop_board'
  | 'laptop_cpu'
  | 'laptop_gpu'
  | 'laptop_heatsink'
  | 'laptop_fans'
  | 'laptop_ram'
  | 'laptop_nvme'
  | 'laptop_battery'
  | 'laptop_wifi'
  | 'laptop_display'
  | 'laptop_keyboard'
  | 'laptop_io'
  | 'laptop_speakers'
  | 'laptop_bios';

export type ServerComponentId =
  | 'server_board'
  | 'server_cpus'
  | 'server_heatsinks'
  | 'server_ram'
  | 'server_fanwall'
  | 'server_shroud'
  | 'server_raid'
  | 'server_drives'
  | 'server_psus'
  | 'server_nic'
  | 'server_bmc'
  | 'server_riser';

export type SmartphoneComponentId =
  | 'phone_board'
  | 'phone_soc'
  | 'phone_ram'
  | 'phone_storage'
  | 'phone_cameras'
  | 'phone_front_cam'
  | 'phone_battery'
  | 'phone_qi_coil'
  | 'phone_vapor_chamber'
  | 'phone_display'
  | 'phone_modem'
  | 'phone_usbc'
  | 'phone_haptics_audio';

export type ComponentId =
  | PCComponentId
  | LaptopComponentId
  | ServerComponentId
  | SmartphoneComponentId;

export type ComponentCategory =
  | 'Systembasis'
  | 'Recheneinheit'
  | 'Kühlung'
  | 'Speicher'
  | 'Grafik & KI'
  | 'Stromversorgung'
  | 'Massenspeicher'
  | 'Mainboard-Bauteil'
  | 'Schnittstelle';

export interface HardwareSpec {
  label: string;
  value: string;
}

export interface HardwareComponentData {
  id: ComponentId;
  name: string;
  shortName: string;
  short: string;
  category: ComponentCategory;
  desc: string;
  tasks: string[];
  specs: HardwareSpec[];
  coop: string;
  missing: string;
  missingMonitorCode: string;
  missingMonitorMessage: string;
  missingImpactLevel: 'critical' | 'warning' | 'degraded';
  usecases: string[];
  explodeOffset: [number, number, number];
  camOffset: [number, number, number];
}

export type FlowCategory =
  | 'all'
  | 'cpu_ram'
  | 'cpu_storage'
  | 'cpu_gpu'
  | 'gpu_mon'
  | 'psu_all';

export interface FlowDefinition {
  id: string;
  category: Exclude<FlowCategory, 'all'>;
  label: string;
  protocol: string;
  bandwidth: string;
  involved: ComponentId[];
  color: number;
  hexColor: string;
  points: [number, number, number][];
  bidirectional: boolean;
  speed: number;
}

export interface QuizQuestion {
  id: number;
  level: 1 | 2 | 3;
  levelTitle: string;
  question: string;
  targetId: ComponentId;
  hint: string;
  contextNote: string;
}

export const HARDWARE_DB: Record<PCComponentId, HardwareComponentData> = {
  mainboard: {
    id: 'mainboard',
    name: 'Mainboard (Motherboard)',
    shortName: 'Mainboard',
    short: 'Die zentrale Hauptplatine, die alle Komponenten mechanisch und elektrisch verbindet.',
    category: 'Systembasis',
    desc: 'Das Mainboard ist das zentrale Nervensystem des Computers. Auf dieser mehrschichtigen Leiterplatte (PCB) laufen alle Daten- und Strombahnen zusammen, sodass Prozessor, Arbeitsspeicher, Grafikkarte und Massenspeicher miteinander kommunizieren können.',
    tasks: [
      'Bereitstellung von Steckplätzen (CPU-Sockel, RAM-Bänke, PCIe, M.2)',
      'Datenrouting über den Chipsatz und Hochgeschwindigkeits-Systembusse',
      'Spannungsregulierung für den Prozessor über VRMs (Spannungswandler)',
      'Bereitstellung externer Anschlüsse am I/O-Shield (USB, LAN, Audio)',
    ],
    specs: [
      { label: 'Formfaktor', value: 'ATX (305 × 244 mm)' },
      { label: 'CPU-Sockel', value: 'AM5 / LGA1700' },
      { label: 'Chipsatz', value: 'X670E / Z790 Express' },
      { label: 'Spannungswandler', value: '16+2+2 Phasen VRM' },
    ],
    coop: 'Steht mit jedem Bauteil im System in direktem Kontakt. Es verteilt den Strom vom Netzteil und leitet PCIe-Lanes von der CPU zu GPU und NVMe-SSDs sowie SATA- und USB-Signale über den Chipsatz.',
    missing: 'Ohne Mainboard existiert kein Computer – die einzelnen Bauteile hätten weder mechanischen Halt noch Daten- oder Stromleitungen zum Kommunizieren.',
    missingMonitorCode: 'ERR_NO_BACKPLANE',
    missingMonitorMessage: 'Kein Systembus vorhanden – Bauteile sind vollständig voneinander isoliert.',
    missingImpactLevel: 'critical',
    usecases: ['Systemintegration', 'Overclocking (Z/X-Boards)', 'Workstations', 'Server-Infrastruktur'],
    explodeOffset: [0, 0, -2.6],
    camOffset: [5.5, 2.0, 9.5],
  },
  cpu: {
    id: 'cpu',
    name: 'CPU (Central Processing Unit)',
    shortName: 'CPU / Prozessor',
    short: 'Das „Gehirn“ des PCs. Führt Programmcode und Milliarden Berechnungen pro Sekunde aus.',
    category: 'Recheneinheit',
    desc: 'Der Hauptprozessor (CPU) ist die zentrale Recheneinheit. Er holt Befehle aus dem Arbeitsspeicher, dekodiert sie und führt mathematische sowie logische Operationen im Nanosekunden-Takt aus (Fetch-Decode-Execute-Zyklus).',
    tasks: [
      'Ausführung des Betriebssystems und aller Anwendungsprogramme',
      'Steuerung und Koordination sämtlicher Datenflüsse im System',
      'Berechnung von Spiellogik, Physik-Simulationen und System-Threads',
      'Direkte Bereitstellung von PCIe-Lanes für Grafikkarte und M.2 NVMe',
    ],
    specs: [
      { label: 'Kerne (Cores)', value: '8 bis 24 physische Kerne' },
      { label: 'Threads', value: '16 bis 32 (SMT / Hyperthreading)' },
      { label: 'Taktrate', value: '3.8 GHz Basis / 5.8 GHz Boost' },
      { label: 'Cache (L2/L3)', value: '64 MB bis 128 MB 3D V-Cache' },
    ],
    coop: 'Arbeitet über den integrierten Speichercontroller direkt mit dem RAM zusammen, lädt Programmcode von der NVMe-SSD nach und sendet Zeichenbefehle (Draw Calls) an die Grafikkarte.',
    missing: 'Der PC startet überhaupt nicht. Kein einziger Befehl kann verarbeitet werden; auf dem Mainboard leuchtet sofort die rote CPU-Debug-LED.',
    missingMonitorCode: 'POST_HALT: CPU_MISSING (0x00)',
    missingMonitorMessage: 'Prozessorsockel leer. Kein Befehlszyklus möglich – Mainboard CPU-Debug-LED leuchtet.',
    missingImpactLevel: 'critical',
    usecases: ['Softwareentwicklung & Kompilierung', 'Gaming & Physik-Simulation', '3D-CPU-Rendering', 'Datenbank- & Webserver'],
    explodeOffset: [0, 0, 2.2],
    camOffset: [0.2, 2.5, 5.5],
  },
  cpu_cooler: {
    id: 'cpu_cooler',
    name: 'CPU-Kühler (AIO Pumpenblock)',
    shortName: 'CPU-Kühler',
    short: 'Leitet die extreme Abwärme des Prozessors ab, um Überhitzung und Notabschaltung zu verhindern.',
    category: 'Kühlung',
    desc: 'Da eine moderne CPU auf wenigen Quadratzentimetern über 120 bis 250 Watt elektrische Leistung in Wärme umwandelt, sitzt der CPU-Kühler (mit Wärmeleitpaste) direkt auf dem Prozessor und nimmt diese Hitze über eine feine Kupfer-Mikrofinnen-Bodenplatte auf.',
    tasks: [
      'Direkte Wärmeaufnahme vom Heatspreader (IHS) der CPU',
      'Schutz vor thermischer Drosselung (Thermal Throttling)',
      'Umwälzung der Kühlflüssigkeit mittels integrierter Keramikpumpe',
    ],
    specs: [
      { label: 'Kühlleistung (TDP)', value: 'Bis zu 300 Watt Abwärme' },
      { label: 'Kontaktfläche', value: 'Vernickeltes Elektrolytkupfer' },
      { label: 'Pumpendrehzahl', value: '2.800 U/min (PWM-geregelt)' },
      { label: 'Übergangsmaterial', value: 'Hochleistungs-Wärmeleitpaste' },
    ],
    coop: 'Sitzt physisch fest verschraubt auf der CPU, wird über den CPU_FAN/AIO_PUMP-Anschluss des Mainboards überwacht und pumpt die erwärmte Flüssigkeit zum Radiator.',
    missing: 'Die CPU erreicht innerhalb weniger Sekunden über 105 °C, drosselt extrem und schaltet den PC zum Selbstschutz hart ab (Thermal Shutdown).',
    missingMonitorCode: 'THERMAL_TRIP: CPU > 105°C',
    missingMonitorMessage: 'Kritische Überhitzung! Notabschaltung (Thermal Protection) zum Schutz des Siliziums ausgelöst.',
    missingImpactLevel: 'critical',
    usecases: ['High-End Gaming PCs', 'Silent-Workstations', 'Dauerlast-Rendering & Overclocking'],
    explodeOffset: [0, 0, 4.8],
    camOffset: [1.8, 2.6, 6.5],
  },
  water_cooling: {
    id: 'water_cooling',
    name: 'Wasserkühlung (AIO Radiator & Schläuche)',
    shortName: 'Wasserkühlung',
    short: 'Transportiert die CPU-Abwärme über Kühlflüssigkeit zu einem großen Lamellen-Radiator.',
    category: 'Kühlung',
    desc: 'Eine All-in-One (AIO) Wasserkühlung nutzt einen geschlossenen Flüssigkeitskreislauf. Die erwärmte Flüssigkeit fließt vom CPU-Kühler durch textilummantelte Schläuche in den Aluminium-Radiator im Gehäusedeckel, wo Lüfter die Wärme an die Raumluft abgeben.',
    tasks: [
      'Wärmetransport über Kühlflüssigkeit mit hoher spezifischer Wärmekapazität',
      'Großflächige Wärmeabgabe über feine Aluminium-Kühllamellen',
      'Direktes Abführen der CPU-Abwärme aus dem Gehäuseoberteil',
    ],
    specs: [
      { label: 'Radiatorformat', value: '240 mm / 360 mm Aluminium' },
      { label: 'Schlauchmaterial', value: 'EPDM mit Nylon-Sleeving' },
      { label: 'Kühlmittel', value: 'Destilliertes Wasser + Korrosionsschutz' },
      { label: 'Lüfterbestückung', value: '2× 120 mm statischer Druck (PWM)' },
    ],
    coop: 'Bildet mit dem CPU-Pumpenblock einen geschlossenen Kreislauf. Die Radiatorlüfter werden vom Mainboard dynamisch nach der CPU-Temperatur geregelt.',
    missing: 'Ohne Radiator und Flüssigkeitszirkulation kann der Pumpenblock die Wärme nicht abführen – die Kühlflüssigkeit im Block überhitzt nach wenigen Minuten.',
    missingMonitorCode: 'WARN_COOLANT_TEMP_HIGH',
    missingMonitorMessage: 'Keine Wärmeabfuhr am Radiator. CPU-Temperatur steigt kontinuierlich -> Starkes Thermal Throttling.',
    missingImpactLevel: 'warning',
    usecases: ['Hochleistungs-Prozessoren (Core i9 / Ryzen 9)', 'Kompakte & aufgeräumte Mainboard-Ansicht', 'Dauerlast-Workstations'],
    explodeOffset: [0, 4.2, 2.2],
    camOffset: [2.8, 4.8, 7.8],
  },
  ram: {
    id: 'ram',
    name: 'RAM (Arbeitsspeicher)',
    shortName: 'RAM (DDR5)',
    short: 'Extrem schneller Kurzzeitspeicher für gerade geöffnete Programme und aktive Daten.',
    category: 'Speicher',
    desc: 'RAM (Random Access Memory) ist der flüchtige Arbeitsspeicher des PCs. Da SSDs für den direkten Prozessortakt noch zu langsam sind, werden alle aktiven Programmteile, Spielwelten und das Betriebssystem hierhin geladen. Beim Ausschalten wird der RAM geleert.',
    tasks: [
      'Bereitstellung aktiver Programm- und Spieldaten für die CPU im Nanosekunden-Takt',
      'Zwischenspeichern von geöffneten Anwendungen, Browser-Tabs und Dokumenten',
      'Verdoppelung der Speicherbandbreite durch parallelen Dual-Channel-Betrieb',
    ],
    specs: [
      { label: 'Kapazität', value: '32 GB (2× 16 GB oder 4× 8 GB)' },
      { label: 'Speicherstandard', value: 'DDR5 SDRAM (288-Pin DIMM)' },
      { label: 'Geschwindigkeit', value: '6.000 MT/s (PC5-48000)' },
      { label: 'Latenz (Timings)', value: 'CL30-36-36-76 @ 1.35V' },
    ],
    coop: 'Ist über direkte Kupferleiterbahnen (Memory Bus) im Dual-Channel-Modus unmittelbar mit dem Speichercontroller in der CPU verbunden.',
    missing: 'Ohne RAM kann der Computer keine Programme ausführen. Der Bildschirm bleibt beim Start schwarz und die gelbe DRAM-Debug-LED auf dem Mainboard leuchtet dauerhaft.',
    missingMonitorCode: 'POST_HALT: DRAM_MISSING (0x55)',
    missingMonitorMessage: 'Kein Arbeitsspeicher erkannt. Ohne RAM kann der Prozessor keinen Code zwischenspeichern oder ausführen.',
    missingImpactLevel: 'critical',
    usecases: ['Multitasking & Office', '4K/8K Videobearbeitung', 'Virtuelle Maschinen & Container', 'In-Memory-Datenbanken'],
    explodeOffset: [2.2, 0.5, 3.0],
    camOffset: [2.8, 2.5, 5.8],
  },
  gpu: {
    id: 'gpu',
    name: 'Grafikkarte (GPU)',
    shortName: 'Grafikkarte (GPU)',
    short: 'Hochspezialisierter Parallelrechner für 3D-Grafik, Bildausgabe und künstliche Intelligenz.',
    category: 'Grafik & KI',
    desc: 'Während eine CPU wenige komplexe Aufgaben nacheinander löst, besitzt die GPU (Graphics Processing Unit) Tausende kleinere Rechenkerne. Damit berechnet sie Millionen Bildpunkte, komplexe Lichtstrahlen (Raytracing) und KI-Matrizen gleichzeitig.',
    tasks: [
      'Berechnung und Rendering von 2D- und 3D-Computergrafik in Echtzeit (FPS)',
      'Hardware-Beschleunigung von Raytracing (Licht/Reflexionen) und KI-Modellen',
      'Hardware-Encoding für flüssiges Video-Streaming (AV1 / NVENC)',
      'Erzeugung und Ausgabe des Bildsignals an den Monitor (DisplayPort / HDMI)',
    ],
    specs: [
      { label: 'Videospeicher (VRAM)', value: '16 GB GDDR6X (256-Bit Bus)' },
      { label: 'Shader-Einheiten', value: '9.728 CUDA / Stream Cores' },
      { label: 'Spezialkerne', value: 'Raytracing Gen-3 & Tensor KI-Cores' },
      { label: 'Leistungsaufnahme', value: '285W – 320W TGP (12VHPWR)' },
    ],
    coop: 'Steckt im obersten PCIe-x16-Slot (direkte Verbindung zur CPU), bezieht starken Zusatzstrom vom Netzteil und sendet das fertige Bildsignal an den Monitor.',
    missing: 'Ohne Grafikkarte (sofern die CPU keine integrierte Grafikeinheit besitzt) erhält der Monitor kein Bildsignal. 3D-Spiele, CAD und lokale KI-Berechnungen sind unmöglich.',
    missingMonitorCode: 'NO VIDEO SIGNAL (DP/HDMI)',
    missingMonitorMessage: 'Keine Grafikkarte erkannt (VGA-Debug-LED aktiv). Monitor erhält kein Bildsignal und geht in den Standby.',
    missingImpactLevel: 'critical',
    usecases: ['Gaming', 'KI & Machine Learning (LLMs)', 'Videobearbeitung & Color Grading', 'CAD & 3D-Konstruktion'],
    explodeOffset: [0, -0.8, 5.2],
    camOffset: [2.8, 0.2, 7.8],
  },
  psu: {
    id: 'psu',
    name: 'Netzteil (PSU - Power Supply Unit)',
    shortName: 'Netzteil (PSU)',
    short: 'Wandelt den 230V-Wechselstrom der Steckdose in präzisen Gleichstrom für alle Bauteile um.',
    category: 'Stromversorgung',
    desc: 'Das PC-Netzteil ist das Herzstück der Energieversorgung. Es transformiert die 230V Wechselspannung der Steckdose in hochstabile 12V-, 5V- und 3,3V-Gleichspannungen und schützt alle Komponenten vor Kurzschlüssen, Überspannung und Lastspitzen.',
    tasks: [
      'Umwandlung von 230V Wechselstrom (AC) in 12V / 5V / 3,3V Gleichstrom (DC)',
      'Abfangen extremer Lastspitzen moderner Grafikkarten im Millisekundenbereich',
      'Aktive Schutzschaltungen gegen Überspannung (OVP), Überstrom (OCP) und Kurzschluss (SCP)',
    ],
    specs: [
      { label: 'Nennleistung', value: '850 Watt Dauerleistung' },
      { label: 'Effizienzklasse', value: '80 PLUS Gold (92% Wirkungsgrad)' },
      { label: 'ATX-Standard', value: 'ATX 3.1 mit PCIe 5.1 (12V-2x6)' },
      { label: 'Bauweise', value: 'Vollmodulares Kabelmanagement' },
    ],
    coop: 'Versorgt über dedizierte Stromkabel das Mainboard (24-Pin), die CPU (8-Pin EPS), die Grafikkarte (12VHPWR) sowie alle SATA-Laufwerke.',
    missing: 'Ohne Netzteil ist das gesamte System komplett stromlos. Kein Lüfter dreht sich, keine Status-LED leuchtet, der PC reagiert überhaupt nicht.',
    missingMonitorCode: 'SYSTEM POWER OFF (0V)',
    missingMonitorMessage: 'Keine Stromversorgung (PSU fehlt). Alle 12V/5V/3.3V-Schienen sind spannungslos.',
    missingImpactLevel: 'critical',
    usecases: ['Stabile Energieversorgung jedes PCs', 'Workstations unter Dauerlast', 'Schutz teurer Hardware vor Netzschwankungen'],
    explodeOffset: [-2.5, -3.0, 2.5],
    camOffset: [-3.8, -2.8, 7.5],
  },
  nvme: {
    id: 'nvme',
    name: 'M.2 NVMe SSD',
    shortName: 'M.2 NVMe SSD',
    short: 'Der schnellste dauerhafte Massenspeicher – direkt flach auf dem Mainboard verschraubt.',
    category: 'Massenspeicher',
    desc: 'Eine M.2 NVMe SSD ist kaum größer als ein Kaugummistreifen und wird direkt auf das Mainboard gesteckt. Da sie ohne Kabelumwege über PCIe-Lanes direkt mit der CPU kommuniziert, erreicht sie bis zu 12-mal höhere Geschwindigkeiten als klassische SATA-SSDs.',
    tasks: [
      'Dauerhafte Speicherung des Betriebssystems (Windows/Linux) und wichtiger Programme',
      'Sekundenschneller Systemstart und verzögerungsfreies Laden großer Projekte',
      'Direktes Asset-Streaming an die Grafikkarte via DirectStorage',
    ],
    specs: [
      { label: 'Schnittstelle', value: 'PCIe 4.0 x4 / PCIe 5.0 x4 (NVMe 2.0)' },
      { label: 'Transferrate', value: '7.400 MB/s Lesen / 6.800 MB/s Schreiben' },
      { label: 'Formfaktor', value: 'M.2 2280 (22 × 80 mm)' },
      { label: 'Speicherzellen', value: '3D TLC NAND-Flash + DRAM Cache' },
    ],
    coop: 'Sitzt im M.2-Steckplatz zwischen CPU und GPU und tauscht Daten über 4 dedizierte PCIe-Lanes direkt mit Prozessor und Arbeitsspeicher aus.',
    missing: 'Fehlt das primäre Boot-Laufwerk, startet der PC zwar ins UEFI/BIOS, kann aber kein Betriebssystem laden („No Bootable Device Found“).',
    missingMonitorCode: 'BOOT_ERR: NO_BOOTABLE_DEVICE',
    missingMonitorMessage: 'UEFI findet keinen Bootloader. M.2 Systemlaufwerk mit dem Betriebssystem fehlt.',
    missingImpactLevel: 'critical',
    usecases: ['Systemlaufwerk (Boot-Drive)', '4K/8K RAW-Videoschnitt', 'Moderne Open-World-Spiele', 'Große lokale Datenbanken'],
    explodeOffset: [0, 0.2, 3.2],
    camOffset: [0.8, 0.8, 5.2],
  },
  ssd: {
    id: 'ssd',
    name: '2.5" SATA SSD (Solid State Drive)',
    shortName: '2.5" SATA SSD',
    short: 'Zuverlässiger, lautloser Flash-Speicher im 2,5-Zoll-Gehäuse für Spiele und Projektdaten.',
    category: 'Massenspeicher',
    desc: 'Die 2,5-Zoll SATA-SSD speichert Daten genau wie die NVMe-SSD auf unempfindlichen Flash-Speicherchips ohne bewegliche Teile, wird jedoch über ein klassisches SATA-Datenkabel und SATA-Stromkabel angeschlossen.',
    tasks: [
      'Dauerhafte, stoßfeste und komplett lautlose Speicherung von Dateien und Spielen',
      'Deutlich kürzere Ladezeiten im Vergleich zu mechanischen Festplatten (HDDs)',
      'Einfache Speichererweiterung über freie SATA-Ports des Mainboards',
    ],
    specs: [
      { label: 'Anschluss', value: 'SATA III (6 Gbit/s Daten + 15-Pin Strom)' },
      { label: 'Geschwindigkeit', value: '560 MB/s Lesen / 530 MB/s Schreiben' },
      { label: 'Zugriffszeit', value: '< 0,1 Millisekunden' },
      { label: 'Bauform', value: '2,5 Zoll Metallgehäuse (7 mm Bauhöhe)' },
    ],
    coop: 'Über ein SATA-Datenkabel mit den SATA-Anschlüssen des Mainboards und über ein SATA-Stromkabel mit dem Netzteil verbunden.',
    missing: 'Solange das Betriebssystem auf der M.2 NVMe liegt, startet der PC normal – allerdings fehlen alle auf der SATA-SSD gespeicherten Spiele und Programme.',
    missingMonitorCode: 'OS_WARN: DRIVE D: OFFLINE',
    missingMonitorMessage: 'System läuft über NVMe weiter, aber Sekundärspeicher (SATA SSD) ist im Betriebssystem nicht verfügbar.',
    missingImpactLevel: 'degraded',
    usecases: ['Zweitlaufwerk für Spiele-Bibliotheken', 'Aufrüstung älterer PCs & Laptops', 'Schneller Projektspeicher'],
    explodeOffset: [3.8, 0.5, 2.0],
    camOffset: [4.8, 1.0, 6.5],
  },
  hdd: {
    id: 'hdd',
    name: '3.5" HDD (Magnetfestplatte)',
    shortName: '3.5" HDD',
    short: 'Mechanischer Massenspeicher mit rotierenden Magnetscheiben für große, günstige Datenarchive.',
    category: 'Massenspeicher',
    desc: 'Eine Hard Disk Drive (HDD) speichert Daten magnetisch auf schnell rotierenden Scheiben (Platters), die von einem schwebenden Schreib-/Lesekopf abgetastet werden. Sie ist langsamer als SSDs und empfindlich gegen Stöße, bietet aber sehr viel Speicherplatz pro Euro.',
    tasks: [
      'Langfristige Archivierung großer Datenmengen (Backups, Rohvideos, Fotosammlungen)',
      'Kostengünstige Bereitstellung von 4 bis 24 Terabyte Speicherplatz',
    ],
    specs: [
      { label: 'Kapazität', value: '4 TB bis 24 TB' },
      { label: 'Spindeldrehzahl', value: '7.200 U/min (RPM)' },
      { label: 'Übertragungsrate', value: 'ca. 180 bis 240 MB/s' },
      { label: 'Zugriffszeit', value: '8 bis 12 Millisekunden (mechanisch)' },
    ],
    coop: 'Im unteren Laufwerkskäfig montiert; kommuniziert per SATA-Kabel mit dem Mainboard und benötigt 5V sowie 12V (für den Spindelmotor) vom Netzteil.',
    missing: 'Der PC startet und arbeitet normal weiter, jedoch sind lokale System-Backups und große Medienarchive nicht erreichbar.',
    missingMonitorCode: 'OS_INFO: ARCHIVE E: UNMOUNTED',
    missingMonitorMessage: 'Archiv-Festplatte (HDD) getrennt. System läuft normal, automatische Backups sind pausiert.',
    missingImpactLevel: 'degraded',
    usecases: ['System-Backups & Datensicherung', 'NAS & Heimserver', 'Große Video- & Medienarchive'],
    explodeOffset: [3.5, -3.0, 2.5],
    camOffset: [4.2, -2.8, 6.8],
  },
  case_fan: {
    id: 'case_fan',
    name: 'Gehäuselüfter (Airflow-System)',
    shortName: 'Gehäuselüfter',
    short: 'Sorgt für einen gerichteten Luftstrom: Kühle Frischluft vorne rein, heiße Abluft hinten raus.',
    category: 'Kühlung',
    desc: 'Selbst starke Kühler auf CPU und Grafikkarte verlieren ihre Wirkung, wenn sich die warme Luft im geschlossenen Gehäuse staut. Gehäuselüfter erzeugen einen kontinuierlichen Über-/Unterdruck-Luftstrom (Airflow) durch das gesamte System.',
    tasks: [
      'Ansaugen kühler Raumluft durch die Gehäusefront (Intake-Lüfter)',
      'Hinausblasen aufgeheizter Luft an der Rückseite (Exhaust-Lüfter)',
      'Mitkühlung passiver Mainboard-Bauteile wie Spannungswandler (VRMs), RAM und NVMe',
    ],
    specs: [
      { label: 'Rahmenbreite', value: '120 mm × 120 mm × 25 mm' },
      { label: 'Ansteuerung', value: '4-Pin PWM (Pulsweitenmodulation)' },
      { label: 'Drehzahlbereich', value: '450 bis 1.850 U/min' },
      { label: 'Lagerung', value: 'Fluiddynamisches Gleitlager (FDB)' },
    ],
    coop: 'Angeschlossen an die SYS_FAN/CHA_FAN-Stiftleisten des Mainboards, welches die Drehzahl anhand der Innentemperatur automatisch regelt.',
    missing: 'Im Gehäuse entsteht unter Last ein Hitzestau. Grafikkarte, Mainboard-Spannungswandler und SSDs werden deutlich heißer und drosseln ihre Leistung.',
    missingMonitorCode: 'THERMAL_WARN: CASE AIRFLOW 0 CFM',
    missingMonitorMessage: 'Gehäuselüfter stehen still. Innentemperatur steigt auf >68°C – GPU & VRMs takten unter Last herunter.',
    missingImpactLevel: 'warning',
    usecases: ['Thermisches Gehäuse-Management', 'Leiser PC-Betrieb (Silent-Airflow)', 'Kühlung von Mainboard & Speicher'],
    explodeOffset: [4.2, 0, 1.2],
    camOffset: [0, 1.0, 11.0],
  },
  cmos_battery: {
    id: 'cmos_battery',
    name: 'CMOS-Batterie (CR2032)',
    shortName: 'CMOS-Batterie',
    short: 'Knopfzelle, die Systemuhrzeit und BIOS-Einstellungen speichert, wenn der PC vom Strom getrennt ist.',
    category: 'Mainboard-Bauteil',
    desc: 'Eine 3-Volt-Lithium-Knopfzelle (Typ CR2032) in einer runden Fassung auf dem Mainboard. Sie versorgt den kleinen Echtzeituhr-Quarz (RTC) und den CMOS-Konfigurationsspeicher, sobald der PC komplett vom Stromnetz getrennt wird.',
    tasks: [
      'Weiterlaufenlassen von Systemdatum und Echtzeituhr (Real-Time Clock) ohne Netzstrom',
      'Erhalt individueller UEFI/BIOS-Profile (RAM-Takt/XMP, Boot-Reihenfolge, Lüfterkurven)',
    ],
    specs: [
      { label: 'Batterietyp', value: 'CR2032 Lithium-Mangandioxid' },
      { label: 'Nennspannung', value: '3,0 Volt Gleichspannung (DC)' },
      { label: 'Kapazität', value: 'ca. 220 mAh (hält 5 bis 8 Jahre)' },
      { label: 'Wartungsfunktion', value: 'Entnahme bewirkt BIOS/CMOS-Reset' },
    ],
    coop: 'Versorgt den CMOS-Speicherbereich des Chipsatzes und arbeitet direkt mit dem BIOS/UEFI-Chip zusammen.',
    missing: 'Wird der PC vom Stromnetz getrennt, verliert er Datum, Uhrzeit und alle BIOS-Einstellungen. Beim nächsten Einschalten stoppt der Start mit „CMOS Checksum Error / Press F1 to Run Setup“.',
    missingMonitorCode: 'CMOS_ERR: DATE/TIME NOT SET',
    missingMonitorMessage: 'CMOS Battery Low / Missing. Alle UEFI-Einstellungen wurden auf Werkseinstellungen zurückgesetzt (Press F1).',
    missingImpactLevel: 'warning',
    usecases: ['BIOS-Reset (Clear CMOS) nach fehlgeschlagenem Overclocking', 'Korrekte Systemzeit für SSL/TLS-Zertifikate'],
    explodeOffset: [-1.5, -1.0, 2.8],
    camOffset: [-1.0, -0.8, 4.2],
  },
  bios_chip: {
    id: 'bios_chip',
    name: 'BIOS / UEFI Chip (Flash-ROM)',
    shortName: 'BIOS / UEFI Chip',
    short: 'Firmware-Speicherchip, der den PC beim Einschalten initialisiert, bevor das Betriebssystem startet.',
    category: 'Mainboard-Bauteil',
    desc: 'Auf diesem nichtflüchtigen Flash-Speicherchip ist die Grund-Firmware des Mainboards (UEFI, früher BIOS) fest hinterlegt. Es ist das allererste Programm, das die CPU unmittelbar nach dem Drücken des Startknopfes ausführt.',
    tasks: [
      'Durchführung des POST (Power-On Self-Test): Prüfen von CPU, RAM, GPU und Tastatur',
      'Initialisierung der Mainboard-Chipsätze, Taktraten und PCIe-Leitungen',
      'Bereitstellung des grafischen UEFI-Menüs (Entf-/F2-Taste beim Start)',
      'Übergabe des Startvorgangs an den Bootloader auf der NVMe/SATA-SSD',
    ],
    specs: [
      { label: 'Speichertyp', value: 'SPI NOR-Flash EEPROM (8-Pin SOIC)' },
      { label: 'Kapazität', value: '32 MB (256 Mbit Flash-ROM)' },
      { label: 'Sicherheitsfeatures', value: 'Secure Boot & fTPM 2.0 Integration' },
      { label: 'Notfall-Update', value: 'USB BIOS Flashback Unterstützung' },
    ],
    coop: 'Wird beim Einschalten direkt von der CPU ausgelesen, prüft alle Komponenten auf dem Mainboard und startet anschließend das Betriebssystem von der SSD.',
    missing: 'Ohne BIOS/UEFI-Chip (oder bei beschädigter Firmware) weiß der Prozessor beim Einschalten nicht, wie er die Hardware ansprechen soll. Der PC bleibt komplett schwarz („Bricked Board“).',
    missingMonitorCode: 'FATAL: NO FIRMWARE / ROM HALT',
    missingMonitorMessage: 'SPI-Flash-ROM antwortet nicht. Ohne UEFI-Firmware ist keine Hardware-Initialisierung (POST) möglich.',
    missingImpactLevel: 'critical',
    usecases: ['System-Initialisierung (Bootstrapping)', 'BIOS-Updates für neue Prozessorgenerationen', 'Hardware-Lüftersteuerung'],
    explodeOffset: [-0.5, -1.8, 2.8],
    camOffset: [0, -1.5, 4.2],
  },
  sata_ports: {
    id: 'sata_ports',
    name: 'SATA-Anschlüsse (SATA III 6G)',
    shortName: 'SATA-Anschlüsse',
    short: 'Buchsen auf dem Mainboard zum Anschließen von 2,5"-SSDs, 3,5"-Festplatten und optischen Laufwerken.',
    category: 'Schnittstelle',
    desc: 'Serial ATA (SATA) Ports sind kompakte, L-förmig codierte Steckbuchsen am rechten unteren Rand des Mainboards. Über sie werden kabelgebundene Massenspeicher wie 2,5"-SSDs und 3,5"-Festplatten mit dem Mainboard-Chipsatz verbunden.',
    tasks: [
      'Dedizierte Punkt-zu-Punkt-Datenverbindung zu je einem Laufwerk pro Buchse',
      'Unterstützung des AHCI-Protokolls sowie von RAID-Verbünden (Datenspiegelung)',
    ],
    specs: [
      { label: 'Schnittstellen-Standard', value: 'SATA Revision 3.2 (6 Gbit/s)' },
      { label: 'Netto-Durchsatz', value: 'Maximal ca. 600 MB/s pro Port' },
      { label: 'Steckercodierung', value: '7-Pin Datenstecker mit L-Profil' },
      { label: 'Anzahl auf Board', value: '4 bis 6 gewinkelte Buchsen' },
    ],
    coop: 'Verbinden die 2,5" SATA-SSD und die 3,5" HDD per Datenkabel mit dem Mainboard-Chipsatz, der die Daten an die CPU weiterreicht.',
    missing: 'Ohne SATA-Anschlüsse können keine kabelgebundenen 2,5"-SSDs oder 3,5"-Festplatten intern angeschlossen werden; es bleiben nur M.2-Steckplätze.',
    missingMonitorCode: 'SATA_BUS_DISCONNECTED',
    missingMonitorMessage: 'SATA-Controller-Ports nicht verfügbar. Alle 2.5"-SSDs und 3.5"-HDDs sind vom System getrennt.',
    missingImpactLevel: 'degraded',
    usecases: ['Anschluss von Sekundär-SSDs und Archiv-Festplatten', 'Aufbau von RAID-0 / RAID-1 Speicherverbünden'],
    explodeOffset: [2.8, -1.2, 2.5],
    camOffset: [2.4, -1.4, 4.8],
  },
  pcie_slots: {
    id: 'pcie_slots',
    name: 'PCIe-Slots (PCI Express)',
    shortName: 'PCIe-Slots',
    short: 'Universelle Hochgeschwindigkeits-Steckplätze für Grafikkarten und Erweiterungskarten.',
    category: 'Schnittstelle',
    desc: 'PCI Express (Peripheral Component Interconnect Express) ist der wichtigste Hochgeschwindigkeits-Erweiterungsbus moderner PCs. Jeder Steckplatz bündelt zwischen 1 (x1) und 16 (x16) serielle Datenleitungen (Lanes) für extrem hohen Datendurchsatz.',
    tasks: [
      'Mechanische Aufnahme und Datenanbindung der schweren Grafikkarte (oberster x16-Slot)',
      'Nachrüstung von Erweiterungskarten (WLAN, 10-Gigabit-LAN, Soundkarten, Video-Capture)',
      'Bereitstellung von bis zu 75 Watt elektrischer Leistung direkt über die Slot-Kontakte',
    ],
    specs: [
      { label: 'Generation', value: 'PCIe 5.0 x16 (oben) / PCIe 4.0 (unten)' },
      { label: 'Bandbreite (x16)', value: 'Bis zu 64 GB/s bidirektional (PCIe 5.0)' },
      { label: 'Spurbreiten (Lanes)', value: 'x16, x8, x4 und x1 kompatibel' },
      { label: 'Verstärkung', value: 'Edelstahl-Schutzrahmen (SafeSlot)' },
    ],
    coop: 'Der oberste x16-Slot ist für minimale Latenz direkt an die CPU angebunden; die darunterliegenden Slots kommunizieren über den Mainboard-Chipsatz.',
    missing: 'Ohne PCIe-Steckplätze können weder dedizierte Grafikkarten noch interne Erweiterungskarten auf dem Mainboard installiert werden.',
    missingMonitorCode: 'PCIE_BUS_FAULT: LINK DOWN',
    missingMonitorMessage: 'PCIe x16 Bus unterbrochen. Grafikkarte und Erweiterungskarten können nicht mit der CPU kommunizieren.',
    missingImpactLevel: 'critical',
    usecases: ['Grafikkarten-Installation', 'Video-Capture-Cards für Livestreams', '10G-Glasfaser-Netzwerkkarten & NVMe-Adapterkarten'],
    explodeOffset: [-0.5, -1.5, 2.2],
    camOffset: [0, -1.2, 5.2],
  },
  audio_chip: {
    id: 'audio_chip',
    name: 'Onboard Audio-Chip (Soundprozessor)',
    shortName: 'Audio-Chip',
    short: 'Wandelt digitale Audiodaten des PCs in analoge Signale für Kopfhörer und Lautsprecher um.',
    category: 'Mainboard-Bauteil',
    desc: 'Ein Computer verarbeitet Ton intern als digitale Zahlenfolgen, während Lautsprecher und das menschliche Ohr analoge Schwingungen benötigen. Der Onboard-Audio-Codec (meist von Realtek) übernimmt diese Digital-Analog-Wandlung (DAC) sowie die Aufnahme über Mikrofone (ADC).',
    tasks: [
      'Digital-zu-Analog-Wandlung (DAC) für angeschlossene Lautsprecher und Klinken-Headsets',
      'Analog-zu-Digital-Wandlung (ADC) für das Mikrofonsignal',
      'Verstärkung hochohmiger Studiokopfhörer über spezialisierte Audio-Kondensatoren',
    ],
    specs: [
      { label: 'Audio-Prozessor', value: 'Realtek ALC4080 / ALC1220 Codec' },
      { label: 'Abtastrate & Tiefe', value: '32-Bit / 384 kHz Hi-Res Audio' },
      { label: 'Rauschabstand (SNR)', value: '120 dB (Wiedergabe) / 113 dB (Input)' },
      { label: 'Platinen-Design', value: 'Isolierte Leiterbahn gegen Störgeräusche' },
    ],
    coop: 'Sitzt abgeschirmt unten links auf dem Mainboard, empfängt digitale Audiosignale vom Chipsatz und versorgt die hinteren Klinkenbuchsen sowie den Front-Audio-Header.',
    missing: 'Über die Klinkenbuchsen an Gehäuse und Mainboard wird kein Ton mehr ausgegeben und analoge Mikrofone funktionieren nicht.',
    missingMonitorCode: 'OS_WARN: NO AUDIO OUTPUT DEVICE',
    missingMonitorMessage: 'Kein HD-Audio-Codec gefunden. Analoge Lautsprecher- und Mikrofonanschlüsse sind stummgeschaltet.',
    missingImpactLevel: 'degraded',
    usecases: ['Gaming-Sound & Sprachchat', 'Musikwiedergabe & Medienkonsum', 'Videokonferenzen'],
    explodeOffset: [-2.5, -2.0, 2.5],
    camOffset: [-2.0, -2.0, 4.5],
  },
  network_chip: {
    id: 'network_chip',
    name: 'Netzwerkchip (2.5G LAN Controller)',
    shortName: 'Netzwerkchip',
    short: 'Steuert den gesamten Datenverkehr zwischen dem PC, dem lokalen Netzwerk (Router) und dem Internet.',
    category: 'Mainboard-Bauteil',
    desc: 'Der Netzwerk-Controller (NIC – Network Interface Controller) verpackt ausgehende Daten in genormte Ethernet-Pakete, prüft eingehende Daten auf Übertragungsfehler und stellt über die RJ45-Buchse (oder ein WLAN-Modul) die Verbindung zum Router her.',
    tasks: [
      'Aufbau einer stabilen Kabelverbindung zum lokalen Netzwerk (LAN) und Internet',
      'Hardwareseitige Paketverarbeitung (TCP/UDP Checksum Offloading) zur CPU-Entlastung',
      'Bereitstellung einer weltweit eindeutigen Hardware-Kennung (MAC-Adresse)',
    ],
    specs: [
      { label: 'Übertragungsrate', value: '2.5 Gigabit Ethernet (2.500 Mbit/s)' },
      { label: 'Controller-Chip', value: 'Intel I226-V / Realtek RTL8125BG' },
      { label: 'Netzwerkfunktionen', value: 'Wake-on-LAN (WoL) & PXE Network Boot' },
      { label: 'Interne Anbindung', value: 'PCIe x1 Lane über Mainboard-Chipsatz' },
    ],
    coop: 'Sitzt nahe dem hinteren Anschlussfeld (I/O-Shield) auf dem Mainboard und tauscht Netzwerkpakete über den Chipsatz direkt mit RAM und CPU aus.',
    missing: 'Der Computer kann keine Verbindung über das Netzwerkkabel zum Router, Heimnetzwerk oder Internet aufbauen.',
    missingMonitorCode: 'NET_ERR: ETHERNET ADAPTER MISSING',
    missingMonitorMessage: 'Kein Netzwerk-Controller (NIC) erkannt. Keine Verbindung zu LAN, Router oder Internet möglich.',
    missingImpactLevel: 'degraded',
    usecases: ['Online-Gaming mit minimaler Latenz (Ping)', 'Schnelle Downloads & Cloud-Arbeit', 'Zugriff auf Firmenserver & NAS'],
    explodeOffset: [-2.8, 0.5, 2.5],
    camOffset: [-2.4, 0.5, 4.5],
  },
  front_panel: {
    id: 'front_panel',
    name: 'Front-Panel-Anschlüsse (F_PANEL & USB)',
    shortName: 'Front-Panel',
    short: 'Stiftleisten auf dem Mainboard, die den Startknopf und die USB-Ports des Gehäuses verbinden.',
    category: 'Schnittstelle',
    desc: 'Damit der Ein-/Ausschaltknopf (Power-Button), der Reset-Taster, die Status-LEDs und die oberen USB-Buchsen des PC-Gehäuses funktionieren, werden ihre feinen Kabel an diese codierten Stiftleisten (Header) am unteren Mainboard-Rand gesteckt.',
    tasks: [
      'Entgegennahme des Einschaltsignals vom Gehäuse-Startknopf (Power SW)',
      'Ansteuerung der Gehäuse-Betriebs-LED (Power LED) und Laufwerks-LED (HDD LED)',
      'Bereitstellung von Front-USB 3.0, USB-C und Gehäuse-Kopfhöreranschlüssen',
    ],
    specs: [
      { label: 'System-Header', value: '9-Pin F_PANEL (PWR_SW, RST, LED+/-)' },
      { label: 'USB-Front-Header', value: '19-Pin USB 3.2 & 20-Pin USB-C Key-A' },
      { label: 'Schaltprinzip', value: 'Kurzer Masse-Impuls über die 2 Power-Pins' },
      { label: 'Praxis-Detail', value: 'LEDs erfordern korrekte Plus-/Minus-Polung' },
    ],
    coop: 'Verbindet die Taster und Buchsen des PC-Gehäuses elektrisch mit der Startlogik des Mainboards und dem Netzteil.',
    missing: 'Sind die winzigen Front-Panel-Stecker nicht oder auf den falschen Pins eingesteckt, passiert beim Drücken des Startknopfes am Gehäuse überhaupt nichts.',
    missingMonitorCode: 'NO_PWR_SIGNAL: F_PANEL OPEN',
    missingMonitorMessage: 'Gehäuse-Startknopf (PWR_SW) ist nicht mit dem Mainboard verbunden – PC reagiert nicht auf Knopfdruck.',
    missingImpactLevel: 'critical',
    usecases: ['Klassischer Praxisschritt beim PC-Zusammenbau', 'Komfortabler Zugriff auf USB-Sticks am Gehäuse'],
    explodeOffset: [2.0, -2.5, 2.8],
    camOffset: [1.5, -2.4, 4.5],
  },
  power_connectors: {
    id: 'power_connectors',
    name: 'Stromanschlüsse (24-Pin ATX & 8-Pin EPS)',
    shortName: 'Stromanschlüsse',
    short: 'Die Hauptstrom-Steckplätze auf dem Mainboard zur Energieversorgung von Platine und Prozessor.',
    category: 'Schnittstelle',
    desc: 'Auf dem Mainboard befinden sich zwei unverzichtbare Hauptstrombuchsen: Der breite 24-polige ATX-Stecker am rechten Rand versorgt die Platine selbst, während der 8-polige EPS12V-Stecker oben links exklusiv den Prozessor mit Hochstrom beliefert.',
    tasks: [
      '24-Pin ATX: Versorgung von Mainboard, RAM, PCIe-Slots und Lüftern mit +12V, +5V und +3,3V',
      '8-Pin EPS (oben links): Direkte 12V-Stromzufuhr für die Spannungswandler der CPU',
      'Übertragung des Einschaltsignals (PS_ON#) vom Mainboard an das Netzteil',
    ],
    specs: [
      { label: 'Mainboard-Stecker', value: '24-Pin ATX (teilbar in 20+4 Pins)' },
      { label: 'Prozessor-Stecker', value: '8-Pin (4+4) EPS12V (bis 336 Watt)' },
      { label: 'Kontaktsicherung', value: 'Mechanische Einrastnase + Verpolungsschutz' },
      { label: 'Spannungsschienen', value: '+12V DC, +5V DC, +3.3V DC, +5VSB' },
    ],
    coop: 'Nehmen die Hauptkabelstränge vom Netzteil (PSU) auf und leiten die elektrische Leistung in die Stromschichten des Mainboards.',
    missing: 'Wird z. B. der 8-Pin-CPU-Stecker oben links vergessen (häufigster Fehler beim PC-Bau!), drehen zwar die Lüfter kurz an, aber die CPU hat keinen Strom und der Bildschirm bleibt schwarz.',
    missingMonitorCode: 'PWR_FAULT: 12V_EPS / 24PIN OPEN',
    missingMonitorMessage: 'Stromkabel auf dem Mainboard nicht gesteckt! Ohne 24-Pin ATX und 8-Pin CPU-Strom startet das System nicht.',
    missingImpactLevel: 'critical',
    usecases: ['PC-Montage & systematische Fehlersuche', 'Sichere Hochstromübertragung unter Volllast'],
    explodeOffset: [2.5, 1.5, 2.8],
    camOffset: [2.2, 1.5, 5.0],
  },
};

export const COMPONENT_LIST: HardwareComponentData[] = Object.values(HARDWARE_DB);

export const FLOW_DEFINITIONS: FlowDefinition[] = [
  {
    id: 'flow_cpu_ram',
    category: 'cpu_ram',
    label: 'CPU ↔ RAM',
    protocol: 'Dual-Channel DDR5 Memory Bus',
    bandwidth: '96 GB/s',
    involved: ['cpu', 'ram', 'mainboard'],
    color: 0x06b6d4,
    hexColor: '#06b6d4',
    points: [
      [-0.9, 2.15, 0.1],
      [-0.1, 2.48, 0.68],
      [0.85, 2.15, 0.32],
    ],
    bidirectional: true,
    speed: 0.55,
  },
  {
    id: 'flow_cpu_nvme',
    category: 'cpu_storage',
    label: 'CPU ↔ M.2 NVMe',
    protocol: 'PCIe 4.0 x4 Direct NVMe',
    bandwidth: '7.4 GB/s',
    involved: ['cpu', 'nvme', 'mainboard'],
    color: 0x10b981,
    hexColor: '#10b981',
    points: [
      [-0.9, 2.15, 0.1],
      [-0.78, 1.55, 0.55],
      [-0.65, 1.02, 0.08],
    ],
    bidirectional: true,
    speed: 0.48,
  },
  {
    id: 'flow_cpu_sata',
    category: 'cpu_storage',
    label: 'CPU ↔ SATA SSD & HDD',
    protocol: 'Chipsatz DMI → SATA III 6G',
    bandwidth: '600 MB/s',
    involved: ['cpu', 'ssd', 'hdd', 'sata_ports', 'mainboard'],
    color: 0x10b981,
    hexColor: '#10b981',
    points: [
      [-0.9, 2.15, 0.1],
      [0.98, -0.9, 0.25],
      [1.96, -0.85, 0.22],
      [3.4, 0.8, 0.05],
    ],
    bidirectional: true,
    speed: 0.35,
  },
  {
    id: 'flow_cpu_gpu',
    category: 'cpu_gpu',
    label: 'CPU ↔ GPU',
    protocol: 'PCIe 5.0 x16 Graphics Bus',
    bandwidth: '64 GB/s',
    involved: ['cpu', 'gpu', 'pcie_slots', 'mainboard'],
    color: 0xa855f7,
    hexColor: '#a855f7',
    points: [
      [-0.9, 2.15, 0.1],
      [-1.05, 0.85, 0.78],
      [-0.2, -0.1, 0.96],
    ],
    bidirectional: true,
    speed: 0.52,
  },
  {
    id: 'flow_gpu_mon',
    category: 'gpu_mon',
    label: 'GPU → Monitor',
    protocol: 'DisplayPort 2.1 UHBR20 Signal',
    bandwidth: '80 Gbit/s (4K @ 240Hz)',
    involved: ['gpu'],
    color: 0xec4899,
    hexColor: '#ec4899',
    points: [
      [-2.55, -0.1, 0.96],
      [-5.8, 0.45, 1.6],
      [-10.2, 1.0, 0.2],
    ],
    bidirectional: false,
    speed: 0.45,
  },
  {
    id: 'flow_psu_mb',
    category: 'psu_all',
    label: 'Netzteil → Mainboard & CPU',
    protocol: '24-Pin ATX & 8-Pin EPS (+12V/+5V/+3.3V)',
    bandwidth: 'Bis zu 450W Rail',
    involved: ['psu', 'power_connectors', 'mainboard', 'cpu'],
    color: 0xf59e0b,
    hexColor: '#f59e0b',
    points: [
      [-0.85, -3.55, 0.15],
      [2.35, -3.45, -1.25],
      [2.52, 1.45, -1.15],
      [1.96, 1.45, 0.15],
    ],
    bidirectional: false,
    speed: 0.32,
  },
  {
    id: 'flow_psu_gpu',
    category: 'psu_all',
    label: 'Netzteil → Grafikkarte',
    protocol: '16-Pin 12VHPWR (PCIe 5.1)',
    bandwidth: 'Bis zu 600W +12V',
    involved: ['psu', 'gpu'],
    color: 0xf59e0b,
    hexColor: '#f59e0b',
    points: [
      [-0.8, -3.45, 0.78],
      [0.65, -2.4, 1.45],
      [1.15, -0.65, 2.22],
      [1.15, 0.18, 1.98],
    ],
    bidirectional: false,
    speed: 0.36,
  },
  {
    id: 'flow_psu_storage',
    category: 'psu_all',
    label: 'Netzteil → SSD & HDD',
    protocol: '15-Pin SATA Power (+12V/+5V)',
    bandwidth: 'SATA Stromschiene',
    involved: ['psu', 'hdd', 'ssd'],
    color: 0xf59e0b,
    hexColor: '#f59e0b',
    points: [
      [-0.8, -3.85, 0.45],
      [1.45, -3.85, 0.45],
      [3.55, -1.85, -1.2],
      [3.4, 0.8, -0.25],
    ],
    bidirectional: false,
    speed: 0.3,
  },
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    level: 1,
    levelTitle: 'Grundlagen & Kernbauteile',
    question: 'Welche Komponente wird als das „Gehirn“ des Computers bezeichnet und führt alle zentralen Berechnungen aus?',
    targetId: 'cpu',
    hint: 'Sie sitzt mittig im Prozessorsockel direkt unter dem runden Kühlerblock (Tipp: Aktiviere bei Bedarf die Explosionsansicht!).',
    contextNote: 'Die CPU (Central Processing Unit) verarbeitet Milliarden Maschinenbefehle pro Sekunde.',
  },
  {
    id: 2,
    level: 1,
    levelTitle: 'Grundlagen & Kernbauteile',
    question: 'Wo befindet sich der ultraschnelle, flüchtige Arbeitsspeicher (RAM) für gerade geöffnete Programme?',
    targetId: 'ram',
    hint: 'Suche nach den vier senkrechten Riegeln mit leuchtender Leiste rechts neben dem Prozessor.',
    contextNote: 'RAM hält aktive Daten für die CPU im Nanosekunden-Zugriff bereit, verliert seinen Inhalt aber beim Ausschalten.',
  },
  {
    id: 3,
    level: 1,
    levelTitle: 'Grundlagen & Kernbauteile',
    question: 'Welche Komponente berechnet komplexe 3D-Welten, Raytracing und KI-Modelle und gibt das Bild an den Monitor aus?',
    targetId: 'gpu',
    hint: 'Es ist die größte, waagerecht eingebaute Steckkarte in der Mitte des Gehäuses.',
    contextNote: 'Die Grafikkarte (GPU) besitzt Tausende spezialisierte Shader-Kerne für parallele Berechnungen.',
  },
  {
    id: 4,
    level: 1,
    levelTitle: 'Grundlagen & Kernbauteile',
    question: 'Welches Bauteil wandelt den 230V-Wechselstrom der Steckdose in stabilen Gleichstrom (12V/5V/3,3V) für alle Komponenten um?',
    targetId: 'psu',
    hint: 'Der große quaderförmige Block unten links im PC-Gehäuse.',
    contextNote: 'Das Netzteil (PSU) versorgt alle Komponenten und schützt vor Überspannung und Kurzschlüssen.',
  },
  {
    id: 5,
    level: 2,
    levelTitle: 'Speicher & Kühlung',
    question: 'Welche extrem schnelle Massenspeicher-Komponente wird wie ein schmaler Riegel direkt flach auf das Mainboard geschraubt?',
    targetId: 'nvme',
    hint: 'Sie sitzt auf dem Mainboard genau zwischen dem CPU-Bereich und der Grafikkarte.',
    contextNote: 'Eine M.2 NVMe SSD ist direkt über PCIe-Lanes an die CPU angebunden und erreicht über 7.000 MB/s.',
  },
  {
    id: 6,
    level: 2,
    levelTitle: 'Speicher & Kühlung',
    question: 'Klicke auf die kleine runde Knopfzelle, die Uhrzeit und BIOS-Einstellungen sichert, wenn der PC vom Stromnetz getrennt ist!',
    targetId: 'cmos_battery',
    hint: 'Eine silberne, runde Scheibe (CR2032) links unterhalb der CPU auf dem Mainboard.',
    contextNote: 'Ohne die CMOS-Batterie vergisst das Mainboard bei Stromtrennung die Systemuhrzeit und sämtliche BIOS-Profile.',
  },
  {
    id: 7,
    level: 2,
    levelTitle: 'Speicher & Kühlung',
    question: 'Welcher Massenspeicher arbeitet mit rotierenden Magnetscheiben und eignet sich besonders für große, günstige Datenarchive?',
    targetId: 'hdd',
    hint: 'Befindet sich unten rechts im Laufwerksschacht auf Höhe des Netzteils.',
    contextNote: 'Die 3,5-Zoll-HDD speichert Daten magnetisch auf rotierenden Scheiben (Platters).',
  },
  {
    id: 8,
    level: 2,
    levelTitle: 'Speicher & Kühlung',
    question: 'Welches Bauteil gibt die über Flüssigkeit abgeleitete CPU-Wärme oben am Gehäusedeckel über feine Lamellen an die Luft ab?',
    targetId: 'water_cooling',
    hint: 'Der breite Kühler (Radiator) mit den beiden geschwungenen Schläuchen ganz oben im Gehäuse.',
    contextNote: 'Der AIO-Radiator bietet eine riesige Lamellenoberfläche zur effizienten Wärmeabfuhr.',
  },
  {
    id: 9,
    level: 3,
    levelTitle: 'Mainboard-Architektur & Schnittstellen',
    question: 'Wo befinden sich die Front-Panel-Anschlüsse, ohne die der Startknopf am PC-Gehäuse keinerlei Funktion hat?',
    targetId: 'front_panel',
    hint: 'Eine markante gelb/blaue Stiftleiste ganz unten rechts am Rand des Mainboards.',
    contextNote: 'Über den F_PANEL-Header überbrückt der Gehäuse-Startknopf kurzzeitig zwei Pins zum Einschalten.',
  },
  {
    id: 10,
    level: 3,
    levelTitle: 'Mainboard-Architektur & Schnittstellen',
    question: 'Welcher Speicherchip auf dem Mainboard enthält die UEFI-Startfirmware und führt beim Einschalten den Hardware-Selbsttest (POST) durch?',
    targetId: 'bios_chip',
    hint: 'Ein kleiner rechteckiger Chip mit Leuchtpunkt im unteren mittleren Bereich des Mainboards.',
    contextNote: 'Der BIOS/UEFI-Flash-Chip initialisiert beim Einschalten alle Komponenten, bevor das Betriebssystem übernimmt.',
  },
  {
    id: 11,
    level: 3,
    levelTitle: 'Mainboard-Architektur & Schnittstellen',
    question: 'Welche Stromanschlüsse auf dem Mainboard beliefern die Hauptplatine (24-Pin) und den Prozessor (8-Pin) mit Energie?',
    targetId: 'power_connectors',
    hint: 'Suche die markanten Strombuchsen am rechten äußeren Rand (24-Pin) oder oben links (8-Pin) auf dem Mainboard.',
    contextNote: 'Wird der 8-Pin-EPS-Stecker oben links vergessen, läuft der PC zwar kurz an, zeigt aber kein Bild.',
  },
  {
    id: 12,
    level: 3,
    levelTitle: 'Mainboard-Architektur & Schnittstellen',
    question: 'Welcher Spezialchip wandelt digitale Audiodaten in analoge Signale für Kopfhörer und Lautsprecher um?',
    targetId: 'audio_chip',
    hint: 'Sitzt ganz unten links auf dem Mainboard, direkt neben den drei goldenen Audio-Kondensatoren.',
    contextNote: 'Der Audio-Codec-Chip (DAC/ADC) ist auf dem Mainboard elektrisch abgeschirmt, um Störgeräusche zu verhindern.',
  },
];
