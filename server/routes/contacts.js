import { Router } from 'express';
import db from '../db.js';
import { validateEmail, validatePhone } from '../services/validator.js';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import fs from 'fs';

const router = Router();
const upload = multer({ dest: '/tmp/uploads/' });

router.get('/', (req, res) => {
  const { page = 1, limit = 50, search = '', tag = '' } = req.query;
  const offset = (page - 1) * limit;

  let where = '1=1';
  const params = [];

  if (search) {
    where += ' AND (email LIKE ? OR name LIKE ? OR company LIKE ? OR phone LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  if (tag) {
    where += ' AND tags LIKE ?';
    params.push(`%${tag}%`);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM contacts WHERE ${where}`).get(...params).count;
  const contacts = db.prepare(`SELECT * FROM contacts WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, Number(limit), Number(offset));

  res.json({ contacts, total, page: Number(page), totalPages: Math.ceil(total / limit) });
});

router.post('/', (req, res) => {
  const { email, phone, name, company, website, tags } = req.body;
  const result = db.prepare(`
    INSERT INTO contacts (email, phone, name, company, website, tags)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(email, phone, name || '', company || '', website || '', tags || '');
  res.json({ id: result.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const { email, phone, name, company, website, tags } = req.body;
  db.prepare(`
    UPDATE contacts SET email=?, phone=?, name=?, company=?, website=?, tags=?, updated_at=datetime('now')
    WHERE id=?
  `).run(email, phone, name, company, website, tags, req.params.id);
  res.json({ updated: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
  res.json({ deleted: true });
});

router.delete('/', (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'ids required' });
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`DELETE FROM contacts WHERE id IN (${placeholders})`).run(...ids);
  res.json({ deleted: ids.length });
});

router.post('/validate/:id', async (req, res) => {
  const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  if (!contact) return res.status(404).json({ error: 'Not found' });

  const results = {};

  if (contact.email) {
    const emailResult = await validateEmail(contact.email);
    db.prepare('UPDATE contacts SET email_valid = ? WHERE id = ?')
      .run(emailResult.valid ? 1 : -1, contact.id);
    results.email = emailResult;
  }

  if (contact.phone) {
    const phoneResult = validatePhone(contact.phone);
    db.prepare('UPDATE contacts SET phone_valid = ? WHERE id = ?')
      .run(phoneResult.valid ? 1 : -1, contact.id);
    results.phone = phoneResult;
  }

  res.json(results);
});

router.post('/validate-bulk', async (req, res) => {
  const contacts = db.prepare('SELECT * FROM contacts WHERE email_valid = 0 AND email IS NOT NULL LIMIT 100').all();
  let validated = 0;

  for (const contact of contacts) {
    try {
      const result = await validateEmail(contact.email);
      db.prepare('UPDATE contacts SET email_valid = ? WHERE id = ?')
        .run(result.valid ? 1 : -1, contact.id);
      validated++;
    } catch {
      // skip
    }
  }

  res.json({ validated, total: contacts.length });
});

router.post('/import', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const content = fs.readFileSync(req.file.path, 'utf-8');
    const records = parse(content, { columns: true, skip_empty_lines: true, trim: true });

    let imported = 0;
    let skipped = 0;

    for (const row of records) {
      const email = row.email || row.Email || row.EMAIL || '';
      const phone = row.phone || row.Phone || row.PHONE || row.telephone || '';
      const name = row.name || row.Name || row.NAME || row.nom || '';
      const company = row.company || row.Company || row.societe || '';
      const website = row.website || row.Website || row.site || '';

      if (!email && !phone) { skipped++; continue; }

      if (email) {
        const existing = db.prepare('SELECT id FROM contacts WHERE email = ?').get(email);
        if (existing) { skipped++; continue; }
      }

      db.prepare(`
        INSERT INTO contacts (email, phone, name, company, website, source, tags)
        VALUES (?, ?, ?, ?, ?, 'import', ?)
      `).run(email, phone, name, company, website, req.body.tags || '');
      imported++;
    }

    fs.unlinkSync(req.file.path);
    res.json({ imported, skipped, total: records.length });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/export', (req, res) => {
  const contacts = db.prepare('SELECT email, phone, name, company, website, tags, email_valid FROM contacts').all();
  const header = 'email,phone,name,company,website,tags,email_valid\n';
  const csv = header + contacts.map(c =>
    [c.email, c.phone, c.name, c.company, c.website, c.tags, c.email_valid].map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(',')
  ).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=contacts.csv');
  res.send(csv);
});

export default router;
