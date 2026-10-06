#ifndef _SP_BASIC_H_
#define _SP_BASIC_H_

#include "SPTypes.h"

#ifdef __cplusplus
extern "C" {
#endif

#define kSPBasicSuite "SP Basic Suite"
#define kSPBasicSuiteVersion 4

typedef struct SPBasicSuite {
    SPErr (*AcquireSuite)(const char *name, int32_t version, const void **suite);
    SPErr (*ReleaseSuite)(const char *name, int32_t version);
    int32_t (*IsEqual)(const void *token1, const void *token2);
    SPErr (*AllocateBlock)(size_t size, void **block);
    SPErr (*FreeBlock)(void *block);
    SPErr (*ReallocateBlock)(void *block, size_t newSize, void **newblock);
    SPErr (*Undefined)();
} SPBasicSuite;

#ifdef __cplusplus
}
#endif

#endif // _SP_BASIC_H_
