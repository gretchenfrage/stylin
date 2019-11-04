#!/usr/bin/env bash

SCRIPT_DIR=$(cd -P -- "$(dirname -- "$0")" && pwd -P)
cd "${SCRIPT_DIR}" || exit 1

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

export ABSOLUTE_PATH_PREPEND="${PWD}/build/target"

./build.sh

INDEX_HTML_PATH="${PWD}/build/target/index.html"

echo ""
echo "---- google chrome link:"
echo "|"
echo -e "|  ${YELLOW}${INDEX_HTML_PATH}${NC}"
echo "|"
echo "----"
