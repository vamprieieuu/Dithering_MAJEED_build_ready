#pragma once
#ifndef PARAM_UTILS_H
#define PARAM_UTILS_H

#include "AE_Effect.h"
#include "AE_Macros.h"

#define PF_ADD_FLOAT_SLIDERX(NAME, VALID_MIN, VALID_MAX, SLIDER_MIN, SLIDER_MAX, DFLT, PREC, DISP, FLAGS, ID) \
	do { \
		AEFX_CLR_STRUCT(def); \
		def.param_type = PF_Param_FLOAT_SLIDER; \
		PF_STRNNCPY(def.name, (NAME), sizeof(def.name)); \
		def.u.fs_d.valid_min = (PF_FpShort)(VALID_MIN); \
		def.u.fs_d.valid_max = (PF_FpShort)(VALID_MAX); \
		def.u.fs_d.slider_min = (PF_FpShort)(SLIDER_MIN); \
		def.u.fs_d.slider_max = (PF_FpShort)(SLIDER_MAX); \
		def.u.fs_d.value = (PF_FpLong)(DFLT); \
		def.u.fs_d.dephault = (PF_FpShort)(DFLT); \
		def.u.fs_d.precision = (A_short)(PREC); \
		def.u.fs_d.display_flags = (PF_ValueDisplayFlags)(DISP); \
		def.u.fs_d.fs_flags = (PF_FSliderFlags)(FLAGS); \
		def.flags = 0; \
		def.uu.id = (ID); \
		if ((err = PF_ADD_PARAM(in_data, -1, &def)) != PF_Err_NONE) return err; \
	} while (0)

#define PF_ADD_CHECKBOX(NAME, STR, DFLT, FLAGS, ID) \
	do { \
		AEFX_CLR_STRUCT(def); \
		def.param_type = PF_Param_CHECKBOX; \
		PF_STRNNCPY(def.name, (NAME), sizeof(def.name)); \
		def.u.bd.value = (A_long)(DFLT); \
		def.u.bd.dephault = (A_long)(DFLT); \
		PF_STRNNCPY(def.u.bd.u.name, (STR), sizeof(def.u.bd.u.name)); \
		def.flags = (FLAGS); \
		def.uu.id = (ID); \
		if ((err = PF_ADD_PARAM(in_data, -1, &def)) != PF_Err_NONE) return err; \
	} while (0)

#define PF_ADD_POPUP(NAME, NUM_CHOICES, DFLT, CHOICES_STR, ID) \
	do { \
		AEFX_CLR_STRUCT(def); \
		def.param_type = PF_Param_POPUP; \
		PF_STRNNCPY(def.name, (NAME), sizeof(def.name)); \
		def.u.pd.num_choices = (A_short)(NUM_CHOICES); \
		def.u.pd.value = (A_long)(DFLT); \
		def.u.pd.dephault = (A_long)(DFLT); \
		def.u.pd.u.namesptr = (CHOICES_STR); \
		def.flags = 0; \
		def.uu.id = (ID); \
		if ((err = PF_ADD_PARAM(in_data, -1, &def)) != PF_Err_NONE) return err; \
	} while (0)

#define PF_ADD_COLOR(NAME, R, G, B, ID) \
	do { \
		AEFX_CLR_STRUCT(def); \
		def.param_type = PF_Param_COLOR; \
		PF_STRNNCPY(def.name, (NAME), sizeof(def.name)); \
		def.u.cd.value.red = (A_u_char)(R); \
		def.u.cd.value.green = (A_u_char)(G); \
		def.u.cd.value.blue = (A_u_char)(B); \
		def.u.cd.value.alpha = 255; \
		def.u.cd.dephault = def.u.cd.value; \
		def.flags = 0; \
		def.uu.id = (ID); \
		if ((err = PF_ADD_PARAM(in_data, -1, &def)) != PF_Err_NONE) return err; \
	} while (0)

#define PF_ADD_ANGLE(NAME, DFLT, ID) \
	do { \
		AEFX_CLR_STRUCT(def); \
		def.param_type = PF_Param_ANGLE; \
		PF_STRNNCPY(def.name, (NAME), sizeof(def.name)); \
		def.u.ad.value = (PF_Fixed)((DFLT) * 65536.0); \
		def.u.ad.dephault = def.u.ad.value; \
		def.flags = 0; \
		def.uu.id = (ID); \
		if ((err = PF_ADD_PARAM(in_data, -1, &def)) != PF_Err_NONE) return err; \
	} while (0)

#define PF_ADD_TOPIC(NAME, ID) \
	do { \
		AEFX_CLR_STRUCT(def); \
		def.param_type = PF_Param_GROUP_START; \
		PF_STRNNCPY(def.name, (NAME), sizeof(def.name)); \
		def.flags = 0; \
		def.uu.id = (ID); \
		if ((err = PF_ADD_PARAM(in_data, -1, &def)) != PF_Err_NONE) return err; \
	} while (0)

#define PF_END_TOPIC(ID) \
	do { \
		AEFX_CLR_STRUCT(def); \
		def.param_type = PF_Param_GROUP_END; \
		def.flags = 0; \
		def.uu.id = (ID); \
		if ((err = PF_ADD_PARAM(in_data, -1, &def)) != PF_Err_NONE) return err; \
	} while (0)

#ifndef PF_STRNNCPY
#define PF_STRNNCPY(DST, SRC, LEN) do { strncpy((DST), (SRC), (LEN) - 1); (DST)[(LEN) - 1] = '\0'; } while (0)
#endif

#undef PF_ADD_CHECKBOX
#define PF_ADD_CHECKBOX(NAME, STR, DFLT, FLAGS, ID) \
	do { \
		AEFX_CLR_STRUCT(def); \
		def.param_type = PF_Param_CHECKBOX; \
		PF_STRNNCPY(def.name, (NAME), sizeof(def.name)); \
		def.u.bd.value = (A_long)(DFLT); \
		def.u.bd.dephault = (A_long)(DFLT); \
		def.u.bd.u.nameptr = (STR); \
		def.flags = (FLAGS); \
		def.uu.id = (ID); \
		if ((err = PF_ADD_PARAM(in_data, -1, &def)) != PF_Err_NONE) return err; \
	} while (0)

#endif // PARAM_UTILS_H

