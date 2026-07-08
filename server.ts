import express from 'express';
import path from 'path';
import http from 'http';
import { spawn, ChildProcess } from 'child_process';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
let flaskProcess: ChildProcess | null = null;

// --- 1. SPAWN PYTHON FLASK BACKEND ---
function startFlaskBackend() {
  console.log('🚀 Spawning Python Flask server on port 5000...');
  
  // Use 'python' on Windows, 'python3' on macOS/Linux
  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
  flaskProcess = spawn(pythonCmd, [path.join(process.cwd(), 'backend', 'app.py')]);

  flaskProcess.stdout?.on('data', (data) => {
    console.log(`🐍 [Flask]: ${data.toString().trim()}`);
  });

  flaskProcess.stderr?.on('data', (data) => {
    console.warn(`🐍 [Flask-Err]: ${data.toString().trim()}`);
  });

  flaskProcess.on('close', (code) => {
    console.log(`🐍 [Flask] process exited with code ${code}`);
  });
}

startFlaskBackend();

// --- 2. FORWARD /api/* REQUESTS TO FLASK ---
// Custom proxy using Node's standard http module to avoid complex external dependencies
app.all('/api/*', (req, res) => {
  const targetPath = req.originalUrl;
  const options = {
    hostname: '127.0.0.1',
    port: 5000,
    path: targetPath,
    method: req.method,
    headers: req.headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('❌ Proxy request failure:', err.message);
    res.status(502).json({
      status: 'error',
      message: 'Proxy forwarding failed. Ensure the Python backend is active.',
      detail: err.message,
    });
  });

  req.pipe(proxyReq, { end: true });
});

// --- 3. MOUNT VITE MIDDLEWARE (DEV) OR SERVE STATIC FILES (PROD) ---
async function setupWebDelivery() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('⚡ Mounting Vite in development middleware mode...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('📦 Serving production static distribution in dist/...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // --- 4. START THE UNIFIED SERVER ---
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Full-Stack Application is running on http://0.0.0.0:${PORT}`);
  });
}

setupWebDelivery();

// Clean up child processes on exit
process.on('exit', () => {
  if (flaskProcess) {
    console.log('Stopping Flask child process...');
    flaskProcess.kill();
  }
});
process.on('SIGINT', () => {
  if (flaskProcess) {
    flaskProcess.kill();
  }
  process.exit();
});
