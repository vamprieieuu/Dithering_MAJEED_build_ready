#ifndef _H_SPBasic
#define _H_SPBasic

#include <stdint.h>
#include <stddef.h>

#ifndef SPAPI
#define SPAPI
#endif

#ifdef __cplusplus
extern "C" {
#endif

typedef int32_t SPErr;
#define kSPNoError 0

typedef struct SPBasicSuite {
    SPErr (*AcquireSuite)(const char *name, int32_t version, const void **suite);
    SPErr (*ReleaseSuite)(const char *name, int32_t version);
    int32_t (*IsEqual)(const char *token1, const char *token2);
    SPErr (*AllocateBlock)(size_t size, void **block);
    SPErr (*FreeBlock)(void *block);
    SPErr (*ReallocateBlock)(void *block, size_t newSize, void **newblock);
    int32_t (*Undefined)(void);
} SPBasicSuite;

#define kSPBasicSuite "SP Basic Suite"
#define kSPBasicSuiteVersion 4

#ifdef __cplusplus
}
#endif

#endif // _H_SPBasic
