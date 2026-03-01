#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXT_DIR="${ROOT_DIR}/stockdock@etf"
SCHEMA_COMPILED="${EXT_DIR}/schemas/gschemas.compiled"

if [[ ! -d "${EXT_DIR}" ]]; then
  echo "Extension directory not found: ${EXT_DIR}" >&2
  exit 1
fi

if [[ -f "${SCHEMA_COMPILED}" ]]; then
  rm -f "${SCHEMA_COMPILED}"
fi

version=$(node -e "const m=require('./stockdock@etf/metadata.json');console.log(m.version)")
if [[ -z "${version}" ]]; then
  echo "Could not read extension version from metadata.json" >&2
  exit 1
fi

OUT="${ROOT_DIR}/stockdock@etf-v${version}.zip"
rm -f "${OUT}"

(
  cd "${ROOT_DIR}"
  zip -r "${OUT}" stockdock@etf \
    -x "*/.DS_Store" \
    -x "*/__pycache__/*" \
    -x "*/.git/*" \
    -x "*/node_modules/*" \
    -x "*/schemas/gschemas.compiled"
)

echo "Created ${OUT}"
