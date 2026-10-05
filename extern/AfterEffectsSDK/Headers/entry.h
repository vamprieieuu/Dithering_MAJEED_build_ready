#pragma once

#ifndef DllExport
#ifdef MSWindows
    #define DllExport __declspec(dllexport)
#else
    #define DllExport
#endif
#endif
