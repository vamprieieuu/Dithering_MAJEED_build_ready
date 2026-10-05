#pragma once
#ifndef _SPBasic_H_
#define _SPBasic_H_

#include <stdint.h>
#include <stddef.h>

#ifndef SPAPI
#if defined(_WIN32) || defined(WIN32) || defined(MSWindows)
#define SPAPI __stdcall
#else
#define SPAPI
#endif
#endif

#ifdef __cplusplus
extern "C" {
#endif

typedef int32_t SPErr;

#define kSPNoError 0
#define kSPBasicSuite "SP Basic Suite"
#define kSPBasicSuiteVersion 4

typedef struct SPBasicSuite {
    SPErr (SPAPI *AcquireSuite)(const char *name, int32_t version, const void **suite);
    SPErr (SPAPI *ReleaseSuite)(const char *name, int32_t version);
    int32_t (SPAPI *IsEqual)(const void *token1, const void *token2);
    SPErr (SPAPI *AllocateBlock)(size_t size, void **block);
    SPErr (SPAPI *FreeBlock)(void *block);
    SPErr (SPAPI *ReallocateBlock)(void *block, size_t newSize, void **newblock);
    int32_t (SPAPI *Undefined)(void);
} SPBasicSuite;

#ifdef __cplusplus
}
#endif

#endif // _SPBasic_H_
