// Simple dev server using Node.js http module + esbuild
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

const ROOT = '/tmp/nb/dist';
const PORT = 8080;

const TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};

createServer((req, res) => {
  let url = req.url.split('?')[0];
  let filePath = join(ROOT, url === '/' ? 'index.html' : url);
  
  if (!existsSync(filePath)) {
    // Try index.html for SPA routes
    filePath = join(ROOT, 'index.html');
  }
  
  try {
    const data = readFileSync(filePath);
    const ext = extname(filePath);
    res.writeHead(200, { 'Content-Type': TYPES[ext] || 'text/plain' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(PORT, () => {
  console.log(`Dev server running at http://localhost:${PORT} serving ${ROOT}`);
});