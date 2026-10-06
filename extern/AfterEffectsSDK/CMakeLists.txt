cmake_minimum_required(VERSION 3.20)

add_library(AESDK INTERFACE)

target_include_directories(AESDK INTERFACE
    ${CMAKE_CURRENT_SOURCE_DIR}/Headers
    ${CMAKE_CURRENT_SOURCE_DIR}/Headers/SP
    ${CMAKE_CURRENT_SOURCE_DIR}/Util
)

set(AESDK_INCLUDE
    ${CMAKE_CURRENT_SOURCE_DIR}/Headers
    ${CMAKE_CURRENT_SOURCE_DIR}/Headers/SP
    ${CMAKE_CURRENT_SOURCE_DIR}/Util
    CACHE INTERNAL "AESDK Include directories"
)
