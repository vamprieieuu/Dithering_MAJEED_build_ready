#include "AEGP_SuiteHandler.h"

void AEGP_SuiteHandler::MissingSuiteError() const
{
	A_THROW(A_Err_MISSING_SUITE);
}
