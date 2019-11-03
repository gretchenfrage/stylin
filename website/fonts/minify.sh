#!/usr/bin/env bash

SCRIPT_DIR=$(cd -P -- "$(dirname -- "$0")" && pwd -P)
cd "${SCRIPT_DIR}" || exit 1

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'


MINIFY_DIR="./minified"

echo ""

echo "blasting away ${PWD}/${MINIFY_DIR}"
if [[ -d ${MINIFY_DIR} ]]; then
    mkdir ${MINIFY_DIR}/old-tmp || true
    rm -rf ${MINIFY_DIR}/old-tmp/* || true
    cp ${MINIFY_DIR}/*.* ${MINIFY_DIR}/old-tmp/
else
    mkdir ${MINIFY_DIR} || exit 1
fi
echo ""

#rm -rf 2>/dev/null "./${MINIFY_DIR}" || true
#mkdir "./${MINIFY_DIR}" || exit 1
#echo ""

echo "minifying fonts"
echo ""

while read LINE
do
    INPUT_PATH="./pristine/${LINE}"

    echo -e "${YELLOW}---- minifying: ${INPUT_PATH}${NC}"
    if [[ ! -f "./${INPUT_PATH}" ]]; then
        echo -e "| ${RED}error: file not found${NC}"
        exit 1
    fi

    xbase="${LINE##*/}"
    xfext="${xbase##*.}"
    xpref="${xbase%.*}"

    FLAVOR="woff2"
    OUTPUT_FILE="./minified/${xpref}.${FLAVOR}"

    if [[ -f "./minified/old-tmp/${xpref}.${FLAVOR}" ]]; then
        echo -e "${YELLOW}| using cached version${NC}"
        cp "./minified/old-tmp/${xpref}.${FLAVOR}" "${OUTPUT_FILE}" || exit 1
        echo ""
    else
        echo -e "${YELLOW}|${NC} to: ${OUTPUT_FILE}"

        # see: https://stackoverflow.com/questions/3362920/get-just-the-filename-from-a-path-in-a-bash-script

        pyftsubset "${INPUT_PATH}" "--flavor=${FLAVOR}" --unicodes=U+000-5FF "--output-file=${OUTPUT_FILE}"

        if [[ $? -eq 0 ]]; then
            echo -e "${YELLOW}|${NC} ${GREEN}successful${NC}"
            echo ""
        else
            echo -e "${YELLOW}|${NC} ${RED}error: it didn't work${NC}"
            echo ""
            exit 1
        fi
    fi

done < ./fonts-we-use.txt

echo "cleaning up"
rm -rf ./minified/old-tmp 2>/dev/null || true
echo ""

echo -e "${GREEN}successfully minified fonts${NC}"