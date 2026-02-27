#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="${SCRIPT_DIR}/../data/col"

echo "==> Downloading Catalogue of Life (ColDP format)..."
mkdir -p "$DATA_DIR"

COL_URL="https://download.checklistbank.org/col/latest_coldp.zip"
ARCHIVE="$DATA_DIR/coldp.zip"

if [ -f "$DATA_DIR/NameUsage.tsv" ]; then
    echo "    COL data already exists at $DATA_DIR"
    read -rp "    Re-download? [y/N] " answer
    if [[ ! "$answer" =~ ^[Yy]$ ]]; then
        echo "    Skipping download."
        exit 0
    fi
fi

echo "    Downloading from $COL_URL ..."
echo "    (This is ~1GB, may take a while)"
curl -L --progress-bar -o "$ARCHIVE" "$COL_URL"

echo "==> Extracting archive..."
unzip -o "$ARCHIVE" -d "$DATA_DIR"
rm -f "$ARCHIVE"

echo "==> Done! Files extracted to $DATA_DIR"
echo "    Key files:"
ls -lh "$DATA_DIR/NameUsage.tsv" "$DATA_DIR/VernacularName.tsv" 2>/dev/null || echo "    (check directory for available files)"
