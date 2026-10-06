cmake_minimum_required(VERSION 3.20)

if(NOT WIN32 AND NOT CMAKE_SYSTEM_NAME)
    find_program(MINGW_GCC NAMES x86_64-w64-mingw32-gcc-win32 x86_64-w64-mingw32-gcc x86_64-w64-mingw32-gcc-posix)
    find_program(MINGW_GXX NAMES x86_64-w64-mingw32-g++-win32 x86_64-w64-mingw32-g++ x86_64-w64-mingw32-g++-posix)
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
find_package(Python3 REQUIRED COMPONENTS Interpreter)

add_subdirectory(extern/AfterEffectsSDK)

set(MAJEED_AE_DIR        "${CMAKE_CURRENT_SOURCE_DIR}/ae")
set(MAJEED_CORE_DIR      "${CMAKE_CURRENT_SOURCE_DIR}/core")
set(PIPL_R               "${MAJEED_AE_DIR}/Majeed_PiPL.r")
set(PIPL_BIN             "${CMAKE_CURRENT_BINARY_DIR}/Majeed_PiPL.bin")
set(PIPL_RC              "${CMAKE_CURRENT_BINARY_DIR}/Majeed_PiPL.rc")
set(PIPL_PY              "${MAJEED_AE_DIR}/pipl_gen.py")
set(YMDITHERS_VERSION_RC "${MAJEED_AE_DIR}/YMDithers_Version.rc")
set(YMDITHERS_DEF        "${MAJEED_AE_DIR}/YMDithers.def")

if(NOT EXISTS "${PIPL_R}")
    message(FATAL_ERROR "PiPL source not found: ${PIPL_R}")
endif()

# Direct, reliable PiPL generation without fragile batch/preprocessor steps
add_custom_command(
    OUTPUT "${PIPL_RC}" "${PIPL_BIN}"
    COMMAND "${Python3_EXECUTABLE}" "${PIPL_PY}" "${PIPL_R}" "${PIPL_RC}" "${PIPL_BIN}"
    DEPENDS "${PIPL_R}" "${PIPL_PY}"
    COMMENT "Generating Majeed_PiPL.rc and Majeed_PiPL.bin via pipl_gen.py"
    VERBATIM
)

file(GLOB MAJEED_AE_SOURCES CONFIGURE_DEPENDS "${MAJEED_AE_DIR}/*.cpp")
file(GLOB MAJEED_CORE_SOURCES CONFIGURE_DEPENDS "${MAJEED_CORE_DIR}/*.cpp")

add_library(YMDithers SHARED
    "${PIPL_RC}"
    "${YMDITHERS_VERSION_RC}"
    "${YMDITHERS_DEF}"
    ${MAJEED_AE_SOURCES}
    ${MAJEED_CORE_SOURCES}
)

target_include_directories(YMDithers PRIVATE
    "${CMAKE_CURRENT_BINARY_DIR}"
    "${MAJEED_AE_DIR}"
    "${MAJEED_CORE_DIR}"
    ${AESDK_INCLUDE}
)

target_link_libraries(YMDithers PRIVATE AESDK)

# AE SDK defines: AE_OS_WIN is vital for entry.h to define DllExport as __declspec(dllexport)
target_compile_definitions(YMDithers PRIVATE
    MSWindows
    _WINDOWS
    WIN32
    _WIN32
    _WIN64
    AE_OS_WIN
    _CRT_SECURE_NO_WARNINGS
)

if(MSVC)
    target_compile_options(YMDithers PRIVATE /W3 /EHsc /MD /O2 /fp:fast)
    target_link_options(YMDithers PRIVATE
        /SUBSYSTEM:WINDOWS,6.00
        /OSVERSION:6.00
        /DEF:${YMDITHERS_DEF}
    )
else()
    target_compile_options(YMDithers PRIVATE -Wall -Wextra -Wno-unused-parameter -Wno-unused-function -Wno-missing-field-initializers -Wno-unknown-pragmas -O3)
    target_link_options(YMDithers PRIVATE
        -static -static-libgcc -static-libstdc++
        -Wl,--kill-at -Wl,-s
        -Wl,--subsystem,windows:6.0
        -Wl,--major-os-version,6 -Wl,--minor-os-version,0
        -Wl,--major-image-version,6 -Wl,--minor-image-version,0
        -Wl,--major-subsystem-version,6 -Wl,--minor-subsystem-version,0
        -Wl,--image-base,0x180000000 -Wl,--disable-auto-image-base
    )
endif()

set_target_properties(YMDithers PROPERTIES
    PREFIX ""
    OUTPUT_NAME "YMDithers_v7"
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
    COMMAND ${CMAKE_COMMAND} -E make_directory "${CMAKE_CURRENT_SOURCE_DIR}/public/dist"
    COMMAND ${CMAKE_COMMAND} -E make_directory "${CMAKE_CURRENT_SOURCE_DIR}/dist"
    COMMAND ${CMAKE_COMMAND} -E copy_if_different
        "$<TARGET_FILE:YMDithers>"
        "${CMAKE_BINARY_DIR}/YMDithers_v7.aex"
    COMMAND ${CMAKE_COMMAND} -E copy_if_different
        "$<TARGET_FILE:YMDithers>"
        "${CMAKE_CURRENT_SOURCE_DIR}/public/YMDithers_v7.aex"
    COMMAND ${CMAKE_COMMAND} -E copy_if_different
        "$<TARGET_FILE:YMDithers>"
        "${CMAKE_CURRENT_SOURCE_DIR}/public/dist/YMDithers_v7.aex"
    COMMAND ${CMAKE_COMMAND} -E copy_if_different
        "$<TARGET_FILE:YMDithers>"
        "${CMAKE_CURRENT_SOURCE_DIR}/dist/YMDithers_v7.aex"
    COMMAND ${CMAKE_COMMAND} -E copy_if_different
        "$<TARGET_FILE:YMDithers>"
        "${CMAKE_CURRENT_SOURCE_DIR}/YMDithers_v7.aex"
    COMMENT "Packaging YMDithers_v7.aex without post-build PE binary patching"
)

# Alias targets so `cmake --build build --target MAJEED` or `--target YMDithers_v7` work
add_custom_target(MAJEED DEPENDS YMDithers)
add_custom_target(YMDithers_v7 DEPENDS YMDithers)

set(PLUGIN_FOLDER
    "C:/Program Files/Adobe/Adobe After Effects 2023/Support Files/Plug-ins/"
    CACHE STRING "After Effects plugin folder"
)
install(TARGETS YMDithers DESTINATION "${PLUGIN_FOLDER}")
