#!/usr/bin/env bash

SCRIPT_DIR=$(cd -P -- "$(dirname -- "$0")" && pwd -P)
cd "${SCRIPT_DIR}" || exit 1

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""

SITE_DIR="target"

echo "building site in:"
pwd

echo ""

(
    (
        mkdir "${SITE_DIR}" 2>/dev/null || exit 1; echo "created build dir"
    ) || (
        rm -rf "./${SITE_DIR}" || exit 1
        echo "destroyed build dir"
        mkdir "${SITE_DIR}" || exit 1
        echo "re-created build dir"
    )
) || exit 1

echo ""

echo -e "building site to:"
( cd "${SITE_DIR}"; echo -e "${YELLOW}${PWD}${NC}"; ) || exit 1

echo ""

echo -e "${YELLOW}(1)${NC} copying files"

cp ./index.html "./${SITE_DIR}/" || exit 1
cp ./404.html "./${SITE_DIR}/" || exit 1
mkdir -p  "./${SITE_DIR}/content" || exit 1
cp -r ./content/* "./${SITE_DIR}/content/" || exit 1
cp -r ./images "./${SITE_DIR}/images" || exit 1
cp ./favicon.ico "./${SITE_DIR}/favicon.ico" || exit 1
echo ""

echo -e "${YELLOW}(2)${NC} building fonts"
bash ./fonts/minify.sh || exit 1
mkdir -p "./${SITE_DIR}/fonts/pristine"
mkdir -p "./${SITE_DIR}/fonts/minified"
cp -r ./fonts/pristine/* "./${SITE_DIR}/fonts/pristine/"  || exit 1
cp -r ./fonts/minified/* "./${SITE_DIR}/fonts/minified/" || exit 1
echo ""

echo -e "${YELLOW}(3)${NC} building sass"

mkdir -p "./${SITE_DIR}/css" || exit 1
sass "scss/:${SITE_DIR}/css/" || exit 1
(
    cd "./${SITE_DIR}/css"  || exit 1
    rm ./*.map || exit 1
) || exit 1

echo ""

echo -e "${GREEN}==== success ====${NC}"
