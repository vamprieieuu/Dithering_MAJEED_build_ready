#include <AE_Effect.h>
#include <AE_EffectCB.h>
#include <AE_Macros.h>

#ifdef __cplusplus
extern "C" {
#endif

PF_Err AEFX_ParseFpLong(
	PF_InData		*in_data,
	PF_OutData		*out_data,
	const A_char	*strPC,
	A_u_long		*current_indexPLu,
	PF_FpLong		*valuePF)
{
	(void)in_data;
	(void)out_data;
	(void)strPC;
	(void)current_indexPLu;
	if (valuePF) *valuePF = 0.0;
	return PF_Err_NONE;
}

#ifdef __cplusplus
}
#endif
