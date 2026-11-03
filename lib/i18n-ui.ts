import { ComponentCategory, ComponentId, QUIZ_QUESTIONS, QuizQuestion } from './hardware-data';

export type Locale = 'de' | 'en' | 'tr' | 'ro' | 'ar';
export type ThemeMode = 'light' | 'dark';

export interface LocaleMeta {
  code: Locale;
  shortLabel: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
}

export const LOCALES: LocaleMeta[] = [
  { code: 'de', shortLabel: 'DE', nativeName: 'Deutsch', dir: 'ltr' },
  { code: 'en', shortLabel: 'EN', nativeName: 'English', dir: 'ltr' },
  { code: 'tr', shortLabel: 'TR', nativeName: 'Türkçe', dir: 'ltr' },
  { code: 'ro', shortLabel: 'RO', nativeName: 'Română', dir: 'ltr' },
  { code: 'ar', shortLabel: 'AR', nativeName: 'العربية', dir: 'rtl' },
];

export interface LocalizedBootStep {
  step: number;
  title: string;
  componentId: ComponentId;
  detail: string;
}

export interface UiTranslationDict {
  appTitle: string;
  platformPc: string;
  platformLaptop: string;
  platformServer: string;
  platformSmartphone: string;
  platformSubtitlePc: string;
  platformSubtitleLaptop: string;
  platformSubtitleServer: string;
  platformSubtitleSmartphone: string;

  themeLight: string;
  themeDark: string;
  themeToggle: string;

  navExplore: string;
  navExplode: string;
  navCables: string;
  navDataFlows: string;
  navBoot: string;
  navQuiz: string;
  resetView: string;
  languageLabel: string;

  // Left Drawer & Top Action Pills
  componentsCount: (count: number) => string;
  testPostBoot: string;
  disabledCountBanner: (count: number) => string;
  enableAll: string;
  searchPlaceholder: string;
  activeFilterLabel: string;
  statusActive: string;
  statusDisabled: string;
  clickToInspect: string;
  clickForQuizAnswer: string;

  // Categories
  categories: Record<'Alle' | ComponentCategory, string>;

  // Right Detail Panel
  closePanel: string;
  secWhatIsIt: string;
  secMainTasks: string;
  secTechSpecs: string;
  secCooperation: string;
  isolateBus: string;
  secMissingEffect: string;
  btnReinstallComponent: string;
  btnSimulateFailure: string;
  secUsecases: string;
  btnShowDataFlow: string;
  btnCablesOn: string;
  btnCablesOff: string;
  btnAssemble: string;
  btnExplode: string;

  // Bottom Dock
  showControlsKey: string;
  hideControlsKey: string;
  caseOpacityLabel: string;
  cablesToggleLabel: (on: boolean) => string;
  airflowToggleLabel: (on: boolean) => string;
  thermalToggleLabel: (on: boolean) => string;
  pinsToggleLabel: (on: boolean) => string;
  isolateToggleLabel: (on: boolean) => string;
  isolatePartBtn: (on: boolean) => string;
  subExplodeBtn: (on: boolean) => string;
  subPinsToggleBtn: (on: boolean) => string;
  subLayerSliderLabel: string;
  busesLabel: string;
  busAll: string;
  busCpuRam: string;
  busCpuSsd: string;
  busCpuGpu: string;
  busGpuMon: string;
  busPsu: string;
  camOverall: string;
  camCooling: string;
  camMainboard: string;
  camStorage: string;

  // POST Boot Sequence
  postHeader: (step: number, total: number) => string;
  prevStep: string;
  nextStep: string;
  finishBoot: string;

  // Quiz Mode
  quizLevel: string;
  quizQuestionProgress: (curr: number, total: number) => string;
  quizPoints: string;
  quizInstruction: string;
  quizHideHint: string;
  quizShowHint: string;
  quizActivateExplode: string;
  quizHintLabel: string;
  quizCorrectTitle: (name: string) => string;
  quizWrongTitle: (name: string) => string;
  quizWhatYouClicked: string;
  quizHintForTarget: string;
  quizNextQuestion: string;
  quizShowResults: string;
  quizCompletedTitle: string;
  quizCompletedDesc: (total: number, score: number) => string;
  quizRestart: string;
  quizBackTo3D: string;

  // 3D Canvas
  monPostErrorTitle: string;
  monMissingCompLabel: string;
  monHintReenable: string;
  monComponentLabel: string;
  monFocusCategory: (cat: string) => string;
  monAllReadyStatus: string;
  monSystemReadyTitle: string;
  monClickHint: string;
}

export const UI_TRANSLATIONS: Record<Locale, UiTranslationDict> = {
  de: {
    appTitle: 'Interactive Hardware Explorer 3D',
    platformPc: 'Desktop-PC',
    platformLaptop: 'Laptop',
    platformServer: 'Rack-Server',
    platformSmartphone: 'Smartphone',
    platformSubtitlePc: 'ATX Modular Workstation (19 Bauteile)',
    platformSubtitleLaptop: 'Ultrabook & Mobile Workstation (14 Bauteile)',
    platformSubtitleServer: '2U Dual-Socket Datacenter Server (12 Bauteile)',
    platformSubtitleSmartphone: 'Flaggschiff-Smartphone Teardown (13 Bauteile)',

    themeLight: 'Heller Modus',
    themeDark: 'Dunkler Modus',
    themeToggle: 'Farbschema wechseln',

    navExplore: '3D-Modell',
    navExplode: 'Explosionsansicht',
    navCables: 'Verkabelung',
    navDataFlows: 'Datenflüsse',
    navBoot: 'POST-Start',
    navQuiz: 'Lern-Quiz',
    resetView: 'Ansicht zurücksetzen',
    languageLabel: 'Sprache',

    componentsCount: (c) => `Bauteile (${c})`,
    testPostBoot: 'POST-Start testen',
    disabledCountBanner: (c) => `${c} Bauteil(e) deaktiviert`,
    enableAll: 'Alle aktivieren',
    searchPlaceholder: 'Bauteil suchen...',
    activeFilterLabel: 'Filter',
    statusActive: 'STATUS: AKTIV',
    statusDisabled: 'STATUS: DEAKTIVIERT',
    clickToInspect: 'Klicken →',
    clickForQuizAnswer: 'Klicken zum Antworten',

    categories: {
      Alle: 'Alle',
      Systembasis: 'Systembasis',
      Recheneinheit: 'Recheneinheit',
      Kühlung: 'Kühlung',
      Speicher: 'Speicher',
      'Grafik & KI': 'Grafik & KI',
      Stromversorgung: 'Stromversorgung',
      Massenspeicher: 'Massenspeicher',
      'Mainboard-Bauteil': 'Mainboard-Bauteil',
      Schnittstelle: 'Schnittstelle',
    },

    closePanel: 'Seitenpanel schließen',
    secWhatIsIt: 'Was ist das & wie funktioniert es?',
    secMainTasks: 'Hauptaufgaben',
    secTechSpecs: 'Technische Spezifikationen',
    secCooperation: 'Zusammenarbeit im System',
    isolateBus: 'Datenbus isolieren',
    secMissingEffect: 'Was passiert, wenn sie fehlt?',
    btnReinstallComponent: 'Bauteil wieder einbauen',
    btnSimulateFailure: 'Ausfall im 3D-Modell simulieren',
    secUsecases: 'Praxiseinsatz (Klicken zum Filtern)',
    btnShowDataFlow: 'Datenfluss zeigen',
    btnCablesOn: 'Kabel: An',
    btnCablesOff: 'Kabel: Aus',
    btnAssemble: 'Zusammenbau',
    btnExplode: 'Explosion',

    showControlsKey: 'Steuerung einblenden (H)',
    hideControlsKey: 'Steuerung ausblenden (H)',
    caseOpacityLabel: 'Gehäuse',
    cablesToggleLabel: (on) => `Verkabelung: ${on ? 'An' : 'Aus'}`,
    airflowToggleLabel: (on) => `Luftstrom: ${on ? 'An' : 'Aus'}`,
    thermalToggleLabel: (on) => `Thermik: ${on ? 'An' : 'Aus'}`,
    pinsToggleLabel: (on) => `3D-Pins: ${on ? 'An' : 'Aus'}`,
    isolateToggleLabel: (on) => `360°-Isolation: ${on ? 'An' : 'Aus'}`,
    isolatePartBtn: (on) => (on ? '360°-Isolation beenden' : '360° Einzelteil isolieren'),
    subExplodeBtn: (on) => (on ? 'Bauteil-Schichten schließen' : 'Einzelteil-Explosion (Aufbau)'),
    subPinsToggleBtn: (on) => `3D-Schicht-Pins: ${on ? 'An' : 'Aus'}`,
    subLayerSliderLabel: 'Bauteil-Schichten Explosion',
    busesLabel: 'Busse:',
    busAll: 'Alle',
    busCpuRam: 'CPU ↔ RAM',
    busCpuSsd: 'CPU ↔ SSD',
    busCpuGpu: 'CPU ↔ GPU',
    busGpuMon: 'GPU ↔ Display',
    busPsu: 'Stromversorgung',
    camOverall: 'Gesamt',
    camCooling: 'Kühlung',
    camMainboard: 'Hauptplatine',
    camStorage: 'Speicher',

    postHeader: (st, tot) => `POST-STARTSEQUENZ · SCHRITT ${st} VON ${tot}`,
    prevStep: '← Vorheriger Schritt',
    nextStep: 'Nächster Schritt →',
    finishBoot: 'Start abschließen',

    quizLevel: 'LEVEL',
    quizQuestionProgress: (c, tot) => `Frage ${c} von ${tot}`,
    quizPoints: 'Punkte',
    quizInstruction: 'Klicke direkt im 3D-Modell oder links in der Liste auf das gesuchte Bauteil!',
    quizHideHint: 'Tipp ausblenden',
    quizShowHint: 'Tipp anzeigen',
    quizActivateExplode: 'Verdeckt? Explosionsansicht aktivieren',
    quizHintLabel: 'Hinweis',
    quizCorrectTitle: (n) => `Richtig erkannt! (${n})`,
    quizWrongTitle: (n) => `Fehleranalyse: ${n}`,
    quizWhatYouClicked: 'Was du angeklickt hast',
    quizHintForTarget: 'Tipp für das gesuchte Bauteil',
    quizNextQuestion: 'Nächste Frage',
    quizShowResults: 'Ergebnis anzeigen',
    quizCompletedTitle: 'Lernmodul erfolgreich abgeschlossen!',
    quizCompletedDesc: (tot, sc) => `Du hast alle ${tot} Hardware-Aufgaben gemeistert und ${sc} Punkte erreicht.`,
    quizRestart: 'Quiz neu starten',
    quizBackTo3D: 'Zurück zum 3D-Modell',

    monPostErrorTitle: 'DIAGNOSE · FEHLERSIMULATION AKTIV',
    monMissingCompLabel: 'Fehlendes Bauteil',
    monHintReenable: 'Schalte das Bauteil im Seitenpanel wieder ein, um das System zu starten.',
    monComponentLabel: 'Bauteil',
    monFocusCategory: (cat) => `FOKUS: ${cat.toUpperCase()}`,
    monAllReadyStatus: 'STATUS: ALLE BAUTEILE FUNKTIONSBEREIT',
    monSystemReadyTitle: 'SYSTEM BEREIT & VOLLSTÄNDIG',
    monClickHint: 'Klicke auf ein Bauteil im 3D-Modell für Details.',
  },

  en: {
    appTitle: 'Interactive Hardware Explorer 3D',
    platformPc: 'Desktop PC',
    platformLaptop: 'Laptop',
    platformServer: 'Rack Server',
    platformSmartphone: 'Smartphone',
    platformSubtitlePc: 'Modular ATX Workstation (19 Components)',
    platformSubtitleLaptop: 'Ultrabook & Mobile Workstation (14 Components)',
    platformSubtitleServer: '2U Dual-Socket Datacenter Server (12 Components)',
    platformSubtitleSmartphone: 'Flagship Smartphone Teardown (13 Components)',

    themeLight: 'Light Mode',
    themeDark: 'Dark Mode',
    themeToggle: 'Toggle Theme',

    navExplore: '3D Model',
    navExplode: 'Exploded View',
    navCables: 'Cables',
    navDataFlows: 'Data Flows',
    navBoot: 'POST Boot',
    navQuiz: 'Quiz Mode',
    resetView: 'Reset View',
    languageLabel: 'Language',

    componentsCount: (c) => `Components (${c})`,
    testPostBoot: 'Test POST Boot',
    disabledCountBanner: (c) => `${c} component(s) disabled`,
    enableAll: 'Enable All',
    searchPlaceholder: 'Search components...',
    activeFilterLabel: 'Filter',
    statusActive: 'STATUS: ACTIVE',
    statusDisabled: 'STATUS: DISABLED',
    clickToInspect: 'Click to Inspect →',
    clickForQuizAnswer: 'Click to answer',

    categories: {
      Alle: 'All',
      Systembasis: 'Platform Base',
      Recheneinheit: 'Processing Unit',
      Kühlung: 'Cooling',
      Speicher: 'Memory',
      'Grafik & KI': 'Graphics & AI',
      Stromversorgung: 'Power Delivery',
      Massenspeicher: 'Storage',
      'Mainboard-Bauteil': 'Motherboard Part',
      Schnittstelle: 'Interface',
    },

    closePanel: 'Close Side Panel',
    secWhatIsIt: 'What is it & How does it work?',
    secMainTasks: 'Key Responsibilities',
    secTechSpecs: 'Technical Specifications',
    secCooperation: 'System Cooperation',
    isolateBus: 'Isolate Data Bus',
    secMissingEffect: 'What happens if it fails?',
    btnReinstallComponent: 'Reinstall Component',
    btnSimulateFailure: 'Simulate Failure in 3D',
    secUsecases: 'Real-world Use Cases',
    btnShowDataFlow: 'Show Data Flow',
    btnCablesOn: 'Cables: On',
    btnCablesOff: 'Cables: Off',
    btnAssemble: 'Assemble',
    btnExplode: 'Explode',

    showControlsKey: 'Show Controls (H)',
    hideControlsKey: 'Hide Controls (H)',
    caseOpacityLabel: 'Case',
    cablesToggleLabel: (on) => `Cabling: ${on ? 'On' : 'Off'}`,
    airflowToggleLabel: (on) => `Airflow: ${on ? 'On' : 'Off'}`,
    thermalToggleLabel: (on) => `Thermal: ${on ? 'On' : 'Off'}`,
    pinsToggleLabel: (on) => `3D Pins: ${on ? 'On' : 'Off'}`,
    isolateToggleLabel: (on) => `360° Isolate: ${on ? 'On' : 'Off'}`,
    isolatePartBtn: (on) => (on ? 'Exit 360° Isolation' : 'Isolate Part 360°'),
    subExplodeBtn: (on) => (on ? 'Collapse Part Layers' : 'Explode Part Layers (Anatomy)'),
    subPinsToggleBtn: (on) => `3D Layer Pins: ${on ? 'On' : 'Off'}`,
    subLayerSliderLabel: 'Component Layer Explosion',
    busesLabel: 'Buses:',
    busAll: 'All',
    busCpuRam: 'CPU ↔ RAM',
    busCpuSsd: 'CPU ↔ SSD',
    busCpuGpu: 'CPU ↔ GPU',
    busGpuMon: 'GPU ↔ Display',
    busPsu: 'Power Delivery',
    camOverall: 'Overall',
    camCooling: 'Cooling',
    camMainboard: 'Mainboard',
    camStorage: 'Storage',

    postHeader: (st, tot) => `POST BOOT SEQUENCE · STEP ${st} OF ${tot}`,
    prevStep: '← Previous Step',
    nextStep: 'Next Step →',
    finishBoot: 'Finish Boot',

    quizLevel: 'LEVEL',
    quizQuestionProgress: (c, tot) => `Question ${c} of ${tot}`,
    quizPoints: 'Points',
    quizInstruction: 'Click directly on the target component in the 3D model or in the list!',
    quizHideHint: 'Hide Hint',
    quizShowHint: 'Show Hint',
    quizActivateExplode: 'Obstructed? Activate exploded view',
    quizHintLabel: 'Hint',
    quizCorrectTitle: (n) => `Correct! (${n})`,
    quizWrongTitle: (n) => `Error Analysis: ${n}`,
    quizWhatYouClicked: 'What you clicked',
    quizHintForTarget: 'Hint for the requested part',
    quizNextQuestion: 'Next Question',
    quizShowResults: 'Show Results',
    quizCompletedTitle: 'Learning Module Completed!',
    quizCompletedDesc: (tot, sc) => `You have answered all ${tot} hardware tasks and earned ${sc} points.`,
    quizRestart: 'Restart Quiz',
    quizBackTo3D: 'Back to 3D Model',

    monPostErrorTitle: 'DIAGNOSTICS · FAULT SIMULATION ACTIVE',
    monMissingCompLabel: 'Missing Component',
    monHintReenable: 'Re-enable the component in the side panel to boot the system.',
    monComponentLabel: 'Component',
    monFocusCategory: (cat) => `FOCUS: ${cat.toUpperCase()}`,
    monAllReadyStatus: 'STATUS: ALL COMPONENTS OPERATIONAL',
    monSystemReadyTitle: 'SYSTEM READY & OPERATIONAL',
    monClickHint: 'Click on any component in the 3D model for detailed telemetry.',
  },

  tr: {
    appTitle: 'Interactive Hardware Explorer 3D',
    platformPc: 'Masaüstü PC',
    platformLaptop: 'Dizüstü',
    platformServer: 'Rack Sunucu',
    platformSmartphone: 'Akıllı Telefon',
    platformSubtitlePc: 'Modüler ATX İş İstasyonu (19 Bileşen)',
    platformSubtitleLaptop: 'Ultrabook & Mobil İş İstasyonu (14 Bileşen)',
    platformSubtitleServer: '2U Çift Soketli Veri Merkezi Sunucusu (12 Bileşen)',
    platformSubtitleSmartphone: 'Amiral Gemisi Akıllı Telefon (13 Bileşen)',

    themeLight: 'Açık Tema',
    themeDark: 'Koyu Tema',
    themeToggle: 'Temayı Değiştir',

    navExplore: '3D Model',
    navExplode: 'Patlatılmış Görünüm',
    navCables: 'Kablolama',
    navDataFlows: 'Veri Akışları',
    navBoot: 'POST Başlatma',
    navQuiz: 'Öğrenme Testi',
    resetView: 'Görünümü Sıfırla',
    languageLabel: 'Dil',

    componentsCount: (c) => `Bileşenler (${c})`,
    testPostBoot: 'POST Başlatmayı Test Et',
    disabledCountBanner: (c) => `${c} bileşen devre dışı`,
    enableAll: 'Tümünü Etkinleştir',
    searchPlaceholder: 'Bileşen ara...',
    activeFilterLabel: 'Filtre',
    statusActive: 'DURUM: AKTİF',
    statusDisabled: 'DURUM: DEVRE DIŞI',
    clickToInspect: 'İncelemek için tıkla →',
    clickForQuizAnswer: 'Cevaplamak için tıkla',

    categories: {
      Alle: 'Tümü',
      Systembasis: 'Sistem Temeli',
      Recheneinheit: 'İşlem Birimi',
      Kühlung: 'Soğutma',
      Speicher: 'Bellek',
      'Grafik & KI': 'Grafik ve Yapay Zeka',
      Stromversorgung: 'Güç Kaynağı',
      Massenspeicher: 'Depolama',
      'Mainboard-Bauteil': 'Anakart Bileşeni',
      Schnittstelle: 'Arayüz',
    },

    closePanel: 'Paneli Kapat',
    secWhatIsIt: 'Nedir ve Nasıl Çalışır?',
    secMainTasks: 'Temel Görevler',
    secTechSpecs: 'Teknik Özellikler',
    secCooperation: 'Sistem Uyumu',
    isolateBus: 'Veri Yolunu İzole Et',
    secMissingEffect: 'Eksik Olursa Ne Olur?',
    btnReinstallComponent: 'Bileşeni Geri Tak',
    btnSimulateFailure: '3D Arızayı Simüle Et',
    secUsecases: 'Kullanım Alanları',
    btnShowDataFlow: 'Veri Akışını Göster',
    btnCablesOn: 'Kablo: Açık',
    btnCablesOff: 'Kablo: Kapalı',
    btnAssemble: 'Birleştir',
    btnExplode: 'Patlat',

    showControlsKey: 'Kontrolleri Göster (H)',
    hideControlsKey: 'Kontrolleri Gizle (H)',
    caseOpacityLabel: 'Kasa',
    cablesToggleLabel: (on) => `Kablolama: ${on ? 'Açık' : 'Kapalı'}`,
    airflowToggleLabel: (on) => `Hava Akışı: ${on ? 'Açık' : 'Kapalı'}`,
    thermalToggleLabel: (on) => `Termal: ${on ? 'Açık' : 'Kapalı'}`,
    pinsToggleLabel: (on) => `3D Pinler: ${on ? 'Açık' : 'Kapalı'}`,
    isolateToggleLabel: (on) => `360° İzole: ${on ? 'Açık' : 'Kapalı'}`,
    isolatePartBtn: (on) => (on ? '360° İzolasyondan Çık' : 'Parçayı 360° İzole Et'),
    subExplodeBtn: (on) => (on ? 'Katmanları Birleştir' : 'Parça Katmanlarını Patlat (Yapı)'),
    subPinsToggleBtn: (on) => `3B Katman Pinleri: ${on ? 'Açık' : 'Kapalı'}`,
    subLayerSliderLabel: 'Bileşen Katman Patlatma',
    busesLabel: 'Yollar:',
    busAll: 'Tümü',
    busCpuRam: 'CPU ↔ RAM',
    busCpuSsd: 'CPU ↔ SSD',
    busCpuGpu: 'CPU ↔ GPU',
    busGpuMon: 'GPU ↔ Ekran',
    busPsu: 'Güç Hattı',
    camOverall: 'Genel',
    camCooling: 'Soğutma',
    camMainboard: 'Anakart',
    camStorage: 'Depolama',

    postHeader: (st, tot) => `POST BAŞLATMA · ADIM ${st} / ${tot}`,
    prevStep: '← Önceki Adım',
    nextStep: 'Sonraki Adım →',
    finishBoot: 'Başlatmayı Bitir',

    quizLevel: 'SEVİYE',
    quizQuestionProgress: (c, tot) => `Soru ${c} / ${tot}`,
    quizPoints: 'Puan',
    quizInstruction: 'İstenen bileşene doğrudan 3D modelden veya listeden tıkla!',
    quizHideHint: 'İpucunu Gizle',
    quizShowHint: 'İpucunu Göster',
    quizActivateExplode: 'Görünmüyor mu? Patlatılmış görünümü aç',
    quizHintLabel: 'İpucu',
    quizCorrectTitle: (n) => `Doğru! (${n})`,
    quizWrongTitle: (n) => `Hata Analizi: ${n}`,
    quizWhatYouClicked: 'Tıkladığın bileşen',
    quizHintForTarget: 'Aranan bileşen için ipucu',
    quizNextQuestion: 'Sonraki Soru',
    quizShowResults: 'Sonuçları Göster',
    quizCompletedTitle: 'Modül Başarıyla Tamamlandı!',
    quizCompletedDesc: (tot, sc) => `Tüm ${tot} soruyu yanıtladın ve ${sc} puan kazandın.`,
    quizRestart: 'Testi Yeniden Başlat',
    quizBackTo3D: '3D Modele Dön',

    monPostErrorTitle: 'TEŞHİS · ARIZA SİMÜLASYONU AKTİF',
    monMissingCompLabel: 'Eksik Bileşen',
    monHintReenable: 'Sistemi başlatmak için yan panelden bileşeni geri takın.',
    monComponentLabel: 'Bileşen',
    monFocusCategory: (cat) => `ODAK: ${cat.toUpperCase()}`,
    monAllReadyStatus: 'DURUM: TÜM BİLEŞENLER ÇALIŞIYOR',
    monSystemReadyTitle: 'SİSTEM HAZIR VE TAM',
    monClickHint: 'Ayrıntılar için 3D modeldeki bir bileşene tıklayın.',
  },

  ro: {
    appTitle: 'Interactive Hardware Explorer 3D',
    platformPc: 'PC Desktop',
    platformLaptop: 'Laptop',
    platformServer: 'Server Rack',
    platformSmartphone: 'Smartphone',
    platformSubtitlePc: 'Stație de Lucru Modulară ATX (19 Componente)',
    platformSubtitleLaptop: 'Ultrabook & Stație Mobilă (14 Componente)',
    platformSubtitleServer: 'Server Datacenter 2U Dual-Socket (12 Componente)',
    platformSubtitleSmartphone: 'Smartphone Flagship Teardown (13 Componente)',

    themeLight: 'Mod Luminos',
    themeDark: 'Mod Întunecat',
    themeToggle: 'Comută Tema',

    navExplore: 'Model 3D',
    navExplode: 'Vedere Explodată',
    navCables: 'Cablaj',
    navDataFlows: 'Fluxuri Date',
    navBoot: 'Pornire POST',
    navQuiz: 'Test & Învățare',
    resetView: 'Resetează Vederea',
    languageLabel: 'Limbă',

    componentsCount: (c) => `Componente (${c})`,
    testPostBoot: 'Testează POST',
    disabledCountBanner: (c) => `${c} componente dezactivate`,
    enableAll: 'Activează Toate',
    searchPlaceholder: 'Caută componente...',
    activeFilterLabel: 'Filtru',
    statusActive: 'STATUS: ACTIV',
    statusDisabled: 'STATUS: DEZACTIVAT',
    clickToInspect: 'Click pentru detalii →',
    clickForQuizAnswer: 'Click pentru a răspunde',

    categories: {
      Alle: 'Toate',
      Systembasis: 'Baza Sistemului',
      Recheneinheit: 'Unitate de Calcul',
      Kühlung: 'Răcire',
      Speicher: 'Memorie',
      'Grafik & KI': 'Grafică și AI',
      Stromversorgung: 'Alimentare',
      Massenspeicher: 'Stocare',
      'Mainboard-Bauteil': 'Piesă Placă de Bază',
      Schnittstelle: 'Interfață',
    },

    closePanel: 'Închide Panoul',
    secWhatIsIt: 'Ce este și cum funcționează?',
    secMainTasks: 'Sarcini Principale',
    secTechSpecs: 'Specificații Tehnice',
    secCooperation: 'Cooperare în Sistem',
    isolateBus: 'Izolează Magistrala',
    secMissingEffect: 'Ce se întâmplă dacă lipsește?',
    btnReinstallComponent: 'Reinstalează Componenta',
    btnSimulateFailure: 'Simulează Defecțiunea în 3D',
    secUsecases: 'Utilizare Practică',
    btnShowDataFlow: 'Arată Fluxul de Date',
    btnCablesOn: 'Cabluri: Pornit',
    btnCablesOff: 'Cabluri: Oprit',
    btnAssemble: 'Asamblează',
    btnExplode: 'Explodează',

    showControlsKey: 'Afișează Controale (H)',
    hideControlsKey: 'Ascunde Controale (H)',
    caseOpacityLabel: 'Carcasă',
    cablesToggleLabel: (on) => `Cabluri: ${on ? 'Pornit' : 'Oprit'}`,
    airflowToggleLabel: (on) => `Flux Aer: ${on ? 'Pornit' : 'Oprit'}`,
    thermalToggleLabel: (on) => `Termic: ${on ? 'Pornit' : 'Oprit'}`,
    pinsToggleLabel: (on) => `Pinuri 3D: ${on ? 'Pornit' : 'Oprit'}`,
    isolateToggleLabel: (on) => `Izolare 360°: ${on ? 'Pornit' : 'Oprit'}`,
    isolatePartBtn: (on) => (on ? 'Ieși din Izolare 360°' : 'Izolează Piesa 360°'),
    subExplodeBtn: (on) => (on ? 'Închide Straturile Piesei' : 'Explodează Straturile Piesei'),
    subPinsToggleBtn: (on) => `Pinuri Straturi 3D: ${on ? 'Pornit' : 'Oprit'}`,
    subLayerSliderLabel: 'Explozie Straturi Componentă',
    busesLabel: 'Magistrale:',
    busAll: 'Toate',
    busCpuRam: 'CPU ↔ RAM',
    busCpuSsd: 'CPU ↔ SSD',
    busCpuGpu: 'CPU ↔ GPU',
    busGpuMon: 'GPU ↔ Ecran',
    busPsu: 'Alimentare',
    camOverall: 'General',
    camCooling: 'Răcire',
    camMainboard: 'Placă Bază',
    camStorage: 'Stocare',

    postHeader: (st, tot) => `SECVENȚĂ POST · PASUL ${st} DIN ${tot}`,
    prevStep: '← Pasul Anterior',
    nextStep: 'Pasul Următor →',
    finishBoot: 'Finalizează Pornirea',

    quizLevel: 'NIVEL',
    quizQuestionProgress: (c, tot) => `Întrebarea ${c} din ${tot}`,
    quizPoints: 'Puncte',
    quizInstruction: 'Fă click direct pe componenta căutată în modelul 3D sau în listă!',
    quizHideHint: 'Ascunde Indiciu',
    quizShowHint: 'Arată Indiciu',
    quizActivateExplode: 'Ascuns? Activează vederea explodată',
    quizHintLabel: 'Indiciu',
    quizCorrectTitle: (n) => `Corect! (${n})`,
    quizWrongTitle: (n) => `Analiză Eroare: ${n}`,
    quizWhatYouClicked: 'Ce ai selectat',
    quizHintForTarget: 'Indiciu pentru piesa căutată',
    quizNextQuestion: 'Următoarea Întrebare',
    quizShowResults: 'Arată Rezultate',
    quizCompletedTitle: 'Modul Finalizat cu Succes!',
    quizCompletedDesc: (tot, sc) => `Ai rezolvat toate cele ${tot} întrebări și ai obținut ${sc} puncte.`,
    quizRestart: 'Reîncepe Testul',
    quizBackTo3D: 'Înapoi la Modelul 3D',

    monPostErrorTitle: 'DIAGNOSTIC · SIMULARE EROARE ACTIVĂ',
    monMissingCompLabel: 'Componentă Lipsă',
    monHintReenable: 'Reactivează componenta din panoul lateral pentru a porni sistemul.',
    monComponentLabel: 'Componentă',
    monFocusCategory: (cat) => `FOCUS: ${cat.toUpperCase()}`,
    monAllReadyStatus: 'STATUS: TOATE COMPONENTELE OPERAȚIONALE',
    monSystemReadyTitle: 'SISTEM PREGĂTIT ȘI COMPLET',
    monClickHint: 'Fă click pe orice componentă din modelul 3D pentru detalii.',
  },

  ar: {
    appTitle: 'Interactive Hardware Explorer 3D',
    platformPc: 'حاسوب مكتبي',
    platformLaptop: 'حاسوب محمول',
    platformServer: 'خادم شبكي (سيرفر)',
    platformSmartphone: 'هاتف ذكي',
    platformSubtitlePc: 'محطة عمل قياسية ATX (19 مكوناً)',
    platformSubtitleLaptop: 'محمول فائق الأداء (14 مكوناً)',
    platformSubtitleServer: 'خادم مركز بيانات 2U ثنائي المعالجات (12 مكوناً)',
    platformSubtitleSmartphone: 'هاتف رائد مفكك بالكامل (13 مكوناً)',

    themeLight: 'الوضع الفاتح',
    themeDark: 'الوضع الداكن',
    themeToggle: 'تبديل المظهر',

    navExplore: 'النموذج ثلاثي الأبعاد',
    navExplode: 'تفكيك الأجزاء',
    navCables: 'الكابلات',
    navDataFlows: 'مسارات البيانات',
    navBoot: 'تسلسل التشغيل POST',
    navQuiz: 'اختبار التعلم',
    resetView: 'إعادة ضبط المشهد',
    languageLabel: 'اللغة',

    componentsCount: (c) => `المكونات (${c})`,
    testPostBoot: 'اختبار إقلاع POST',
    disabledCountBanner: (c) => `${c} مكونات معطلة`,
    enableAll: 'تفعيل الكل',
    searchPlaceholder: 'البحث عن مكون...',
    activeFilterLabel: 'تصفية',
    statusActive: 'الحالة: نشط',
    statusDisabled: 'الحالة: معطل',
    clickToInspect: 'انقر للفحص ←',
    clickForQuizAnswer: 'انقر للإجابة',

    categories: {
      Alle: 'الكل',
      Systembasis: 'أساس النظام',
      Recheneinheit: 'وحدة المعالجة',
      Kühlung: 'التبريد',
      Speicher: 'الذاكرة العشوائية',
      'Grafik & KI': 'الرسوميات والذكاء الاصطناعي',
      Stromversorgung: 'إمداد الطاقة',
      Massenspeicher: 'التخزين',
      'Mainboard-Bauteil': 'مكونات اللوحة الأم',
      Schnittstelle: 'المنافذ والواجهات',
    },

    closePanel: 'إغلاق اللوحة الجانبية',
    secWhatIsIt: 'ما هذا وكيف يعمل؟',
    secMainTasks: 'المهام الرئيسية',
    secTechSpecs: 'المواصفات التقنية',
    secCooperation: 'التكامل مع النظام',
    isolateBus: 'عزل مسار البيانات',
    secMissingEffect: 'ماذا يحدث إذا تعطل؟',
    btnReinstallComponent: 'إعادة تركيب المكون',
    btnSimulateFailure: 'محاكاة العطل في 3D',
    secUsecases: 'الاستخدامات الواقعية',
    btnShowDataFlow: 'عرض تدفق البيانات',
    btnCablesOn: 'الكابلات: مفعلة',
    btnCablesOff: 'الكابلات: معطلة',
    btnAssemble: 'تجميع',
    btnExplode: 'تفكيك',

    showControlsKey: 'إظهار شريط التحكم (H)',
    hideControlsKey: 'إخفاء شريط التحكم (H)',
    caseOpacityLabel: 'الهيكل',
    cablesToggleLabel: (on) => `الكابلات: ${on ? 'مفعلة' : 'معطلة'}`,
    airflowToggleLabel: (on) => `تدفق الهواء: ${on ? 'مفعل' : 'معطل'}`,
    thermalToggleLabel: (on) => `الحرارة: ${on ? 'مفعل' : 'معطل'}`,
    pinsToggleLabel: (on) => `دبابيس 3D: ${on ? 'مفعلة' : 'معطلة'}`,
    isolateToggleLabel: (on) => `عزل 360°: ${on ? 'مفعل' : 'معطل'}`,
    isolatePartBtn: (on) => (on ? 'إنهاء العزل 360°' : 'عزل المكون 360°'),
    subExplodeBtn: (on) => (on ? 'طي طبقات المكون' : 'تفكيك طبقات المكون (التركيب الداخلي)'),
    subPinsToggleBtn: (on) => `دبابيس الطبقات 3D: ${on ? 'مفعلة' : 'معطلة'}`,
    subLayerSliderLabel: 'تفكيك طبقات المكون',
    busesLabel: 'المسارات:',
    busAll: 'الكل',
    busCpuRam: 'المعالج ↔ الرام',
    busCpuSsd: 'المعالج ↔ التخزين',
    busCpuGpu: 'المعالج ↔ الرسوميات',
    busGpuMon: 'الرسوميات ↔ الشاشة',
    busPsu: 'تغذية الطاقة',
    camOverall: 'عام',
    camCooling: 'التبريد',
    camMainboard: 'اللوحة الأم',
    camStorage: 'التخزين',

    postHeader: (st, tot) => `تسلسل التشغيل POST · الخطوة ${st} من ${tot}`,
    prevStep: 'الخطوة السابقة',
    nextStep: 'الخطوة التالية',
    finishBoot: 'إتمام التشغيل',

    quizLevel: 'المستوى',
    quizQuestionProgress: (c, tot) => `السؤال ${c} من ${tot}`,
    quizPoints: 'النقاط',
    quizInstruction: 'انقر مباشرة على المكون المطلوب في النموذج ثلاثي الأبعاد أو من القائمة!',
    quizHideHint: 'إخفاء التلميح',
    quizShowHint: 'إظهار التلميح',
    quizActivateExplode: 'محجوب؟ فعّل تفكيك الأجزاء',
    quizHintLabel: 'تلميح',
    quizCorrectTitle: (n) => `إجابة صحيحة! (${n})`,
    quizWrongTitle: (n) => `تحليل الخطأ: ${n}`,
    quizWhatYouClicked: 'ما قمت بالنقر عليه',
    quizHintForTarget: 'تلميح للمكون المطلوب',
    quizNextQuestion: 'السؤال التالي',
    quizShowResults: 'عرض النتيجة',
    quizCompletedTitle: 'تم إكمال الوحدة التعليمية بنجاح!',
    quizCompletedDesc: (tot, sc) => `لقد أجبت على جميع الأسئلة الـ ${tot} وحققت ${sc} نقطة.`,
    quizRestart: 'إعادة الاختبار',
    quizBackTo3D: 'العودة إلى النموذج',

    monPostErrorTitle: 'التشخيص · محاكاة العطل مفعلة',
    monMissingCompLabel: 'المكون المفقود',
    monHintReenable: 'أعد تفعيل المكون من اللوحة الجانبية لتشغيل النظام.',
    monComponentLabel: 'المكون',
    monFocusCategory: (cat) => `التركيز: ${cat.toUpperCase()}`,
    monAllReadyStatus: 'الحالة: جميع المكونات تعمل بشكل سليم',
    monSystemReadyTitle: 'النظام جاهز ومكتمل',
    monClickHint: 'انقر على أي مكون في النموذج لعرض التفاصيل.',
  },
};

export function getLocalizedBootSequence(locale: Locale): LocalizedBootStep[] {
  const map: Record<Locale, LocalizedBootStep[]> = {
    de: [
      {
        step: 1,
        title: '1. Startsignal (Power-Button)',
        componentId: 'front_panel',
        detail: 'Durch Drücken des Startknopfs werden die PWR_SW-Pins am Front-Panel-Header überbrückt und wecken das Mainboard.',
      },
      {
        step: 2,
        title: '2. Netzteil-Aktivierung (Power Good)',
        componentId: 'psu',
        detail: 'Das Netzteil schaltet die +12V-, +5V- und +3,3V-Schienen frei und meldet „Power Good“ an Hauptplatine und CPU.',
      },
      {
        step: 3,
        title: '3. UEFI/BIOS & CMOS-Initialisierung',
        componentId: 'bios_chip',
        detail: 'Die CPU liest den ersten Firmware-Befehl aus dem BIOS-Flash-Chip und lädt die gespeicherten CMOS-Parameter.',
      },
      {
        step: 4,
        title: '4. CPU & DDR5-RAM Training (POST)',
        componentId: 'ram',
        detail: 'Der Power-On Self-Test prüft Prozessorkerne und trainiert die Taktraten des Dual-Channel DDR5-Arbeitsspeichers.',
      },
      {
        step: 5,
        title: '5. Grafikkarte & Video-Initialisierung',
        componentId: 'gpu',
        detail: 'Über den PCIe 5.0 x16 Bus wird die Grafikkarte initialisiert und gibt das Startbild aus.',
      },
      {
        step: 6,
        title: '6. NVMe Bootloader & Betriebssystem',
        componentId: 'nvme',
        detail: 'Das UEFI übergibt die Kontrolle an den Bootloader auf der M.2 NVMe SSD – das Betriebssystem wird in den RAM geladen.',
      },
    ],
    en: [
      {
        step: 1,
        title: '1. Power Signal (Front Panel Header)',
        componentId: 'front_panel',
        detail: 'Pressing the case power button bridges the PWR_SW pins on the front-panel header, signaling the motherboard to wake.',
      },
      {
        step: 2,
        title: '2. PSU Activation (Power Good)',
        componentId: 'psu',
        detail: 'The power supply stabilizes +12V, +5V, and +3.3V rails and sends the PWR_OK signal to the motherboard.',
      },
      {
        step: 3,
        title: '3. UEFI/BIOS & CMOS Initialization',
        componentId: 'bios_chip',
        detail: 'The CPU fetches its initial reset vector from the SPI BIOS flash chip and loads hardware settings.',
      },
      {
        step: 4,
        title: '4. CPU & DDR5 Memory Training (POST)',
        componentId: 'ram',
        detail: 'Power-On Self-Test verifies CPU cores and trains the Dual-Channel DDR5 memory timings.',
      },
      {
        step: 5,
        title: '5. PCIe GPU & Video Output Init',
        componentId: 'gpu',
        detail: 'The graphics card is initialized over the PCIe 5.0 x16 bus and outputs the POST boot screen.',
      },
      {
        step: 6,
        title: '6. NVMe OS Bootloader Handover',
        componentId: 'nvme',
        detail: 'UEFI hands control to the EFI boot partition on the M.2 NVMe SSD, loading the OS kernel into RAM.',
      },
    ],
    tr: [
      {
        step: 1,
        title: '1. Güç Sinyali (Ön Panel Bağlantısı)',
        componentId: 'front_panel',
        detail: 'Kasa güç düğmesine basıldığında F_PANEL üzerindeki PWR_SW pinleri kısa devre olur ve anakartı uyandırır.',
      },
      {
        step: 2,
        title: '2. Güç Kaynağı Aktivasyonu (Power Good)',
        componentId: 'psu',
        detail: 'PSU +12V, +5V ve +3.3V hatlarını dengeler ve anakarta Power Good (PWR_OK) sinyali gönderir.',
      },
      {
        step: 3,
        title: '3. UEFI/BIOS ve CMOS Başlatma',
        componentId: 'bios_chip',
        detail: 'İşlemci ilk komutları SPI BIOS çipinden okur ve CMOS ayarlarını yükler.',
      },
      {
        step: 4,
        title: '4. İşlemci ve DDR5 Bellek Eğitimi (POST)',
        componentId: 'ram',
        detail: 'POST testi işlemci çekirdeklerini ve çift kanal DDR5 RAM zamanlamalarını kontrol eder.',
      },
      {
        step: 5,
        title: '5. Ekran Kartı ve Görüntü Çıkışı',
        componentId: 'gpu',
        detail: 'PCIe 5.0 x16 veri yolu üzerinden ekran kartı başlatılır ve başlangıç ekranı verilir.',
      },
      {
        step: 6,
        title: '6. NVMe Önyükleyici ve İşletim Sistemi',
        componentId: 'nvme',
        detail: 'UEFI kontrolü M.2 NVMe SSD üzerindeki önyükleyiciye devreder ve işletim sistemi RAM belleğe yüklenir.',
      },
    ],
    ro: [
      {
        step: 1,
        title: '1. Semnal Pornire (Front Panel Header)',
        componentId: 'front_panel',
        detail: 'Apăsarea butonului Power unește pinii PWR_SW pe conectorul F_PANEL și trezește placa de bază.',
      },
      {
        step: 2,
        title: '2. Activare Sursă (Power Good)',
        componentId: 'psu',
        detail: 'Sursa stabilizează liniile de +12V, +5V și +3.3V și trimite semnalul Power Good către placa de bază.',
      },
      {
        step: 3,
        title: '3. Inițializare UEFI/BIOS și CMOS',
        componentId: 'bios_chip',
        detail: 'Procesorul citește primele instrucțiuni din cipul BIOS Flash și încarcă parametrii CMOS.',
      },
      {
        step: 4,
        title: '4. Autotestare CPU și Memorie DDR5 (POST)',
        componentId: 'ram',
        detail: 'Testul POST verifică nucleele procesorului și calibrează frecvențele memoriei RAM DDR5 Dual-Channel.',
      },
      {
        step: 5,
        title: '5. Inițializare Placă Video (GPU)',
        componentId: 'gpu',
        detail: 'Placa grafică este inițializată pe magistrala PCIe 5.0 x16 și transmite semnalul video.',
      },
      {
        step: 6,
        title: '6. Bootloader NVMe și Sistem de Operare',
        componentId: 'nvme',
        detail: 'UEFI predă controlul bootloader-ului de pe SSD-ul M.2 NVMe, încărcând sistemul de operare în RAM.',
      },
    ],
    ar: [
      {
        step: 1,
        title: '1. إشارة التشغيل (مقبس اللوحة الأمامية)',
        componentId: 'front_panel',
        detail: 'الضغط على زر التشغيل يوصل دبابيس PWR_SW في اللوحة الأمامية ويرسل إشارة البدء للوحة الأم.',
      },
      {
        step: 2,
        title: '2. تفعيل مزود الطاقة (Power Good)',
        componentId: 'psu',
        detail: 'يقوم مزود الطاقة بتثبيت خطوط +12V و+5V و+3.3V وإرسال إشارة استقرار الطاقة للوحة الأم.',
      },
      {
        step: 3,
        title: '3. تهيئة رقاقة UEFI/BIOS والـ CMOS',
        componentId: 'bios_chip',
        detail: 'يقرأ المعالج التعليمات البرمجية الأولى من رقاقة BIOS ويحمل إعدادات النظام المحفوظة.',
      },
      {
        step: 4,
        title: '4. الفحص الذاتي للمعالج والذاكرة (POST)',
        componentId: 'ram',
        detail: 'يختبر نظام POST أنوية المعالج ويضبط توقيتات ذاكرة DDR5 العشوائية ثنائية القناة.',
      },
      {
        step: 5,
        title: '5. تهيئة بطاقة الرسوميات وإخراج الفيديو',
        componentId: 'gpu',
        detail: 'تتم تهيئة بطاقة الرسوميات عبر مسار PCIe 5.0 x16 لإرسال إشارة الصورة إلى الشاشة.',
      },
      {
        step: 6,
        title: '6. محمل الإقلاع NVMe ونظام التشغيل',
        componentId: 'nvme',
        detail: 'يسلم UEFI التحكم إلى قرص M.2 NVMe السريع لتحميل نواة نظام التشغيل في الذاكرة العشوائية.',
      },
    ],
  };

  return map[locale] || map.de;
}

export function getLocalizedQuizQuestions(locale: Locale): QuizQuestion[] {
  if (locale === 'de') return QUIZ_QUESTIONS;

  const trMap: Record<Exclude<Locale, 'de'>, QuizQuestion[]> = {
    en: [
      { id: 1, level: 1, levelTitle: 'Core Fundamentals', question: 'Which component is known as the "brain" of the computer and executes billions of instructions per second?', targetId: 'cpu', hint: 'It sits in the center processor socket directly underneath the circular AIO pump block.', contextNote: 'The CPU (Central Processing Unit) processes machine instructions and coordinates all system buses.' },
      { id: 2, level: 1, levelTitle: 'Core Fundamentals', question: 'Where is the ultra-fast volatile working memory (RAM) for currently running programs located?', targetId: 'ram', hint: 'Look for the four vertical modules with illuminated bars to the right of the CPU.', contextNote: 'RAM holds active data for nanosecond CPU access, but loses its contents when powered off.' },
      { id: 3, level: 1, levelTitle: 'Core Fundamentals', question: 'Which component renders complex 3D worlds, ray tracing, and AI models?', targetId: 'gpu', hint: 'The largest horizontally mounted expansion card in the center of the case.', contextNote: 'The GPU features thousands of parallel shader cores and dedicated high-speed GDDR6X VRAM.' },
      { id: 4, level: 1, levelTitle: 'Core Fundamentals', question: 'Which component converts AC wall power into stabilized DC rails (+12V, +5V, +3.3V) for all parts?', targetId: 'psu', hint: 'The large rectangular unit in the bottom-left chamber of the PC case.', contextNote: 'The Power Supply Unit (PSU) powers the entire workstation and protects against short circuits.' },
      { id: 5, level: 2, levelTitle: 'Storage & Cooling', question: 'Which ultra-fast storage drive mounts flat directly onto the motherboard between the CPU and GPU?', targetId: 'nvme', hint: 'A slim horizontal module screwed directly onto the motherboard above the graphics card.', contextNote: 'An M.2 NVMe SSD connects directly via PCIe lanes to the CPU, reaching over 7,000 MB/s.' },
      { id: 6, level: 2, levelTitle: 'Storage & Cooling', question: 'Click on the small silver coin-cell battery that preserves system time and CMOS settings!', targetId: 'cmos_battery', hint: 'A round silver disc (CR2032) on the left side of the motherboard.', contextNote: 'Without the CMOS battery, the motherboard forgets the real-time clock when unplugged.' },
      { id: 7, level: 2, levelTitle: 'Storage & Cooling', question: 'Which storage device uses spinning magnetic platters for high-capacity data archiving?', targetId: 'hdd', hint: 'Located in the lower-right drive bay at the same level as the power supply.', contextNote: 'The 3.5-inch HDD stores data magnetically on platters spinning at 7,200 RPM.' },
      { id: 8, level: 2, levelTitle: 'Storage & Cooling', question: 'Which top-mounted component dissipates liquid-transferred CPU heat through fine aluminum fins?', targetId: 'water_cooling', hint: 'The wide radiator with dual fans and braided hoses mounted at the top of the case.', contextNote: 'The AIO radiator provides a massive surface area of louvered fins for heat dissipation.' },
      { id: 9, level: 3, levelTitle: 'Motherboard Architecture', question: 'Where are the front-panel headers without which the case power button cannot start the PC?', targetId: 'front_panel', hint: 'A pin header block at the bottom-right edge of the motherboard.', contextNote: 'Pressing the case power button briefly bridges two pins on the F_PANEL header.' },
      { id: 10, level: 3, levelTitle: 'Motherboard Architecture', question: 'Which chip on the motherboard stores the UEFI startup firmware and executes POST?', targetId: 'bios_chip', hint: 'A small square IC with 8 silver pins in the lower-middle section of the motherboard.', contextNote: 'The BIOS/UEFI flash chip initializes all hardware before the OS bootloader takes over.' },
      { id: 11, level: 3, levelTitle: 'Motherboard Architecture', question: 'Which power receptacles supply energy to the motherboard (24-Pin) and CPU (8-Pin)?', targetId: 'power_connectors', hint: 'Look at the tall multi-pin socket on the right outer edge of the motherboard.', contextNote: 'Both the 24-Pin ATX and 8-Pin EPS connectors must be plugged in for the system to boot.' },
      { id: 12, level: 3, levelTitle: 'Motherboard Architecture', question: 'Which specialized chip converts digital audio signals into analog sound next to golden capacitors?', targetId: 'audio_chip', hint: 'Located at the bottom-left corner of the motherboard next to four gold capacitors.', contextNote: 'The Realtek Audio Codec (DAC) is electrically isolated to prevent electromagnetic interference.' },
    ],
    tr: [
      { id: 1, level: 1, levelTitle: 'Temel Bileşenler', question: 'Bilgisayarın "beyni" olarak bilinen ve saniyede milyarlarca hesaplama yapan bileşen hangisidir?', targetId: 'cpu', hint: 'Yuvarlak sıvı soğutma pompasının hemen altında, anakartın ortasındaki sokette yer alır.', contextNote: 'İşlemci (CPU) tüm makine komutlarını işler ve veri yollarını yönetir.' },
      { id: 2, level: 1, levelTitle: 'Temel Bileşenler', question: 'Açık programlar için kullanılan ultra hızlı geçici çalışma belleği (RAM) nerededir?', targetId: 'ram', hint: 'İşlemcinin sağ tarafındaki ışıklı dört dikey bellek modülüne bakın.', contextNote: 'RAM aktif verileri nanosaniye hızında işlemciye sunar ancak güç kesildiğinde silinir.' },
      { id: 3, level: 1, levelTitle: 'Temel Bileşenler', question: 'Karmaşık 3D dünyaları, ışın izlemeyi (Ray Tracing) ve yapay zeka modellerini işleyen bileşen hangisidir?', targetId: 'gpu', hint: 'Kasanın ortasında yatay olarak monte edilmiş en büyük genişletme kartı.', contextNote: 'Ekran kartı (GPU) binlerce paralel çekirdeğe ve hızlı GDDR6X video belleğine sahiptir.' },
      { id: 4, level: 1, levelTitle: 'Temel Bileşenler', question: 'Şebeke elektriğini tüm parçalar için dengeli doğru akıma (+12V, +5V, +3.3V) dönüştüren bileşen hangisidir?', targetId: 'psu', hint: 'Kasanın sol alt bölmesindeki büyük dikdörtgen güç ünitesi.', contextNote: 'Güç kaynağı (PSU) tüm sistemi besler ve kısa devre koruması sağlar.' },
      { id: 5, level: 2, levelTitle: 'Depolama ve Soğutma', question: 'İşlemci ile ekran kartı arasında doğrudan anakarta düz olarak vidalanan ultra hızlı SSD hangisidir?', targetId: 'nvme', hint: 'Ekran kartının hemen üstünde anakarta yatay monte edilmiş ince modül.', contextNote: 'M.2 NVMe SSD, PCIe hatları üzerinden doğrudan işlemciye bağlanır ve 7.000 MB/sn hızı aşar.' },
      { id: 6, level: 2, levelTitle: 'Depolama ve Soğutma', question: 'Bilgisayar fişten çekildiğinde sistem saatini ve BIOS ayarlarını koruyan küçük pil hangisidir?', targetId: 'cmos_battery', hint: 'Anakartın sol tarafındaki parlak gümüş yuvarlak düğme pil (CR2032).', contextNote: 'CMOS pili olmadan anakart elektrik kesildiğinde saat ve BIOS ayarlarını sıfırlar.' },
      { id: 7, level: 2, levelTitle: 'Depolama ve Soğutma', question: 'Büyük veri arşivleri için dönen manyetik plakalar kullanan depolama birimi hangisidir?', targetId: 'hdd', hint: 'Kasanın sağ alt kısmında, güç kaynağı ile aynı hizada bulunan sürücü.', contextNote: '3.5 inç mekanik sabit disk (HDD) verileri 7200 RPM hızında dönen plakalara yazar.' },
      { id: 8, level: 2, levelTitle: 'Depolama ve Soğutma', question: 'Sıvı ile taşınan işlemci ısısını ince alüminyum kanatçıklarla dışarı atan üst bileşen hangisidir?', targetId: 'water_cooling', hint: 'Kasanın en üst kısmındaki iki fanlı ve örgülü hortumlu geniş radyatör.', contextNote: 'AIO sıvı soğutma radyatörü geniş yüzey alanı sayesinde yüksek ısıyı hızla uzaklaştırır.' },
      { id: 9, level: 3, levelTitle: 'Anakart Mimarisi', question: 'Kasa açma düğmesinin çalışması için kabloların takıldığı ön panel pinleri nerededir?', targetId: 'front_panel', hint: 'Anakartın sağ alt köşesindeki mavi/altın pin bloğu.', contextNote: 'Güç düğmesine basıldığında F_PANEL üzerindeki iki pin kısa devre edilerek başlatma sinyali verilir.' },
      { id: 10, level: 3, levelTitle: 'Anakart Mimarisi', question: 'UEFI başlangıç yazılımını barındıran ve açılışta POST testini yürüten çip hangisidir?', targetId: 'bios_chip', hint: 'Anakartın alt-orta kısmındaki 8 bacaklı küçük kare çip.', contextNote: 'BIOS/UEFI çipi işletim sistemi başlamadan önce tüm donanımı başlatır.' },
      { id: 11, level: 3, levelTitle: 'Anakart Mimarisi', question: 'Anakarta (24-Pin) ve işlemciye (8-Pin) ana elektriği sağlayan güç soketleri nerededir?', targetId: 'power_connectors', hint: 'Anakartın sağ dış kenarındaki uzun 24-pinli güç soketine tıklayın.', contextNote: 'Sistemin açılması için hem 24-Pin ATX hem de 8-Pin EPS güç kabloları takılı olmalıdır.' },
      { id: 12, level: level3Title(), levelTitle: 'Anakart Mimarisi', question: 'Dijital ses verilerini kulaklık ve hoparlör için analog sinyale çeviren ses çipi hangisidir?', targetId: 'audio_chip', hint: 'Anakartın sol alt köşesinde dört altın kapasitörün yanındaki çip.', contextNote: 'Ses kodek çipi paraziti önlemek için anakart üzerinde özel olarak yalıtılmıştır.' },
    ],
    ro: [
      { id: 1, level: 1, levelTitle: 'Componente de Bază', question: 'Care componentă este numită „creierul” calculatorului și execută miliarde de calcule pe secundă?', targetId: 'cpu', hint: 'Se află în soclul central de pe placa de bază, chiar sub blocul rotund al pompei AIO.', contextNote: 'Procesorul (CPU) execută instrucțiunile programelor și coordonează întregul sistem.' },
      { id: 2, level: 1, levelTitle: 'Componente de Bază', question: 'Unde se află memoria de lucru ultra-rapidă (RAM) pentru programele deschise?', targetId: 'ram', hint: 'Caută cele patru module verticale iluminate în dreapta procesorului.', contextNote: 'Memoria RAM oferă date procesorului în nanosecunde, dar își pierde conținutul la oprire.' },
      { id: 3, level: 1, levelTitle: 'Componente de Bază', question: 'Care componentă procesează lumi 3D complexe, Ray Tracing și modele AI?', targetId: 'gpu', hint: 'Cea mai mare placă montată orizontal în centrul carcasei.', contextNote: 'Placa video (GPU) dispune de mii de nuclee paralele și memorie rapidă GDDR6X.' },
      { id: 4, level: 1, levelTitle: 'Componente de Bază', question: 'Ce componentă transformă curentul alternativ de la priză în curent continuu stabil (+12V, +5V, +3.3V)?', targetId: 'psu', hint: 'Blocul dreptunghiular mare din partea stângă-jos a carcasei.', contextNote: 'Sursa de alimentare (PSU) alimentează toate piesele și protejează împotriva scurtcircuitelor.' },
      { id: 5, level: 2, levelTitle: 'Stocare și Răcire', question: 'Care unitate de stocare ultra-rapidă se montează plat direct pe placa de bază?', targetId: 'nvme', hint: 'Se află pe placa de bază, exact între zona procesorului și placa video.', contextNote: 'Un SSD M.2 NVMe comunică direct cu procesorul prin magistrale PCIe la peste 7.000 MB/s.' },
      { id: 6, level: 2, levelTitle: 'Stocare și Răcire', question: 'Fă click pe bateria rotundă argintie care păstrează ora și setările BIOS-ului!', targetId: 'cmos_battery', hint: 'Un disc rotund argintiu (CR2032) în partea stângă a plăcii de bază.', contextNote: 'Fără bateria CMOS, placa de bază pierde data și profilurile BIOS când este scoasă din priză.' },
      { id: 7, level: 2, levelTitle: 'Stocare și Răcire', question: 'Care unitate de stocare folosește platane magnetice rotative pentru arhive mari de date?', targetId: 'hdd', hint: 'Se află în compartimentul din dreapta-jos, la același nivel cu sursa.', contextNote: 'Hard disk-ul mecanic (HDD 3.5") stochează date pe discuri magnetice la 7200 RPM.' },
      { id: 8, level: 2, levelTitle: 'Stocare și Răcire', question: 'Ce componentă disipă căldura preluată prin lichid în partea superioară a carcasei?', targetId: 'water_cooling', hint: 'Radiatorul lat cu două ventilatoare și furtunuri împletite de sus.', contextNote: 'Radiatorul AIO oferă o suprafață mare din lamele de aluminiu pentru răcirea lichidului.' },
      { id: 9, level: 3, levelTitle: 'Arhitectura Plăcii de Bază', question: 'Unde se află conectorii Front-Panel fără de care butonul Power al carcasei nu funcționează?', targetId: 'front_panel', hint: 'Conectorul cu pini aurii din colțul dreapta-jos al plăcii de bază.', contextNote: 'Butonul Power al carcasei unește scurt doi pini pe conectorul F_PANEL pentru pornire.' },
      { id: 10, level: 3, levelTitle: 'Arhitectura Plăcii de Bază', question: 'Care cip de pe placa de bază conține firmware-ul UEFI și execută testul POST la pornire?', targetId: 'bios_chip', hint: 'Un cip mic pătrat cu 8 pini în partea central-inferioară a plăcii de bază.', contextNote: 'Cipul BIOS/UEFI inițializează toate componentele înainte de încărcarea sistemului de operare.' },
      { id: 11, level: 3, levelTitle: 'Arhitectura Plăcii de Bază', question: 'Care conectori alimentează placa de bază (24-Pin) și procesorul (8-Pin)?', targetId: 'power_connectors', hint: 'Caută mufa verticală cu 24 de pini pe marginea din dreapta a plăcii de bază.', contextNote: 'Atât conectorul ATX 24-Pin cât și cel EPS 8-Pin sunt obligatorii pentru pornire.' },
      { id: 12, level: 3, levelTitle: 'Arhitectura Plăcii de Bază', question: 'Care cip convertește semnalul audio digital în semnal analogic lângă condensatorii aurii?', targetId: 'audio_chip', hint: 'Situat în colțul din stânga-jos al plăcii de bază, lângă cei 4 condensatori aurii.', contextNote: 'Cipul audio Realtek este izolat electric pentru a elimina zgomotul de fond.' },
    ],
    ar: [
      { id: 1, level: 1, levelTitle: 'المكونات الأساسية', question: 'أي مكون يُعرف بأنه "عقل" الحاسوب وينفذ مليارات العمليات الحسابية في الثانية؟', targetId: 'cpu', hint: 'يقع في مقبس المعالج بمنتصف اللوحة الأم مباشرة تحت مضخة التبريد المائي الدائرية.', contextNote: 'وحدة المعالجة المركزية (CPU) تعالج جميع الأوامر البرمجية وتنسق عمل النظام.' },
      { id: 2, level: 1, levelTitle: 'المكونات الأساسية', question: 'أين تقع الذاكرة العشوائية فائقة السرعة (RAM) المخصصة للبرامج المفتوحة حالياً؟', targetId: 'ram', hint: 'ابحث عن الشرائح الأربع العمودية المضيئة على يمين المعالج.', contextNote: 'الذاكرة العشوائية (RAM) تزود المعالج بالبيانات النشطة بسرعة النانوثانية ولكنها تفقد محتواها عند إيقاف التشغيل.' },
      { id: 3, level: 1, levelTitle: 'المكونات الأساسية', question: 'أي مكون يقوم بمعالجة المشاهد ثلاثية الأبعاد وتتبّع الأشعة ونماذج الذكاء الاصطناعي؟', targetId: 'gpu', hint: 'أكبر بطاقة مثبتة أفقياً في منتصف صندوق الحاسوب.', contextNote: 'بطاقة الرسوميات (GPU) تمتلك آلاف الأنوية المتوازية وذاكرة فيديو فائقة السرعة.' },
      { id: 4, level: 1, levelTitle: 'المكونات الأساسية', question: 'أي مكون يحول التيار المتردد إلى تيار مستمر مستقر (+12V و+5V و+3.3V) لتغذية جميع القطع؟', targetId: 'psu', hint: 'الوحدة الكبيرة المستطيلة في الجزء السفلي الأيسر من الصندوق.', contextNote: 'مزود الطاقة (PSU) يغذي النظام بالكامل ويحميه من التماسات الكهربائية.' },
      { id: 5, level: 2, levelTitle: 'التخزين والتبريد', question: 'أي وحدة تخزين فائقة السرعة تُثبت مباشرة بشكل مسطح على اللوحة الأم بين المعالج والبطاقة الرسومية؟', targetId: 'nvme', hint: 'شريحة أفقية نحيفة مثبتة على اللوحة الأم فوق بطاقة الرسوميات.', contextNote: 'قرص M.2 NVMe يتصل مباشرة بالمعالج عبر مسارات PCIe بسرعة تتجاوز 7000 ميجابايت/ثانية.' },
      { id: 6, level: 2, levelTitle: 'التخزين والتبريد', question: 'انقر على البطارية المعدنية الدائرية التي تحفظ الوقت وإعدادات الـ BIOS عند فصل الكهرباء!', targetId: 'cmos_battery', hint: 'قرص فضي دائري (CR2032) على الجانب الأيسر من اللوحة الأم.', contextNote: 'بدون بطارية CMOS تفقد اللوحة الأم الوقت والإعدادات عند فصل التيار الكهربائي.' },
      { id: 7, level: 2, levelTitle: 'التخزين والتبريد', question: 'أي وحدة تخزين تعتمد على أقراص مغناطيسية دوارة لتخزين الأرشيفات الضخمة؟', targetId: 'hdd', hint: 'يقع في الحجرة السفلية اليمنى بمحاذاة مزود الطاقة.', contextNote: 'القرص الصلب الميكانيكي (HDD) يخزن البيانات مغناطيسياً على أقراص تدور بسرعة 7200 دورة/دقيقة.' },
      { id: 8, level: 2, levelTitle: 'التخزين والتبريد', question: 'أي مكون علوي يقوم بتشتيت حرارة السائل القادم من المعالج عبر زعانف ألومنيوم دقيقة؟', targetId: 'water_cooling', hint: 'المبرد العريض (الرادياتير) المزود بمروحتين وأنابيب في أعلى الصندوق.', contextNote: 'مبرد التبريد المائي (AIO) يوفر مساحة سطح كبيرة لطرد الحرارة بكفاءة.' },
      { id: 9, level: 3, levelTitle: 'معمارية اللوحة الأم', question: 'أين تقع دبابيس توصيل اللوحة الأمامية التي لا يعمل زر تشغيل الصندوق بدونها؟', targetId: 'front_panel', hint: 'مجموعة الدبابيس في الحافة السفلية اليمنى للوحة الأم.', contextNote: 'زر التشغيل يقوم بتوصيل دبوسين في مقبس F_PANEL لإرسال نبضة التشغيل.' },
      { id: 10, level: 3, levelTitle: 'معمارية اللوحة الأم', question: 'أي رقاقة على اللوحة الأم تحتوي على برمجيات UEFI وتنفذ فحص الإقلاع الذاتي POST؟', targetId: 'bios_chip', hint: 'رقاقة صغيرة مربعة بـ 8 أرجل في الجزء السفلي الأوسط من اللوحة الأم.', contextNote: 'رقاقة BIOS/UEFI تهيئ جميع المكونات قبل تحميل نظام التشغيل.' },
      { id: 11, level: 3, levelTitle: 'معمارية اللوحة الأم', question: 'أين تقع مقابس الطاقة الرئيسية التي تغذي اللوحة الأم (24-Pin) والمعالج (8-Pin)؟', targetId: 'power_connectors', hint: 'انقر على المقبس الطويل ذي الـ 24 دبوساً على الحافة اليمنى للوحة الأم.', contextNote: 'يجب توصيل كابلي 24-Pin و8-Pin معاً لكي يعمل الحاسوب.' },
      { id: 12, level: 3, levelTitle: 'معمارية اللوحة الأم', question: 'أي رقاقة متخصصة تحول الإشارات الصوتية الرقمية إلى تناظرية بجوار المكثفات الذهبية؟', targetId: 'audio_chip', hint: 'تقع في الزاوية السفلية اليسرى للوحة الأم بجانب أربعة مكثفات ذهبية.', contextNote: 'رقاقة الصوت معزولة كهربائياً لمنع التشويش الكهرومغناطيسي.' },
    ],
  };

  return trMap[locale] || QUIZ_QUESTIONS;
}

function level3Title(): 3 {
  return 3;
}

export const SUB_LAYER_LABELS: Record<Locale, Record<string, string>> = {
  de: {
    tim: 'Wärmeleitpaste (Thermal Interface Material)',
    ihs: 'Vernickelter Kupfer-Heatspreader (IHS)',
    silicon_die: 'Silizium-Compute-Chiplets (CCDs & I/O-Die)',
    substrate_pins: 'Mehrschicht-Substrat & Gold-LGA-Kontaktpads',
    gpu_shroud_fans: 'Lüfter-Shroud & 3× Axial-Rotoren',
    fdb_bearing: 'FDB-Hydrodynamik-Lager & Kupfer-Statorspulen',
    heatsink_fins: 'Aluminium-Lamellenblock & Kupfer-Heatpipes',
    thermal_pads: 'Wärmeleitpads & GPU-Wärmeleitpaste',
    gpu_pcb_vram: '12-Layer-PCB, GPU-Die, GDDR6X-VRAM & VRM-Phasen',
    gpu_backplate: 'Gebürstete Aluminium-Backplate & Montageschrauben',
    aio_pump_cap: 'ARGB-Unendlichkeitsspiegel & Pumpen-Deckel',
    aio_coldplate: 'Mikro-Finnen-Kupferbodenplatte (Coldplate)',
    radiator_core: 'Aluminium-Radiator & Kühlflüssigkeits-Kanäle',
    dust_filter: 'Magnetisches Fein-Mesh-Staubfiltergitter',
    ram_diffuser: 'ARGB-Lichtleiter-Diffusorleiste',
    ram_heatspreader: 'Eloxierte Aluminium-Heatspreader-Schalen',
    ram_pcb_chips: '8-Layer-PCB, DDR5-ICs, PMIC & 288 Goldpins',
    ssd_controller_nand: 'Controller-IC, DRAM-Cache & 3D-TLC-NAND-Flash',
    hdd_platters: 'Rotierende Magnet-Platter & Spindelmotor',
    hdd_actuator: 'Lese-/Schreibkopf-Aktuator & Neodym-Schwingspule',
    psu_fan_grille: 'Lüftergitter & 135mm FDB-Lüfter',
    psu_transformers: 'Primär-Kondensatoren, Haupttrafo & Kühlkörper',
    pcb_traces: 'Mehrschicht-PCB mit Kupfer-Leiterbahnen & Vias',
    vrm_heatsinks: 'VRM-Kühlkörper, M.2-Armor & ARGB-Controller-Hub',
    gold_contacts: 'Vergoldete Kontaktpins & Präzisionsschrauben',
    battery_cells: '4× Lithium-Polymer-Pouch-Zellen (Li-Po)',
    bms_controller: 'BMS-Schutzplatine & Smart-Charge-Controller',
    display_matrix: '16" QHD+ OLED/IPS-Display-Matrix & Backlight',
    kbd_matrix: 'Per-Key-RGB-Tastenkappen & Scherenmechanik',
    trackpad_sensor: 'Gehärtetes Glas-Trackpad & Haptik-Sensorik',
    airflow_shroud: 'Polycarbonat-Luftführungshaube (Airflow Baffle)',
    raid_supercap: 'CacheVault Superkondensator-Notstrommodul',
    server_backplane: 'U.3 NVMe / SAS Hot-Swap-Backplane-Platine',
    emi_shield_cans: 'Edelstahl-HF-Abschirmkäfige (EMI Shield Cans) & B2B-Header',
    hdi_substrate: '12-Layer SLP/HDI-Platine & Laser-Microvias',
    pop_dram_die: 'Gestapeltes LPDDR5X-DRAM-Package (PoP)',
    soc_npu_die: '3nm Flaggschiff-SoC-Die (CPU / GPU / NPU / ISP)',
    bga_solder_balls: 'Mikro-BGA-Lotkugel-Matrix (0.3mm Pitch)',
    ufs_controller_nand: 'UFS-4.0-Controller-ASIC & 232-Layer 3D-TLC-NAND',
    sapphire_lens_cover: 'Saphirglas-Linsenringe & CNC-Kameraplateau',
    periscope_prism: '90°-Faltprisma & 5× Periskop-Tele-Linsengruppe',
    ois_voice_coil: 'Optischer Bildstabilisator (OIS-Schwingspulenaktor)',
    cmos_image_sensor: '200-MP-Stacked-CMOS-Bildsensor & MIPI-CSI-Flex',
    ir_dot_projector: '3D-ToF-Infrarot-Punktprojektor & Flood-Illuminator',
    pouch_anode_cathode: 'Silizium-Karbon-Anoden- & Li-Ion-Kathodenwickel',
    alu_pouch_foil: 'Aluminium-Verbundmantel & Easy-Pull-Klebestreifen',
    qi_copper_windings: 'Planare Litzendraht-Kupfer-Induktionsspule (Qi2 25W)',
    magsafe_magnet_ring: 'Ringförmiges N52-Neodym-Magnet-Array & 13.56MHz NFC-Loop',
    ferrite_shield_sheet: 'Nanokristalline Ferrit-Abschirmfolie',
    pyrolytic_graphite: 'Mehrschichtige pyrolytische Graphit-Wärmeleitfolie',
    vc_capillary_wick: 'Mikro-Kupfer-Kapillargeflecht & Vakuum-Dampfkammer',
    ceramic_shield_glass: 'Gehärtetes Frontglas (Ceramic / Gorilla Glass Armor)',
    ltpo_amoled_panel: '120Hz LTPO-AMOLED-Matrix & Kapazitiver Touch-Digitizer',
    ultrasonic_fp_ddic: '3D-Ultraschall-Fingerabdrucksensor & Display-Driver-IC (COP)',
    rf_fem_filters: '5G-mmWave/Sub-6-Transceiver, SAW/BAW-Filter & eSIM',
    usbc_24pin_receptacle: 'Wassergeschützte 24-Pin-USB-C-Edelstahlbuchse (IP68)',
    pd_controller_coax: 'USB-PD-Schnelllade-IC & HF-Koaxial-Antennenbrücke',
    lra_neodymium_mover: 'Neodym-Magnetmasse & lineare X-Achsen-Blattfedern (LRA)',
    lra_copper_voicecoil: 'LRA-Kupfer-Schwingspule & N52-Mikro-Akustikkammer',
  },
  en: {
    tim: 'Thermal Paste Layer (Thermal Interface Material)',
    ihs: 'Nickel-Plated Copper IHS (Heatspreader)',
    silicon_die: 'Silicon Compute Chiplets (CCDs & I/O Die)',
    substrate_pins: 'Multi-Layer Substrate & Gold LGA Contact Pads',
    gpu_shroud_fans: 'Fan Shroud & High-Static Rotors',
    fdb_bearing: 'Fluid Dynamic Bearing (FDB) & Copper Stator Coils',
    heatsink_fins: 'Aluminum Fin-Stack & Nickel-Copper Heatpipes',
    thermal_pads: 'VRAM Thermal Pads & GPU Thermal Paste',
    gpu_pcb_vram: '12-Layer PCB, GPU Die, GDDR6X VRAM & DrMOS VRMs',
    gpu_backplate: 'Anodized Enclosure Shell / Aluminum Backplate',
    aio_pump_cap: 'ARGB Infinity Mirror & Pump Housing Cap',
    aio_coldplate: 'Micro-Skived Copper Coldplate / Vapor Chamber',
    radiator_core: 'Copper/Aluminum Fin Radiator & Heat Channels',
    dust_filter: 'Magnetic Fine-Mesh Nylon Dust Filter',
    ram_diffuser: 'ARGB Light-Guide Diffuser Bar',
    ram_heatspreader: 'Anodized Aluminum Heatspreader Shells',
    ram_pcb_chips: '8-Layer PCB, DDR5 ICs, PMIC & Gold Fingers',
    ssd_controller_nand: 'Controller IC, DRAM Cache & 3D TLC NAND Flash',
    hdd_platters: 'Spinning Magnetic Platters & Spindle Motor',
    hdd_actuator: 'Read/Write Actuator / Acoustic Diaphragm',
    psu_fan_grille: 'High-RPM Cooling Fan & Intake Grille',
    psu_transformers: 'Bulk Capacitors, Switching Transformer & Heatsinks',
    pcb_traces: 'Multi-Layer PCB with Copper Traces & Via Arrays',
    vrm_heatsinks: 'VRM Heatsinks, Power Stages & Controller Hub',
    gold_contacts: 'Gold-Plated Contact Fingers & Mounting Hardware',
    battery_cells: '4× Lithium-Polymer Pouch Cells (Li-Po)',
    bms_controller: 'BMS Protection PCB & Smart Charge IC',
    display_matrix: '16" QHD+ OLED/IPS Active Display Matrix',
    kbd_matrix: 'Per-Key RGB Keycap Matrix & Scissor Switches',
    trackpad_sensor: 'Tempered Glass Trackpad & Haptic Sensor',
    airflow_shroud: 'Molded Polycarbonate Airflow Baffle Shroud',
    raid_supercap: 'CacheVault Supercapacitor Backup Module',
    server_backplane: 'U.3 NVMe / SAS Hot-Swap Backplane PCB',
    emi_shield_cans: 'Stainless-Steel RF Shield Cans & Gold B2B Headers',
    hdi_substrate: '12-Layer SLP/HDI Logic Board & Laser Microvias',
    pop_dram_die: 'Stacked LPDDR5X DRAM Package (PoP)',
    soc_npu_die: '3nm Flagship SoC Silicon Die (CPU / GPU / NPU / ISP)',
    bga_solder_balls: 'Micro-BGA Solder Ball Array (0.3mm Pitch)',
    ufs_controller_nand: 'UFS 4.0 Controller ASIC & 232-Layer 3D TLC NAND',
    sapphire_lens_cover: 'Sapphire Crystal Lens Rings & CNC Camera Bezel',
    periscope_prism: '90° Folded Prism & 5× Periscope Telephoto Lens Group',
    ois_voice_coil: 'Optical Image Stabilization (OIS Voice-Coil Actuator)',
    cmos_image_sensor: '200MP Stacked CMOS Image Sensor & MIPI CSI Flex',
    ir_dot_projector: '3D ToF Infrared Dot Projector & Flood Illuminator',
    pouch_anode_cathode: 'Silicon-Carbon Anode & Li-Ion Cathode Jelly-Roll',
    alu_pouch_foil: 'Aluminum Laminate Pouch & Easy-Pull Adhesive Tabs',
    qi_copper_windings: 'Planar Litz-Copper Wireless Induction Coil (Qi2 25W)',
    magsafe_magnet_ring: 'N52 Neodymium Magnet Ring Array & 13.56MHz NFC Loop',
    ferrite_shield_sheet: 'Nanocrystalline Ferrite Magnetic Shield Sheet',
    pyrolytic_graphite: 'Multi-Layer Pyrolytic Graphite Thermal Spreader',
    vc_capillary_wick: 'Micro-Copper Capillary Wick & Vacuum Vapor Chamber',
    ceramic_shield_glass: 'Tempered Front Cover (Ceramic / Gorilla Glass Armor)',
    ltpo_amoled_panel: '120Hz LTPO AMOLED Matrix & Capacitive Touch Digitizer',
    ultrasonic_fp_ddic: '3D Ultrasonic Fingerprint Scanner & COP Display Driver IC',
    rf_fem_filters: '5G mmWave/Sub-6 Transceiver, SAW/BAW Filters & eSIM',
    usbc_24pin_receptacle: 'IP68 Waterproof 24-Pin Stainless USB-C Receptacle',
    pd_controller_coax: 'USB-PD Fast-Charge IC & RF Coaxial Antenna Bridge',
    lra_neodymium_mover: 'Neodymium Magnet Mass & X-Axis Leaf Springs (LRA)',
    lra_copper_voicecoil: 'LRA Copper Voice-Coil & Sealed N52 Speaker Chamber',
  },
  tr: {
    tim: 'Termal Macun Katmanı (TIM)',
    ihs: 'Nikel Kaplı Bakır Isı Dağıtıcı (IHS)',
    silicon_die: 'Silikon İşlem Çipleri (CCD & I/O Die)',
    substrate_pins: 'Çok Katmanlı Substrat & Altın LGA Temas Pedleri',
    gpu_shroud_fans: 'Fan Gövdesi & Yüksek Basınçlı Fan Rotorları',
    fdb_bearing: 'FDB Sıvı Dinamik Yatak & Bakır Stator Bobinleri',
    heatsink_fins: 'Alüminyum Kanatçık Bloğu & Bakır Isı Boruları',
    thermal_pads: 'VRAM Termal Pedleri & GPU Termal Macunu',
    gpu_pcb_vram: '12 Katmanlı PCB, GPU Çipi, GDDR6X VRAM & VRM',
    gpu_backplate: 'Fırçalanmış Alüminyum Gövde / Arka Plaka',
    aio_pump_cap: 'ARGB Sonsuzluk Aynası & Pompa Kapağı',
    aio_coldplate: 'Mikro Kanatlı Bakır Soğuk Plaka / Buhar Odası',
    radiator_core: 'Alüminyum/Bakır Radyatör & Soğutma Kanalları',
    dust_filter: 'Manyetik İnce Gözenekli Toz Filtresi',
    ram_diffuser: 'ARGB Işık Dağıtıcı Difüzör Bar',
    ram_heatspreader: 'Eloksallı Alüminyum Soğutucu Plakalar',
    ram_pcb_chips: '8 Katmanlı PCB, DDR5 Çipler, PMIC & Altın Pinler',
    ssd_controller_nand: 'Kontrolcü Çipi, DRAM Önbellek & 3D NAND Flash',
    hdd_platters: 'Dönen Manyetik Plakalar & Mil Motoru',
    hdd_actuator: 'Okuma/Yazma Kafa Kolu / Akustik Diyafram',
    psu_fan_grille: 'Fan Izgarası & Yüksek Devirli FDB Fan',
    psu_transformers: 'Ana Kapasitörler, Trafo & Soğutucu Bloklar',
    pcb_traces: 'Bakır Veri Yolları & Lehim Pedli Çok Katmanlı PCB',
    vrm_heatsinks: 'VRM Soğutucular, Güç Fazları & Kontrolcü Hub',
    gold_contacts: 'Altın Kaplama Temas Pinleri & Montaj Vidaları',
    battery_cells: '4× Lityum-Polimer Hücre Paketleri (Li-Po)',
    bms_controller: 'BMS Koruma Kartı & Akıllı Şarj Kontrolcüsü',
    display_matrix: '16" QHD+ OLED/IPS Aktif Ekran Matrisi',
    kbd_matrix: 'RGB Tuş Matrisi & Makas Mekanizması',
    trackpad_sensor: 'Temperli Cam Trackpad & Haptik Sensör',
    airflow_shroud: 'Polikarbonat Hava Yönlendirme Davlumbazı',
    raid_supercap: 'CacheVault Süper Kapasitör Yedekleme Modülü',
    server_backplane: 'U.3 NVMe / SAS Hot-Swap Arka Panel Kartı',
    emi_shield_cans: 'Paslanmaz Çelik EMI Koruma Kafesleri & B2B Soketler',
    hdi_substrate: '12 Katmanlı SLP/HDI Anakart & Lazer Mikro-Vialar',
    pop_dram_die: 'Üst Üste Lehimli LPDDR5X DRAM Paketi (PoP)',
    soc_npu_die: '3nm Amiral Gemisi SoC Silikon Çipi (CPU / GPU / NPU)',
    bga_solder_balls: 'Mikro-BGA Lehim Topları Dizisi (0.3mm Aralıklı)',
    ufs_controller_nand: 'UFS 4.0 Kontrolcü ASIC & 232-Katman 3D TLC NAND',
    sapphire_lens_cover: 'Safir Kristal Lens Halkaları & CNC Kamera Çerçevesi',
    periscope_prism: '90° Katlanır Prizma & 5× Periskop Telefoto Lens Grubu',
    ois_voice_coil: 'Optik Görüntü Sabitleyici (OIS Manyetik Bobin)',
    cmos_image_sensor: '200MP Yığılmış CMOS Görüntü Sensörü & MIPI CSI Flex',
    ir_dot_projector: '3D ToF Kızılötesi Nokta Projektörü & Işık Sensörü',
    pouch_anode_cathode: 'Silikon-Karbon Anot & Li-Ion Katot Hücre Sargısı',
    alu_pouch_foil: 'Alüminyum Lamine Kılıf & Easy-Pull Çekme Bantları',
    qi_copper_windings: 'Düzlemsel Litz Bakır Kablosuz Şarj Bobini (Qi2 25W)',
    magsafe_magnet_ring: 'N52 Neodimyum Mıknatıs Halkası & 13.56MHz NFC Anteni',
    ferrite_shield_sheet: 'Nanokristal Ferrit Manyetik Koruma Katmanı',
    pyrolytic_graphite: 'Çok Katmanlı Pirolitik Grafit Termal Yayıcı',
    vc_capillary_wick: 'Mikro-Bakır Kapiler Ağ & Vakumlu Buhar Odası',
    ceramic_shield_glass: 'Temperli Ön Koruma Camı (Ceramic / Gorilla Glass Armor)',
    ltpo_amoled_panel: '120Hz LTPO AMOLED Matrisi & Kapasitif Dokunmatik',
    ultrasonic_fp_ddic: '3D Ultrasonik Parmak İzi Okuyucu & COP Ekran Sürücüsü',
    rf_fem_filters: '5G mmWave/Sub-6 Alıcı-Verici, SAW/BAW Filtreler & eSIM',
    usbc_24pin_receptacle: 'IP68 Su Geçirmez 24-Pin Paslanmaz USB-C Soketi',
    pd_controller_coax: 'USB-PD Hızlı Şarj Çipi & RF Koaksiyel Anten Köprüsü',
    lra_neodymium_mover: 'Neodimyum Mıknatıs Kütlesi & X-Ekseni Yaprak Yaylar',
    lra_copper_voicecoil: 'LRA Bakır Ses Bobini & Yalıtımlı N52 Hoparlör Kabini',
  },
  ro: {
    tim: 'Strat de Pastă Termoconductoare (TIM)',
    ihs: 'IHS din Cupru Nichelat (Heatspreader)',
    silicon_die: 'Chiplet-uri de Siliciu (CCD & I/O Die)',
    substrate_pins: 'Substrat Multistrat & Pad-uri Aurii LGA',
    gpu_shroud_fans: 'Carcasă Ventilatoare & Rotoare de Înaltă Presiune',
    fdb_bearing: 'Rulment Hidrodinamic FDB & Bobine Stator din Cupru',
    heatsink_fins: 'Bloc de Lamele din Aluminiu & Heatpipe-uri din Cupru',
    thermal_pads: 'Pad-uri Termice VRAM & Pastă Termică GPU',
    gpu_pcb_vram: 'PCB 12 Straturi, Cip GPU, VRAM GDDR6X & VRM',
    gpu_backplate: 'Carcasă Metalică / Backplate din Aluminiu Periat',
    aio_pump_cap: 'Oglindă Infinită ARGB & Capac Pompă',
    aio_coldplate: 'Placă Rece din Cupru / Vapor Chamber',
    radiator_core: 'Radiator din Aluminiu/Cupru & Canale Termice',
    dust_filter: 'Filtru de Praf Magnetic cu Plasă Fină',
    ram_diffuser: 'Bară Difuzoare de Lumină ARGB',
    ram_heatspreader: 'Carcase Radiator din Aluminiu Anodizat',
    ram_pcb_chips: 'PCB 8 Straturi, Cipuri DDR5, PMIC & Pini Aurii',
    ssd_controller_nand: 'Cip Controller, Cache DRAM & 3D TLC NAND Flash',
    hdd_platters: 'Platane Magnetice Rotative & Motor Ax',
    hdd_actuator: 'Braț Actuator / Diafragmă Acustică',
    psu_fan_grille: 'Grilă Ventilator & Rotor FDB de Mare Viteză',
    psu_transformers: 'Condensatori Primari, Transformator & Radiatoare',
    pcb_traces: 'PCB Multistrat cu Trasee de Cupru & Pad-uri Via',
    vrm_heatsinks: 'Radiatoare VRM, Etaje de Putere & Hub ARGB',
    gold_contacts: 'Pini de Contact Auriți & Șuruburi de Precizie',
    battery_cells: '4× Celule Litiu-Polimer (Li-Po Pouch)',
    bms_controller: 'Placă BMS de Protecție & Controller Încărcare',
    display_matrix: 'Matrice Ecran QHD+ OLED/IPS de 16"',
    kbd_matrix: 'Matrice Taste RGB & Mecanism Foarfecă',
    trackpad_sensor: 'Trackpad din Sticlă Securizată & Senzor Haptic',
    airflow_shroud: 'Deflector de Aer din Policarbonat (Airflow Shroud)',
    raid_supercap: 'Modul Supercapacitor CacheVault Backup',
    server_backplane: 'Backplane Hot-Swap U.3 NVMe / SAS',
    emi_shield_cans: 'Cuști Ecranare RF din Inox & Conectori Aurii B2B',
    hdi_substrate: 'Placă Logică 12 Straturi SLP/HDI & Microvias Laser',
    pop_dram_die: 'Pachet Memorie LPDDR5X Stivuit (PoP)',
    soc_npu_die: 'Pastilă Siliciu 3nm SoC (CPU / GPU / NPU / ISP)',
    bga_solder_balls: 'Matrice Micro-Bile BGA (Pas 0.3mm)',
    ufs_controller_nand: 'Controller ASIC UFS 4.0 & 232-Layer 3D TLC NAND',
    sapphire_lens_cover: 'Inele Lentile din Safir & Ramă Foto CNC',
    periscope_prism: 'Prismă Pliabilă la 90° & Grup Lentile Periscop 5×',
    ois_voice_coil: 'Stabilizare Optică (Actuator Magnetic OIS)',
    cmos_image_sensor: 'Senzor Foto 200MP Stacked CMOS & Cablu Flex MIPI CSI',
    ir_dot_projector: 'Proiector Puncte IR 3D ToF & Iluminator Flood',
    pouch_anode_cathode: 'Înfășurare Anod Siliciu-Carbon & Catod Li-Ion',
    alu_pouch_foil: 'Folie Laminată din Aluminiu & Benzi Adezive Easy-Pull',
    qi_copper_windings: 'Bobină Planară din Cupru Litz Qi2 (25W)',
    magsafe_magnet_ring: 'Inel Magneți Neodim N52 & Antenă NFC 13.56MHz',
    ferrite_shield_sheet: 'Folie Ecranare Magnetică din Ferită Nanocristalină',
    pyrolytic_graphite: 'Folie Termoconductoare din Grafit Pirolitic',
    vc_capillary_wick: 'Rețea Capilară din Cupru & Cameră de Vapori în Vid',
    ceramic_shield_glass: 'Sticlă Frontală Securizată (Ceramic / Gorilla Armor)',
    ltpo_amoled_panel: 'Matrice 120Hz LTPO AMOLED & Digitizer Tactil',
    ultrasonic_fp_ddic: 'Senzor Amprentă Ultrasonic 3D & Driver DDIC (COP)',
    rf_fem_filters: 'Transceiver 5G mmWave/Sub-6, Filtre SAW/BAW & eSIM',
    usbc_24pin_receptacle: 'Mufă USB-C 24-Pini din Inox Etanșată IP68',
    pd_controller_coax: 'Cip Încărcare Rapidă USB-PD & Punte Coaxială RF',
    lra_neodymium_mover: 'Masă Magnetică Neodim & Arcuri Lamelare Axa-X (LRA)',
    lra_copper_voicecoil: 'Bobină LRA din Cupru & Incintă Acustică Etanșă N52',
  },
  ar: {
    tim: 'طبقة المعجون الحراري (TIM)',
    ihs: 'موزع الحرارة النحاسي المطلي بالنيكل (IHS)',
    silicon_die: 'شرائح السيليكون الحسابية (CCDs & I/O Die)',
    substrate_pins: 'ركيزة متعددة الطبقات ونقاط تلامس LGA الذهبية',
    gpu_shroud_fans: 'غطاء التبريد ومراوح التدفق العالي',
    fdb_bearing: 'محمل مروحة هيدروديناميكي FDB وملفات نحاسية',
    heatsink_fins: 'مصفوفة زعانف الألومنيوم وأنابيب التبريد النحاسية',
    thermal_pads: 'وسائد حرارية للذاكرة ومعجون المعالج الرسومي',
    gpu_pcb_vram: 'لوحة 12 طبقة ورقاقة GPU وذاكرة GDDR6X ودوائر VRM',
    gpu_backplate: 'غطاء معدني خارجي / لوحة خلفية من الألومنيوم',
    aio_pump_cap: 'غطاء المضخة بمرآة اللانهاية ARGB',
    aio_coldplate: 'قاعدة التبريد النحاسية / غرفة البخار (Vapor Chamber)',
    radiator_core: 'رادياتير التبريد وقنوات تبديد الحرارة',
    dust_filter: 'مرشح غبار شبكي مغناطيسي دقيق',
    ram_diffuser: 'شريط موزع الإضاءة ARGB',
    ram_heatspreader: 'أغطية تشتيت الحرارة من الألومنيوم المؤكسد',
    ram_pcb_chips: 'لوحة 8 طبقات ورقاقات DDR5 ودبابيس ذهبية',
    ssd_controller_nand: 'رقاقة التحكم وذاكرة الكاش ورقاقات 3D NAND',
    hdd_platters: 'الأقراص المغناطيسية الدوارة ومحرك المغزل',
    hdd_actuator: 'ذراع القراءة/الكتابة أو الغشاء الصوتي',
    psu_fan_grille: 'شبكة الحماية ومروحة التبريد عالية السرعة',
    psu_transformers: 'المكثفات الأولية والمحول الرئيسي والمشتتات الحرارية',
    pcb_traces: 'لوحة مطبوعة متعددة الطبقات بمسارات نحاسية دقيقة',
    vrm_heatsinks: 'مشتتات VRM ومراحل الطاقة وموزع الإضاءة',
    gold_contacts: 'دبابيس التوصيل المطلية بالذهب ومسامير التثبيت',
    battery_cells: '4 خلايا ليثيوم بوليمر عالية الكثافة',
    bms_controller: 'لوحة حماية البطارية BMS ومتحكم الشحن',
    display_matrix: 'مصفوفة شاشة العرض QHD+ OLED/IPS',
    kbd_matrix: 'مصفوفة مفاتيح RGB وميكانيكية المقص',
    trackpad_sensor: 'لوحة لمس زجاجية ومستشعر لمسي',
    airflow_shroud: 'غطاء توجيه الهواء المصنوع من البولي كربونات',
    raid_supercap: 'وحدة المكثف الفائق لحماية الكاش CacheVault',
    server_backplane: 'لوحة التوصيل الخلفية U.3 NVMe / SAS Hot-Swap',
    emi_shield_cans: 'أقفاص الحماية المعدنية EMI وموصلات B2B الذهبية',
    hdi_substrate: 'لوحة رئيسية 12 طبقة SLP/HDI بمسارات ليزرية',
    pop_dram_die: 'شريحة ذاكرة LPDDR5X المدمجة فوق المعالج (PoP)',
    soc_npu_die: 'نواة سيليكون معالج 3nm SoC (CPU / GPU / NPU)',
    bga_solder_balls: 'مصفوفة كرات اللحام الدقيقة BGA (0.3mm)',
    ufs_controller_nand: 'متحكم UFS 4.0 ورقاقات 232-Layer 3D TLC NAND',
    sapphire_lens_cover: 'حلقات عدسات الياقوت وإطار الكاميرا المعدني',
    periscope_prism: 'منشور ضوئي بزاوية 90° وعدسات تقريب بيريسكوب 5×',
    ois_voice_coil: 'المثبت البصري المغناطيسي (OIS Voice-Coil)',
    cmos_image_sensor: 'مستشعر التصوير 200MP CMOS وكابل MIPI CSI المرن',
    ir_dot_projector: 'عارض نقاط الأشعة تحت الحمراء ثلاثي الأبعاد ToF',
    pouch_anode_cathode: 'لفائف أنود السيليكون-كربون وكاثود الليثيوم-أيون',
    alu_pouch_foil: 'غلاف الألومنيوم المصفح وأشرطة السحب الآمن',
    qi_copper_windings: 'ملف الحث النحاسي المسطح للشحن اللاسلكي Qi2 (25W)',
    magsafe_magnet_ring: 'حلقة مغناطيس النيوديميوم N52 وهوائي NFC',
    ferrite_shield_sheet: 'طبقة الفيريت النانوية للعزل المغناطيسي',
    pyrolytic_graphite: 'رقائق الجرافيت الحراري متعدد الطبقات',
    vc_capillary_wick: 'الشبكة الشعرية النحاسية وغرفة البخار المفرغة',
    ceramic_shield_glass: 'الزجاج الأمامي المقوى (Ceramic / Gorilla Armor)',
    ltpo_amoled_panel: 'مصفوفة شاشة 120Hz LTPO AMOLED ومستشعر اللمس',
    ultrasonic_fp_ddic: 'قارئ البصمة بالموجات فوق الصوتية ورقاقة قيادة الشاشة',
    rf_fem_filters: 'وحدة ترددات 5G وفلاتر SAW/BAW وشريحة eSIM',
    usbc_24pin_receptacle: 'منفذ USB-C بـ 24 دبوساً مقاوم للماء IP68',
    pd_controller_coax: 'متحكم الشحن السريع USB-PD وجسر الهوائي المحوري',
    lra_neodymium_mover: 'الكتلة المغناطيسية ونوابض المحور الأفقي (LRA)',
    lra_copper_voicecoil: 'ملف محرك الاهتزاز النحاسي وحجرة السماعة المغلقة',
  },
};

