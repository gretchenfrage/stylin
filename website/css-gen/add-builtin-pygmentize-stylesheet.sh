#!/usr/bin/env bash

# pygmentize -S tango -f html > style.css

SCRIPT_DIR=$(cd -P -- "$(dirname -- "$0")" && pwd -P)
cd "${SCRIPT_DIR}/../css/pygment-themes" || exit 1

[[ ! -z "${1}" ]] || (
    echo "error: args=[style_name]"
    exit 1
) || exit 1

STYLE_NAME="${1}"
CSS_FILE="${PWD}/${STYLE_NAME}.css"

echo "writing pygment style '${STYLE_NAME}' to '${CSS_FILE}'"
pygmentize -S ${STYLE_NAME} -f html > "${CSS_FILE}" || exit 1
echo "success"