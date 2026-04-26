#!/bin/bash
# Overnight Audit Daemon for CreatorArmour
# Runs audit every 30 minutes, logs everything

AUDIT_SCRIPT="/home/node/creatorarmour/scripts/audit.cjs"
LOG="/home/node/.openclaw/workspace/memory/audit-log.md"
ITER=1

while true; do
    TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    echo "[$TS] === DAEMON CYCLE $ITER ===" >> "$LOG"
    
    # Run audit
    node "$AUDIT_SCRIPT" 2>&1 | tee -a "$LOG"
    
    echo "[$TS] === CYCLE $ITER COMPLETE ===" >> "$LOG"
    echo ""
    
    ITER=$((ITER + 1))
    sleep 1800  # 30 minutes
done
