#include "AEFX_SuiteHelper.h"

PF_Err AEFX_AcquireSuite(
	PF_InData		*in_data,
	PF_OutData		*out_data,
	const char		*name,
	int32_t			version,
	const char		*error_stringPC0,
	void			**suite)
{
	PF_Err err = PF_Err_NONE;
	SPErr sp_err = kSPNoError;

	if (!in_data || !in_data->pica_basicP || !suite) {
		return PF_Err_BAD_CALLBACK_PARAM;
	}

	sp_err = (*in_data->pica_basicP->AcquireSuite)(name, version, (const void**)suite);
	if (sp_err != kSPNoError || !*suite) {
		err = PF_Err_BAD_CALLBACK_PARAM;
		if (out_data) {
			const char *msg = error_stringPC0 ? error_stringPC0 : "Could not acquire suite.";
			out_data->out_flags |= PF_OutFlag_DISPLAY_ERROR_MESSAGE;
			if (in_data->utils && in_data->utils->ansi.sprintf) {
				(*in_data->utils->ansi.sprintf)(out_data->return_msg, "%s", msg);
			}
		}
	}
	return err;
}

PF_Err AEFX_ReleaseSuite(
	PF_InData		*in_data,
	PF_OutData		*out_data,
	const char		*name,
	int32_t			version,
	const char		*error_stringPC0)
{
	PF_Err err = PF_Err_NONE;
	SPErr sp_err = kSPNoError;
	(void)out_data;
	(void)error_stringPC0;

	if (!in_data || !in_data->pica_basicP) {
		return PF_Err_BAD_CALLBACK_PARAM;
	}

	sp_err = (*in_data->pica_basicP->ReleaseSuite)(name, version);
	if (sp_err != kSPNoError) {
		err = PF_Err_BAD_CALLBACK_PARAM;
	}
	return err;
}

PF_Err AEFX_AcquireDrawbotSuites(
	PF_InData		*in_data,
	PF_OutData		*out_data,
	DRAWBOT_Suites	*suiteP)
{
	PF_Err err = PF_Err_NONE;
	(void)out_data;
	if (!suiteP) {
		return PF_Err_BAD_CALLBACK_PARAM;
	}
	suiteP->drawbot_suiteP = NULL;
	suiteP->supplier_suiteP = NULL;
	suiteP->surface_suiteP = NULL;
	suiteP->path_suiteP = NULL;
	suiteP->pen_suiteP = NULL;
	suiteP->image_suiteP = NULL;

	err = AEFX_AcquireSuite(in_data, NULL, kDRAWBOT_DrawSuite, kDRAWBOT_DrawSuite_VersionCurrent, NULL, (void**)&suiteP->drawbot_suiteP);
	if (!err) {
		err = AEFX_AcquireSuite(in_data, NULL, kDRAWBOT_SupplierSuite, kDRAWBOT_SupplierSuite_VersionCurrent, NULL, (void**)&suiteP->supplier_suiteP);
	}
	if (!err) {
		err = AEFX_AcquireSuite(in_data, NULL, kDRAWBOT_SurfaceSuite, kDRAWBOT_SurfaceSuite_VersionCurrent, NULL, (void**)&suiteP->surface_suiteP);
		if (err || !suiteP->surface_suiteP) {
			err = AEFX_AcquireSuite(in_data, NULL, kDRAWBOT_SurfaceSuite, kDRAWBOT_SurfaceSuite_Version1, NULL, (void**)&suiteP->surface_suiteP);
		}
	}
	if (!err) {
		err = AEFX_AcquireSuite(in_data, NULL, kDRAWBOT_PathSuite, kDRAWBOT_PathSuite_VersionCurrent, NULL, (void**)&suiteP->path_suiteP);
	}
	return err;
}

PF_Err AEFX_ReleaseDrawbotSuites(
	PF_InData		*in_data,
	PF_OutData		*out_data)
{
	PF_Err err = PF_Err_NONE;
	(void)out_data;
	AEFX_ReleaseSuite(in_data, NULL, kDRAWBOT_DrawSuite, kDRAWBOT_DrawSuite_VersionCurrent, NULL);
	AEFX_ReleaseSuite(in_data, NULL, kDRAWBOT_SupplierSuite, kDRAWBOT_SupplierSuite_VersionCurrent, NULL);
	if (AEFX_ReleaseSuite(in_data, NULL, kDRAWBOT_SurfaceSuite, kDRAWBOT_SurfaceSuite_VersionCurrent, NULL) != PF_Err_NONE) {
		AEFX_ReleaseSuite(in_data, NULL, kDRAWBOT_SurfaceSuite, kDRAWBOT_SurfaceSuite_Version1, NULL);
	}
	AEFX_ReleaseSuite(in_data, NULL, kDRAWBOT_PathSuite, kDRAWBOT_PathSuite_VersionCurrent, NULL);
	return err;
}
