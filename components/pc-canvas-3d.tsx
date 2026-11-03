'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ComponentId,
  FlowCategory,
  FLOW_DEFINITIONS,
  HARDWARE_DB,
  PlatformType,
} from '@/lib/hardware-data';
import {
  getPlatformFlows,
  getPlatformHardwareDb,
  LAPTOP_HARDWARE_DB,
  SERVER_HARDWARE_DB,
  SMARTPHONE_HARDWARE_DB,
} from '@/lib/hardware-laptop-server';
import { getLocalizedHardwareDb } from '@/lib/i18n-hardware';
import { Locale, SUB_LAYER_LABELS, ThemeMode } from '@/lib/i18n-ui';
import { createHardwareTextureAtlas } from '@/lib/hardware-textures';

export type CameraPreset =
  | 'default'
  | 'mainboard'
  | 'cooling'
  | 'storage';

interface PcCanvas3DProps {
  platform: PlatformType;
  theme: ThemeMode;
  locale: Locale;
  selectedId: ComponentId | null;
  hoveredId: ComponentId | null;
  disabledIds: ComponentId[];
  highlightedIds: ComponentId[];
  explodeFactor: number; // 0 to 1
  caseOpacity: number; // 0.05 to 1
  isDataFlowVisible: boolean;
  isCablesVisible: boolean;
  isAirflowVisible?: boolean;
  isThermalMode?: boolean;
  isPinsVisible?: boolean;
  isSubPinsVisible?: boolean;
  isIsolatedView?: boolean;
  activeFlowFilter: FlowCategory;
  isolatedFlowComponentId: ComponentId | null;
  cameraPresetTrigger: { preset: CameraPreset; seq: number } | null;
  bootStepComponentId: ComponentId | null;
  onSelectComponent: (id: ComponentId) => void;
  onDoubleClickComponent: (id: ComponentId | null) => void;
  onHoverComponent: (
    id: ComponentId | null,
    clientX: number,
    clientY: number
  ) => void;
}

interface PulseItem {
  mesh: THREE.Mesh;
  line: THREE.Mesh;
  basePoints: THREE.Vector3[];
  curve: THREE.CatmullRomCurve3;
  speed: number;
  progress: number;
  dir: number;
  category: Exclude<FlowCategory, 'all'>;
  involved: ComponentId[];
}

interface AirflowArrowItem {
  cone: THREE.Object3D;
  curve: THREE.CatmullRomCurve3;
  speed: number;
  progress: number;
}

export default function PcCanvas3D({
  platform,
  theme,
  locale,
  selectedId,
  hoveredId,
  disabledIds,
  highlightedIds,
  explodeFactor,
  caseOpacity,
  isDataFlowVisible,
  isCablesVisible,
  isAirflowVisible = false,
  isThermalMode = false,
  isPinsVisible = false,
  isSubPinsVisible = true,
  isIsolatedView = false,
  activeFlowFilter,
  isolatedFlowComponentId,
  cameraPresetTrigger,
  bootStepComponentId,
  onSelectComponent,
  onDoubleClickComponent,
  onHoverComponent,
}: PcCanvas3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const pinElementsRef = useRef<Record<string, HTMLButtonElement | null>>({});
  const subLayerElementsRef = useRef<Record<string, HTMLDivElement | null>>({});

  // Localized component list for 3D Callout Pins
  const localizedPinItems = useMemo(() => {
    const db =
      platform === 'pc'
        ? getLocalizedHardwareDb(locale)
        : getPlatformHardwareDb(platform, locale);
    return Object.values(db).map((item, idx) => ({
      id: item.id as ComponentId,
      index: idx + 1,
      shortName: item.shortName,
      category: item.category,
    }));
  }, [platform, locale]);

  const stateRef = useRef({
    platform,
    theme,
    locale,
    selectedId,
    hoveredId,
    disabledIds,
    highlightedIds,
    explodeFactor,
    caseOpacity,
    isDataFlowVisible,
    isCablesVisible,
    isAirflowVisible,
    isThermalMode,
    isPinsVisible,
    isSubPinsVisible,
    isIsolatedView,
    activeFlowFilter,
    isolatedFlowComponentId,
    bootStepComponentId,
  });

  const callbacksRef = useRef({
    onSelectComponent,
    onDoubleClickComponent,
    onHoverComponent,
  });

  useEffect(() => {
    callbacksRef.current = {
      onSelectComponent,
      onDoubleClickComponent,
      onHoverComponent,
    };
  }, [onSelectComponent, onDoubleClickComponent, onHoverComponent]);

  const sceneObjectsRef = useRef<{
    componentGroups: Record<string, THREE.Group>;
    interactiveMeshes: THREE.Mesh[];
    caseShellMeshes: THREE.Mesh[];
    dataFlowGroup: THREE.Group | null;
    cablesGroup: THREE.Group | null;
    airflowGroup: THREE.Group | null;
    hddActuatorArm: THREE.Object3D | null;
    activePulses: PulseItem[];
    airflowArrows: AirflowArrowItem[];
    rotatingFans: { mesh: THREE.Object3D; ownerId: ComponentId; axis: 'x' | 'y' | 'z'; speed: number }[];
    rebuildPlatformScene: (() => void) | null;
    setCameraGoal: ((pos: THREE.Vector3, lookAt: THREE.Vector3) => void) | null;
    updateVisualHighlights: (() => void) | null;
    updateCaseOpacity: (() => void) | null;
    updateDataFlowVisibility: (() => void) | null;
    updateCablesVisibility: (() => void) | null;
    updateAirflowVisibility: (() => void) | null;
    updateIsolationVisibility: (() => void) | null;
    updateThemeEnvironment: (() => void) | null;
  }>({
    componentGroups: {},
    interactiveMeshes: [],
    caseShellMeshes: [],
    dataFlowGroup: null,
    cablesGroup: null,
    airflowGroup: null,
    hddActuatorArm: null,
    activePulses: [],
    airflowArrows: [],
    rotatingFans: [],
    rebuildPlatformScene: null,
    setCameraGoal: null,
    updateVisualHighlights: null,
    updateCaseOpacity: null,
    updateDataFlowVisibility: null,
    updateCablesVisibility: null,
    updateAirflowVisibility: null,
    updateIsolationVisibility: null,
    updateThemeEnvironment: null,
  });

  // Handle platform change
  useEffect(() => {
    stateRef.current.platform = platform;
    sceneObjectsRef.current.rebuildPlatformScene?.();
  }, [platform]);

  // Handle theme change
  useEffect(() => {
    stateRef.current.theme = theme;
    sceneObjectsRef.current.updateThemeEnvironment?.();
  }, [theme]);

  // Handle prop updates
  useEffect(() => {
    const prevSelected = stateRef.current.selectedId;
    const prevBootComp = stateRef.current.bootStepComponentId;
    const prevIsolated = stateRef.current.isIsolatedView;
    const prevExplode = stateRef.current.explodeFactor;

    stateRef.current = {
      platform,
      theme,
      locale,
      selectedId,
      hoveredId,
      disabledIds,
      highlightedIds,
      explodeFactor,
      caseOpacity,
      isDataFlowVisible,
      isCablesVisible,
      isAirflowVisible,
      isThermalMode,
      isPinsVisible,
      isSubPinsVisible,
      isIsolatedView,
      activeFlowFilter,
      isolatedFlowComponentId,
      bootStepComponentId,
    };

    sceneObjectsRef.current.updateIsolationVisibility?.();
    sceneObjectsRef.current.updateCaseOpacity?.();
    sceneObjectsRef.current.updateVisualHighlights?.();
    sceneObjectsRef.current.updateDataFlowVisibility?.();
    sceneObjectsRef.current.updateCablesVisibility?.();
    sceneObjectsRef.current.updateAirflowVisibility?.();

    const focusId = bootStepComponentId || selectedId;
    const subExplodeTriggered =
      isIsolatedView && prevExplode <= 0.12 && explodeFactor > 0.12;

    if (
      focusId &&
      (focusId !== prevSelected ||
        bootStepComponentId !== prevBootComp ||
        isIsolatedView !== prevIsolated ||
        subExplodeTriggered)
    ) {
      const group = sceneObjectsRef.current.componentGroups[focusId];
      let data = null;
      if (platform === 'pc') data = HARDWARE_DB[focusId as keyof typeof HARDWARE_DB];
      else if (platform === 'laptop') data = LAPTOP_HARDWARE_DB[focusId as keyof typeof LAPTOP_HARDWARE_DB];
      else if (platform === 'server') data = SERVER_HARDWARE_DB[focusId as keyof typeof SERVER_HARDWARE_DB];
      else if (platform === 'smartphone') data = SMARTPHONE_HARDWARE_DB[focusId as keyof typeof SMARTPHONE_HARDWARE_DB];

      if (group && data && sceneObjectsRef.current.setCameraGoal) {
        const basePos = group.userData.basePosition as THREE.Vector3;
        const expPos = group.userData.explodedPosition as THREE.Vector3;
        const currentTargetPos = new THREE.Vector3().lerpVectors(
          basePos,
          expPos,
          isIsolatedView ? 0 : explodeFactor
        );
        const camOffset = new THREE.Vector3(...data.camOffset);
        if (isIsolatedView) {
          if (platform === 'laptop' || platform === 'server') {
            // Side-elevation 3/4 studio angle so horizontal Laptop/Server sub-layers stacked along Y are clearly separated
            camOffset.multiplyScalar(0.62);
            camOffset.y = Math.min(Math.max(camOffset.y * 0.48, 0.95), 1.45);
            if (Math.abs(camOffset.x) < 0.85) {
              camOffset.x = camOffset.x >= 0 ? 1.15 : -1.15;
            }
          } else if (platform === 'smartphone') {
            // Diagonal 3/4 studio angle so Z-stacked Smartphone sub-layers are clearly separated
            camOffset.multiplyScalar(0.58);
            if (Math.abs(camOffset.x) < 0.95) {
              camOffset.x = camOffset.x >= 0 ? 1.15 : -1.15;
            }
          } else {
            camOffset.multiplyScalar(0.56);
          }
        }
        const goalCamPos = currentTargetPos.clone().add(camOffset);
        sceneObjectsRef.current.setCameraGoal(goalCamPos, currentTargetPos);
      }
    }
  }, [
    platform,
    theme,
    locale,
    selectedId,
    hoveredId,
    disabledIds,
    highlightedIds,
    explodeFactor,
    caseOpacity,
    isDataFlowVisible,
    isCablesVisible,
    isAirflowVisible,
    isThermalMode,
    isPinsVisible,
    isSubPinsVisible,
    isIsolatedView,
    activeFlowFilter,
    isolatedFlowComponentId,
    bootStepComponentId,
  ]);

  // Handle Camera Presets
  useEffect(() => {
    if (!cameraPresetTrigger || !sceneObjectsRef.current.setCameraGoal) return;
    const setGoal = sceneObjectsRef.current.setCameraGoal;
    const p = stateRef.current.platform;

    if (p === 'pc') {
      switch (cameraPresetTrigger.preset) {
        case 'default':
          setGoal(new THREE.Vector3(8.2, 3.2, 13.5), new THREE.Vector3(-0.3, 0.1, 0));
          break;
        case 'mainboard':
          setGoal(new THREE.Vector3(-0.6, 0.8, 6.8), new THREE.Vector3(-0.6, 0.6, -0.2));
          break;
        case 'cooling':
          setGoal(new THREE.Vector3(3.2, 4.2, 8.0), new THREE.Vector3(-0.6, 2.8, 0.3));
          break;
        case 'storage':
          setGoal(new THREE.Vector3(5.2, -0.8, 7.8), new THREE.Vector3(2.4, -1.0, 0.1));
          break;
      }
    } else if (p === 'laptop') {
      switch (cameraPresetTrigger.preset) {
        case 'default':
          setGoal(new THREE.Vector3(0, 6.2, 8.8), new THREE.Vector3(0, 0.5, 0));
          break;
        case 'mainboard':
          setGoal(new THREE.Vector3(0, 4.4, 4.2), new THREE.Vector3(0, 0.2, -0.2));
          break;
        case 'cooling':
          setGoal(new THREE.Vector3(0, 4.0, 3.4), new THREE.Vector3(0, 0.5, -0.6));
          break;
        case 'storage':
          setGoal(new THREE.Vector3(1.8, 3.4, 3.5), new THREE.Vector3(1.1, 0.3, 0.4));
          break;
      }
    } else if (p === 'server') {
      switch (cameraPresetTrigger.preset) {
        case 'default':
          setGoal(new THREE.Vector3(4.5, 7.5, 11.2), new THREE.Vector3(0, 0.2, 0));
          break;
        case 'mainboard':
          setGoal(new THREE.Vector3(0, 5.2, 4.8), new THREE.Vector3(0, 0.4, 0.4));
          break;
        case 'cooling':
          setGoal(new THREE.Vector3(0, 4.6, 2.6), new THREE.Vector3(0, 0.6, -0.4));
          break;
        case 'storage':
          setGoal(new THREE.Vector3(0, 3.6, -6.5), new THREE.Vector3(0, 0.2, -3.2));
          break;
      }
    } else if (p === 'smartphone') {
      switch (cameraPresetTrigger.preset) {
        case 'default':
          setGoal(new THREE.Vector3(4.2, 1.8, 7.2), new THREE.Vector3(0, 0.05, 0));
          break;
        case 'mainboard':
          setGoal(new THREE.Vector3(2.2, 0.8, 4.8), new THREE.Vector3(0.45, 0.25, 0));
          break;
        case 'cooling':
          setGoal(new THREE.Vector3(-3.2, 1.1, 4.8), new THREE.Vector3(0, 0.05, 0.08));
          break;
        case 'storage':
          setGoal(new THREE.Vector3(-3.2, 1.1, -6.2), new THREE.Vector3(0, 0.1, -0.15));
          break;
      }
    }
  }, [cameraPresetTrigger]);

  // Main Three.js Lifecycle
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Software WebGL detection
    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      120
    );
    camera.position.set(8.2, 3.2, 13.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.28;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Studio Environment Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.035
    ).texture;
    pmremGenerator.dispose();

    // OrbitControls — Macro Zoom enabled down to 0.85 for inspecting individual chips, traces, pins & screws
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.maxDistance = 36;
    controls.minDistance = 0.85;
    controls.target.set(-0.3, 0.1, 0);

    let camGoalPos: THREE.Vector3 | null = null;
    let camGoalTarget: THREE.Vector3 | null = null;

    controls.addEventListener('start', () => {
      camGoalPos = null;
      camGoalTarget = null;
    });

    sceneObjectsRef.current.setCameraGoal = (pos: THREE.Vector3, lookAt: THREE.Vector3) => {
      camGoalPos = pos.clone();
      camGoalTarget = lookAt.clone();
    };

    // 3. Bright Workshop & Showcase Studio Multi-Point Lighting Rig (LTT / JayzTwoCents Workshop Clarity)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 1.55);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffef8, 2.35);
    keyLight.position.set(12, 18, 15);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Front-Angled Workshop Inspection Softbox Light for maximum PCB trace & dark gunmetal texture visibility
    const workshopFrontLight = new THREE.DirectionalLight(0xf8fafc, 1.45);
    workshopFrontLight.position.set(2, 5, 16);
    scene.add(workshopFrontLight);

    const fillLight = new THREE.PointLight(0x38bdf8, 1.95, 36);
    fillLight.position.set(-10, 6, 11);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xe2e8f0, 1.35);
    rimLight.position.set(-9, 13, -12);
    scene.add(rimLight);

    const groundGrid = new THREE.GridHelper(38, 38, 0x38bdf8, 0x334155);
    groundGrid.position.y = -5.45;
    const gridMat = groundGrid.material as THREE.Material;
    gridMat.opacity = 0.24;
    gridMat.transparent = true;
    scene.add(groundGrid);

    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(34, 24),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
      })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.set(0, -5.43, 0);
    scene.add(shadowPlane);

    // Theme update function
    const updateThemeEnvironment = () => {
      const isDark = stateRef.current.theme === 'dark';
      const bgColor = isDark ? 0x090e18 : 0xeef2f6;
      scene.background = new THREE.Color(bgColor);
      scene.fog = new THREE.FogExp2(bgColor, 0.014);

      if (isDark) {
        hemiLight.color.setHex(0xf1f5f9);
        hemiLight.groundColor.setHex(0x1e293b);
        hemiLight.intensity = 1.48;
        keyLight.intensity = 2.25;
        workshopFrontLight.intensity = 1.38;
        fillLight.color.setHex(0x38bdf8);
        fillLight.intensity = 1.85;
        (groundGrid.material as THREE.Material).opacity = 0.22;
        shadowPlane.material.opacity = 0.32;
      } else {
        hemiLight.color.setHex(0xffffff);
        hemiLight.groundColor.setHex(0x94a3b8);
        hemiLight.intensity = 1.75;
        keyLight.intensity = 2.45;
        workshopFrontLight.intensity = 1.55;
        fillLight.color.setHex(0x0284c7);
        fillLight.intensity = 1.45;
        (groundGrid.material as THREE.Material).opacity = 0.18;
        shadowPlane.material.opacity = 0.14;
      }
    };
    sceneObjectsRef.current.updateThemeEnvironment = updateThemeEnvironment;
    updateThemeEnvironment();

    // 4. Procedural Hardware Texture Atlas
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const atlas = createHardwareTextureAtlas(maxAnisotropy);

    // Master Platform Builder Root Group
    const platformRootGroup = new THREE.Group();
    scene.add(platformRootGroup);

    // Helper: Tag an internal child or sub-group for Sub-Component Explosion in 360° Isolation Mode
    const tagSubLayer = <T extends THREE.Object3D>(
      obj: T,
      offset: [number, number, number],
      labelKey?: string
    ): T => {
      obj.userData.subBasePos = obj.position.clone();
      obj.userData.subExplodeOffset = new THREE.Vector3(...offset);
      if (labelKey) {
        obj.userData.subLayerKey = labelKey;
      }
      return obj;
    };

    // Helper: Create Precision Phillips / Torx Screw Head
    const createScrewHead = (
      radius: number,
      heightOrMetalMat: number | THREE.Material,
      metalOrSlotMat: THREE.Material,
      optionalSlotMat?: THREE.Material
    ): THREE.Group => {
      const height =
        typeof heightOrMetalMat === 'number' ? heightOrMetalMat : radius * 0.72;
      const metalMat =
        typeof heightOrMetalMat === 'number' ? metalOrSlotMat : heightOrMetalMat;
      const slotMat = optionalSlotMat || metalOrSlotMat;

      const sGrp = new THREE.Group();
      const head = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius * 0.88, height, 14),
        metalMat
      );
      const cross1 = new THREE.Mesh(
        new THREE.BoxGeometry(radius * 1.35, height * 0.35, radius * 0.24),
        slotMat
      );
      cross1.position.y = height * 0.42;
      const cross2 = new THREE.Mesh(
        new THREE.BoxGeometry(radius * 0.24, height * 0.35, radius * 1.35),
        slotMat
      );
      cross2.position.y = height * 0.42;
      sGrp.add(head, cross1, cross2);
      return sGrp;
    };

    // Helper: Register Component Group for raycasting, system explosion & sub-component teardown
    const registerComponent = (
      id: ComponentId,
      group: THREE.Group,
      explodeOffset: [number, number, number],
      componentGroups: Record<string, THREE.Group>,
      interactiveMeshes: THREE.Mesh[]
    ) => {
      group.userData.componentId = id;
      group.userData.basePosition = group.position.clone();
      group.userData.explodedPosition = group.position
        .clone()
        .add(new THREE.Vector3(...explodeOffset));

      const subLayerObjects: THREE.Object3D[] = [];

      group.traverse((child) => {
        if (child !== group && child.userData.subExplodeOffset) {
          if (!child.userData.subBasePos) {
            child.userData.subBasePos = child.position.clone();
          }
          subLayerObjects.push(child);
        }

        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.userData.componentId = id;
          mesh.castShadow = !isSoftwareGl;
          mesh.receiveShadow = !isSoftwareGl;

          const cloneMat = (m: THREE.Material) => (m.clone() as THREE.MeshStandardMaterial);
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map(cloneMat);
            const firstMat = mesh.material[0] as THREE.MeshStandardMaterial;
            mesh.userData.origColor = firstMat.color ? firstMat.color.clone() : new THREE.Color(0xffffff);
            mesh.userData.origEmissive = firstMat.emissive ? firstMat.emissive.clone() : new THREE.Color(0);
            mesh.userData.origEmissiveIntensity = firstMat.emissiveIntensity || 0;
            mesh.userData.origOpacity = firstMat.opacity ?? 1;
            mesh.userData.origTransparent = firstMat.transparent ?? false;
          } else {
            const mat = cloneMat(mesh.material);
            mesh.material = mat;
            mesh.userData.origColor = mat.color ? mat.color.clone() : new THREE.Color(0xffffff);
            mesh.userData.origEmissive = mat.emissive ? mat.emissive.clone() : new THREE.Color(0);
            mesh.userData.origEmissiveIntensity = mat.emissiveIntensity || 0;
            mesh.userData.origOpacity = mat.opacity ?? 1;
            mesh.userData.origTransparent = mat.transparent ?? false;
          }
          interactiveMeshes.push(mesh);
        }
      });

      // Automatic fallback anatomical sub-explosion for any component whose children weren't explicitly tagged
      if (subLayerObjects.length === 0 && group.children.length > 1) {
        const count = group.children.length;
        group.children.forEach((child, idx) => {
          const norm = (idx - (count - 1) * 0.5) / Math.max(1, count - 1);
          child.userData.subBasePos = child.position.clone();
          child.userData.subExplodeOffset = new THREE.Vector3(
            norm * 0.35,
            norm * 0.55,
            norm * 0.45
          );
          if (idx === 0) child.userData.subLayerKey = 'pcb_traces';
          else if (idx === count - 1) child.userData.subLayerKey = 'gold_contacts';
          subLayerObjects.push(child);
        });
      }

      group.userData.subLayerObjects = subLayerObjects;
      platformRootGroup.add(group);
      componentGroups[id] = group;
    };

    // =========================================================================
    // REUSABLE MULTI-BLADE ROTOR, HOLLOW FAN FRAME (WITH FDB BEARING) & CABLES
    // =========================================================================
    const bladeEdgeHighlightMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.75,
      roughness: 0.15,
      metalness: 0.3,
    });
    const fdbCopperCoilMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.92,
      roughness: 0.18,
    });
    const fdbBrassSleeveMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.95,
      roughness: 0.14,
    });
    const screwChromeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.92,
      roughness: 0.16,
    });

    const createAxialFanRotor = (
      outerRadius: number,
      thickness: number,
      bladeCount: number,
      bladeMat: THREE.Material,
      hubStickerMat: THREE.Material,
      argbDiscMat?: THREE.Material
    ): THREE.Group => {
      const rotorGroup = new THREE.Group();
      const hubRadius = outerRadius * 0.32;

      // Optional glowing ARGB backing diffuser disc placed behind the blades so blades have high contrast in front
      if (argbDiscMat) {
        const discGeo = new THREE.CylinderGeometry(
          outerRadius * 0.94,
          outerRadius * 0.94,
          thickness * 0.12,
          32
        );
        discGeo.rotateX(Math.PI / 2);
        const discMesh = new THREE.Mesh(discGeo, argbDiscMat);
        discMesh.position.z = -thickness * 0.36;
        rotorGroup.add(discMesh);
      }

      // Central motor hub cylinder (orient along Z axis) + internal steel rotor shaft pin
      const hubGeo = new THREE.CylinderGeometry(hubRadius, hubRadius, thickness * 1.08, 24);
      hubGeo.rotateX(Math.PI / 2);
      const hubMesh = new THREE.Mesh(hubGeo, [
        bladeMat,
        hubStickerMat,
        hubStickerMat,
      ]);
      const shaftGeo = new THREE.CylinderGeometry(hubRadius * 0.18, hubRadius * 0.18, thickness * 1.5, 14);
      shaftGeo.rotateX(Math.PI / 2);
      const shaftMesh = new THREE.Mesh(shaftGeo, screwChromeMat);
      shaftMesh.position.z = -thickness * 0.25;
      rotorGroup.add(hubMesh, shaftMesh);

      // Pitched aerodynamic fan blades with high-contrast leading-edge highlights
      const bladeLen = outerRadius * 0.96 - hubRadius * 0.78;
      const bladeGeo = new THREE.BoxGeometry(
        bladeLen,
        outerRadius * 0.3,
        thickness * 0.32
      );
      const edgeGeo = new THREE.BoxGeometry(
        bladeLen * 0.98,
        0.032,
        thickness * 0.36
      );

      for (let i = 0; i < bladeCount; i++) {
        const angle = (i / bladeCount) * Math.PI * 2;
        const pivot = new THREE.Group();
        pivot.rotation.z = angle;

        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.position.x = hubRadius * 0.76 + bladeLen * 0.5;
        blade.position.z = thickness * 0.08;
        blade.rotation.x = 0.58; // 33-degree aerodynamic pitch
        blade.rotation.y = 0.16;

        // Bright leading-edge strip so every blade visibly slices the air as it spins
        const leadingEdge = new THREE.Mesh(edgeGeo, bladeEdgeHighlightMat);
        leadingEdge.position.set(0, outerRadius * 0.155, 0.01);
        blade.add(leadingEdge);

        pivot.add(blade);
        rotorGroup.add(pivot);
      }

      // Tag rotor so in 360° Isolation Mode + Explode it slides forward off the copper FDB bearing!
      tagSubLayer(rotorGroup, [0, 0, outerRadius * 0.75], 'gpu_shroud_fans');
      return rotorGroup;
    };

    // Open-Bore Hollow Fan Frame with 4 Corner Screws & Visible 6-Pole Copper FDB Bearing Stator
    const createHollowFanFrame = (
      outerSize: number,
      depth: number,
      boreRadius: number,
      frameMat: THREE.Material,
      ringLedMat: THREE.Material
    ): THREE.Group => {
      const frameGroup = new THREE.Group();
      const railThickness = Math.max(0.11, (outerSize - boreRadius * 2) * 0.55);
      const halfSpan = outerSize * 0.5 - railThickness * 0.5;

      // 4 perimeter bars leaving the center circular bore 100% open
      const horizBarGeo = new THREE.BoxGeometry(outerSize, railThickness, depth);
      const topBar = new THREE.Mesh(horizBarGeo, frameMat);
      topBar.position.y = halfSpan;
      const botBar = new THREE.Mesh(horizBarGeo, frameMat);
      botBar.position.y = -halfSpan;

      const vertBarGeo = new THREE.BoxGeometry(
        railThickness,
        outerSize - railThickness * 2,
        depth
      );
      const leftBar = new THREE.Mesh(vertBarGeo, frameMat);
      leftBar.position.x = -halfSpan;
      const rightBar = new THREE.Mesh(vertBarGeo, frameMat);
      rightBar.position.x = halfSpan;
      frameGroup.add(topBar, botBar, leftBar, rightBar);

      // 4 Stainless Steel Corner Fan Mounting Screws
      const cornerOffset = outerSize * 0.42;
      const cornerScrewGeo = new THREE.CylinderGeometry(0.055, 0.055, depth * 1.06, 12);
      cornerScrewGeo.rotateX(Math.PI / 2);
      [
        [-cornerOffset, cornerOffset],
        [cornerOffset, cornerOffset],
        [-cornerOffset, -cornerOffset],
        [cornerOffset, -cornerOffset],
      ].forEach(([cx, cy]) => {
        const sc = new THREE.Mesh(cornerScrewGeo, screwChromeMat);
        sc.position.set(cx, cy, 0);
        frameGroup.add(sc);
      });

      // Open-ended cylindrical tunnel bore
      const tunnelGeo = new THREE.CylinderGeometry(
        boreRadius * 1.02,
        boreRadius * 1.02,
        depth * 0.94,
        32,
        1,
        true
      );
      tunnelGeo.rotateX(Math.PI / 2);
      const tunnelMat = frameMat.clone() as THREE.MeshStandardMaterial;
      tunnelMat.side = THREE.DoubleSide;
      const tunnelMesh = new THREE.Mesh(tunnelGeo, tunnelMat);
      frameGroup.add(tunnelMesh);

      // 4 thin rear stator struts supporting the motor hub
      const strutGeo = new THREE.BoxGeometry(boreRadius * 1.95, 0.045, 0.045);
      const strut1 = new THREE.Mesh(strutGeo, frameMat);
      strut1.position.z = -depth * 0.44;
      strut1.rotation.z = Math.PI / 4;
      const strut2 = new THREE.Mesh(strutGeo, frameMat);
      strut2.position.z = -depth * 0.44;
      strut2.rotation.z = -Math.PI / 4;
      frameGroup.add(strut1, strut2);

      // Fluid Dynamic Bearing (FDB) & 6-Pole Copper Electromagnetic Stator Assembly (visible when rotor explodes!)
      const fdbGroup = new THREE.Group();
      fdbGroup.position.z = -depth * 0.26;
      const brassSleeveGeo = new THREE.CylinderGeometry(
        boreRadius * 0.14,
        boreRadius * 0.14,
        depth * 0.55,
        18
      );
      brassSleeveGeo.rotateX(Math.PI / 2);
      const brassSleeve = new THREE.Mesh(brassSleeveGeo, fdbBrassSleeveMat);
      fdbGroup.add(brassSleeve);

      const coilGeo = new THREE.CylinderGeometry(
        boreRadius * 0.075,
        boreRadius * 0.075,
        boreRadius * 0.22,
        12
      );
      for (let c = 0; c < 6; c++) {
        const cAngle = (c / 6) * Math.PI * 2;
        const coil = new THREE.Mesh(coilGeo, fdbCopperCoilMat);
        coil.position.set(
          Math.cos(cAngle) * boreRadius * 0.18,
          Math.sin(cAngle) * boreRadius * 0.18,
          0
        );
        coil.rotation.z = cAngle - Math.PI / 2;
        fdbGroup.add(coil);
      }
      tagSubLayer(fdbGroup, [0, 0, -depth * 0.85], 'fdb_bearing');
      frameGroup.add(fdbGroup);

      // Dual Front & Rear Glowing ARGB Halo Rings
      const ringGeo = new THREE.TorusGeometry(boreRadius * 0.99, 0.048, 12, 36);
      const frontRing = new THREE.Mesh(ringGeo, ringLedMat);
      frontRing.position.z = depth * 0.48;
      tagSubLayer(frontRing, [0, 0, depth * 0.9]);
      const rearRing = new THREE.Mesh(ringGeo, ringLedMat);
      rearRing.position.z = -depth * 0.48;
      frameGroup.add(frontRing, rearRing);

      return frameGroup;
    };

    const createCentrifugalBlowerRotor = (
      outerRadius: number,
      height: number,
      bladeMat: THREE.Material,
      hubStickerMat: THREE.Material,
      glowMat?: THREE.Material
    ): THREE.Group => {
      const impGroup = new THREE.Group();
      const hubR = outerRadius * 0.36;

      // Center motor cap (orient along Y axis for flat laptop blower)
      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(hubR, hubR, height * 0.92, 24),
        [bladeMat, hubStickerMat, bladeMat]
      );
      impGroup.add(hub);

      // Base ring plate (with optional ARGB glow)
      const baseDisk = new THREE.Mesh(
        new THREE.CylinderGeometry(outerRadius * 0.96, outerRadius * 0.96, height * 0.16, 28),
        glowMat || bladeMat
      );
      baseDisk.position.y = -height * 0.32;
      impGroup.add(baseDisk);

      // 24 dense curved centrifugal fins clearly visible from top
      const finCount = 24;
      const finLen = outerRadius - hubR * 0.82;
      const finGeo = new THREE.BoxGeometry(finLen, height * 0.82, 0.028);
      for (let i = 0; i < finCount; i++) {
        const angle = (i / finCount) * Math.PI * 2;
        const pivot = new THREE.Group();
        pivot.rotation.y = angle;
        const fin = new THREE.Mesh(finGeo, i % 3 === 0 && glowMat ? glowMat : bladeMat);
        fin.position.x = hubR * 0.82 + finLen * 0.5;
        fin.rotation.y = 0.42; // Swept centrifugal angle
        pivot.add(fin);
        impGroup.add(pivot);
      }
      return impGroup;
    };

    const createBraidedTube = (
      points: [number, number, number][],
      radius: number,
      material: THREE.Material
    ): THREE.Mesh => {
      const curve = new THREE.CatmullRomCurve3(
        points.map((p) => new THREE.Vector3(...p))
      );
      const geo = new THREE.TubeGeometry(curve, 32, radius, 10, false);
      const mesh = new THREE.Mesh(geo, material);
      mesh.castShadow = !isSoftwareGl;
      return mesh;
    };

    const createCableWithPlugs = (
      points: [number, number, number][],
      radius: number,
      cableMat: THREE.Material,
      plugMat: THREE.Material,
      combCount = 0
    ): THREE.Group => {
      const grp = new THREE.Group();
      const vecs = points.map((p) => new THREE.Vector3(...p));
      const curve = new THREE.CatmullRomCurve3(vecs);
      const tubeMesh = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 32, radius, 10, false),
        cableMat
      );
      tubeMesh.castShadow = !isSoftwareGl;
      grp.add(tubeMesh);

      // Molded High-Precision Connector Plug Housings with Gold Latch Clip at Start & End
      const plugGeo = new THREE.BoxGeometry(radius * 3.2, radius * 3.2, radius * 4.4);
      const latchGeo = new THREE.BoxGeometry(radius * 1.4, radius * 0.9, radius * 2.8);
      [0.02, 0.98].forEach((t) => {
        const pt = curve.getPointAt(t);
        const tan = curve.getTangentAt(t);
        const plugGrp = new THREE.Group();
        plugGrp.position.copy(pt);
        plugGrp.lookAt(pt.clone().add(tan));
        const plug = new THREE.Mesh(plugGeo, plugMat);
        const latch = new THREE.Mesh(latchGeo, screwChromeMat);
        latch.position.y = radius * 1.85;
        plugGrp.add(plug, latch);
        grp.add(plugGrp);
      });

      // CNC Anodized Custom Cable Combs with metallic trim along the harness
      for (let c = 1; c <= combCount; c++) {
        const t = c / (combCount + 1);
        const pt = curve.getPointAt(t);
        const tan = curve.getTangentAt(t);
        const combGrp = new THREE.Group();
        combGrp.position.copy(pt);
        combGrp.lookAt(pt.clone().add(tan));
        const combBase = new THREE.Mesh(
          new THREE.BoxGeometry(radius * 3.8, radius * 2.8, radius * 1.3),
          plugMat
        );
        const combTrim = new THREE.Mesh(
          new THREE.BoxGeometry(radius * 4.0, radius * 0.65, radius * 1.4),
          screwChromeMat
        );
        combTrim.position.y = radius * 1.15;
        combGrp.add(combBase, combTrim);
        grp.add(combGrp);
      }

      return grp;
    };

    // =========================================================================
    // REBUILD SCENE BASED ON CURRENT PLATFORM (PC / LAPTOP / SERVER)
    // =========================================================================
    const rebuildPlatformScene = () => {
      while (platformRootGroup.children.length > 0) {
        const obj = platformRootGroup.children[0];
        platformRootGroup.remove(obj);
      }

      const componentGroups: Record<string, THREE.Group> = {};
      const interactiveMeshes: THREE.Mesh[] = [];
      const rotatingFans: { mesh: THREE.Object3D; ownerId: ComponentId; axis: 'x' | 'y' | 'z'; speed: number }[] = [];
      const activePulses: PulseItem[] = [];
      const airflowArrows: AirflowArrowItem[] = [];
      let hddActuatorArm: THREE.Object3D | null = null;
      const cablesGroup = new THREE.Group();
      cablesGroup.visible = stateRef.current.isCablesVisible;
      const airflowGroup = new THREE.Group();
      airflowGroup.visible = stateRef.current.isAirflowVisible;

      const currentPlatform = stateRef.current.platform;

      // Calibrated Stealth Gunmetal & Carbon PBR Materials Library (MeshPhysicalMaterial with Brushed Anodized & Carbon Weave Maps)
      const chassisDarkMat = new THREE.MeshPhysicalMaterial({
        map: atlas.brushedGunmetal,
        color: 0xb8c4d4,
        metalness: 0.84,
        roughness: 0.28,
        clearcoat: 0.35,
        clearcoatRoughness: 0.22,
      });
      const chassisSteelMat = new THREE.MeshPhysicalMaterial({
        map: atlas.brushedGunmetal,
        color: 0xd1dce8,
        metalness: 0.88,
        roughness: 0.24,
        clearcoat: 0.38,
      });
      const brushedAluMat = new THREE.MeshPhysicalMaterial({
        map: atlas.brushedGunmetal,
        color: 0xe2e8f0,
        metalness: 0.92,
        roughness: 0.19,
        clearcoat: 0.42,
        clearcoatRoughness: 0.18,
      });
      const darkAnodizedAluMat = new THREE.MeshPhysicalMaterial({
        map: atlas.carbonFiberWeave,
        color: 0xcbd5e1,
        metalness: 0.78,
        roughness: 0.24,
        clearcoat: 0.55,
        clearcoatRoughness: 0.16,
      });
      const nickelMat = new THREE.MeshPhysicalMaterial({
        color: 0xe2e8f0,
        metalness: 0.96,
        roughness: 0.12,
        clearcoat: 0.5,
        clearcoatRoughness: 0.1,
      });
      const mirrorSiliconMat = new THREE.MeshPhysicalMaterial({
        color: 0x1e293b,
        metalness: 0.98,
        roughness: 0.04,
        clearcoat: 1.0,
        clearcoatRoughness: 0.04,
        iridescence: 0.65,
        iridescenceIOR: 1.5,
      });
      const copperMat = new THREE.MeshPhysicalMaterial({
        color: 0xc25e1a,
        metalness: 0.95,
        roughness: 0.16,
        clearcoat: 0.35,
      });
      const goldMat = new THREE.MeshPhysicalMaterial({
        color: 0xfbbf24,
        metalness: 0.97,
        roughness: 0.12,
        clearcoat: 0.45,
      });
      const pcbEdgeMat = new THREE.MeshPhysicalMaterial({
        color: 0x091526,
        metalness: 0.28,
        roughness: 0.48,
        clearcoat: 0.35,
      });
      const greenSubstrateMat = new THREE.MeshPhysicalMaterial({
        color: 0x065f46,
        metalness: 0.24,
        roughness: 0.38,
        clearcoat: 0.45,
      });
      const mattePlasticMat = new THREE.MeshPhysicalMaterial({
        color: 0x111827,
        metalness: 0.15,
        roughness: 0.58,
        clearcoat: 0.12,
      });
      const timPasteMat = new THREE.MeshPhysicalMaterial({
        map: atlas.thermalPastePattern,
        color: 0x94a3b8,
        metalness: 0.35,
        roughness: 0.42,
        clearcoat: 0.25,
      });
      const blueThermalPadMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        metalness: 0.1,
        roughness: 0.65,
      });
      const dustFilterMat = new THREE.MeshPhysicalMaterial({
        map: atlas.dustFilterMesh,
        bumpMap: atlas.dustFilterMesh,
        bumpScale: 0.015,
        metalness: 0.45,
        roughness: 0.55,
      });
      const argbHubMat = new THREE.MeshPhysicalMaterial({
        map: atlas.argbControllerHubTop,
        metalness: 0.35,
        roughness: 0.32,
        clearcoat: 0.4,
      });
      const gpuPcbTraceMat = new THREE.MeshPhysicalMaterial({
        map: atlas.gpuPcbTraces,
        bumpMap: atlas.mainboardBump,
        bumpScale: 0.018,
        metalness: 0.35,
        roughness: 0.32,
        clearcoat: 0.45,
      });
      const fanBladeDarkMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.45,
        roughness: 0.32,
      });
      const fanHubBadgeMat = new THREE.MeshStandardMaterial({
        map: atlas.fanHubSticker,
        metalness: 0.75,
        roughness: 0.22,
      });
      const heatsinkFinsMat = new THREE.MeshStandardMaterial({
        map: atlas.heatsinkFinsAlbedo,
        bumpMap: atlas.heatsinkFinsBump,
        bumpScale: 0.03,
        metalness: 0.85,
        roughness: 0.28,
      });
      const cyanLedMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.85,
        roughness: 0.2,
      });
      const emeraldLedMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.9,
        roughness: 0.2,
      });
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        transparent: true,
        opacity: 0.14,
        roughness: 0.08,
        metalness: 0.1,
        depthWrite: false,
      });

      // Stealth Brushed Gunmetal Chassis Material & Carbon-Fiber Inlay Material (ROG / MSI MEG / Corsair Stealth Build)
      const showcaseWhiteMat = new THREE.MeshPhysicalMaterial({
        map: atlas.brushedGunmetal,
        color: 0x94a3b8,
        metalness: 0.86,
        roughness: 0.25,
        clearcoat: 0.42,
        clearcoatRoughness: 0.2,
      });
      const argbFanDiscMat = new THREE.MeshStandardMaterial({
        map: atlas.argbFanDisc,
        emissive: 0xffffff,
        emissiveMap: atlas.argbFanDisc,
        emissiveIntensity: 0.85,
        roughness: 0.2,
        metalness: 0.1,
      });
      const argbBladeFrostedMat = new THREE.MeshStandardMaterial({
        map: atlas.argbFanDisc,
        emissive: 0xffffff,
        emissiveMap: atlas.argbFanDisc,
        emissiveIntensity: 0.65,
        roughness: 0.22,
        metalness: 0.15,
      });
      const ramRainbowMat = new THREE.MeshStandardMaterial({
        map: atlas.ramRgbLightbar,
        emissive: 0xffffff,
        emissiveMap: atlas.ramRgbLightbar,
        emissiveIntensity: 0.95,
        roughness: 0.15,
      });
      const gpuRogSideMat = new THREE.MeshStandardMaterial({
        map: atlas.gpuSideBadge,
        emissive: 0xffffff,
        emissiveMap: atlas.gpuSideBadge,
        emissiveIntensity: 0.52,
        roughness: 0.24,
        metalness: 0.65,
      });

      // Custom Braided Paracord / PET Cable Sleeve Materials with micro-bump depth
      const sleeveDarkMat = new THREE.MeshPhysicalMaterial({
        map: atlas.braidedCableDark,
        bumpMap: atlas.braidedCableDark,
        bumpScale: 0.015,
        roughness: 0.42,
        metalness: 0.28,
        clearcoat: 0.2,
      });
      const sleeveCyanMat = new THREE.MeshPhysicalMaterial({
        map: atlas.braidedCableCyan,
        bumpMap: atlas.braidedCableCyan,
        bumpScale: 0.015,
        roughness: 0.38,
        metalness: 0.32,
        clearcoat: 0.25,
      });
      const sleeveAmberMat = new THREE.MeshPhysicalMaterial({
        map: atlas.braidedCableAmber,
        bumpMap: atlas.braidedCableAmber,
        bumpScale: 0.015,
        roughness: 0.38,
        metalness: 0.32,
        clearcoat: 0.25,
      });
      const sleevePurpleMat = new THREE.MeshPhysicalMaterial({
        map: atlas.braidedCablePurple,
        bumpMap: atlas.braidedCablePurple,
        bumpScale: 0.015,
        roughness: 0.38,
        metalness: 0.32,
        clearcoat: 0.25,
      });

      const caseShellMeshes: THREE.Mesh[] = [];
      const registerShellGroup = (group: THREE.Object3D) => {
        group.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (Array.isArray(mesh.material)) {
              mesh.material = mesh.material.map((m) => m.clone());
            } else if (mesh.material) {
              mesh.material = mesh.material.clone();
            }
            const firstMat = Array.isArray(mesh.material)
              ? (mesh.material[0] as THREE.MeshStandardMaterial)
              : (mesh.material as THREE.MeshStandardMaterial);
            mesh.userData.isCaseShell = true;
            mesh.userData.shellOrigOpacity = firstMat?.opacity ?? 1;
            mesh.userData.shellOrigTransparent = firstMat?.transparent ?? false;
            mesh.userData.shellOrigDepthWrite = firstMat?.depthWrite ?? true;
            caseShellMeshes.push(mesh);
          }
        });
      };

      if (currentPlatform === 'laptop') {
        // =====================================================================
        // PLATFORM 2: HIGH-REALISM 3D LAPTOP MODEL (14 COMPONENTS + WIRING)
        // =====================================================================
        groundGrid.position.y = -1.6;
        shadowPlane.position.y = -1.58;

        // Unibody CNC Aluminum Base Tub (Structural Shell)
        // Floor spans y = [-0.29, -0.19], perimeter walls span y = [-0.24, +0.36]
        const baseTubGroup = new THREE.Group();
        const bottomPlate = new THREE.Mesh(
          new THREE.BoxGeometry(7.5, 0.1, 5.1),
          brushedAluMat
        );
        bottomPlate.position.set(0, -0.24, 0);
        baseTubGroup.add(bottomPlate);

        // Chamfered perimeter walls
        const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.6, 5.1), brushedAluMat);
        wallLeft.position.set(-3.68, 0.06, 0);
        const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.6, 5.1), brushedAluMat);
        wallRight.position.set(3.68, 0.06, 0);
        const wallFront = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.54, 0.14), brushedAluMat);
        wallFront.position.set(0, 0.03, 2.48);
        const wallBack = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.6, 0.18), darkAnodizedAluMat);
        wallBack.position.set(0, 0.06, -2.46);
        baseTubGroup.add(wallLeft, wallRight, wallFront, wallBack);

        // 4 Anti-slip rubber feet underneath
        [
          [-2.8, -0.31, -1.9],
          [2.8, -0.31, -1.9],
          [-2.8, -0.31, 1.9],
          [2.8, -0.31, 1.9],
        ].forEach(([fx, fy, fz]) => {
          const foot = new THREE.Mesh(
            new THREE.CylinderGeometry(0.28, 0.28, 0.05, 20),
            mattePlasticMat
          );
          foot.position.set(fx, fy, fz);
          baseTubGroup.add(foot);
        });
        registerShellGroup(baseTubGroup);
        platformRootGroup.add(baseTubGroup);

        // Laptop interior ARGB studio point lights (illuminating copper vapor chamber & spinning blowers)
        const laptopGlowL = new THREE.PointLight(0x22d3ee, 0.95, 5.5);
        laptopGlowL.position.set(-1.8, 0.65, -0.35);
        const laptopGlowR = new THREE.PointLight(0xd946ef, 0.95, 5.5);
        laptopGlowR.position.set(1.8, 0.65, -0.35);
        platformRootGroup.add(laptopGlowL, laptopGlowR);

        // 1. Mobile Logic Board (laptop_board) — sits cleanly at y = -0.08 (top surface at -0.055)
        const boardG = new THREE.Group();
        boardG.position.set(0, -0.08, -0.35);
        const boardTopMat = new THREE.MeshStandardMaterial({
          map: atlas.laptopBoardAlbedo,
          bumpMap: atlas.mainboardBump,
          bumpScale: 0.015,
          roughness: 0.38,
          metalness: 0.25,
        });
        const mainPcb = new THREE.Mesh(
          new THREE.BoxGeometry(5.5, 0.05, 2.85),
          [pcbEdgeMat, pcbEdgeMat, boardTopMat, pcbEdgeMat, pcbEdgeMat, pcbEdgeMat]
        );
        tagSubLayer(mainPcb, [0, -0.42, 0], 'pcb_traces');
        boardG.add(mainPcb);

        // DrMOS VRM Power Stages & Inductors around CPU/GPU
        const boardVrmG = new THREE.Group();
        for (let i = 0; i < 10; i++) {
          const choke = new THREE.Mesh(
            new THREE.BoxGeometry(0.16, 0.06, 0.16),
            chassisSteelMat
          );
          choke.position.set(-1.35 + i * 0.28, 0.045, -0.95);
          const cap = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.045, 0.06),
            goldMat
          );
          cap.position.set(-1.35 + i * 0.28, 0.04, -1.15);
          boardVrmG.add(choke, cap);
        }
        tagSubLayer(boardVrmG, [0, 0.25, -0.15], 'vrm_heatsinks');
        boardG.add(boardVrmG);

        // Brass mounting standoffs with screws
        const boardStandoffsG = new THREE.Group();
        [
          [-2.6, 0.03, -1.3],
          [0, 0.03, -1.3],
          [2.6, 0.03, -1.3],
          [-2.6, 0.03, 1.3],
          [2.6, 0.03, 1.3],
        ].forEach(([sx, sy, sz]) => {
          const ring = new THREE.Mesh(
            new THREE.CylinderGeometry(0.09, 0.09, 0.05, 16),
            goldMat
          );
          ring.position.set(sx, sy, sz);
          const screw = createScrewHead(0.05, nickelMat, mattePlasticMat);
          screw.position.set(sx, sy + 0.03, sz);
          boardStandoffsG.add(ring, screw);
        });
        tagSubLayer(boardStandoffsG, [0, 0.58, 0.15], 'gold_contacts');
        boardG.add(boardStandoffsG);

        registerComponent(
          'laptop_board',
          boardG,
          LAPTOP_HARDWARE_DB.laptop_board.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 2. Mobile Processor BGA SoC (laptop_cpu) — sits on logic board at y = -0.03 (die top at +0.015)
        const cpuG = new THREE.Group();
        cpuG.position.set(-0.65, -0.03, -0.45);
        const cpuSub = new THREE.Mesh(
          new THREE.BoxGeometry(0.95, 0.03, 0.72),
          new THREE.MeshStandardMaterial({ map: atlas.cpuSubstrate, roughness: 0.4 })
        );
        tagSubLayer(cpuSub, [0, -0.45, 0], 'substrate_pins');

        // Exposed rectangular P/E-Core Silicon Die + iGPU/NPU Companion Die + Gold SMD MLCCs
        const dieLayerG = new THREE.Group();
        const mainDie = new THREE.Mesh(
          new THREE.BoxGeometry(0.46, 0.03, 0.34),
          mirrorSiliconMat
        );
        mainDie.position.set(-0.12, 0.03, 0);
        const ioDie = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.03, 0.34),
          mirrorSiliconMat
        );
        ioDie.position.set(0.22, 0.03, 0);
        for (let c = 0; c < 6; c++) {
          const smd = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.03), goldMat);
          smd.position.set(-0.35 + c * 0.14, 0.022, 0.27);
          dieLayerG.add(smd);
        }
        dieLayerG.add(mainDie, ioDie);
        tagSubLayer(dieLayerG, [0, 0.08, 0], 'silicon_die');

        // Thin Thermal Paste Layer (TIM) on Mobile CPU Dies
        const cpuTimLayer = new THREE.Mesh(
          new THREE.BoxGeometry(0.76, 0.014, 0.36),
          timPasteMat
        );
        cpuTimLayer.position.set(0.04, 0.048, 0);
        tagSubLayer(cpuTimLayer, [0, 0.58, 0], 'tim');

        cpuG.add(cpuSub, dieLayerG, cpuTimLayer);
        registerComponent(
          'laptop_cpu',
          cpuG,
          LAPTOP_HARDWARE_DB.laptop_cpu.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 3. Discrete Mobile GPU + GDDR6 VRAM (laptop_gpu) — sits on logic board at y = -0.03 (die top at +0.015)
        const gpuG = new THREE.Group();
        gpuG.position.set(0.9, -0.03, -0.45);
        const gpuSub = new THREE.Mesh(
          new THREE.BoxGeometry(1.15, 0.03, 0.95),
          greenSubstrateMat
        );
        tagSubLayer(gpuSub, [0, -0.45, 0], 'substrate_pins');

        const gpuDieVramG = new THREE.Group();
        const gpuDie = new THREE.Mesh(
          new THREE.BoxGeometry(0.54, 0.03, 0.54),
          mirrorSiliconMat
        );
        gpuDie.position.set(0, 0.03, 0);
        // Silver aluminum shim frame around GPU die
        const gpuShim = new THREE.Mesh(
          new THREE.RingGeometry(0.32, 0.42, 4),
          nickelMat
        );
        gpuShim.rotation.x = -Math.PI / 2;
        gpuShim.rotation.z = Math.PI / 4;
        gpuShim.position.y = 0.022;
        gpuDieVramG.add(gpuDie, gpuShim);

        // 4× Surrounding GDDR6 VRAM Packages
        [
          [-0.45, 0.022, -0.24],
          [-0.45, 0.022, 0.24],
          [0.45, 0.022, -0.24],
          [0.45, 0.022, 0.24],
        ].forEach(([vx, vy, vz]) => {
          const vram = new THREE.Mesh(
            new THREE.BoxGeometry(0.22, 0.028, 0.28),
            new THREE.MeshStandardMaterial({ map: atlas.biosChipTop, roughness: 0.3 })
          );
          vram.position.set(vx, vy, vz);
          gpuDieVramG.add(vram);
        });
        tagSubLayer(gpuDieVramG, [0, 0.08, 0], 'gpu_pcb_vram');

        // Mobile GPU Thermal Paste & Blue VRAM Thermal Pads Layer
        const gpuTimPadG = new THREE.Group();
        const gpuTim = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 0.014, 0.5),
          timPasteMat
        );
        gpuTim.position.set(0, 0.048, 0);
        const vramPadL = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.014, 0.78),
          blueThermalPadMat
        );
        vramPadL.position.set(-0.45, 0.042, 0);
        const vramPadR = vramPadL.clone();
        vramPadR.position.set(0.45, 0.042, 0);
        gpuTimPadG.add(gpuTim, vramPadL, vramPadR);
        tagSubLayer(gpuTimPadG, [0, 0.58, 0], 'thermal_pads');

        gpuG.add(gpuSub, gpuDieVramG, gpuTimPadG);
        registerComponent(
          'laptop_gpu',
          gpuG,
          LAPTOP_HARDWARE_DB.laptop_gpu.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 4. Copper Vapor Chamber & Dual Heatpipes (laptop_heatsink)
        // Calibrated low-profile height (y = 0.05, max top y = +0.13) and routed behind blower drums so ZERO clipping occurs!
        const heatG = new THREE.Group();
        heatG.position.set(0, 0.05, -0.55);
        // Central Copper Vapor Chamber Plate over CPU (-0.65) & dGPU (+0.9)
        const vaporPlate = new THREE.Mesh(
          new THREE.BoxGeometry(2.45, 0.04, 0.96),
          copperMat
        );
        vaporPlate.position.set(0.12, 0, 0.1);
        // Black thermal coating center strip
        const blackCoat = new THREE.Mesh(
          new THREE.BoxGeometry(2.1, 0.044, 0.62),
          darkAnodizedAluMat
        );
        blackCoat.position.set(0.12, 0.002, 0.1);
        heatG.add(vaporPlate, blackCoat);

        // Dual flattened sintered copper heatpipes sweeping smoothly behind blower drums to rear exhaust radiators
        const hpCurve1 = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-2.25, 0.03, -0.82),
          new THREE.Vector3(-1.25, 0.03, -0.65),
          new THREE.Vector3(0.12, 0.03, -0.05),
          new THREE.Vector3(1.25, 0.03, -0.65),
          new THREE.Vector3(2.25, 0.03, -0.82),
        ]);
        const hpTube1 = new THREE.Mesh(
          new THREE.TubeGeometry(hpCurve1, 32, 0.048, 12, false),
          copperMat
        );
        hpTube1.scale.y = 0.45; // Flattened laptop heatpipe profile

        const hpCurve2 = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-2.15, 0.03, -0.72),
          new THREE.Vector3(-1.15, 0.03, -0.25),
          new THREE.Vector3(0.12, 0.03, 0.22),
          new THREE.Vector3(1.15, 0.03, -0.25),
          new THREE.Vector3(2.15, 0.03, -0.72),
        ]);
        const hpTube2 = new THREE.Mesh(
          new THREE.TubeGeometry(hpCurve2, 32, 0.045, 12, false),
          copperMat
        );
        hpTube2.scale.y = 0.45;
        heatG.add(hpTube1, hpTube2);

        // Left & Right Rear Exhaust Louvered Copper Fin Arrays (sit cleanly at rear exhaust outlets z = -1.37, y = [-0.05, +0.13])
        const finLeft = new THREE.Mesh(
          new THREE.BoxGeometry(1.05, 0.18, 0.34),
          heatsinkFinsMat
        );
        finLeft.position.set(-2.25, -0.01, -0.82);
        const finRight = new THREE.Mesh(
          new THREE.BoxGeometry(1.05, 0.18, 0.34),
          heatsinkFinsMat
        );
        finRight.position.set(2.25, -0.01, -0.82);
        heatG.add(finLeft, finRight);

        tagSubLayer(vaporPlate, [0, -0.45, 0], 'aio_coldplate');
        tagSubLayer(blackCoat, [0, 0.42, 0], 'thermal_pads');
        tagSubLayer(hpTube1, [0, 0.16, -0.25], 'heatsink_fins');
        tagSubLayer(hpTube2, [0, -0.16, 0.25]);
        tagSubLayer(finLeft, [-0.45, 0.45, -0.45], 'radiator_core');
        tagSubLayer(finRight, [0.45, 0.45, -0.45]);

        registerComponent(
          'laptop_heatsink',
          heatG,
          LAPTOP_HARDWARE_DB.laptop_heatsink.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 5. Dual Centrifugal Radial Blower Fans (laptop_fans)
        // Open-throat volute housing + Copper FDB Bearing Stator + Bottom Dust Filter Mesh
        const fanG = new THREE.Group();
        fanG.position.set(-2.25, 0.04, -0.32);

        const buildSingleBlower = (offsetX: number, isFirst: boolean) => {
          const bUnit = new THREE.Group();
          bUnit.position.x = offsetX;

          // Snail Volute Outer Housing Group
          const voluteHousingG = new THREE.Group();
          const voluteRing = new THREE.Mesh(
            new THREE.CylinderGeometry(0.68, 0.68, 0.17, 28, 1, true),
            darkAnodizedAluMat
          );
          const voluteTopLip = new THREE.Mesh(
            new THREE.RingGeometry(0.52, 0.68, 28),
            darkAnodizedAluMat
          );
          voluteTopLip.rotation.x = -Math.PI / 2;
          voluteTopLip.position.y = 0.085;

          const blowerHalo = new THREE.Mesh(
            new THREE.TorusGeometry(0.51, 0.018, 10, 28),
            cyanLedMat
          );
          blowerHalo.rotation.x = Math.PI / 2;
          blowerHalo.position.y = 0.075;

          const exhaustDuct = new THREE.Mesh(
            new THREE.BoxGeometry(0.84, 0.17, 0.46),
            darkAnodizedAluMat
          );
          exhaustDuct.position.set(0, 0, -0.58);
          voluteHousingG.add(voluteRing, voluteTopLip, blowerHalo, exhaustDuct);
          tagSubLayer(voluteHousingG, [0, 0.12, -0.25], isFirst ? 'gpu_backplate' : undefined);

          // Thin bottom floor plate + Fine-Mesh Intake Dust Filter
          const intakeFloor = new THREE.Mesh(
            new THREE.CylinderGeometry(0.67, 0.67, 0.02, 28),
            dustFilterMat
          );
          intakeFloor.position.y = -0.075;
          tagSubLayer(intakeFloor, [0, -0.55, 0], isFirst ? 'dust_filter' : undefined);

          // 6-Pole Copper Fluid Dynamic Bearing (FDB) Stator inside blower base
          const fdbBlowerG = new THREE.Group();
          fdbBlowerG.position.y = -0.04;
          const brassHub = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 0.09, 14),
            fdbBrassSleeveMat
          );
          fdbBlowerG.add(brassHub);
          for (let c = 0; c < 6; c++) {
            const ca = (c / 6) * Math.PI * 2;
            const coil = new THREE.Mesh(
              new THREE.BoxGeometry(0.09, 0.05, 0.055),
              fdbCopperCoilMat
            );
            coil.position.set(Math.cos(ca) * 0.13, 0, Math.sin(ca) * 0.13);
            coil.rotation.y = -ca;
            fdbBlowerG.add(coil);
          }
          tagSubLayer(fdbBlowerG, [0, -0.22, 0], isFirst ? 'fdb_bearing' : undefined);

          bUnit.add(voluteHousingG, intakeFloor, fdbBlowerG);

          // Multi-blade spinning centrifugal impeller clearly exposed inside the open throat
          const impeller = createCentrifugalBlowerRotor(
            0.49,
            0.16,
            nickelMat,
            fanHubBadgeMat,
            argbBladeFrostedMat
          );
          impeller.position.y = 0.01;
          tagSubLayer(impeller, [0, 0.55, 0], isFirst ? 'gpu_shroud_fans' : undefined);
          bUnit.add(impeller);

          rotatingFans.push({
            mesh: impeller,
            ownerId: 'laptop_fans',
            axis: 'y',
            speed: 10.5,
          });
          return bUnit;
        };

        fanG.add(buildSingleBlower(0, true), buildSingleBlower(4.5, false));
        registerComponent(
          'laptop_fans',
          fanG,
          LAPTOP_HARDWARE_DB.laptop_fans.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 6. Dual-Channel SO-DIMM DDR5 RAM (laptop_ram) — y = 0.02 (max top at +0.11)
        const ramG = new THREE.Group();
        ramG.position.set(0.35, 0.02, 0.42);
        const soDimmFaceMat = new THREE.MeshStandardMaterial({
          map: atlas.ramHeatspreader,
          roughness: 0.35,
          metalness: 0.4,
        });

        for (let s = 0; s < 2; s++) {
          const isFirst = s === 0;
          const stickGrp = new THREE.Group();
          stickGrp.position.set((s - 0.5) * 1.45, s * 0.03, 0);
          stickGrp.rotation.x = -0.06;

          const pcb = new THREE.Mesh(
            new THREE.BoxGeometry(1.28, 0.04, 0.58),
            [pcbEdgeMat, pcbEdgeMat, soDimmFaceMat, greenSubstrateMat, goldMat, pcbEdgeMat]
          );
          tagSubLayer(pcb, [0, -0.42, 0], isFirst ? 'pcb_traces' : undefined);
          stickGrp.add(pcb);

          // 4 Black DDR5 DRAM ICs on each SO-DIMM
          const chipsLayerG = new THREE.Group();
          for (let ic = 0; ic < 4; ic++) {
            const chip = new THREE.Mesh(
              new THREE.BoxGeometry(0.22, 0.022, 0.24),
              mirrorSiliconMat
            );
            chip.position.set(-0.42 + ic * 0.28, 0.028, 0.04);
            chipsLayerG.add(chip);
          }
          tagSubLayer(chipsLayerG, [0, 0.12, 0], isFirst ? 'ram_pcb_chips' : undefined);
          stickGrp.add(chipsLayerG);

          // Silver metal SO-DIMM side retention spring arms + ARGB edge bar
          const clipsLayerG = new THREE.Group();
          const clipL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.55), nickelMat);
          clipL.position.set(-0.67, 0, 0);
          const clipR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.55), nickelMat);
          clipR.position.set(0.67, 0, 0);
          clipsLayerG.add(clipL, clipR);
          tagSubLayer(clipsLayerG, [0, 0.38, 0.2], isFirst ? 'gold_contacts' : undefined);

          const rgbStrip = new THREE.Mesh(
            new THREE.BoxGeometry(1.24, 0.025, 0.06),
            ramRainbowMat
          );
          rgbStrip.position.set(0, 0.03, -0.26);
          tagSubLayer(rgbStrip, [0, 0.62, -0.2], isFirst ? 'ram_diffuser' : undefined);

          stickGrp.add(clipsLayerG, rgbStrip);
          ramG.add(stickGrp);
        }
        registerComponent(
          'laptop_ram',
          ramG,
          LAPTOP_HARDWARE_DB.laptop_ram.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 7. M.2 2280 NVMe SSD (laptop_nvme) — y = 0.01 (max top at +0.07)
        const nvmeG = new THREE.Group();
        nvmeG.position.set(1.85, 0.01, 0.38);
        const nvmeTopMat = new THREE.MeshStandardMaterial({
          map: atlas.nvmeLabel,
          roughness: 0.35,
          metalness: 0.3,
        });
        const nvmeStick = new THREE.Mesh(
          new THREE.BoxGeometry(0.52, 0.03, 1.65),
          [pcbEdgeMat, pcbEdgeMat, greenSubstrateMat, pcbEdgeMat, goldMat, pcbEdgeMat]
        );
        nvmeStick.rotation.y = Math.PI / 2;
        tagSubLayer(nvmeStick, [0, -0.45, 0], 'pcb_traces');

        // Internal NVMe Controller Silicon IC + 2× 3D TLC NAND Packages
        const nvmeChipsG = new THREE.Group();
        const lapNvmeCtrl = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 0.022, 0.28),
          mirrorSiliconMat
        );
        lapNvmeCtrl.position.set(0, 0.022, -0.45);
        const lapNand1 = new THREE.Mesh(
          new THREE.BoxGeometry(0.36, 0.022, 0.38),
          mattePlasticMat
        );
        lapNand1.position.set(0, 0.022, 0.02);
        const lapNand2 = new THREE.Mesh(
          new THREE.BoxGeometry(0.36, 0.022, 0.38),
          mattePlasticMat
        );
        lapNand2.position.set(0, 0.022, 0.48);
        nvmeChipsG.add(lapNvmeCtrl, lapNand1, lapNand2);
        tagSubLayer(nvmeChipsG, [0, 0.05, 0], 'ssd_controller_nand');

        const nvmePad = new THREE.Mesh(
          new THREE.BoxGeometry(0.48, 0.014, 1.5),
          blueThermalPadMat
        );
        nvmePad.position.y = 0.032;
        tagSubLayer(nvmePad, [0, 0.36, 0], 'thermal_pads');

        const nvmePlane = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 0.016, 1.62),
          [copperMat, copperMat, nvmeTopMat, copperMat, copperMat, copperMat]
        );
        nvmePlane.position.y = 0.045;
        tagSubLayer(nvmePlane, [0, 0.68, 0], 'heatsink_fins');

        const nvmeScrew = createScrewHead(0.06, nickelMat, mattePlasticMat);
        nvmeScrew.position.set(0, 0.052, 0.78);
        tagSubLayer(nvmeScrew, [0, 0.88, 0.25], 'gold_contacts');

        nvmeG.add(nvmeStick, nvmeChipsG, nvmePad, nvmePlane, nvmeScrew);
        registerComponent(
          'laptop_nvme',
          nvmeG,
          LAPTOP_HARDWARE_DB.laptop_nvme.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 8. 86Wh 4-Cell Li-Polymer Battery Pack (laptop_battery) — y = 0.01 (spans [-0.09, +0.11])
        const battG = new THREE.Group();
        battG.position.set(0, 0.01, 1.55);
        const battTopMat = new THREE.MeshStandardMaterial({
          map: atlas.laptopBatteryTop,
          roughness: 0.42,
          metalness: 0.2,
        });

        // Bottom Battery Frame & Mounting Flange Tabs
        const battBaseTrayG = new THREE.Group();
        const battLowerFrame = new THREE.Mesh(
          new THREE.BoxGeometry(5.22, 0.04, 1.5),
          mattePlasticMat
        );
        battLowerFrame.position.y = -0.08;
        battBaseTrayG.add(battLowerFrame);
        [-2.4, 0, 2.4].forEach((tx) => {
          const tab = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.18), mattePlasticMat);
          tab.position.set(tx, -0.05, -0.82);
          const screw = createScrewHead(0.05, nickelMat, mattePlasticMat);
          screw.position.set(tx, -0.02, -0.82);
          battBaseTrayG.add(tab, screw);
        });
        tagSubLayer(battBaseTrayG, [0, -0.52, 0], 'gold_contacts');

        // 4× Internal Silver Lithium-Polymer Pouch Cells (revealed on sub-explosion!)
        const liPoCellsG = new THREE.Group();
        for (let c = 0; c < 4; c++) {
          const cellMesh = new THREE.Mesh(
            new THREE.BoxGeometry(1.18, 0.12, 1.24),
            brushedAluMat
          );
          cellMesh.position.set((c - 1.5) * 1.25, -0.01, 0.06);
          const copperTab = new THREE.Mesh(
            new THREE.BoxGeometry(0.24, 0.02, 0.12),
            copperMat
          );
          copperTab.position.set((c - 1.5) * 1.25, 0.04, -0.58);
          liPoCellsG.add(cellMesh, copperTab);
        }
        tagSubLayer(liPoCellsG, [0, 0.08, 0], 'battery_cells');

        // Green BMS (Battery Management System) Protection PCB & Smart Charge Controller IC
        const bmsBoardG = new THREE.Group();
        const bmsPcb = new THREE.Mesh(
          new THREE.BoxGeometry(4.85, 0.03, 0.18),
          greenSubstrateMat
        );
        bmsPcb.position.set(0, 0.05, -0.62);
        const bmsIc = new THREE.Mesh(
          new THREE.BoxGeometry(0.32, 0.025, 0.12),
          mirrorSiliconMat
        );
        bmsIc.position.set(0, 0.07, -0.62);
        bmsBoardG.add(bmsPcb, bmsIc);
        tagSubLayer(bmsBoardG, [0, 0.42, -0.35], 'bms_controller');

        // Outer Black Mylar Battery Cover Shell
        const battPack = new THREE.Mesh(
          new THREE.BoxGeometry(5.2, 0.16, 1.48),
          [mattePlasticMat, mattePlasticMat, battTopMat, mattePlasticMat, mattePlasticMat, mattePlasticMat]
        );
        battPack.position.y = 0.02;
        tagSubLayer(battPack, [0, 0.75, 0], 'gpu_backplate');

        battG.add(battBaseTrayG, liPoCellsG, bmsBoardG, battPack);
        registerComponent(
          'laptop_battery',
          battG,
          LAPTOP_HARDWARE_DB.laptop_battery.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 9. Wi-Fi 7 & Bluetooth M.2 2230 Card (laptop_wifi) — y = 0.01
        const wifiG = new THREE.Group();
        wifiG.position.set(-1.65, 0.01, 0.42);
        const wifiPcb = new THREE.Mesh(
          new THREE.BoxGeometry(0.55, 0.035, 0.68),
          [greenSubstrateMat, greenSubstrateMat, greenSubstrateMat, greenSubstrateMat, goldMat, greenSubstrateMat]
        );
        tagSubLayer(wifiPcb, [0, -0.42, 0], 'pcb_traces');

        // Internal Wi-Fi 7 Tri-Band RF Silicon Transceiver Die under EMI Shield
        const wifiRfDie = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 0.025, 0.28),
          mirrorSiliconMat
        );
        wifiRfDie.position.set(0, 0.022, -0.05);
        tagSubLayer(wifiRfDie, [0, 0.08, 0], 'silicon_die');

        const wifiShield = new THREE.Mesh(
          new THREE.BoxGeometry(0.46, 0.04, 0.46),
          new THREE.MeshStandardMaterial({ map: atlas.networkChipTop, metalness: 0.7, roughness: 0.25 })
        );
        wifiShield.position.set(0, 0.032, -0.05);
        tagSubLayer(wifiShield, [0, 0.45, -0.08], 'ihs');

        // Dual gold U.FL / MHF4 coaxial antenna snap connectors
        const uflJacksG = new THREE.Group();
        const ufl1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.045, 12), goldMat);
        ufl1.position.set(-0.14, 0.03, 0.25);
        const ufl2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.045, 12), goldMat);
        ufl2.position.set(0.14, 0.03, 0.25);
        uflJacksG.add(ufl1, ufl2);
        tagSubLayer(uflJacksG, [0, 0.68, 0.22], 'gold_contacts');

        wifiG.add(wifiPcb, wifiRfDie, wifiShield, uflJacksG);
        registerComponent(
          'laptop_wifi',
          wifiG,
          LAPTOP_HARDWARE_DB.laptop_wifi.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 10. Display Panel & Hinged Aluminum Lid (laptop_display)
        const dispG = new THREE.Group();
        dispG.position.set(0, 2.05, -2.55);
        dispG.rotation.x = -0.28; // Authentic open viewing angle

        const lidShell = new THREE.Mesh(
          new THREE.BoxGeometry(7.5, 4.7, 0.12),
          brushedAluMat
        );
        tagSubLayer(lidShell, [0, 0, -0.75], 'gpu_backplate');

        // Internal Copper eDP Display Controller TCON Bar & Top Wi-Fi Antenna Foils
        const dispBackplaneG = new THREE.Group();
        const tconBoard = new THREE.Mesh(
          new THREE.BoxGeometry(4.2, 0.36, 0.03),
          greenSubstrateMat
        );
        tconBoard.position.set(0, -1.95, 0.05);
        const antFoilL = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.22, 0.02), copperMat);
        antFoilL.position.set(-2.2, 2.12, 0.05);
        const antFoilR = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.22, 0.02), copperMat);
        antFoilR.position.set(2.2, 2.12, 0.05);
        dispBackplaneG.add(tconBoard, antFoilL, antFoilR);
        tagSubLayer(dispBackplaneG, [0, 0, -0.22], 'pcb_traces');

        const screenPanel = new THREE.Mesh(
          new THREE.PlaneGeometry(7.05, 4.22),
          new THREE.MeshStandardMaterial({
            map: atlas.laptopScreenDisplay,
            emissive: 0x0c2442,
            emissiveMap: atlas.laptopScreenDisplay,
            emissiveIntensity: 0.45,
            roughness: 0.15,
            metalness: 0.1,
          })
        );
        screenPanel.position.set(0, -0.04, 0.085);
        tagSubLayer(screenPanel, [0, 0, 0.35], 'display_matrix');

        const bezelHingesG = new THREE.Group();
        const bezelFrame = new THREE.Mesh(
          new THREE.BoxGeometry(7.38, 4.58, 0.04),
          mattePlasticMat
        );
        bezelFrame.position.z = 0.06;

        // Webcam lens + emerald privacy indicator LED at top bezel
        const camLens = new THREE.Mesh(
          new THREE.CylinderGeometry(0.045, 0.045, 0.02, 16),
          mirrorSiliconMat
        );
        camLens.rotation.x = Math.PI / 2;
        camLens.position.set(0, 2.18, 0.085);
        const camLed = new THREE.Mesh(
          new THREE.SphereGeometry(0.022, 10, 10),
          emeraldLedMat
        );
        camLed.position.set(0.12, 2.18, 0.085);

        // Dual CNC Torque Hinges at bottom of lid
        const hingeL = new THREE.Mesh(
          new THREE.CylinderGeometry(0.09, 0.09, 0.85, 16),
          darkAnodizedAluMat
        );
        hingeL.rotation.z = Math.PI / 2;
        hingeL.position.set(-2.2, -2.35, 0.04);
        const hingeR = hingeL.clone();
        hingeR.position.set(2.2, -2.35, 0.04);
        bezelHingesG.add(bezelFrame, camLens, camLed, hingeL, hingeR);
        tagSubLayer(bezelHingesG, [0, -0.15, 0.85], 'gold_contacts');

        dispG.add(lidShell, dispBackplaneG, screenPanel, bezelHingesG);
        registerComponent(
          'laptop_display',
          dispG,
          LAPTOP_HARDWARE_DB.laptop_display.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 11. Keyboard & Glass Trackpad Topcase (laptop_keyboard)
        // Positioned at y = 0.35 (underside at +0.325, well above internal max y = +0.13)
        const topG = new THREE.Group();
        topG.position.set(0, 0.35, 0);
        const palmrestDeck = new THREE.Mesh(
          new THREE.BoxGeometry(7.35, 0.05, 4.95),
          brushedAluMat
        );
        tagSubLayer(palmrestDeck, [0, -0.48, 0], 'gpu_backplate');

        // Internal Per-Key LED Backlight Diffuser Sheet & Scissor Switch Membrane
        const kbdBacklightSheet = new THREE.Mesh(
          new THREE.BoxGeometry(5.52, 0.018, 2.18),
          ramRainbowMat
        );
        kbdBacklightSheet.position.set(0, 0.015, -0.62);
        tagSubLayer(kbdBacklightSheet, [0, 0.08, -0.25], 'ram_diffuser');

        const kbdMatrix = new THREE.Mesh(
          new THREE.BoxGeometry(5.6, 0.04, 2.25),
          [
            mattePlasticMat,
            mattePlasticMat,
            new THREE.MeshStandardMaterial({
              map: atlas.laptopKeyboardTop,
              roughness: 0.4,
              metalness: 0.15,
            }),
            mattePlasticMat,
            mattePlasticMat,
            mattePlasticMat,
          ]
        );
        kbdMatrix.position.set(0, 0.025, -0.62);
        tagSubLayer(kbdMatrix, [0, 0.58, -0.35], 'kbd_matrix');

        // Precision Glass Haptic Trackpad + Fingerprint Power Key
        const trackpadGroup = new THREE.Group();
        const trackpadGlass = new THREE.Mesh(
          new THREE.BoxGeometry(2.55, 0.035, 1.55),
          new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            metalness: 0.55,
            roughness: 0.18,
          })
        );
        trackpadGlass.position.set(0, 0.02, 1.42);

        const pwrButton = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14, 0.14, 0.045, 20),
          darkAnodizedAluMat
        );
        pwrButton.position.set(3.15, 0.025, -1.95);
        const pwrRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.14, 0.015, 8, 24),
          cyanLedMat
        );
        pwrRing.rotation.x = Math.PI / 2;
        pwrRing.position.set(3.15, 0.05, -1.95);
        trackpadGroup.add(trackpadGlass, pwrButton, pwrRing);
        tagSubLayer(trackpadGroup, [0, 0.48, 0.45], 'trackpad_sensor');

        topG.add(palmrestDeck, kbdBacklightSheet, kbdMatrix, trackpadGroup);
        registerComponent(
          'laptop_keyboard',
          topG,
          LAPTOP_HARDWARE_DB.laptop_keyboard.explodeOffset,
          componentGroups,
          interactiveMeshes
        );
        registerShellGroup(topG);

        // 12. I/O Daughterboard & External Ports (laptop_io) — y = 0.0 (max top at +0.11)
        const ioG = new THREE.Group();
        ioG.position.set(-3.1, 0.0, 0.35);
        const ioPcb = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.045, 1.85), greenSubstrateMat);
        tagSubLayer(ioPcb, [0, -0.42, 0], 'pcb_traces');

        // Thunderbolt 4 / USB4 Retimer Controller Silicon Die on I/O Board
        const ioRetimerIc = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.03, 0.28),
          mirrorSiliconMat
        );
        ioRetimerIc.position.set(0.14, 0.035, -0.2);
        tagSubLayer(ioRetimerIc, [0, 0.08, 0], 'silicon_die');

        // Metallic port housings (USB-A, USB-C Thunderbolt, HDMI, 3.5mm Audio)
        const ioPortsShellG = new THREE.Group();
        [-0.65, -0.2, 0.25, 0.68].forEach((pz, idx) => {
          const portShell = new THREE.Mesh(
            new THREE.BoxGeometry(0.38, idx === 2 ? 0.12 : 0.09, idx === 0 ? 0.32 : 0.22),
            nickelMat
          );
          portShell.position.set(-0.28, 0.055, pz);
          ioPortsShellG.add(portShell);
        });
        tagSubLayer(ioPortsShellG, [-0.25, 0.52, 0], 'gold_contacts');

        ioG.add(ioPcb, ioRetimerIc, ioPortsShellG);
        registerComponent(
          'laptop_io',
          ioG,
          LAPTOP_HARDWARE_DB.laptop_io.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 13. Stereo Acoustic Speaker Modules (laptop_speakers) — y = 0.02 (max top at +0.11)
        const spkG = new THREE.Group();
        spkG.position.set(3.1, 0.02, 1.45);

        const buildSpeakerChamber = (xOffset: number, isFirst: boolean) => {
          const sBox = new THREE.Group();
          sBox.position.x = xOffset;
          const chamber = new THREE.Mesh(
            new THREE.BoxGeometry(0.68, 0.15, 1.25),
            mattePlasticMat
          );
          tagSubLayer(chamber, [0, -0.45, 0], isFirst ? 'gpu_backplate' : undefined);
          sBox.add(chamber);

          // Internal Neodymium Voice-Coil Magnets
          const magnetsG = new THREE.Group();
          [-0.32, 0.32].forEach((dz) => {
            const mag = new THREE.Mesh(
              new THREE.CylinderGeometry(0.14, 0.14, 0.06, 16),
              copperMat
            );
            mag.position.set(0, 0.02, dz);
            magnetsG.add(mag);
          });
          tagSubLayer(magnetsG, [0, 0.08, 0], isFirst ? 'fdb_bearing' : undefined);
          sBox.add(magnetsG);

          // Dual oval acoustic woofer/tweeter membranes
          const conesG = new THREE.Group();
          [-0.32, 0.32].forEach((dz) => {
            const cone = new THREE.Mesh(
              new THREE.CylinderGeometry(0.2, 0.16, 0.035, 18),
              nickelMat
            );
            cone.position.set(0, 0.07, dz);
            const surround = new THREE.Mesh(
              new THREE.TorusGeometry(0.2, 0.022, 8, 20),
              copperMat
            );
            surround.rotation.x = Math.PI / 2;
            surround.position.set(0, 0.085, dz);
            conesG.add(cone, surround);
          });
          tagSubLayer(conesG, [0, 0.55, 0], isFirst ? 'hdd_actuator' : undefined);
          sBox.add(conesG);
          return sBox;
        };

        spkG.add(buildSpeakerChamber(0, true), buildSpeakerChamber(-6.2, false));
        registerComponent(
          'laptop_speakers',
          spkG,
          LAPTOP_HARDWARE_DB.laptop_speakers.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 14. UEFI SPI Flash & EC Super-I/O Controller (laptop_bios) — y = -0.02
        const biosG = new THREE.Group();
        biosG.position.set(-0.95, -0.02, 0.35);

        const biosSolderPad = new THREE.Mesh(
          new THREE.BoxGeometry(0.88, 0.015, 0.48),
          goldMat
        );
        biosSolderPad.position.set(0.12, -0.02, 0);
        tagSubLayer(biosSolderPad, [0, -0.42, 0], 'gold_contacts');

        const biosSiliconDie = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 0.02, 0.28),
          mirrorSiliconMat
        );
        biosSiliconDie.position.set(0, 0, 0);
        tagSubLayer(biosSiliconDie, [0, 0.06, 0], 'silicon_die');

        const ecChip = new THREE.Mesh(
          new THREE.BoxGeometry(0.42, 0.04, 0.42),
          [
            mattePlasticMat,
            mattePlasticMat,
            new THREE.MeshStandardMaterial({ map: atlas.biosChipTop, roughness: 0.3 }),
            mattePlasticMat,
            mattePlasticMat,
            mattePlasticMat,
          ]
        );
        tagSubLayer(ecChip, [-0.12, 0.48, 0], 'ssd_controller_nand');

        const spiFlash = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, 0.035, 0.18),
          new THREE.MeshStandardMaterial({ map: atlas.audioChipTop, roughness: 0.3 })
        );
        spiFlash.position.set(0.36, 0, 0);
        tagSubLayer(spiFlash, [0.22, 0.65, 0], 'pcb_traces');

        biosG.add(biosSolderPad, biosSiliconDie, ecChip, spiFlash);
        registerComponent(
          'laptop_bios',
          biosG,
          LAPTOP_HARDWARE_DB.laptop_bios.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // LAPTOP 3D CABLES & RIBBONS (cablesGroup) — routed cleanly inside chassis below y = 0.12
        // 1. Multi-wire 8-Lead Battery Power Harness with White JST Plug (Battery -> Logic Board)
        [-0.08, -0.03, 0.03, 0.08].forEach((ox, idx) => {
          cablesGroup.add(
            createCableWithPlugs(
              [
                [ox, 0.03, 0.88],
                [ox, 0.075, 0.56],
                [-0.12 + ox * 0.6, 0.03, 0.24],
              ],
              0.022,
              idx % 2 === 0 ? sleeveAmberMat : sleeveDarkMat,
              showcaseWhiteMat,
              1
            )
          );
        });

        // 2. Display eDP 1.4b Braided Hinge Cable + Metallic Locking Bar (GPU/Board -> Right Display Hinge)
        cablesGroup.add(
          createCableWithPlugs(
            [
              [1.1, 0.03, -1.08],
              [1.75, 0.06, -1.82],
              [2.18, 0.24, -2.38],
            ],
            0.038,
            sleeveDarkMat,
            nickelMat,
            1
          )
        );

        // 3. I/O Daughterboard Wide Copper Kapton Flex Ribbon with Blue Stiffener Tabs
        const ioFlex = createCableWithPlugs(
          [
            [-2.72, 0.03, 0.35],
            [-2.35, 0.065, 0.35],
            [-1.98, 0.025, 0.35],
          ],
          0.036,
          copperMat,
          cyanLedMat
        );
        ioFlex.scale.y = 0.28;
        cablesGroup.add(ioFlex);

        // 4. Wi-Fi 7 Dual Coaxial Antenna Cables (Black Main + Cyan Aux with Gold IPEX MHF4 Snap Plugs)
        cablesGroup.add(
          createCableWithPlugs(
            [
              [-1.62, 0.035, 0.62],
              [-2.52, 0.025, 0.62],
              [-2.52, 0.025, -1.88],
              [-2.15, 0.24, -2.38],
            ],
            0.018,
            sleeveCyanMat,
            goldMat
          )
        );
        cablesGroup.add(
          createCableWithPlugs(
            [
              [-1.68, 0.035, 0.72],
              [-2.62, 0.025, 0.72],
              [-2.62, 0.025, -1.95],
              [-2.25, 0.24, -2.38],
            ],
            0.018,
            sleeveDarkMat,
            goldMat
          )
        );

        // 5. Trackpad & Keyboard Backlight ZIF Flat Flex Ribbon
        const tpFlex = createCableWithPlugs(
          [
            [0.35, 0.04, 1.55],
            [0.35, 0.06, 0.85],
            [0.35, 0.025, 0.22],
          ],
          0.028,
          copperMat,
          mattePlasticMat
        );
        tpFlex.scale.y = 0.25;
        cablesGroup.add(tpFlex);

        // 6. Dual 4-Pin PWM Blower Fan Leads (Left & Right Fans -> Logic Board)
        cablesGroup.add(
          createCableWithPlugs(
            [
              [-1.85, 0.04, -1.25],
              [-1.55, 0.05, -0.95],
              [-1.25, 0.025, -0.75],
            ],
            0.018,
            sleevePurpleMat,
            showcaseWhiteMat
          ),
          createCableWithPlugs(
            [
              [1.85, 0.04, -1.25],
              [1.55, 0.05, -0.95],
              [1.25, 0.025, -0.75],
            ],
            0.018,
            sleevePurpleMat,
            showcaseWhiteMat
          )
        );
        platformRootGroup.add(cablesGroup);
      } else if (currentPlatform === 'server') {
        // =====================================================================
        // PLATFORM 3: HIGH-REALISM 2U ENTERPRISE RACK SERVER (12 COMPONENTS)
        // =====================================================================
        groundGrid.position.y = -2.2;
        shadowPlane.position.y = -2.18;

        // 19-Inch 2U Rackmount Galvanized Steel Chassis (Structural Shell)
        const srvShell = new THREE.Group();
        const srvFloor = new THREE.Mesh(
          new THREE.BoxGeometry(7.6, 0.14, 10.6),
          chassisSteelMat
        );
        srvFloor.position.set(0, -0.1, 0);
        const srvWallL = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 1.55, 10.6),
          chassisDarkMat
        );
        srvWallL.position.set(-3.73, 0.62, 0);
        const srvWallR = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 1.55, 10.6),
          chassisDarkMat
        );
        srvWallR.position.set(3.73, 0.62, 0);

        // Front 19" EIA-310 Rack Mounting Ears & Handles
        [-4.05, 4.05].forEach((rx) => {
          const ear = new THREE.Mesh(
            new THREE.BoxGeometry(0.52, 1.55, 0.18),
            brushedAluMat
          );
          ear.position.set(rx, 0.62, -5.2);
          const handle = new THREE.Mesh(
            new THREE.BoxGeometry(0.14, 1.15, 0.55),
            mattePlasticMat
          );
          handle.position.set(rx, 0.62, -5.52);
          srvShell.add(ear, handle);
        });
        srvShell.add(srvFloor, srvWallL, srvWallR);
        registerShellGroup(srvShell);
        platformRootGroup.add(srvShell);

        // Server interior studio point lights (highlighting dual wind-tunnel heatsinks & 6-fan wall)
        const srvGlowFront = new THREE.PointLight(0x38bdf8, 1.15, 7.5);
        srvGlowFront.position.set(0, 1.65, -1.8);
        const srvGlowRear = new THREE.PointLight(0x10b981, 0.95, 7.5);
        srvGlowRear.position.set(0, 1.65, 1.8);
        platformRootGroup.add(srvGlowFront, srvGlowRear);

        // 1. Dual-Socket Server Mainboard SSI-EEB (server_board)
        const sBoardG = new THREE.Group();
        sBoardG.position.set(0, 0.05, 0.95);
        const sBoardTopMat = new THREE.MeshStandardMaterial({
          map: atlas.serverBoardAlbedo,
          bumpMap: atlas.mainboardBump,
          bumpScale: 0.02,
          roughness: 0.38,
          metalness: 0.25,
        });
        const sBoardMesh = new THREE.Mesh(
          new THREE.BoxGeometry(7.1, 0.09, 7.2),
          [pcbEdgeMat, pcbEdgeMat, sBoardTopMat, pcbEdgeMat, pcbEdgeMat, pcbEdgeMat]
        );
        tagSubLayer(sBoardMesh, [0, -0.48, 0], 'pcb_traces');
        sBoardG.add(sBoardMesh);

        // Dual LGA-4677 / SP5 Gold Pin Socket Retention Backplates on Server Planar
        const srvSocketBackplatesG = new THREE.Group();
        [-1.35, 1.35].forEach((sx) => {
          const sockPad = new THREE.Mesh(
            new THREE.BoxGeometry(1.48, 0.05, 1.72),
            goldMat
          );
          sockPad.position.set(sx, 0.06, -0.7);
          srvSocketBackplatesG.add(sockPad);
        });
        tagSubLayer(srvSocketBackplatesG, [0, 0.15, -0.2], 'substrate_pins');
        sBoardG.add(srvSocketBackplatesG);

        // Server VRM Heatsink strips & Power Stages at top of sockets
        const srvVrmBarsG = new THREE.Group();
        [-1.35, 1.35].forEach((vx) => {
          const vrmBar = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 0.32, 0.35),
            heatsinkFinsMat
          );
          vrmBar.position.set(vx, 0.2, -1.75);
          const vrmPad = new THREE.Mesh(
            new THREE.BoxGeometry(1.45, 0.03, 0.32),
            blueThermalPadMat
          );
          vrmPad.position.set(vx, 0.05, -1.75);
          srvVrmBarsG.add(vrmBar, vrmPad);
        });
        tagSubLayer(srvVrmBarsG, [0, 0.58, -0.45], 'vrm_heatsinks');
        sBoardG.add(srvVrmBarsG);

        registerComponent(
          'server_board',
          sBoardG,
          SERVER_HARDWARE_DB.server_board.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 2. Dual Enterprise Processors Xeon / EPYC (server_cpus) — with 12-Chiplet Silicon Architecture & TIM Layer
        const sCpuG = new THREE.Group();
        sCpuG.position.set(0, 0.16, 0.25);
        const srvCpuMat = new THREE.MeshStandardMaterial({
          map: atlas.serverCpuIhs,
          metalness: 0.88,
          roughness: 0.18,
        });

        [-1.35, 1.35].forEach((cx, idx) => {
          const isLeft = idx === 0;
          const sockFrame = new THREE.Mesh(
            new THREE.BoxGeometry(1.42, 0.06, 1.68),
            nickelMat
          );
          sockFrame.position.set(cx, 0, 0);
          tagSubLayer(sockFrame, [0, -0.42, 0], isLeft ? 'substrate_pins' : undefined);

          // Internal 12-CCD EPYC / Xeon Silicon Compute Chiplets + Central I/O Die
          const chipletsG = new THREE.Group();
          chipletsG.position.set(cx, 0.03, 0);
          const centralIoDie = new THREE.Mesh(
            new THREE.BoxGeometry(0.42, 0.035, 0.72),
            mirrorSiliconMat
          );
          chipletsG.add(centralIoDie);
          for (let c = 0; c < 8; c++) {
            const side = c < 4 ? -0.36 : 0.36;
            const row = (c % 4 - 1.5) * 0.24;
            const ccd = new THREE.Mesh(
              new THREE.BoxGeometry(0.18, 0.035, 0.16),
              mirrorSiliconMat
            );
            ccd.position.set(side, 0, row);
            chipletsG.add(ccd);
          }
          tagSubLayer(chipletsG, [0, 0.04, 0], isLeft ? 'silicon_die' : undefined);

          const cpuPkg = new THREE.Mesh(
            new THREE.BoxGeometry(1.22, 0.09, 1.48),
            [pcbEdgeMat, pcbEdgeMat, srvCpuMat, greenSubstrateMat, pcbEdgeMat, pcbEdgeMat]
          );
          cpuPkg.position.set(cx, 0.06, 0);
          tagSubLayer(cpuPkg, [0, 0.45, 0], isLeft ? 'ihs' : undefined);

          const srvTim = new THREE.Mesh(
            new THREE.BoxGeometry(0.95, 0.015, 1.15),
            timPasteMat
          );
          srvTim.position.set(cx, 0.115, 0);
          tagSubLayer(srvTim, [0, 0.85, 0], isLeft ? 'tim' : undefined);

          sCpuG.add(sockFrame, chipletsG, cpuPkg, srvTim);
        });
        registerComponent(
          'server_cpus',
          sCpuG,
          SERVER_HARDWARE_DB.server_cpus.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 3. 2U Passive Wind-Tunnel Heatsinks (server_heatsinks)
        const sHeatG = new THREE.Group();
        sHeatG.position.set(0, 0.58, 0.25);

        [-1.35, 1.35].forEach((hx, idx) => {
          const isLeft = idx === 0;
          const hsUnit = new THREE.Group();
          hsUnit.position.x = hx;

          const hsTim = new THREE.Mesh(
            new THREE.BoxGeometry(1.12, 0.014, 1.32),
            timPasteMat
          );
          hsTim.position.y = -0.38;
          tagSubLayer(hsTim, [0, -0.58, 0], isLeft ? 'tim' : undefined);

          const copperBase = new THREE.Mesh(
            new THREE.BoxGeometry(1.36, 0.09, 1.56),
            copperMat
          );
          copperBase.position.y = -0.32;
          tagSubLayer(copperBase, [0, -0.25, 0], isLeft ? 'aio_coldplate' : undefined);

          const finStack = new THREE.Mesh(
            new THREE.BoxGeometry(1.38, 0.68, 1.62),
            heatsinkFinsMat
          );
          finStack.position.y = 0.06;
          tagSubLayer(finStack, [0, 0.25, 0], isLeft ? 'heatsink_fins' : undefined);

          // 4 Copper heatpipes protruding from top of fin stack
          const hpGroup = new THREE.Group();
          [-0.42, -0.14, 0.14, 0.42].forEach((px) => {
            const hpCap = new THREE.Mesh(
              new THREE.CylinderGeometry(0.055, 0.055, 0.78, 12),
              copperMat
            );
            hpCap.position.set(px, 0.06, 0);
            hpGroup.add(hpCap);
          });
          tagSubLayer(hpGroup, [0, 0.65, 0], isLeft ? 'radiator_core' : undefined);

          hsUnit.add(hsTim, copperBase, finStack, hpGroup);
          sHeatG.add(hsUnit);
        });
        registerComponent(
          'server_heatsinks',
          sHeatG,
          SERVER_HARDWARE_DB.server_heatsinks.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 4. 16× DDR5 Registered ECC RDIMMs (server_ram)
        const sRamG = new THREE.Group();
        sRamG.position.set(0, 0.42, 0.25);
        const rdimmMat = new THREE.MeshStandardMaterial({
          map: atlas.ramHeatspreader,
          metalness: 0.65,
          roughness: 0.28,
        });

        // 3 anatomical sub-layer groups across all 16 RDIMM sticks (PCB + Gold Fingers -> ECC DRAM + RCD Chips -> Server Heatspreaders)
        const rdimmPcbLayerG = new THREE.Group();
        const rdimmChipsLayerG = new THREE.Group();
        const rdimmSpreaderLayerG = new THREE.Group();

        const bankCenters = [-2.85, -0.35, 0.35, 2.85];
        bankCenters.forEach((bx) => {
          for (let m = 0; m < 4; m++) {
            const stickX = bx + (m - 1.5) * 0.14;
            const rdimmPcb = new THREE.Mesh(
              new THREE.BoxGeometry(0.032, 0.54, 1.72),
              [greenSubstrateMat, greenSubstrateMat, goldMat, goldMat, pcbEdgeMat, pcbEdgeMat]
            );
            rdimmPcb.position.set(stickX, 0, 0);
            rdimmPcbLayerG.add(rdimmPcb);

            // Central Registering Clock Driver (RCD) + ECC DRAM ICs
            const rcdChip = new THREE.Mesh(
              new THREE.BoxGeometry(0.052, 0.22, 0.24),
              mirrorSiliconMat
            );
            rcdChip.position.set(stickX, 0.02, 0);
            const eccChipF = new THREE.Mesh(
              new THREE.BoxGeometry(0.048, 0.18, 0.45),
              mattePlasticMat
            );
            eccChipF.position.set(stickX, 0.02, -0.52);
            const eccChipB = eccChipF.clone();
            eccChipB.position.set(stickX, 0.02, 0.52);
            rdimmChipsLayerG.add(rcdChip, eccChipF, eccChipB);

            const rdimmSpreader = new THREE.Mesh(
              new THREE.BoxGeometry(0.068, 0.56, 1.75),
              [rdimmMat, rdimmMat, darkAnodizedAluMat, goldMat, pcbEdgeMat, pcbEdgeMat]
            );
            rdimmSpreader.position.set(stickX, 0, 0);
            rdimmSpreaderLayerG.add(rdimmSpreader);
          }
        });
        tagSubLayer(rdimmPcbLayerG, [0, -0.48, 0], 'pcb_traces');
        tagSubLayer(rdimmChipsLayerG, [0, 0.12, 0], 'ram_pcb_chips');
        tagSubLayer(rdimmSpreaderLayerG, [0, 0.65, 0], 'ram_heatspreader');

        sRamG.add(rdimmPcbLayerG, rdimmChipsLayerG, rdimmSpreaderLayerG);
        registerComponent(
          'server_ram',
          sRamG,
          SERVER_HARDWARE_DB.server_ram.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 5. 6× Hot-Swap Counter-Rotating Fan Wall (server_fanwall)
        // Exposed front & rear multi-blade rotors + Copper FDB Bearings + Hot-Swap Latches
        const sFanG = new THREE.Group();
        sFanG.position.set(0, 0.56, -1.65);

        for (let i = 0; i < 6; i++) {
          const isLabeledMod = i === 2;
          const fx = -2.85 + i * 1.14;
          const fanMod = new THREE.Group();
          fanMod.position.x = fx;

          const cage = new THREE.Mesh(
            new THREE.BoxGeometry(1.04, 0.96, 0.52),
            mattePlasticMat
          );
          tagSubLayer(cage, [0, -0.45, 0], isLabeledMod ? 'gpu_backplate' : undefined);

          // Internal 6-Pole Copper Fluid Dynamic Bearing (FDB) Stator Core
          const fdbCore = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.18, 0.42, 16),
            copperMat
          );
          fdbCore.rotation.x = Math.PI / 2;
          tagSubLayer(fdbCore, [0, 0.08, 0], isLabeledMod ? 'fdb_bearing' : undefined);

          // Orange/amber hot-swap quick-release top latch + Glowing cyan status rings
          const latchRingG = new THREE.Group();
          const orangeTab = new THREE.Mesh(
            new THREE.BoxGeometry(0.42, 0.14, 0.28),
            new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.3 })
          );
          orangeTab.position.set(0, 0.54, 0);
          const frontRing = new THREE.Mesh(
            new THREE.TorusGeometry(0.43, 0.022, 10, 24),
            cyanLedMat
          );
          frontRing.position.z = -0.28;
          const rearRing = frontRing.clone();
          rearRing.position.z = 0.28;
          latchRingG.add(orangeTab, frontRing, rearRing);
          tagSubLayer(latchRingG, [0, 0.58, 0], isLabeledMod ? 'gold_contacts' : undefined);

          // Front & rear counter-rotating 9-blade axial rotors positioned outside the cage face
          const rotorFront = createAxialFanRotor(
            0.41,
            0.18,
            9,
            nickelMat,
            fanHubBadgeMat,
            argbFanDiscMat
          );
          rotorFront.position.z = -0.32;
          tagSubLayer(rotorFront, [0, 0, -0.62], isLabeledMod ? 'gpu_shroud_fans' : undefined);

          const rotorRear = createAxialFanRotor(
            0.41,
            0.18,
            9,
            nickelMat,
            fanHubBadgeMat,
            argbFanDiscMat
          );
          rotorRear.position.z = 0.32;
          tagSubLayer(rotorRear, [0, 0, 0.62], undefined);

          fanMod.add(cage, fdbCore, latchRingG, rotorFront, rotorRear);
          sFanG.add(fanMod);
          rotatingFans.push(
            {
              mesh: rotorFront,
              ownerId: 'server_fanwall',
              axis: 'z',
              speed: 12.0,
            },
            {
              mesh: rotorRear,
              ownerId: 'server_fanwall',
              axis: 'z',
              speed: -12.0,
            }
          );
        }
        registerComponent(
          'server_fanwall',
          sFanG,
          SERVER_HARDWARE_DB.server_fanwall.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 6. Molded Polycarbonate Airflow Baffle / Shroud (server_shroud)
        const sShroudG = new THREE.Group();
        sShroudG.position.set(0, 0.88, 0.25);
        const shroudMat = new THREE.MeshStandardMaterial({
          color: 0x94a3b8,
          transparent: true,
          opacity: 0.36,
          roughness: 0.12,
          metalness: 0.15,
        });

        // Internal Airflow Duct Guides for CPU & RDIMM Channels
        const shroudDuctFinsG = new THREE.Group();
        [-2.1, -0.7, 0.7, 2.1].forEach((dx) => {
          const vane = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.45, 2.35),
            darkAnodizedAluMat
          );
          vane.position.set(dx, -0.1, 0);
          shroudDuctFinsG.add(vane);
        });
        tagSubLayer(shroudDuctFinsG, [0, -0.45, 0], 'heatsink_fins');

        const shroudMain = new THREE.Mesh(
          new THREE.BoxGeometry(6.8, 0.62, 2.55),
          shroudMat
        );
        tagSubLayer(shroudMain, [0, 0.12, 0], 'airflow_shroud');

        // Sculpted side guide fins & blue touch-point handle
        const touchHandle = new THREE.Mesh(
          new THREE.BoxGeometry(0.85, 0.08, 0.35),
          new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 })
        );
        touchHandle.position.set(0, 0.33, 0);
        tagSubLayer(touchHandle, [0, 0.65, 0], 'gold_contacts');

        sShroudG.add(shroudDuctFinsG, shroudMain, touchHandle);
        registerComponent(
          'server_shroud',
          sShroudG,
          SERVER_HARDWARE_DB.server_shroud.explodeOffset,
          componentGroups,
          interactiveMeshes
        );
        registerShellGroup(sShroudG);

        // 7. Hardware Tri-Mode MegaRAID Controller + Supercap (server_raid)
        const sRaidG = new THREE.Group();
        sRaidG.position.set(-1.75, 0.62, 2.55);
        const raidPcb = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.85, 2.35),
          [
            new THREE.MeshStandardMaterial({ map: atlas.gpuBackplate, roughness: 0.35 }),
            greenSubstrateMat,
            pcbEdgeMat,
            goldMat,
            pcbEdgeMat,
            pcbEdgeMat,
          ]
        );
        tagSubLayer(raidPcb, [-0.42, -0.25, 0], 'pcb_traces');

        // Broadcom SAS3916 Tri-Mode ROC Silicon Die + 8GB DDR4 Cache ICs + Thermal Pad
        const raidRocLayerG = new THREE.Group();
        const raidRocDie = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 0.32, 0.32),
          mirrorSiliconMat
        );
        raidRocDie.position.set(0.05, 0.05, -0.2);
        const raidTimPad = new THREE.Mesh(
          new THREE.BoxGeometry(0.03, 0.38, 0.65),
          blueThermalPadMat
        );
        raidTimPad.position.set(0.08, 0.05, -0.2);
        raidRocLayerG.add(raidRocDie, raidTimPad);
        tagSubLayer(raidRocLayerG, [0.08, 0.12, -0.15], 'ssd_controller_nand');

        const raidHeatsink = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.48, 0.95),
          heatsinkFinsMat
        );
        raidHeatsink.position.set(0.14, 0.05, -0.2);
        tagSubLayer(raidHeatsink, [0.55, 0.45, -0.15], 'heatsink_fins');

        // Cylindrical Tantalum Supercap Cache Backup Module
        const supercap = new THREE.Mesh(
          new THREE.CylinderGeometry(0.22, 0.22, 0.78, 20),
          nickelMat
        );
        supercap.rotation.x = Math.PI / 2;
        supercap.position.set(0.28, -0.1, 0.62);
        tagSubLayer(supercap, [0.65, -0.35, 0.45], 'raid_supercap');

        sRaidG.add(raidPcb, raidRocLayerG, raidHeatsink, supercap);
        registerComponent(
          'server_raid',
          sRaidG,
          SERVER_HARDWARE_DB.server_raid.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 8. 8× 2.5" U.3 NVMe Hot-Swap Drive Caddies & Backplane (server_drives)
        const sDriveG = new THREE.Group();
        sDriveG.position.set(0, 0.48, -3.85);
        const caddyFaceMat = new THREE.MeshStandardMaterial({
          map: atlas.serverDriveCaddyFront,
          roughness: 0.32,
          metalness: 0.45,
        });
        const ssdBodyMat = new THREE.MeshStandardMaterial({
          map: atlas.sataSsdTop,
          roughness: 0.35,
          metalness: 0.5,
        });

        // Vertical Hot-Swap Backplane PCB behind the 8 drive bays + Gold U.3 SFF-8639 Connectors
        const backplaneGroup = new THREE.Group();
        const backplanePcb = new THREE.Mesh(
          new THREE.BoxGeometry(7.1, 1.15, 0.12),
          new THREE.MeshStandardMaterial({ map: atlas.serverBoardAlbedo, roughness: 0.4 })
        );
        backplanePcb.position.set(0, 0.05, 1.25);
        backplaneGroup.add(backplanePcb);
        for (let b = 0; b < 4; b++) {
          const u3Conn = new THREE.Mesh(
            new THREE.BoxGeometry(0.65, 0.85, 0.16),
            goldMat
          );
          u3Conn.position.set(-2.62 + b * 1.75, 0.05, 1.16);
          backplaneGroup.add(u3Conn);
        }
        tagSubLayer(backplaneGroup, [0, 0, 0.95], 'server_backplane');
        sDriveG.add(backplaneGroup);

        const caddiesShellG = new THREE.Group();
        const drivesInternalPcbG = new THREE.Group();
        const caddyLatchesG = new THREE.Group();

        for (let i = 0; i < 8; i++) {
          const col = i % 4;
          const row = Math.floor(i / 4);
          const cx = -2.62 + col * 1.75;
          const cy = (row - 0.5) * 0.52 + 0.05;

          const caddyMesh = new THREE.Mesh(
            new THREE.BoxGeometry(1.62, 0.44, 2.15),
            [
              brushedAluMat,
              brushedAluMat,
              ssdBodyMat,
              brushedAluMat,
              goldMat,
              caddyFaceMat,
            ]
          );
          caddyMesh.position.set(cx, cy, 0);
          caddiesShellG.add(caddyMesh);

          // Internal Enterprise U.3 NVMe PCB + 3D NAND Flash Array inside each caddy
          const intSsdPcb = new THREE.Mesh(
            new THREE.BoxGeometry(1.42, 0.06, 1.85),
            greenSubstrateMat
          );
          intSsdPcb.position.set(cx, cy + 0.08, 0.05);
          const intNand = new THREE.Mesh(
            new THREE.BoxGeometry(0.85, 0.08, 1.15),
            mirrorSiliconMat
          );
          intNand.position.set(cx, cy + 0.12, 0.05);
          drivesInternalPcbG.add(intSsdPcb, intNand);

          // Front Hot-Swap Ejector Release Lever & Emerald Activity LED
          const ejectBar = new THREE.Mesh(
            new THREE.BoxGeometry(1.48, 0.14, 0.12),
            darkAnodizedAluMat
          );
          ejectBar.position.set(cx, cy, -1.12);
          const latchBtn = new THREE.Mesh(
            new THREE.BoxGeometry(0.24, 0.18, 0.14),
            emeraldLedMat
          );
          latchBtn.position.set(cx + 0.58, cy, -1.13);
          caddyLatchesG.add(ejectBar, latchBtn);
        }
        tagSubLayer(caddiesShellG, [0, -0.25, -0.2], 'gpu_backplate');
        tagSubLayer(drivesInternalPcbG, [0, 0.52, 0.1], 'ssd_controller_nand');
        tagSubLayer(caddyLatchesG, [0, 0, -0.88], 'gold_contacts');

        sDriveG.add(caddiesShellG, drivesInternalPcbG, caddyLatchesG);
        registerComponent(
          'server_drives',
          sDriveG,
          SERVER_HARDWARE_DB.server_drives.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 9. 2× Redundant 1600W 80+ Titanium Hot-Swap CRPS PSUs (server_psus)
        const sPsuG = new THREE.Group();
        sPsuG.position.set(2.05, 0.52, 3.25);
        const crpsTopMat = new THREE.MeshStandardMaterial({
          map: atlas.serverPsuLabel,
          roughness: 0.32,
          metalness: 0.55,
        });

        [-0.78, 0.78].forEach((px, idx) => {
          const isFirst = idx === 0;
          const pUnit = new THREE.Group();
          pUnit.position.x = px;

          const body = new THREE.Mesh(
            new THREE.BoxGeometry(1.42, 0.82, 2.95),
            [brushedAluMat, brushedAluMat, crpsTopMat, brushedAluMat, mattePlasticMat, goldMat]
          );
          tagSubLayer(body, [0, -0.48, 0], isFirst ? 'gpu_backplate' : undefined);

          // Internal 1600W Titanium Switching Transformers, PFC Toroid & Bulk Capacitors
          const crpsInternalsG = new THREE.Group();
          const mainXfmr = new THREE.Mesh(
            new THREE.BoxGeometry(0.58, 0.52, 0.68),
            copperMat
          );
          mainXfmr.position.set(-0.18, 0.08, -0.25);
          const bulkCap1 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.22, 0.22, 0.56, 16),
            darkAnodizedAluMat
          );
          bulkCap1.position.set(0.32, 0.08, -0.55);
          const bulkCap2 = bulkCap1.clone();
          bulkCap2.position.set(0.32, 0.08, 0.15);
          crpsInternalsG.add(mainXfmr, bulkCap1, bulkCap2);
          tagSubLayer(crpsInternalsG, [0, 0.28, -0.15], isFirst ? 'psu_transformers' : undefined);

          // Front Gold-Plated Hot-Swap Power Distribution Edge Connector
          const crpsGoldEdge = new THREE.Mesh(
            new THREE.BoxGeometry(1.15, 0.14, 0.28),
            goldMat
          );
          crpsGoldEdge.position.set(0, -0.22, -1.52);
          tagSubLayer(crpsGoldEdge, [0, -0.15, -0.75], isFirst ? 'gold_contacts' : undefined);

          // Rear pull handle + emerald hot-swap release latch + status LED
          const crpsLatchG = new THREE.Group();
          const pullBar = new THREE.Mesh(
            new THREE.BoxGeometry(0.85, 0.14, 0.38),
            mattePlasticMat
          );
          pullBar.position.set(-0.15, -0.18, 1.62);
          const greenLatch = new THREE.Mesh(
            new THREE.BoxGeometry(0.24, 0.42, 0.28),
            emeraldLedMat
          );
          greenLatch.position.set(0.45, 0, 1.58);
          crpsLatchG.add(pullBar, greenLatch);
          tagSubLayer(crpsLatchG, [0, 0.42, 0.55], undefined);

          // Spinning 40mm High-RPM Rear PSU Cooling Fan
          const psuMiniRotor = createAxialFanRotor(
            0.28,
            0.14,
            9,
            nickelMat,
            fanHubBadgeMat
          );
          psuMiniRotor.position.set(-0.22, 0.1, 1.52);
          tagSubLayer(psuMiniRotor, [0, 0.15, 0.92], isFirst ? 'psu_fan_grille' : undefined);
          rotatingFans.push({
            mesh: psuMiniRotor,
            ownerId: 'server_psus',
            axis: 'z',
            speed: 14.0,
          });

          pUnit.add(body, crpsInternalsG, crpsGoldEdge, crpsLatchG, psuMiniRotor);
          sPsuG.add(pUnit);
        });
        registerComponent(
          'server_psus',
          sPsuG,
          SERVER_HARDWARE_DB.server_psus.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 10. 100GbE Dual-Port QSFP28 Network Adapter (server_nic)
        const sNicG = new THREE.Group();
        sNicG.position.set(-0.55, 0.62, 2.75);
        const nicPcb = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.76, 2.05),
          [greenSubstrateMat, greenSubstrateMat, pcbEdgeMat, goldMat, pcbEdgeMat, pcbEdgeMat]
        );
        tagSubLayer(nicPcb, [-0.42, -0.25, 0], 'pcb_traces');

        // Internal 100GbE Network ASIC Silicon Die + Thermal Pad
        const nicDiePadG = new THREE.Group();
        const nicAsicDie = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 0.3, 0.3),
          mirrorSiliconMat
        );
        nicAsicDie.position.set(0.05, 0.04, -0.15);
        const nicTimPad = new THREE.Mesh(
          new THREE.BoxGeometry(0.03, 0.42, 0.75),
          blueThermalPadMat
        );
        nicTimPad.position.set(0.07, 0.04, -0.15);
        nicDiePadG.add(nicAsicDie, nicTimPad);
        tagSubLayer(nicDiePadG, [0.08, 0.12, -0.15], 'silicon_die');

        const nicHeatsink = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, 0.48, 0.85),
          heatsinkFinsMat
        );
        nicHeatsink.position.set(0.12, 0.04, -0.15);
        tagSubLayer(nicHeatsink, [0.55, 0.45, -0.15], 'heatsink_fins');

        // Dual metallic QSFP28 optical cages protruding at rear
        const qsfpCagesG = new THREE.Group();
        const qsfp1 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.24, 0.65), nickelMat);
        qsfp1.position.set(0.1, 0.15, 0.85);
        const qsfp2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.24, 0.65), nickelMat);
        qsfp2.position.set(0.1, -0.15, 0.85);
        qsfpCagesG.add(qsfp1, qsfp2);
        tagSubLayer(qsfpCagesG, [0.25, 0, 0.75], 'gold_contacts');

        sNicG.add(nicPcb, nicDiePadG, nicHeatsink, qsfpCagesG);
        registerComponent(
          'server_nic',
          sNicG,
          SERVER_HARDWARE_DB.server_nic.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 11. ASPEED AST2600 BMC / IPMI Controller (server_bmc)
        const sBmcG = new THREE.Group();
        sBmcG.position.set(-2.65, 0.18, 3.15);

        const bmcSubstrate = new THREE.Mesh(
          new THREE.BoxGeometry(0.68, 0.03, 0.68),
          [greenSubstrateMat, greenSubstrateMat, goldMat, greenSubstrateMat, greenSubstrateMat, greenSubstrateMat]
        );
        bmcSubstrate.position.y = -0.04;
        tagSubLayer(bmcSubstrate, [0, -0.45, 0], 'pcb_traces');

        const bmcSiliconDie = new THREE.Mesh(
          new THREE.BoxGeometry(0.34, 0.03, 0.34),
          mirrorSiliconMat
        );
        bmcSiliconDie.position.y = -0.01;
        tagSubLayer(bmcSiliconDie, [0, 0.06, 0], 'silicon_die');

        const bmcIc = new THREE.Mesh(
          new THREE.BoxGeometry(0.58, 0.08, 0.58),
          [
            mattePlasticMat,
            mattePlasticMat,
            new THREE.MeshStandardMaterial({ map: atlas.biosChipTop, roughness: 0.28 }),
            mattePlasticMat,
            mattePlasticMat,
            mattePlasticMat,
          ]
        );
        tagSubLayer(bmcIc, [0, 0.48, -0.2], 'ssd_controller_nand');

        // Dedicated Out-of-Band RJ45 IPMI Management Port at rear edge
        const ipmiPort = new THREE.Mesh(
          new THREE.BoxGeometry(0.45, 0.38, 0.52),
          nickelMat
        );
        ipmiPort.position.set(0, 0.16, 1.05);
        tagSubLayer(ipmiPort, [0, 0.35, 0.65], 'gold_contacts');

        sBmcG.add(bmcSubstrate, bmcSiliconDie, bmcIc, ipmiPort);
        registerComponent(
          'server_bmc',
          sBmcG,
          SERVER_HARDWARE_DB.server_bmc.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 12. Tool-less PCIe 5.0 Riser Cage Assembly (server_riser)
        const sRiserG = new THREE.Group();
        sRiserG.position.set(-1.15, 0.82, 2.55);

        // Internal Vertical PCIe 5.0 x16 Riser PCB & High-Speed Expansion Slots
        const riserPcbSlotsG = new THREE.Group();
        const riserPcb = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.72, 2.25),
          [greenSubstrateMat, greenSubstrateMat, pcbEdgeMat, goldMat, pcbEdgeMat, pcbEdgeMat]
        );
        riserPcb.position.set(-0.65, -0.1, 0);
        const riserSlot1 = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, 0.16, 1.65),
          nickelMat
        );
        riserSlot1.position.set(-0.55, 0.05, -0.15);
        const riserSlot2 = riserSlot1.clone();
        riserSlot2.position.set(-0.55, -0.25, -0.15);
        riserPcbSlotsG.add(riserPcb, riserSlot1, riserSlot2);
        tagSubLayer(riserPcbSlotsG, [-0.42, -0.42, 0], 'pcb_traces');

        const riserCageG = new THREE.Group();
        const riserTopBar = new THREE.Mesh(
          new THREE.BoxGeometry(1.65, 0.12, 2.45),
          brushedAluMat
        );
        riserTopBar.position.y = 0.22;
        const riserRearBracket = new THREE.Mesh(
          new THREE.BoxGeometry(1.65, 0.85, 0.12),
          brushedAluMat
        );
        riserRearBracket.position.set(0, -0.12, 1.18);
        riserCageG.add(riserTopBar, riserRearBracket);
        tagSubLayer(riserCageG, [0, 0.12, 0.25], 'gpu_backplate');

        // Blue anodized tool-less thumbscrews
        const riserKnobsG = new THREE.Group();
        [-0.85, 0.85].forEach((tz) => {
          const knob = new THREE.Mesh(
            new THREE.CylinderGeometry(0.14, 0.14, 0.18, 16),
            new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.25 })
          );
          knob.position.set(0, 0.32, tz);
          riserKnobsG.add(knob);
        });
        tagSubLayer(riserKnobsG, [0, 0.65, 0], 'gold_contacts');

        sRiserG.add(riserPcbSlotsG, riserCageG, riserKnobsG);
        registerComponent(
          'server_riser',
          sRiserG,
          SERVER_HARDWARE_DB.server_riser.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // SERVER 3D CABLES & HARNESSES (cablesGroup)
        // 1. 4× High-density SlimSAS (SFF-8654) / MCIO PCIe Gen5 Cables (Backplane -> MegaRAID & Mainboard)
        cablesGroup.add(
          createCableWithPlugs(
            [
              [-2.2, 0.45, -2.65],
              [-3.35, 0.35, -0.8],
              [-3.25, 0.45, 1.2],
              [-1.78, 0.58, 1.85],
            ],
            0.052,
            sleeveCyanMat,
            nickelMat,
            2
          ),
          createCableWithPlugs(
            [
              [-0.75, 0.45, -2.65],
              [-3.15, 0.25, -0.8],
              [-3.05, 0.35, 1.35],
              [-1.78, 0.42, 2.15],
            ],
            0.052,
            sleeveCyanMat,
            nickelMat,
            2
          ),
          createCableWithPlugs(
            [
              [0.75, 0.45, -2.65],
              [3.15, 0.25, -0.8],
              [1.2, 0.35, 1.15],
              [-1.68, 0.48, 1.95],
            ],
            0.052,
            sleevePurpleMat,
            nickelMat,
            2
          ),
          createCableWithPlugs(
            [
              [2.2, 0.45, -2.65],
              [3.35, 0.35, -0.8],
              [2.85, 0.25, 1.55],
              [1.85, 0.18, 2.25],
            ],
            0.052,
            sleevePurpleMat,
            nickelMat,
            2
          )
        );

        // 2. Dual Redundant 12V CRPS Server Power Bus Harnesses (PSUs -> Server Mainboard)
        cablesGroup.add(
          createCableWithPlugs(
            [
              [1.35, 0.38, 1.78],
              [1.15, 0.24, 1.18],
              [0.75, 0.16, 0.65],
            ],
            0.064,
            sleeveAmberMat,
            mattePlasticMat,
            1
          ),
          createCableWithPlugs(
            [
              [2.65, 0.38, 1.78],
              [2.15, 0.24, 1.18],
              [1.45, 0.16, 0.65],
            ],
            0.064,
            sleeveDarkMat,
            mattePlasticMat,
            1
          )
        );

        // 3. RAID Supercap Cache Backup Line & 6-Fan Wall Power/PWM Bus
        cablesGroup.add(
          createCableWithPlugs(
            [
              [-2.22, 0.48, 2.55],
              [-2.02, 0.68, 2.55],
              [-1.78, 0.62, 2.45],
            ],
            0.032,
            sleeveAmberMat,
            goldMat
          ),
          createCableWithPlugs(
            [
              [-2.85, 0.18, -1.35],
              [0, 0.18, -1.25],
              [2.85, 0.18, -1.35],
              [2.95, 0.15, -0.45],
            ],
            0.036,
            sleeveDarkMat,
            mattePlasticMat
          )
        );
        platformRootGroup.add(cablesGroup);

      } else if (currentPlatform === 'smartphone') {
        // =====================================================================
        // PLATFORM 4: FLAGSHIP 3D SMARTPHONE TEARDOWN (13 MODULES + BILATERAL EXPLOSION)
        // =====================================================================
        groundGrid.position.y = -3.45;
        shadowPlane.position.y = -3.43;

        // Subtle Studio Rim & Internal Accent Lights for Smartphone Micro-Details
        const phoneRimFront = new THREE.PointLight(0x38bdf8, 1.05, 7.5);
        phoneRimFront.position.set(2.2, 1.8, 2.8);
        const phoneRimBack = new THREE.PointLight(0xf59e0b, 0.95, 7.5);
        phoneRimBack.position.set(-2.2, -1.2, -2.8);
        platformRootGroup.add(phoneRimFront, phoneRimBack);

        // ---------------------------------------------------------------------
        // CNC Brushed Titanium / Stealth Gunmetal Unibody Frame & Gorilla Glass Back Shell
        // Controlled seamlessly by the Case Opacity slider (registerShellGroup)
        // ---------------------------------------------------------------------
        const phoneChassisGroup = new THREE.Group();

        // Outer CNC Brushed Titanium Perimeter Rails (Width 2.76, Height 5.66, Depth 0.44)
        const railLeft = new THREE.Mesh(
          new THREE.BoxGeometry(0.11, 5.56, 0.44),
          brushedAluMat
        );
        railLeft.position.set(-1.325, 0, 0);
        const railRight = new THREE.Mesh(
          new THREE.BoxGeometry(0.11, 5.56, 0.44),
          brushedAluMat
        );
        railRight.position.set(1.325, 0, 0);
        const railTop = new THREE.Mesh(
          new THREE.BoxGeometry(2.76, 0.11, 0.44),
          brushedAluMat
        );
        railTop.position.set(0, 2.775, 0);
        // Bottom rail split around USB-C port opening & speaker grilles
        const railBotL = new THREE.Mesh(
          new THREE.BoxGeometry(1.06, 0.11, 0.44),
          brushedAluMat
        );
        railBotL.position.set(-0.85, -2.775, 0);
        const railBotR = new THREE.Mesh(
          new THREE.BoxGeometry(1.06, 0.11, 0.44),
          brushedAluMat
        );
        railBotR.position.set(0.85, -2.775, 0);

        // Tactile CNC Power Button & Volume Rocker on Right Titanium Rail + Laser Antenna Bands
        const pwrSideBtn = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 0.48, 0.14),
          copperMat
        );
        pwrSideBtn.position.set(1.39, 0.55, 0);
        const volUpBtn = new THREE.Mesh(
          new THREE.BoxGeometry(0.045, 0.42, 0.14),
          nickelMat
        );
        volUpBtn.position.set(1.39, 1.25, 0);
        const volDnBtn = volUpBtn.clone();
        volDnBtn.position.set(1.39, 0.72, 0);

        // Internal Structural Midplate Webbing (Separates Battery bay & L-Board bay)
        const midStrutHoriz = new THREE.Mesh(
          new THREE.BoxGeometry(2.54, 0.07, 0.05),
          chassisDarkMat
        );
        midStrutHoriz.position.set(0, -1.78, -0.06);
        const midStrutVert = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 2.95, 0.05),
          chassisDarkMat
        );
        midStrutVert.position.set(0.18, -0.25, -0.06);

        // Stealth Frosted Gorilla Glass Rear Cover (with Camera Island bezel at top-left)
        const rearGlassMat = new THREE.MeshPhysicalMaterial({
          map: atlas.carbonFiberWeave,
          color: 0x1e293b,
          metalness: 0.35,
          roughness: 0.22,
          clearcoat: 0.9,
          clearcoatRoughness: 0.12,
        });
        const rearGlassPlate = new THREE.Mesh(
          new THREE.BoxGeometry(2.64, 5.52, 0.035),
          rearGlassMat
        );
        rearGlassPlate.position.set(0, 0, -0.23);

        // Sculpted CNC Camera Deco Plateau Ring on Rear Glass (Top-Left in Rear View / x < 0, y > 0)
        const camDecoFrame = new THREE.Mesh(
          new THREE.BoxGeometry(1.36, 1.72, 0.06),
          darkAnodizedAluMat
        );
        camDecoFrame.position.set(-0.56, 1.66, -0.26);

        phoneChassisGroup.add(
          railLeft,
          railRight,
          railTop,
          railBotL,
          railBotR,
          pwrSideBtn,
          volUpBtn,
          volDnBtn,
          midStrutHoriz,
          midStrutVert,
          rearGlassPlate,
          camDecoFrame
        );
        registerShellGroup(phoneChassisGroup);
        platformRootGroup.add(phoneChassisGroup);

        // ---------------------------------------------------------------------
        // 1. L-Shaped HDI Multi-Layer Logic Board (phone_board)
        // Spans right side (x = 0.24..1.18, y = -1.62..2.45) + top bridge (x = -0.35..1.18, y = 1.15..2.45)
        // ---------------------------------------------------------------------
        const pBoardG = new THREE.Group();
        pBoardG.position.set(0.58, 0.45, -0.04);

        const phonePcbMat = new THREE.MeshStandardMaterial({
          map: atlas.phoneBoardAlbedo,
          bumpMap: atlas.mainboardBump,
          bumpScale: 0.015,
          roughness: 0.34,
          metalness: 0.28,
        });

        // Sub-layer 1: L-shaped 12-Layer SLP/HDI Substrate
        const hdiSubstrateG = new THREE.Group();
        const verticalLegPcb = new THREE.Mesh(
          new THREE.BoxGeometry(0.92, 3.85, 0.055),
          [pcbEdgeMat, pcbEdgeMat, pcbEdgeMat, pcbEdgeMat, phonePcbMat, phonePcbMat]
        );
        verticalLegPcb.position.set(0.12, -0.12, 0);
        const topArmPcb = new THREE.Mesh(
          new THREE.BoxGeometry(0.75, 1.32, 0.055),
          [pcbEdgeMat, pcbEdgeMat, pcbEdgeMat, pcbEdgeMat, phonePcbMat, phonePcbMat]
        );
        topArmPcb.position.set(-0.48, 1.14, 0);
        // Stacked double-layer interposer rim around SoC area
        const interposerRim = new THREE.Mesh(
          new THREE.BoxGeometry(0.84, 1.45, 0.035),
          greenSubstrateMat
        );
        interposerRim.position.set(0.12, 0.45, 0.035);
        hdiSubstrateG.add(verticalLegPcb, topArmPcb, interposerRim);
        tagSubLayer(hdiSubstrateG, [0, 0, -0.45], 'hdi_substrate');

        // Sub-layer 2: Stainless-Steel EMI/RFI Shield Cans with laser markings
        const emiShieldsG = new THREE.Group();
        const shieldTop = new THREE.Mesh(
          new THREE.BoxGeometry(0.62, 0.85, 0.045),
          nickelMat
        );
        shieldTop.position.set(-0.46, 1.16, 0.042);
        const shieldMid = new THREE.Mesh(
          new THREE.BoxGeometry(0.74, 0.65, 0.045),
          nickelMat
        );
        shieldMid.position.set(0.12, -0.92, 0.042);
        const shieldRear = new THREE.Mesh(
          new THREE.BoxGeometry(0.76, 2.25, 0.038),
          brushedAluMat
        );
        shieldRear.position.set(0.12, 0.15, -0.042);
        emiShieldsG.add(shieldTop, shieldMid, shieldRear);
        tagSubLayer(emiShieldsG, [0, 0.12, 0.45], 'emi_shield_cans');

        // Sub-layer 3: 14× Gold-Plated Board-to-Board (B2B) Micro-Headers & PMIC Power Inductors
        const b2bHeadersG = new THREE.Group();
        [
          [-0.52, 0.62],
          [-0.22, 0.62],
          [-0.18, 0.18],
          [-0.18, -0.28],
          [-0.18, -0.78],
          [0.05, -1.68],
          [0.32, -1.68],
        ].forEach(([hx, hy]) => {
          const b2bSocket = new THREE.Mesh(
            new THREE.BoxGeometry(0.22, 0.09, 0.045),
            mattePlasticMat
          );
          b2bSocket.position.set(hx, hy, 0.04);
          const b2bGold = new THREE.Mesh(
            new THREE.BoxGeometry(0.18, 0.06, 0.052),
            goldMat
          );
          b2bGold.position.set(hx, hy, 0.044);
          b2bHeadersG.add(b2bSocket, b2bGold);
        });
        // Multi-phase PMIC buck inductors
        for (let p = 0; p < 6; p++) {
          const pmicChoke = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.12, 0.05),
            chassisSteelMat
          );
          pmicChoke.position.set(0.38, 1.15 - p * 0.18, 0.045);
          b2bHeadersG.add(pmicChoke);
        }
        tagSubLayer(b2bHeadersG, [-0.25, -0.15, 0.82], 'gold_contacts');

        pBoardG.add(hdiSubstrateG, emiShieldsG, b2bHeadersG);
        registerComponent(
          'phone_board',
          pBoardG,
          SMARTPHONE_HARDWARE_DB.phone_board.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // ---------------------------------------------------------------------
        // 2. Mobile Flagship 3nm SoC (CPU / GPU / NPU / ISP) (phone_soc)
        // Sits at [0.66, 0.95, 0.03] directly on the L-Logic Board
        // ---------------------------------------------------------------------
        const pSocG = new THREE.Group();
        pSocG.position.set(0.66, 0.95, 0.03);

        // Sub-layer 1: Fine-pitch Micro-BGA Solder Ball Array & Organic Interposer
        const socBgaG = new THREE.Group();
        const socInterposer = new THREE.Mesh(
          new THREE.BoxGeometry(0.64, 0.72, 0.024),
          [greenSubstrateMat, greenSubstrateMat, greenSubstrateMat, greenSubstrateMat, goldMat, goldMat]
        );
        socInterposer.position.z = -0.022;
        socBgaG.add(socInterposer);
        for (let bx = -0.24; bx <= 0.24; bx += 0.12) {
          for (let by = -0.28; by <= 0.28; by += 0.14) {
            const ball = new THREE.Mesh(
              new THREE.SphereGeometry(0.022, 8, 8),
              goldMat
            );
            ball.position.set(bx, by, -0.04);
            socBgaG.add(ball);
          }
        }
        tagSubLayer(socBgaG, [0, 0, -0.45], 'bga_solder_balls');

        // Sub-layer 2: 3nm EUV Monolithic Silicon Die (CPU + Raytracing GPU + 80 TOPS NPU)
        const socDieMat = new THREE.MeshStandardMaterial({
          map: atlas.phoneSocTop,
          roughness: 0.18,
          metalness: 0.75,
        });
        const socDieG = new THREE.Group();
        const socSilicon = new THREE.Mesh(
          new THREE.BoxGeometry(0.56, 0.64, 0.042),
          [mirrorSiliconMat, mirrorSiliconMat, mirrorSiliconMat, mirrorSiliconMat, socDieMat, mirrorSiliconMat]
        );
        // SMD decoupling MLCC capacitors around SoC perimeter
        for (let c = -0.22; c <= 0.22; c += 0.11) {
          const smd = new THREE.Mesh(
            new THREE.BoxGeometry(0.045, 0.025, 0.025),
            goldMat
          );
          smd.position.set(c, 0.34, 0.01);
          socDieG.add(smd);
        }
        socDieG.add(socSilicon);
        tagSubLayer(socDieG, [0, 0, 0.08], 'soc_npu_die');

        // Sub-layer 3: Phase-Change Thermal Interface Layer (TIM)
        const socTimLayer = new THREE.Mesh(
          new THREE.BoxGeometry(0.52, 0.58, 0.015),
          timPasteMat
        );
        socTimLayer.position.z = 0.032;
        tagSubLayer(socTimLayer, [0, 0.15, 0.55], 'tim_paste');

        pSocG.add(socBgaG, socDieG, socTimLayer);
        registerComponent(
          'phone_soc',
          pSocG,
          SMARTPHONE_HARDWARE_DB.phone_soc.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // ---------------------------------------------------------------------
        // 3. LPDDR5X Package-on-Package (PoP) Unified DRAM (phone_ram)
        // Stacked directly on top of phone_soc at [0.66, 0.95, 0.095]
        // ---------------------------------------------------------------------
        const pRamG = new THREE.Group();
        pRamG.position.set(0.66, 0.95, 0.095);

        // Sub-layer 1: 496-Ball PoP Perimeter Solder Ball Array + Substrate
        const popBallsG = new THREE.Group();
        const popSub = new THREE.Mesh(
          new THREE.BoxGeometry(0.62, 0.7, 0.018),
          greenSubstrateMat
        );
        popSub.position.z = -0.02;
        popBallsG.add(popSub);
        for (let px = -0.26; px <= 0.26; px += 0.13) {
          [-0.3, 0.3].forEach((py) => {
            const b = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), goldMat);
            b.position.set(px, py, -0.032);
            popBallsG.add(b);
          });
        }
        tagSubLayer(popBallsG, [0, 0, -0.45], 'bga_solder_balls');

        // Sub-layer 2: Quad-Channel 16GB LPDDR5X Stacked Silicon Dies
        const popDiesG = new THREE.Group();
        const dramDie1 = new THREE.Mesh(
          new THREE.BoxGeometry(0.52, 0.28, 0.025),
          mirrorSiliconMat
        );
        dramDie1.position.set(0, 0.15, 0);
        const dramDie2 = dramDie1.clone();
        dramDie2.position.set(0, -0.15, 0);
        popDiesG.add(dramDie1, dramDie2);
        tagSubLayer(popDiesG, [0, 0, 0.08], 'pop_dram_die');

        // Sub-layer 3: Laser-Marked PoP Epoxy Top Package + Copper Shroud
        const popTopCap = new THREE.Mesh(
          new THREE.BoxGeometry(0.62, 0.7, 0.032),
          [mattePlasticMat, mattePlasticMat, mattePlasticMat, mattePlasticMat, socDieMat, mattePlasticMat]
        );
        popTopCap.position.z = 0.025;
        tagSubLayer(popTopCap, [0, 0.12, 0.55], 'ihs');

        pRamG.add(popBallsG, popDiesG, popTopCap);
        registerComponent(
          'phone_ram',
          pRamG,
          SMARTPHONE_HARDWARE_DB.phone_ram.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // ---------------------------------------------------------------------
        // 4. UFS 4.0 Flash Storage (232-Layer 3D NAND + Controller) (phone_storage)
        // Sits on L-Logic Board below SoC at [0.66, -0.08, 0.035]
        // ---------------------------------------------------------------------
        const pUfsG = new THREE.Group();
        pUfsG.position.set(0.66, -0.08, 0.035);

        // Sub-layer 1: BGA-153 Solder Ball Grid & Interposer
        const ufsBgaG = new THREE.Group();
        const ufsSub = new THREE.Mesh(
          new THREE.BoxGeometry(0.58, 0.68, 0.02),
          [greenSubstrateMat, greenSubstrateMat, greenSubstrateMat, greenSubstrateMat, goldMat, goldMat]
        );
        ufsSub.position.z = -0.022;
        ufsBgaG.add(ufsSub);
        for (let ux = -0.2; ux <= 0.2; ux += 0.1) {
          for (let uy = -0.24; uy <= 0.24; uy += 0.12) {
            const sb = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), goldMat);
            sb.position.set(ux, uy, -0.036);
            ufsBgaG.add(sb);
          }
        }
        tagSubLayer(ufsBgaG, [0, 0, -0.45], 'bga_solder_balls');

        // Sub-layer 2: 232-Layer 3D TLC NAND Silicon Stack + MIPI M-PHY 5.0 Controller Die
        const ufsInternalG = new THREE.Group();
        const nandStack = new THREE.Mesh(
          new THREE.BoxGeometry(0.48, 0.42, 0.032),
          mirrorSiliconMat
        );
        nandStack.position.set(0, 0.08, 0);
        const ufsCtrlDie = new THREE.Mesh(
          new THREE.BoxGeometry(0.32, 0.16, 0.032),
          copperMat
        );
        ufsCtrlDie.position.set(0, -0.2, 0);
        ufsInternalG.add(nandStack, ufsCtrlDie);
        tagSubLayer(ufsInternalG, [0, 0, 0.08], 'ufs_controller_nand');

        // Sub-layer 3: Laser-Etched BGA-153 UFS 4.0 Package Cap
        const ufsCapMat = new THREE.MeshStandardMaterial({
          map: atlas.biosChipTop,
          roughness: 0.28,
          metalness: 0.45,
        });
        const ufsCap = new THREE.Mesh(
          new THREE.BoxGeometry(0.58, 0.68, 0.034),
          [mattePlasticMat, mattePlasticMat, mattePlasticMat, mattePlasticMat, ufsCapMat, mattePlasticMat]
        );
        ufsCap.position.z = 0.028;
        tagSubLayer(ufsCap, [0, -0.1, 0.55], 'ihs');

        pUfsG.add(ufsBgaG, ufsInternalG, ufsCap);
        registerComponent(
          'phone_storage',
          pUfsG,
          SMARTPHONE_HARDWARE_DB.phone_storage.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // ---------------------------------------------------------------------
        // 5. Triple Camera Array with 5× Periscope Telephoto (phone_cameras)
        // Located at top-left plateau [-0.56, 1.66, -0.11], protruding through rear cover (-Z)
        // ---------------------------------------------------------------------
        const pCamG = new THREE.Group();
        pCamG.position.set(-0.56, 1.66, -0.11);

        // Sub-layer 1: Stacked CMOS Image Sensors (200MP Main + 50MP UW + 50MP Periscope) & MIPI CSI Flex
        const cmosSensorsG = new THREE.Group();
        const camFlexBacking = new THREE.Mesh(
          new THREE.BoxGeometry(1.24, 1.58, 0.03),
          copperMat
        );
        camFlexBacking.position.z = 0.11;
        const mainCmos = new THREE.Mesh(
          new THREE.BoxGeometry(0.46, 0.46, 0.035),
          mirrorSiliconMat
        );
        mainCmos.position.set(-0.26, 0.02, 0.08);
        const uwCmos = new THREE.Mesh(
          new THREE.BoxGeometry(0.36, 0.36, 0.035),
          mirrorSiliconMat
        );
        uwCmos.position.set(-0.26, 0.52, 0.08);
        // Side-mounted Periscope CMOS sensor (vertical orientation receiving 90°-folded light!)
        const periCmos = new THREE.Mesh(
          new THREE.BoxGeometry(0.04, 0.34, 0.34),
          mirrorSiliconMat
        );
        periCmos.position.set(0.42, -0.48, 0.0);
        cmosSensorsG.add(camFlexBacking, mainCmos, uwCmos, periCmos);
        tagSubLayer(cmosSensorsG, [0, 0, 0.52], 'cmos_image_sensor');

        // Sub-layer 2: Electromagnetic OIS Voice-Coil Actuator Cages & Copper Coils
        const oisCagesG = new THREE.Group();
        const oisBlock = new THREE.Mesh(
          new THREE.BoxGeometry(1.26, 1.62, 0.14),
          nickelMat
        );
        oisBlock.position.z = 0.01;
        const coilMain = new THREE.Mesh(
          new THREE.TorusGeometry(0.22, 0.03, 10, 24),
          copperMat
        );
        coilMain.position.set(-0.26, 0.02, -0.05);
        const coilUw = new THREE.Mesh(
          new THREE.TorusGeometry(0.17, 0.025, 10, 24),
          copperMat
        );
        coilUw.position.set(-0.26, 0.52, -0.05);
        oisCagesG.add(oisBlock, coilMain, coilUw);
        tagSubLayer(oisCagesG, [0, 0, 0.08], 'ois_voice_coil');

        // Sub-layer 3: 5× Periscope 90° Folding Glass Prism & Horizontal Optical Elements
        const periscopeOpticsG = new THREE.Group();
        const prismGlass = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 0.28, 0.22),
          new THREE.MeshPhysicalMaterial({
            color: 0x38bdf8,
            metalness: 0.15,
            roughness: 0.05,
            transmission: 0.65,
            transparent: true,
            opacity: 0.88,
          })
        );
        prismGlass.rotation.y = Math.PI / 4;
        prismGlass.position.set(-0.24, -0.48, -0.06);
        // Internal lateral lens elements between prism and side CMOS
        for (let lx = -0.02; lx <= 0.28; lx += 0.14) {
          const pLens = new THREE.Mesh(
            new THREE.CylinderGeometry(0.13, 0.13, 0.04, 20),
            cyanLedMat
          );
          pLens.rotation.z = Math.PI / 2;
          pLens.position.set(lx, -0.48, -0.02);
          periscopeOpticsG.add(pLens);
        }
        periscopeOpticsG.add(prismGlass);
        tagSubLayer(periscopeOpticsG, [-0.15, -0.25, -0.35], 'periscope_prism');

        // Sub-layer 4: Exterior Anodized Lens Rings, Sapphire Crystal Covers, Laser AF & LED Flash
        const lensBarrelsG = new THREE.Group();
        const camIslandMat = new THREE.MeshStandardMaterial({
          map: atlas.phoneCameraIsland,
          roughness: 0.22,
          metalness: 0.8,
        });
        const islandPlate = new THREE.Mesh(
          new THREE.BoxGeometry(1.3, 1.66, 0.06),
          [darkAnodizedAluMat, darkAnodizedAluMat, darkAnodizedAluMat, darkAnodizedAluMat, darkAnodizedAluMat, camIslandMat]
        );
        islandPlate.position.z = -0.11;
        lensBarrelsG.add(islandPlate);

        // 3 Protruding Rear Camera Lens Rings (face -Z)
        [
          { y: 0.52, r: 0.22 }, // 50MP Ultrawide
          { y: 0.0, r: 0.25 }, // 200MP Main Wide
          { y: -0.52, r: 0.23 }, // 5x Periscope Telephoto
        ].forEach((lens) => {
          const ring = new THREE.Mesh(
            new THREE.CylinderGeometry(lens.r, lens.r, 0.11, 28),
            brushedAluMat
          );
          ring.rotation.x = Math.PI / 2;
          ring.position.set(-0.26, lens.y, -0.17);
          const sapphireGlass = new THREE.Mesh(
            new THREE.CylinderGeometry(lens.r * 0.78, lens.r * 0.78, 0.12, 24),
            mirrorSiliconMat
          );
          sapphireGlass.rotation.x = Math.PI / 2;
          sapphireGlass.position.set(-0.26, lens.y, -0.175);
          lensBarrelsG.add(ring, sapphireGlass);
        });
        // Laser AF module + Dual-Tone LED Flash on right column of camera island
        const laserAf = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.12, 0.09, 20),
          new THREE.MeshStandardMaterial({ color: 0x991b1b, metalness: 0.6, roughness: 0.2 })
        );
        laserAf.rotation.x = Math.PI / 2;
        laserAf.position.set(0.34, 0.36, -0.15);
        const ledFlash = new THREE.Mesh(
          new THREE.CylinderGeometry(0.11, 0.11, 0.09, 20),
          new THREE.MeshStandardMaterial({
            color: 0xfef08a,
            emissive: 0xfacc15,
            emissiveIntensity: 0.65,
            roughness: 0.2,
          })
        );
        ledFlash.rotation.x = Math.PI / 2;
        ledFlash.position.set(0.34, -0.02, -0.15);
        lensBarrelsG.add(laserAf, ledFlash);
        tagSubLayer(lensBarrelsG, [0, 0.1, -0.78], 'sapphire_lens_cover');

        pCamG.add(cmosSensorsG, oisCagesG, periscopeOpticsG, lensBarrelsG);
        registerComponent(
          'phone_cameras',
          pCamG,
          SMARTPHONE_HARDWARE_DB.phone_cameras.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // ---------------------------------------------------------------------
        // 6. Front Selfie Camera & 3D Biometric IR/ToF Sensor Array (phone_front_cam)
        // Located at top center [0, 2.38, 0.08], facing +Z through the display punch-hole
        // ---------------------------------------------------------------------
        const pFrontCamG = new THREE.Group();
        pFrontCamG.position.set(0, 2.38, 0.08);

        // Sub-layer 1: Dual-Pixel AF CMOS Sensor & Shielded Micro-FPC Flex
        const fCamSensorG = new THREE.Group();
        const fCamFlex = new THREE.Mesh(
          new THREE.BoxGeometry(0.92, 0.26, 0.025),
          copperMat
        );
        fCamFlex.position.z = -0.04;
        const fCamCmos = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.22, 0.03),
          mirrorSiliconMat
        );
        fCamCmos.position.set(-0.22, 0, -0.015);
        fCamSensorG.add(fCamFlex, fCamCmos);
        tagSubLayer(fCamSensorG, [0, 0, -0.45], 'cmos_image_sensor');

        // Sub-layer 2: 940nm IR Dot Projector, Flood Illuminator & ToF Proximity Module
        const irBioG = new THREE.Group();
        const irHousing = new THREE.Mesh(
          new THREE.BoxGeometry(0.52, 0.22, 0.08),
          nickelMat
        );
        irHousing.position.set(0.18, 0, 0.02);
        const irEmitter = new THREE.Mesh(
          new THREE.CylinderGeometry(0.075, 0.075, 0.09, 16),
          new THREE.MeshStandardMaterial({
            color: 0xf43f5e,
            emissive: 0xe11d48,
            emissiveIntensity: 0.75,
          })
        );
        irEmitter.rotation.x = Math.PI / 2;
        irEmitter.position.set(0.06, 0, 0.03);
        const tofLens = new THREE.Mesh(
          new THREE.CylinderGeometry(0.07, 0.07, 0.09, 16),
          cyanLedMat
        );
        tofLens.rotation.x = Math.PI / 2;
        tofLens.position.set(0.3, 0, 0.03);
        irBioG.add(irHousing, irEmitter, tofLens);
        tagSubLayer(irBioG, [0.15, 0, 0.08], 'ir_dot_projector');

        // Sub-layer 3: Front Autofocus Optical Lens Barrel & Top Earpiece Receiver Grille
        const fLensG = new THREE.Group();
        const selfieBarrel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.115, 0.125, 0.11, 20),
          darkAnodizedAluMat
        );
        selfieBarrel.rotation.x = Math.PI / 2;
        selfieBarrel.position.set(-0.22, 0, 0.05);
        const selfieGlass = new THREE.Mesh(
          new THREE.CylinderGeometry(0.085, 0.085, 0.12, 18),
          mirrorSiliconMat
        );
        selfieGlass.rotation.x = Math.PI / 2;
        selfieGlass.position.set(-0.22, 0, 0.055);
        const earpieceBar = new THREE.Mesh(
          new THREE.BoxGeometry(0.68, 0.06, 0.06),
          brushedAluMat
        );
        earpieceBar.position.set(0, 0.2, 0.05);
        fLensG.add(selfieBarrel, selfieGlass, earpieceBar);
        tagSubLayer(fLensG, [-0.1, 0.12, 0.55], 'sapphire_lens_cover');

        pFrontCamG.add(fCamSensorG, irBioG, fLensG);
        registerComponent(
          'phone_front_cam',
          pFrontCamG,
          SMARTPHONE_HARDWARE_DB.phone_front_cam.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // ---------------------------------------------------------------------
        // 7. High-Density 5500mAh Li-Ion Pouch Battery with BMS (phone_battery)
        // Occupies left cavity [-0.52, -0.36, -0.02] beside the L-shaped mainboard
        // ---------------------------------------------------------------------
        const pBattG = new THREE.Group();
        pBattG.position.set(-0.52, -0.36, -0.02);

        // Sub-layer 1: Internal Silicon-Carbon Wound Anode/Cathode Jelly-Roll Cell Core
        const cellCoreG = new THREE.Group();
        [-0.3, 0.3].forEach((cx) => {
          const roll = new THREE.Mesh(
            new THREE.BoxGeometry(0.56, 2.38, 0.16),
            copperMat
          );
          roll.position.set(cx, -0.06, -0.02);
          cellCoreG.add(roll);
        });
        tagSubLayer(cellCoreG, [0, 0, -0.45], 'pouch_anode_cathode');

        // Sub-layer 2: Aluminum-Laminate Pouch Enclosure with High-DPI Telemetry Graphics & Easy-Pull Tabs
        const battTopMat = new THREE.MeshStandardMaterial({
          map: atlas.phoneBatteryTop,
          roughness: 0.3,
          metalness: 0.48,
        });
        const pouchShellG = new THREE.Group();
        const pouchBody = new THREE.Mesh(
          new THREE.BoxGeometry(1.32, 2.58, 0.22),
          [
            darkAnodizedAluMat,
            darkAnodizedAluMat,
            darkAnodizedAluMat,
            darkAnodizedAluMat,
            battTopMat,
            battTopMat,
          ]
        );
        pouchBody.position.set(0, -0.06, 0);
        // Cyan Easy-Pull Adhesive Release Tabs on left edge
        [-0.65, 0.55].forEach((ty) => {
          const pullTab = new THREE.Mesh(
            new THREE.BoxGeometry(0.14, 0.36, 0.23),
            cyanLedMat
          );
          pullTab.position.set(-0.64, ty, 0);
          pouchShellG.add(pullTab);
        });
        pouchShellG.add(pouchBody);
        tagSubLayer(pouchShellG, [0, 0, 0.1], 'alu_pouch_foil');

        // Sub-layer 3: Top Battery Management System (BMS) Protection PCB & Dual-Cell Flex Ribbon
        const bmsG = new THREE.Group();
        const bmsPcb = new THREE.Mesh(
          new THREE.BoxGeometry(1.26, 0.22, 0.14),
          greenSubstrateMat
        );
        bmsPcb.position.set(0, 1.38, 0.02);
        const fuelGaugeIc = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 0.12, 0.16),
          mirrorSiliconMat
        );
        fuelGaugeIc.position.set(-0.22, 1.38, 0.02);
        const bmsFlexLead = new THREE.Mesh(
          new THREE.BoxGeometry(0.45, 0.18, 0.04),
          copperMat
        );
        bmsFlexLead.position.set(0.55, 1.38, 0.06);
        bmsG.add(bmsPcb, fuelGaugeIc, bmsFlexLead);
        tagSubLayer(bmsG, [0.15, 0.35, 0.55], 'bms_board');

        pBattG.add(cellCoreG, pouchShellG, bmsG);
        registerComponent(
          'phone_battery',
          pBattG,
          SMARTPHONE_HARDWARE_DB.phone_battery.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // ---------------------------------------------------------------------
        // 8. Qi2 / MagSafe Copper Induction Coil & NFC Antenna Loop (phone_qi_coil)
        // Mounted on rear side [-0.08, -0.18, -0.17] behind Battery & Mainboard
        // ---------------------------------------------------------------------
        const pQiG = new THREE.Group();
        pQiG.position.set(-0.08, -0.18, -0.17);

        // Sub-layer 1: Black Nanocrystalline Ferrite Electromagnetic Shielding Sheet
        const ferriteSheet = new THREE.Mesh(
          new THREE.CylinderGeometry(1.06, 1.06, 0.018, 36),
          mattePlasticMat
        );
        ferriteSheet.rotation.x = Math.PI / 2;
        ferriteSheet.position.z = 0.022;
        tagSubLayer(ferriteSheet, [0, 0, 0.45], 'ferrite_shield_sheet');

        // Sub-layer 2: Planar Multi-Strand Copper Litz Qi2 Windings & 13.56MHz NFC Perimeter Antenna
        const qiCoilMat = new THREE.MeshStandardMaterial({
          map: atlas.phoneQiCoilTop,
          roughness: 0.24,
          metalness: 0.78,
        });
        const qiWindingsG = new THREE.Group();
        const coilDisc = new THREE.Mesh(
          new THREE.CylinderGeometry(0.96, 0.96, 0.024, 36),
          [copperMat, qiCoilMat, qiCoilMat]
        );
        coilDisc.rotation.x = Math.PI / 2;
        // 3D sculpted concentric copper torus rings for physical depth
        [0.42, 0.58, 0.74].forEach((r) => {
          const torus = new THREE.Mesh(
            new THREE.TorusGeometry(r, 0.026, 10, 36),
            copperMat
          );
          torus.position.z = -0.012;
          qiWindingsG.add(torus);
        });
        // Gold NFC flex contact tail reaching right to L-Logic Board
        const nfcFlexTail = new THREE.Mesh(
          new THREE.BoxGeometry(0.62, 0.24, 0.02),
          goldMat
        );
        nfcFlexTail.position.set(0.68, 0.35, 0.01);
        qiWindingsG.add(coilDisc, nfcFlexTail);
        tagSubLayer(qiWindingsG, [0, 0, -0.05], 'qi_copper_windings');

        // Sub-layer 3: 18× N52 Neodymium MagSafe / Qi2 Magnet Ring + Lower Alignment Bar
        const magsafeRingG = new THREE.Group();
        for (let m = 0; m < 18; m++) {
          if (m === 13) continue; // Classic MagSafe bottom gap
          const ang = (m / 18) * Math.PI * 2;
          const magSeg = new THREE.Mesh(
            new THREE.BoxGeometry(0.11, 0.24, 0.03),
            nickelMat
          );
          magSeg.position.set(Math.cos(ang) * 0.92, Math.sin(ang) * 0.92, -0.022);
          magSeg.rotation.z = ang + Math.PI / 2;
          magsafeRingG.add(magSeg);
        }
        // Vertical orientation magnet bar below the ring
        const alignBar = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 0.48, 0.03),
          nickelMat
        );
        alignBar.position.set(0, -1.32, -0.022);
        magsafeRingG.add(alignBar);
        tagSubLayer(magsafeRingG, [0, -0.1, -0.55], 'magsafe_magnet_ring');

        pQiG.add(ferriteSheet, qiWindingsG, magsafeRingG);
        registerComponent(
          'phone_qi_coil',
          pQiG,
          SMARTPHONE_HARDWARE_DB.phone_qi_coil.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // ---------------------------------------------------------------------
        // 9. Ultra-Thin Copper Vapor Chamber & Pyrolytic Graphite Sheet (phone_vapor_chamber)
        // Bridges SoC/RAM and Battery on the front side [0.05, 0.15, 0.15] behind the OLED panel
        // ---------------------------------------------------------------------
        const pVcG = new THREE.Group();
        pVcG.position.set(0.05, 0.15, 0.15);

        // Sub-layer 1: Sintered Copper Capillary Wick Mesh & Micro-Evaporator Pillars
        const vcWickG = new THREE.Group();
        const wickPlate = new THREE.Mesh(
          new THREE.BoxGeometry(1.75, 3.15, 0.018),
          fdbCopperCoilMat
        );
        wickPlate.position.z = -0.022;
        vcWickG.add(wickPlate);
        for (let py = -1.2; py <= 1.2; py += 0.48) {
          const rib = new THREE.Mesh(
            new THREE.BoxGeometry(1.45, 0.08, 0.024),
            goldMat
          );
          rib.position.set(0, py, -0.024);
          vcWickG.add(rib);
        }
        tagSubLayer(vcWickG, [0, 0, -0.45], 'vc_capillary_wick');

        // Sub-layer 2: Vacuum-Sealed Copper Two-Phase Vapor Chamber Capsule
        const vcCopperG = new THREE.Group();
        const vcMainSheet = new THREE.Mesh(
          new THREE.BoxGeometry(1.92, 3.45, 0.028),
          copperMat
        );
        // Extended copper thermal bridge arm over the 3nm SoC
        const vcSocWing = new THREE.Mesh(
          new THREE.BoxGeometry(0.88, 1.35, 0.032),
          copperMat
        );
        vcSocWing.position.set(0.58, 0.78, 0.005);
        vcCopperG.add(vcMainSheet, vcSocWing);
        tagSubLayer(vcCopperG, [0, 0, 0.08], 'copper_heatpipes');

        // Sub-layer 3: Pyrolytic Graphite Thermal Spreader Pad
        const graphitePad = new THREE.Mesh(
          new THREE.BoxGeometry(1.82, 3.28, 0.018),
          darkAnodizedAluMat
        );
        graphitePad.position.z = 0.026;
        tagSubLayer(graphitePad, [0, 0.1, 0.55], 'pyrolytic_graphite');

        pVcG.add(vcWickG, vcCopperG, graphitePad);
        registerComponent(
          'phone_vapor_chamber',
          pVcG,
          SMARTPHONE_HARDWARE_DB.phone_vapor_chamber.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // ---------------------------------------------------------------------
        // 10. 6.8" 120Hz LTPO AMOLED Display & Ultrasonic Fingerprint Scanner (phone_display)
        // Front face at [0, 0, 0.23]. Also registered with registerShellGroup so caseOpacity makes
        // the screen translucent at 0% explosion to inspect internal components!
        // ---------------------------------------------------------------------
        const pDispG = new THREE.Group();
        pDispG.position.set(0, 0, 0.23);

        // Sub-layer 1: Under-Display 3D Ultrasonic Fingerprint Sensor & Chip-on-Plastic DDIC Flex
        const fpDdicG = new THREE.Group();
        const fpSensorPad = new THREE.Mesh(
          new THREE.BoxGeometry(0.68, 0.68, 0.022),
          goldMat
        );
        fpSensorPad.position.set(0, -1.45, -0.035);
        const ddicChip = new THREE.Mesh(
          new THREE.BoxGeometry(1.25, 0.18, 0.026),
          mirrorSiliconMat
        );
        ddicChip.position.set(0, -2.35, -0.035);
        const dsiFlexRibbon = new THREE.Mesh(
          new THREE.BoxGeometry(0.55, 0.85, 0.02),
          copperMat
        );
        dsiFlexRibbon.position.set(0.45, -1.85, -0.04);
        fpDdicG.add(fpSensorPad, ddicChip, dsiFlexRibbon);
        tagSubLayer(fpDdicG, [0, -0.15, -0.52], 'ultrasonic_fp_ddic');

        // Sub-layer 2: 120Hz LTPO AMOLED Emissive Pixel Matrix & Copper Backplane Foil
        const amoledScreenMat = new THREE.MeshStandardMaterial({
          map: atlas.phoneDisplayScreen,
          emissive: 0xffffff,
          emissiveMap: atlas.phoneDisplayScreen,
          emissiveIntensity: 0.38,
          roughness: 0.14,
          metalness: 0.15,
        });
        const amoledPanel = new THREE.Mesh(
          new THREE.BoxGeometry(2.54, 5.42, 0.028),
          [
            mattePlasticMat,
            mattePlasticMat,
            mattePlasticMat,
            mattePlasticMat,
            amoledScreenMat,
            copperMat,
          ]
        );
        tagSubLayer(amoledPanel, [0, 0, 0.05], 'ltpo_amoled_panel');

        // Sub-layer 3: Gorilla Glass Armor / Ceramic Shield Cover Glass with Ultra-Thin Bezel
        const ceramicGlassG = new THREE.Group();
        const coverGlass = new THREE.Mesh(
          new THREE.BoxGeometry(2.64, 5.54, 0.024),
          new THREE.MeshPhysicalMaterial({
            color: 0x0f172a,
            metalness: 0.15,
            roughness: 0.06,
            clearcoat: 1.0,
            clearcoatRoughness: 0.05,
            transparent: true,
            opacity: 0.32,
          })
        );
        coverGlass.position.z = 0.028;
        // Punch-hole camera ring accent at top center
        const punchHoleRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.11, 0.015, 10, 24),
          mattePlasticMat
        );
        punchHoleRing.position.set(0, 2.38, 0.042);
        ceramicGlassG.add(coverGlass, punchHoleRing);
        tagSubLayer(ceramicGlassG, [0, 0, 0.62], 'ceramic_shield_glass');

        pDispG.add(fpDdicG, amoledPanel, ceramicGlassG);
        registerComponent(
          'phone_display',
          pDispG,
          SMARTPHONE_HARDWARE_DB.phone_display.explodeOffset,
          componentGroups,
          interactiveMeshes
        );
        registerShellGroup(pDispG);

        // ---------------------------------------------------------------------
        // 11. 5G mmWave / Sub-6 Modem, RF Front-End & Wi-Fi 7 Module (phone_modem)
        // Sits on lower right L-Logic Board at [0.66, -1.02, 0.035]
        // ---------------------------------------------------------------------
        const pModemG = new THREE.Group();
        pModemG.position.set(0.66, -1.02, 0.035);

        // Sub-layer 1: RF BGA Substrate & Gold Coaxial Antenna Pads
        const modemSubG = new THREE.Group();
        const modemSub = new THREE.Mesh(
          new THREE.BoxGeometry(0.68, 0.92, 0.022),
          greenSubstrateMat
        );
        modemSub.position.z = -0.022;
        modemSubG.add(modemSub);
        [-0.32, 0, 0.32].forEach((ay) => {
          const uflPad = new THREE.Mesh(
            new THREE.CylinderGeometry(0.045, 0.045, 0.035, 14),
            goldMat
          );
          uflPad.rotation.x = Math.PI / 2;
          uflPad.position.set(0.26, ay, 0.01);
          modemSubG.add(uflPad);
        });
        tagSubLayer(modemSubG, [0, 0, -0.45], 'bga_solder_balls');

        // Sub-layer 2: 5G Baseband Transceiver Die & Wi-Fi 7 / Bluetooth 5.4 SoC
        const modemDiesG = new THREE.Group();
        const basebandDie = new THREE.Mesh(
          new THREE.BoxGeometry(0.42, 0.42, 0.034),
          mirrorSiliconMat
        );
        basebandDie.position.set(-0.05, 0.18, 0);
        const wifi7Die = new THREE.Mesh(
          new THREE.BoxGeometry(0.34, 0.28, 0.034),
          [
            mattePlasticMat,
            mattePlasticMat,
            mattePlasticMat,
            mattePlasticMat,
            new THREE.MeshStandardMaterial({ map: atlas.networkChipTop, roughness: 0.25 }),
            mattePlasticMat,
          ]
        );
        wifi7Die.position.set(-0.05, -0.22, 0);
        modemDiesG.add(basebandDie, wifi7Die);
        tagSubLayer(modemDiesG, [0, 0, 0.08], 'silicon_die');

        // Sub-layer 3: 5G RFFE BAW/SAW Filter Array, Power Amplifiers & eSIM Security Chip
        const rfFiltersG = new THREE.Group();
        for (let f = 0; f < 4; f++) {
          const filterIc = new THREE.Mesh(
            new THREE.BoxGeometry(0.18, 0.14, 0.038),
            nickelMat
          );
          filterIc.position.set(0.18, 0.32 - f * 0.21, 0.025);
          rfFiltersG.add(filterIc);
        }
        const esimChip = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, 0.22, 0.038),
          goldMat
        );
        esimChip.position.set(-0.16, -0.02, 0.025);
        rfFiltersG.add(esimChip);
        tagSubLayer(rfFiltersG, [0.12, -0.1, 0.55], 'rf_fem_filters');

        pModemG.add(modemSubG, modemDiesG, rfFiltersG);
        registerComponent(
          'phone_modem',
          pModemG,
          SMARTPHONE_HARDWARE_DB.phone_modem.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // ---------------------------------------------------------------------
        // 12. USB-C 3.2 Gen 2 Daughterboard & Power-Delivery Controller (phone_usbc)
        // Located at bottom center [0, -2.42, 0.0]
        // ---------------------------------------------------------------------
        const pUsbcG = new THREE.Group();
        pUsbcG.position.set(0, -2.42, 0.0);

        // Sub-layer 1: Lower Daughterboard HDI PCB
        const subBoardPcb = new THREE.Mesh(
          new THREE.BoxGeometry(2.36, 0.56, 0.048),
          [pcbEdgeMat, pcbEdgeMat, pcbEdgeMat, pcbEdgeMat, phonePcbMat, greenSubstrateMat]
        );
        subBoardPcb.position.z = -0.03;
        tagSubLayer(subBoardPcb, [0, 0, -0.45], 'hdi_substrate');

        // Sub-layer 2: USB-PD 3.1 PPS Controller IC, Gold MEMS Mic & Coax Connectors
        const pdMicG = new THREE.Group();
        const pdChip = new THREE.Mesh(
          new THREE.BoxGeometry(0.32, 0.26, 0.045),
          mirrorSiliconMat
        );
        pdChip.position.set(0.52, 0.06, 0.02);
        const memsMic = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, 0.16, 0.05),
          goldMat
        );
        memsMic.position.set(-0.48, -0.12, 0.025);
        const subB2bHeader = new THREE.Mesh(
          new THREE.BoxGeometry(0.36, 0.1, 0.05),
          goldMat
        );
        subB2bHeader.position.set(0.42, 0.22, 0.025);
        pdMicG.add(pdChip, memsMic, subB2bHeader);
        tagSubLayer(pdMicG, [0.15, 0.12, 0.12], 'pd_controller_coax');

        // Sub-layer 3: 24-Pin Stainless-Steel USB-C Receptacle with Red IP68 Silicone Gasket
        const usbcPortG = new THREE.Group();
        const portShell = new THREE.Mesh(
          new THREE.BoxGeometry(0.52, 0.42, 0.16),
          nickelMat
        );
        portShell.position.set(0, -0.16, 0.01);
        const ip68Gasket = new THREE.Mesh(
          new THREE.BoxGeometry(0.56, 0.06, 0.18),
          new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6 })
        );
        ip68Gasket.position.set(0, -0.32, 0.01);
        const tongue24Pin = new THREE.Mesh(
          new THREE.BoxGeometry(0.38, 0.36, 0.03),
          goldMat
        );
        tongue24Pin.position.set(0, -0.18, 0.01);
        usbcPortG.add(portShell, ip68Gasket, tongue24Pin);
        tagSubLayer(usbcPortG, [0, -0.35, 0.55], 'usbc_24pin_receptacle');

        pUsbcG.add(subBoardPcb, pdMicG, usbcPortG);
        registerComponent(
          'phone_usbc',
          pUsbcG,
          SMARTPHONE_HARDWARE_DB.phone_usbc.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // ---------------------------------------------------------------------
        // 13. X-Axis Linear Resonant Actuator (LRA Haptic Engine) & Stereo Speaker (phone_haptics_audio)
        // Located in bottom assembly [-0.45, -2.02, 0.04]
        // ---------------------------------------------------------------------
        const pHapG = new THREE.Group();
        pHapG.position.set(-0.45, -2.02, 0.04);

        // Sub-layer 1: Brushed Steel LRA Enclosure Base & Sealed Stereo Speaker Chamber
        const hapBaseG = new THREE.Group();
        const lraFrame = new THREE.Mesh(
          new THREE.BoxGeometry(0.96, 0.44, 0.14),
          brushedAluMat
        );
        lraFrame.position.set(-0.22, 0.06, -0.02);
        // Right-side acoustic speaker box (offset to bottom-right beside USB-C)
        const spkEnclosure = new THREE.Mesh(
          new THREE.BoxGeometry(0.84, 0.52, 0.16),
          mattePlasticMat
        );
        spkEnclosure.position.set(1.18, -0.12, -0.02);
        hapBaseG.add(lraFrame, spkEnclosure);
        tagSubLayer(hapBaseG, [0, 0, -0.45], 'gpu_backplate');

        // Sub-layer 2: Electromagnetic Copper Voice-Coil Windings & Acoustic Speaker Diaphragm
        const hapCoilsG = new THREE.Group();
        [-0.42, -0.02].forEach((cx) => {
          const lraCoil = new THREE.Mesh(
            new THREE.CylinderGeometry(0.14, 0.14, 0.12, 18),
            copperMat
          );
          lraCoil.rotation.x = Math.PI / 2;
          lraCoil.position.set(cx, 0.06, 0.02);
          hapCoilsG.add(lraCoil);
        });
        const spkCone = new THREE.Mesh(
          new THREE.CylinderGeometry(0.22, 0.18, 0.08, 22),
          goldMat
        );
        spkCone.rotation.x = Math.PI / 2;
        spkCone.position.set(1.18, -0.12, 0.05);
        hapCoilsG.add(spkCone);
        tagSubLayer(hapCoilsG, [0, 0, 0.1], 'lra_copper_voicecoil');

        // Sub-layer 3: Precision X-Axis Neodymium Magnetic Mover on Lateral Leaf Springs
        const lraMoverG = new THREE.Group();
        const moverBlock = new THREE.Mesh(
          new THREE.BoxGeometry(0.68, 0.28, 0.12),
          nickelMat
        );
        moverBlock.position.set(-0.22, 0.06, 0.05);
        const springL = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.36, 0.1),
          goldMat
        );
        springL.position.set(-0.62, 0.06, 0.05);
        const springR = springL.clone();
        springR.position.set(0.18, 0.06, 0.05);
        lraMoverG.add(moverBlock, springL, springR);
        tagSubLayer(lraMoverG, [-0.15, 0.1, 0.55], 'lra_neodymium_mover');

        pHapG.add(hapBaseG, hapCoilsG, lraMoverG);
        registerComponent(
          'phone_haptics_audio',
          pHapG,
          SMARTPHONE_HARDWARE_DB.phone_haptics_audio.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // ---------------------------------------------------------------------
        // SMARTPHONE FPC FLEX RIBBONS & RF MICRO-COAXIAL CABLES (cablesGroup)
        // ---------------------------------------------------------------------
        cablesGroup.add(
          // 1. Main High-Speed FPC Flex Ribbon (USB-C Subboard -> L-Logic Board)
          createCableWithPlugs(
            [
              [0.38, -2.22, 0.04],
              [0.42, -1.45, 0.08],
              [0.42, -0.45, 0.08],
              [0.42, 0.25, 0.04],
            ],
            0.032,
            sleeveAmberMat,
            goldMat,
            1
          ),
          // 2. Battery BMS Power Flex Ribbon (Battery BMS -> Logic Board PMIC)
          createCableWithPlugs(
            [
              [-0.05, 1.02, 0.05],
              [0.18, 1.05, 0.08],
              [0.38, 0.95, 0.05],
            ],
            0.03,
            sleeveDarkMat,
            goldMat
          ),
          // 3. Triple Camera MIPI CSI-2 Flex Bundles (Periscope Cameras -> L-Logic Board)
          createCableWithPlugs(
            [
              [-0.12, 1.66, -0.02],
              [0.18, 1.62, 0.04],
              [0.42, 1.35, 0.04],
            ],
            0.028,
            sleevePurpleMat,
            goldMat
          ),
          // 4. Dual 5G RF Antenna Micro-Coaxial Lines (Modem -> USB-C Subboard Antennas)
          createCableWithPlugs(
            [
              [0.92, -0.85, 0.02],
              [1.08, -1.65, 0.01],
              [0.75, -2.35, 0.01],
            ],
            0.018,
            sleeveCyanMat,
            goldMat
          ),
          createCableWithPlugs(
            [
              [0.92, -1.18, 0.02],
              [1.14, -1.78, -0.01],
              [0.88, -2.38, -0.01],
            ],
            0.018,
            sleeveDarkMat,
            goldMat
          )
        );
        platformRootGroup.add(cablesGroup);

      } else {
        // =====================================================================
        // PLATFORM 1: REFERENCE-MATCHED WHITE ARGB SHOWCASE DESKTOP PC
        // =====================================================================
        groundGrid.position.y = -5.55;
        shadowPlane.position.y = -5.53;

        // White Architectural Showcase ATX Chassis (Matches /assets/aistudio/image_002aa9db.png)
        // Enhanced with dual lower viewing windows (Left CX750 PSU window + Right HDD/SSD bay window)
        const caseFrame = new THREE.Group();

        // White recessed motherboard back tray
        const backTray = new THREE.Mesh(
          new THREE.BoxGeometry(9.6, 10.2, 0.22),
          showcaseWhiteMat
        );
        backTray.position.set(0, -0.1, -0.78);
        caseFrame.add(backTray);

        // Top & Bottom White Chassis Roof/Floor Plates
        const topPlate = new THREE.Mesh(
          new THREE.BoxGeometry(9.8, 0.3, 4.1),
          showcaseWhiteMat
        );
        topPlate.position.set(0, 5.05, 0.85);
        const bottomPlate = new THREE.Mesh(
          new THREE.BoxGeometry(9.8, 0.32, 4.1),
          showcaseWhiteMat
        );
        bottomPlate.position.set(0, -5.15, 0.85);
        caseFrame.add(topPlate, bottomPlate);

        // Rear Left White Chassis Wall & Front Right Slotted Intake Column
        const rearWall = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 10.2, 4.1),
          showcaseWhiteMat
        );
        rearWall.position.set(-4.78, -0.05, 0.85);
        caseFrame.add(rearWall);

        // Front Right White Bezel with Diagonal Intake Gill Slits (matching right side of reference photo)
        const frontPanelRight = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 10.2, 1.15),
          showcaseWhiteMat
        );
        frontPanelRight.position.set(4.76, -0.05, 2.32);
        caseFrame.add(frontPanelRight);

        // Diagonal dark ventilation gill slits along the front-right bezel
        for (let gy = -4.1; gy <= 4.3; gy += 0.26) {
          const gill = new THREE.Mesh(
            new THREE.BoxGeometry(0.32, 0.08, 0.55),
            mattePlasticMat
          );
          gill.rotation.x = 0.35;
          gill.position.set(4.78, gy, 2.35);
          caseFrame.add(gill);
        }

        // PSU & Drive Chamber Shroud with Dual Open Cutout Windows (Left: CORSAIR CX750 | Right: Open HDD & SSD Bay)
        const psuShroudTopLeft = new THREE.Mesh(
          new THREE.BoxGeometry(3.8, 0.14, 3.85),
          showcaseWhiteMat
        );
        psuShroudTopLeft.position.set(-2.85, -2.35, 0.82);

        // Clear Acrylic Top Inspection Window over HDD/SSD Bay so internal drives & cables are visible from above too
        const psuShroudTopGlass = new THREE.Mesh(
          new THREE.BoxGeometry(4.2, 0.08, 3.65),
          glassMat
        );
        psuShroudTopGlass.position.set(1.25, -2.35, 0.82);

        // Upper horizontal shroud rail above both lower windows
        const psuShroudUpperRail = new THREE.Mesh(
          new THREE.BoxGeometry(8.2, 0.34, 0.16),
          showcaseWhiteMat
        );
        psuShroudUpperRail.position.set(-0.65, -2.52, 2.66);

        // Center divider pillar between Left CX750 Window and Right HDD/SSD Window
        const psuShroudCenterPillar = new THREE.Mesh(
          new THREE.BoxGeometry(0.55, 2.15, 0.16),
          showcaseWhiteMat
        );
        psuShroudCenterPillar.position.set(-1.12, -3.68, 2.66);

        // Bottom lip under both PSU & Drive Bay cutout windows
        const psuShroudBottomLip = new THREE.Mesh(
          new THREE.BoxGeometry(9.6, 0.38, 0.18),
          showcaseWhiteMat
        );
        psuShroudBottomLip.position.set(0, -4.85, 2.68);
        caseFrame.add(
          psuShroudTopLeft,
          psuShroudTopGlass,
          psuShroudUpperRail,
          psuShroudCenterPillar,
          psuShroudBottomLip
        );

        // Black rubber chassis feet under bottom plate
        [
          [-3.8, -5.4, -0.6],
          [3.8, -5.4, -0.6],
          [-3.8, -5.4, 2.3],
          [3.8, -5.4, 2.3],
        ].forEach(([fx, fy, fz]) => {
          const foot = new THREE.Mesh(
            new THREE.BoxGeometry(1.35, 0.24, 1.1),
            mattePlasticMat
          );
          foot.position.set(fx, fy, fz);
          caseFrame.add(foot);
        });

        // Rectangular vertical cable routing cutouts in white motherboard tray (matching reference photo)
        [2.1, 0.25, -1.35].forEach((gy) => {
          const grommet = new THREE.Mesh(
            new THREE.BoxGeometry(0.55, 1.15, 0.26),
            mattePlasticMat
          );
          grommet.position.set(2.35, gy, -0.76);
          caseFrame.add(grommet);
        });

        // Tempered glass front/side panel
        const glassSide = new THREE.Mesh(
          new THREE.PlaneGeometry(9.4, 9.8),
          glassMat
        );
        glassSide.position.set(0, -0.05, 2.82);
        caseFrame.add(glassSide);

        registerShellGroup(caseFrame);
        platformRootGroup.add(caseFrame);

        // Soft interior ARGB ambient accent point lights (casting rainbow reflections onto white case interior)
        const aioGlowLight = new THREE.PointLight(0x22d3ee, 1.35, 6.5);
        aioGlowLight.position.set(-0.3, 2.3, 1.2);
        const frontFansGlowLight = new THREE.PointLight(0xd946ef, 1.25, 7.5);
        frontFansGlowLight.position.set(3.2, 0.5, 1.4);
        platformRootGroup.add(aioGlowLight, frontFansGlowLight);

        // 1. ATX Mainboard (mainboard)
        const mbG = new THREE.Group();
        mbG.position.set(-1.15, 0.75, -0.35);
        const mbFaceMat = new THREE.MeshStandardMaterial({
          map: atlas.mainboardAlbedo,
          bumpMap: atlas.mainboardBump,
          bumpScale: 0.028,
          roughness: 0.38,
          metalness: 0.25,
        });
        const mbPcb = new THREE.Mesh(
          new THREE.BoxGeometry(5.1, 6.2, 0.16),
          [pcbEdgeMat, pcbEdgeMat, pcbEdgeMat, pcbEdgeMat, mbFaceMat, pcbEdgeMat]
        );
        tagSubLayer(mbPcb, [0, 0, -0.35], 'pcb_traces');
        mbG.add(mbPcb);

        // 8 ATX Brass Standoffs & Phillips Mounting Screws around Mainboard perimeter
        [
          [-2.35, 2.85],
          [0, 2.85],
          [2.35, 2.85],
          [-2.35, 0],
          [2.35, 0],
          [-2.35, -2.85],
          [0, -2.85],
          [2.35, -2.85],
        ].forEach(([sx, sy]) => {
          const screw = createScrewHead(0.08, nickelMat, goldMat);
          screw.rotation.x = Math.PI / 2;
          screw.position.set(sx, sy, 0.1);
          mbG.add(screw);
        });

        // Heavy Aluminum VRM Heatsinks with diagonal fins + blue thermal pads underneath
        const vrmAssembly = new THREE.Group();
        const vrmLeft = new THREE.Mesh(
          new THREE.BoxGeometry(0.75, 2.25, 0.54),
          heatsinkFinsMat
        );
        vrmLeft.position.set(-1.68, 1.55, 0.28);
        const vrmPadL = new THREE.Mesh(
          new THREE.BoxGeometry(0.68, 2.15, 0.05),
          blueThermalPadMat
        );
        vrmPadL.position.set(-1.68, 1.55, 0.06);

        const vrmTop = new THREE.Mesh(
          new THREE.BoxGeometry(2.05, 0.62, 0.5),
          heatsinkFinsMat
        );
        vrmTop.position.set(-0.25, 2.62, 0.26);
        const vrmPadT = new THREE.Mesh(
          new THREE.BoxGeometry(1.95, 0.54, 0.05),
          blueThermalPadMat
        );
        vrmPadT.position.set(-0.25, 2.62, 0.06);
        vrmAssembly.add(vrmLeft, vrmPadL, vrmTop, vrmPadT);
        tagSubLayer(vrmAssembly, [0, 0.35, 0.85], 'vrm_heatsinks');
        mbG.add(vrmAssembly);

        // 12 Ferrite VRM Chokes & Solid Capacitors around CPU Socket
        for (let i = 0; i < 7; i++) {
          const chokeV = new THREE.Mesh(
            new THREE.BoxGeometry(0.18, 0.18, 0.18),
            chassisSteelMat
          );
          chokeV.position.set(-1.18, 0.85 + i * 0.24, 0.15);
          const capV = new THREE.Mesh(
            new THREE.CylinderGeometry(0.065, 0.065, 0.18, 14),
            nickelMat
          );
          capV.rotation.x = Math.PI / 2;
          capV.position.set(-0.98, 0.85 + i * 0.24, 0.15);
          mbG.add(chokeV, capV);
        }

        // Rear I/O Shield Armor & Port Stack (USB, LAN, Audio Jacks)
        const ioArmorGroup = new THREE.Group();
        const ioArmor = new THREE.Mesh(
          new THREE.BoxGeometry(0.75, 3.2, 0.65),
          darkAnodizedAluMat
        );
        ioArmor.position.set(-2.15, 1.25, 0.35);
        const ioSilverAccent = new THREE.Mesh(
          new THREE.BoxGeometry(0.32, 1.35, 0.68),
          nickelMat
        );
        ioSilverAccent.position.set(-2.05, 1.55, 0.35);
        ioArmorGroup.add(ioArmor, ioSilverAccent);
        tagSubLayer(ioArmorGroup, [-0.55, 0, 0.55]);
        mbG.add(ioArmorGroup);

        // PCH Chipset Heatsink Block (Bottom Right of Mainboard) + Front-Panel F_PANEL Gold Pin Header
        const pchBlock = new THREE.Mesh(
          new THREE.BoxGeometry(1.35, 1.15, 0.28),
          darkAnodizedAluMat
        );
        pchBlock.position.set(1.15, -1.35, 0.18);
        tagSubLayer(pchBlock, [0.3, -0.2, 0.65]);
        mbG.add(pchBlock);

        // Front-Panel Pin Header (PWR_SW, RESET_SW, HDD_LED, USB 3.2, JRAINBOW 5V ARGB Pins)
        const fPanelHeader = new THREE.Group();
        fPanelHeader.position.set(1.55, -2.78, 0.14);
        const headerBase = new THREE.Mesh(
          new THREE.BoxGeometry(1.35, 0.22, 0.1),
          mattePlasticMat
        );
        fPanelHeader.add(headerBase);
        for (let p = 0; p < 9; p++) {
          const pin = new THREE.Mesh(
            new THREE.CylinderGeometry(0.016, 0.016, 0.18, 8),
            goldMat
          );
          pin.rotation.x = Math.PI / 2;
          pin.position.set((p - 4) * 0.13, 0.04, 0.08);
          fPanelHeader.add(pin);
        }
        tagSubLayer(fPanelHeader, [0, -0.35, 0.45], 'gold_contacts');
        mbG.add(fPanelHeader);

        // CPU Socket Retention Frame (ILM) with Gold LGA Pin Array
        const sockPlate = new THREE.Mesh(
          new THREE.BoxGeometry(1.38, 1.38, 0.08),
          [nickelMat, nickelMat, nickelMat, nickelMat, goldMat, nickelMat]
        );
        sockPlate.position.set(-0.3, 1.4, 0.1);
        tagSubLayer(sockPlate, [0, 0, 0.35], 'substrate_pins');
        mbG.add(sockPlate);

        registerComponent(
          'mainboard',
          mbG,
          HARDWARE_DB.mainboard.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 2. CPU (cpu) — Positioned at [-1.45, 2.15, -0.18]
        // 4-Layer Exploded Anatomy: LGA Gold Substrate -> Mirror Silicon Die + Chiplets -> Nickel IHS -> Thermal Paste (TIM)
        const cpuG = new THREE.Group();
        cpuG.position.set(-1.45, 2.15, -0.18);
        const cpuSubMesh = new THREE.Mesh(
          new THREE.BoxGeometry(1.12, 1.12, 0.06),
          [
            greenSubstrateMat,
            greenSubstrateMat,
            greenSubstrateMat,
            greenSubstrateMat,
            new THREE.MeshStandardMaterial({ map: atlas.cpuSubstrate, roughness: 0.38 }),
            goldMat,
          ]
        );
        tagSubLayer(cpuSubMesh, [0, 0, -0.65], 'substrate_pins');

        // Internal Monolithic / Chiplet Mirror Silicon Die + Golden SMD Capacitors under the IHS!
        const cpuDieAssembly = new THREE.Group();
        cpuDieAssembly.position.z = 0.045;
        const mainSiliconDie = new THREE.Mesh(
          new THREE.BoxGeometry(0.46, 0.62, 0.04),
          mirrorSiliconMat
        );
        cpuDieAssembly.add(mainSiliconDie);
        [-0.34, 0.34].forEach((dx) => {
          [-0.25, 0, 0.25].forEach((dy) => {
            const smd = new THREE.Mesh(
              new THREE.BoxGeometry(0.06, 0.09, 0.03),
              goldMat
            );
            smd.position.set(dx, dy, 0);
            cpuDieAssembly.add(smd);
          });
        });
        tagSubLayer(cpuDieAssembly, [0, 0, 0], 'silicon_die');

        const cpuIhsMat = new THREE.MeshStandardMaterial({
          map: atlas.cpuIhs,
          metalness: 0.88,
          roughness: 0.18,
        });
        const cpuIhsMesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.88, 0.88, 0.09),
          [nickelMat, nickelMat, nickelMat, nickelMat, cpuIhsMat, nickelMat]
        );
        cpuIhsMesh.position.z = 0.08;
        tagSubLayer(cpuIhsMesh, [0, 0, 0.65], 'ihs');

        // Realistic Silver-Grey Thermal Paste Layer (Wärmeleitpaste / TIM) on top of IHS
        const cpuTimLayer = new THREE.Mesh(
          new THREE.BoxGeometry(0.68, 0.68, 0.018),
          timPasteMat
        );
        cpuTimLayer.position.z = 0.135;
        tagSubLayer(cpuTimLayer, [0, 0, 1.25], 'tim');

        cpuG.add(cpuSubMesh, cpuDieAssembly, cpuIhsMesh, cpuTimLayer);
        registerComponent(
          'cpu',
          cpuG,
          HARDWARE_DB.cpu.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 3. CPU Cooler (Circular ARGB Infinity Mirror AIO Pump Block) (cpu_cooler)
        // Explodes into: Thermal Paste TIM -> Micro-Skived Copper Coldplate + Screws -> Pump Motor Chamber -> Infinity Mirror Cap
        const pumpG = new THREE.Group();
        pumpG.position.set(-1.45, 2.15, 0.26);

        const coolerTimLayer = new THREE.Mesh(
          new THREE.CylinderGeometry(0.36, 0.36, 0.016, 28),
          timPasteMat
        );
        coolerTimLayer.rotation.x = Math.PI / 2;
        coolerTimLayer.position.z = -0.23;
        tagSubLayer(coolerTimLayer, [0, 0, -1.05], 'tim');

        const coldPlateGroup = new THREE.Group();
        coldPlateGroup.position.z = -0.18;
        const coldPlate = new THREE.Mesh(
          new THREE.BoxGeometry(1.02, 1.02, 0.08),
          copperMat
        );
        coldPlateGroup.add(coldPlate);
        [
          [-0.44, -0.44],
          [0.44, -0.44],
          [-0.44, 0.44],
          [0.44, 0.44],
        ].forEach(([sx, sy]) => {
          const thumbScrew = createScrewHead(0.065, nickelMat, mattePlasticMat);
          thumbScrew.rotation.x = Math.PI / 2;
          thumbScrew.position.set(sx, sy, 0.05);
          coldPlateGroup.add(thumbScrew);
        });
        tagSubLayer(coldPlateGroup, [0, 0, -0.58], 'aio_coldplate');

        const pumpHousing = new THREE.Mesh(
          new THREE.CylinderGeometry(0.76, 0.78, 0.52, 36),
          mattePlasticMat
        );
        pumpHousing.rotation.x = Math.PI / 2;

        // Internal Copper Impeller & Stator inside Pump Housing (revealed when exploded!)
        const pumpImpeller = new THREE.Mesh(
          new THREE.CylinderGeometry(0.46, 0.46, 0.16, 20),
          copperMat
        );
        pumpImpeller.rotation.x = Math.PI / 2;
        tagSubLayer(pumpImpeller, [0, 0, -0.18], 'fdb_bearing');

        // Glowing Rainbow ARGB Infinity Mirror Ring & Face (matching reference photo!)
        const pumpCapGroup = new THREE.Group();
        const pumpRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.73, 0.045, 16, 40),
          argbFanDiscMat
        );
        pumpRing.position.z = 0.26;

        const lcdFace = new THREE.Mesh(
          new THREE.CircleGeometry(0.71, 36),
          new THREE.MeshStandardMaterial({
            map: atlas.aioPumpDisplay,
            emissive: 0xffffff,
            emissiveMap: atlas.aioPumpDisplay,
            emissiveIntensity: 0.85,
            roughness: 0.08,
            metalness: 0.15,
          })
        );
        lcdFace.position.z = 0.27;
        pumpCapGroup.add(pumpRing, lcdFace);
        tagSubLayer(pumpCapGroup, [0, 0, 0.78], 'aio_pump_cap');

        // Dual rotary 90-degree tube fittings on right side of pump
        [-0.18, 0.18].forEach((fy) => {
          const fitting = new THREE.Mesh(
            new THREE.CylinderGeometry(0.09, 0.09, 0.26, 16),
            mattePlasticMat
          );
          fitting.rotation.z = Math.PI / 2;
          fitting.position.set(0.76, fy, 0.02);
          pumpG.add(fitting);
        });

        pumpG.add(coolerTimLayer, coldPlateGroup, pumpHousing, pumpImpeller, pumpCapGroup);
        registerComponent(
          'cpu_cooler',
          pumpG,
          HARDWARE_DB.cpu_cooler.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 4. Top 240mm AIO Radiator, Magnetic Dust Filter, 2× Open-Bore ARGB Fans & Braided Coolant Tubes (water_cooling)
        const waterG = new THREE.Group();
        waterG.position.set(-0.45, 4.55, 0.65);

        // Top Magnetic Fine-Mesh Dust Filter above Radiator
        const topDustFilter = new THREE.Mesh(
          new THREE.BoxGeometry(5.25, 0.05, 2.02),
          dustFilterMat
        );
        topDustFilter.position.y = 0.32;
        tagSubLayer(topDustFilter, [0, 0.85, 0], 'dust_filter');
        waterG.add(topDustFilter);

        const radCore = new THREE.Mesh(
          new THREE.BoxGeometry(5.3, 0.45, 2.05),
          [
            mattePlasticMat,
            mattePlasticMat,
            heatsinkFinsMat,
            heatsinkFinsMat,
            new THREE.MeshStandardMaterial({
              map: atlas.radiatorSidePlate,
              metalness: 0.75,
              roughness: 0.25,
            }),
            mattePlasticMat,
          ]
        );
        tagSubLayer(radCore, [0, 0.25, 0], 'radiator_core');
        waterG.add(radCore);

        // 2× 120mm Open-Bore Glowing Rainbow ARGB Fans mounted under top radiator (spinning continuously!)
        [-1.3, 1.3].forEach((fx) => {
          const fanUnit = new THREE.Group();
          fanUnit.position.set(fx, -0.38, 0);
          fanUnit.rotation.x = Math.PI / 2; // Orient Z-axis fan vertically under radiator

          const hollowFrame = createHollowFanFrame(
            2.25,
            0.28,
            0.94,
            mattePlasticMat,
            argbFanDiscMat
          );
          const rotor = createAxialFanRotor(
            0.9,
            0.24,
            9,
            argbBladeFrostedMat,
            fanHubBadgeMat,
            argbFanDiscMat
          );
          tagSubLayer(
            rotor,
            [0, 0, 0.52],
            fx < 0 ? 'gpu_shroud_fans' : undefined
          );

          fanUnit.add(hollowFrame, rotor);
          waterG.add(fanUnit);
          rotatingFans.push({
            mesh: rotor,
            ownerId: 'water_cooling',
            axis: 'z',
            speed: 10.5,
          });
        });

        // Dual Braided EPDM Liquid Cooling Tubes sweeping gracefully from Top-Right Radiator down to AIO Pump Block
        const tube1 = createBraidedTube(
          [
            [2.35, -0.35, 0.18],
            [1.65, -1.35, 0.72],
            [0.35, -2.05, 0.58],
            [-0.25, -2.22, -0.35],
          ],
          0.1,
          sleeveDarkMat
        );
        const tube2 = createBraidedTube(
          [
            [2.52, -0.35, -0.12],
            [1.85, -1.55, 0.45],
            [0.48, -2.35, 0.38],
            [-0.25, -2.55, -0.35],
          ],
          0.1,
          sleeveDarkMat
        );
        tagSubLayer(tube1, [0.25, -0.35, 0.25], 'aio_coldplate');
        tagSubLayer(tube2, [0.25, -0.35, -0.15]);
        waterG.add(tube1, tube2);

        registerComponent(
          'water_cooling',
          waterG,
          HARDWARE_DB.water_cooling.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 5. RAM (4× DDR5 Modules with Internal PCB, 8× DRAM ICs, PMIC, Thermal Pads, Heatspreaders & ARGB Lightbar) (ram)
        const ramG = new THREE.Group();
        ramG.position.set(0.32, 2.15, 0.14);
        const ramSideMat = new THREE.MeshStandardMaterial({
          map: atlas.ramHeatspreader,
          metalness: 0.72,
          roughness: 0.24,
        });

        for (let i = 0; i < 4; i++) {
          const rx = (i - 1.5) * 0.22;
          const stickGroup = new THREE.Group();
          stickGroup.position.x = rx;

          // Internal DDR5 Green/Dark PCB + 4× DRAM Silicon Chips + 288-Pin Gold Edge Connector
          const ramPcbGroup = new THREE.Group();
          const ramPcb = new THREE.Mesh(
            new THREE.BoxGeometry(0.035, 2.16, 0.46),
            [pcbEdgeMat, pcbEdgeMat, pcbEdgeMat, pcbEdgeMat, goldMat, pcbEdgeMat]
          );
          ramPcbGroup.add(ramPcb);
          for (let ic = 0; ic < 4; ic++) {
            const dramChip = new THREE.Mesh(
              new THREE.BoxGeometry(0.055, 0.34, 0.24),
              mirrorSiliconMat
            );
            dramChip.position.set(0, (ic - 1.5) * 0.48, 0.04);
            ramPcbGroup.add(dramChip);
          }
          if (i === 1) {
            tagSubLayer(ramPcbGroup, [0, 0, -0.45], 'ram_pcb_chips');
          } else {
            tagSubLayer(ramPcbGroup, [(i - 1.5) * 0.32, 0, -0.45]);
          }

          // Left & Right Anodized Aluminum Heatspreader Plates
          const spreaderL = new THREE.Mesh(
            new THREE.BoxGeometry(0.032, 2.22, 0.52),
            [ramSideMat, ramSideMat, darkAnodizedAluMat, darkAnodizedAluMat, darkAnodizedAluMat, darkAnodizedAluMat]
          );
          spreaderL.position.x = -0.038;
          const spreaderR = new THREE.Mesh(
            new THREE.BoxGeometry(0.032, 2.22, 0.52),
            [ramSideMat, ramSideMat, darkAnodizedAluMat, darkAnodizedAluMat, darkAnodizedAluMat, darkAnodizedAluMat]
          );
          spreaderR.position.x = 0.038;
          if (i === 0) {
            tagSubLayer(spreaderL, [-0.55, 0, 0.15], 'ram_heatspreader');
          } else {
            tagSubLayer(spreaderL, [(i - 1.5) * 0.32 - 0.18, 0, 0.15]);
          }
          tagSubLayer(spreaderR, [(i - 1.5) * 0.32 + 0.18, 0, 0.15]);

          // Top ARGB Diffuser Lightbar Spine
          const ledSpine = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 2.2, 0.16),
            ramRainbowMat
          );
          ledSpine.position.z = 0.28;
          if (i === 2) {
            tagSubLayer(ledSpine, [0, 0, 0.78], 'ram_diffuser');
          } else {
            tagSubLayer(ledSpine, [(i - 1.5) * 0.32, 0, 0.78]);
          }

          stickGroup.add(ramPcbGroup, spreaderL, spreaderR, ledSpine);
          ramG.add(stickGroup);
        }
        registerComponent(
          'ram',
          ramG,
          HARDWARE_DB.ram.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 6. GPU (ASUS ROG Strix GeForce RTX Triple-Fan Graphics Card) (gpu)
        // Full 5-Layer Exploded Architecture:
        // Backplate + Spring Bracket -> 12-Layer Copper PCB + AD102 Mirror Die + 12× GDDR6X VRAM + VRM ->
        // Thermal Paste & Blue VRAM Thermal Pads -> Vapor-Chamber Fin Stack + Heatpipes -> Shroud + 3× FDB Fans
        const gpuG = new THREE.Group();
        gpuG.position.set(-1.1, -0.25, 0.96);

        const gpuBpMat = new THREE.MeshStandardMaterial({
          map: atlas.gpuBackplate,
          metalness: 0.82,
          roughness: 0.24,
        });
        const gpuShroudMat = new THREE.MeshStandardMaterial({
          map: atlas.gpuShroud,
          metalness: 0.65,
          roughness: 0.32,
        });

        // Layer 1 (Top): Vented Aluminum Backplate + Stainless X-Retention Bracket & 4 Spring Screws
        const gpuBackplateGroup = new THREE.Group();
        gpuBackplateGroup.position.y = 0.47;
        const gpuBackplateMesh = new THREE.Mesh(
          new THREE.BoxGeometry(4.95, 0.08, 2.25),
          [darkAnodizedAluMat, darkAnodizedAluMat, gpuBpMat, darkAnodizedAluMat, darkAnodizedAluMat, darkAnodizedAluMat]
        );
        const xBracket = new THREE.Mesh(
          new THREE.BoxGeometry(0.95, 0.04, 0.95),
          nickelMat
        );
        xBracket.position.set(-0.35, 0.045, 0);
        gpuBackplateGroup.add(gpuBackplateMesh, xBracket);
        [
          [-0.75, -0.38],
          [0.05, -0.38],
          [-0.75, 0.38],
          [0.05, 0.38],
        ].forEach(([sx, sz]) => {
          const spScrew = createScrewHead(0.06, nickelMat, mattePlasticMat);
          spScrew.position.set(sx, 0.06, sz);
          gpuBackplateGroup.add(spScrew);
        });
        tagSubLayer(gpuBackplateGroup, [0, 1.15, 0], 'gpu_backplate');

        // Layer 2: 12-Layer High-Density GPU PCB + Mirror Silicon GPU Die + 12× GDDR6X VRAM Modules + VRM Chokes + PCIe Gold Fingers
        const gpuPcbLayer = new THREE.Group();
        gpuPcbLayer.position.y = 0.34;
        const gpuPcbBoard = new THREE.Mesh(
          new THREE.BoxGeometry(4.75, 0.07, 2.12),
          [pcbEdgeMat, pcbEdgeMat, gpuPcbTraceMat, gpuPcbTraceMat, pcbEdgeMat, pcbEdgeMat]
        );
        const gpuSiliconDie = new THREE.Mesh(
          new THREE.BoxGeometry(0.78, 0.05, 0.78),
          mirrorSiliconMat
        );
        gpuSiliconDie.position.set(-0.35, -0.05, 0);
        const gpuDieFrame = new THREE.Mesh(
          new THREE.BoxGeometry(0.96, 0.03, 0.96),
          nickelMat
        );
        gpuDieFrame.position.set(-0.35, -0.04, 0);
        gpuPcbLayer.add(gpuPcbBoard, gpuSiliconDie, gpuDieFrame);

        // 12× GDDR6X Memory Chips surrounding the GPU Die
        const vramOffsets = [
          [-0.95, -0.35],
          [-0.95, 0],
          [-0.95, 0.35],
          [0.25, -0.35],
          [0.25, 0],
          [0.25, 0.35],
          [-0.65, -0.68],
          [-0.35, -0.68],
          [-0.05, -0.68],
          [-0.65, 0.68],
          [-0.35, 0.68],
          [-0.05, 0.68],
        ];
        vramOffsets.forEach(([vx, vz]) => {
          const vramChip = new THREE.Mesh(
            new THREE.BoxGeometry(0.22, 0.04, 0.22),
            mattePlasticMat
          );
          vramChip.position.set(vx, -0.045, vz);
          gpuPcbLayer.add(vramChip);
        });

        // 8× VRM Power Stage Inductors on right side of GPU PCB
        for (let v = 0; v < 8; v++) {
          const vChoke = new THREE.Mesh(
            new THREE.BoxGeometry(0.18, 0.12, 0.18),
            chassisSteelMat
          );
          vChoke.position.set(0.85, -0.06, (v - 3.5) * 0.24);
          gpuPcbLayer.add(vChoke);
        }

        const pcieGoldEdge = new THREE.Mesh(
          new THREE.BoxGeometry(2.35, 0.18, 0.06),
          goldMat
        );
        pcieGoldEdge.position.set(-0.5, 0.01, -1.12);
        const pwrHeader16 = new THREE.Mesh(
          new THREE.BoxGeometry(0.54, 0.24, 0.32),
          mattePlasticMat
        );
        pwrHeader16.position.set(1.95, 0.02, 1.02);
        gpuPcbLayer.add(pcieGoldEdge, pwrHeader16);
        tagSubLayer(gpuPcbLayer, [0, 0.55, 0], 'gpu_pcb_vram');

        // Layer 3: Thermal Interface Layer (X-Spread Thermal Paste on GPU Die + Blue Silicone Thermal Pads on VRAM & VRM)
        const gpuThermalLayer = new THREE.Group();
        gpuThermalLayer.position.y = 0.22;
        const gpuTimPatch = new THREE.Mesh(
          new THREE.BoxGeometry(0.74, 0.02, 0.74),
          timPasteMat
        );
        gpuTimPatch.position.set(-0.35, 0, 0);
        const vramPadL = new THREE.Mesh(
          new THREE.BoxGeometry(0.26, 0.025, 0.95),
          blueThermalPadMat
        );
        vramPadL.position.set(-0.95, 0, 0);
        const vramPadR = new THREE.Mesh(
          new THREE.BoxGeometry(0.26, 0.025, 0.95),
          blueThermalPadMat
        );
        vramPadR.position.set(0.25, 0, 0);
        const vrmPadStrip = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.025, 1.85),
          blueThermalPadMat
        );
        vrmPadStrip.position.set(0.85, 0, 0);
        gpuThermalLayer.add(gpuTimPatch, vramPadL, vramPadR, vrmPadStrip);
        tagSubLayer(gpuThermalLayer, [0, 0.18, 0], 'thermal_pads');

        // Layer 4: Triple-Slot Aluminum Fin Stack + Copper Vapor Chamber Base + 4 Nickel Heatpipes
        const gpuHeatsinkGroup = new THREE.Group();
        const gpuFinCore = new THREE.Mesh(
          new THREE.BoxGeometry(4.85, 0.56, 2.15),
          heatsinkFinsMat
        );
        gpuFinCore.position.y = -0.1;
        const vaporBase = new THREE.Mesh(
          new THREE.BoxGeometry(1.65, 0.06, 1.45),
          copperMat
        );
        vaporBase.position.set(-0.35, 0.19, 0);
        gpuHeatsinkGroup.add(gpuFinCore, vaporBase);
        [-0.22, -0.07, 0.08, 0.23].forEach((hy) => {
          const hp = new THREE.Mesh(
            new THREE.CylinderGeometry(0.045, 0.045, 4.7, 16),
            nickelMat
          );
          hp.rotation.z = Math.PI / 2;
          hp.position.set(0, hy - 0.1, 1.02);
          gpuHeatsinkGroup.add(hp);
        });
        tagSubLayer(gpuHeatsinkGroup, [0, -0.25, 0], 'heatsink_fins');

        // Layer 5 (Bottom/Front): ROG Strix Shroud, GEFORCE RTX Side Fascia & 3× Axial-Tech Fans with Copper FDB Bearings
        const gpuShroudGroup = new THREE.Group();
        const gpuFrontFascia = new THREE.Mesh(
          new THREE.BoxGeometry(4.95, 0.82, 0.12),
          [darkAnodizedAluMat, darkAnodizedAluMat, darkAnodizedAluMat, darkAnodizedAluMat, gpuRogSideMat, darkAnodizedAluMat]
        );
        gpuFrontFascia.position.set(0, 0.02, 1.08);

        const gpuShroudMesh = new THREE.Mesh(
          new THREE.BoxGeometry(4.95, 0.18, 2.25),
          [darkAnodizedAluMat, darkAnodizedAluMat, darkAnodizedAluMat, gpuShroudMat, darkAnodizedAluMat, darkAnodizedAluMat]
        );
        gpuShroudMesh.position.y = -0.46;
        gpuShroudGroup.add(gpuFrontFascia, gpuShroudMesh);

        [-1.55, 0, 1.55].forEach((fx) => {
          const gFanHolder = new THREE.Group();
          gFanHolder.position.set(fx, -0.55, 0);
          gFanHolder.rotation.x = Math.PI / 2;

          // Visible Copper FDB Bearing Stator under each GPU fan
          const fdbStator = new THREE.Mesh(
            new THREE.CylinderGeometry(0.24, 0.24, 0.08, 18),
            copperMat
          );
          fdbStator.rotation.x = Math.PI / 2;
          fdbStator.position.z = -0.05;
          gFanHolder.add(fdbStator);

          const gFan = createAxialFanRotor(
            0.7,
            0.16,
            9,
            nickelMat,
            fanHubBadgeMat,
            argbFanDiscMat
          );
          gFanHolder.add(gFan);
          gpuShroudGroup.add(gFanHolder);
          rotatingFans.push({
            mesh: gFan,
            ownerId: 'gpu',
            axis: 'z',
            speed: 10.0,
          });
        });
        tagSubLayer(gpuShroudGroup, [0, -0.95, 0.25], 'gpu_shroud_fans');

        const ioBracket = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 1.85, 2.35),
          mattePlasticMat
        );
        ioBracket.position.set(-2.55, -0.1, 0);
        tagSubLayer(ioBracket, [-0.55, 0, 0]);

        gpuG.add(
          gpuBackplateGroup,
          gpuPcbLayer,
          gpuThermalLayer,
          gpuHeatsinkGroup,
          gpuShroudGroup,
          ioBracket
        );
        registerComponent(
          'gpu',
          gpuG,
          HARDWARE_DB.gpu.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 7. PSU (CORSAIR CX750 Power Supply with Internal Primary Capacitors, Copper Transformers, Bottom Dust Filter & Fan) (psu)
        const psuG = new THREE.Group();
        psuG.position.set(-3.05, -3.68, 1.15);
        const psuSideMat = new THREE.MeshStandardMaterial({
          map: atlas.psuSideLabel,
          roughness: 0.34,
          metalness: 0.35,
        });
        const psuModMat = new THREE.MeshStandardMaterial({
          map: atlas.psuModularPanel,
          roughness: 0.45,
          metalness: 0.3,
        });
        const psuBox = new THREE.Mesh(
          new THREE.BoxGeometry(3.25, 1.9, 2.85),
          [psuModMat, chassisDarkMat, chassisDarkMat, chassisDarkMat, psuSideMat, chassisDarkMat]
        );
        psuBox.position.y = -0.06;
        tagSubLayer(psuBox, [0, -0.35, 0], 'gpu_backplate');

        // Internal PSU Primary Bulk Capacitors, Yellow/Copper Switching Transformers & Secondary Heatsinks (revealed on explosion!)
        const psuInternals = new THREE.Group();
        psuInternals.position.y = 0.1;
        [-0.75, 0.15].forEach((tx) => {
          const xfmr = new THREE.Mesh(
            new THREE.BoxGeometry(0.65, 0.85, 0.75),
            copperMat
          );
          xfmr.position.set(tx, 0.2, 0);
          psuInternals.add(xfmr);
        });
        [-1.25, -1.25].forEach((cx, idx) => {
          const bulkCap = new THREE.Mesh(
            new THREE.CylinderGeometry(0.28, 0.28, 0.92, 20),
            darkAnodizedAluMat
          );
          bulkCap.position.set(cx, 0.2, idx === 0 ? -0.55 : 0.55);
          psuInternals.add(bulkCap);
        });
        const pfcCoil = new THREE.Mesh(
          new THREE.TorusGeometry(0.28, 0.1, 14, 24),
          copperMat
        );
        pfcCoil.position.set(0.95, 0.25, -0.45);
        psuInternals.add(pfcCoil);
        tagSubLayer(psuInternals, [0, 0.58, 0], 'psu_transformers');

        // Top 120mm PSU intake circular grille & spinning 9-blade PSU cooling fan
        const psuTopCover = new THREE.Group();
        const psuGrilleRing = new THREE.Mesh(
          new THREE.RingGeometry(0.25, 0.92, 24),
          nickelMat
        );
        psuGrilleRing.rotation.x = -Math.PI / 2;
        psuGrilleRing.position.y = 1.04;

        const psuFanHolder = new THREE.Group();
        psuFanHolder.position.y = 1.03;
        psuFanHolder.rotation.x = Math.PI / 2;
        const psuRotor = createAxialFanRotor(
          0.86,
          0.16,
          9,
          nickelMat,
          fanHubBadgeMat
        );
        psuFanHolder.add(psuRotor);
        psuTopCover.add(psuGrilleRing, psuFanHolder);
        tagSubLayer(psuTopCover, [0, 1.25, 0], 'psu_fan_grille');
        rotatingFans.push({
          mesh: psuRotor,
          ownerId: 'psu',
          axis: 'z',
          speed: 8.5,
        });

        // Removable Bottom PSU Magnetic Dust Filter Mesh
        const psuDustFilter = new THREE.Mesh(
          new THREE.BoxGeometry(3.15, 0.06, 2.75),
          dustFilterMat
        );
        psuDustFilter.position.y = -1.06;
        tagSubLayer(psuDustFilter, [0, -0.95, 0], 'dust_filter');

        psuG.add(psuBox, psuInternals, psuTopCover, psuDustFilter);
        registerComponent(
          'psu',
          psuG,
          HARDWARE_DB.psu.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 8. M.2 NVMe SSD (nvme) — Positioned at [-1.25, 0.95, -0.2]
        // Explodes into: M.2 PCB + Gold M-Key Edge -> Silicon Controller + DRAM + 2× 3D NAND -> Blue Thermal Pad -> Label Shield + M.2 Screw
        const nvmeG = new THREE.Group();
        nvmeG.position.set(-1.25, 0.95, -0.2);

        const nvmePcbGroup = new THREE.Group();
        const nvmePcb = new THREE.Mesh(
          new THREE.BoxGeometry(2.05, 0.56, 0.045),
          [goldMat, pcbEdgeMat, pcbEdgeMat, pcbEdgeMat, pcbEdgeMat, pcbEdgeMat]
        );
        const nvmeCtrlChip = new THREE.Mesh(
          new THREE.BoxGeometry(0.32, 0.32, 0.035),
          mirrorSiliconMat
        );
        nvmeCtrlChip.position.set(0.55, 0, 0.035);
        const nvmeNand1 = new THREE.Mesh(
          new THREE.BoxGeometry(0.46, 0.38, 0.035),
          mattePlasticMat
        );
        nvmeNand1.position.set(-0.05, 0, 0.035);
        const nvmeNand2 = new THREE.Mesh(
          new THREE.BoxGeometry(0.46, 0.38, 0.035),
          mattePlasticMat
        );
        nvmeNand2.position.set(-0.62, 0, 0.035);
        nvmePcbGroup.add(nvmePcb, nvmeCtrlChip, nvmeNand1, nvmeNand2);
        tagSubLayer(nvmePcbGroup, [0, 0, -0.42], 'ssd_controller_nand');

        const nvmePad = new THREE.Mesh(
          new THREE.BoxGeometry(1.85, 0.48, 0.025),
          blueThermalPadMat
        );
        nvmePad.position.z = 0.055;
        tagSubLayer(nvmePad, [0, 0, 0.15], 'thermal_pads');

        const nvmeTopMat = new THREE.MeshStandardMaterial({
          map: atlas.nvmeLabel,
          roughness: 0.32,
          metalness: 0.35,
        });
        const nvmeTopPlate = new THREE.Mesh(
          new THREE.BoxGeometry(1.92, 0.54, 0.03),
          [darkAnodizedAluMat, darkAnodizedAluMat, darkAnodizedAluMat, darkAnodizedAluMat, nvmeTopMat, darkAnodizedAluMat]
        );
        nvmeTopPlate.position.z = 0.085;
        tagSubLayer(nvmeTopPlate, [0, 0, 0.65], 'heatsink_fins');

        const nvmeScrew = createScrewHead(0.075, nickelMat, mattePlasticMat);
        nvmeScrew.rotation.x = Math.PI / 2;
        nvmeScrew.position.set(-0.98, 0, 0.09);
        tagSubLayer(nvmeScrew, [-0.35, 0, 0.85], 'gold_contacts');

        nvmeG.add(nvmePcbGroup, nvmePad, nvmeTopPlate, nvmeScrew);
        registerComponent(
          'nvme',
          nvmeG,
          HARDWARE_DB.nvme.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 9. 2.5" SATA SSD (ssd) — Repositioned cleanly at [2.45, -3.55, 0.75]
        // Explodes into: Lower Shell -> Internal SATA PCB + Controller + 4× NAND Flash -> Top Brushed Cover
        const ssdG = new THREE.Group();
        ssdG.position.set(2.45, -3.55, 0.75);

        const ssdBottomShell = new THREE.Mesh(
          new THREE.BoxGeometry(1.45, 2.05, 0.08),
          darkAnodizedAluMat
        );
        ssdBottomShell.position.z = -0.07;
        tagSubLayer(ssdBottomShell, [0, 0, -0.55], 'gpu_backplate');

        const ssdInternalPcb = new THREE.Group();
        const ssdPcbMesh = new THREE.Mesh(
          new THREE.BoxGeometry(1.32, 1.85, 0.045),
          greenSubstrateMat
        );
        const ssdCtrl = new THREE.Mesh(
          new THREE.BoxGeometry(0.34, 0.34, 0.04),
          mirrorSiliconMat
        );
        ssdCtrl.position.set(0, -0.52, 0.04);
        ssdInternalPcb.add(ssdPcbMesh, ssdCtrl);
        [
          [-0.32, 0.05],
          [0.32, 0.05],
          [-0.32, 0.55],
          [0.32, 0.55],
        ].forEach(([nx, ny]) => {
          const nand = new THREE.Mesh(
            new THREE.BoxGeometry(0.42, 0.36, 0.04),
            mattePlasticMat
          );
          nand.position.set(nx, ny, 0.04);
          ssdInternalPcb.add(nand);
        });
        const sataPlug = new THREE.Mesh(
          new THREE.BoxGeometry(0.88, 0.24, 0.14),
          goldMat
        );
        sataPlug.position.set(0, -1.04, 0);
        ssdInternalPcb.add(sataPlug);
        tagSubLayer(ssdInternalPcb, [0, 0, 0], 'ssd_controller_nand');

        const ssdFaceMat = new THREE.MeshStandardMaterial({
          map: atlas.sataSsdTop,
          roughness: 0.32,
          metalness: 0.45,
        });
        const ssdTopCover = new THREE.Mesh(
          new THREE.BoxGeometry(1.45, 2.05, 0.09),
          [darkAnodizedAluMat, darkAnodizedAluMat, darkAnodizedAluMat, darkAnodizedAluMat, ssdFaceMat, darkAnodizedAluMat]
        );
        ssdTopCover.position.z = 0.07;
        tagSubLayer(ssdTopCover, [0, 0, 0.65], 'heatsink_fins');

        ssdG.add(ssdBottomShell, ssdInternalPcb, ssdTopCover);
        registerComponent(
          'ssd',
          ssdG,
          HARDWARE_DB.ssd.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 10. 3.5" Mechanical Hard Drive (hdd) — Non-clipping Open Cutaway Drive at [0.35, -3.85, 0.72]
        // Features spinning dual mirror platters + oscillating voice-coil read/write actuator head + sub-layer explosion!
        const hddG = new THREE.Group();
        hddG.position.set(0.35, -3.85, 0.72);

        const hddBasinGroup = new THREE.Group();
        const hddBasin = new THREE.Mesh(
          new THREE.BoxGeometry(1.95, 0.34, 2.25),
          [
            darkAnodizedAluMat,
            darkAnodizedAluMat,
            darkAnodizedAluMat,
            greenSubstrateMat,
            darkAnodizedAluMat,
            darkAnodizedAluMat,
          ]
        );
        hddBasin.position.y = -0.06;

        const rimSideGeo = new THREE.BoxGeometry(0.1, 0.18, 2.25);
        const rimL = new THREE.Mesh(rimSideGeo, brushedAluMat);
        rimL.position.set(-0.925, 0.18, 0);
        const rimR = new THREE.Mesh(rimSideGeo, brushedAluMat);
        rimR.position.set(0.925, 0.18, 0);
        const rimFrontBackGeo = new THREE.BoxGeometry(1.75, 0.18, 0.12);
        const rimFront = new THREE.Mesh(rimFrontBackGeo, brushedAluMat);
        rimFront.position.set(0, 0.18, 1.065);
        const rimBack = new THREE.Mesh(rimFrontBackGeo, brushedAluMat);
        rimBack.position.set(0, 0.18, -1.065);
        const hddSataHeader = new THREE.Mesh(
          new THREE.BoxGeometry(0.95, 0.16, 0.14),
          goldMat
        );
        hddSataHeader.position.set(0, -0.06, -1.16);
        hddBasinGroup.add(hddBasin, rimL, rimR, rimFront, rimBack, hddSataHeader);
        tagSubLayer(hddBasinGroup, [0, -0.55, 0], 'pcb_traces');

        // Spinning Dual Magnetic Platters Assembly (7200 RPM)
        const platterRotorGroup = new THREE.Group();
        platterRotorGroup.position.set(0.05, 0.16, -0.14);

        const platterMat = new THREE.MeshStandardMaterial({
          color: 0xf1f5f9,
          metalness: 0.96,
          roughness: 0.04,
        });
        const platterTop = new THREE.Mesh(
          new THREE.CylinderGeometry(0.76, 0.76, 0.025, 36),
          platterMat
        );
        platterTop.position.y = 0.04;
        const platterBottom = new THREE.Mesh(
          new THREE.CylinderGeometry(0.76, 0.76, 0.025, 36),
          platterMat
        );
        platterBottom.position.y = -0.03;

        const trackRing = new THREE.Mesh(
          new THREE.RingGeometry(0.32, 0.72, 32),
          cyanLedMat
        );
        trackRing.rotation.x = -Math.PI / 2;
        trackRing.position.y = 0.055;

        const sectorMarker = new THREE.Mesh(
          new THREE.BoxGeometry(0.42, 0.015, 0.045),
          goldMat
        );
        sectorMarker.position.set(0.45, 0.056, 0);

        const spindleHub = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.2, 0.14, 24),
          [goldMat, fanHubBadgeMat, goldMat]
        );
        platterRotorGroup.add(
          platterTop,
          platterBottom,
          trackRing,
          sectorMarker,
          spindleHub
        );
        tagSubLayer(platterRotorGroup, [0, 0.22, 0], 'hdd_platters');

        rotatingFans.push({
          mesh: platterRotorGroup,
          ownerId: 'hdd',
          axis: 'y',
          speed: 14.5,
        });

        // Voice-Coil Actuator Arm & Oscillating Read/Write Slider Head
        const actuatorPivot = new THREE.Group();
        actuatorPivot.position.set(-0.58, 0.22, 0.68);

        const voiceCoil = new THREE.Mesh(
          new THREE.CylinderGeometry(0.22, 0.22, 0.09, 20),
          copperMat
        );
        const armBeam = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 0.035, 0.92),
          nickelMat
        );
        armBeam.position.set(0.18, 0.02, -0.44);
        armBeam.rotation.y = -0.38;

        const readWriteHead = new THREE.Mesh(
          new THREE.BoxGeometry(0.09, 0.05, 0.12),
          new THREE.MeshStandardMaterial({
            color: 0xf43f5e,
            emissive: 0xe11d48,
            emissiveIntensity: 0.85,
            roughness: 0.2,
          })
        );
        readWriteHead.position.set(0.34, 0.03, -0.86);
        actuatorPivot.add(voiceCoil, armBeam, readWriteHead);
        hddActuatorArm = actuatorPivot;
        tagSubLayer(actuatorPivot, [-0.25, 0.55, 0.2], 'hdd_actuator');

        // Clear Acrylic Cutaway Top Cover with 6 Perimeter Torx Screws
        const hddTopCoverGroup = new THREE.Group();
        hddTopCoverGroup.position.y = 0.28;
        const hddAcrylicCover = new THREE.Mesh(
          new THREE.BoxGeometry(1.86, 0.03, 2.16),
          glassMat
        );
        hddTopCoverGroup.add(hddAcrylicCover);
        [
          [-0.86, -1.0],
          [0.86, -1.0],
          [-0.86, 0],
          [0.86, 0],
          [-0.86, 1.0],
          [0.86, 1.0],
        ].forEach(([sx, sz]) => {
          const torx = createScrewHead(0.05, nickelMat, mattePlasticMat);
          torx.position.set(sx, 0.02, sz);
          hddTopCoverGroup.add(torx);
        });
        tagSubLayer(hddTopCoverGroup, [0, 0.95, 0], 'gpu_backplate');

        hddG.add(
          hddBasinGroup,
          platterRotorGroup,
          actuatorPivot,
          hddTopCoverGroup
        );
        registerComponent(
          'hdd',
          hddG,
          HARDWARE_DB.hdd.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 11. 3× Front 120mm Open-Bore ARGB Intake Fans + 1× Rear 120mm ARGB Exhaust Fan + Front Magnetic Dust Filter + 6-Port ARGB/PWM Controller Hub (case_fan)
        const fanG = new THREE.Group();
        fanG.position.set(0, 0, 0);

        const buildArgbCaseFan = (
          fx: number,
          fy: number,
          fz: number,
          speed: number,
          labelRotor = false
        ) => {
          const unit = new THREE.Group();
          unit.position.set(fx, fy, fz);
          unit.rotation.y = -Math.PI / 2; // Orient Z-axis fan along X axis into the PC interior

          const hollowFrame = createHollowFanFrame(
            2.42,
            0.34,
            1.04,
            mattePlasticMat,
            argbFanDiscMat
          );
          const caseRotor = createAxialFanRotor(
            0.98,
            0.28,
            9,
            argbBladeFrostedMat,
            fanHubBadgeMat,
            argbFanDiscMat
          );
          tagSubLayer(
            caseRotor,
            [0, 0, 0.55],
            labelRotor ? 'gpu_shroud_fans' : undefined
          );

          unit.add(hollowFrame, caseRotor);
          rotatingFans.push({
            mesh: caseRotor,
            ownerId: 'case_fan',
            axis: 'z',
            speed,
          });
          return unit;
        };

        // 3× Vertical Front Right ARGB Intake Fans (top, middle, bottom — matching reference image)
        fanG.add(
          buildArgbCaseFan(4.2, 2.55, 0.75, 11.0, true),
          buildArgbCaseFan(4.2, -0.1, 0.75, 11.0, false),
          buildArgbCaseFan(4.2, -2.75, 0.75, 11.0, false)
        );

        // Front Fine-Mesh Magnetic Dust Filter Panel mounted right in front of the 3 intake fans
        const frontDustFilter = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 7.65, 2.45),
          dustFilterMat
        );
        frontDustFilter.position.set(4.48, -0.1, 0.75);
        tagSubLayer(frontDustFilter, [1.05, 0, 0], 'dust_filter');
        fanG.add(frontDustFilter);

        // Dedicated 6-Port PWM & 5V ARGB Controller Hub (Corsair Commander Core XT style) mounted on motherboard tray
        const argbControllerHub = new THREE.Group();
        argbControllerHub.position.set(2.05, -2.15, -0.22);
        const hubBody = new THREE.Mesh(
          new THREE.BoxGeometry(1.15, 0.68, 0.16),
          [mattePlasticMat, mattePlasticMat, mattePlasticMat, mattePlasticMat, argbHubMat, mattePlasticMat]
        );
        const hubLedStrip = new THREE.Mesh(
          new THREE.BoxGeometry(0.96, 0.06, 0.18),
          argbFanDiscMat
        );
        argbControllerHub.add(hubBody, hubLedStrip);
        // 6× 4-Pin PWM + 6× 3-Pin ARGB Gold Pin Headers along top & bottom edges of the Hub
        for (let p = 0; p < 6; p++) {
          const px = (p - 2.5) * 0.16;
          const pwmHeader = new THREE.Mesh(
            new THREE.BoxGeometry(0.11, 0.08, 0.12),
            goldMat
          );
          pwmHeader.position.set(px, 0.37, 0.02);
          const argbHeader = new THREE.Mesh(
            new THREE.BoxGeometry(0.11, 0.08, 0.12),
            goldMat
          );
          argbHeader.position.set(px, -0.37, 0.02);
          argbControllerHub.add(pwmHeader, argbHeader);
        }
        tagSubLayer(argbControllerHub, [0.55, -0.35, 0.65], 'gold_contacts');
        fanG.add(argbControllerHub);

        // 1× Rear Left 120mm ARGB Exhaust Fan
        const rearFanUnit = buildArgbCaseFan(-4.42, 2.25, 0.55, 10.0, false);
        rearFanUnit.rotation.y = Math.PI / 2;
        fanG.add(rearFanUnit);

        registerComponent(
          'case_fan',
          fanG,
          HARDWARE_DB.case_fan.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 12. CR2032 CMOS Coin-Cell Battery (cmos_battery)
        const cmosG = new THREE.Group();
        cmosG.position.set(-1.85, 0.35, -0.22);
        const cmosSocket = new THREE.Mesh(
          new THREE.CylinderGeometry(0.36, 0.36, 0.08, 24),
          mattePlasticMat
        );
        cmosSocket.rotation.x = Math.PI / 2;
        const cmosClip = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 0.42, 0.09),
          goldMat
        );
        cmosClip.position.set(0.28, 0, 0.01);
        const cmosCell = new THREE.Mesh(
          new THREE.CylinderGeometry(0.31, 0.31, 0.09, 24),
          [
            nickelMat,
            new THREE.MeshStandardMaterial({
              map: atlas.cmosBatteryTop,
              metalness: 0.88,
              roughness: 0.18,
            }),
            nickelMat,
          ]
        );
        cmosCell.rotation.x = Math.PI / 2;
        cmosCell.position.z = 0.03;
        tagSubLayer(cmosSocket, [0, 0, -0.38], 'pcb_traces');
        tagSubLayer(cmosClip, [0.22, 0, 0.08], 'gold_contacts');
        tagSubLayer(cmosCell, [0, 0, 0.48], 'battery_cells');
        cmosG.add(cmosSocket, cmosClip, cmosCell);
        registerComponent(
          'cmos_battery',
          cmosG,
          HARDWARE_DB.cmos_battery.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 13. UEFI / BIOS SPI Flash Chip (bios_chip)
        const biosG = new THREE.Group();
        biosG.position.set(-0.15, -1.35, -0.22);
        const biosDieCore = new THREE.Mesh(
          new THREE.BoxGeometry(0.32, 0.32, 0.04),
          mirrorSiliconMat
        );
        biosDieCore.position.z = -0.02;
        const biosPkg = new THREE.Mesh(
          new THREE.BoxGeometry(0.46, 0.46, 0.1),
          [
            mattePlasticMat,
            mattePlasticMat,
            mattePlasticMat,
            mattePlasticMat,
            new THREE.MeshStandardMaterial({ map: atlas.biosChipTop, roughness: 0.28 }),
            mattePlasticMat,
          ]
        );
        // 8 Silver SOIC Gull-Wing Pins Group
        const biosPinsG = new THREE.Group();
        for (let p = 0; p < 4; p++) {
          const pinL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.06), nickelMat);
          pinL.position.set(-0.26, (p - 1.5) * 0.1, -0.02);
          const pinR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.06), nickelMat);
          pinR.position.set(0.26, (p - 1.5) * 0.1, -0.02);
          biosPinsG.add(pinL, pinR);
        }
        tagSubLayer(biosPinsG, [0, 0, -0.38], 'substrate_pins');
        tagSubLayer(biosDieCore, [0, 0, 0.08], 'silicon_die');
        tagSubLayer(biosPkg, [0, 0, 0.48], 'ihs');
        biosG.add(biosPinsG, biosDieCore, biosPkg);
        registerComponent(
          'bios_chip',
          biosG,
          HARDWARE_DB.bios_chip.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 14. 4× Right-Angle SATA III 6Gb/s Ports (sata_ports)
        const sataG = new THREE.Group();
        sataG.position.set(1.92, -0.85, -0.16);
        const sataBlock = new THREE.Mesh(
          new THREE.BoxGeometry(0.42, 1.35, 0.34),
          mattePlasticMat
        );
        const sataContactsG = new THREE.Group();
        for (let s = 0; s < 4; s++) {
          const slotKey = new THREE.Mesh(
            new THREE.BoxGeometry(0.44, 0.22, 0.06),
            goldMat
          );
          slotKey.position.set(0.02, (s - 1.5) * 0.3, 0);
          sataContactsG.add(slotKey);
        }
        const sataShieldPlate = new THREE.Mesh(
          new THREE.BoxGeometry(0.44, 1.38, 0.04),
          nickelMat
        );
        sataShieldPlate.position.z = 0.19;
        tagSubLayer(sataBlock, [-0.25, 0, -0.25], 'pcb_traces');
        tagSubLayer(sataContactsG, [0.35, 0, 0.15], 'gold_contacts');
        tagSubLayer(sataShieldPlate, [0, 0, 0.48], 'ihs');
        sataG.add(sataBlock, sataContactsG, sataShieldPlate);
        registerComponent(
          'sata_ports',
          sataG,
          HARDWARE_DB.sata_ports.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 15. PCIe 5.0 / 4.0 Expansion Slots with SafeSlot Armor (pcie_slots)
        const pcieG = new THREE.Group();
        pcieG.position.set(-0.65, -0.85, -0.18);
        const slot1Armor = new THREE.Mesh(
          new THREE.BoxGeometry(3.45, 0.22, 0.22),
          nickelMat
        );
        slot1Armor.position.y = 0.72;
        const slot1Pins = new THREE.Mesh(
          new THREE.BoxGeometry(3.32, 0.08, 0.24),
          goldMat
        );
        slot1Pins.position.y = 0.72;
        const slot1Latch = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 0.32, 0.28),
          cyanLedMat
        );
        slot1Latch.position.set(1.82, 0.72, 0.04);

        const lowerSlotsG = new THREE.Group();
        const slot2 = new THREE.Mesh(
          new THREE.BoxGeometry(3.45, 0.18, 0.18),
          mattePlasticMat
        );
        slot2.position.y = -0.25;
        const slot3 = new THREE.Mesh(
          new THREE.BoxGeometry(1.45, 0.18, 0.18),
          mattePlasticMat
        );
        slot3.position.set(-1.0, -0.95, 0);
        lowerSlotsG.add(slot2, slot3);

        tagSubLayer(lowerSlotsG, [0, -0.35, -0.32], 'pcb_traces');
        tagSubLayer(slot1Pins, [0, 0.15, 0.08], 'gold_contacts');
        tagSubLayer(slot1Armor, [0, 0.35, 0.45], 'ihs');
        tagSubLayer(slot1Latch, [0.45, 0.35, 0.55]);

        pcieG.add(lowerSlotsG, slot1Pins, slot1Armor, slot1Latch);
        registerComponent(
          'pcie_slots',
          pcieG,
          HARDWARE_DB.pcie_slots.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 16. Realtek ALC4080 Audio Chip & Gold Nichicon Capacitors (audio_chip)
        const audG = new THREE.Group();
        audG.position.set(-2.55, -1.65, -0.2);
        const audBasePcb = new THREE.Mesh(
          new THREE.BoxGeometry(0.68, 0.88, 0.04),
          pcbEdgeMat
        );
        audBasePcb.position.set(-0.12, 0, -0.06);
        const audIc = new THREE.Mesh(
          new THREE.BoxGeometry(0.54, 0.54, 0.12),
          [
            nickelMat,
            nickelMat,
            nickelMat,
            nickelMat,
            new THREE.MeshStandardMaterial({ map: atlas.audioChipTop, roughness: 0.25 }),
            nickelMat,
          ]
        );
        // 4 Golden Nichicon Audio Filter Capacitors next to chip
        const audCapsG = new THREE.Group();
        for (let c = 0; c < 4; c++) {
          const cap = new THREE.Mesh(
            new THREE.CylinderGeometry(0.085, 0.085, 0.22, 16),
            goldMat
          );
          cap.rotation.x = Math.PI / 2;
          cap.position.set(-0.42, (c - 1.5) * 0.22, 0.04);
          audCapsG.add(cap);
        }
        tagSubLayer(audBasePcb, [0, 0, -0.38], 'pcb_traces');
        tagSubLayer(audIc, [0.15, 0, 0.15], 'silicon_die');
        tagSubLayer(audCapsG, [-0.28, 0, 0.48], 'psu_transformers');
        audG.add(audBasePcb, audIc, audCapsG);
        registerComponent(
          'audio_chip',
          audG,
          HARDWARE_DB.audio_chip.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 17. Intel I226-V 2.5GbE LAN Controller Chip (network_chip)
        const netG = new THREE.Group();
        netG.position.set(-2.45, 0.85, -0.2);
        const netPad = new THREE.Mesh(
          new THREE.BoxGeometry(0.56, 0.56, 0.03),
          goldMat
        );
        netPad.position.z = -0.05;
        const netIc = new THREE.Mesh(
          new THREE.BoxGeometry(0.48, 0.48, 0.1),
          [
            mattePlasticMat,
            mattePlasticMat,
            mattePlasticMat,
            mattePlasticMat,
            new THREE.MeshStandardMaterial({ map: atlas.networkChipTop, roughness: 0.28 }),
            mattePlasticMat,
          ]
        );
        const xtal = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, 0.1, 0.08),
          nickelMat
        );
        xtal.position.set(0.36, 0, 0);
        tagSubLayer(netPad, [0, 0, -0.38], 'substrate_pins');
        tagSubLayer(netIc, [0, 0, 0.12], 'silicon_die');
        tagSubLayer(xtal, [0.28, 0, 0.45], 'ihs');
        netG.add(netPad, netIc, xtal);
        registerComponent(
          'network_chip',
          netG,
          HARDWARE_DB.network_chip.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 18. Front-Panel Headers (F_PANEL & USB 3.2) (front_panel)
        const fpG = new THREE.Group();
        fpG.position.set(1.35, -2.15, -0.18);
        const fpBase = new THREE.Mesh(
          new THREE.BoxGeometry(0.85, 0.26, 0.14),
          new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 })
        );
        // Individual golden header pins Group
        const fpPinsG = new THREE.Group();
        for (let px = -0.32; px <= 0.32; px += 0.16) {
          for (let py = -0.05; py <= 0.05; py += 0.1) {
            const pin = new THREE.Mesh(
              new THREE.CylinderGeometry(0.018, 0.018, 0.22, 8),
              goldMat
            );
            pin.rotation.x = Math.PI / 2;
            pin.position.set(px, py, 0.1);
            fpPinsG.add(pin);
          }
        }
        tagSubLayer(fpBase, [0, 0, -0.35], 'pcb_traces');
        tagSubLayer(fpPinsG, [0, 0, 0.45], 'gold_contacts');
        fpG.add(fpBase, fpPinsG);
        registerComponent(
          'front_panel',
          fpG,
          HARDWARE_DB.front_panel.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // 19. 24-Pin ATX & 8-Pin EPS Power Connectors (power_connectors)
        const pwrG = new THREE.Group();
        pwrG.position.set(1.92, 1.45, -0.14);
        const atx24Box = new THREE.Mesh(
          new THREE.BoxGeometry(0.38, 1.65, 0.34),
          mattePlasticMat
        );
        const atxPins = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 1.52, 0.38),
          goldMat
        );
        atxPins.position.z = 0.04;
        const atxLatch = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.28, 0.36),
          nickelMat
        );
        atxLatch.position.set(0.2, 0, 0);

        // Also include the 8-Pin EPS CPU header at top-left relative to pwrG
        const eps8Box = new THREE.Mesh(
          new THREE.BoxGeometry(0.68, 0.34, 0.34),
          mattePlasticMat
        );
        eps8Box.position.set(-4.1, 2.0, 0);
        tagSubLayer(atx24Box, [0, 0, -0.35], 'pcb_traces');
        tagSubLayer(eps8Box, [-0.25, 0.25, -0.35]);
        tagSubLayer(atxPins, [0, 0, 0.15], 'gold_contacts');
        tagSubLayer(atxLatch, [0.35, 0, 0.48], 'ihs');
        pwrG.add(atx24Box, atxPins, atxLatch, eps8Box);
        registerComponent(
          'power_connectors',
          pwrG,
          HARDWARE_DB.power_connectors.explodeOffset,
          componentGroups,
          interactiveMeshes
        );

        // DESKTOP PC REALISTIC BRAIDED 3D CABLES & PLUG HARNESSES (cablesGroup)
        // 1. 24-Pin ATX Braided Bundle with Cable Combs & Molded Plug (PSU -> Right Grommet -> 24-Pin Header)
        [-0.12, -0.04, 0.04, 0.12].forEach((offsetY, idx) => {
          cablesGroup.add(
            createCableWithPlugs(
              [
                [-1.4, -3.45 + offsetY, 0.45],
                [2.35, -3.15 + offsetY, -0.62],
                [2.42, 1.45 + offsetY, -0.62],
                [1.92, 1.45 + offsetY, 0.04],
              ],
              0.048,
              idx % 2 === 0 ? sleeveCyanMat : sleeveDarkMat,
              mattePlasticMat,
              2
            )
          );
        });

        // 2. 16-Pin 12VHPWR PCIe 5.0 GPU Power Harness with Combs & Plug (PSU -> GPU Top-Right Header)
        [-0.08, 0, 0.08].forEach((ox, idx) => {
          cablesGroup.add(
            createCableWithPlugs(
              [
                [-1.4, -3.55, 0.95 + ox],
                [0.85 + ox, -2.35, 1.75],
                [0.85 + ox, -0.65, 2.22],
                [0.85 + ox, 0.12, 1.98],
              ],
              0.046,
              idx === 1 ? sleeveAmberMat : sleeveDarkMat,
              mattePlasticMat,
              2
            )
          );
        });

        // 3. Dual 8-Pin EPS 12V CPU Power Harness (PSU -> Back Tray -> Top-Left EPS Header)
        [-0.05, 0.05].forEach((ox, idx) => {
          cablesGroup.add(
            createCableWithPlugs(
              [
                [-1.55, -3.45, -0.35 + ox],
                [-2.25 + ox, -1.5, -0.92],
                [-2.25 + ox, 3.65, -0.92],
                [-2.18 + ox, 3.45, 0.02],
              ],
              0.052,
              idx === 0 ? sleeveAmberMat : sleeveDarkMat,
              mattePlasticMat,
              1
            )
          );
        });

        // 4. SATA III Data Cables with L-Shaped Connectors (SATA Ports -> Non-Clipping HDD & SATA SSD)
        cablesGroup.add(
          createCableWithPlugs(
            [
              [1.92, -0.72, -0.06],
              [2.52, -1.65, -0.45],
              [2.45, -2.55, 0.72],
            ],
            0.042,
            sleevePurpleMat,
            mattePlasticMat
          ),
          createCableWithPlugs(
            [
              [1.92, -1.02, -0.06],
              [1.65, -2.25, -0.52],
              [0.35, -3.85, -0.44],
            ],
            0.042,
            sleeveCyanMat,
            mattePlasticMat
          )
        );

        // 5. 15-Pin SATA Power Daisy-Chain Harness (PSU -> HDD -> SATA SSD)
        cablesGroup.add(
          createCableWithPlugs(
            [
              [-1.4, -3.78, 0.55],
              [-0.45, -3.85, -0.44],
              [1.45, -3.65, 0.15],
              [2.45, -2.65, 0.78],
            ],
            0.044,
            sleeveAmberMat,
            mattePlasticMat,
            1
          )
        );

        // 6. AIO Pump Tach/ARGB Cable & Front/Rear Case Fan PWM Harness + Front Panel I/O Ribbon
        cablesGroup.add(
          createCableWithPlugs(
            [
              [-1.45, 2.75, 0.22],
              [-1.15, 3.35, 0.05],
              [-0.55, 3.35, -0.18],
            ],
            0.03,
            sleeveDarkMat,
            mattePlasticMat
          ),
          createCableWithPlugs(
            [
              [4.1, -2.75, -0.35],
              [4.1, -0.1, -0.35],
              [4.1, 2.55, -0.35],
              [2.35, 2.1, -0.68],
              [1.25, 2.1, -0.22],
            ],
            0.034,
            sleevePurpleMat,
            mattePlasticMat
          ),
          createCableWithPlugs(
            [
              [4.45, -4.15, 1.85],
              [2.65, -3.25, -0.45],
              [1.35, -2.15, -0.08],
            ],
            0.038,
            sleeveCyanMat,
            cyanLedMat
          )
        );
        platformRootGroup.add(cablesGroup);
      }

      // =======================================================================
      // BUILD 3D AIRFLOW STREAMLINES & ANIMATED ARROWS (Feature 2)
      // =======================================================================
      const buildAirflowStream = (
        pts: [number, number, number][],
        intakeColorHex: number,
        exhaustColorHex: number,
        speed: number
      ) => {
        const vecs = pts.map((p) => new THREE.Vector3(...p));
        const curve = new THREE.CatmullRomCurve3(vecs);

        // Streamline guide tube
        const streamMat = new THREE.MeshBasicMaterial({
          color: intakeColorHex,
          transparent: true,
          opacity: 0.24,
          depthWrite: false,
        });
        const streamMesh = new THREE.Mesh(
          new THREE.TubeGeometry(curve, 28, 0.032, 8, false),
          streamMat
        );
        airflowGroup.add(streamMesh);

        // 3 animated arrow cones gliding along each airflow path
        for (let a = 0; a < 3; a++) {
          const isWarmHalf = a >= 1;
          const arrowColor = isWarmHalf ? exhaustColorHex : intakeColorHex;
          const arrowMat = new THREE.MeshBasicMaterial({
            color: arrowColor,
            transparent: true,
            opacity: 0.92,
          });
          const arrowHolder = new THREE.Group();
          const coneGeo = new THREE.ConeGeometry(0.14, 0.38, 12);
          coneGeo.rotateX(Math.PI / 2); // Point cone along +Z so lookAt(pt + tangent) aligns arrow tip!
          const coneMesh = new THREE.Mesh(coneGeo, arrowMat);

          const stemGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.26, 10);
          stemGeo.rotateX(Math.PI / 2);
          const stemMesh = new THREE.Mesh(stemGeo, arrowMat);
          stemMesh.position.z = -0.24;

          arrowHolder.add(coneMesh, stemMesh);
          airflowGroup.add(arrowHolder);
          airflowArrows.push({
            cone: arrowHolder,
            curve,
            speed,
            progress: a / 3,
          });
        }
      };

      if (currentPlatform === 'pc') {
        // 3 Front Intake Streams (Cool Cyan -> Warm Orange/Red out Top AIO Radiator & Rear Exhaust)
        buildAirflowStream(
          [
            [5.2, 2.55, 0.75],
            [2.4, 2.45, 0.65],
            [-0.45, 2.65, 0.55],
            [-0.45, 5.45, 0.65],
          ],
          0x06b6d4,
          0xf97316,
          0.42
        );
        buildAirflowStream(
          [
            [5.2, -0.1, 0.75],
            [1.8, -0.1, 0.85],
            [-1.25, 1.35, 0.45],
            [-4.95, 2.25, 0.55],
          ],
          0x38bdf8,
          0xef4444,
          0.45
        );
        buildAirflowStream(
          [
            [5.2, -2.75, 0.75],
            [1.6, -1.85, 0.95],
            [-1.1, -0.15, 0.95],
            [-4.95, 1.85, 0.65],
          ],
          0x06b6d4,
          0xf97316,
          0.4
        );
      } else if (currentPlatform === 'laptop') {
        // Laptop Bottom Intake -> Dual Centrifugal Blowers -> Rear Fin Exhaust
        buildAirflowStream(
          [
            [-1.85, -0.85, -1.25],
            [-1.85, 0.08, -1.25],
            [-1.65, 0.12, -2.15],
            [-1.65, 0.18, -3.15],
          ],
          0x06b6d4,
          0xef4444,
          0.52
        );
        buildAirflowStream(
          [
            [1.85, -0.85, -1.25],
            [1.85, 0.08, -1.25],
            [1.65, 0.12, -2.15],
            [1.65, 0.18, -3.15],
          ],
          0x06b6d4,
          0xef4444,
          0.52
        );
      } else if (currentPlatform === 'server') {
        // Server Front-to-Rear High-Static-Pressure Wind-Tunnel Airflow
        [-2.1, 0, 2.1].forEach((sx) => {
          buildAirflowStream(
            [
              [sx, 0.58, -5.2],
              [sx, 0.58, -1.65],
              [sx * 0.65, 0.58, 0.25],
              [sx, 0.58, 4.95],
            ],
            0x06b6d4,
            0xef4444,
            0.58
          );
        });
      } else if (currentPlatform === 'smartphone') {
        // Smartphone Passive 2-Phase Vapor Chamber Thermal Spreading (SoC Hotspot -> Vapor Chamber -> Titanium Frame)
        buildAirflowStream(
          [
            [0.66, 0.95, 0.16],
            [0.12, 0.72, 0.18],
            [-0.58, 0.25, 0.18],
            [-1.28, -0.45, 0.12],
          ],
          0xf59e0b,
          0xef4444,
          0.42
        );
        buildAirflowStream(
          [
            [0.66, 0.95, 0.16],
            [0.25, 0.05, 0.18],
            [-0.25, -0.95, 0.18],
            [-0.65, -1.65, 0.14],
          ],
          0x38bdf8,
          0xf97316,
          0.4
        );
        buildAirflowStream(
          [
            [0.66, 0.95, 0.16],
            [0.85, 0.15, 0.12],
            [1.15, -0.65, 0.06],
            [1.32, -1.35, 0.0],
          ],
          0x06b6d4,
          0xf59e0b,
          0.38
        );
      }
      platformRootGroup.add(airflowGroup);

      // =======================================================================
      // BUILD DATA FLOWS FOR ACTIVE PLATFORM
      // =======================================================================
      const dataFlowGroup = new THREE.Group();
      dataFlowGroup.visible = stateRef.current.isDataFlowVisible;
      platformRootGroup.add(dataFlowGroup);

      const flowDefs =
        currentPlatform === 'pc'
          ? FLOW_DEFINITIONS
          : getPlatformFlows(currentPlatform);

      flowDefs.forEach((def) => {
        const vecPoints = def.points.map((pt) => new THREE.Vector3(...pt));
        const curve = new THREE.CatmullRomCurve3(vecPoints);
        const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.028, 8, false);
        const tubeMat = new THREE.MeshBasicMaterial({
          color: def.color,
          transparent: true,
          opacity: 0.35,
        });
        const lineMesh = new THREE.Mesh(tubeGeo, tubeMat);
        lineMesh.userData = { category: def.category, involved: def.involved };
        dataFlowGroup.add(lineMesh);

        for (let i = 0; i < 3; i++) {
          const pulseGeo = new THREE.SphereGeometry(0.085, 12, 12);
          const pulseMat = new THREE.MeshBasicMaterial({ color: def.color });
          const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
          pulseMesh.userData = { category: def.category, involved: def.involved };
          dataFlowGroup.add(pulseMesh);

          activePulses.push({
            mesh: pulseMesh,
            line: lineMesh,
            basePoints: vecPoints,
            curve,
            speed: def.speed,
            progress: i * 0.33,
            dir: def.bidirectional && i % 2 === 1 ? -1 : 1,
            category: def.category,
            involved: def.involved,
          });
        }
      });

      sceneObjectsRef.current.componentGroups = componentGroups;
      sceneObjectsRef.current.interactiveMeshes = interactiveMeshes;
      sceneObjectsRef.current.caseShellMeshes = caseShellMeshes;
      sceneObjectsRef.current.dataFlowGroup = dataFlowGroup;
      sceneObjectsRef.current.cablesGroup = cablesGroup;
      sceneObjectsRef.current.airflowGroup = airflowGroup;
      sceneObjectsRef.current.hddActuatorArm = hddActuatorArm;
      sceneObjectsRef.current.activePulses = activePulses;
      sceneObjectsRef.current.airflowArrows = airflowArrows;
      sceneObjectsRef.current.rotatingFans = rotatingFans;

      updateIsolationVisibility();
      updateCaseOpacity();
      updateVisualHighlights();
      updateDataFlowVisibility();
      updateCablesVisibility();
      updateAirflowVisibility();
    };

    sceneObjectsRef.current.rebuildPlatformScene = rebuildPlatformScene;

    // 5. Highlight, Thermal Map, Isolation & Visibility Helpers
    const getThermalColorHex = (cid: ComponentId): number => {
      const hotParts: ComponentId[] = [
        'cpu',
        'gpu',
        'laptop_cpu',
        'laptop_gpu',
        'server_cpus',
        'server_raid',
        'phone_soc',
        'phone_ram',
      ];
      const warmParts: ComponentId[] = [
        'cpu_cooler',
        'water_cooling',
        'ram',
        'nvme',
        'psu',
        'laptop_heatsink',
        'laptop_ram',
        'laptop_nvme',
        'server_heatsinks',
        'server_ram',
        'server_psus',
        'server_nic',
        'phone_vapor_chamber',
        'phone_modem',
        'phone_qi_coil',
        'phone_cameras',
      ];
      const mildParts: ComponentId[] = [
        'mainboard',
        'hdd',
        'ssd',
        'audio_chip',
        'network_chip',
        'bios_chip',
        'laptop_board',
        'laptop_battery',
        'laptop_wifi',
        'server_board',
        'server_drives',
        'server_bmc',
        'phone_board',
        'phone_storage',
        'phone_battery',
        'phone_usbc',
      ];
      if (hotParts.includes(cid)) return 0xef4444; // 80°C+ Hot Red
      if (warmParts.includes(cid)) return 0xf59e0b; // 62°C Warm Amber
      if (mildParts.includes(cid)) return 0x10b981; // 44°C Mild Emerald
      return 0x06b6d4; // 28°C Cool Intake Cyan
    };

    const updateIsolationVisibility = () => {
      const { isIsolatedView: iso, selectedId: sel } = stateRef.current;
      const isIsolating = Boolean(iso && sel);

      Object.entries(sceneObjectsRef.current.componentGroups).forEach(
        ([cid, grp]) => {
          grp.visible = isIsolating ? cid === sel : true;
        }
      );

      sceneObjectsRef.current.caseShellMeshes.forEach((mesh) => {
        // Keep shell meshes whose parent is a registered component (e.g. laptop_keyboard, server_shroud) synced with their component group
        if (!mesh.userData.componentId) {
          mesh.visible = !isIsolating;
        }
      });
    };

    const updateCaseOpacity = () => {
      const {
        caseOpacity: cOp,
        isIsolatedView: iso,
        selectedId: sel,
      } = stateRef.current;
      sceneObjectsRef.current.caseShellMeshes.forEach((mesh) => {
        // When an interactive shell component (e.g., laptop_keyboard or server_shroud) is isolated, render its layers at full 100% clarity
        const isIsolatedTarget = Boolean(
          iso && sel && mesh.userData.componentId === sel
        );
        const effectiveOp = isIsolatedTarget ? 1 : cOp;

        const baseOp = (mesh.userData.shellOrigOpacity as number) ?? 1;
        const baseTrans = (mesh.userData.shellOrigTransparent as boolean) ?? false;
        const baseDepth = (mesh.userData.shellOrigDepthWrite as boolean) ?? true;
        const targetOp = baseOp * effectiveOp;
        const isTrans = effectiveOp < 0.99 || baseTrans;

        mesh.userData.origOpacity = targetOp;
        mesh.userData.origTransparent = isTrans;

        const applyOp = (mat: THREE.MeshStandardMaterial) => {
          mat.transparent = isTrans;
          mat.opacity = targetOp;
          mat.depthWrite = effectiveOp > 0.85 ? baseDepth : false;
          mat.needsUpdate = true;
        };

        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => applyOp(m as THREE.MeshStandardMaterial));
        } else if (mesh.material) {
          applyOp(mesh.material as THREE.MeshStandardMaterial);
        }
      });
    };

    const updateVisualHighlights = () => {
      const {
        selectedId: sel,
        hoveredId: hov,
        disabledIds: dis,
        highlightedIds: hi,
        bootStepComponentId: bootId,
        isThermalMode: thermal,
      } = stateRef.current;

      sceneObjectsRef.current.interactiveMeshes.forEach((mesh) => {
        const cid = mesh.userData.componentId as ComponentId;
        const isDisabled = dis.includes(cid);

        const applyToMat = (mat: THREE.MeshStandardMaterial) => {
          if (mesh.userData.origColor && mat.color) {
            mat.color.copy(mesh.userData.origColor);
          }

          if (isDisabled) {
            mat.transparent = true;
            mat.opacity = 0.22;
            mat.emissive.setHex(0xf43f5e);
            mat.emissiveIntensity = 0.45;
            return;
          }

          mat.transparent = mesh.userData.origTransparent;
          mat.opacity = mesh.userData.origOpacity;

          if (thermal) {
            const tHex = getThermalColorHex(cid);
            mat.color.setHex(tHex);
            mat.emissive.setHex(tHex);
            mat.emissiveIntensity = cid === sel || cid === hov ? 0.85 : 0.55;
            return;
          }

          if (cid === bootId) {
            mat.emissive.setHex(0x10b981);
            mat.emissiveIntensity = 0.72;
          } else if (cid === hov) {
            mat.emissive.setHex(0x0284c7);
            mat.emissiveIntensity = 0.58;
          } else if (cid === sel) {
            mat.emissive.setHex(0x2563eb);
            mat.emissiveIntensity = 0.42;
          } else if (hi.includes(cid)) {
            mat.emissive.setHex(0x38bdf8);
            mat.emissiveIntensity = 0.35;
          } else {
            mat.emissive.copy(mesh.userData.origEmissive);
            mat.emissiveIntensity = mesh.userData.origEmissiveIntensity;
          }
        };

        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => applyToMat(m as THREE.MeshStandardMaterial));
        } else {
          applyToMat(mesh.material as THREE.MeshStandardMaterial);
        }
      });
    };

    const updateDataFlowVisibility = () => {
      const {
        isDataFlowVisible: visible,
        activeFlowFilter: filter,
        isolatedFlowComponentId: isolatedId,
        disabledIds: dis,
        isIsolatedView: iso,
        selectedId: sel,
      } = stateRef.current;

      const dfGroup = sceneObjectsRef.current.dataFlowGroup;
      if (!dfGroup) return;
      dfGroup.visible = visible && !(iso && sel);
      if (!dfGroup.visible) return;

      dfGroup.children.forEach((child) => {
        const cat = child.userData.category as Exclude<FlowCategory, 'all'>;
        const involved = (child.userData.involved as ComponentId[]) || [];
        const hasDisabledEndpoint = involved.some((id) => dis.includes(id));

        if (hasDisabledEndpoint) {
          child.visible = false;
          return;
        }

        if (isolatedId) {
          child.visible = involved.includes(isolatedId);
        } else if (filter === 'all') {
          child.visible = true;
        } else {
          child.visible = cat === filter;
        }
      });
    };

    const updateCablesVisibility = () => {
      const { isCablesVisible: vis, isIsolatedView: iso, selectedId: sel } =
        stateRef.current;
      if (sceneObjectsRef.current.cablesGroup) {
        sceneObjectsRef.current.cablesGroup.visible = vis && !(iso && sel);
      }
    };

    const updateAirflowVisibility = () => {
      const { isAirflowVisible: vis, isIsolatedView: iso, selectedId: sel } =
        stateRef.current;
      if (sceneObjectsRef.current.airflowGroup) {
        sceneObjectsRef.current.airflowGroup.visible = vis && !(iso && sel);
      }
    };

    sceneObjectsRef.current.updateIsolationVisibility = updateIsolationVisibility;
    sceneObjectsRef.current.updateCaseOpacity = updateCaseOpacity;
    sceneObjectsRef.current.updateVisualHighlights = updateVisualHighlights;
    sceneObjectsRef.current.updateDataFlowVisibility = updateDataFlowVisibility;
    sceneObjectsRef.current.updateCablesVisibility = updateCablesVisibility;
    sceneObjectsRef.current.updateAirflowVisibility = updateAirflowVisibility;

    // Initial build
    rebuildPlatformScene();

    // 6. Raycasting & Interaction (with X-Ray click-through when caseOpacity < 0.85)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let lastRaycastTime = 0;
    let pointerDownPos = { x: 0, y: 0 };
    let currentHover: ComponentId | null = null;

    const pickInteractiveHit = (intersects: THREE.Intersection[]) => {
      const visibleHits = intersects.filter((hit) => {
        let obj: THREE.Object3D | null = hit.object;
        while (obj) {
          if (!obj.visible) return false;
          obj = obj.parent;
        }
        return true;
      });
      if (visibleHits.length === 0) return null;

      const { caseOpacity: cOp, explodeFactor: expF } = stateRef.current;
      if (cOp < 0.85 && expF < 0.35) {
        const internalHit = visibleHits.find(
          (hit) =>
            hit.object.userData.componentId !== 'laptop_keyboard' &&
            hit.object.userData.componentId !== 'server_shroud' &&
            hit.object.userData.componentId !== 'phone_display'
        );
        if (internalHit) return internalHit;
      }
      return visibleHits[0];
    };

    const handlePointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastRaycastTime < 32) return;
      lastRaycastTime = now;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(
        sceneObjectsRef.current.interactiveMeshes,
        false
      );

      const bestHit = pickInteractiveHit(intersects);
      if (bestHit) {
        renderer.domElement.style.cursor = 'pointer';
        const hitId = bestHit.object.userData.componentId as ComponentId;
        currentHover = hitId;
        callbacksRef.current.onHoverComponent(hitId, e.clientX, e.clientY);
      } else {
        renderer.domElement.style.cursor = 'grab';
        if (currentHover !== null) {
          currentHover = null;
          callbacksRef.current.onHoverComponent(null, e.clientX, e.clientY);
        }
      }
    };

    let lastTouchTapTime = 0;
    let lastTouchTapPos = { x: 0, y: 0 };

    const raycastComponentAt = (clientX: number, clientY: number): ComponentId | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(
        sceneObjectsRef.current.interactiveMeshes,
        false
      );
      const bestHit = pickInteractiveHit(intersects);
      return bestHit
        ? (bestHit.object.userData.componentId as ComponentId)
        : null;
    };

    const handlePointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(
        e.clientX - pointerDownPos.x,
        e.clientY - pointerDownPos.y
      );
      if (dist < 6) {
        const hitId = raycastComponentAt(e.clientX, e.clientY);
        if (hitId) {
          callbacksRef.current.onSelectComponent(hitId);
        }

        // Touch double-tap detection for mobile & tablet devices
        if (e.pointerType === 'touch') {
          const now = performance.now();
          const tapDist = Math.hypot(
            e.clientX - lastTouchTapPos.x,
            e.clientY - lastTouchTapPos.y
          );
          if (now - lastTouchTapTime < 320 && tapDist < 28) {
            lastTouchTapTime = 0;
            callbacksRef.current.onDoubleClickComponent(hitId);
          } else {
            lastTouchTapTime = now;
            lastTouchTapPos = { x: e.clientX, y: e.clientY };
          }
        }
      }
    };

    const handleDoubleClick = (e: MouseEvent) => {
      const hitId = raycastComponentAt(e.clientX, e.clientY);
      callbacksRef.current.onDoubleClickComponent(hitId);
    };

    const handlePointerLeave = () => {
      currentHover = null;
      callbacksRef.current.onHoverComponent(null, 0, 0);
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('pointermove', handlePointerMove);
    domElem.addEventListener('pointerdown', handlePointerDown);
    domElem.addEventListener('pointerup', handlePointerUp);
    domElem.addEventListener('dblclick', handleDoubleClick);
    domElem.addEventListener('pointerleave', handlePointerLeave);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 7. Animation Loop
    const clock = new THREE.Clock();
    const _targetVec = new THREE.Vector3();
    const _tangentVec = new THREE.Vector3();
    const _projVec = new THREE.Vector3();
    let elapsedTotal = 0;
    let frameId = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (sync && state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const dt = Math.min(clock.getDelta(), 0.1);
      elapsedTotal += dt;
      const {
        explodeFactor: expFactor,
        disabledIds: dis,
        selectedId: sel,
        isPinsVisible: pinsVis,
        isSubPinsVisible: subPinsVis,
        isIsolatedView: isoView,
      } = stateRef.current;

      // Animate multi-blade fans & open HDD platters across all platforms
      const fans = sceneObjectsRef.current.rotatingFans;
      for (let i = 0; i < fans.length; i++) {
        const f = fans[i];
        if (!dis.includes(f.ownerId)) {
          if (f.axis === 'x') f.mesh.rotation.x -= dt * f.speed;
          else if (f.axis === 'y') f.mesh.rotation.y -= dt * f.speed;
          else f.mesh.rotation.z -= dt * f.speed;
        }
      }

      // Animate Open HDD Voice-Coil Read/Write Actuator Arm (sweeps faster when HDD is selected!)
      const hddArm = sceneObjectsRef.current.hddActuatorArm;
      if (hddArm && !dis.includes('hdd')) {
        const seekFreq = sel === 'hdd' ? 9.5 : 3.8;
        const seekAmp = sel === 'hdd' ? 0.34 : 0.22;
        hddArm.rotation.y =
          Math.sin(elapsedTotal * seekFreq) * seekAmp +
          Math.cos(elapsedTotal * seekFreq * 1.7) * (seekAmp * 0.4);
      }

      // Exploded View Lerping (Whole-System vs. Single-Part Sub-Component Explosion in 360° Isolation Mode)
      const groups = Object.values(sceneObjectsRef.current.componentGroups);
      for (let i = 0; i < groups.length; i++) {
        const g = groups[i];
        const cid = g.userData.componentId as ComponentId;
        const basePos = g.userData.basePosition as THREE.Vector3;
        const expPos = g.userData.explodedPosition as THREE.Vector3;

        if (basePos && expPos) {
          if (isoView && sel) {
            // In 360° Isolation Mode, keep the isolated component centered at its base position
            _targetVec.copy(basePos);
          } else {
            _targetVec.lerpVectors(basePos, expPos, expFactor);
          }
          g.position.x = THREE.MathUtils.damp(g.position.x, _targetVec.x, 8, dt);
          g.position.y = THREE.MathUtils.damp(g.position.y, _targetVec.y, 8, dt);
          g.position.z = THREE.MathUtils.damp(g.position.z, _targetVec.z, 8, dt);
        }

        // Sub-Component Layer Explosion when this part is isolated in 360° Focus Mode
        const subLayers = (g.userData.subLayerObjects as THREE.Object3D[]) || [];
        const subFactor = isoView && sel === cid ? expFactor : 0;
        for (let s = 0; s < subLayers.length; s++) {
          const subObj = subLayers[s];
          const subBase = subObj.userData.subBasePos as THREE.Vector3;
          const subOff = subObj.userData.subExplodeOffset as THREE.Vector3;
          if (subBase && subOff) {
            const tx = subBase.x + subOff.x * subFactor;
            const ty = subBase.y + subOff.y * subFactor;
            const tz = subBase.z + subOff.z * subFactor;
            subObj.position.x = THREE.MathUtils.damp(subObj.position.x, tx, 8, dt);
            subObj.position.y = THREE.MathUtils.damp(subObj.position.y, ty, 8, dt);
            subObj.position.z = THREE.MathUtils.damp(subObj.position.z, tz, 8, dt);
          }
        }
      }

      // Animate 3D Airflow Arrows along streamlines
      const afGroup = sceneObjectsRef.current.airflowGroup;
      if (afGroup && afGroup.visible) {
        const arrows = sceneObjectsRef.current.airflowArrows;
        for (let i = 0; i < arrows.length; i++) {
          const ar = arrows[i];
          ar.progress = (ar.progress + ar.speed * dt) % 1;
          ar.curve.getPointAt(ar.progress, _targetVec);
          ar.curve.getTangentAt(ar.progress, _tangentVec);
          ar.cone.position.copy(_targetVec);
          ar.cone.lookAt(_targetVec.clone().add(_tangentVec));
        }
      }

      // Animate Data Flows
      const pulses = sceneObjectsRef.current.activePulses;
      const dfGroup = sceneObjectsRef.current.dataFlowGroup;
      if (dfGroup && dfGroup.visible) {
        for (let i = 0; i < pulses.length; i++) {
          const p = pulses[i];
          if (!p.mesh.visible) continue;
          p.progress += p.speed * dt * p.dir;
          if (p.progress > 1) p.progress -= 1;
          if (p.progress < 0) p.progress += 1;
          p.curve.getPointAt(p.progress, _targetVec);
          _targetVec.y += expFactor * 0.8;
          p.mesh.position.copy(_targetVec);
          p.line.position.y = expFactor * 0.8;
        }
      }

      // Camera Lerping
      if (camGoalPos && camGoalTarget) {
        camera.position.x = THREE.MathUtils.damp(camera.position.x, camGoalPos.x, 6, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, camGoalPos.y, 6, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, camGoalPos.z, 6, dt);

        controls.target.x = THREE.MathUtils.damp(controls.target.x, camGoalTarget.x, 6, dt);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, camGoalTarget.y, 6, dt);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, camGoalTarget.z, 6, dt);

        if (
          camera.position.distanceToSquared(camGoalPos) < 0.01 &&
          controls.target.distanceToSquared(camGoalTarget) < 0.01
        ) {
          camGoalPos = null;
          camGoalTarget = null;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      // Project 3D Callout Pins to 2D Screen Overlay (Feature 9)
      if (pinsVis && container) {
        const w = container.clientWidth;
        const h = container.clientHeight;
        Object.entries(sceneObjectsRef.current.componentGroups).forEach(
          ([cid, grp]) => {
            const btn = pinElementsRef.current[cid];
            if (!btn) return;
            if (!grp.visible || (isoView && sel && expFactor > 0.12)) {
              btn.style.opacity = '0';
              btn.style.pointerEvents = 'none';
              return;
            }
            _projVec.copy(grp.position).project(camera);
            if (_projVec.z > 1) {
              btn.style.opacity = '0';
              btn.style.pointerEvents = 'none';
              return;
            }
            const sx = (_projVec.x * 0.5 + 0.5) * w;
            const sy = (-_projVec.y * 0.5 + 0.5) * h;
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
            btn.style.transform = `translate3d(${sx}px, ${sy}px, 0) translate(-50%, -50%)`;
          }
        );
      }

      // Project 3D Sub-Component Anatomy Labels when Isolated & Exploded (toggleable via isSubPinsVisible)
      if (container) {
        const showSubLabels = Boolean(
          subPinsVis && isoView && sel && expFactor > 0.12
        );
        const activeGrp = sel
          ? sceneObjectsRef.current.componentGroups[sel]
          : undefined;
        const w = container.clientWidth;
        const h = container.clientHeight;

        const labeledByKey: Record<string, THREE.Object3D> = {};
        if (showSubLabels && activeGrp) {
          const subs = (activeGrp.userData.subLayerObjects as THREE.Object3D[]) || [];
          for (let s = 0; s < subs.length; s++) {
            const k = subs[s].userData.subLayerKey as string | undefined;
            if (k && !labeledByKey[k]) {
              labeledByKey[k] = subs[s];
            }
          }
        }

        const activeScreenLabels: {
          el: HTMLDivElement;
          sx: number;
          sy: number;
        }[] = [];

        Object.entries(subLayerElementsRef.current).forEach(([key, el]) => {
          if (!el) return;
          const targetObj = labeledByKey[key];
          if (!showSubLabels || !targetObj) {
            el.style.opacity = '0';
            return;
          }
          targetObj.getWorldPosition(_projVec);
          _projVec.project(camera);
          if (_projVec.z > 1) {
            el.style.opacity = '0';
            return;
          }
          const sx = (_projVec.x * 0.5 + 0.5) * w;
          const sy = (-_projVec.y * 0.5 + 0.5) * h;
          activeScreenLabels.push({ el, sx, sy });
        });

        // Vertical anti-collision spacing pass so stacked sub-layer labels never overlap on screen
        if (activeScreenLabels.length > 1) {
          activeScreenLabels.sort((a, b) => a.sy - b.sy);
          const minVerticalGap = 28;
          for (let i = 1; i < activeScreenLabels.length; i++) {
            const prev = activeScreenLabels[i - 1];
            const curr = activeScreenLabels[i];
            if (
              Math.abs(curr.sx - prev.sx) < 170 &&
              curr.sy - prev.sy < minVerticalGap
            ) {
              curr.sy = prev.sy + minVerticalGap;
            }
          }
        }

        for (let i = 0; i < activeScreenLabels.length; i++) {
          const item = activeScreenLabels[i];
          item.el.style.opacity = '1';
          item.el.style.transform = `translate3d(${item.sx}px, ${item.sy}px, 0) translate(-50%, -50%)`;
        }
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      domElem.removeEventListener('pointermove', handlePointerMove);
      domElem.removeEventListener('pointerdown', handlePointerDown);
      domElem.removeEventListener('pointerup', handlePointerUp);
      domElem.removeEventListener('dblclick', handleDoubleClick);
      domElem.removeEventListener('pointerleave', handlePointerLeave);
      atlas.disposeAll();
      controls.dispose();
      renderer.dispose();
      if (container.contains(domElem)) {
        container.removeChild(domElem);
      }
    };
  }, []);

  const localizedSubLabels = SUB_LAYER_LABELS[locale] || SUB_LAYER_LABELS.de;

  return (
    <div className="w-full h-full relative select-none overflow-hidden">
      <div
        ref={mountRef}
        className="w-full h-full relative select-none"
        aria-label="3D Hardware Explorer Canvas"
      />

      {/* 3D CALLOUT PINS OVERLAY (Feature 9) */}
      {isPinsVisible && (
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
          {localizedPinItems.map((pin) => {
            const isSelected = selectedId === pin.id;
            const isDisabled = disabledIds.includes(pin.id);
            return (
              <button
                key={pin.id}
                ref={(el) => {
                  pinElementsRef.current[pin.id] = el;
                }}
                type="button"
                onClick={() => onSelectComponent(pin.id)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onDoubleClickComponent(pin.id);
                }}
                style={{ opacity: 0 }}
                className={`absolute top-0 left-0 px-2 py-0.5 rounded-md text-[11px] font-semibold shadow-lg border backdrop-blur-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-300 z-20 ring-2 ring-blue-400/50'
                    : isDisabled
                    ? 'bg-rose-950/90 text-rose-200 border-rose-500/60'
                    : 'bg-slate-900/85 text-slate-100 border-slate-700 hover:border-cyan-400 hover:bg-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                <span className="font-mono text-[10px] opacity-75">
                  {String(pin.index).padStart(2, '0')}
                </span>
                <span>{pin.shortName}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 3D SUB-COMPONENT ANATOMY CALLOUT OVERLAY (Visible when Isolated + Exploded & isSubPinsVisible is on) */}
      <div
        className={`pointer-events-none absolute inset-0 z-20 overflow-hidden transition-opacity duration-150 ${
          isSubPinsVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {Object.entries(localizedSubLabels).map(([key, labelText]) => (
          <div
            key={key}
            ref={(el) => {
              subLayerElementsRef.current[key] = el;
            }}
            style={{ opacity: 0 }}
            className="absolute top-0 left-0 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-950/90 text-cyan-100 border border-cyan-400/70 shadow-xl backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap transition-opacity duration-150"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24] shrink-0" />
            <span>{labelText}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
