#!/usr/bin/env bash

SCRIPT_DIR=$(cd -P -- "$(dirname -- "$0")" && pwd -P)
cd "${SCRIPT_DIR}" || exit 1

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""

echo "re-building"

bash ./build.sh || exit 1
echo ""

echo -e "${YELLOW}WARNING:${NC} ${RED}are you sure you want to deploy to phoenixkahlo.com?${NC}"
read -p "y/n: " CONFIRM

echo ""

if [[ "${CONFIRM}" = "y" ]]; then
    echo -e "${YELLOW}deploying, ye-haw!${NC}"
    echo ""

    gsutil -m cp -r -Z ./target/* gs://phoenixkahlodotcom/ || exit 1

    echo ""
    echo -e "${GREEN}successful (I think)${NC}"
    echo ""
    exit 0
else
    echo -e "${GREEN}cancelling${NC}"
    echo ""
    exit 0
fi
