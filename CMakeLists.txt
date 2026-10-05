cmake_minimum_required(VERSION 3.20)

if(NOT WIN32 AND NOT CMAKE_SYSTEM_NAME)
    find_program(MINGW_GCC NAMES x86_64-w64-mingw32-gcc-posix x86_64-w64-mingw32-gcc)
    find_program(MINGW_GXX NAMES x86_64-w64-mingw32-g++-posix x86_64-w64-mingw32-g++)
    find_program(MINGW_WINDRES NAMES x86_64-w64-mingw32-windres)
    if(MINGW_GCC AND MINGW_GXX AND MINGW_WINDRES)
        set(CMAKE_SYSTEM_NAME Windows)
        set(CMAKE_SYSTEM_PROCESSOR x86_64)
        set(CMAKE_C_COMPILER "${MINGW_GCC}")
        set(CMAKE_CXX_COMPILER "${MINGW_GXX}")
        set(CMAKE_RC_COMPILER "${MINGW_WINDRES}")
    endif()
endif()

project(YMDithers LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_C_STANDARD 11)

if(NOT WIN32)
    message(FATAL_ERROR "YMDithers AEX build requires a Windows x64 target (MSVC or MinGW-w64).")
endif()

enable_language(RC)

add_subdirectory(extern)

set(MAJEED_AE_DIR   "${CMAKE_CURRENT_SOURCE_DIR}/ae")
set(MAJEED_CORE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/core")
set(PIPL_R          "${MAJEED_AE_DIR}/Majeed_PiPL.r")
set(PIPL_RR         "${CMAKE_CURRENT_BINARY_DIR}/Majeed_PiPL.rr")
set(PIPL_RRC        "${CMAKE_CURRENT_BINARY_DIR}/Majeed_PiPL.rrc")
set(PIPL_RC         "${CMAKE_CURRENT_BINARY_DIR}/Majeed_PiPL.rc")
set(PIPL_SCRIPT     "${CMAKE_CURRENT_BINARY_DIR}/GenerateMajeedPiPL.cmd")
set(PIPL_PY         "${MAJEED_AE_DIR}/pipl_gen.py")
set(PIPLTOOL        "${AESDK_ROOT}/Resources/PiPLtool.exe")

if(NOT EXISTS "${PIPL_R}")
    message(FATAL_ERROR "PiPL source not found: ${PIPL_R}")
endif()
if(NOT EXISTS "${PIPLTOOL}")
    message(FATAL_ERROR "PiPLtool.exe not found at: ${PIPLTOOL}")
endif()

if(CMAKE_HOST_WIN32 AND MSVC)
    # Adobe's Windows SDK sequence:
    #   cl /EP Majeed_PiPL.r -> .rr
    #   PiPLTool .rr -> .rrc
    #   cl /D MSWindows /EP .rrc -> .rc
    file(TO_NATIVE_PATH "${CMAKE_C_COMPILER}" NAT_CL_EXE)
    file(TO_NATIVE_PATH "${AESDK_ROOT}/Headers" NAT_SDK_HEADERS)
    file(TO_NATIVE_PATH "${PIPL_R}" NAT_PIPL_IN)
    file(TO_NATIVE_PATH "${PIPL_RR}" NAT_PIPL_RR)
    file(TO_NATIVE_PATH "${PIPLTOOL}" NAT_PIPLTOOL)
    file(TO_NATIVE_PATH "${PIPL_RRC}" NAT_PIPL_RRC)
    file(TO_NATIVE_PATH "${PIPL_RC}" NAT_PIPL_RC)

    file(WRITE "${PIPL_SCRIPT}" [=[
@echo off
setlocal
set "CL_EXE=@CL_EXE@"
set "SDK_HEADERS=@SDK_HEADERS@"
set "PIPL_IN=@PIPL_IN@"
set "PIPL_RR=@PIPL_RR@"
set "PIPLTOOL=@PIPLTOOL@"
set "PIPL_RRC=@PIPL_RRC@"
set "PIPL_RC=@PIPL_RC@"

"%CL_EXE%" /nologo /I "%SDK_HEADERS%" /EP "%PIPL_IN%" > "%PIPL_RR%"
if errorlevel 1 exit /b %errorlevel%

"%PIPLTOOL%" "%PIPL_RR%" "%PIPL_RRC%"
if errorlevel 1 exit /b %errorlevel%

"%CL_EXE%" /nologo /D "MSWindows" /EP "%PIPL_RRC%" > "%PIPL_RC%"
if errorlevel 1 exit /b %errorlevel%

if not exist "%PIPL_RC%" exit /b 2
exit /b 0
]=])

    file(READ "${PIPL_SCRIPT}" PIPL_SCRIPT_TEXT)
    string(REPLACE "@CL_EXE@" "${NAT_CL_EXE}" PIPL_SCRIPT_TEXT "${PIPL_SCRIPT_TEXT}")
    string(REPLACE "@SDK_HEADERS@" "${NAT_SDK_HEADERS}" PIPL_SCRIPT_TEXT "${PIPL_SCRIPT_TEXT}")
    string(REPLACE "@PIPL_IN@" "${NAT_PIPL_IN}" PIPL_SCRIPT_TEXT "${PIPL_SCRIPT_TEXT}")
    string(REPLACE "@PIPL_RR@" "${NAT_PIPL_RR}" PIPL_SCRIPT_TEXT "${PIPL_SCRIPT_TEXT}")
    string(REPLACE "@PIPLTOOL@" "${NAT_PIPLTOOL}" PIPL_SCRIPT_TEXT "${PIPL_SCRIPT_TEXT}")
    string(REPLACE "@PIPL_RRC@" "${NAT_PIPL_RRC}" PIPL_SCRIPT_TEXT "${PIPL_SCRIPT_TEXT}")
    string(REPLACE "@PIPL_RC@" "${NAT_PIPL_RC}" PIPL_SCRIPT_TEXT "${PIPL_SCRIPT_TEXT}")
    file(WRITE "${PIPL_SCRIPT}" "${PIPL_SCRIPT_TEXT}")

    add_custom_command(
        OUTPUT "${PIPL_RC}"
        COMMAND cmd.exe /C call "${PIPL_SCRIPT}"
        DEPENDS "${PIPL_R}" "${PIPLTOOL}"
        VERBATIM
        COMMENT "Generating Majeed_PiPL.rc (MSVC + PiPLtool.exe)"
    )
else()
    find_package(Python3 REQUIRED COMPONENTS Interpreter)
    add_custom_command(
        OUTPUT "${PIPL_RC}"
        COMMAND "${CMAKE_C_COMPILER}" -E -P -x c -D_WIN32 -D_WIN64 -DMSWindows -D_WINDOWS -I "${AESDK_ROOT}/Headers" "${PIPL_R}" -o "${PIPL_RR}"
        COMMAND "${Python3_EXECUTABLE}" "${PIPL_PY}" "${PIPL_RR}" "${PIPL_RRC}"
        COMMAND "${CMAKE_C_COMPILER}" -E -P -x c -DMSWindows "${PIPL_RRC}" -o "${PIPL_RC}"
        DEPENDS "${PIPL_R}" "${PIPL_PY}"
        VERBATIM
        COMMENT "Generating Majeed_PiPL.rc (Cross-compile)"
    )
endif()

file(GLOB MAJEED_AE_SOURCES CONFIGURE_DEPENDS "${MAJEED_AE_DIR}/*.cpp")
file(GLOB MAJEED_CORE_SOURCES CONFIGURE_DEPENDS "${MAJEED_CORE_DIR}/*.cpp")

add_library(YMDithers SHARED
    "${PIPL_RC}"
    ${MAJEED_AE_SOURCES}
    ${MAJEED_CORE_SOURCES}
)

add_dependencies(YMDithers AESDK)

target_include_directories(YMDithers PRIVATE
    "${MAJEED_AE_DIR}"
    "${MAJEED_CORE_DIR}"
    ${AESDK_INCLUDE}
)

target_link_libraries(YMDithers PRIVATE AESDK)

target_compile_definitions(YMDithers PRIVATE MSWindows _WINDOWS WIN32 _CRT_SECURE_NO_WARNINGS)
if(MSVC)
    target_compile_options(YMDithers PRIVATE /W3 /EHsc /permissive-)
else()
    target_compile_options(YMDithers PRIVATE -Wall -Wextra -Wno-unused-parameter -Wno-unused-function -Wno-missing-field-initializers -Wno-unknown-pragmas -O3)
    target_link_options(YMDithers PRIVATE -static -static-libgcc -static-libstdc++ -Wl,--kill-at -Wl,-s)
endif()

set_target_properties(YMDithers PROPERTIES
    PREFIX ""
    OUTPUT_NAME "YMDithers"
    SUFFIX ".aex"
    RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/bin"
    RUNTIME_OUTPUT_DIRECTORY_DEBUG "${CMAKE_BINARY_DIR}/bin/Debug"
    RUNTIME_OUTPUT_DIRECTORY_RELEASE "${CMAKE_BINARY_DIR}/bin/Release"
    LIBRARY_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/bin"
    LIBRARY_OUTPUT_DIRECTORY_DEBUG "${CMAKE_BINARY_DIR}/bin/Debug"
    LIBRARY_OUTPUT_DIRECTORY_RELEASE "${CMAKE_BINARY_DIR}/bin/Release"
)

add_custom_command(TARGET YMDithers POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E make_directory "${CMAKE_CURRENT_SOURCE_DIR}/public"
    COMMAND ${CMAKE_COMMAND} -E copy_if_different
        "$<TARGET_FILE:YMDithers>"
        "${CMAKE_BINARY_DIR}/YMDithers.aex"
    COMMAND ${CMAKE_COMMAND} -E copy_if_different
        "$<TARGET_FILE:YMDithers>"
        "${CMAKE_CURRENT_SOURCE_DIR}/public/YMDithers.aex"
    COMMENT "Copying YMDithers.aex to build root and public/"
)

# Alias target so `cmake --build build --target MAJEED` also works if invoked by scripts
add_custom_target(MAJEED DEPENDS YMDithers)

set(PLUGIN_FOLDER
    "C:/Program Files/Adobe/Adobe After Effects 2023/Support Files/Plug-ins/"
    CACHE STRING "After Effects plugin folder"
)
install(TARGETS YMDithers DESTINATION "${PLUGIN_FOLDER}")
