#pragma once
#include <cstdint>
#include <cstddef>

#ifndef SPAPI
#define SPAPI
#endif

#define kSPBasicSuite "SP Basic Suite"
#define kSPBasicSuiteVersion 4
#define kSPBasicSuiteVersion1 1
#define kSPBasicSuiteVersion2 2

typedef int32_t SPErr;
#define kSPNoError 0

#ifdef __cplusplus
extern "C" {
#endif

typedef struct SPBasicSuite {
    SPErr (*AcquireSuite)(const char *name, int32_t version, const void **suite);
    SPErr (*ReleaseSuite)(const char *name, int32_t version);
    int32_t (*IsEqual)(const void *token1, const void *token2);
    SPErr (*AllocateBlock)(size_t size, void **block);
    SPErr (*FreeBlock)(void *block);
    SPErr (*ReallocateBlock)(void *block, size_t newSize, void **newblock);
    int32_t (*Undefined)(void);
} SPBasicSuite;

#ifdef __cplusplus
}
#endif
