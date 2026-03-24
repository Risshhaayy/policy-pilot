#!/bin/bash
# ╔══════════════════════════════════════════════╗
# ║        PolicyPilot — Start Script            ║
# ╚══════════════════════════════════════════════╝

echo "🚀 Starting PolicyPilot..."

# Start backend in background
echo "📡 Starting Backend (FastAPI + Ollama)..."
cd "$(dirname "$0")/backend"
python3 main.py &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 3

# Start frontend
echo "🎨 Starting Frontend (Vite + React)..."
cd "$(dirname "$0")/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "════════════════════════════════════════════"
echo "  ✅ PolicyPilot is running!"
echo "  🌐 Frontend: http://localhost:5173"
echo "  📡 Backend:  http://localhost:8000"
echo "  Press Ctrl+C to stop both servers"
echo "════════════════════════════════════════════"

# Handle Ctrl+C — kill both
trap "echo '👋 Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

# Wait for both
wait
