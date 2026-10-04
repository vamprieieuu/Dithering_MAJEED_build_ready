// PiPL resource for the unified Dithering MAJEED effect.
#include "AEConfig.h"
#include "AE_EffectVers.h"
#ifndef AE_OS_WIN
    #include "AE_General.r"
#endif

resource 'PiPL' (16002, "Dithering MAJEED") {
    {
        Kind { AEEffect },
        Name { "Dithering MAJEED" },
        Category { "MAJEED" },
        CodeWin64X86 { "EffectMainDitheringMAJEED" },
        CodeMacIntel64 { "EffectMainDitheringMAJEED" },
        CodeMacARM64 { "EffectMainDitheringMAJEED" },
        AE_PiPL_Version { 2, 0 },
        AE_Effect_Spec_Version { PF_PLUG_IN_VERSION, PF_PLUG_IN_SUBVERS },
        AE_Effect_Version { 525313 },
        AE_Effect_Info_Flags { 0 },
        AE_Effect_Global_OutFlags { 0x02008000 },
        AE_Effect_Global_OutFlags_2 { 0x08001400 },
        AE_Effect_Match_Name { "Dithering MAJEED" },
        AE_Reserved_Info { 0 },
        AE_Effect_Support_URL { "https://example.invalid/majeed" }
    }
};
