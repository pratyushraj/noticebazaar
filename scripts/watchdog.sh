#!/bin/bash
# Service watchdog - keeps Vite and cloudflared alive
# Restarts them if they crash, updates audit script with new tunnel URL

VITE_PID=""
CLOUDFLARED_PID=""
CURRENT_TUNNEL=""
AUDIT_SCRIPT="/home/node/noticebazaar/scripts/audit-night.cjs"
LOG="/home/node/.openclaw/workspace/memory/audit-log.md"

log() {
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [WATCHDOG] $1" | tee -a "$LOG"
}

start_vite() {
    cd /home/node/noticebazaar
    pnpm dev --host 0.0.0.0 --port 8080 > /tmp/vite.log 2>&1 &
    VITE_PID=$!
    log "Started Vite (PID: $VITE_PID)"
    sleep 8
    if curl -s http://localhost:8080 > /dev/null 2>&1; then
        log "Vite is responding"
    else
        log "WARNING: Vite not responding yet"
    fi
}

start_cloudflared() {
    pkill -f cloudflared 2>/dev/null
    sleep 2
    /home/node/noticebazaar/cloudflared tunnel --no-autoupdate --url http://localhost:8080 > /tmp/cloudflared.log 2>&1 &
    CLOUDFLARED_PID=$!
    log "Started cloudflared (PID: $CLOUDFLARED_PID)"
    sleep 12
    TUNNEL=$(strings /tmp/cloudflared.log | grep -o 'https://[^ ]*trycloudflare.com' | head -1)
    if [ -n "$TUNNEL" ]; then
        CURRENT_TUNNEL="$TUNNEL"
        log "Tunnel URL: $CURRENT_TUNNEL"
        # Update audit script
        sed -i "s|TUNNEL = '.*'|TUNNEL = '$CURRENT_TUNNEL';|" "$AUDIT_SCRIPT" 2>/dev/null
        sed -i "s|https://[^']*trycloudflare.com|${CURRENT_TUNNEL}|g" "$AUDIT_SCRIPT" 2>/dev/null
    else
        log "WARNING: Could not get tunnel URL"
    fi
}

check_vite() {
    if ! kill -0 $VITE_PID 2>/dev/null; then
        log "Vite crashed (PID $VITE_PID gone) - restarting"
        start_vite
    fi
    if ! curl -s http://localhost:8080 > /dev/null 2>&1; then
        log "Vite not responding - restarting"
        kill $VITE_PID 2>/dev/null
        start_vite
    fi
}

check_cloudflared() {
    if ! kill -0 $CLOUDFLARED_PID 2>/dev/null; then
        log "cloudflared crashed (PID $CLOUDFLARED_PID gone) - restarting"
        start_cloudflared
    fi
}

log "========================================="
log " SERVICE WATCHDOG STARTING"
log "========================================="

# Initial start
start_vite
start_cloudflared

# Monitor loop
while true; do
    check_vite
    check_cloudflared
    sleep 60
done
