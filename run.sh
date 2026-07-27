#!/bin/bash

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
    echo
    echo "Menghentikan semua proses..."

    [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null
    [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null

    wait
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# =========================
# Backend
# =========================
if [ -d "backend" ]; then
    echo "==== MENGINSTAL DEPENDENSI BACKEND ===="

    (
        cd backend || exit 1

        if [ -f package-lock.json ]; then
            npm ci
        else
            npm install
        fi

        echo "==== MENJALANKAN BACKEND ===="
        npm run dev
    ) &
    BACKEND_PID=$!
fi

# =========================
# Frontend
# =========================
if [ -d "frontend" ]; then
    echo "==== MENGINSTAL DEPENDENSI FRONTEND ===="

    (
        cd frontend || exit 1

        if [ -f package-lock.json ]; then
            npm ci
        else
            npm install
        fi

        echo "==== MENJALANKAN FRONTEND ===="
        npm run dev
    ) &
    FRONTEND_PID=$!
fi

echo
echo "========================================"
echo "Backend PID : $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Tekan CTRL+C untuk menghentikan semuanya."
echo "========================================"

wait