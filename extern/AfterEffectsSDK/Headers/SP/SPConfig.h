#ifndef _SP_CONFIG_H_
#define _SP_CONFIG_H_

#if defined(_WIN32) || defined(WIN32) || defined(_WINDOWS) || defined(MSWindows)
    #define SP_WIN 1
    #define SP_MAC 0
#else
    #define SP_WIN 0
    #define SP_MAC 1
#endif

#endif // _SP_CONFIG_H_
