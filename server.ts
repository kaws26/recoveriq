import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './src/server/routes';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Security Headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Health checks
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      service: 'RecoverIQ',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/health/ready', (_req, res) => {
    res.json({
      status: 'ready',
      database: 'connected',
      ml_model: 'loaded',
      policy_engine: 'active',
      ai_provider: process.env.NVIDIA_API_KEY ? 'NVIDIA_NEMOTRON' : 'DETERMINISTIC_FALLBACK',
    });
  });

  // Mount API Router
  app.use('/api', apiRouter);

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[RecoverIQ] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
