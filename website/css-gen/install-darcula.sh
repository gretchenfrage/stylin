#!/usr/bin/env bash

SCRIPT_DIR=$(cd -P -- "$(dirname -- "$0")" && pwd -P)
cd "${SCRIPT_DIR}" || exit 1

echo ""
echo "=== cleaning ==="
rm -rf ./darcula-tmp || true
mkdir darcula-tmp || exit 1
cd ./darcula-tmp || exit 1

echo ""
echo "=== cloning === "
git clone git@github.com:kakawait/pygments-darcula.git || exit 1
cd ./pygments-darcula || exit 1
git checkout 4c05f1f4e2cf20c9ed4291351c790daf9d2199ba || exit 1

echo ""
echo "=== patching ==="
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
echo "=== installing ==="
python setup.py develop || exit 1

echo ""
echo "=== building ==="
./build.sh || exit 1

echo ""
echo "=== copying ==="
cp ./darcula.css ../../../css/pygment-themes/ || exit 1

echo ""
echo "> success!"
echo ""