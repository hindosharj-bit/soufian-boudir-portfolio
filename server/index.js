import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import contactsRouter from './routes/contacts.js';
import smtpRouter from './routes/smtp.js';
import campaignsRouter from './routes/campaigns.js';
import searchRouter from './routes/search.js';
import dashboardRouter from './routes/dashboard.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/contacts', contactsRouter);
app.use('/api/smtp', smtpRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/search', searchRouter);
app.use('/api/dashboard', dashboardRouter);

const distPath = join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(join(distPath, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║         MULTI SMTP MARKETING TOOL           ║
  ║                                             ║
  ║   Dashboard:  http://localhost:${PORT}         ║
  ║   API:        http://localhost:${PORT}/api     ║
  ║                                             ║
  ╚══════════════════════════════════════════════╝
  `);
});
