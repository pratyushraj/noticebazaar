#!/bin/bash
cd /tmp/nb
node ./node_modules/vite/bin/vite.js build 2>&1 | tail -10
