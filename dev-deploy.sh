#!/usr/bin/env bash

SCRIPT_DIR=$(cd -P -- "$(dirname -- "$0")" && pwd -P)
cd "${SCRIPT_DIR}" || exit 1

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""

if [[ "${USE_CACHED_BUILD}" = "true" ]]; then
    echo -e "${YELLOW}using cached build${NC}"
    echo ""
else
    echo "re-building"

    bash ./build.sh || exit 1
    echo ""

    echo -e "${YELLOW}deploying to dev${NC}"
    echo ""
fi

(
    gsutil -m rm -r gs://dev-phoenixkahlodotcom/*
    gsutil -m cp -r -Z ./target/* gs://dev-phoenixkahlodotcom/ || exit 1

    gsutil setmeta \
        -h "Cache-Control:public, max-age=31536000" \
        gs://dev-phoenixkahlodotcom/fonts/minified/*.woff2 || exit 1

) || (
    echo ""
    echo -e "${RED}deployment failure${NC}"
    echo ""
    exit 1
) || exit 1
echo ""

echo -e "${GREEN}successful (I think)${NC}"
echo ""