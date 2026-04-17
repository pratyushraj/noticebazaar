#!/bin/bash
SCRIPT="/home/node/noticebazaar/scripts/audit-night.cjs"
LOG="/home/node/.openclaw/workspace/memory/audit-log.md"
CYCLE=1

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] =========================================" >> "$LOG"
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] OVERNIGHT AUDIT DAEMON STARTING" >> "$LOG"
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] =========================================" >> "$LOG"

while true; do
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [DAEMON] Cycle $CYCLE starting" >> "$LOG"
    node "$SCRIPT" >> "$LOG" 2>&1
    EXIT=$?
    if [ $EXIT -ne 0 ]; then
        echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [DAEMON] Cycle $CYCLE FAILED (exit $EXIT) - retry in 5m" >> "$LOG"
        sleep 300
        continue
    fi
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [DAEMON] Cycle $CYCLE done - sleeping 30m" >> "$LOG"
    CYCLE=$((CYCLE + 1))
    sleep 1800
done
