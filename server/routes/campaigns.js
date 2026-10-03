import { Router } from 'express';
import db from '../db.js';
import { sendCampaign } from '../services/emailSender.js';

const router = Router();

router.get('/templates', (req, res) => {
  const templates = db.prepare('SELECT * FROM templates ORDER BY created_at DESC').all();
  res.json(templates);
});

router.post('/templates', (req, res) => {
  const { name, subject, body_html, body_text } = req.body;
  const result = db.prepare('INSERT INTO templates (name, subject, body_html, body_text) VALUES (?, ?, ?, ?)')
    .run(name, subject, body_html, body_text || '');
  res.json({ id: result.lastInsertRowid });
});

router.put('/templates/:id', (req, res) => {
  const { name, subject, body_html, body_text } = req.body;
  db.prepare("UPDATE templates SET name=?, subject=?, body_html=?, body_text=?, updated_at=datetime('now') WHERE id=?")
    .run(name, subject, body_html, body_text || '', req.params.id);
  res.json({ updated: true });
});

router.delete('/templates/:id', (req, res) => {
  db.prepare('DELETE FROM templates WHERE id = ?').run(req.params.id);
  res.json({ deleted: true });
});

router.get('/', (req, res) => {
  const campaigns = db.prepare(`
    SELECT c.*, t.name as template_name, t.subject as template_subject
    FROM campaigns c
    LEFT JOIN templates t ON c.template_id = t.id
    ORDER BY c.created_at DESC
  `).all();
  res.json(campaigns);
});

router.post('/', (req, res) => {
  const { name, template_id, tags_filter } = req.body;
  const result = db.prepare('INSERT INTO campaigns (name, template_id, tags_filter) VALUES (?, ?, ?)')
    .run(name, template_id, tags_filter || '');
  res.json({ id: result.lastInsertRowid });
});

router.post('/:id/send', async (req, res) => {
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  if (campaign.status === 'sending') return res.status(400).json({ error: 'Campaign already sending' });

  res.json({ message: 'Campaign started', campaignId: campaign.id });

  sendCampaign(campaign.id).catch(err => {
    db.prepare("UPDATE campaigns SET status = 'failed' WHERE id = ?").run(campaign.id);
    console.error('Campaign failed:', err);
  });
});

router.get('/:id/logs', (req, res) => {
  const logs = db.prepare(`
    SELECT cl.*, c.email, c.name as contact_name
    FROM campaign_logs cl
    JOIN contacts c ON cl.contact_id = c.id
    WHERE cl.campaign_id = ?
    ORDER BY cl.sent_at DESC
  `).all(req.params.id);
  res.json(logs);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM campaign_logs WHERE campaign_id = ?').run(req.params.id);
  db.prepare('DELETE FROM campaigns WHERE id = ?').run(req.params.id);
  res.json({ deleted: true });
});

export default router;
