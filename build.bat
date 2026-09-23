@echo off
echo ==========================================
echo Menjalankan Agrivision dengan Docker...
echo ==========================================

REM Build dan jalankan Docker Compose
docker compose up -d --build

REM Cek apakah proses sebelumnya berhasil
if errorlevel 1 (
echo.
echo ERROR: Gagal menjalankan Docker Compose.
pause
exit /b 1
)

echo.
echo ==========================================
echo Menjalankan inisialisasi database...
echo ==========================================

docker exec agrivision_backend python3 init_db.py

if errorlevel 1 (
echo ERROR: Gagal menjalankan init_db.py
pause
exit /b 1
)

echo.
echo ==========================================
echo Menjalankan seed database...
echo ==========================================

docker exec agrivision_backend python3 seed.py

if errorlevel 1 (
echo ERROR: Gagal menjalankan seed.py
pause
exit /b 1
)

echo.
echo ==========================================
echo Aplikasi berhasil dijalankan!
echo ==========================================

pause
