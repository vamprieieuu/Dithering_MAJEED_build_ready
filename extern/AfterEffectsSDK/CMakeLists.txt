cmake_minimum_required(VERSION 3.7)
project(AESDK LANGUAGES C CXX)

add_library(AESDK INTERFACE)

set(AESDK_ROOT "${CMAKE_CURRENT_SOURCE_DIR}" CACHE INTERNAL "After Effects SDK Root")
set(AESDK_INCLUDE
    "${CMAKE_CURRENT_SOURCE_DIR}/Headers"
    "${CMAKE_CURRENT_SOURCE_DIR}/Headers/SP"
    CACHE INTERNAL "After Effects SDK Header folders"
)

target_include_directories(AESDK INTERFACE ${AESDK_INCLUDE})
target_compile_definitions(AESDK INTERFACE MSWindows _WINDOWS WIN32 _CRT_SECURE_NO_WARNINGS)
