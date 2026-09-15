import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PORT = 8765;

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json'
};

function resolveFilePath(urlPath) {
  const cleanPath = urlPath === '/' ? '/index.html' : urlPath;
  let filePath = path.join(ROOT, cleanPath);

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!existsSync(filePath) && !path.extname(cleanPath)) {
    const withIndex = path.join(ROOT, cleanPath, 'index.html');
    if (existsSync(withIndex)) filePath = withIndex;
  }

  return filePath;
}

const server = createServer((req, res) => {
  try {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const filePath = resolveFilePath(urlPath);

    if (!filePath.startsWith(ROOT) || !existsSync(filePath) || statSync(filePath).isDirectory()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(readFileSync(filePath));
  } catch (err) {
    console.error(err);
    res.writeHead(500);
    res.end('Server error');
  }
});

function getLanAddresses() {
  const addresses = [];
  for (const iface of Object.values(networkInterfaces())) {
    for (const addr of iface || []) {
      if (addr.family === 'IPv4' && !addr.internal) {
        addresses.push(addr.address);
      }
    }
  }
  return addresses;
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Korean Flashcards (this Mac):  http://localhost:${PORT}/`);
  console.log(`Korean Connections:          http://localhost:${PORT}/connections/`);
  const lan = getLanAddresses();
  if (lan.length) {
    console.log('');
    console.log('Share on Wi-Fi (same network):');
    lan.forEach((ip) => {
      console.log(`  http://${ip}:${PORT}/`);
      console.log(`  http://${ip}:${PORT}/connections/`);
    });
  } else {
    console.log('');
    console.log('Could not detect a Wi-Fi IP. Others can try http://<your-mac-ip>:8765/');
  }
});
