#!/bin/bash

# Start CreatorArmour development servers
# Run this from your own Terminal app (not from an AI/sandboxed shell)

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_ROOT="/Users/pratyushraj/Desktop/noticebazaar"
cd "$PROJECT_ROOT" || { echo -e "${RED}❌ Project not found at $PROJECT_ROOT${NC}"; exit 1; }

echo -e "${BLUE}🚀 Starting CreatorArmour...${NC}"

# Kill anything on 8080 and 3001
echo -e "${BLUE}🧹 Cleaning up ports 8080 and 3001...${NC}"
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
sleep 1

# ── Backend ──────────────────────────────────────────────────────────────────
echo -e "${BLUE}⚙️  Starting Backend (port 3001)...${NC}"
cd "$PROJECT_ROOT/server"

if ! [ -d node_modules ]; then
  echo -e "${YELLOW}📦 Installing backend deps...${NC}"
  if command -v pnpm &>/dev/null; then pnpm install; else npm install; fi
fi

# tsx ≥4.x creates an IPC named pipe in /tmp which can hit EPERM in some
# macOS sandbox contexts.  Passing TSX_IPC=0 disables it for plain `tsx` runs.
# For `tsx watch` we use --no-ipc (supported since tsx 4.6).
export TSX_IPC=0

if command -v pnpm &>/dev/null; then
  pnpm exec tsx watch src/index.ts &
else
  npx tsx watch src/index.ts &
fi

BACKEND_PID=$!
echo -e "${GREEN}✅ Backend started (PID $BACKEND_PID)${NC}"

# Wait briefly so the backend can bind the port before the frontend starts
sleep 2

# ── Frontend ─────────────────────────────────────────────────────────────────
echo -e "${BLUE}🖥️  Starting Frontend (port 8080)...${NC}"
cd "$PROJECT_ROOT"

if ! [ -d node_modules ]; then
  echo -e "${YELLOW}📦 Installing frontend deps...${NC}"
  if command -v pnpm &>/dev/null; then pnpm install; else npm install; fi
fi

# Increase Node heap for large files (e.g. MobileDashboardDemo.tsx > 500KB)
export NODE_OPTIONS="--max-old-space-size=4096"

if command -v pnpm &>/dev/null; then
  pnpm dev
else
  npm run dev
fi
