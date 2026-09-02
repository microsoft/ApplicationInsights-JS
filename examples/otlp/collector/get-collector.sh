#!/usr/bin/env bash
# Downloads the OpenTelemetry Collector binary used to validate the OTLP channel output.
#
#   ./get-collector.sh
#
# Use this when Docker is not available; otherwise `docker compose up` in this folder is simpler.
set -euo pipefail

VERSION="${1:-0.157.0}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN_DIR="$SCRIPT_DIR/bin"
EXE="$BIN_DIR/otelcol"

if [ -x "$EXE" ]; then
    echo "The collector is already present at $EXE"
    "$EXE" --version
    exit 0
fi

mkdir -p "$BIN_DIR"

case "$(uname -s)" in
    Linux*)  OS=linux ;;
    Darwin*) OS=darwin ;;
    *) echo "Unsupported platform: $(uname -s). Use docker compose instead." >&2; exit 1 ;;
esac

case "$(uname -m)" in
    x86_64|amd64) ARCH=amd64 ;;
    arm64|aarch64) ARCH=arm64 ;;
    *) echo "Unsupported architecture: $(uname -m)" >&2; exit 1 ;;
esac

ASSET="otelcol_${VERSION}_${OS}_${ARCH}.tar.gz"
URL="https://github.com/open-telemetry/opentelemetry-collector-releases/releases/download/v${VERSION}/${ASSET}"

echo "Downloading $URL ..."
curl -fsSL "$URL" -o "$BIN_DIR/$ASSET"

echo "Extracting ..."
tar -xzf "$BIN_DIR/$ASSET" -C "$BIN_DIR"
rm -f "$BIN_DIR/$ASSET"

"$EXE" --version
echo
echo "Run it with:"
echo "  ./bin/otelcol --config otel-collector-config.yaml"
