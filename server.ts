import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiApp } from './src/server/app.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Mount API routes
app.use(apiApp);

// In production, serve the Vite build output
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// For SPA routing, redirect unmatched GET requests to index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
