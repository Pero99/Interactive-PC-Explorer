import * as THREE from 'three';

export interface HardwareTextureAtlas {
  mainboardAlbedo: THREE.CanvasTexture;
  mainboardBump: THREE.CanvasTexture;
  cpuIhs: THREE.CanvasTexture;
  cpuSubstrate: THREE.CanvasTexture;
  aioPumpDisplay: THREE.CanvasTexture;
  radiatorSidePlate: THREE.CanvasTexture;
  heatsinkFinsAlbedo: THREE.CanvasTexture;
  heatsinkFinsBump: THREE.CanvasTexture;
  ramHeatspreader: THREE.CanvasTexture;
  gpuBackplate: THREE.CanvasTexture;
  gpuShroud: THREE.CanvasTexture;
  psuSideLabel: THREE.CanvasTexture;
  psuModularPanel: THREE.CanvasTexture;
  nvmeLabel: THREE.CanvasTexture;
  sataSsdTop: THREE.CanvasTexture;
  hddTopCover: THREE.CanvasTexture;
  cmosBatteryTop: THREE.CanvasTexture;
  biosChipTop: THREE.CanvasTexture;
  audioChipTop: THREE.CanvasTexture;
  networkChipTop: THREE.CanvasTexture;
  fanHubSticker: THREE.CanvasTexture;
  braidedCableDark: THREE.CanvasTexture;
  braidedCableCyan: THREE.CanvasTexture;
  braidedCableAmber: THREE.CanvasTexture;
  braidedCablePurple: THREE.CanvasTexture;
  laptopBoardAlbedo: THREE.CanvasTexture;
  laptopBatteryTop: THREE.CanvasTexture;
  laptopKeyboardTop: THREE.CanvasTexture;
  laptopScreenDisplay: THREE.CanvasTexture;
  serverBoardAlbedo: THREE.CanvasTexture;
  serverPsuLabel: THREE.CanvasTexture;
  serverDriveCaddyFront: THREE.CanvasTexture;
  serverCpuIhs: THREE.CanvasTexture;
  argbFanDisc: THREE.CanvasTexture;
  ramRgbLightbar: THREE.CanvasTexture;
  gpuSideBadge: THREE.CanvasTexture;
  dustFilterMesh: THREE.CanvasTexture;
  thermalPastePattern: THREE.CanvasTexture;
  argbControllerHubTop: THREE.CanvasTexture;
  gpuPcbTraces: THREE.CanvasTexture;
  carbonFiberWeave: THREE.CanvasTexture;
  brushedGunmetal: THREE.CanvasTexture;
  phoneBoardAlbedo: THREE.CanvasTexture;
  phoneSocTop: THREE.CanvasTexture;
  phoneBatteryTop: THREE.CanvasTexture;
  phoneDisplayScreen: THREE.CanvasTexture;
  phoneQiCoilTop: THREE.CanvasTexture;
  phoneCameraIsland: THREE.CanvasTexture;
  disposeAll: () => void;
}

function finalizeColorTexture(
  canvas: HTMLCanvasElement,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

function finalizeDataTexture(
  canvas: HTMLCanvasElement,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

// Helper: Draw realistic 2x2 Twill Carbon Fiber Weave into a 2D Canvas Region
function drawCarbonWeavePattern(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  cellSize = 8
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  ctx.fillStyle = '#090c12';
  ctx.fillRect(x, y, w, h);

  for (let py = y; py < y + h; py += cellSize) {
    for (let px = x; px < x + w; px += cellSize) {
      const step = ((Math.floor((px - x) / cellSize) + Math.floor((py - y) / cellSize)) % 4);
      ctx.fillStyle =
        step === 0
          ? '#1e2633'
          : step === 1
          ? '#141a24'
          : step === 2
          ? '#0b0f17'
          : '#252f3f';
      ctx.fillRect(px, py, cellSize - 0.5, cellSize - 0.5);

      // Specular carbon filament highlight
      if (step === 0 || step === 3) {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.14)';
        ctx.fillRect(px + 1, py + 1, cellSize - 3, 2);
      }
    }
  }
  ctx.restore();
}

// Helper: Draw fine horizontal brushed anodized gunmetal grain
function drawBrushedMetalGrain(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  baseStops: [string, string, string] = ['#161d29', '#253042', '#111722']
) {
  ctx.save();
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, baseStops[0]);
  grad.addColorStop(0.5, baseStops[1]);
  grad.addColorStop(1, baseStops[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  for (let ly = y; ly < y + h; ly += 2) {
    const alpha = ((ly * 17) % 9) * 0.012 + 0.02;
    ctx.strokeStyle =
      ly % 4 === 0
        ? `rgba(226, 232, 240, ${alpha})`
        : `rgba(2, 6, 23, ${alpha * 1.4})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, ly);
    ctx.lineTo(x + w, ly);
    ctx.stroke();
  }
  ctx.restore();
}

export function createHardwareTextureAtlas(
  maxAnisotropy: number
): HardwareTextureAtlas {
  const allTextures: THREE.CanvasTexture[] = [];

  const registerColor = (c: HTMLCanvasElement) => {
    const t = finalizeColorTexture(c, maxAnisotropy);
    allTextures.push(t);
    return t;
  };

  const registerData = (c: HTMLCanvasElement) => {
    const t = finalizeDataTexture(c, maxAnisotropy);
    allTextures.push(t);
    return t;
  };

  // =========================================================================
  // 0. DEDICATED TILEABLE CARBON FIBER WEAVE & BRUSHED GUNMETAL MAPS
  // =========================================================================
  const carbonCanvas = document.createElement('canvas');
  carbonCanvas.width = 256;
  carbonCanvas.height = 256;
  const cWeaveCtx = carbonCanvas.getContext('2d')!;
  drawCarbonWeavePattern(cWeaveCtx, 0, 0, 256, 256, 8);
  const carbonFiberWeave = registerColor(carbonCanvas);
  carbonFiberWeave.wrapS = THREE.RepeatWrapping;
  carbonFiberWeave.wrapT = THREE.RepeatWrapping;
  carbonFiberWeave.repeat.set(4, 4);

  const gunmetalCanvas = document.createElement('canvas');
  gunmetalCanvas.width = 512;
  gunmetalCanvas.height = 512;
  const gmCtx = gunmetalCanvas.getContext('2d')!;
  drawBrushedMetalGrain(gmCtx, 0, 0, 512, 512, ['#18202c', '#2b374b', '#121822']);
  const brushedGunmetal = registerColor(gunmetalCanvas);
  brushedGunmetal.wrapS = THREE.RepeatWrapping;
  brushedGunmetal.wrapT = THREE.RepeatWrapping;

  // =========================================================================
  // 1. MAINBOARD PCB ALBEDO & BUMP (1024x1024 - ROG MAXIMUS / MSI MEG STEALTH)
  // =========================================================================
  const mbCanvas = document.createElement('canvas');
  mbCanvas.width = 1024;
  mbCanvas.height = 1024;
  const mctx = mbCanvas.getContext('2d')!;

  const mbBumpCanvas = document.createElement('canvas');
  mbBumpCanvas.width = 1024;
  mbBumpCanvas.height = 1024;
  const bctx = mbBumpCanvas.getContext('2d')!;

  // Matte-black multi-layer High-TG PCB base
  mctx.fillStyle = '#070a10';
  mctx.fillRect(0, 0, 1024, 1024);
  bctx.fillStyle = '#383838';
  bctx.fillRect(0, 0, 1024, 1024);

  mctx.fillStyle = '#0c111b';
  mctx.fillRect(32, 32, 960, 960);

  // Subtle carbon-fiber armor inlay panels on PCH & M.2 shield zones
  drawCarbonWeavePattern(mctx, 520, 580, 320, 260, 6);
  drawCarbonWeavePattern(mctx, 60, 120, 210, 420, 6);

  // Diagonal ROG / AORUS style cyber-stencil armor lines across PCB
  mctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
  mctx.lineWidth = 3;
  for (let i = -200; i < 1024; i += 44) {
    mctx.beginPath();
    mctx.moveTo(i, 1024);
    mctx.lineTo(i + 360, 664);
    mctx.stroke();
  }

  const drawBusLines = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    lines: number,
    spacing: number,
    color: string
  ) => {
    mctx.strokeStyle = color;
    mctx.lineWidth = 2.2;
    bctx.strokeStyle = '#b8b8b8';
    bctx.lineWidth = 2.4;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const isHorizontal = Math.abs(dx) > Math.abs(dy);

    for (let i = 0; i < lines; i++) {
      const offset = (i - lines / 2) * spacing;
      mctx.beginPath();
      bctx.beginPath();
      if (isHorizontal) {
        mctx.moveTo(x1, y1 + offset);
        mctx.lineTo(x1 + dx * 0.5, y1 + offset);
        mctx.lineTo(x2, y2 + offset);

        bctx.moveTo(x1, y1 + offset);
        bctx.lineTo(x1 + dx * 0.5, y1 + offset);
        bctx.lineTo(x2, y2 + offset);
      } else {
        mctx.moveTo(x1 + offset, y1);
        mctx.lineTo(x1 + offset, y1 + dy * 0.5);
        mctx.lineTo(x2 + offset, y2);

        bctx.moveTo(x1 + offset, y1);
        bctx.lineTo(x1 + offset, y1 + dy * 0.5);
        bctx.lineTo(x2 + offset, y2);
      }
      mctx.stroke();
      bctx.stroke();
    }
  };

  // High-contrast exposed immersion-gold & copper signal buses (DDR5, PCIe 5.0, DMI)
  drawBusLines(460, 260, 695, 260, 32, 4.2, '#eab308');
  drawBusLines(420, 315, 420, 675, 34, 4.2, '#d97706');
  drawBusLines(700, 680, 910, 745, 22, 4.2, '#f59e0b');
  drawBusLines(640, 720, 180, 825, 20, 4.8, '#d97706');
  drawBusLines(280, 210, 445, 210, 22, 4.0, '#fbbf24');
  drawBusLines(490, 560, 835, 560, 24, 4.2, '#ca8a04');

  // Fine copper differential serpentine trace pairs & golden via pads across the PCB
  mctx.lineWidth = 1.8;
  for (let i = 0; i < 280; i++) {
    const sx = ((i * 97) % 940) + 42;
    const sy = ((i * 61) % 940) + 42;
    mctx.strokeStyle =
      i % 3 === 0 ? '#f59e0b' : i % 2 === 0 ? '#334155' : '#d97706';
    mctx.beginPath();
    mctx.moveTo(sx, sy);
    mctx.lineTo(sx + 32, sy);
    mctx.lineTo(sx + 50, sy + 18);
    mctx.lineTo(sx + 76, sy + 18);
    mctx.stroke();

    bctx.strokeStyle = '#9e9e9e';
    bctx.lineWidth = 1.8;
    bctx.beginPath();
    bctx.moveTo(sx, sy);
    bctx.lineTo(sx + 32, sy);
    bctx.lineTo(sx + 50, sy + 18);
    bctx.lineTo(sx + 76, sy + 18);
    bctx.stroke();

    // Gold plated via hole with dark drill center
    mctx.fillStyle = '#fbbf24';
    mctx.beginPath();
    mctx.arc(sx + 76, sy + 18, 3.4, 0, Math.PI * 2);
    mctx.fill();
    mctx.fillStyle = '#020617';
    mctx.beginPath();
    mctx.arc(sx + 76, sy + 18, 1.4, 0, Math.PI * 2);
    mctx.fill();
  }

  // Dense SMD MLCC ceramic capacitor arrays around socket & VRM perimeter
  for (let sx = 320; sx <= 520; sx += 14) {
    for (let sy = 240; sy <= 360; sy += 16) {
      if (sx > 365 && sx < 475 && sy > 265 && sy < 335) continue;
      mctx.fillStyle = '#d97706';
      mctx.fillRect(sx, sy, 8, 5);
      mctx.fillStyle = '#e2e8f0';
      mctx.fillRect(sx, sy, 2, 5);
      mctx.fillRect(sx + 6, sy, 2, 5);
    }
  }

  // EMI isolated gold audio line
  mctx.strokeStyle = '#fbbf24';
  mctx.lineWidth = 5;
  mctx.beginPath();
  mctx.moveTo(0, 740);
  mctx.lineTo(190, 740);
  mctx.lineTo(230, 780);
  mctx.lineTo(230, 1024);
  mctx.stroke();

  const standoffCoords = [
    [55, 55],
    [512, 55],
    [965, 55],
    [55, 512],
    [512, 512],
    [965, 512],
    [55, 965],
    [512, 965],
    [965, 965],
  ];
  standoffCoords.forEach(([hx, hy]) => {
    mctx.strokeStyle = '#fbbf24';
    mctx.lineWidth = 4.5;
    mctx.beginPath();
    mctx.arc(hx, hy, 19, 0, Math.PI * 2);
    mctx.stroke();

    mctx.fillStyle = '#020617';
    mctx.beginPath();
    mctx.arc(hx, hy, 10, 0, Math.PI * 2);
    mctx.fill();

    for (let a = 0; a < 8; a++) {
      const ang = (a / 8) * Math.PI * 2;
      mctx.fillStyle = '#f59e0b';
      mctx.beginPath();
      mctx.arc(
        hx + Math.cos(ang) * 24,
        hy + Math.sin(ang) * 24,
        3.2,
        0,
        Math.PI * 2
      );
      mctx.fill();
    }
  });

  // High-contrast white/silver factory silkscreen markings
  mctx.fillStyle = '#f1f5f9';
  mctx.font = 'bold 17px monospace';
  mctx.fillText('ROG MAXIMUS // MEG DARK HERO Z890/X870E', 285, 95);
  mctx.fillStyle = 'rgba(226, 232, 240, 0.88)';
  mctx.font = 'bold 16px monospace';
  mctx.fillText('SOCKET AM5 / LGA1851', 338, 165);
  mctx.fillText('DDR5-8400+ DUAL CHANNEL', 625, 130);
  mctx.fillText('DIMM_A1  A2  B1  B2', 640, 152);
  mctx.fillText('LAN_2.5G_I226V', 52, 435);
  mctx.fillText('M.2_1 (PCIe 5.0 x4)', 325, 445);
  mctx.fillText('PCIEX16_1 (GEN5 SAFE-SLOT)', 210, 560);
  mctx.fillText('BAT_CR2032', 205, 695);
  mctx.fillText('PCIEX16_2 (CHIPSET)', 210, 765);
  mctx.fillText('PCIEX4_1', 210, 885);
  mctx.fillText('BIOS_256M_SPI', 575, 845);
  mctx.fillText('ATX_PWR_24PIN', 830, 385);
  mctx.fillText('SATA6G_1..4', 825, 760);
  mctx.fillText('F_PANEL / USB3.2_GEN2x2', 630, 955);
  mctx.fillText('SUPREMEFX_AUDIO_ISOLATED', 35, 965);

  // Top-right "A0" / "88" Q-Code Diagnostic LED readout + Start/FlexKey onboard buttons
  mctx.fillStyle = '#020617';
  mctx.fillRect(850, 46, 82, 48);
  mctx.strokeStyle = '#94a3b8';
  mctx.lineWidth = 2.5;
  mctx.strokeRect(850, 46, 82, 48);
  mctx.fillStyle = '#ef4444';
  mctx.font = 'bold 31px monospace';
  mctx.fillText('A0', 872, 81);

  // Vertical row of silver polymer capacitors along top-right edge
  for (let cy = 112; cy <= 212; cy += 25) {
    mctx.fillStyle = '#e2e8f0';
    mctx.beginPath();
    mctx.arc(905, cy, 9.5, 0, Math.PI * 2);
    mctx.fill();
    mctx.strokeStyle = '#475569';
    mctx.lineWidth = 2;
    mctx.stroke();
  }

  const mainboardAlbedo = registerColor(mbCanvas);
  const mainboardBump = registerData(mbBumpCanvas);

  // =========================================================================
  // 2. CPU IHS LASER-ETCHED NICKEL TEXTURE (512x512)
  // =========================================================================
  const cpuCanvas = document.createElement('canvas');
  cpuCanvas.width = 512;
  cpuCanvas.height = 512;
  const cctx = cpuCanvas.getContext('2d')!;

  drawBrushedMetalGrain(cctx, 0, 0, 512, 512, ['#cbd5e1', '#f1f5f9', '#94a3b8']);

  cctx.strokeStyle = '#475569';
  cctx.lineWidth = 14;
  cctx.strokeRect(22, 22, 468, 468);

  cctx.fillStyle = '#1e293b';
  cctx.font = 'bold 26px sans-serif';
  cctx.fillText('AMD RYZEN // INTEL CORE', 65, 118);
  cctx.fillStyle = '#090d16';
  cctx.font = 'bold 42px monospace';
  cctx.fillText('9950X3D / 285K', 65, 172);

  cctx.fillStyle = '#334155';
  cctx.font = 'bold 20px monospace';
  cctx.fillText('16-CORE · 32-THREAD · 5.7GHz', 65, 218);
  cctx.font = 'bold 16px monospace';
  cctx.fillText('SN: 948274-STEALTH-2026', 65, 260);
  cctx.fillText('DIFFUSED IN USA / TAIWAN', 65, 288);
  cctx.fillText('L3 CACHE: 128MB 3D V-CACHE', 65, 316);

  // Precision 2D DataMatrix laser code
  cctx.fillStyle = '#0f172a';
  for (let qx = 0; qx < 12; qx++) {
    for (let qy = 0; qy < 12; qy++) {
      if ((qx * 7 + qy * 13) % 3 !== 0 || qx === 0 || qy === 11) {
        cctx.fillRect(345 + qx * 8, 340 + qy * 8, 7, 7);
      }
    }
  }

  const cpuIhs = registerColor(cpuCanvas);

  // =========================================================================
  // 3. CPU FIBERGLASS SUBSTRATE + GOLD SMD CAPACITORS (512x512)
  // =========================================================================
  const subCanvas = document.createElement('canvas');
  subCanvas.width = 512;
  subCanvas.height = 512;
  const sctx = subCanvas.getContext('2d')!;

  sctx.fillStyle = '#064e3b';
  sctx.fillRect(0, 0, 512, 512);
  sctx.strokeStyle = '#047857';
  sctx.lineWidth = 8;
  sctx.strokeRect(8, 8, 496, 496);

  // Pin-1 Gold Orientation Triangle
  sctx.fillStyle = '#fbbf24';
  sctx.beginPath();
  sctx.moveTo(14, 498);
  sctx.lineTo(76, 498);
  sctx.lineTo(14, 436);
  sctx.closePath();
  sctx.fill();

  // Perimeter gold SMD decoupling capacitors
  for (let i = 56; i < 456; i += 24) {
    sctx.fillStyle = '#d97706';
    sctx.fillRect(i, 20, 16, 10);
    sctx.fillRect(i, 482, 16, 10);
    sctx.fillRect(20, i, 10, 16);
    sctx.fillRect(482, i, 10, 16);
    sctx.fillStyle = '#fde047';
    sctx.fillRect(i, 20, 4, 10);
    sctx.fillRect(i + 12, 20, 4, 10);
  }

  const cpuSubstrate = registerColor(subCanvas);

  // =========================================================================
  // 4. AIO PUMP INFINITY MIRROR & STEALTH CARBON CAP TEXTURE (512x512)
  // =========================================================================
  const pumpCanvas = document.createElement('canvas');
  pumpCanvas.width = 512;
  pumpCanvas.height = 512;
  const pctx = pumpCanvas.getContext('2d')!;

  drawCarbonWeavePattern(pctx, 0, 0, 512, 512, 8);

  // Deep abyssal dark center mirror
  const mirrorGrad = pctx.createRadialGradient(256, 256, 10, 256, 256, 228);
  mirrorGrad.addColorStop(0, '#030712');
  mirrorGrad.addColorStop(0.7, '#090f1d');
  mirrorGrad.addColorStop(1, '#111827');
  pctx.fillStyle = mirrorGrad;
  pctx.beginPath();
  pctx.arc(256, 256, 232, 0, Math.PI * 2);
  pctx.fill();

  const rainbowStops = [
    '#06b6d4', // Electric Cyan
    '#3b82f6', // Cobalt Blue
    '#8b5cf6', // Violet
    '#ec4899', // Magenta
    '#f59e0b', // Amber Gold
    '#10b981', // Emerald
    '#06b6d4',
  ];

  // Concentric infinity mirror rings
  const ringRadii = [
    { r: 224, w: 16, alpha: 1.0 },
    { r: 198, w: 8, alpha: 0.78 },
    { r: 176, w: 5, alpha: 0.52 },
    { r: 158, w: 3, alpha: 0.3 },
  ];

  ringRadii.forEach(({ r, w, alpha }) => {
    const segs = 120;
    for (let s = 0; s < segs; s++) {
      const a0 = (s / segs) * Math.PI * 2;
      const a1 = ((s + 1.4) / segs) * Math.PI * 2;
      const t = s / segs;
      const stopIdx = Math.floor(t * (rainbowStops.length - 1));
      pctx.strokeStyle = rainbowStops[stopIdx];
      pctx.globalAlpha = alpha;
      pctx.lineWidth = w;
      pctx.beginPath();
      pctx.arc(256, 256, r, a0, a1);
      pctx.stroke();
    }
  });
  pctx.globalAlpha = 1.0;

  // Center digital telemetry & ROG/Corsair style emblem
  pctx.fillStyle = '#f8fafc';
  pctx.font = 'bold 46px monospace';
  pctx.textAlign = 'center';
  pctx.fillText('34°C', 256, 252);
  pctx.fillStyle = '#38bdf8';
  pctx.font = 'bold 17px monospace';
  pctx.fillText('LIQUID · 2850 RPM', 256, 286);
  pctx.textAlign = 'left';

  const aioPumpDisplay = registerColor(pumpCanvas);

  // =========================================================================
  // 4B. AIO RADIATOR SIDE PLATE BRANDING TEXTURE (1024x160 - GUNMETAL & CARBON)
  // =========================================================================
  const radSideCanvas = document.createElement('canvas');
  radSideCanvas.width = 1024;
  radSideCanvas.height = 160;
  const rsctx = radSideCanvas.getContext('2d')!;

  drawBrushedMetalGrain(rsctx, 0, 0, 1024, 160, ['#0f141d', '#1e2736', '#0b0f17']);
  drawCarbonWeavePattern(rsctx, 720, 12, 280, 136, 6);

  rsctx.strokeStyle = '#475569';
  rsctx.lineWidth = 6;
  rsctx.strokeRect(6, 6, 1012, 148);

  rsctx.fillStyle = '#38bdf8';
  rsctx.fillRect(34, 36, 10, 88);

  rsctx.fillStyle = '#f8fafc';
  rsctx.font = 'bold 34px sans-serif';
  rsctx.fillText('CORSAIR // ROG RYUJIN 240 STEALTH', 62, 78);
  rsctx.fillStyle = '#94a3b8';
  rsctx.font = 'bold 19px monospace';
  rsctx.fillText('HIGH-DENSITY LOUVERED FIN COPPER RADIATOR · CNC GUNMETAL ARMOR', 62, 116);

  [910, 965].forEach((rx) => {
    rsctx.fillStyle = '#cbd5e1';
    rsctx.beginPath();
    rsctx.arc(rx, 80, 11, 0, Math.PI * 2);
    rsctx.fill();
    rsctx.fillStyle = '#0f172a';
    rsctx.beginPath();
    rsctx.arc(rx, 80, 5, 0, Math.PI * 2);
    rsctx.fill();
  });

  const radiatorSidePlate = registerColor(radSideCanvas);

  // =========================================================================
  // 5. HEATSINK FINS ALBEDO & BUMP MAP (Radiator, VRM & GPU Fins)
  // =========================================================================
  const finCanvas = document.createElement('canvas');
  finCanvas.width = 512;
  finCanvas.height = 512;
  const fctx = finCanvas.getContext('2d')!;

  const finBumpCanvas = document.createElement('canvas');
  finBumpCanvas.width = 512;
  finBumpCanvas.height = 512;
  const fbctx = finBumpCanvas.getContext('2d')!;

  fctx.fillStyle = '#0b0f17';
  fctx.fillRect(0, 0, 512, 512);
  fbctx.fillStyle = '#101010';
  fbctx.fillRect(0, 0, 512, 512);

  // High-contrast anodized dark gunmetal & machined aluminum fin array
  for (let x = 0; x < 512; x += 4) {
    fctx.fillStyle = x % 8 === 0 ? '#cbd5e1' : '#475569';
    fctx.fillRect(x, 0, 2, 512);
    fbctx.fillStyle = '#ffffff';
    fbctx.fillRect(x, 0, 2, 512);
  }

  // Horizontal copper/nickel heatpipe & liquid channels crossing the fins
  for (let y = 36; y < 512; y += 48) {
    fctx.fillStyle = '#1e293b';
    fctx.fillRect(0, y, 512, 9);
    fctx.fillStyle = '#d97706';
    fctx.fillRect(0, y + 2, 512, 4);
  }

  const heatsinkFinsAlbedo = registerColor(finCanvas);
  const heatsinkFinsBump = registerData(finBumpCanvas);

  // =========================================================================
  // 6. RAM DDR5 HEATSPREADER & GOLD CONTACTS (512x256 - DOMINATOR TITANIUM STEALTH)
  // =========================================================================
  const ramCanvas = document.createElement('canvas');
  ramCanvas.width = 512;
  ramCanvas.height = 256;
  const rctx = ramCanvas.getContext('2d')!;

  rctx.fillStyle = '#090d14';
  rctx.fillRect(0, 0, 512, 256);

  drawBrushedMetalGrain(rctx, 10, 18, 492, 196, ['#141b26', '#263244', '#0f151f']);
  drawCarbonWeavePattern(rctx, 18, 26, 195, 180, 6);

  // Diagonal precision CNC cooling vents on left carbon inlay
  rctx.strokeStyle = '#64748b';
  rctx.lineWidth = 3.5;
  for (let i = 0; i < 7; i++) {
    rctx.beginPath();
    rctx.moveTo(35 + i * 22, 34);
    rctx.lineTo(68 + i * 22, 108);
    rctx.stroke();
  }

  rctx.fillStyle = '#f8fafc';
  rctx.font = 'bold 25px sans-serif';
  rctx.fillText('DOMINATOR TITANIUM', 225, 76);
  rctx.fillStyle = '#38bdf8';
  rctx.font = 'bold 18px monospace';
  rctx.fillText('DDR5 · 64GB · 7200MT/s · CL34', 225, 110);

  // Factory barcode sticker
  rctx.fillStyle = '#e2e8f0';
  rctx.fillRect(225, 130, 195, 52);
  rctx.fillStyle = '#0f172a';
  for (let bx = 235; bx < 405; bx += 5) {
    rctx.fillRect(bx, 136, (bx % 3) + 1, 24);
  }
  rctx.font = 'bold 11px monospace';
  rctx.fillText('CMP64GX5M4B7200C34 · XMP 3.0', 235, 176);

  // 288-Pin Gold Edge Finger contacts
  rctx.fillStyle = '#071410';
  rctx.fillRect(10, 218, 492, 38);
  for (let px = 16; px < 496; px += 5) {
    if (px > 258 && px < 276) continue;
    rctx.fillStyle = '#fbbf24';
    rctx.fillRect(px, 220, 3.5, 34);
  }

  const ramHeatspreader = registerColor(ramCanvas);

  // =========================================================================
  // 7. GPU BACKPLATE & SHROUD TEXTURES (1024x512 - ROG ASTRAL / STRIX CARBON)
  // =========================================================================
  const gpuBpCanvas = document.createElement('canvas');
  gpuBpCanvas.width = 1024;
  gpuBpCanvas.height = 512;
  const gctx = gpuBpCanvas.getContext('2d')!;

  drawBrushedMetalGrain(gctx, 0, 0, 1024, 512, ['#131923', '#232e3f', '#0d121a']);
  drawCarbonWeavePattern(gctx, 20, 20, 460, 472, 8);

  gctx.strokeStyle = '#64748b';
  gctx.lineWidth = 8;
  gctx.strokeRect(14, 14, 996, 484);

  // Exposed rear GPU core retention bracket & gold MLCC capacitor array
  gctx.fillStyle = '#070b12';
  gctx.fillRect(205, 145, 220, 220);
  gctx.strokeStyle = '#cbd5e1';
  gctx.lineWidth = 10;
  gctx.strokeRect(205, 145, 220, 220);

  for (let cx = 232; cx < 402; cx += 20) {
    for (let cy = 172; cy < 342; cy += 20) {
      gctx.fillStyle = '#f59e0b';
      gctx.fillRect(cx, cy, 13, 13);
      gctx.fillStyle = '#fef08a';
      gctx.fillRect(cx, cy, 3, 13);
    }
  }

  // Flow-through angular exhaust vents on right half of backplate ( exposing copper heatpipes )
  for (let vx = 580; vx < 960; vx += 28) {
    gctx.fillStyle = '#05080f';
    gctx.beginPath();
    gctx.moveTo(vx, 72);
    gctx.lineTo(vx + 16, 72);
    gctx.lineTo(vx - 34, 440);
    gctx.lineTo(vx - 50, 440);
    gctx.closePath();
    gctx.fill();
  }

  gctx.fillStyle = '#f8fafc';
  gctx.font = 'bold 34px sans-serif';
  gctx.fillText('ROG STRIX // AORUS MASTER RTX', 48, 86);
  gctx.fillStyle = '#38bdf8';
  gctx.font = 'bold 20px monospace';
  gctx.fillText('24GB GDDR6X · VAPOR CHAMBER · CARBON-GUNMETAL EDITION', 48, 456);

  const gpuBackplate = registerColor(gpuBpCanvas);

  const gpuShroudCanvas = document.createElement('canvas');
  gpuShroudCanvas.width = 1024;
  gpuShroudCanvas.height = 512;
  const gsctx = gpuShroudCanvas.getContext('2d')!;
  drawCarbonWeavePattern(gsctx, 0, 0, 1024, 512, 8);
  gsctx.strokeStyle = '#475569';
  gsctx.lineWidth = 8;
  gsctx.strokeRect(10, 10, 1004, 492);

  // CNC-machined gunmetal diagonal armor plates across shroud
  gsctx.fillStyle = '#1e293b';
  gsctx.fillRect(24, 24, 976, 42);
  gsctx.fillRect(24, 446, 976, 42);

  [190, 512, 834].forEach((fx) => {
    gsctx.fillStyle = '#04070e';
    gsctx.beginPath();
    gsctx.arc(fx, 256, 146, 0, Math.PI * 2);
    gsctx.fill();
    gsctx.strokeStyle = '#94a3b8';
    gsctx.lineWidth = 9;
    gsctx.stroke();
  });

  const gpuShroud = registerColor(gpuShroudCanvas);

  // =========================================================================
  // 8. PSU SIDE SPEC LABEL (512x256 - CORSAIR HX1000i / CX750 STEALTH)
  // =========================================================================
  const psuCanvas = document.createElement('canvas');
  psuCanvas.width = 512;
  psuCanvas.height = 256;
  const psctx = psuCanvas.getContext('2d')!;

  drawBrushedMetalGrain(psctx, 0, 0, 512, 256, ['#0b0f17', '#182130', '#090d14']);
  drawCarbonWeavePattern(psctx, 10, 10, 185, 236, 6);

  psctx.strokeStyle = '#334155';
  psctx.lineWidth = 6;
  psctx.strokeRect(6, 6, 500, 244);

  const cxBarGrad = psctx.createLinearGradient(175, 80, 495, 165);
  cxBarGrad.addColorStop(0, '#94a3b8');
  cxBarGrad.addColorStop(0.5, '#f1f5f9');
  cxBarGrad.addColorStop(1, '#cbd5e1');
  psctx.fillStyle = cxBarGrad;
  psctx.beginPath();
  psctx.moveTo(215, 82);
  psctx.lineTo(492, 82);
  psctx.lineTo(492, 168);
  psctx.lineTo(182, 168);
  psctx.closePath();
  psctx.fill();

  [126, 148, 170].forEach((sx) => {
    psctx.fillStyle = '#38bdf8';
    psctx.beginPath();
    psctx.moveTo(sx + 28, 82);
    psctx.lineTo(sx + 42, 82);
    psctx.lineTo(sx + 10, 168);
    psctx.lineTo(sx - 4, 168);
    psctx.closePath();
    psctx.fill();
  });

  psctx.fillStyle = '#f8fafc';
  psctx.font = 'bold 22px sans-serif';
  psctx.fillText('CORSAIR', 22, 138);
  psctx.fillStyle = '#38bdf8';
  psctx.font = 'bold 13px monospace';
  psctx.fillText('ATX 3.1 · PCIe 5.1', 22, 162);

  psctx.fillStyle = '#090c12';
  psctx.font = 'bold 58px sans-serif';
  psctx.fillText('HX1000i', 238, 146);

  psctx.fillStyle = '#94a3b8';
  psctx.font = 'bold 13px monospace';
  psctx.fillText('1000W PLATINUM DIGITAL MODULAR PSU · ZERO RPM MODE', 22, 224);

  const psuSideLabel = registerColor(psuCanvas);

  const psuModCanvas = document.createElement('canvas');
  psuModCanvas.width = 512;
  psuModCanvas.height = 256;
  const pmctx = psuModCanvas.getContext('2d')!;
  pmctx.fillStyle = '#090d16';
  pmctx.fillRect(0, 0, 512, 256);
  pmctx.fillStyle = '#f8fafc';
  pmctx.font = 'bold 14px monospace';
  pmctx.fillText('24-PIN ATX', 35, 42);
  pmctx.fillText('8-PIN EPS CPU', 195, 42);
  pmctx.fillText('12VHPWR 600W', 355, 42);

  [35, 195, 355].forEach((sx) => {
    pmctx.fillStyle = '#1e293b';
    pmctx.fillRect(sx, 56, 122, 74);
    pmctx.strokeStyle = '#94a3b8';
    pmctx.lineWidth = 3;
    pmctx.strokeRect(sx, 56, 122, 74);
    // Individual gold terminal pins inside modular sockets
    for (let px = sx + 14; px < sx + 112; px += 16) {
      for (let py = 72; py <= 108; py += 18) {
        pmctx.fillStyle = '#fbbf24';
        pmctx.fillRect(px, py, 6, 6);
      }
    }
  });

  const psuModularPanel = registerColor(psuModCanvas);

  // =========================================================================
  // 9. M.2 NVMe SSD TEXTURE (512x160 - GRAPHENE CARBON HEATSPREADER)
  // =========================================================================
  const nvmeCanvas = document.createElement('canvas');
  nvmeCanvas.width = 512;
  nvmeCanvas.height = 160;
  const nctx = nvmeCanvas.getContext('2d')!;

  nctx.fillStyle = '#09111a';
  nctx.fillRect(0, 0, 512, 160);

  for (let py = 12; py < 148; py += 8) {
    if (py > 105 && py < 122) continue;
    nctx.fillStyle = '#fbbf24';
    nctx.fillRect(4, py, 28, 5);
  }

  nctx.fillStyle = '#fbbf24';
  nctx.beginPath();
  nctx.arc(504, 80, 26, Math.PI / 2, (Math.PI * 3) / 2);
  nctx.fill();

  drawCarbonWeavePattern(nctx, 46, 16, 420, 128, 6);
  nctx.strokeStyle = '#38bdf8';
  nctx.lineWidth = 4;
  nctx.strokeRect(46, 16, 420, 128);

  nctx.fillStyle = '#ffffff';
  nctx.font = 'bold 26px sans-serif';
  nctx.fillText('990 PRO NVMe M.2', 68, 64);
  nctx.fillStyle = '#38bdf8';
  nctx.font = 'bold 18px monospace';
  nctx.fillText('4TB · PCIe 5.0 x4 · 14,500 MB/s', 68, 100);
  nctx.fillStyle = '#cbd5e1';
  nctx.font = 'bold 13px monospace';
  nctx.fillText('GRAPHENE CARBON HEATSPREADER · V-NAND TLC', 68, 128);

  const nvmeLabel = registerColor(nvmeCanvas);

  // =========================================================================
  // 10. 2.5" SATA SSD TOP PLATE TEXTURE (512x512 - BRUSHED GUNMETAL)
  // =========================================================================
  const ssdCanvas = document.createElement('canvas');
  ssdCanvas.width = 512;
  ssdCanvas.height = 512;
  const ssctx = ssdCanvas.getContext('2d')!;

  drawBrushedMetalGrain(ssctx, 0, 0, 512, 512, ['#111827', '#243044', '#0d131f']);
  drawCarbonWeavePattern(ssctx, 36, 36, 440, 105, 8);

  ssctx.strokeStyle = '#475569';
  ssctx.lineWidth = 10;
  ssctx.strokeRect(18, 18, 476, 476);

  ssctx.fillStyle = '#38bdf8';
  ssctx.fillRect(36, 138, 440, 6);

  ssctx.fillStyle = '#ffffff';
  ssctx.font = 'bold 34px sans-serif';
  ssctx.fillText('STEALTH PRO SSD', 64, 102);

  ssctx.fillStyle = '#f8fafc';
  ssctx.font = 'bold 58px monospace';
  ssctx.fillText('2.0 TB', 64, 232);

  ssctx.fillStyle = '#38bdf8';
  ssctx.font = 'bold 22px monospace';
  ssctx.fillText('2.5" SATA III · 6.0 Gb/s', 64, 282);
  ssctx.fillStyle = '#cbd5e1';
  ssctx.font = 'bold 18px monospace';
  ssctx.fillText('READ: 560 MB/s | WRITE: 530 MB/s', 64, 332);
  ssctx.fillText('CNC ANODIZED GUNMETAL ENCLOSURE', 64, 368);

  [
    [36, 36],
    [476, 36],
    [36, 476],
    [476, 476],
  ].forEach(([sx, sy]) => {
    ssctx.fillStyle = '#cbd5e1';
    ssctx.beginPath();
    ssctx.arc(sx, sy, 9, 0, Math.PI * 2);
    ssctx.fill();
  });

  const sataSsdTop = registerColor(ssdCanvas);

  // =========================================================================
  // 11. 3.5" HDD MECHANICAL HARD DRIVE TOP COVER & LABEL (512x512)
  // =========================================================================
  const hddCanvas = document.createElement('canvas');
  hddCanvas.width = 512;
  hddCanvas.height = 512;
  const hctx = hddCanvas.getContext('2d')!;

  drawBrushedMetalGrain(hctx, 0, 0, 512, 512, ['#cbd5e1', '#f8fafc', '#94a3b8']);

  hctx.strokeStyle = '#334155';
  hctx.lineWidth = 16;
  hctx.strokeRect(10, 10, 492, 492);

  hctx.fillStyle = '#ffffff';
  hctx.fillRect(65, 110, 382, 330);
  hctx.strokeStyle = '#0f172a';
  hctx.lineWidth = 3;
  hctx.strokeRect(65, 110, 382, 330);

  hctx.fillStyle = '#0f172a';
  hctx.fillRect(67, 112, 378, 54);
  hctx.fillStyle = '#38bdf8';
  hctx.font = 'bold 26px sans-serif';
  hctx.fillText('IRONWOLF // BARRACUDA PRO', 82, 148);

  hctx.fillStyle = '#0f172a';
  hctx.font = 'bold 46px monospace';
  hctx.fillText('16.0 TB', 88, 215);
  hctx.font = 'bold 20px monospace';
  hctx.fillText('7200 RPM · 512MB CACHE', 88, 252);
  hctx.fillStyle = '#334155';
  hctx.font = 'bold 16px monospace';
  hctx.fillText('SATA 6Gb/s · HELIUM SEALED', 88, 285);
  hctx.fillText('S/N: WMC4N0849127 · +5V / +12V', 88, 315);

  hctx.fillStyle = '#090d16';
  for (let bx = 88; bx < 420; bx += 6) {
    hctx.fillRect(bx, 345, (bx % 4) + 2, 55);
  }

  const hddTopCover = registerColor(hddCanvas);

  // =========================================================================
  // 12. CMOS BATTERY (CR2032 ENGRAVED COIN CELL) (256x256)
  // =========================================================================
  const cmosCanvas = document.createElement('canvas');
  cmosCanvas.width = 256;
  cmosCanvas.height = 256;
  const cmctx = cmosCanvas.getContext('2d')!;

  const cmGrad = cmctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  cmGrad.addColorStop(0, '#ffffff');
  cmGrad.addColorStop(0.75, '#cbd5e1');
  cmGrad.addColorStop(1, '#64748b');
  cmctx.fillStyle = cmGrad;
  cmctx.fillRect(0, 0, 256, 256);

  cmctx.strokeStyle = '#475569';
  cmctx.lineWidth = 6;
  cmctx.beginPath();
  cmctx.arc(128, 128, 112, 0, Math.PI * 2);
  cmctx.stroke();

  cmctx.fillStyle = '#0f172a';
  cmctx.textAlign = 'center';
  cmctx.font = 'bold 48px sans-serif';
  cmctx.fillText('+', 128, 78);
  cmctx.font = 'bold 28px monospace';
  cmctx.fillText('CR2032', 128, 126);
  cmctx.font = 'bold 18px sans-serif';
  cmctx.fillText('3V LITHIUM', 128, 158);
  cmctx.font = '14px monospace';
  cmctx.fillText('MADE IN JAPAN', 128, 188);

  const cmosBatteryTop = registerColor(cmosCanvas);

  // =========================================================================
  // 13. IC CHIPS: BIOS, AUDIO CODEC & LAN CONTROLLER (256x256)
  // =========================================================================
  const makeIcTexture = (
    vendor: string,
    model: string,
    spec: string,
    accentHex: string
  ) => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = '#0b0f17';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, 236, 236);

    ctx.fillStyle = accentHex;
    ctx.beginPath();
    ctx.arc(38, 38, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(vendor, 28, 95);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px monospace';
    ctx.fillText(model, 28, 142);

    ctx.fillStyle = accentHex;
    ctx.font = 'bold 18px monospace';
    ctx.fillText(spec, 28, 185);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('2638-A1 TAIWAN', 28, 220);

    return registerColor(c);
  };

  const biosChipTop = makeIcTexture(
    'WINBOND',
    'UEFI 256M',
    '25Q256JVEQ',
    '#38bdf8'
  );
  const audioChipTop = makeIcTexture(
    'REALTEK',
    'ALC4080',
    'SUPREMEFX DAC',
    '#fbbf24'
  );
  const networkChipTop = makeIcTexture(
    'INTEL',
    'I226-V',
    '2.5GbE LAN',
    '#10b981'
  );

  // =========================================================================
  // 14. FAN HUB METALLIC MAGNETIC-LEVITATION BADGE & BRAIDED SLEEVE TEXTURES
  // =========================================================================
  const fanCanvas = document.createElement('canvas');
  fanCanvas.width = 256;
  fanCanvas.height = 256;
  const fnctx = fanCanvas.getContext('2d')!;

  const fhGrad = fnctx.createRadialGradient(128, 128, 8, 128, 128, 128);
  fhGrad.addColorStop(0, '#475569');
  fhGrad.addColorStop(0.5, '#0f172a');
  fhGrad.addColorStop(1, '#1e293b');
  fnctx.fillStyle = fhGrad;
  fnctx.fillRect(0, 0, 256, 256);

  // Concentric CNC machined rings + copper bearing core
  fnctx.strokeStyle = '#94a3b8';
  fnctx.lineWidth = 10;
  fnctx.beginPath();
  fnctx.arc(128, 128, 110, 0, Math.PI * 2);
  fnctx.stroke();

  fnctx.strokeStyle = '#d97706';
  fnctx.lineWidth = 8;
  fnctx.beginPath();
  fnctx.arc(128, 128, 68, 0, Math.PI * 2);
  fnctx.stroke();

  fnctx.fillStyle = '#f8fafc';
  fnctx.beginPath();
  fnctx.arc(128, 128, 20, 0, Math.PI * 2);
  fnctx.fill();

  const fanHubSticker = registerColor(fanCanvas);

  // High-Definition Custom-Sleeved Paracord / Carbon-PET Weave Generator
  const createBraidedSleeveTexture = (
    bgHex: string,
    weaveA: string,
    weaveB: string
  ) => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = bgHex;
    ctx.fillRect(0, 0, 256, 256);

    ctx.lineWidth = 7;
    for (let i = -256; i < 512; i += 16) {
      ctx.strokeStyle = i % 32 === 0 ? weaveA : weaveB;
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 256, 256);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(i + 256, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();
    }
    const t = registerColor(c);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(16, 2);
    return t;
  };

  const braidedCableDark = createBraidedSleeveTexture(
    '#090d14',
    '#334155',
    '#1e293b'
  );
  const braidedCableCyan = createBraidedSleeveTexture(
    '#0b1320',
    '#38bdf8',
    '#475569'
  );
  const braidedCableAmber = createBraidedSleeveTexture(
    '#141210',
    '#f59e0b',
    '#334155'
  );
  const braidedCablePurple = createBraidedSleeveTexture(
    '#131124',
    '#a855f7',
    '#475569'
  );

  // =========================================================================
  // 15. LAPTOP HIGH-DENSITY STEALTH HDI LOGIC BOARD PCB (1024x512)
  // =========================================================================
  const lBoardCanvas = document.createElement('canvas');
  lBoardCanvas.width = 1024;
  lBoardCanvas.height = 512;
  const lbctx = lBoardCanvas.getContext('2d')!;
  lbctx.fillStyle = '#070b12';
  lbctx.fillRect(0, 0, 1024, 512);
  lbctx.fillStyle = '#0d1422';
  lbctx.fillRect(14, 14, 996, 484);

  drawCarbonWeavePattern(lbctx, 30, 30, 240, 190, 6);

  // High-contrast gold & copper signal buses on mobile HDI PCB
  lbctx.lineWidth = 2.2;
  for (let i = 0; i < 42; i++) {
    lbctx.strokeStyle = i % 3 === 0 ? '#f59e0b' : '#b45309';
    lbctx.beginPath();
    lbctx.moveTo(110 + i * 20, 36);
    lbctx.lineTo(140 + i * 20, 220);
    lbctx.lineTo(140 + i * 20, 470);
    lbctx.stroke();
  }
  for (let y = 55; y < 460; y += 24) {
    lbctx.strokeStyle = y % 48 === 0 ? '#eab308' : '#334155';
    lbctx.beginPath();
    lbctx.moveTo(70, y);
    lbctx.lineTo(950, y);
    lbctx.stroke();
  }

  // Gold standoffs & SMD pads
  [
    [48, 48],
    [512, 48],
    [976, 48],
    [48, 464],
    [512, 464],
    [976, 464],
    [280, 250],
    [740, 250],
  ].forEach(([gx, gy]) => {
    lbctx.strokeStyle = '#fbbf24';
    lbctx.lineWidth = 4.5;
    lbctx.beginPath();
    lbctx.arc(gx, gy, 15, 0, Math.PI * 2);
    lbctx.stroke();
    lbctx.fillStyle = '#020617';
    lbctx.beginPath();
    lbctx.arc(gx, gy, 7, 0, Math.PI * 2);
    lbctx.fill();
  });

  lbctx.fillStyle = '#f8fafc';
  lbctx.font = 'bold 17px monospace';
  lbctx.fillText('ROG ZEPHYRUS // RAZER BLADE 10-LAYER HDI MAINBOARD', 285, 48);
  lbctx.fillStyle = 'rgba(226, 232, 240, 0.9)';
  lbctx.font = 'bold 16px monospace';
  lbctx.fillText('BGA1744_SOC_CPU', 330, 115);
  lbctx.fillText('DGPU_GN21_X11_RTX', 585, 115);
  lbctx.fillText('DDR5_SODIMM_CHA/B', 520, 390);
  lbctx.fillText('M2_2280_PCIe5', 735, 390);
  lbctx.fillText('WIFI7_BE200_NGFF', 180, 380);
  lbctx.fillText('BATT_CONN_15.4V_80WH', 415, 485);
  const laptopBoardAlbedo = registerColor(lBoardCanvas);

  // =========================================================================
  // 16. LAPTOP 80Wh 4-CELL LI-ION BATTERY PACK LABEL (1024x320)
  // =========================================================================
  const lBattCanvas = document.createElement('canvas');
  lBattCanvas.width = 1024;
  lBattCanvas.height = 320;
  const bttCtx = lBattCanvas.getContext('2d')!;
  bttCtx.fillStyle = '#090d16';
  bttCtx.fillRect(0, 0, 1024, 320);

  for (let i = 0; i < 4; i++) {
    const cx = 18 + i * 248;
    drawBrushedMetalGrain(bttCtx, cx, 16, 236, 288, ['#0f1520', '#1b2434', '#0b1019']);
    bttCtx.strokeStyle = '#334155';
    bttCtx.lineWidth = 4;
    bttCtx.strokeRect(cx, 16, 236, 288);
  }

  bttCtx.fillStyle = '#f59e0b';
  bttCtx.fillRect(42, 42, 10, 236);

  bttCtx.fillStyle = '#ffffff';
  bttCtx.font = 'bold 30px sans-serif';
  bttCtx.fillText('HIGH-DENSITY LI-ION POLYMER BATTERY PACK', 72, 82);
  bttCtx.fillStyle = '#38bdf8';
  bttCtx.font = 'bold 26px monospace';
  bttCtx.fillText('90.0 Wh · 15.4V === 5844 mAh (4ICP5/65/88)', 72, 128);
  bttCtx.fillStyle = '#cbd5e1';
  bttCtx.font = 'bold 17px monospace';
  bttCtx.fillText('MODEL: C41N2303 · SMART BMS INTEGRATED · UL2054 / IEC62133', 72, 172);
  bttCtx.fillText('CAUTION: DO NOT DISASSEMBLE, CRUSH, PUNCTURE OR INCINERATE', 72, 204);

  ['CE', 'Li-ion 00', 'UL', 'PS-E', 'UKCA'].forEach((badge, idx) => {
    bttCtx.strokeStyle = '#e2e8f0';
    bttCtx.lineWidth = 3;
    bttCtx.strokeRect(72 + idx * 110, 224, 94, 42);
    bttCtx.fillStyle = '#f8fafc';
    bttCtx.font = 'bold 18px sans-serif';
    bttCtx.fillText(badge, 86 + idx * 110, 252);
  });
  const laptopBatteryTop = registerColor(lBattCanvas);

  // =========================================================================
  // 17. LAPTOP BACKLIT CHICLET KEYBOARD MATRIX (1024x512 - CNC STEALTH DECK)
  // =========================================================================
  const kbdCanvas = document.createElement('canvas');
  kbdCanvas.width = 1024;
  kbdCanvas.height = 512;
  const kctx = kbdCanvas.getContext('2d')!;
  drawBrushedMetalGrain(kctx, 0, 0, 1024, 512, ['#0d121c', '#182132', '#090d15']);
  kctx.strokeStyle = '#475569';
  kctx.lineWidth = 6;
  kctx.strokeRect(8, 8, 1008, 496);

  const rows = [
    ['ESC', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'DEL'],
    ['^', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'ß', '´', 'BACK'],
    ['TAB', 'Q', 'W', 'E', 'R', 'T', 'Z', 'U', 'I', 'O', 'P', 'Ü', '+', 'ENTER'],
    ['CAPS', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ö', 'Ä', '#', ''],
    ['SHIFT', 'Y', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '-', 'UP', 'SHIFT'],
    ['CTRL', 'FN', 'WIN', 'ALT', 'SPACE', 'ALTGR', 'LEFT', 'DOWN', 'RIGHT'],
  ];

  rows.forEach((row, rIdx) => {
    let curX = 24;
    const keyH = rIdx === 0 ? 44 : 68;
    const curY = rIdx === 0 ? 22 : 80 + (rIdx - 1) * 82;

    row.forEach((label) => {
      if (!label) return;
      let keyW = 64;
      if (label === 'SPACE') keyW = 310;
      else if (label === 'SHIFT' || label === 'CAPS' || label === 'BACK' || label === 'ENTER') keyW = 102;
      else if (label === 'TAB') keyW = 86;

      const isWasd = ['W', 'A', 'S', 'D', 'ESC'].includes(label);
      // Per-key RGB backlight halo
      kctx.fillStyle = isWasd ? '#f59e0b' : '#38bdf8';
      kctx.fillRect(curX - 2, curY - 2, keyW + 4, keyH + 4);
      // Matte stealth keycap
      kctx.fillStyle = '#111827';
      kctx.fillRect(curX, curY, keyW, keyH);

      kctx.fillStyle = '#f8fafc';
      kctx.font = 'bold 16px sans-serif';
      kctx.fillText(label, curX + 10, curY + keyH / 2 + 6);

      curX += keyW + 8;
    });
  });
  const laptopKeyboardTop = registerColor(kbdCanvas);

  // =========================================================================
  // 18. LAPTOP QHD+ MINI-LED DISPLAY SCREEN ARTWORK (1024x640)
  // =========================================================================
  const scrCanvas = document.createElement('canvas');
  scrCanvas.width = 1024;
  scrCanvas.height = 640;
  const sctx2 = scrCanvas.getContext('2d')!;
  const scrGrad = sctx2.createLinearGradient(0, 0, 1024, 640);
  scrGrad.addColorStop(0, '#070d19');
  scrGrad.addColorStop(0.5, '#111e36');
  scrGrad.addColorStop(1, '#050911');
  sctx2.fillStyle = scrGrad;
  sctx2.fillRect(0, 0, 1024, 640);

  sctx2.strokeStyle = 'rgba(56, 189, 248, 0.16)';
  sctx2.lineWidth = 1.5;
  for (let x = 0; x < 1024; x += 48) {
    sctx2.beginPath();
    sctx2.moveTo(x, 0);
    sctx2.lineTo(x, 640);
    sctx2.stroke();
  }
  for (let y = 0; y < 640; y += 48) {
    sctx2.beginPath();
    sctx2.moveTo(0, y);
    sctx2.lineTo(1024, y);
    sctx2.stroke();
  }

  sctx2.strokeStyle = 'rgba(56, 189, 248, 0.55)';
  sctx2.lineWidth = 3;
  sctx2.strokeRect(80, 80, 864, 480);
  sctx2.fillStyle = '#ffffff';
  sctx2.font = 'bold 34px sans-serif';
  sctx2.fillText('ROG NEBULA HDR · OLED / MINI-LED 240Hz', 120, 150);
  sctx2.fillStyle = '#38bdf8';
  sctx2.font = 'bold 22px monospace';
  sctx2.fillText('100% DCI-P3 · PANTONE VALIDATED · G-SYNC ULTIMATE', 120, 195);

  [260, 320, 380, 440].forEach((by, i) => {
    sctx2.fillStyle = 'rgba(15, 23, 42, 0.85)';
    sctx2.fillRect(120, by, 780, 38);
    sctx2.fillStyle = i % 2 === 0 ? '#0284c7' : '#f59e0b';
    sctx2.fillRect(120, by, 480 + i * 65, 38);
  });
  const laptopScreenDisplay = registerColor(scrCanvas);

  // =========================================================================
  // 19. SERVER DUAL-SOCKET SSI-EEB MOTHERBOARD PCB (1024x1024)
  // =========================================================================
  const srvBoardCanvas = document.createElement('canvas');
  srvBoardCanvas.width = 1024;
  srvBoardCanvas.height = 1024;
  const sbctx = srvBoardCanvas.getContext('2d')!;
  sbctx.fillStyle = '#051410';
  sbctx.fillRect(0, 0, 1024, 1024);
  sbctx.fillStyle = '#07221b';
  sbctx.fillRect(20, 20, 984, 984);

  // High-speed copper & gold UPI/Infinity Fabric traces between Socket 0 & Socket 1
  sbctx.lineWidth = 2.4;
  for (let i = 0; i < 32; i++) {
    sbctx.strokeStyle = i % 2 === 0 ? '#fbbf24' : '#10b981';
    sbctx.beginPath();
    sbctx.moveTo(290, 300 + i * 7.5);
    sbctx.lineTo(730, 300 + i * 7.5);
    sbctx.stroke();
  }
  // PCIe 5.0 lanes to rear risers
  for (let i = 0; i < 36; i++) {
    sbctx.strokeStyle = i % 3 === 0 ? '#f59e0b' : '#059669';
    sbctx.beginPath();
    sbctx.moveTo(200 + i * 17, 530);
    sbctx.lineTo(200 + i * 17, 950);
    sbctx.stroke();
  }
  sbctx.fillStyle = '#f8fafc';
  sbctx.font = 'bold 21px monospace';
  sbctx.fillText('CPU0_LGA4677 / SP5', 210, 255);
  sbctx.fillText('CPU1_LGA4677 / SP5', 605, 255);
  sbctx.fillText('24-DIMM DDR5 ECC RDIMM ARCHITECTURE', 310, 105);
  sbctx.fillText('BMC_AST2600_IPMI', 110, 880);
  sbctx.fillText('OCP_3.0_NIC_SFF', 435, 930);
  sbctx.fillText('CRPS_12V_BUSBAR_N+1', 715, 880);
  const serverBoardAlbedo = registerColor(srvBoardCanvas);

  // =========================================================================
  // 20. SERVER 1600W 80+ TITANIUM HOT-SWAP CRPS PSU LABEL (512x256)
  // =========================================================================
  const srvPsuCanvas = document.createElement('canvas');
  srvPsuCanvas.width = 512;
  srvPsuCanvas.height = 256;
  const spctx = srvPsuCanvas.getContext('2d')!;
  drawBrushedMetalGrain(spctx, 0, 0, 512, 256, ['#141c28', '#243144', '#0f1620']);
  spctx.strokeStyle = '#64748b';
  spctx.lineWidth = 6;
  spctx.strokeRect(8, 8, 496, 240);

  spctx.fillStyle = '#10b981';
  spctx.fillRect(22, 22, 12, 212);
  spctx.fillStyle = '#ffffff';
  spctx.font = 'bold 34px sans-serif';
  spctx.fillText('CRPS 1600W REDUNDANT', 48, 66);

  spctx.fillStyle = '#38bdf8';
  spctx.font = 'bold 20px monospace';
  spctx.fillText('80 PLUS TITANIUM · 96% EFFICIENCY', 48, 108);
  spctx.fillStyle = '#e2e8f0';
  spctx.font = 'bold 16px monospace';
  spctx.fillText('INPUT: 200-240VAC ~ 10A 50/60Hz', 48, 146);
  spctx.fillText('OUTPUT: +12.2V === 131.1A MAX / +12VSB === 3.0A', 48, 178);
  spctx.fillStyle = '#f59e0b';
  spctx.fillText('HOT-SWAP N+1 ACTIVE LOAD SHARING · PMBus 1.3', 48, 216);
  const serverPsuLabel = registerColor(srvPsuCanvas);

  // =========================================================================
  // 21. SERVER 2.5" U.3 NVMe HOT-SWAP DRIVE CADDY FACEPLATE (512x160)
  // =========================================================================
  const caddyCanvas = document.createElement('canvas');
  caddyCanvas.width = 512;
  caddyCanvas.height = 160;
  const cdctx = caddyCanvas.getContext('2d')!;
  drawBrushedMetalGrain(cdctx, 0, 0, 512, 160, ['#0d131d', '#1c2636', '#090e16']);
  cdctx.strokeStyle = '#475569';
  cdctx.lineWidth = 6;
  cdctx.strokeRect(6, 6, 500, 148);

  cdctx.fillStyle = '#020617';
  for (let vx = 28; vx < 300; vx += 16) {
    for (let vy = 24; vy < 138; vy += 16) {
      cdctx.beginPath();
      cdctx.arc(vx, vy, 5, 0, Math.PI * 2);
      cdctx.fill();
    }
  }
  cdctx.fillStyle = '#e11d48';
  cdctx.fillRect(316, 26, 54, 108);
  cdctx.fillStyle = '#111827';
  cdctx.fillRect(380, 22, 114, 116);
  cdctx.fillStyle = '#38bdf8';
  cdctx.font = 'bold 20px monospace';
  cdctx.fillText('U.3 PCIe5', 386, 56);
  cdctx.fillStyle = '#ffffff';
  cdctx.font = 'bold 24px sans-serif';
  cdctx.fillText('7.68TB', 390, 92);
  cdctx.fillStyle = '#10b981';
  cdctx.beginPath();
  cdctx.arc(406, 118, 7, 0, Math.PI * 2);
  cdctx.fill();
  cdctx.fillStyle = '#38bdf8';
  cdctx.beginPath();
  cdctx.arc(432, 118, 7, 0, Math.PI * 2);
  cdctx.fill();
  const serverDriveCaddyFront = registerColor(caddyCanvas);

  // =========================================================================
  // 22. SERVER CPU IHS (XEON / EPYC SP5 HEATSPREADER) (512x512)
  // =========================================================================
  const sCpuCanvas = document.createElement('canvas');
  sCpuCanvas.width = 512;
  sCpuCanvas.height = 512;
  const scctx = sCpuCanvas.getContext('2d')!;
  drawBrushedMetalGrain(scctx, 0, 0, 512, 512, ['#cbd5e1', '#f8fafc', '#94a3b8']);

  scctx.strokeStyle = '#0284c7';
  scctx.lineWidth = 22;
  scctx.strokeRect(14, 14, 484, 484);

  scctx.fillStyle = '#0f172a';
  scctx.font = 'bold 34px monospace';
  scctx.fillText('EPYC 9654 // XEON', 64, 140);
  scctx.fillStyle = '#1e293b';
  scctx.font = 'bold 24px monospace';
  scctx.fillText('96-CORE · SP5 / LGA4677', 64, 190);
  scctx.font = 'bold 18px monospace';
  scctx.fillText('12-CHANNEL DDR5 · 128 LANE PCIe 5.0', 64, 240);
  scctx.fillText('TORX T20 FORCE: 1.5 Nm', 64, 290);
  const serverCpuIhs = registerColor(sCpuCanvas);

  // =========================================================================
  // 23. ARGB FAN DISC & TRANSLUCENT BLADE TEXTURE (512x512)
  // =========================================================================
  const argbFanCanvas = document.createElement('canvas');
  argbFanCanvas.width = 512;
  argbFanCanvas.height = 512;
  const afctx = argbFanCanvas.getContext('2d')!;

  afctx.fillStyle = '#090d16';
  afctx.fillRect(0, 0, 512, 512);

  const fanRainbow = [
    '#06b6d4',
    '#3b82f6',
    '#6366f1',
    '#a855f7',
    '#ec4899',
    '#f59e0b',
    '#10b981',
    '#06b6d4',
  ];
  const totalSlices = 96;
  for (let i = 0; i < totalSlices; i++) {
    const a0 = (i / totalSlices) * Math.PI * 2;
    const a1 = ((i + 1.2) / totalSlices) * Math.PI * 2;
    const cIdx = Math.floor((i / totalSlices) * fanRainbow.length) % fanRainbow.length;
    afctx.fillStyle = fanRainbow[cIdx];
    afctx.beginPath();
    afctx.moveTo(256, 256);
    afctx.arc(256, 256, 248, a0, a1);
    afctx.closePath();
    afctx.fill();
  }

  const hubGlow = afctx.createRadialGradient(256, 256, 24, 256, 256, 235);
  hubGlow.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  hubGlow.addColorStop(0.28, 'rgba(255, 255, 255, 0.45)');
  hubGlow.addColorStop(0.75, 'rgba(15, 23, 42, 0.18)');
  hubGlow.addColorStop(1, 'rgba(9, 13, 22, 0.45)');
  afctx.fillStyle = hubGlow;
  afctx.beginPath();
  afctx.arc(256, 256, 248, 0, Math.PI * 2);
  afctx.fill();

  const argbFanDisc = registerColor(argbFanCanvas);

  // =========================================================================
  // 24. RAM ARGB LIGHTBAR DIFFUSER TEXTURE (128x512)
  // =========================================================================
  const ramRgbCanvas = document.createElement('canvas');
  ramRgbCanvas.width = 128;
  ramRgbCanvas.height = 512;
  const rrctx = ramRgbCanvas.getContext('2d')!;

  const ramRgbGrad = rrctx.createLinearGradient(0, 0, 0, 512);
  ramRgbGrad.addColorStop(0, '#38bdf8');
  ramRgbGrad.addColorStop(0.3, '#818cf8');
  ramRgbGrad.addColorStop(0.6, '#c084fc');
  ramRgbGrad.addColorStop(0.85, '#f59e0b');
  ramRgbGrad.addColorStop(1, '#22d3ee');
  rrctx.fillStyle = ramRgbGrad;
  rrctx.fillRect(0, 0, 128, 512);

  // Anodized gunmetal comb dividers across the lightbar
  rrctx.fillStyle = 'rgba(15, 23, 42, 0.48)';
  [105, 210, 315, 420].forEach((dy) => {
    rrctx.fillRect(0, dy, 128, 12);
  });

  const ramRgbLightbar = registerColor(ramRgbCanvas);

  // =========================================================================
  // 25. ROG STRIX / AORUS GEFORCE RTX SIDE SHROUD & RGB EMBLEM (1024x256)
  // =========================================================================
  const gpuSideCanvas = document.createElement('canvas');
  gpuSideCanvas.width = 1024;
  gpuSideCanvas.height = 256;
  const gsc = gpuSideCanvas.getContext('2d')!;

  drawBrushedMetalGrain(gsc, 0, 0, 1024, 256, ['#0b0f17', '#1a2333', '#090d14']);
  drawCarbonWeavePattern(gsc, 380, 20, 260, 216, 6);

  gsc.fillStyle = '#475569';
  gsc.fillRect(0, 0, 1024, 10);
  gsc.fillRect(0, 244, 1024, 12);

  gsc.fillStyle = '#f8fafc';
  gsc.font = 'bold 42px sans-serif';
  gsc.fillText('GEFORCE RTX', 48, 128);
  gsc.fillStyle = '#38bdf8';
  gsc.font = 'bold 18px monospace';
  gsc.fillText('ROG STRIX // STEALTH CARBON OC', 48, 168);

  const rogGrad = gsc.createLinearGradient(680, 60, 960, 200);
  rogGrad.addColorStop(0, '#38bdf8');
  rogGrad.addColorStop(0.55, '#818cf8');
  rogGrad.addColorStop(1, '#f59e0b');
  gsc.fillStyle = rogGrad;
  gsc.strokeStyle = rogGrad;
  gsc.lineWidth = 10;

  gsc.beginPath();
  gsc.moveTo(690, 135);
  gsc.lineTo(765, 86);
  gsc.lineTo(905, 74);
  gsc.lineTo(850, 152);
  gsc.lineTo(755, 172);
  gsc.closePath();
  gsc.stroke();

  gsc.beginPath();
  gsc.moveTo(735, 128);
  gsc.lineTo(860, 100);
  gsc.lineTo(825, 140);
  gsc.closePath();
  gsc.fill();

  const gpuSideBadge = registerColor(gpuSideCanvas);

  // =========================================================================
  // 26. MAGNETIC FINE-MESH DUST FILTER TEXTURE (512x512)
  // =========================================================================
  const dustCanvas = document.createElement('canvas');
  dustCanvas.width = 512;
  dustCanvas.height = 512;
  const dctx = dustCanvas.getContext('2d')!;

  dctx.fillStyle = '#0d131d';
  dctx.fillRect(0, 0, 512, 512);

  dctx.strokeStyle = '#334155';
  dctx.lineWidth = 1.3;
  for (let i = 0; i < 512; i += 6) {
    dctx.beginPath();
    dctx.moveTo(i, 0);
    dctx.lineTo(i, 512);
    dctx.stroke();
    dctx.beginPath();
    dctx.moveTo(0, i);
    dctx.lineTo(512, i);
    dctx.stroke();
  }

  for (let y = 24; y < 488; y += 14) {
    for (let x = 24; x < 488; x += 14) {
      const ox = (y / 14) % 2 === 0 ? x : x + 7;
      dctx.fillStyle = '#020617';
      dctx.beginPath();
      dctx.arc(ox, y, 4.2, 0, Math.PI * 2);
      dctx.fill();
    }
  }

  dctx.strokeStyle = '#1e293b';
  dctx.lineWidth = 24;
  dctx.strokeRect(12, 12, 488, 488);
  dctx.fillStyle = '#94a3b8';
  dctx.font = 'bold 14px monospace';
  dctx.fillText('STEALTH MAGNETIC NYLON MESH FILTER · HIGH AIRFLOW', 48, 20);

  const dustFilterMesh = registerColor(dustCanvas);

  // =========================================================================
  // 27. THERMAL PASTE (TIM) SPREAD PATTERN TEXTURE (256x256)
  // =========================================================================
  const timCanvas = document.createElement('canvas');
  timCanvas.width = 256;
  timCanvas.height = 256;
  const tctx = timCanvas.getContext('2d')!;

  tctx.fillStyle = '#64748b';
  tctx.fillRect(0, 0, 256, 256);

  const timGrad = tctx.createRadialGradient(128, 128, 12, 128, 128, 118);
  timGrad.addColorStop(0, '#e2e8f0');
  timGrad.addColorStop(0.55, '#94a3b8');
  timGrad.addColorStop(0.9, '#64748b');
  timGrad.addColorStop(1, '#475569');
  tctx.fillStyle = timGrad;
  tctx.beginPath();
  tctx.arc(128, 128, 116, 0, Math.PI * 2);
  tctx.fill();

  tctx.strokeStyle = 'rgba(248, 250, 252, 0.65)';
  tctx.lineWidth = 6;
  tctx.beginPath();
  tctx.moveTo(38, 38);
  tctx.lineTo(218, 218);
  tctx.moveTo(218, 38);
  tctx.lineTo(38, 218);
  tctx.stroke();

  tctx.fillStyle = '#1e293b';
  tctx.font = 'bold 13px monospace';
  tctx.fillText('THERMAL GRIZZLY · 14.2 W/mK', 34, 242);

  const thermalPastePattern = registerColor(timCanvas);

  // =========================================================================
  // 28. ARGB & PWM FAN CONTROLLER HUB TEXTURE (512x256)
  // =========================================================================
  const hubCtrlCanvas = document.createElement('canvas');
  hubCtrlCanvas.width = 512;
  hubCtrlCanvas.height = 256;
  const hcctx = hubCtrlCanvas.getContext('2d')!;

  drawCarbonWeavePattern(hcctx, 0, 0, 512, 256, 8);
  hcctx.strokeStyle = '#475569';
  hcctx.lineWidth = 8;
  hcctx.strokeRect(8, 8, 496, 240);

  const hubBarGrad = hcctx.createLinearGradient(32, 0, 480, 0);
  hubBarGrad.addColorStop(0, '#06b6d4');
  hubBarGrad.addColorStop(0.5, '#3b82f6');
  hubBarGrad.addColorStop(1, '#f59e0b');
  hcctx.fillStyle = hubBarGrad;
  hcctx.fillRect(32, 34, 448, 10);

  hcctx.fillStyle = '#ffffff';
  hcctx.font = 'bold 24px sans-serif';
  hcctx.fillText('COMMANDER CORE XT · PWM / ARGB HUB', 32, 82);
  hcctx.fillStyle = '#38bdf8';
  hcctx.font = 'bold 15px monospace';
  hcctx.fillText('6x 4-PIN PWM FAN   |   6x 3-PIN 5V ADDR RGB', 32, 112);

  for (let p = 0; p < 6; p++) {
    const px = 36 + p * 74;
    hcctx.fillStyle = '#0f172a';
    hcctx.fillRect(px, 134, 58, 42);
    hcctx.strokeStyle = '#94a3b8';
    hcctx.lineWidth = 2;
    hcctx.strokeRect(px, 134, 58, 42);

    hcctx.fillStyle = '#10b981';
    hcctx.beginPath();
    hcctx.arc(px + 14, 155, 5, 0, Math.PI * 2);
    hcctx.fill();

    hcctx.fillStyle = '#f8fafc';
    hcctx.font = 'bold 12px monospace';
    hcctx.fillText(`CH_${p + 1}`, px + 24, 160);
  }

  hcctx.fillStyle = '#cbd5e1';
  hcctx.font = 'bold 13px monospace';
  hcctx.fillText('SATA 12V/5V PWR  ·  USB 2.0 HEADER  ·  TEMP PROBE', 32, 218);

  const argbControllerHubTop = registerColor(hubCtrlCanvas);

  // =========================================================================
  // 29. GPU 12-LAYER PCB COPPER TRACES & VRAM PAD SILKSCREEN (1024x512)
  // =========================================================================
  const gpuPcbCanvas = document.createElement('canvas');
  gpuPcbCanvas.width = 1024;
  gpuPcbCanvas.height = 512;
  const gpctx = gpuPcbCanvas.getContext('2d')!;

  gpctx.fillStyle = '#060a12';
  gpctx.fillRect(0, 0, 1024, 512);

  gpctx.strokeStyle = '#f59e0b';
  gpctx.lineWidth = 2.2;
  for (let t = 0; t < 56; t++) {
    const ang = (t / 56) * Math.PI * 2;
    const x0 = 420 + Math.cos(ang) * 45;
    const y0 = 256 + Math.sin(ang) * 45;
    const x1 = 420 + Math.cos(ang) * 205;
    const y1 = 256 + Math.sin(ang) * 172;
    gpctx.beginPath();
    gpctx.moveTo(x0, y0);
    gpctx.lineTo(x1, y1);
    gpctx.stroke();
  }

  // High-current copper power plane buses on the right for 24-phase VRM
  for (let py = 45; py < 465; py += 22) {
    gpctx.fillStyle = '#d97706';
    gpctx.fillRect(675, py, 270, 9);
    gpctx.fillStyle = '#fef08a';
    gpctx.beginPath();
    gpctx.arc(692, py + 4.5, 3.5, 0, Math.PI * 2);
    gpctx.arc(925, py + 4.5, 3.5, 0, Math.PI * 2);
    gpctx.fill();
  }

  for (let gx = 120; gx < 620; gx += 8) {
    if (gx > 210 && gx < 230) continue;
    gpctx.fillStyle = '#fbbf24';
    gpctx.fillRect(gx, 474, 5, 36);
  }

  gpctx.fillStyle = '#f8fafc';
  gpctx.font = 'bold 16px monospace';
  gpctx.fillText('AD102 / GB202 · 12-LAYER HIGH-TG STEALTH PCB · 24GB GDDR6X', 56, 36);
  gpctx.fillText('24+4 PHASE SUPER ALLOY POWER III VRM', 640, 36);

  const gpuPcbTraces = registerColor(gpuPcbCanvas);

  // =========================================================================
  // 30. SMARTPHONE 12-LAYER L-SHAPED SLP/HDI LOGIC BOARD (512x1024)
  // =========================================================================
  const phBoardCanvas = document.createElement('canvas');
  phBoardCanvas.width = 512;
  phBoardCanvas.height = 1024;
  const pbctx = phBoardCanvas.getContext('2d')!;
  pbctx.fillStyle = '#070a10';
  pbctx.fillRect(0, 0, 512, 1024);
  pbctx.fillStyle = '#0c1322';
  pbctx.fillRect(14, 14, 484, 996);

  // Fine gold & copper microvia HDI bus lines
  pbctx.lineWidth = 2;
  for (let i = 0; i < 48; i++) {
    pbctx.strokeStyle = i % 3 === 0 ? '#f59e0b' : '#b45309';
    pbctx.beginPath();
    pbctx.moveTo(30 + (i % 16) * 28, 30);
    pbctx.lineTo(30 + (i % 16) * 28, 990);
    pbctx.stroke();
  }
  for (let y = 40; y < 980; y += 22) {
    pbctx.strokeStyle = y % 44 === 0 ? '#fbbf24' : '#334155';
    pbctx.beginPath();
    pbctx.moveTo(24, y);
    pbctx.lineTo(488, y);
    pbctx.stroke();
  }

  // Stainless steel EMI Shield Cans etched on board
  [
    { x: 40, y: 50, w: 430, h: 210, title: 'SHIELD_RF_MMWAVE // PMIC_8550' },
    { x: 40, y: 290, w: 430, h: 250, title: 'SOC_3NM_BAY // POP_LPDDR5X_16G' },
    { x: 40, y: 570, w: 430, h: 190, title: 'UFS4_0_1TB // INLINE_CRYPTO' },
    { x: 40, y: 790, w: 430, h: 180, title: '5G_RFFE_MODEM // WIFI7_BE' },
  ].forEach((can) => {
    drawBrushedMetalGrain(pbctx, can.x, can.y, can.w, can.h, ['#1e293b', '#334155', '#0f172a']);
    pbctx.strokeStyle = '#94a3b8';
    pbctx.lineWidth = 4;
    pbctx.strokeRect(can.x, can.y, can.w, can.h);
    pbctx.fillStyle = '#f8fafc';
    pbctx.font = 'bold 16px monospace';
    pbctx.fillText(can.title, can.x + 18, can.y + 34);
  });

  // Gold Board-to-Board (B2B) micro-connectors along edge
  for (let by = 80; by <= 900; by += 135) {
    pbctx.fillStyle = '#090d16';
    pbctx.fillRect(18, by, 34, 86);
    pbctx.strokeStyle = '#fbbf24';
    pbctx.lineWidth = 3;
    pbctx.strokeRect(18, by, 34, 86);
    for (let py = by + 6; py < by + 80; py += 6) {
      pbctx.fillStyle = '#fde047';
      pbctx.fillRect(22, py, 26, 3);
    }
  }
  const phoneBoardAlbedo = registerColor(phBoardCanvas);

  // =========================================================================
  // 31. SMARTPHONE 3nm FLAGSHIP SoC + PoP LPDDR5X PACKAGE TOP (512x512)
  // =========================================================================
  const phSocCanvas = document.createElement('canvas');
  phSocCanvas.width = 512;
  phSocCanvas.height = 512;
  const psocCtx = phSocCanvas.getContext('2d')!;
  drawBrushedMetalGrain(psocCtx, 0, 0, 512, 512, ['#0f172a', '#1e293b', '#090d16']);
  psocCtx.strokeStyle = '#fbbf24';
  psocCtx.lineWidth = 10;
  psocCtx.strokeRect(14, 14, 484, 484);

  psocCtx.fillStyle = '#38bdf8';
  psocCtx.font = 'bold 24px monospace';
  psocCtx.fillText('FLAGSHIP MOBILE SILICON', 48, 92);
  psocCtx.fillStyle = '#ffffff';
  psocCtx.font = 'bold 42px sans-serif';
  psocCtx.fillText('SNAPDRAGON // A18 PRO', 48, 150);
  psocCtx.fillStyle = '#fbbf24';
  psocCtx.font = 'bold 24px monospace';
  psocCtx.fillText('3nm EUV (N3E) · 24B TRANSISTORS', 48, 204);
  psocCtx.fillStyle = '#cbd5e1';
  psocCtx.font = 'bold 20px monospace';
  psocCtx.fillText('CPU: 8-CORE PRIME 4.32 GHz', 48, 258);
  psocCtx.fillText('GPU: HARDWARE RAYTRACING', 48, 294);
  psocCtx.fillText('NPU: 80 TOPS INT4 AI ENGINE', 48, 330);
  psocCtx.fillText('PoP: 16GB LPDDR5X-9600', 48, 366);

  // Pin-1 Gold Corner Marker
  psocCtx.fillStyle = '#fbbf24';
  psocCtx.beginPath();
  psocCtx.moveTo(28, 484);
  psocCtx.lineTo(84, 484);
  psocCtx.lineTo(28, 428);
  psocCtx.closePath();
  psocCtx.fill();
  const phoneSocTop = registerColor(phSocCanvas);

  // =========================================================================
  // 32. SMARTPHONE 5500mAh SILICON-CARBON POUCH BATTERY LABEL (512x1024)
  // =========================================================================
  const phBattCanvas = document.createElement('canvas');
  phBattCanvas.width = 512;
  phBattCanvas.height = 1024;
  const pbtCtx = phBattCanvas.getContext('2d')!;
  drawBrushedMetalGrain(pbtCtx, 0, 0, 512, 1024, ['#0d131f', '#1a2436', '#090d16']);
  pbtCtx.strokeStyle = '#334155';
  pbtCtx.lineWidth = 10;
  pbtCtx.strokeRect(12, 12, 488, 1000);

  // Green/Cyan Easy-Pull Tab strip along left edge
  pbtCtx.fillStyle = '#10b981';
  pbtCtx.fillRect(24, 140, 26, 740);
  pbtCtx.fillStyle = '#022c22';
  pbtCtx.font = 'bold 16px monospace';
  pbtCtx.save();
  pbtCtx.translate(42, 620);
  pbtCtx.rotate(-Math.PI / 2);
  pbtCtx.fillText('◄ EASY-PULL BATTERY RELEASE TAB ►', 0, 0);
  pbtCtx.restore();

  pbtCtx.fillStyle = '#38bdf8';
  pbtCtx.font = 'bold 22px monospace';
  pbtCtx.fillText('SILICON-CARBON ANODE LI-ION PACK', 72, 110);
  pbtCtx.fillStyle = '#ffffff';
  pbtCtx.font = 'bold 64px sans-serif';
  pbtCtx.fillText('5500 mAh', 72, 190);
  pbtCtx.fillStyle = '#fbbf24';
  pbtCtx.font = 'bold 30px monospace';
  pbtCtx.fillText('21.34 Wh · NOMINAL 3.88V ===', 72, 242);

  pbtCtx.fillStyle = '#cbd5e1';
  pbtCtx.font = 'bold 18px monospace';
  pbtCtx.fillText('CHARGE LIMIT VOLTAGE: 4.48V DC', 72, 305);
  pbtCtx.fillText('65W USB-PD PPS / 25W Qi2 FAST CHARGE', 72, 340);
  pbtCtx.fillText('INTEGRATED DUAL-FET SMART BMS IC', 72, 375);

  pbtCtx.strokeStyle = '#f59e0b';
  pbtCtx.lineWidth = 4;
  pbtCtx.strokeRect(72, 430, 396, 175);
  pbtCtx.fillStyle = '#f59e0b';
  pbtCtx.font = 'bold 20px sans-serif';
  pbtCtx.fillText('⚠ CAUTION / SICHERHEITSHINWEIS', 92, 468);
  pbtCtx.fillStyle = '#e2e8f0';
  pbtCtx.font = 'bold 15px monospace';
  pbtCtx.fillText('DO NOT PUNCTURE, CRUSH, HEAT >60°C', 92, 504);
  pbtCtx.fillText('OR SHORT-CIRCUIT EXTERNAL CONTACTS.', 92, 532);
  pbtCtx.fillText('USE ONLY AUTHORIZED BMS CHARGERS.', 92, 560);

  ['CE', 'UL2054', 'Li-ion 20', 'IEC62133'].forEach((b, idx) => {
    pbtCtx.strokeStyle = '#94a3b8';
    pbtCtx.lineWidth = 3;
    pbtCtx.strokeRect(72 + idx * 102, 660, 88, 48);
    pbtCtx.fillStyle = '#f8fafc';
    pbtCtx.font = 'bold 16px sans-serif';
    pbtCtx.fillText(b, 84 + idx * 102, 690);
  });
  const phoneBatteryTop = registerColor(phBattCanvas);

  // =========================================================================
  // 33. SMARTPHONE 6.8" 120Hz LTPO AMOLED DISPLAY SCREEN (512x1024)
  // =========================================================================
  const phDispCanvas = document.createElement('canvas');
  phDispCanvas.width = 512;
  phDispCanvas.height = 1024;
  const pdsCtx = phDispCanvas.getContext('2d')!;

  const dispGrad = pdsCtx.createLinearGradient(0, 0, 512, 1024);
  dispGrad.addColorStop(0, '#040814');
  dispGrad.addColorStop(0.45, '#0c1938');
  dispGrad.addColorStop(1, '#060b19');
  pdsCtx.fillStyle = dispGrad;
  pdsCtx.fillRect(0, 0, 512, 1024);

  // Subtle cyber-grid wallpaper
  pdsCtx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
  pdsCtx.lineWidth = 1.5;
  for (let gx = 0; gx < 512; gx += 32) {
    pdsCtx.beginPath();
    pdsCtx.moveTo(gx, 0);
    pdsCtx.lineTo(gx, 1024);
    pdsCtx.stroke();
  }
  for (let gy = 0; gy < 1024; gy += 32) {
    pdsCtx.beginPath();
    pdsCtx.moveTo(0, gy);
    pdsCtx.lineTo(512, gy);
    pdsCtx.stroke();
  }

  // Ultra-thin bezel border
  pdsCtx.strokeStyle = '#1e293b';
  pdsCtx.lineWidth = 16;
  pdsCtx.strokeRect(8, 8, 496, 1008);

  // Top Status Bar + Punch-Hole Camera Cutout
  pdsCtx.fillStyle = '#e2e8f0';
  pdsCtx.font = 'bold 18px monospace';
  pdsCtx.fillText('5G+  Wi-Fi 7', 36, 48);
  pdsCtx.fillText('100% ⚡', 402, 48);

  pdsCtx.fillStyle = '#000000';
  pdsCtx.beginPath();
  pdsCtx.arc(256, 44, 18, 0, Math.PI * 2);
  pdsCtx.fill();
  pdsCtx.strokeStyle = '#38bdf8';
  pdsCtx.lineWidth = 2;
  pdsCtx.stroke();

  // Digital Clock & Hardware Telemetry Widget on OLED Screen
  pdsCtx.fillStyle = '#ffffff';
  pdsCtx.textAlign = 'center';
  pdsCtx.font = 'bold 84px sans-serif';
  pdsCtx.fillText('14:45', 256, 195);
  pdsCtx.fillStyle = '#38bdf8';
  pdsCtx.font = 'bold 20px monospace';
  pdsCtx.fillText('LTPO AMOLED · 1–120Hz · 2600 NITS', 256, 238);

  // Telemetry Cards on Screen
  pdsCtx.textAlign = 'left';
  pdsCtx.fillStyle = 'rgba(15, 23, 42, 0.82)';
  pdsCtx.fillRect(44, 290, 424, 165);
  pdsCtx.strokeStyle = '#0284c7';
  pdsCtx.lineWidth = 3;
  pdsCtx.strokeRect(44, 290, 424, 165);
  pdsCtx.fillStyle = '#38bdf8';
  pdsCtx.font = 'bold 19px monospace';
  pdsCtx.fillText('SOC: 3nm 8-CORE @ 4.32 GHz (33°C)', 66, 335);
  pdsCtx.fillStyle = '#10b981';
  pdsCtx.fillText('RAM: 16GB LPDDR5X PoP (76.8 GB/s)', 66, 375);
  pdsCtx.fillStyle = '#f59e0b';
  pdsCtx.fillText('ROM: 1TB UFS 4.0 (4200 MB/s)', 66, 415);

  // Glowing 3D Ultrasonic Fingerprint Scanner Target at lower third
  pdsCtx.strokeStyle = '#06b6d4';
  pdsCtx.lineWidth = 3.5;
  [26, 42, 58, 72].forEach((r) => {
    pdsCtx.beginPath();
    pdsCtx.arc(256, 805, r, 0, Math.PI * 2);
    pdsCtx.stroke();
  });
  pdsCtx.fillStyle = '#67e8f9';
  pdsCtx.textAlign = 'center';
  pdsCtx.font = 'bold 16px monospace';
  pdsCtx.fillText('3D ULTRASONIC TOUCH ID', 256, 908);
  pdsCtx.textAlign = 'left';

  const phoneDisplayScreen = registerColor(phDispCanvas);

  // =========================================================================
  // 34. SMARTPHONE Qi2 / MAGSAFE COPPER INDUCTION COIL & NFC (512x512)
  // =========================================================================
  const phQiCanvas = document.createElement('canvas');
  phQiCanvas.width = 512;
  phQiCanvas.height = 512;
  const pqiCtx = phQiCanvas.getContext('2d')!;
  pqiCtx.fillStyle = '#090d16';
  pqiCtx.fillRect(0, 0, 512, 512);

  // Outer Gold 13.56 MHz NFC Loop traces
  pqiCtx.strokeStyle = '#fbbf24';
  pqiCtx.lineWidth = 4;
  pqiCtx.strokeRect(20, 20, 472, 472);
  pqiCtx.strokeRect(30, 30, 452, 452);

  // N52 MagSafe Neodymium Magnet Ring Segments
  for (let seg = 0; seg < 18; seg++) {
    const a0 = (seg / 18) * Math.PI * 2 + 0.03;
    const a1 = ((seg + 0.78) / 18) * Math.PI * 2;
    pqiCtx.strokeStyle = '#cbd5e1';
    pqiCtx.lineWidth = 22;
    pqiCtx.beginPath();
    pqiCtx.arc(256, 256, 206, a0, a1);
    pqiCtx.stroke();
  }

  // Concentric Litz-Copper Wireless Charging Windings
  for (let r = 68; r <= 172; r += 6) {
    pqiCtx.strokeStyle = r % 12 === 0 ? '#f59e0b' : '#b45309';
    pqiCtx.lineWidth = 4;
    pqiCtx.beginPath();
    pqiCtx.arc(256, 256, r, 0, Math.PI * 2);
    pqiCtx.stroke();
  }

  pqiCtx.fillStyle = '#f8fafc';
  pqiCtx.textAlign = 'center';
  pqiCtx.font = 'bold 20px monospace';
  pqiCtx.fillText('Qi2 25W', 256, 252);
  pqiCtx.fillStyle = '#38bdf8';
  pqiCtx.font = 'bold 15px monospace';
  pqiCtx.fillText('NFC 13.56MHz', 256, 276);
  pqiCtx.textAlign = 'left';

  const phoneQiCoilTop = registerColor(phQiCanvas);

  // =========================================================================
  // 35. SMARTPHONE TRIPLE CAMERA & PERISCOPE TELEPHOTO ISLAND (512x512)
  // =========================================================================
  const phCamCanvas = document.createElement('canvas');
  phCamCanvas.width = 512;
  phCamCanvas.height = 512;
  const pcmCtx = phCamCanvas.getContext('2d')!;
  drawCarbonWeavePattern(pcmCtx, 0, 0, 512, 512, 8);
  pcmCtx.strokeStyle = '#64748b';
  pcmCtx.lineWidth = 10;
  pcmCtx.strokeRect(10, 10, 492, 492);

  pcmCtx.fillStyle = '#f8fafc';
  pcmCtx.font = 'bold 22px monospace';
  pcmCtx.fillText('200MP OIS · 1/1.3"', 255, 125);
  pcmCtx.fillStyle = '#38bdf8';
  pcmCtx.font = 'bold 20px monospace';
  pcmCtx.fillText('5X OPTICAL PERISCOPE', 255, 285);
  pcmCtx.fillStyle = '#f59e0b';
  pcmCtx.font = 'bold 18px monospace';
  pcmCtx.fillText('100X SPACE ZOOM · 8K', 255, 425);

  const phoneCameraIsland = registerColor(phCamCanvas);

  return {
    mainboardAlbedo,
    mainboardBump,
    cpuIhs,
    cpuSubstrate,
    aioPumpDisplay,
    radiatorSidePlate,
    heatsinkFinsAlbedo,
    heatsinkFinsBump,
    ramHeatspreader,
    gpuBackplate,
    gpuShroud,
    psuSideLabel,
    psuModularPanel,
    nvmeLabel,
    sataSsdTop,
    hddTopCover,
    cmosBatteryTop,
    biosChipTop,
    audioChipTop,
    networkChipTop,
    fanHubSticker,
    braidedCableDark,
    braidedCableCyan,
    braidedCableAmber,
    braidedCablePurple,
    laptopBoardAlbedo,
    laptopBatteryTop,
    laptopKeyboardTop,
    laptopScreenDisplay,
    serverBoardAlbedo,
    serverPsuLabel,
    serverDriveCaddyFront,
    serverCpuIhs,
    argbFanDisc,
    ramRgbLightbar,
    gpuSideBadge,
    dustFilterMesh,
    thermalPastePattern,
    argbControllerHubTop,
    gpuPcbTraces,
    carbonFiberWeave,
    brushedGunmetal,
    phoneBoardAlbedo,
    phoneSocTop,
    phoneBatteryTop,
    phoneDisplayScreen,
    phoneQiCoilTop,
    phoneCameraIsland,
    disposeAll: () => {
      allTextures.forEach((t) => t.dispose());
    },
  };
}
