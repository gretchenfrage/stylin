#!/usr/bin/env bash

SCRIPT_DIR=$(cd -P -- "$(dirname -- "$0")" && pwd -P)
# this script has relative path semantics!

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# parse args / setup

echo ""
echo -e "${YELLOW}<<<${NC} preprocessing content ${YELLOW}>>>${NC}"

[[ ! -z "${1}" ]] || (
    echo -e "${RED}error: args=[source tree] [target tree]${NC}"
    echo ""
    exit 1
) || exit 1

[[ ! -z "${2}" ]] || (
    echo -e "${RED}error: args=[source tree] [target tree]${NC}"
    echo ""
    exit 1
) || exit 1

SOURCE_BASE=${1}
TARGET_BASE=${2}

# assert that these paths exist
(cd ${SOURCE_BASE} || exit 1) || exit 1
(cd ${TARGET_BASE} || exit 1) || exit 1

# make these paths absolute
SOURCE_BASE="$(cd ${SOURCE_BASE}; pwd)"
TARGET_BASE="$(cd ${TARGET_BASE}; pwd)"

# compile the preprocessor
echo -e "${NC}- building preprocessor${NC}"
(
    cd "${SCRIPT_DIR}/preprocessor" || exit 1
    npm run build || exit 1
) || exit 1
echo -e "${GREEN}- successfully built preprocessor${NC}"
echo ""

# do the actual building

# search for paths from the source base
cd "${SOURCE_BASE}"
SCRIPT_LIST="$(find . -type f -name build.yaml)"
for SCRIPT in ${SCRIPT_LIST}; do
    # determine the source and target paths
    POST_REL_DIR="$(dirname "${SCRIPT}")"
    POST_SOURCE_DIR="${SOURCE_BASE}/${POST_REL_DIR}"
    POST_TARGET_DIR="${TARGET_BASE}/${POST_REL_DIR}"

    echo -e "${YELLOW}----${NC} building post ${YELLOW}${POST_SOURCE_DIR}${NC} -> ${YELLOW}${POST_TARGET_DIR}${NC}"
    echo -e "${YELLOW}|${NC}"

    # make the target dir
    mkdir -p "${POST_TARGET_DIR}" || exit 1

    # invoke the preprocessor
    node "${SCRIPT_DIR}/preprocessor" "${POST_SOURCE_DIR}" "${POST_TARGET_DIR}" || exit 1

    echo -e "${YELLOW}|${NC}"
    echo -e "${YELLOW}----${NC} ${GREEN}post built successfully${NC}"
done
echo ""

# success
echo -e "${YELLOW}<<<${NC}${GREEN} successfully preprocessed content ${NC}${YELLOW}>>>${NC}"
echo ""
