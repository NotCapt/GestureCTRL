@echo off
echo ========================================
echo   GestureCtrl - Starting All Services
echo ========================================
echo.

echo [1/3] Starting Python ML Service...
start "GestureCtrl ML Service" cmd /k "cd /d %~dp0ml && python gesture_service.py"
timeout /t 3 /nobreak > nul

echo [2/3] Starting Node.js API Server...
start "GestureCtrl API Server" cmd /k "cd /d %~dp0 && node server/index.js"
timeout /t 2 /nobreak > nul

echo [3/3] Starting React Dashboard...
start "GestureCtrl Dashboard" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo All services started!
echo   ML Service:  ws://localhost:8765
echo   API Server:  http://localhost:3001
echo   Dashboard:   http://localhost:5173
echo.
pause
