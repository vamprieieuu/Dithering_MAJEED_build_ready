#ifndef _H_AEGP_SUITE_HANDLER
#define _H_AEGP_SUITE_HANDLER

#include <AE_GeneralPlug.h>
#include <AE_Effect.h>
#include <AE_EffectCB.h>
#include <AE_EffectCBSuites.h>
#include <AE_EffectSuites.h>
#include <AE_AdvEffectSuites.h>
#include <SPBasic.h>

class AEGP_SuiteHandler {
public:
	explicit AEGP_SuiteHandler(const SPBasicSuite *pica_basicP);
	~AEGP_SuiteHandler();

	const SPBasicSuite* Pica() const { return i_pica_basicP; }
	void MissingSuiteError() const;

private:
	const SPBasicSuite *i_pica_basicP;
};

#endif // _H_AEGP_SUITE_HANDLER
