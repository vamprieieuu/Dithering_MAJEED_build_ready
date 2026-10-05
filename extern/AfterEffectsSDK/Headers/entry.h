#ifndef _H_ENTRY
#define _H_ENTRY

#if defined(MSWindows) || defined(_WIN32)
  #ifndef DllExport
    #define DllExport __declspec(dllexport)
  #endif
#else
  #ifndef DllExport
    #define DllExport __attribute__((visibility("default")))
  #endif
#endif

#endif // _H_ENTRY
