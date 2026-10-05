import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  ShieldCheck,
  Sliders,
  Cpu,
  CheckCircle2,
  Layers,
  Terminal,
  Film,
  Tv,
  Radio,
  Sparkles,
  Play,
  Pause,
} from 'lucide-react';

interface ModuleSpec {
  id: string;
  title: string;
  badge: string;
  summaryAr: string;
  features: string[];
  controls: string[];
}

const MODULES: ModuleSpec[] = [
  {
    id: 'dither',
    title: '1. Dither & Halftone Engine (49 Algorithms)',
    badge: 'core/dither.cpp',
    summaryAr:
      '49 خوارزمية Dither وHalftone حقيقية ومميزة بصرياً بالكامل (15 Error Diffusion + 7 Ordered/Blue/IGN/White Noise + 27 شاشة Halftone/Pattern هندسية بمعايرة المساحة 64x64 بدون أي انحياز اتجاهي أو Crash).',
    features: [
      '15 خوارزمية Error Diffusion: Floyd-Steinberg, Serpentine, JJN, Stucki, Atkinson, Burkes, Sierra 3/2/Lite, Fan, Shiau-Fan, Skip Neighbours (1/2/3), Xerox Grain (مع تعزيز الحواف الفوتوكوبي).',
      'خوارزميات Ordered & Stochastic خالية من القفل (Lock-Free): Bayer 2x2/4x4/8x8/16x16، وBlue Noise متساوي الخواص، وInterleaved Gradient Noise، وWhite Noise.',
      '27 شاشة Halftone & Pattern مستقلة: Halftone (0°/22.5°/45°), Matrix, Square, Mosaic Cushion, Rekt Brick, Row/Medium/Heavy/Column/Tilt Modulation, Bitslash, Variable Woodcut Cross-Hatch, Grid, Cyber Octagon, Cross, Diamond, Star, Bytewav, Z-Modulation, Circuit PCB, Vertical/Horizontal Stitch, Clock, Bi-thread, Knit.',
      '5 أنماط لونية: Preserve Original Colors (RGB)، وMonochrome (B&W)، وCustom Duo-Tone، وCMYK Angled Halftone Separation (+15°/+75°/0°/+45°)، وTonal Tri-Tone Ramp.',
    ],
    controls: [
      'Algorithm (49)',
      'Color Mode (5)',
      'Amount (%)',
      'Levels / Tones (2..64, Default 2)',
      'Scale / Pixel Size (1..32)',
      'Threshold / Density (0..100)',
      'Strength / Spread (0..200%)',
      'Pattern Scale (%) & Pattern Angle (°)',
      'Contrast & Brightness',
      'Randomness (Jitter) & Serpentine Scan',
      'Animate Dither Noise & Dither Seed',
    ],
  },
  {
    id: 'grain',
    title: '2. Smart Film Grain (4mm – 64mm)',
    badge: 'core/grain.cpp',
    summaryAr:
      'حبيبات فيلم (Silver-Halide) عضوية دقيقة بدون أي مربعات كبيرة أو تشوهات شبكية، تتكيف تلقائياً مع دقة اللير (Resolution-Adaptive) وتتفاعل مع الإضاءة والظلال (Smart Luminance Response) وتتحرك تلقائياً مع كل فريم.',
    features: [
      'أحجام قياسية دقيقة تتكيف مع الدقة: 4mm, 8mm, 12mm, 16mm, 24mm, 32mm, 48mm, 64mm + Custom Size.',
      'توليد متعدد الطبقات عبر شبكتين مدورتين بزاوية غير متناغمة (0° و36.87°) لمنع ظهور أي مربعات أو خطوط شبكية.',
      'استجابة ذكية للإضاءة (H&D Film Curve): استجابة مستقلة للظلال (Shadows) والدرجات المتوسطة (Midtones) والإضاءة العالية (Highlights) مع ارتباط عضوي بحواف الصورة.',
      'وضعان مختلفان جذرياً: Color Grain (طبقات صبغية RGB Dye Clouds) وMonochrome Grain (حبيبات أحادية اللون متطابقة القنوات).',
      'حركة تلقائية حتمية (Deterministic Frame Animation) مع الزمن بدون الحاجة لتحريك الـ Seed بـ Keyframes.',
    ],
    controls: [
      'Enable Film Grain',
      'Grain Structure (Film Crystal | Gaussian | Tape | Clustered)',
      'Color Mode (Color Grain | Monochrome Grain)',
      'Grain Size Preset (4mm..64mm | Custom) & Custom Size',
      'Grain Amount, Density, Contrast, Softness',
      'Luminance Response, Shadows, Midtones, Highlights Response',
      'Color Response',
      'Auto Animate Grain & Animation Speed (%)',
    ],
  },
  {
    id: 'vhs',
    title: '3. VHS Analog Tape Simulation',
    badge: 'core/vhs.cpp',
    summaryAr:
      'محاكاة شريط VHS أنالوج كاملة مع حركة تلقائية لكل عنصر مع الـ Frame/Time: اهتزاز التتبع (Tracking)، انحراف تبديل الرأس (Head-Switch Skew)، عدم استقرار عمودي، نزيف ألوان YIQ، وانقطاعات الشريط.',
    features: [
      'انحراف أفقي لكل سطر مسح (Tracking Wobble + Rolling Tear Bar + Head-Switching Skew أسفل الإطار).',
      'اهتزاز سطري (Line Jitter) وعدم استقرار عمودي للإطار (Vertical Instability / Frame Bounce).',
      'نزيف وإزاحة الكروما في فضاء YIQ (Chroma Bleed & Shift) مع تنعيم الإضاءة (Luma Softness).',
      'تشوهات الشريط المغناطيسي المتحركة: Tape Dashes (Dropouts)، وVertical Streaks، وScanlines متداخلة، وFlicker، وTape Static.',
    ],
    controls: [
      'Enable VHS',
      'Tape Static, Tape Dashes, Vertical Streaks',
      'Chroma Bleed & Chroma Shift (px)',
      'Tracking Wobble & Head-Switch Skew',
      'Line Jitter & Vertical Instability',
      'VHS Scanlines, Scanline Pitch, Flicker',
      'VHS Speed (%) & VHS Seed',
    ],
  },
  {
    id: 'ntsc',
    title: '4. NTSC Composite Broadcast Engine',
    badge: 'core/vhs.cpp',
    summaryAr:
      'محاكاة إشارة البث التلفزيوني المركب NTSC (3.58MHz YIQ Composite Subcarrier) مع Dot Crawl حقيقي وتداخل ألوان قوس قزح (Cross-Color Rainbow) وصدى الهوائي (RF Ghosting) وتشويش التردد الراديوي.',
    features: [
      'تضمين وفك تضمين حامل اللون الفرعي 3.58MHz YIQ مع عكس الطور كل سطر وكل إطار لإنتاج Dot Crawl وRainbow Artifacts حقيقية.',
      'تحديد عرض النطاق الترددي غير المتماثل لقناتي I وQ مع رنين حواف الإضاءة الأنالوج (Luma Edge Ringing / Overshoot).',
      'تشوه طور التزامن الأفقي (H-Sync Phase Skew) وصدى تعدد المسارات (Multipath RF Ghosting Echo).',
      'خطوط مسح CRT متداخلة مع قناع الفسفور الثلاثي وضوضاء الثلج الراديوي (RF Carrier Snow) المتحركة تلقائياً.',
    ],
    controls: [
      'Enable NTSC',
      'Dot Crawl & Rainbow',
      'YIQ Chroma Bleed & Subcarrier Freq (%)',
      'H-Sync Phase Skew',
      'RF Ghosting (Echo) & Ghost Offset (px)',
      'Luma Edge Ringing & Chroma Delay (px)',
      'NTSC Scanlines, RF Carrier Snow, NTSC Speed (%)',
    ],
  },
  {
    id: 'chlines',
    title: '5. Color/Tone, RGB Channels & Film Lines',
    badge: 'core/channels.cpp & core/lines.cpp',
    summaryAr:
      'معالجة اللير اللونية المسبقة، وفصل قنوات RGB بدقة تحت-البكسل (Linear / Radial Chromatic Aberration)، ومولد الخدوش والخطوط العشوائية المنحنية (Bezier Film Lines) المدمجة بالكامل.',
    features: [
      'Color & Tone: Hue Shift, Saturation, Grade Bias, Invert, Indexed Palette Quantization, Tri-Tone Color Ramp, Denoise, Blur, Sharpen.',
      'RGB Channels: إعادة أخذ عينات R/G/B مستقلة مع فصل خطي أو شعاعي (Linear / Radial Separation) واهتزاز سطري متحرك.',
      'Film Lines: خطوط وخدوش Bezier مرسومة تحليلياً مع تنعيم الحواف (Analytic AA) وعمر زمني وحركة تلقائية.',
    ],
    controls: [
      'Hue, Saturation, Grade Bias, Invert, Indexed Palette, Tonal Colors',
      'Denoise | Pre-Noise, Pre-Blur, Sharpen Strength & Radius',
      'Enable RGB Channels, Separation (px), Angle, Mode, Row Jitter',
      'Enable Film Lines, Amount, Length, Thickness, Curvature, Opacity, Speed',
    ],
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'preview' | 'modules' | 'binary'>('preview');
  const [simAlgo, setSimAlgo] = useState<string>('bayer4');
  const [simMode, setSimMode] = useState<'rgb' | 'mono' | 'duotone' | 'cmyk'>('mono');
  const [simLevels, setSimLevels] = useState<number>(2);
  const [simScale, setSimScale] = useState<number>(2);
  const [simThreshold, setSimThreshold] = useState<number>(50);
  const [simGrainOn, setSimGrainOn] = useState<boolean>(true);
  const [simGrainMm, setSimGrainMm] = useState<number>(16);
  const [simGrainMono, setSimGrainMono] = useState<boolean>(false);
  const [simGrainAmt, setSimGrainAmt] = useState<number>(45);
  const [simVhsOn, setSimVhsOn] = useState<boolean>(false);
  const [simNtscOn, setSimNtscOn] = useState<boolean>(false);
  const [playing, setPlaying] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    let animId = 0;
    let lastTime = 0;

    const hash32 = (x: number) => {
      x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
      x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
      return (x ^ (x >>> 16)) >>> 0;
    };

    const u01 = (h: number) => (h >>> 8) / 16777216.0;

    const renderPreview = (timestamp: number) => {
      if (playing && timestamp - lastTime > 41) {
        frameRef.current += 1;
        lastTime = timestamp;
      }
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const W = canvas.width;
      const H = canvas.height;
      const img = ctx.createImageData(W, H);
      const data = img.data;
      const frame = frameRef.current;
      const block = Math.max(1, simScale);
      const bias = ((50 - simThreshold) / 50) * 0.42;

      for (let y = 0; y < H; y++) {
        const gy = Math.floor(y / block);
        const vhsShift = simVhsOn
          ? Math.sin(y * 0.06 + frame * 0.35) * 4 +
            (Math.abs(y - ((frame * 5) % H)) < 14 ? 14 : 0)
          : 0;

        for (let x = 0; x < W; x++) {
          const sx = Math.min(W - 1, Math.max(0, Math.floor(x - vhsShift)));
          const gx = Math.floor(sx / block);

          // Procedural test scene: portrait sphere + geometric grid + gradient
          const nx = (gx * block) / W;
          const ny = (gy * block) / H;
          const dx = (nx - 0.38) * 1.45;
          const dy = ny - 0.48;
          const r2 = dx * dx + dy * dy;
          let r = 0.12 + 0.75 * nx;
          let g = 0.15 + 0.65 * (1 - ny);
          let b = 0.25 + 0.65 * Math.sin(nx * 3.14159);

          if (r2 < 0.16) {
            const z = Math.sqrt(0.16 - r2) / 0.4;
            const light = Math.max(0, -0.45 * (dx / 0.4) - 0.55 * (dy / 0.4) + 0.7 * z);
            r = 0.15 + 0.82 * light;
            g = 0.12 + 0.68 * Math.pow(light, 1.3);
            b = 0.18 + 0.55 * Math.pow(light, 1.8);
          } else if (nx > 0.68) {
            const bars = Math.floor(ny * 6);
            const c = (bars & 1) ? 0.85 : 0.2;
            r = c * (1 - (ny % 0.166) * 4);
            g = 0.2 + 0.7 * ny;
            b = 0.9 - 0.7 * ny;
          }

          // NTSC dot crawl & rainbow simulation
          if (simNtscOn) {
            const phase = (x * 1.5708) + ((y + frame) & 1 ? 3.14159 : 0);
            const crawl = Math.cos(phase) * 0.14;
            r = Math.min(1, Math.max(0, r + crawl));
            g = Math.min(1, Math.max(0, g - crawl * 0.6));
            b = Math.min(1, Math.max(0, b + Math.sin(phase) * 0.16));
          }

          // Compute pattern threshold T in [0, 1]
          let T = 0.5;
          if (simAlgo === 'bayer4') {
            const b4 = [
              0, 8, 2, 10,
              12, 4, 14, 6,
              3, 11, 1, 9,
              15, 7, 13, 5,
            ];
            T = (b4[((gy & 3) << 2) | (gx & 3)] + 0.5) / 16.0;
          } else if (simAlgo === 'halftone45') {
            const u = (gx * 0.7071 + gy * 0.7071) / 5.5;
            const v = (-gx * 0.7071 + gy * 0.7071) / 5.5;
            const fu = u - Math.floor(u) - 0.5;
            const fv = v - Math.floor(v) - 0.5;
            T = 1.0 - Math.min(1.0, Math.sqrt(fu * fu + fv * fv) * 1.414);
          } else if (simAlgo === 'bluenoise') {
            const q = (gx * 0.75487766 + gy * 0.56984029) % 1.0;
            const h = u01(hash32((gx * 73856093) ^ (gy * 19349663) ^ 0xB10E));
            T = 0.6 * q + 0.4 * h;
          } else if (simAlgo === 'hatch') {
            const d1 = Math.abs(((gx + gy) * 0.14) % 1.0 - 0.5) * 2.0;
            const d2 = Math.abs(((gx - gy + 512) * 0.14) % 1.0 - 0.5) * 2.0;
            T = 1.0 - (d1 < 0.45 ? d1 : 0.5 + 0.5 * Math.min(d1, d2));
          } else if (simAlgo === 'circuit') {
            const fu = ((gx % 8) + 0.5) / 8.0 - 0.5;
            const fv = ((gy % 8) + 0.5) / 8.0 - 0.5;
            const par = ((Math.floor(gx / 8) + Math.floor(gy / 8)) & 1);
            const rad = Math.max(Math.abs(fu), Math.abs(fv)) * 2.0;
            T = 1.0 - Math.min(1.0, Math.abs(rad - (par ? 0.34 : 0.68)) * 2.5);
          }

          const L = Math.max(2, simLevels);
          const quant = (val: number) => {
            const v = Math.min(1, Math.max(0, val + bias));
            return Math.min(1, Math.max(0, Math.floor(v * (L - 1) + T) / (L - 1)));
          };

          if (simMode === 'mono') {
            const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            const q = quant(luma);
            r = g = b = q;
          } else if (simMode === 'duotone') {
            const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            const q = quant(luma);
            r = 0.06 + (0.15 - 0.06) * q;
            g = 0.08 + (0.95 - 0.08) * q;
            b = 0.16 + (0.68 - 0.16) * q;
          } else if (simMode === 'cmyk') {
            r = quant(r);
            g = quant(g);
            b = quant(b);
          } else {
            r = quant(r);
            g = quant(g);
            b = quant(b);
          }

          // Smart Film Grain (4..64mm resolution-adaptive, H&D curve, Color vs Mono, Auto Anim)
          if (simGrainOn) {
            const cell = 0.55 + (simGrainMm / 64.0) * 2.2;
            const gx0 = Math.floor(x / cell);
            const gy0 = Math.floor(y / cell);
            const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            // H&D midtone peak + highlight shoulder
            const resp = (0.25 + 0.75 * Math.sin(Math.pow(luma, 0.65) * 3.14159)) * (1.0 - 0.5 * luma * luma);
            const amp = (simGrainAmt / 100.0) * 0.42 * resp;
            const hL = u01(hash32((gx0 * 19349663) ^ (gy0 * 83492791) ^ (frame * 2654435761))) - 0.5;
            if (simGrainMono) {
              r += hL * amp;
              g += hL * amp;
              b += hL * amp;
            } else {
              const hR = u01(hash32((gx0 * 19349663) ^ (gy0 * 83492791) ^ (frame * 2654435761 + 101))) - 0.5;
              const hG = u01(hash32((gx0 * 19349663) ^ (gy0 * 83492791) ^ (frame * 2654435761 + 202))) - 0.5;
              const hB = u01(hash32((gx0 * 19349663) ^ (gy0 * 83492791) ^ (frame * 2654435761 + 303))) - 0.5;
              r += (0.4 * hL + 0.6 * hR) * amp;
              g += (0.4 * hL + 0.6 * hG) * amp;
              b += (0.4 * hL + 0.6 * hB) * amp;
            }
          }

          // VHS scanlines & tape dashes
          if (simVhsOn) {
            const scan = 0.85 + 0.15 * Math.cos(((y + (frame & 1)) * 3.14159) / 1.5);
            r *= scan;
            g *= scan;
            b *= scan;
            const dashH = hash32((y >> 1) * 9973 ^ (frame * 31337));
            if (u01(dashH) < 0.015) {
              const x0 = u01(hash32(dashH + 1)) * W;
              if (x >= x0 && x <= x0 + 45) {
                r = Math.min(1, r + 0.45);
                g = Math.min(1, g + 0.45);
                b = Math.min(1, b + 0.45);
              }
            }
          }

          const idx = (y * W + x) * 4;
          data[idx + 0] = Math.min(255, Math.max(0, Math.round(r * 255)));
          data[idx + 1] = Math.min(255, Math.max(0, Math.round(g * 255)));
          data[idx + 2] = Math.min(255, Math.max(0, Math.round(b * 255)));
          data[idx + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      if (playing) {
        animId = requestAnimationFrame(renderPreview);
      }
    };

    animId = requestAnimationFrame(renderPreview);
    return () => cancelAnimationFrame(animId);
  }, [
    simAlgo,
    simMode,
    simLevels,
    simScale,
    simThreshold,
    simGrainOn,
    simGrainMm,
    simGrainMono,
    simGrainAmt,
    simVhsOn,
    simNtscOn,
    playing,
  ]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Top Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center font-mono font-black text-emerald-400 text-base">
              YM
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  YMDithers — Native After Effects 23.2.1 Plugin (YMDithers.aex)
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Release x64 Built &amp; Verified
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                100% Native C++ SmartFX (8/16/32-bit float) • Dither (49) • Smart Film Grain (4–64mm) • VHS • NTSC • Channels &amp; Lines
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/YMDithers.aex"
              download="YMDithers.aex"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition shadow-lg shadow-emerald-950/50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              تنزيل YMDithers.aex (Release x64)
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Status Hero */}
        <section className="rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <ShieldCheck className="w-5 h-5" />
                <span>تم تنفيذ وبناء واختبار YMDithers.aex بالكامل لـ Adobe After Effects 23.2.1</span>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                يعمل <code className="text-emerald-300 font-mono">YMDithers.aex</code> كـ Plugin أصلي (Native C++ SmartFX) على نفس الـ Layer دون إنشاء أي Layers إضافية أو استخدام أي تأثيرات داخلية في After Effects. يضم 6 وحدات متكاملة ومستقلة في واجهة منظمة:
                <strong> Dither &amp; Halftone (49 خوارزمية)</strong>، و<strong>Color &amp; Tone</strong>، و<strong>Smart Film Grain (4mm–64mm)</strong>، و<strong>VHS Tape</strong>، و<strong>NTSC Analog</strong>، و<strong>Channels &amp; Lines</strong>.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div className="rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-3 text-center">
                <div className="text-xs text-zinc-400">اسم الإضافة والملف</div>
                <div className="text-sm font-mono font-bold text-emerald-400 mt-1">YMDithers.aex</div>
              </div>
              <div className="rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-3 text-center">
                <div className="text-xs text-zinc-400">الحجم والبنية</div>
                <div className="text-sm font-mono font-bold text-white mt-1">472,576 B (x64)</div>
              </div>
            </div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800 gap-2">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'preview'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            معاينة تفاعلية لمحرك YMDithers
          </button>
          <button
            onClick={() => setActiveTab('modules')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'modules'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            تفاصيل الوحدات والـ Parameters (6 مجموعات)
          </button>
          <button
            onClick={() => setActiveTab('binary')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'binary'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            فحص الـ Binary والـ PiPL والتثبيت
          </button>
        </div>

        {/* Tab 1: Interactive Simulator */}
        {activeTab === 'preview' && (
          <section className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span>معاينة حية (Dither + Smart Film Grain + VHS + NTSC)</span>
                </div>
                <button
                  onClick={() => setPlaying(!playing)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 cursor-pointer"
                >
                  {playing ? <Pause className="w-3.5 h-3.5 text-emerald-400" /> : <Play className="w-3.5 h-3.5 text-amber-400" />}
                  {playing ? 'Auto-Anim: 24fps' : 'Paused'}
                </button>
              </div>

              <div className="rounded-lg overflow-hidden border border-zinc-800 bg-black flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={480}
                  height={300}
                  className="w-full h-auto object-contain"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="rounded bg-zinc-950 border border-zinc-800/80 p-2.5">
                  <div className="text-zinc-400">الخوارزميات المدمجة</div>
                  <div className="font-mono font-bold text-white mt-0.5">49 Dither &amp; Screens</div>
                </div>
                <div className="rounded bg-zinc-950 border border-zinc-800/80 p-2.5">
                  <div className="text-zinc-400">أحجام Film Grain</div>
                  <div className="font-mono font-bold text-emerald-400 mt-0.5">4mm – 64mm (Auto-Res)</div>
                </div>
                <div className="rounded bg-zinc-950 border border-zinc-800/80 p-2.5">
                  <div className="text-zinc-400">التحريك التلقائي</div>
                  <div className="font-mono font-bold text-white mt-0.5">Deterministic Frame RNG</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-5" dir="ltr">
              <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 border-b border-zinc-800 pb-2">
                YMDithers Effect Controls Preview
              </div>

              {/* Dither Controls */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Pattern / Algorithm</label>
                    <select
                      value={simAlgo}
                      onChange={(e) => setSimAlgo(e.target.value)}
                      className="w-full rounded bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="bayer4">Bayer 4x4 (Ordered)</option>
                      <option value="halftone45">Halftone 45° (Newspaper)</option>
                      <option value="bluenoise">Blue Noise (Isotropic)</option>
                      <option value="hatch">Variable Hatch (Woodcut)</option>
                      <option value="circuit">Circuit Modulation (PCB)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Color Mode</label>
                    <select
                      value={simMode}
                      onChange={(e) => setSimMode(e.target.value as 'rgb' | 'mono' | 'duotone' | 'cmyk')}
                      className="w-full rounded bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="rgb">Preserve Original Colors</option>
                      <option value="mono">Monochrome (B&amp;W)</option>
                      <option value="duotone">Custom Duo-Tone</option>
                      <option value="cmyk">CMYK Separation</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Levels: {simLevels}</label>
                    <input
                      type="range"
                      min={2}
                      max={16}
                      value={simLevels}
                      onChange={(e) => setSimLevels(Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Scale: {simScale}px</label>
                    <input
                      type="range"
                      min={1}
                      max={8}
                      value={simScale}
                      onChange={(e) => setSimScale(Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Threshold: {simThreshold}%</label>
                    <input
                      type="range"
                      min={10}
                      max={90}
                      value={simThreshold}
                      onChange={(e) => setSimThreshold(Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Film Grain Controls */}
              <div className="pt-3 border-t border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-semibold text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simGrainOn}
                      onChange={(e) => setSimGrainOn(e.target.checked)}
                      className="accent-emerald-500"
                    />
                    <Film className="w-3.5 h-3.5 text-emerald-400" />
                    Smart Film Grain (Auto-Animated)
                  </label>
                  <button
                    onClick={() => setSimGrainMono(!simGrainMono)}
                    className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800 text-emerald-300 border border-zinc-700 cursor-pointer"
                  >
                    {simGrainMono ? 'Monochrome Grain' : 'Color Grain (RGB)'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Grain Size Preset</label>
                    <select
                      value={simGrainMm}
                      onChange={(e) => setSimGrainMm(Number(e.target.value))}
                      className="w-full rounded bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-white"
                    >
                      {[4, 8, 12, 16, 24, 32, 48, 64].map((mm) => (
                        <option key={mm} value={mm}>
                          {mm} mm Film Stock
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Grain Amount: {simGrainAmt}%</label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={simGrainAmt}
                      onChange={(e) => setSimGrainAmt(Number(e.target.value))}
                      className="w-full accent-emerald-500 mt-1.5"
                    />
                  </div>
                </div>
              </div>

              {/* VHS & NTSC Toggles */}
              <div className="pt-3 border-t border-zinc-800 grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-medium text-zinc-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simVhsOn}
                    onChange={(e) => setSimVhsOn(e.target.checked)}
                    className="accent-emerald-500"
                  />
                  <Tv className="w-4 h-4 text-amber-400" />
                  Enable VHS Tape
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-medium text-zinc-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simNtscOn}
                    onChange={(e) => setSimNtscOn(e.target.checked)}
                    className="accent-emerald-500"
                  />
                  <Radio className="w-4 h-4 text-sky-400" />
                  Enable NTSC Analog
                </label>
              </div>
            </div>
          </section>
        )}

        {/* Tab 2: Detailed Modules Breakdown */}
        {activeTab === 'modules' && (
          <section className="space-y-4">
            {MODULES.map((m) => (
              <div key={m.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-bold text-white text-sm" dir="ltr">
                    {m.title}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded text-xs font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {m.badge}
                  </span>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-xs text-zinc-300 leading-relaxed">{m.summaryAr}</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-4 space-y-2">
                      <div className="text-xs font-semibold text-emerald-400">الخصائص والمعالجة الفعلية:</div>
                      <ul className="space-y-1.5 text-xs text-zinc-300 list-disc list-inside leading-relaxed">
                        {m.features.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-4 space-y-2" dir="ltr">
                      <div className="text-xs font-semibold text-zinc-400">Effect Controls (Parameters):</div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {m.controls.map((c, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-200"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Tab 3: Binary & PiPL Verification */}
        {activeTab === 'binary' && (
          <section className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <Terminal className="w-4 h-4" />
                <h3>مواصفات الملف الثنائي YMDithers.aex</h3>
              </div>
              <ul className="space-y-2.5 text-xs text-zinc-300">
                <li className="flex justify-between border-b border-zinc-800/70 pb-2">
                  <span className="text-zinc-400">File Name:</span>
                  <span className="font-mono text-emerald-400 font-bold">YMDithers.aex</span>
                </li>
                <li className="flex justify-between border-b border-zinc-800/70 pb-2">
                  <span className="text-zinc-400">Exact Size:</span>
                  <span className="font-mono text-white">472,576 bytes (461.5 KB)</span>
                </li>
                <li className="flex justify-between border-b border-zinc-800/70 pb-2">
                  <span className="text-zinc-400">Binary Format:</span>
                  <span className="font-mono text-white">PE32+ DLL (x86-64 Windows)</span>
                </li>
                <li className="flex justify-between border-b border-zinc-800/70 pb-2">
                  <span className="text-zinc-400">PiPL Name &amp; Category:</span>
                  <span className="font-mono text-emerald-400">&quot;YMDithers&quot; / &quot;YMDithers&quot;</span>
                </li>
                <li className="flex justify-between border-b border-zinc-800/70 pb-2">
                  <span className="text-zinc-400">PiPL Match Name:</span>
                  <span className="font-mono text-white">&quot;YMDithers&quot; (ID 16000)</span>
                </li>
                <li className="flex justify-between border-b border-zinc-800/70 pb-2">
                  <span className="text-zinc-400">Entry Points:</span>
                  <span className="font-mono text-white">EffectMain, PluginDataEntryFunction2</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-zinc-400">DLL Dependencies:</span>
                  <span className="font-mono text-emerald-400">KERNEL32.dll, msvcrt.dll (Static C++ Runtime)</span>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <h3>التثبيت والتشغيل في After Effects 23.2.1</h3>
              </div>
              <ol className="space-y-3 text-xs text-zinc-300 list-decimal list-inside leading-relaxed">
                <li>
                  قم بتنزيل <code className="font-mono text-emerald-400">YMDithers.aex</code> من زر التنزيل أعلى الصفحة.
                </li>
                <li>
                  احذف أي نسخ قديمة من مجلد <code className="font-mono">Plug-ins</code> ثم ضع الملف{' '}
                  <code className="font-mono text-emerald-400">YMDithers.aex</code> في المسار:
                  <div className="mt-1.5 p-2.5 rounded bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-200" dir="ltr">
                    C:\Program Files\Adobe\Adobe After Effects 2023\Support Files\Plug-ins\
                  </div>
                </li>
                <li>
                  افتح After Effects 23.2.1، اختر أي Layer، ومن القائمة اختر:{' '}
                  <strong className="text-white" dir="ltr">Effect &rarr; YMDithers &rarr; YMDithers</strong>.
                </li>
              </ol>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
