cmake_minimum_required(VERSION 3.7)
project(AESDK)

add_library(
    AESDK
    STATIC
    Util/AEFX_ArbParseHelper.c
    Util/AEFX_SuiteHelper.c
    Util/AEGP_SuiteHandler.cpp
    Util/AEGP_Utils.cpp
    Util/MissingSuiteError.cpp
    Util/Smart_Utils.cpp
)

if(MSVC)
    target_compile_options(AESDK PRIVATE /W0)
else()
    target_compile_options(AESDK PRIVATE -w)
endif()
set(AESDK_ROOT ${PROJECT_SOURCE_DIR} CACHE INTERNAL "After Effects SDK Root")
set(AESDK_INCLUDE
    ${PROJECT_SOURCE_DIR}/Headers
    ${PROJECT_SOURCE_DIR}/Headers/SP
    ${PROJECT_SOURCE_DIR}/Util
    ${PROJECT_SOURCE_DIR}/Resources
    CACHE INTERNAL "After Effects SDK Header folders"
)
target_include_directories(AESDK PUBLIC ${AESDK_INCLUDE})
target_compile_definitions(AESDK PUBLIC MSWindows _WINDOWS WIN32 _CRT_SECURE_NO_WARNINGS)
set_target_properties(AESDK PROPERTIES POSITION_INDEPENDENT_CODE ON)
get_filename_component(AFX_REZ Resources/PiPLtool.exe ABSOLUTE CACHE)
