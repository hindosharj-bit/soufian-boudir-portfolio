import { Router } from 'express';
import nodemailer from 'nodemailer';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const servers = db.prepare('SELECT id, name, host, port, secure, username, from_name, from_email, daily_limit, sent_today, is_active, last_used_at, created_at FROM smtp_servers ORDER BY created_at DESC').all();
  res.json(servers);
});

router.post('/', (req, res) => {
  const { name, host, port, secure, username, password, from_name, from_email, daily_limit } = req.body;
  const result = db.prepare(`
    INSERT INTO smtp_servers (name, host, port, secure, username, password, from_name, from_email, daily_limit)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, host, port || 587, secure ? 1 : 0, username, password, from_name || '', from_email, daily_limit || 500);
  res.json({ id: result.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const { name, host, port, secure, username, password, from_name, from_email, daily_limit, is_active } = req.body;
  db.prepare(`
    UPDATE smtp_servers SET name=?, host=?, port=?, secure=?, username=?, password=?, from_name=?, from_email=?, daily_limit=?, is_active=?
    WHERE id=?
  `).run(name, host, port, secure ? 1 : 0, username, password, from_name, from_email, daily_limit, is_active ? 1 : 0, req.params.id);
  res.json({ updated: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM smtp_servers WHERE id = ?').run(req.params.id);
  res.json({ deleted: true });
});

router.post('/test/:id', async (req, res) => {
  const smtp = db.prepare('SELECT * FROM smtp_servers WHERE id = ?').get(req.params.id);
  if (!smtp) return res.status(404).json({ error: 'SMTP not found' });

  try {
    const transport = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure === 1,
      auth: { user: smtp.username, pass: smtp.password },
      tls: { rejectUnauthorized: false },
    });

    await transport.verify();
    res.json({ success: true, message: 'Connection OK' });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

router.post('/reset-counters', (req, res) => {
  db.prepare('UPDATE smtp_servers SET sent_today = 0').run();
  res.json({ reset: true });
});

export default router;
