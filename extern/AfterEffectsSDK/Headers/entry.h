#pragma once
#ifndef _ENTRY_H
#define _ENTRY_H

#if defined(MSWindows) || defined(_WIN32)
	#ifndef DllExport
		#define DllExport __declspec(dllexport)
	#endif
#else
	#ifndef DllExport
		#define DllExport __attribute__((visibility("default")))
	#endif
#endif

#ifdef __cplusplus
extern "C" {
#endif

#ifdef PF_Cmd
DllExport PF_Err
EffectMain(
	PF_Cmd			cmd,
	PF_InData		*in_data,
	PF_OutData		*out_data,
	PF_ParamDef		*params[],
	PF_LayerDef		*output,
	void			*extra);
#endif

#ifdef __cplusplus
}
#endif

#endif // _ENTRY_H
