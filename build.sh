#!/usr/bin/env bash

SCRIPT_DIR=$(cd -P -- "$(dirname -- "$0")" && pwd -P)
cd "${SCRIPT_DIR}" || exit 1

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# configure/announce

SOURCE_DIR="website"
BUILD_DIR="build"
SITE_DIR="${BUILD_DIR}/target"

echo ""

echo "building phoenixkahlo.com"
echo ""

# clean and setup

(
    (
        mkdir -p "${SITE_DIR}" 2>/dev/null || exit 1; echo "created build dir"
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

# copy static stuff
echo -e "${YELLOW}(1)${NC} copying files"

for f in index.html 404.html favicon.ico images; do
    cp -r ./${SOURCE_DIR}/${f} ./${SITE_DIR}/ || exit 1
done

# build fonts
echo -e "${YELLOW}(2)${NC} building fonts"
bash ./${SOURCE_DIR}/fonts/minify.sh || exit 1
mkdir -p ./${SITE_DIR}/fonts/pristine
mkdir -p ./${SITE_DIR}/fonts/minified
cp -r ./$SOURCE_DIR/fonts/pristine/* "./${SITE_DIR}/fonts/pristine/"  || exit 1
cp -r ./$SOURCE_DIR/fonts/minified/* "./${SITE_DIR}/fonts/minified/" || exit 1
echo ""

# build sass
echo -e "${YELLOW}(3)${NC} building sass"

mkdir -p ./${SITE_DIR}/css || exit 1
sass "$SOURCE_DIR/scss/:${SITE_DIR}/css/" || exit 1
(
    cd "./${SITE_DIR}/css"  || exit 1
    rm ./*.map || exit 1
) || exit 1

echo ""

echo -e "${GREEN}==== success ====${NC}"
