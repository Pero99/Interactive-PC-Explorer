'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Cable,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Eye,
  Globe,
  HelpCircle,
  Info,
  Laptop,
  Layers,
  ListFilter,
  MapPin,
  Maximize2,
  Monitor,
  Moon,
  Network,
  RotateCcw,
  Search,
  Server,
  Sliders,
  Smartphone,
  Sun,
  Thermometer,
  Trophy,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import PcCanvas3D, { CameraPreset } from '@/components/pc-canvas-3d';
import {
  ComponentId,
  FlowCategory,
  HardwareComponentData,
  PlatformType,
} from '@/lib/hardware-data';
import {
  getPlatformBootSequence,
  getPlatformHardwareDb,
  getPlatformQuiz,
} from '@/lib/hardware-laptop-server';
import { getLocalizedHardwareDb } from '@/lib/i18n-hardware';
import {
  getLocalizedBootSequence,
  getLocalizedQuizQuestions,
  Locale,
  LOCALES,
  ThemeMode,
  UI_TRANSLATIONS,
} from '@/lib/i18n-ui';

const EMPTY_DISABLED_IDS: ComponentId[] = [];

export default function PcExplorerApp() {
  // 1. Platform State: 'pc' | 'laptop' | 'server' | 'smartphone'
  const [platform, setPlatform] = useState<PlatformType>('pc');

  // 2. Dual-Theme State: 'light' | 'dark'
  const [theme, setTheme] = useState<ThemeMode>('dark');

  // 3. Language State ('de' | 'en' | 'tr' | 'ro' | 'ar')
  const [locale, setLocale] = useState<Locale>('de');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState<boolean>(false);

  // 4. Core Selection & 3D State
  const [selectedId, setSelectedId] = useState<ComponentId | null>('cpu');
  const [hoveredInfo, setHoveredInfo] = useState<{
    id: ComponentId;
    x: number;
    y: number;
  } | null>(null);
  const [explodeFactor, setExplodeFactor] = useState<number>(0);
  const [caseOpacity, setCaseOpacity] = useState<number>(0.45);

  // 5. Cable Harness & Visual Diagnostic Modes (for all platforms)
  const [isCablesVisible, setIsCablesVisible] = useState<boolean>(true);
  const [isAirflowVisible, setIsAirflowVisible] = useState<boolean>(false);
  const [isThermalMode, setIsThermalMode] = useState<boolean>(false);
  const [isPinsVisible, setIsPinsVisible] = useState<boolean>(false);
  const [isSubPinsVisible, setIsSubPinsVisible] = useState<boolean>(true);
  const [isIsolatedView, setIsIsolatedView] = useState<boolean>(false);

  // 6. Data Flow State
  const [isDataFlowVisible, setIsDataFlowVisible] = useState<boolean>(false);
  const [activeFlowFilter, setActiveFlowFilter] = useState<FlowCategory>('all');
  const [isolatedFlowComponentId, setIsolatedFlowComponentId] =
    useState<ComponentId | null>(null);

  // 7. Use-Case Filter Highlighting
  const [activeUsecaseFilter, setActiveUsecaseFilter] = useState<string | null>(null);

  // 8. Responsive Left Drawer, Mobile Bottom-Sheet & Bottom Dock UI State
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [isBottomDockCollapsed, setIsBottomDockCollapsed] = useState<boolean>(false);
  const [isMobileDetailMinimized, setIsMobileDetailMinimized] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 9. Camera Preset Trigger
  const [cameraPresetTrigger, setCameraPresetTrigger] = useState<{
    preset: CameraPreset;
    seq: number;
  } | null>(null);

  // 10. Quiz Mode State
  const [isQuizActive, setIsQuizActive] = useState<boolean>(false);
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizStreak, setQuizStreak] = useState<number>(0);
  const [quizAnsweredCorrectly, setQuizAnsweredCorrectly] = useState<boolean>(false);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [quizShowHint, setQuizShowHint] = useState<boolean>(false);
  const [quizFeedback, setQuizFeedback] = useState<{
    type: 'success' | 'error';
    clickedId: ComponentId;
    targetId: ComponentId;
  } | null>(null);

  // 11. Interactive POST / Boot Sequence State
  const [bootSequenceIndex, setBootSequenceIndex] = useState<number | null>(null);

  // Localized UI Dictionary
  const t = UI_TRANSLATIONS[locale];
  const currentLocaleMeta = LOCALES.find((l) => l.code === locale) || LOCALES[0];

  // Dynamic Platform Hardware Database
  const currentDb: Record<string, HardwareComponentData> = useMemo(() => {
    if (platform === 'pc') {
      return getLocalizedHardwareDb(locale);
    }
    return getPlatformHardwareDb(platform, locale);
  }, [platform, locale]);

  const currentComponentList = useMemo(() => {
    return Object.values(currentDb);
  }, [currentDb]);

  // Dynamic Platform Boot Sequence
  const currentBootSequence = useMemo(() => {
    if (platform === 'pc') {
      return getLocalizedBootSequence(locale);
    }
    return getPlatformBootSequence(platform, locale);
  }, [platform, locale]);

  // Dynamic Platform Quiz Questions
  const currentQuizQuestions = useMemo(() => {
    if (platform === 'pc') {
      return getLocalizedQuizQuestions(locale);
    }
    return getPlatformQuiz(platform, locale);
  }, [platform, locale]);

  // Handle switching platform
  const handleSelectPlatform = (newPlatform: PlatformType) => {
    if (newPlatform === platform) return;
    setPlatform(newPlatform);
    setBootSequenceIndex(null);
    setIsQuizActive(false);
    setActiveUsecaseFilter(null);
    setSearchQuery('');
    setExplodeFactor(0);
    setCaseOpacity(0.45);
    setIsIsolatedView(false);
    setIsMobileDetailMinimized(false);

    // Default selected component for the platform
    if (newPlatform === 'pc') setSelectedId('cpu');
    else if (newPlatform === 'laptop') setSelectedId('laptop_cpu');
    else if (newPlatform === 'server') setSelectedId('server_cpus');
    else if (newPlatform === 'smartphone') setSelectedId('phone_soc');

    setCameraPresetTrigger((prev) => ({
      preset: 'default',
      seq: (prev?.seq || 0) + 1,
    }));
  };

  // Filtered components in left drawer (by search query only, without category filter pills)
  const filteredComponents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentComponentList;
    return currentComponentList.filter((c) => {
      const localizedCat = (t.categories[c.category] || '').toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.shortName.toLowerCase().includes(q) ||
        c.short.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        localizedCat.includes(q)
      );
    });
  }, [searchQuery, currentComponentList, t.categories]);

  const highlightedIds: ComponentId[] = useMemo(() => {
    if (!activeUsecaseFilter) return [];
    return currentComponentList
      .filter((c) =>
        c.usecases.some((u) => u.toLowerCase().includes(activeUsecaseFilter.toLowerCase()))
      )
      .map((c) => c.id as ComponentId);
  }, [activeUsecaseFilter, currentComponentList]);

  // Quiz evaluation
  const evaluateQuizClick = useCallback(
    (clickedId: ComponentId) => {
      if (quizAnsweredCorrectly || quizCompleted) return;
      const currentQ = currentQuizQuestions[quizIndex];
      if (!currentQ) return;

      if (clickedId === currentQ.targetId) {
        const bonus = quizStreak * 20;
        setQuizScore((s) => s + 100 + bonus);
        setQuizStreak((st) => st + 1);
        setQuizAnsweredCorrectly(true);
        setQuizFeedback({
          type: 'success',
          clickedId,
          targetId: currentQ.targetId,
        });
      } else {
        setQuizScore((s) => Math.max(0, s - 25));
        setQuizStreak(0);
        setQuizFeedback({
          type: 'error',
          clickedId,
          targetId: currentQ.targetId,
        });
      }
    },
    [quizAnsweredCorrectly, quizCompleted, quizIndex, quizStreak, currentQuizQuestions]
  );

  const lastSelectionChangeRef = useRef<{
    fromId: ComponentId | null;
    toId: ComponentId | null;
    time: number;
  }>({
    fromId: null,
    toId: null,
    time: 0,
  });

  const handleSelectComponent = useCallback(
    (id: ComponentId) => {
      if (isQuizActive) {
        evaluateQuizClick(id);
      } else {
        setBootSequenceIndex(null);
        setSelectedId((prev) => {
          if (prev !== id) {
            lastSelectionChangeRef.current = {
              fromId: prev,
              toId: id,
              time: performance.now(),
            };
          }
          return id;
        });
        setIsMobileDetailMinimized(false);
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
          setIsLeftDrawerOpen(false);
        }
      }
    },
    [isQuizActive, evaluateQuizClick]
  );

  const handleDoubleClickComponent = useCallback(
    (id: ComponentId | null) => {
      if (isQuizActive) return;

      // Double-click in empty space exits isolation mode
      if (!id) {
        if (isIsolatedView) {
          setIsIsolatedView(false);
          setExplodeFactor(0);
        }
        return;
      }

      const now = performance.now();
      const justSwitchedToThisId =
        now - lastSelectionChangeRef.current.time < 450 &&
        lastSelectionChangeRef.current.toId === id &&
        lastSelectionChangeRef.current.fromId !== id;

      // If this component was already isolated before the double-click, exit isolation
      if (isIsolatedView && selectedId === id && !justSwitchedToThisId) {
        setIsIsolatedView(false);
        setExplodeFactor(0);
      } else {
        // Isolate the double-clicked component in its compact state
        setBootSequenceIndex(null);
        setSelectedId(id);
        setIsIsolatedView(true);
        setExplodeFactor(0);
        setIsMobileDetailMinimized(false);
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
          setIsLeftDrawerOpen(false);
        }
      }
    },
    [isQuizActive, isIsolatedView, selectedId]
  );

  const handleHoverComponent = useCallback(
    (id: ComponentId | null, clientX: number, clientY: number) => {
      if (!id) {
        setHoveredInfo(null);
      } else {
        setHoveredInfo({ id, x: clientX, y: clientY });
      }
    },
    []
  );

  const handleToggleExplode = () => {
    setExplodeFactor((prev) => (prev > 0.1 ? 0 : 1));
  };

  const handleToggleCaseOpacity = () => {
    setCaseOpacity((prev) => (prev > 0.65 ? 0.2 : prev < 0.35 ? 0.45 : 1));
  };

  const handleToggleQuiz = () => {
    if (isQuizActive) {
      setIsQuizActive(false);
    } else {
      setBootSequenceIndex(null);
      setSelectedId(null);
      setQuizIndex(0);
      setQuizScore(0);
      setQuizStreak(0);
      setQuizAnsweredCorrectly(false);
      setQuizCompleted(false);
      setQuizShowHint(false);
      setQuizFeedback(null);
      setIsQuizActive(true);
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setIsLeftDrawerOpen(false);
      }
    }
  };

  const handleNextQuizQuestion = () => {
    if (quizIndex + 1 < currentQuizQuestions.length) {
      setQuizIndex((i) => i + 1);
      setQuizAnsweredCorrectly(false);
      setQuizShowHint(false);
      setQuizFeedback(null);
      setCameraPresetTrigger((prev) => ({
        preset: 'default',
        seq: (prev?.seq || 0) + 1,
      }));
    } else {
      setQuizCompleted(true);
    }
  };

  const handleStartBootSequence = () => {
    setIsQuizActive(false);
    setIsDataFlowVisible(true);
    setActiveFlowFilter('all');
    setIsolatedFlowComponentId(null);
    setBootSequenceIndex(0);
    if (currentBootSequence.length > 0) {
      setSelectedId(currentBootSequence[0].componentId);
    }
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsLeftDrawerOpen(false);
    }
  };

  const handleStepBootSequence = (nextIndex: number) => {
    if (nextIndex >= 0 && nextIndex < currentBootSequence.length) {
      setBootSequenceIndex(nextIndex);
      setSelectedId(currentBootSequence[nextIndex].componentId);
    } else {
      setBootSequenceIndex(null);
    }
  };

  const handleResetAll = () => {
    setExplodeFactor(0);
    setCaseOpacity(0.45);
    setIsDataFlowVisible(false);
    setIsCablesVisible(true);
    setIsAirflowVisible(false);
    setIsThermalMode(false);
    setIsPinsVisible(false);
    setIsSubPinsVisible(true);
    setIsIsolatedView(false);
    setIsolatedFlowComponentId(null);
    setActiveFlowFilter('all');
    setActiveUsecaseFilter(null);
    setBootSequenceIndex(null);
    setIsQuizActive(false);
    setIsMobileDetailMinimized(false);

    if (platform === 'pc') setSelectedId('cpu');
    else if (platform === 'laptop') setSelectedId('laptop_cpu');
    else if (platform === 'server') setSelectedId('server_cpus');
    else if (platform === 'smartphone') setSelectedId('phone_soc');

    setCameraPresetTrigger((prev) => ({
      preset: 'default',
      seq: (prev?.seq || 0) + 1,
    }));
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key.toLowerCase() === 'h') {
        setIsBottomDockCollapsed((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsIsolatedView(false);
        setSelectedId(null);
        setBootSequenceIndex(null);
        setIsLangMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const selectedData = selectedId && currentDb[selectedId] ? currentDb[selectedId] : null;
  const hoveredData = hoveredInfo && currentDb[hoveredInfo.id] ? currentDb[hoveredInfo.id] : null;
  const currentQuizQ = currentQuizQuestions[quizIndex] || currentQuizQuestions[0];
  const currentBootStep =
    bootSequenceIndex !== null ? currentBootSequence[bootSequenceIndex] : null;

  return (
    <main
      dir={currentLocaleMeta.dir}
      className={`${theme === 'dark' ? 'dark' : ''} relative w-screen h-dvh overflow-hidden bg-slate-100 dark:bg-[#070B14] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200`}
    >
      {/* 1. RESPONSIVE PROFESSIONAL TOP BAR: Brand | Central Platform Switcher (PC | Laptop | Server | Smartphone) | Actions & Theme */}
      <header className="relative z-30 flex flex-wrap items-center justify-between gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-3 bg-white/95 dark:bg-[#0C1220]/95 border-b border-slate-200 dark:border-slate-800 shrink-0 shadow-sm">
        {/* Zone 1: Brand Wordmark */}
        <div className="order-1 flex items-center gap-2.5 shrink-0">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              handleResetAll();
            }}
            className="font-bold text-sm sm:text-base lg:text-lg tracking-tight text-slate-900 dark:text-white whitespace-nowrap"
          >
            {t.appTitle}
          </a>
          <span className="hidden xl:inline text-xs font-mono text-slate-400 dark:text-slate-500 border-l border-slate-200 dark:border-slate-800 pl-3">
            {platform === 'pc'
              ? t.platformSubtitlePc
              : platform === 'laptop'
              ? t.platformSubtitleLaptop
              : platform === 'server'
              ? t.platformSubtitleServer
              : t.platformSubtitleSmartphone}
          </span>
        </div>

        {/* Zone 2: CENTRAL 4-PLATFORM SEGMENTED BUTTON (PC | Laptop | Server | Smartphone) */}
        <div className="order-3 md:order-2 w-full md:w-auto flex items-center bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => handleSelectPlatform('pc')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              platform === 'pc'
                ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5 shrink-0" />
            <span>{t.platformPc}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectPlatform('laptop')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              platform === 'laptop'
                ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Laptop className="w-3.5 h-3.5 shrink-0" />
            <span>{t.platformLaptop}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectPlatform('server')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              platform === 'server'
                ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5 shrink-0" />
            <span>{t.platformServer}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectPlatform('smartphone')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              platform === 'smartphone'
                ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span>{t.platformSmartphone}</span>
          </button>
        </div>

        {/* Zone 3: Navigation, Light/Dark Mode, Language, Reset */}
        <div className="order-2 md:order-3 flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Quick POST Test Button */}
          <button
            type="button"
            onClick={handleStartBootSequence}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors whitespace-nowrap"
            title={t.testPostBoot}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="hidden sm:inline">{t.navBoot}</span>
          </button>

          {/* Quick Quiz Mode Button */}
          <button
            type="button"
            onClick={handleToggleQuiz}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
              isQuizActive
                ? 'bg-amber-500 text-slate-950 border-amber-600 font-semibold'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title={t.navQuiz}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="hidden sm:inline">{t.navQuiz}</span>
          </button>

          {/* Light / Dark Mode Switcher */}
          <button
            type="button"
            onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            title={t.themeToggle}
            aria-label={t.themeToggle}
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-slate-700" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* Language Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLangMenuOpen((prev) => !prev)}
              className="px-2 sm:px-2.5 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1"
              aria-label={t.languageLabel}
            >
              <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{currentLocaleMeta.shortLabel}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isLangMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-40 bg-white dark:bg-[#0C1220] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-50">
                {LOCALES.map((loc) => {
                  const active = loc.code === locale;
                  return (
                    <button
                      key={loc.code}
                      type="button"
                      onClick={() => {
                        setLocale(loc.code);
                        setActiveUsecaseFilter(null);
                        setIsLangMenuOpen(false);
                      }}
                      className={`w-full px-3 py-1.5 text-xs flex items-center justify-between transition-colors ${
                        active
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{loc.nativeName}</span>
                      {active && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reset View */}
          <button
            type="button"
            onClick={handleResetAll}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            title={t.resetView}
          >
            <RotateCcw className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </header>

      {/* 2. CENTRAL WORKSPACE & 3D VIEWPORT */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* Isolated 3D Canvas */}
        <div className="absolute inset-0 z-0">
          <PcCanvas3D
            platform={platform}
            theme={theme}
            locale={locale}
            selectedId={selectedId}
            hoveredId={hoveredInfo?.id || null}
            disabledIds={EMPTY_DISABLED_IDS}
            highlightedIds={highlightedIds}
            explodeFactor={explodeFactor}
            caseOpacity={caseOpacity}
            isDataFlowVisible={isDataFlowVisible}
            isCablesVisible={isCablesVisible}
            isAirflowVisible={isAirflowVisible}
            isThermalMode={isThermalMode}
            isPinsVisible={isPinsVisible}
            isSubPinsVisible={isSubPinsVisible}
            isIsolatedView={isIsolatedView}
            activeFlowFilter={activeFlowFilter}
            isolatedFlowComponentId={isolatedFlowComponentId}
            cameraPresetTrigger={cameraPresetTrigger}
            bootStepComponentId={currentBootStep?.componentId || null}
            onSelectComponent={handleSelectComponent}
            onDoubleClickComponent={handleDoubleClickComponent}
            onHoverComponent={handleHoverComponent}
          />
        </div>

        {/* HOVER TOOLTIP (Desktop / Pointer devices) */}
        {hoveredData && (
          <div
            style={{
              transform: `translate3d(${Math.min(
                hoveredInfo!.x + 18,
                typeof window !== 'undefined' ? window.innerWidth - 280 : 800
              )}px, ${Math.min(
                hoveredInfo!.y - 45,
                typeof window !== 'undefined' ? window.innerHeight - 160 : 600
              )}px, 0)`,
            }}
            className="hidden md:block fixed top-0 left-0 pointer-events-none z-50 w-64 bg-white/95 dark:bg-[#0C1220]/95 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xl backdrop-blur-sm"
          >
            <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
              {hoveredData.category}
            </div>
            <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
              {hoveredData.name}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              {isQuizActive ? t.clickForQuizAnswer : hoveredData.short}
            </p>
          </div>
        )}

        {/* LEFT DRAWER TOGGLE BUTTON */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-2 pointer-events-none">
          <button
            type="button"
            onClick={() => setIsLeftDrawerOpen((prev) => !prev)}
            className="pointer-events-auto px-3 py-1.5 rounded-lg bg-white/95 dark:bg-[#0C1220]/95 border border-slate-200 dark:border-slate-800 shadow-md text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-colors hover:border-blue-500"
          >
            <ListFilter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{t.componentsCount(currentComponentList.length)}</span>
            {isLeftDrawerOpen ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
        </div>

        {/* MOBILE BACKDROP FOR LEFT SEARCH OVERLAY */}
        {isLeftDrawerOpen && (
          <div
            onClick={() => setIsLeftDrawerOpen(false)}
            className="fixed inset-0 z-20 bg-slate-950/25 backdrop-blur-[1px] sm:hidden"
            aria-hidden="true"
          />
        )}

        {/* COLLAPSIBLE LEFT COMPONENT SEARCH DRAWER (Without Category Filter Pills) */}
        {isLeftDrawerOpen && (
          <aside className="absolute top-14 sm:top-16 left-3 right-3 sm:right-auto sm:left-4 bottom-20 sm:bottom-24 z-30 sm:z-20 sm:w-72 max-h-[60vh] sm:max-h-none bg-white/95 dark:bg-[#0C1220]/95 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col shadow-2xl pointer-events-auto backdrop-blur-md">
            {/* Search Input & Mobile Close Button */}
            <div className="flex items-center gap-2 mb-2.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-blue-500 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsLeftDrawerOpen(false)}
                className="sm:hidden p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-white border border-slate-200 dark:border-slate-800"
                aria-label={t.closePanel}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Component List */}
            <div className="overflow-y-auto space-y-1 pr-1 flex-1">
              {filteredComponents.map((comp, idx) => {
                const isSelected = selectedId === comp.id;
                const isHighlighted = highlightedIds.includes(comp.id as ComponentId);
                return (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => handleSelectComponent(comp.id as ComponentId)}
                    onDoubleClick={() => handleDoubleClickComponent(comp.id as ComponentId)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between gap-2 group ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-300 dark:border-blue-800'
                        : isHighlighted
                        ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-200 border border-sky-300 dark:border-sky-800'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-slate-400">
                          {String(idx + 1).padStart(2, '0')}.
                        </span>
                        <span className="truncate">{comp.shortName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate pl-4">
                        {comp.category}
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                        isSelected
                          ? 'text-blue-600 dark:text-blue-400 translate-x-0.5'
                          : 'text-slate-400'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* TOP-CENTER OVERLAY: INTERACTIVE BOOT / POST SIMULATION */}
        {currentBootStep && (
          <div className="absolute top-14 sm:top-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-3 sm:px-4 pointer-events-none">
            <div className="bg-white/95 dark:bg-[#0C1220]/95 border border-emerald-300 dark:border-emerald-800 rounded-xl p-3.5 sm:p-4 shadow-2xl pointer-events-auto backdrop-blur-sm">
              <div className="flex items-center justify-between gap-4 mb-1.5">
                <div className="text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                  {t.postHeader(currentBootStep.step, currentBootSequence.length)}
                </div>
                <button
                  type="button"
                  onClick={() => setBootSequenceIndex(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                {currentBootStep.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {currentBootStep.detail}
              </p>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  disabled={bootSequenceIndex === 0}
                  onClick={() => handleStepBootSequence((bootSequenceIndex || 0) - 1)}
                  className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 disabled:opacity-40 text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  {t.prevStep}
                </button>
                <div className="flex items-center gap-1">
                  {currentBootSequence.map((st, idx) => (
                    <button
                      key={st.step}
                      type="button"
                      onClick={() => handleStepBootSequence(idx)}
                      className={`w-4 sm:w-5 h-1.5 rounded-full transition-colors ${
                        idx === bootSequenceIndex
                          ? 'bg-emerald-500'
                          : idx < (bootSequenceIndex || 0)
                          ? 'bg-emerald-300 dark:bg-emerald-800'
                          : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => handleStepBootSequence((bootSequenceIndex || 0) + 1)}
                  className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <span>
                    {(bootSequenceIndex || 0) + 1 < currentBootSequence.length
                      ? t.nextStep
                      : t.finishBoot}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TOP-CENTER OVERLAY: GAMIFIED QUIZ & LEARNING MODE */}
        {isQuizActive && currentQuizQ && (
          <div className="absolute top-14 sm:top-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-3 sm:px-4 pointer-events-none">
            <div className="bg-white/95 dark:bg-[#0C1220]/95 border border-amber-300 dark:border-amber-800 rounded-xl p-3.5 sm:p-4 shadow-2xl pointer-events-auto backdrop-blur-sm">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs font-mono text-amber-700 dark:text-amber-400">
                  <span>
                    {t.quizLevel} {currentQuizQ.level}
                  </span>
                  <span>·</span>
                  <span className="truncate max-w-[140px] sm:max-w-none">{currentQuizQ.levelTitle}</span>
                  <span>·</span>
                  <span>
                    {t.quizQuestionProgress(quizIndex + 1, currentQuizQuestions.length)}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                    {t.quizPoints}: {quizScore}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsQuizActive(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {!quizCompleted ? (
                <>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                    {currentQuizQ.question}
                  </h3>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setQuizShowHint((p) => !p)}
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{quizShowHint ? t.quizHideHint : t.quizShowHint}</span>
                    </button>
                    {explodeFactor < 0.2 && (
                      <button
                        type="button"
                        onClick={() => setExplodeFactor(1)}
                        className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
                      >
                        {t.quizActivateExplode}
                      </button>
                    )}
                  </div>

                  {quizShowHint && !quizAnsweredCorrectly && (
                    <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-200">
                      <b>{t.quizHintLabel}:</b> {currentQuizQ.hint}
                    </div>
                  )}

                  {quizFeedback && (
                    <div
                      className={`mt-2 p-2.5 rounded text-xs border ${
                        quizFeedback.type === 'success'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                          : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                      }`}
                    >
                      {quizFeedback.type === 'success' ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{t.quizCorrectTitle(currentDb[quizFeedback.targetId]?.name || '')}</span>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-1.5 font-bold">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>{t.quizWrongTitle(currentDb[quizFeedback.clickedId]?.name || '')}</span>
                          </div>
                          <p className="mt-1 text-slate-600 dark:text-slate-300">
                            {t.quizHintForTarget}: {currentQuizQ.hint}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {quizAnsweredCorrectly && (
                    <div className="mt-2.5 flex justify-end">
                      <button
                        type="button"
                        onClick={handleNextQuizQuestion}
                        className="px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5"
                      >
                        <span>
                          {quizIndex + 1 < currentQuizQuestions.length
                            ? t.quizNextQuestion
                            : t.quizShowResults}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-2">
                  <Trophy className="w-8 h-8 text-amber-500 mx-auto mb-1.5" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {t.quizCompletedTitle}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    {t.quizCompletedDesc(currentQuizQuestions.length, quizScore)}
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setQuizIndex(0);
                        setQuizScore(0);
                        setQuizStreak(0);
                        setQuizAnsweredCorrectly(false);
                        setQuizCompleted(false);
                        setQuizFeedback(null);
                      }}
                      className="px-3 py-1.5 rounded bg-amber-600 text-white text-xs font-bold"
                    >
                      {t.quizRestart}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsQuizActive(false)}
                      className="px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-medium"
                    >
                      {t.quizBackTo3D}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* RIGHT DRAWER (DESKTOP/TABLET) & BOTTOM-SHEET (MOBILE): INTERACTIVE COMPONENT DETAIL SHEET */}
        {selectedData && !isQuizActive && (
          <aside
            className={`fixed inset-x-0 bottom-0 z-30 w-full rounded-t-2xl border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0C1220]/95 px-4 pt-2 pb-4 shadow-2xl backdrop-blur-md flex flex-col pointer-events-auto transition-all duration-300 md:absolute md:inset-x-auto md:top-4 md:right-4 md:bottom-24 md:w-80 lg:w-96 md:max-h-none md:rounded-xl md:border md:p-4 md:z-20 ${
              isMobileDetailMinimized ? 'max-h-14 overflow-hidden' : 'max-h-[54vh]'
            }`}
          >
            {/* Mobile Bottom-Sheet Pull Handle */}
            <button
              type="button"
              onClick={() => setIsMobileDetailMinimized((p) => !p)}
              className="md:hidden w-full flex flex-col items-center justify-center pb-1.5 cursor-pointer"
              aria-label="Details ein-/ausklappen"
            >
              <span className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            </button>

            {/* Header */}
            <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div
                onClick={() => setIsMobileDetailMinimized((p) => !p)}
                className="min-w-0 flex-1 cursor-pointer md:cursor-default"
              >
                <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 truncate">
                  {selectedData.category}
                </div>
                <h2 className="font-bold text-slate-900 dark:text-white text-base md:text-lg mt-0.5 truncate">
                  {selectedData.name}
                </h2>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMobileDetailMinimized((p) => !p)}
                  className="md:hidden p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  aria-label="Details minimieren"
                >
                  {isMobileDetailMinimized ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  title={t.closePanel}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div
              className={`overflow-y-auto pr-1 my-2.5 space-y-3.5 flex-1 text-xs ${
                isMobileDetailMinimized ? 'hidden md:block' : 'block'
              }`}
            >
              {/* Description */}
              <section>
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{t.secWhatIsIt}</span>
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedData.desc}
                </p>
              </section>

              {/* Tasks */}
              <section className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{t.secMainTasks}</span>
                </h3>
                <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                  {selectedData.tasks.map((task, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-blue-600 dark:text-blue-400 select-none">•</span>
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Specs */}
              <section className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{t.secTechSpecs}</span>
                </h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {selectedData.specs.map((sp, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded"
                    >
                      <div className="text-[10px] text-slate-400">{sp.label}</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                        {sp.value}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Cooperation */}
              <section className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{t.secCooperation}</span>
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedData.coop}
                </p>
              </section>

              {/* Missing Effect ("Was passiert, wenn sie fehlt?") - Kept without 3D failure simulation button */}
              <section className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
                <h3 className="font-bold text-rose-800 dark:text-rose-300 mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  <span>{t.secMissingEffect}</span>
                </h3>
                <p className="text-rose-700 dark:text-rose-200 leading-relaxed">
                  {selectedData.missing}
                </p>
              </section>
            </div>

            {/* Footer Action */}
            <div
              className={`pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-1.5 shrink-0 ${
                isMobileDetailMinimized ? 'hidden md:flex' : 'flex'
              }`}
            >
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsIsolatedView((p) => !p)}
                  className={`py-1.5 px-2 rounded border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    isIsolatedView
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                  }`}
                >
                  <Maximize2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{t.isolatePartBtn(isIsolatedView)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isIsolatedView && explodeFactor > 0.12) {
                      setExplodeFactor(0);
                    } else {
                      setIsIsolatedView(true);
                      setExplodeFactor(0.85);
                    }
                  }}
                  className={`py-1.5 px-2 rounded border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    isIsolatedView && explodeFactor > 0.12
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {t.subExplodeBtn(isIsolatedView && explodeFactor > 0.12)}
                  </span>
                </button>
              </div>

              {/* Layer Explosion Slider & 3D Layer Pins Toggle inside Detail Panel */}
              {isIsolatedView && (
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate">
                      {t.subLayerSliderLabel}
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                      {Math.round(explodeFactor * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(explodeFactor * 100)}
                    onChange={(e) => setExplodeFactor(Number(e.target.value) / 100)}
                    className="w-full accent-amber-500 cursor-pointer h-1.5"
                    aria-label={t.subLayerSliderLabel}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsSubPinsVisible((p) => !p)}
                  className={`py-1.5 px-2 rounded border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    isSubPinsVisible
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{t.subPinsToggleBtn(isSubPinsVisible)}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsIsolatedView(false);
                    setIsDataFlowVisible(true);
                    setIsolatedFlowComponentId(selectedData.id as ComponentId);
                  }}
                  className="py-1.5 px-2 rounded bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Activity className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{t.btnShowDataFlow}</span>
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* 3. COLLAPSIBLE BOTTOM CONTROL DOCK */}
        <div
          className={`
            absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-5xl px-2 sm:px-4 transition-all duration-300
            ${isBottomDockCollapsed ? 'translate-y-[calc(100%-24px)]' : 'translate-y-0'}
            ${selectedData && !isQuizActive && !isMobileDetailMinimized ? 'max-md:opacity-0 max-md:pointer-events-none' : ''}
          `}
        >
          {/* Collapse Handle */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setIsBottomDockCollapsed((p) => !p)}
              className="px-3 py-0.5 rounded-t-lg bg-white dark:bg-[#0C1220] border border-b-0 border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 shadow-sm"
            >
              {isBottomDockCollapsed ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  <span>{t.showControlsKey}</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  <span>{t.hideControlsKey}</span>
                </>
              )}
            </button>
          </div>

          {/* Main Controls Dock */}
          <div className="bg-white/95 dark:bg-[#0C1220]/95 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 shadow-xl flex flex-wrap items-center justify-between gap-2 backdrop-blur-sm max-h-[38vh] overflow-y-auto">
            {/* Explosion Slider */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handleToggleExplode}
                className={`px-2 sm:px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                  explodeFactor > 0.1
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span>{t.btnExplode}</span>
              </button>

              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(explodeFactor * 100)}
                onChange={(e) => setExplodeFactor(Number(e.target.value) / 100)}
                className="w-16 sm:w-20 accent-blue-600 cursor-pointer"
                aria-label={t.btnExplode}
              />
              <span className="text-[11px] sm:text-xs font-mono text-slate-600 dark:text-slate-400 w-8 tabular-nums">
                {Math.round(explodeFactor * 100)}%
              </span>
            </div>

            {/* Case Opacity / X-Ray Slider (Available across all platforms) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handleToggleCaseOpacity}
                className={`px-2 sm:px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                  caseOpacity < 0.85
                    ? 'bg-cyan-600 text-white border-cyan-600'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                }`}
                title={t.caseOpacityLabel}
              >
                <Eye className="w-3.5 h-3.5 shrink-0" />
                <span>{t.caseOpacityLabel}</span>
              </button>

              <input
                type="range"
                min={5}
                max={100}
                value={Math.round(caseOpacity * 100)}
                onChange={(e) => setCaseOpacity(Number(e.target.value) / 100)}
                className="w-16 sm:w-20 accent-cyan-600 cursor-pointer"
                aria-label={t.caseOpacityLabel}
              />
              <span className="text-[11px] sm:text-xs font-mono text-slate-600 dark:text-slate-400 w-8 tabular-nums">
                {Math.round(caseOpacity * 100)}%
              </span>
            </div>

            {/* 3D Cables & Diagnostic Overlays (Cabling, Airflow, Thermal, 3D Pins, 360° Isolation) */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsCablesVisible((p) => !p)}
                className={`px-2 sm:px-2.5 py-1 rounded text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                  isCablesVisible
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'
                }`}
              >
                <Cable className="w-3.5 h-3.5 shrink-0" />
                <span>{t.cablesToggleLabel(isCablesVisible)}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAirflowVisible((p) => !p)}
                className={`px-2 sm:px-2.5 py-1 rounded text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                  isAirflowVisible
                    ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-400 dark:border-sky-700'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'
                }`}
              >
                <Wind className="w-3.5 h-3.5 shrink-0" />
                <span>{t.airflowToggleLabel(isAirflowVisible)}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsThermalMode((p) => !p)}
                className={`px-2 sm:px-2.5 py-1 rounded text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                  isThermalMode
                    ? 'bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-400 dark:border-orange-700'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'
                }`}
              >
                <Thermometer className="w-3.5 h-3.5 shrink-0" />
                <span>{t.thermalToggleLabel(isThermalMode)}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isIsolatedView && selectedId && explodeFactor > 0.12) {
                    setIsSubPinsVisible((p) => !p);
                  } else {
                    setIsPinsVisible((p) => {
                      const next = !p;
                      setIsSubPinsVisible(next);
                      return next;
                    });
                  }
                }}
                className={`px-2 sm:px-2.5 py-1 rounded text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                  (isIsolatedView && selectedId && explodeFactor > 0.12
                    ? isSubPinsVisible
                    : isPinsVisible)
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-400 dark:border-emerald-700'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {t.pinsToggleLabel(
                    isIsolatedView && selectedId && explodeFactor > 0.12
                      ? isSubPinsVisible
                      : isPinsVisible
                  )}
                </span>
              </button>

              <button
                type="button"
                disabled={!selectedId}
                onClick={() => setIsIsolatedView((p) => !p)}
                className={`px-2 sm:px-2.5 py-1 rounded text-xs font-medium border flex items-center gap-1.5 transition-colors disabled:opacity-40 ${
                  isIsolatedView
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-400 dark:border-indigo-700'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5 shrink-0" />
                <span>{t.isolateToggleLabel(isIsolatedView)}</span>
              </button>
            </div>

            {/* Data Flow Bus Toggles */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400">{t.busesLabel}</span>
              {[
                { key: 'all' as FlowCategory, label: t.busAll, color: '#38bdf8' },
                { key: 'cpu_ram' as FlowCategory, label: t.busCpuRam, color: '#38bdf8' },
                { key: 'cpu_storage' as FlowCategory, label: t.busCpuSsd, color: '#10b981' },
                { key: 'psu_all' as FlowCategory, label: t.busPsu, color: '#f59e0b' },
              ].map((bus) => {
                const active = isDataFlowVisible && activeFlowFilter === bus.key;
                return (
                  <button
                    key={bus.key}
                    type="button"
                    onClick={() => {
                      setIsDataFlowVisible(true);
                      setIsolatedFlowComponentId(null);
                      setActiveFlowFilter(bus.key);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                      active
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white border border-blue-500'
                        : 'bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: bus.color }} />
                    <span>{bus.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Camera Presets */}
            <div className="flex flex-wrap items-center gap-1">
              {(
                [
                  { id: 'default', label: t.camOverall },
                  { id: 'cooling', label: t.camCooling },
                  { id: 'mainboard', label: t.camMainboard },
                  { id: 'storage', label: t.camStorage },
                ] as { id: CameraPreset; label: string }[]
              ).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() =>
                    setCameraPresetTrigger((p) => ({
                      preset: preset.id,
                      seq: (p?.seq || 0) + 1,
                    }))
                  }
                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
