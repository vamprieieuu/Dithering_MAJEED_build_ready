#include <AE_Effect.h>
#include <AE_EffectCB.h>
#include <AE_Macros.h>

void UnionLRect(const A_LRect *src, A_LRect *dst)
{
	if (!src || !dst) return;
	if (dst->left == 0 && dst->top == 0 && dst->right == 0 && dst->bottom == 0) {
		*dst = *src;
		return;
	}
	if (src->left < dst->left) dst->left = src->left;
	if (src->top < dst->top) dst->top = src->top;
	if (src->right > dst->right) dst->right = src->right;
	if (src->bottom > dst->bottom) dst->bottom = src->bottom;
}
