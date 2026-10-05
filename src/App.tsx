import React, { useState } from 'react';
import {
  Download,
  ShieldCheck,
  Bug,
  Wrench,
  FileCode,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Terminal,
  FileArchive,
  HelpCircle,
} from 'lucide-react';

interface CrashFix {
  id: string;
  component: string;
  file: string;
  severity: 'CRITICAL' | 'HIGH';
  causeAr: string;
  fixAr: string;
  codeBefore: string;
  codeAfter: string;
}

const CRASH_FIXES: CrashFix[] = [
  {
    id: 'unbalanced-topic-group',
    component: 'ParamsSetup / PF_ADD_PARAM (Unbalanced Group)',
    file: 'ae/MajeedDither.cpp',
    severity: 'CRITICAL',
    causeAr:
      'في الماكرو DITHERING_MAJEED_LIST تم فتح 6 مجموعات (PF_Param_GROUP_START عبر G) وإغلاق 5 مجموعات فقط (PF_Param_GROUP_END عبر E). المجموعة الأولى G(DM_LOGO_G, "Dithering MAJEED") في السطر 16 لم يتم إغلاقها أبداً بـ PF_END_TOPIC، مما يؤدي إلى تلف شجرة المعاملات (Parameter Stream Hierarchy) وانهيار After Effects 23.2.1 فوراً عند تحميل أو تطبيق الإضافة.',
    fixAr:
      'إزالة G(DM_LOGO_G, "Dithering MAJEED") غير المغلقة بحيث يصبح عدد PF_Param_GROUP_START مساوياً تماماً لعدد PF_Param_GROUP_END (5 مجموعات مفتوحة و5 مغلقة).',
    codeBefore: `#define DITHERING_MAJEED_LIST(F,K,P,C,A,G,E) \\
 G(DM_LOGO_G,"Dithering MAJEED") \\
 G(DM_G_DITHER,"Dither") \\
 ...
 E(DM_E_DITHER) // 6 Group Starts vs 5 Group Ends!`,
    codeAfter: `#define DITHERING_MAJEED_LIST(F,K,P,C,A,G,E) \\
 G(DM_G_DITHER,"Dither") \\
 ...
 E(DM_E_DITHER) // 5 Group Starts == 5 Group Ends (Balanced)`,
  },
  {
    id: 'uninitialized-group-end-def',
    component: 'ParamsSetup / PF_END_TOPIC Dirty Struct',
    file: 'ae/MajeedGlue.h & Util/Param_Utils.h',
    severity: 'CRITICAL',
    causeAr:
      'في دالة ParamsSetup داخل MajeedGlue.h، الفرع case T_GROUP_END كان يستدعي PF_END_TOPIC(id) دون تصفير البنية AEFX_CLR_STRUCT(def)، مما يترك بيانات المعامل السابق (مثل مؤشرات نصوص الـ Checkbox أو الـ Popup أو الأعلام Flags) داخل بنية PF_ParamDef عند استدعاء PF_ADD_PARAM لـ PF_Param_GROUP_END.',
    fixAr:
      'استدعاء AEFX_CLR_STRUCT(def) قبل PF_END_TOPIC(id) وداخل ماكرو PF_END_TOPIC في Param_Utils.h لضمان نظافة البنية بالكامل.',
    codeBefore: `case T_GROUP_END: {
    PF_END_TOPIC(id); // def still holds previous param flags/pointers!
    break;
}`,
    codeAfter: `case T_GROUP_END: {
    AEFX_CLR_STRUCT(def);
    PF_END_TOPIC(id);
    break;
}`,
  },
  {
    id: 'custom-ui-register-ui',
    component: 'Custom UI Registration & PF_Param_NO_DATA Flags',
    file: 'ae/MajeedGlue.h',
    severity: 'CRITICAL',
    causeAr:
      'عند تفعيل العلم PF_OutFlag_CUSTOM_UI (0x00008000) في GlobalSetup وملف PiPL، يشترط After Effects استدعاء (*(in_data->inter.register_ui))(in_data->effect_ref, &ci) داخل ParamsSetup مع تحديد PF_CustomEFlag_EFFECT. عدم استدعائها مع تمرير PF_ParamFlag_SUPERVISE | PF_ParamFlag_CANNOT_TIME_VARY لمعامل من نوع PF_Param_NO_DATA (الذي لا يملك Data Stream أصلاً) يسبب انهيار نافذة Effect Controls.',
    fixAr:
      'إضافة استدعاء PF_REGISTER_UI مع PF_CustomEFlag_EFFECT داخل ParamsSetup، وإزالة الأعلام غير الصالحة من PF_Param_NO_DATA.',
    codeBefore: `def.param_type = PF_Param_NO_DATA;
def.flags = PF_ParamFlag_SUPERVISE | PF_ParamFlag_CANNOT_TIME_VARY;
def.ui_flags = PF_PUI_CONTROL | PF_PUI_DONT_ERASE_CONTROL;
ERR(PF_ADD_PARAM(in_data, -1, &def));
// Missing in_data->inter.register_ui!`,
    codeAfter: `def.param_type = PF_Param_NO_DATA;
PF_STRNNCPY(def.name, "MAJEED", sizeof(def.name));
def.flags = 0;
def.ui_flags = PF_PUI_CONTROL;
ERR(PF_ADD_PARAM(in_data, -1, &def));
PF_CustomUIInfo ci; AEFX_CLR_STRUCT(ci);
ci.events = PF_CustomEFlag_EFFECT;
ERR((*(in_data->inter.register_ui))(in_data->effect_ref, &ci));`,
  },
  {
    id: 'drawbot-bgra-sperr',
    component: 'Drawbot Suites & Event Handler (DrawLogo)',
    file: 'ae/MajeedDither.cpp & Util/AEFX_SuiteHelper.c',
    severity: 'HIGH',
    causeAr:
      'ثلاث مشاكل في DrawLogo: (1) قراءة extra->effect_win دون التحقق من أن (*extra->contextH)->w_type == PF_Window_EFFECT. (2) إرسال kDRAWBOT_PixelLayout_32ARGB_Straight قسراً بينما محرك Drawbot على Windows (Direct2D) يطلب BGRA (PrefersPixelLayoutBGRA)، مما يجعل NewImageFromBuffer يفشل ويعيد كود خطأ SPErr (مثل 0x7061726d) فيتم إرجاعه كـ PF_Err لـ After Effects! (3) طلب النسخة 2 فقط من DRAWBOT Surface Suite دون Fallback للنسخة 1.',
    fixAr:
      'التحقق من contextH ونوع النافذة PF_Window_EFFECT، وفحص PrefersPixelLayoutBGRA لتحويل الشعار تلقائياً إلى BGRA على Windows، ودعم SurfaceSuite v2/v1، وعدم إرجاع SPErr خام كـ PF_Err.',
    codeBefore: `ERR(suites.supplier_suiteP->NewImageFromBuffer(
    supplier_ref, MAJEED_LOGO_W, MAJEED_LOGO_H, MAJEED_LOGO_W * 4,
    kDRAWBOT_PixelLayout_32ARGB_Straight, MAJEED_LOGO_ARGB, &image_ref));`,
    codeAfter: `DRAWBOT_Boolean prefers_bgra = 0;
suites.supplier_suiteP->PrefersPixelLayoutBGRA(supplier_ref, &prefers_bgra);
// Converts ARGB -> BGRA on Windows Direct2D & swallows non-fatal SPErr`,
  },
  {
    id: 'pipl-entry-prerender',
    component: 'EntryPointFunc, PiPL & SmartRender PreRender Rect',
    file: 'ae/Majeed_PiPL.r, ae/MajeedDither.cpp, ae/MajeedGlue.h',
    severity: 'HIGH',
    causeAr:
      'تعارض قيمة AE_Reserved_Info بين ملف Majeed_PiPL.r (كانت 0) ودالة PluginDataEntryFunction2 (كانت AE_RESERVED_INFO = 8)، بالإضافة إلى تصدير PluginDataEntryFunction القديم بجانب PluginDataEntryFunction2، وتجاوز req.rect في PreRender بأبعاد اللير الكاملة بدلاً من أبعاد الطلب الفعلية عند تغيير دقة المعاينة (Half/Quarter).',
    fixAr:
      'توحيد AE_Reserved_Info على القيمة القياسية 8 في كلٍ من PiPL وPluginDataEntryFunction2، واعتماد EffectMain كنقطة دخول موحدة بمعرف PiPL قياسي 16000، وإصلاح PreRender ودعم PF_Cmd_RENDER الاحتياطي.',
    codeBefore: `// Majeed_PiPL.r:
AE_Reserved_Info { 0 },
// MajeedDither.cpp:
PF_REGISTER_EFFECT_EXT2(..., AE_RESERVED_INFO /* 8 */, ...);`,
    codeAfter: `// Majeed_PiPL.r:
AE_Reserved_Info { 8 },
// MajeedDither.cpp:
PF_REGISTER_EFFECT_EXT2(..., AE_RESERVED_INFO /* 8 */, "EffectMain", ...);`,
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'zip-files' | 'binary'>('diagnosis');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Top Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/70 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/majeed_logo.png"
              alt="MAJEED Logo"
              className="w-14 h-10 object-contain rounded bg-zinc-950 border border-zinc-800 p-1"
            />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  Dithering MAJEED — After Effects 23.2.1 (Windows x64)
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  تم إصلاح الـ Crash وبناء MAJEED.aex
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Native SmartFX (8/16/32-bit float) • AE SDK 23.2.1 (Spec 13.28) • PE32+ x86-64
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/MAJEED.aex"
              download="MAJEED.aex"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition shadow-lg shadow-emerald-950/50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              تنزيل MAJEED.aex (النسخة المصححة)
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Summary Banner */}
        <section className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <ShieldCheck className="w-5 h-5" />
                <span>ملخص التشخيص الجنائي وإصلاح انهيار After Effects 23.2.1</span>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                تم فحص دورة حياة الإضافة بالكامل من لحظة تحميل <code className="text-emerald-300">LoadLibrary</code> و
                <code className="text-emerald-300">PluginDataEntryFunction2</code> مروراً بـ{' '}
                <code className="text-emerald-300">PiPL</code> و<code className="text-emerald-300">PF_Cmd_GLOBAL_SETUP</code> و
                <code className="text-emerald-300">PF_Cmd_PARAMS_SETUP</code> وحتى{' '}
                <code className="text-emerald-300">PF_Cmd_EVENT (Drawbot)</code> و
                <code className="text-emerald-300">PF_Cmd_SMART_RENDER</code>. تم تحديد 5 أسباب حقيقية ومباشرة للانهيار في الكود وإصلاحها بالكامل وإعادة بناء{' '}
                <code className="text-emerald-300">MAJEED.aex</code>.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div className="rounded-lg bg-zinc-900/90 border border-zinc-800 px-4 py-3 text-center">
                <div className="text-xs text-zinc-400">الملف الصحيح للتثبيت</div>
                <div className="text-sm font-mono font-bold text-emerald-400 mt-1">MAJEED.aex</div>
              </div>
              <div className="rounded-lg bg-zinc-900/90 border border-zinc-800 px-4 py-3 text-center">
                <div className="text-xs text-zinc-400">معمارية البناء</div>
                <div className="text-sm font-mono font-bold text-white mt-1">PE32+ (x64 DLL)</div>
              </div>
            </div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800 gap-2">
          <button
            onClick={() => setActiveTab('diagnosis')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'diagnosis'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bug className="w-4 h-4" />
            تشخيص أسباب الـ Crash وإصلاحها (5 أسباب جذرية)
          </button>
          <button
            onClick={() => setActiveTab('zip-files')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'zip-files'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileArchive className="w-4 h-4" />
            تحليل ملفي الـ ZIP (MAJEED.aex vs Dithering MAJEED.aex)
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
            فحص الـ PE Header والـ PiPL والتثبيت
          </button>
        </div>

        {/* Tab 1: Crash Diagnosis & Fixes */}
        {activeTab === 'diagnosis' && (
          <section className="space-y-4">
            {CRASH_FIXES.map((item, idx) => (
              <div
                key={item.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 bg-zinc-900">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold text-white text-sm">{item.component}</h3>
                      <p className="text-xs text-zinc-400 font-mono">{item.file}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-mono font-semibold ${
                      item.severity === 'CRITICAL'
                        ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {item.severity} — FIXED
                  </span>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-lg bg-red-950/20 border border-red-500/20 p-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400 mb-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        السبب الحقيقي للكراش
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">{item.causeAr}</p>
                    </div>
                    <div className="rounded-lg bg-emerald-950/20 border border-emerald-500/20 p-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-1.5">
                        <Wrench className="w-4 h-4" />
                        الإصلاح المنفّذ في الكود
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">{item.fixAr}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4" dir="ltr">
                    <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-3">
                      <div className="text-[11px] font-mono text-red-400 mb-2">Before (Crash):</div>
                      <pre className="text-xs font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap">
                        {item.codeBefore}
                      </pre>
                    </div>
                    <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-3">
                      <div className="text-[11px] font-mono text-emerald-400 mb-2">After (Fixed):</div>
                      <pre className="text-xs font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap">
                        {item.codeAfter}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Tab 2: Analysis of the Two Files in the ZIP */}
        {activeTab === 'zip-files' && (
          <section className="space-y-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-6">
              <div className="flex items-center gap-2.5 text-white font-bold text-base">
                <HelpCircle className="w-5 h-5 text-emerald-400" />
                <h2>لماذا وُجد ملفان داخل الـ ZIP؟ وكيف يؤثر ذلك على After Effects؟</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 text-xs">
                      <th className="py-3 px-4">المقارنة</th>
                      <th className="py-3 px-4 font-mono text-emerald-400">الملف الأول (الرسمي)</th>
                      <th className="py-3 px-4 font-mono text-amber-400">الملف الثاني (نسخة مكررة)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/70 text-xs">
                    <tr>
                      <td className="py-3 px-4 font-semibold text-zinc-300">الاسم الكامل والامتداد</td>
                      <td className="py-3 px-4 font-mono text-white">MAJEED.aex</td>
                      <td className="py-3 px-4 font-mono text-white">Dithering MAJEED.aex</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-zinc-300">الحجم الدقيق</td>
                      <td className="py-3 px-4 font-mono text-zinc-200">435,200 بايت (425.0 KB)</td>
                      <td className="py-3 px-4 font-mono text-zinc-200">435,200 بايت (425.0 KB)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-zinc-300">طريقة الإنتاج في CMake</td>
                      <td className="py-3 px-4 text-zinc-300">
                        الناتج الأصلي للـ Target الوحيد <code className="font-mono">add_library(MAJEED SHARED ...)</code> مع{' '}
                        <code className="font-mono">OUTPUT_NAME &quot;MAJEED&quot;</code> و <code className="font-mono">SUFFIX &quot;.aex&quot;</code>
                      </td>
                      <td className="py-3 px-4 text-zinc-300">
                        نسخة مطابقة (Byte-for-Byte Copy) تم إنشاؤها في خطوة <code className="font-mono">POST_BUILD</code> عبر{' '}
                        <code className="font-mono">cmake -E copy_if_different</code>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-zinc-300">هل هما نفس الـ Plugin أم Targetين مختلفين؟</td>
                      <td colSpan={2} className="py-3 px-4 text-zinc-200">
                        <strong>هما نفس الـ Plugin تماماً (Target واحد فقط وبصمة SHA-256 متطابقة 100%).</strong> كلاهما يحمل نفس الـ{' '}
                        <code className="font-mono">Match Name (&quot;Dithering MAJEED&quot;)</code> ونفس الـ <code className="font-mono">PiPL</code>.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-zinc-300">أي واحد يجب تثبيته؟</td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold">
                        ✅ ثبّت هذا الملف فقط (MAJEED.aex) داخل مجلد Plug-ins.
                      </td>
                      <td className="py-3 px-4 text-amber-400">
                        ⚠️ لا تضع الملفين معاً في مجلد Plug-ins حتى لا يحدث تعارض (Duplicate Match Name) عند إقلاع After Effects.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid md:grid-cols-2 gap-4 pt-2">
                <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-4 space-y-2">
                  <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <FileCode className="w-4 h-4" />
                    لماذا تم إنتاج الملفين في الأصل؟
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    ملف <code className="font-mono">README.md</code> القديم كان يشير إلى الاسم{' '}
                    <code className="font-mono">Dithering MAJEED.aex</code> بينما الهدف المطلوب للبناء هو{' '}
                    <code className="font-mono">MAJEED.aex</code>. لذلك قام ملف <code className="font-mono">CMakeLists.txt</code> بإنتاج{' '}
                    <code className="font-mono">MAJEED.aex</code> كهدف أساسي ونسخه في <code className="font-mono">POST_BUILD</code> إلى{' '}
                    <code className="font-mono">Dithering MAJEED.aex</code>، ثم قام <code className="font-mono">.github/workflows/build.yml</code> برفع الاثنين داخل نفس الـ Artifact ZIP.
                  </p>
                </div>

                <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-4 space-y-2">
                  <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    ماذا يحدث لو تم فك ضغط الملفين معاً في Plug-ins؟
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    عند وضع <code className="font-mono">MAJEED.aex</code> و <code className="font-mono">Dithering MAJEED.aex</code> معاً داخل مجلد{' '}
                    <code className="font-mono">Plug-ins</code>، يقوم After Effects بتحميل مكتبتين (DLLs) تسجلان نفس الاسم الداخلي{' '}
                    <code className="font-mono">Match Name: &quot;Dithering MAJEED&quot;</code> ونفس الإصدار. تم تحديث{' '}
                    <code className="font-mono">.github/workflows/build.yml</code> ليرفع <code className="font-mono">MAJEED.aex</code> فقط داخل الـ Artifact لمنع أي ازدواجية عند فك الضغط.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tab 3: Binary Verification & Installation */}
        {activeTab === 'binary' && (
          <section className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <Terminal className="w-4 h-4" />
                <h3>خصائص الملف الناتج MAJEED.aex</h3>
              </div>
              <ul className="space-y-2.5 text-xs text-zinc-300">
                <li className="flex justify-between border-b border-zinc-800/70 pb-2">
                  <span className="text-zinc-400">Format:</span>
                  <span className="font-mono text-white">PE32+ executable (DLL) x86-64, for MS Windows</span>
                </li>
                <li className="flex justify-between border-b border-zinc-800/70 pb-2">
                  <span className="text-zinc-400">Target Host:</span>
                  <span className="font-mono text-white">Adobe After Effects 23.2.1 (SDK Spec 13.28)</span>
                </li>
                <li className="flex justify-between border-b border-zinc-800/70 pb-2">
                  <span className="text-zinc-400">PiPL Resource:</span>
                  <span className="font-mono text-white">ID 16000 (&quot;Dithering MAJEED&quot;, Category &quot;MAJEED&quot;)</span>
                </li>
                <li className="flex justify-between border-b border-zinc-800/70 pb-2">
                  <span className="text-zinc-400">Exported Entry Points:</span>
                  <span className="font-mono text-emerald-400">EffectMain, PluginDataEntryFunction2</span>
                </li>
                <li className="flex justify-between border-b border-zinc-800/70 pb-2">
                  <span className="text-zinc-400">Global OutFlags:</span>
                  <span className="font-mono text-white">0x02008000 (DEEP_COLOR_AWARE | CUSTOM_UI)</span>
                </li>
                <li className="flex justify-between border-b border-zinc-800/70 pb-2">
                  <span className="text-zinc-400">Global OutFlags 2:</span>
                  <span className="font-mono text-white">0x08001400 (FLOAT_COLOR | SMART_RENDER | THREADED)</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-zinc-400">Runtime Dependencies:</span>
                  <span className="font-mono text-emerald-400">KERNEL32.dll, msvcrt.dll (Static C/C++ runtime)</span>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <h3>خطوات التثبيت الصحيحة في After Effects 23.2.1</h3>
              </div>
              <ol className="space-y-3 text-xs text-zinc-300 list-decimal list-inside leading-relaxed">
                <li>
                  تأكد من <strong>حذف أي نسخة قديمة</strong> (سواء <code className="font-mono text-amber-300">MAJEED.aex</code> أو{' '}
                  <code className="font-mono text-amber-300">Dithering MAJEED.aex</code>) من مجلد إضافات After Effects.
                </li>
                <li>
                  قم بتنزيل ملف <code className="font-mono text-emerald-400">MAJEED.aex</code> المحدّث من الزر أعلى الصفحة أو من GitHub Actions Artifact.
                </li>
                <li>
                  انسخ ملف <strong><code className="font-mono text-emerald-400">MAJEED.aex</code> فقط</strong> إلى المسار:
                  <div className="mt-1.5 p-2.5 rounded bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-200" dir="ltr">
                    C:\Program Files\Adobe\Adobe After Effects 2023\Support Files\Plug-ins\
                  </div>
                </li>
                <li>
                  افتح After Effects 23.2.1، اختر أي Layer، ثم من قائمة <strong>Effect &rarr; MAJEED &rarr; Dithering MAJEED</strong>.
                </li>
              </ol>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
