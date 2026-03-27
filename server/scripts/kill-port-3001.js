#!/usr/bin/env node
/**
 * Kills only the Node process listening on port 3001 (frees the port for dev server).
 * Run before `pnpm run dev` when you get EADDRINUSE.
 */
import { execSync } from 'child_process';

const port = 3001;
try {
  const pids = execSync(`lsof -i :${port} -t`, { encoding: 'utf8' })
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  for (const pid of pids) {
    try {
      const comm = execSync(`ps -p ${pid} -o comm=`, { encoding: 'utf8' }).trim();
      if (comm === 'node' || comm.endsWith('/node')) {
        execSync(`kill -9 ${pid}`);
        console.log(`Killed process ${pid} (node) on port ${port}.`);
      }
    } catch (_) {
      // process may have exited
    }
  }
} catch (e) {
  // lsof exits 1 when no process found — port is already free
}
