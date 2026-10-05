#ifndef _ENTRY_H_
#define _ENTRY_H_

#if defined(AE_OS_WIN) || defined(_WIN32) || defined(MSWindows) || defined(_WINDOWS)
	#define DllExport	__declspec( dllexport )
#elif defined(AE_OS_MAC) || defined(__APPLE__)
	#define DllExport	__attribute__ ((visibility ("default")))
#else
	#define DllExport
#endif

#endif // _ENTRY_H_
