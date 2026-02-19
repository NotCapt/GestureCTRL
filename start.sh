#!/bin/bash
echo "========================================"
echo "  GestureCtrl - Starting All Services"
echo "========================================"
echo ""

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "[1/3] Starting Python ML Service..."
cd "$DIR/ml" && python3 gesture_service.py &
ML_PID=$!
sleep 3

echo "[2/3] Starting Node.js API Server..."
cd "$DIR" && node server/index.js &
NODE_PID=$!
sleep 2

echo "[3/3] Starting React Dashboard..."
cd "$DIR/client" && npm run dev &
REACT_PID=$!

echo ""
echo "All services started!"
echo "  ML Service:  ws://localhost:8765 (PID: $ML_PID)"
echo "  API Server:  http://localhost:3001 (PID: $NODE_PID)"
echo "  Dashboard:   http://localhost:5173 (PID: $REACT_PID)"
echo ""
echo "Press Ctrl+C to stop all services"

trap "kill $ML_PID $NODE_PID $REACT_PID 2>/dev/null; exit" INT TERM
wait
