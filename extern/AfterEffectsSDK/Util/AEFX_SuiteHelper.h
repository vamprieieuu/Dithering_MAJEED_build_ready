#ifndef _H_AEFX_SUITE_HELPER
#define _H_AEFX_SUITE_HELPER

#include <AE_Effect.h>
#include <AE_EffectCB.h>
#include <AE_EffectCBSuites.h>
#include <AE_EffectSuites.h>
#include <AE_EffectSuitesHelper.h>
#include <AEFX_SuiteHandlerTemplate.h>
#include <SPBasic.h>
#include <SPSuites.h>
#include <adobesdk/DrawbotSuite.h>

#ifndef kPF_WorldSuite
#define kPF_WorldSuite			kPFWorldSuite
#endif
#ifndef kPF_WorldSuiteVersion2
#define kPF_WorldSuiteVersion2	kPFWorldSuiteVersion2
#endif

#ifdef __cplusplus
extern "C" {
#endif

PF_Err AEFX_AcquireSuite(
	PF_InData		*in_data,
	PF_OutData		*out_data,
	const char		*name,
	int32_t			version,
	const char		*error_stringPC0,
	void			**suite);

PF_Err AEFX_ReleaseSuite(
	PF_InData		*in_data,
	PF_OutData		*out_data,
	const char		*name,
	int32_t			version,
	const char		*error_stringPC0);

PF_Err AEFX_AcquireDrawbotSuites(
	PF_InData		*in_data,
	PF_OutData		*out_data,
	DRAWBOT_Suites	*suiteP);

PF_Err AEFX_ReleaseDrawbotSuites(
	PF_InData		*in_data,
	PF_OutData		*out_data);

#ifdef __cplusplus
}
#endif

#endif // _H_AEFX_SUITE_HELPER
