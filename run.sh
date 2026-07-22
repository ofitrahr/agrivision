#!/bin/bash

# Get the root directory of this script
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Store PIDs of background processes
PIDS=()

# Cleanup function - kills all background processes
cleanup() {
    echo ""
    echo "Stopping all processes..."
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null
        fi
    done
    wait
    echo "Done!"
    exit 0
}

# Set trap to run cleanup on SIGINT (Ctrl+C) and EXIT
trap cleanup SIGINT EXIT

# Run frontend dev server in background
(cd "$ROOT_DIR/frontend" && npm run dev) &
PIDS+=($!)

# Run backend in background
(cd "$ROOT_DIR/backend" && python3 run.py) &
PIDS+=($!)

# Wait for all background processes
wait    