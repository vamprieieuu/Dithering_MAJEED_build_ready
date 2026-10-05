#ifndef _H_PARAM_UTILS
#define _H_PARAM_UTILS

#include <AE_Effect.h>
#include <AE_EffectVers.h>
#include <AE_EffectCB.h>
#include <AE_EffectUI.h>
#include <AE_PluginData.h>
#include <string.h>

#ifndef AE_RESERVED_INFO
#define AE_RESERVED_INFO 8
#endif

#ifndef PF_REGISTER_EFFECT
#define PF_REGISTER_EFFECT(IN_PTR, CB_PTR, NAME, MATCH_NAME, CATEGORY, RESERVED_INFO) \
	(*(CB_PTR))((IN_PTR), (const A_u_char*)(NAME), (const A_u_char*)(MATCH_NAME), (const A_u_char*)(CATEGORY), (const A_u_char*)"EffectMain", 0x65464B54, PF_PLUG_IN_VERSION, PF_PLUG_IN_SUBVERS, (RESERVED_INFO))
#endif

#ifndef PF_REGISTER_EFFECT_EXT2
#define PF_REGISTER_EFFECT_EXT2(IN_PTR, CB_PTR, NAME, MATCH_NAME, CATEGORY, RESERVED_INFO, ENTRY_POINT, SUPPORT_URL) \
	(*(CB_PTR))((IN_PTR), (const A_u_char*)(NAME), (const A_u_char*)(MATCH_NAME), (const A_u_char*)(CATEGORY), (const A_u_char*)(ENTRY_POINT), 0x65464B54, PF_PLUG_IN_VERSION, PF_PLUG_IN_SUBVERS, (RESERVED_INFO), (const A_u_char*)(SUPPORT_URL))
#endif

#ifndef PF_STRNNCPY
#define PF_STRNNCPY(DST, SRC, N) \
	do { \
		if ((N) > 0) { \
			strncpy((DST), (SRC), (size_t)(N) - 1); \
			(DST)[(size_t)(N) - 1] = '\0'; \
		} \
	} while (0)
#endif

#define PF_ADD_SLIDER(NAME, VALID_MIN, VALID_MAX, SLIDER_MIN, SLIDER_MAX, DFLT, ID) \
	do { \
		PF_Err priv_err = PF_Err_NONE; \
		def.param_type = PF_Param_SLIDER; \
		PF_STRNNCPY(def.name, (NAME), sizeof(def.name)); \
		def.u.sd.value_str[0] = '\0'; \
		def.u.sd.value_desc[0] = '\0'; \
		def.u.sd.valid_min = (VALID_MIN); \
		def.u.sd.slider_min = (SLIDER_MIN); \
		def.u.sd.valid_max = (VALID_MAX); \
		def.u.sd.slider_max = (SLIDER_MAX); \
		def.u.sd.value = def.u.sd.dephault = (DFLT); \
		def.uu.id = (ID); \
		if ((priv_err = PF_ADD_PARAM(in_data, -1, &def)) != PF_Err_NONE) return priv_err; \
	} while (0)

#define PF_ADD_FIXED(NAME, VALID_MIN, VALID_MAX, SLIDER_MIN, SLIDER_MAX, DFLT, PREC, DISP, FLAGS, ID) \
	do { \
		PF_Err priv_err = PF_Err_NONE; \
		def.param_type = PF_Param_FIX_SLIDER; \
		PF_STRNNCPY(def.name, (NAME), sizeof(def.name)); \
		def.u.fd.value_str[0] = '\0'; \
		def.u.fd.value_desc[0] = '\0'; \
		def.u.fd.valid_min = (PF_Fixed)((VALID_MIN) * 65536.0); \
		def.u.fd.slider_min = (PF_Fixed)((SLIDER_MIN) * 65536.0); \
		def.u.fd.valid_max = (PF_Fixed)((VALID_MAX) * 65536.0); \
		def.u.fd.slider_max = (PF_Fixed)((SLIDER_MAX) * 65536.0); \
		def.u.fd.value = def.u.fd.dephault = (PF_Fixed)((DFLT) * 65536.0); \
		def.u.fd.precision = (A_short)(PREC); \
		def.u.fd.display_flags = (PF_ValueDisplayFlags)(DISP); \
		def.flags |= (FLAGS); \
		def.uu.id = (ID); \
		if ((priv_err = PF_ADD_PARAM(in_data, -1, &def)) != PF_Err_NONE) return priv_err; \
	} while (0)

#define PF_ADD_FLOAT_SLIDER(NAME, VALID_MIN, VALID_MAX, SLIDER_MIN, SLIDER_MAX, CURVE_TOLERANCE, DFLT, PREC, DISP, FLAGS, ID) \
	do { \
		PF_Err priv_err = PF_Err_NONE; \
		def.param_type = PF_Param_FLOAT_SLIDER; \
		PF_STRNNCPY(def.name, (NAME), sizeof(def.name)); \
		def.u.fs_d.valid_min = (PF_FpShort)(VALID_MIN); \
		def.u.fs_d.slider_min = (PF_FpShort)(SLIDER_MIN); \
		def.u.fs_d.valid_max = (PF_FpShort)(VALID_MAX); \
		def.u.fs_d.slider_max = (PF_FpShort)(SLIDER_MAX); \
		def.u.fs_d.value = (PF_FpLong)(DFLT); \
		def.u.fs_d.dephault = (PF_FpShort)(def.u.fs_d.value); \
		def.u.fs_d.curve_tolerance = (PF_FpShort)(CURVE_TOLERANCE); \
		def.u.fs_d.precision = (A_short)(PREC); \
		def.u.fs_d.display_flags = (PF_ValueDisplayFlags)(DISP); \
		def.flags |= (FLAGS); \
		def.uu.id = (ID); \
		if ((priv_err = PF_ADD_PARAM(in_data, -1, &def)) != PF_Err_NONE) return priv_err; \
	} while (0)

#define PF_ADD_FLOAT_SLIDERX(NAME, VALID_MIN, VALID_MAX, SLIDER_MIN, SLIDER_MAX, DFLT, PREC, DISP, FLAGS, ID) \
	PF_ADD_FLOAT_SLIDER(NAME, VALID_MIN, VALID_MAX, SLIDER_MIN, SLIDER_MAX, 0.0f, DFLT, PREC, DISP, FLAGS, ID)

#define PF_ADD_CHECKboXX_IMPL(NAME, PROMPT, DFLT, FLAGS, ID) \
	do { \
		PF_Err priv_err = PF_Err_NONE; \
		def.param_type = PF_Param_CHECKBOX; \
		PF_STRNNCPY(def.name, (NAME), sizeof(def.name)); \
		def.u.bd.u.nameptr = (PROMPT); \
		def.u.bd.value = (PF_ParamValue)(DFLT); \
		def.u.bd.dephault = (PF_Boolean)(def.u.bd.value != 0); \
		def.flags |= (FLAGS); \
		def.uu.id = (ID); \
		if ((priv_err = PF_ADD_PARAM(in_data, -1, &def)) != PF_Err_NONE) return priv_err; \
	} while (0)

#define PF_ADD_CHECKBOX(NAME, PROMPT, DFLT, FLAGS, ID) \
	PF_ADD_CHECKboXX_IMPL(NAME, PROMPT, DFLT, FLAGS, ID)

#define PF_ADD_CHECKBOXX(NAME, DFLT, FLAGS, ID) \
	PF_ADD_CHECKboXX_IMPL(NAME, "", DFLT, FLAGS, ID)

#define PF_ADD_POPUP(NAME, CHOICES, DFLT, STRING, ID) \
	do { \
		PF_Err priv_err = PF_Err_NONE; \
		def.param_type = PF_Param_POPUP; \
		PF_STRNNCPY(def.name, (NAME), sizeof(def.name)); \
		def.u.pd.num_choices = (A_short)(CHOICES); \
		def.u.pd.dephault = (A_short)(DFLT); \
		def.u.pd.value = (PF_ParamValue)def.u.pd.dephault; \
		def.u.pd.u.namesptr = (STRING); \
		def.uu.id = (ID); \
		if ((priv_err = PF_ADD_PARAM(in_data, -1, &def)) != PF_Err_NONE) return priv_err; \
	} while (0)

#define PF_ADD_POPUPX(NAME, CHOICES, DFLT, STRING, FLAGS, ID) \
	do { \
		def.flags |= (FLAGS); \
		PF_ADD_POPUP(NAME, CHOICES, DFLT, STRING, ID); \
	} while (0)

#define PF_ADD_COLOR(NAME, RED, GREEN, BLUE, ID) \
	do { \
		PF_Err priv_err = PF_Err_NONE; \
		def.param_type = PF_Param_COLOR; \
		PF_STRNNCPY(def.name, (NAME), sizeof(def.name)); \
		def.u.cd.value.red = (A_u_char)(RED); \
		def.u.cd.value.green = (A_u_char)(GREEN); \
		def.u.cd.value.blue = (A_u_char)(BLUE); \
		def.u.cd.value.alpha = 255; \
		def.u.cd.dephault = def.u.cd.value; \
		def.uu.id = (ID); \
		if ((priv_err = PF_ADD_PARAM(in_data, -1, &def)) != PF_Err_NONE) return priv_err; \
	} while (0)

#define PF_ADD_ANGLE(NAME, DFLT, ID) \
	do { \
		PF_Err priv_err = PF_Err_NONE; \
		def.param_type = PF_Param_ANGLE; \
		PF_STRNNCPY(def.name, (NAME), sizeof(def.name)); \
		def.u.ad.value = def.u.ad.dephault = (PF_Fixed)((DFLT) * 65536.0); \
		def.uu.id = (ID); \
		if ((priv_err = PF_ADD_PARAM(in_data, -1, &def)) != PF_Err_NONE) return priv_err; \
	} while (0)

#define PF_ADD_TOPIC(NAME, ID) \
	do { \
		PF_Err priv_err = PF_Err_NONE; \
		def.param_type = PF_Param_GROUP_START; \
		PF_STRNNCPY(def.name, (NAME), sizeof(def.name)); \
		def.uu.id = (ID); \
		if ((priv_err = PF_ADD_PARAM(in_data, -1, &def)) != PF_Err_NONE) return priv_err; \
	} while (0)

#define PF_ADD_TOPICX(NAME, FLAGS, ID) \
	do { \
		def.flags |= (FLAGS); \
		PF_ADD_TOPIC(NAME, ID); \
	} while (0)

#define PF_END_TOPIC(ID) \
	do { \
		PF_Err priv_err = PF_Err_NONE; \
		def.param_type = PF_Param_GROUP_END; \
		def.uu.id = (ID); \
		if ((priv_err = PF_ADD_PARAM(in_data, -1, &def)) != PF_Err_NONE) return priv_err; \
	} while (0)

#define PF_ADD_POINT(NAME, X_DFLT, Y_DFLT, RESTRICT_BOUNDS, ID) \
	do { \
		PF_Err priv_err = PF_Err_NONE; \
		def.param_type = PF_Param_POINT; \
		PF_STRNNCPY(def.name, (NAME), sizeof(def.name)); \
		def.u.td.restrict_bounds = (PF_Boolean)(RESTRICT_BOUNDS); \
		def.u.td.x_value = def.u.td.x_dephault = (PF_Fixed)((X_DFLT) * 65536.0); \
		def.u.td.y_value = def.u.td.y_dephault = (PF_Fixed)((Y_DFLT) * 65536.0); \
		def.uu.id = (ID); \
		if ((priv_err = PF_ADD_PARAM(in_data, -1, &def)) != PF_Err_NONE) return priv_err; \
	} while (0)

#define PF_ADD_BUTTON(PARAM_NAME, BUTTON_NAME, PUI_FLAGS, PARAM_FLAGS, ID) \
	do { \
		PF_Err priv_err = PF_Err_NONE; \
		def.param_type = PF_Param_BUTTON; \
		PF_STRNNCPY(def.name, (PARAM_NAME), sizeof(def.name)); \
		def.u.button_d.u.namesptr = (BUTTON_NAME); \
		def.flags = (PARAM_FLAGS); \
		def.ui_flags = (PUI_FLAGS); \
		def.uu.id = (ID); \
		if ((priv_err = PF_ADD_PARAM(in_data, -1, &def)) != PF_Err_NONE) return priv_err; \
	} while (0)

#endif // _H_PARAM_UTILS
