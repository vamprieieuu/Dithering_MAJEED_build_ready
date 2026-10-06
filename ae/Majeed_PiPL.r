#include "AE_General.r"

resource 'PiPL' (16000) {
    {
        Kind {
            AEEffect
        },
        Name {
            "YMDithers"
        },
        Category {
            "YMDithers"
        },
        CodeWin64X86 {
            "EffectMain"
        },
        AE_PiPL_Version {
            2,
            0
        },
        AE_Effect_Spec_Version {
            13,
            28
        },
        AE_Effect_Version {
            67073 // 1.6.8
        },
        AE_Effect_Info_Flags {
            0
        },
        AE_Effect_Global_OutFlags {
            0x02008004
        },
        AE_Effect_Global_OutFlags_2 {
            0x08001400
        },
        AE_Effect_Match_Name {
            "YMDithers"
        },
        AE_Reserved_Info {
            8
        },
        AE_Effect_Support_URL {
            "https://example.invalid/ymdithers"
        }
    }
};
