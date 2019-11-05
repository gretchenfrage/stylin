#!/usr/bin/env bash

SCRIPT_DIR=$(cd -P -- "$(dirname -- "$0")" && pwd -P)
cd "${SCRIPT_DIR}" || exit 1

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "=== ${YELLOW}cleaning${NC} ==="
rm -rf ./pygments-darcula || true
mkdir pygments-darcula || exit 1
cd ./pygments-darcula || exit 1

echo ""
echo -e "=== ${YELLOW}cloning${NC} === "
git clone git@github.com:kakawait/pygments-darcula.git || exit 1
cd ./pygments-darcula || exit 1
git checkout 4c05f1f4e2cf20c9ed4291351c790daf9d2199ba || exit 1

echo ""
echo -e "=== ${YELLOW}patching${NC} ==="
(
    cd ./pygments_style_darcula                                      || exit 1

    >                           ./__init__.py                        || exit 1
    cat ./base.py       >>      ./__init__.py                        || exit 1
    echo ""             >>      ./__init__.py                        || exit 1
    cat ./properties.py >>      ./__init__.py                        || exit 1

    # https://stackoverflow.com/questions/5410757/delete-lines-in-a-text-file-that-contain-a-specific-string
    grep -v "import base" ./__init__.py > tmp; mv tmp __init__.py    || exit 1

    # https://stackoverflow.com/questions/6123915/search-and-replace-with-sed-when-dots-and-underscores-are-present/7161432
    sed 's/base\.//g'     ./__init__.py > tmp; mv tmp __init__.py    || exit 1
) || exit 1

echo ""
echo -e "=== ${YELLOW}installing${NC} ==="
python setup.py develop || exit 1

echo ""
echo -e "=== ${YELLOW}building${NC} ==="
./build.sh || exit 1

echo ""
echo -e "=== ${YELLOW}copying${NC} ==="
cp ./darcula.css ../../../css/pygment-themes/ || exit 1

echo ""
echo -e "${GREEN}> success on installing darcula theme!${NC}"
echo ""