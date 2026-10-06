#ifndef _H_ENTRY
#define _H_ENTRY

#if defined(_WIN32) || defined(WIN32) || defined(_WINDOWS) || defined(MSWindows)
    #define DllExport __declspec(dllexport)
#else
    #define DllExport
#endif

#endif // _H_ENTRY
