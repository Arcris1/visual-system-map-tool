#!/bin/bash

# Navigate to backend and start Laravel server
echo "Starting Laravel backend..."
cd backend
php artisan serve --port=8000 &
BACKEND_PID=$!

# Navigate to frontend and start Vite server
echo "Starting Vite frontend..."
cd ../frontend
npm run dev -- --port=6868 &
FRONTEND_PID=$!

# Wait so both processes keep running
echo "Backend running on http://localhost:8000"
echo "Frontend running on http://localhost:6868"
echo "Press CTRL+C to stop both."

# Trap CTRL+C and kill both
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

wait
