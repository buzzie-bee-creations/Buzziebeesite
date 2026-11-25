import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, 'public');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.static(PUBLIC_DIR));

app.use((req, res) => {
  if (req.method === 'GET' || req.method === 'HEAD') {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
    return;
  }
  res.status(404).end();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
