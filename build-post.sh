#!/usr/bin/env bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR=$(cd -P -- "$(dirname -- "$0")" && pwd -P)
cd "${SCRIPT_DIR}"

echo ""
echo -e "${YELLOW}<<<${NC} preprocessing content ${YELLOW}>>>${NC}"

[[ ! -z "${1}" ]] || (
    echo -e "${RED}error: args=[post]]${NC}"
    echo ""
    exit 1
) || exit 1

SOURCE_DIR="./website/content/${1}"
TARGET_DIR="./build/target/content/${1}"
mkdir -p "${TARGET_DIR}" || true

export ABSOLUTE_PATH_PREPEND="${PWD}/build/target"

./preprocess.sh ${SOURCE_DIR} ${TARGET_DIR} || exit 1

INDEX_HTML_PATH="${PWD}/build/target/index.html"

mkdir -p ./build/target/css || exit 1
sass "./website/scss/:./build/target/css/" || exit 1
(
    cd "./build/target/css"  || exit 1
    rm ./*.map || exit 1
) || exit 1

echo ""
echo "---- google chrome link:"
echo "|"
echo -e "|  ${YELLOW}${INDEX_HTML_PATH}${NC}"
echo "|"
echo "----"

