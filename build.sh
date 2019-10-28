#!/usr/bin/env bash

SCRIPT_DIR=$(cd -P -- "$(dirname -- "$0")" && pwd -P)
cd "${SCRIPT_DIR}" || exit 1

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""

echo -e "${GREEN} building site in:${NC} ${PWD}"

echo ""

SITE_DIR="build-site"

mkdir "${SITE_DIR}" || true
rm -rf "./${SITE_DIR}/*" || exit 1

echo -e "into:"
( cd "${SITE_DIR}"; pwd; ) || exit 1

echo ""

echo -e "${GREEN} copying files${NC}"

cp ./index.html "./${SITE_DIR}/" || exit 1
mkdir -p  "./${SITE_DIR}/content" || exit 1
cp -r ./content/* "./${SITE_DIR}/content/" || exit 1
cp -r ./fonts "./${SITE_DIR}/fonts" || exit 1
cp -r ./images "./${SITE_DIR}/images" || exit 1

echo ""

echo -e "${GREEN} building sass${NC}"

mkdir -p "./${SITE_DIR}/css" || exit 1
sass "scss/:${SITE_DIR}/css/" || exit 1
rm "./${SITE_DIR}/css/*.map"

echo ""

echo -e "${YELLOW} success${NC}"
