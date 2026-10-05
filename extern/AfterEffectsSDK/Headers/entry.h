#pragma once
#ifndef _H_ENTRY
#define _H_ENTRY

#ifdef __cplusplus
extern "C" {
#endif

#if defined(WIN32) || defined(_WIN32) || defined(MSWindows)
	#define DllExport   __declspec( dllexport )
#else
	#define DllExport
#endif

#ifdef __cplusplus
}
#endif

#endif // _H_ENTRY
