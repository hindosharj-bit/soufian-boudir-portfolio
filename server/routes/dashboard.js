import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const totalContacts = db.prepare('SELECT COUNT(*) as count FROM contacts').get().count;
  const validEmails = db.prepare('SELECT COUNT(*) as count FROM contacts WHERE email_valid = 1').get().count;
  const invalidEmails = db.prepare('SELECT COUNT(*) as count FROM contacts WHERE email_valid = -1').get().count;
  const uncheckedEmails = db.prepare('SELECT COUNT(*) as count FROM contacts WHERE email_valid = 0 AND email IS NOT NULL').get().count;

  const totalSmtp = db.prepare('SELECT COUNT(*) as count FROM smtp_servers WHERE is_active = 1').get().count;
  const totalSentToday = db.prepare('SELECT COALESCE(SUM(sent_today), 0) as total FROM smtp_servers').get().total;
  const totalDailyCapacity = db.prepare('SELECT COALESCE(SUM(daily_limit), 0) as total FROM smtp_servers WHERE is_active = 1').get().total;

  const totalCampaigns = db.prepare('SELECT COUNT(*) as count FROM campaigns').get().count;
  const activeCampaigns = db.prepare("SELECT COUNT(*) as count FROM campaigns WHERE status = 'sending'").get().count;
  const totalSent = db.prepare('SELECT COALESCE(SUM(sent_count), 0) as total FROM campaigns').get().total;

  const totalSearchResults = db.prepare('SELECT COUNT(*) as count FROM search_results').get().count;
  const savedResults = db.prepare('SELECT COUNT(*) as count FROM search_results WHERE saved = 1').get().count;

  const recentCampaigns = db.prepare(`
    SELECT c.id, c.name, c.status, c.sent_count, c.total_recipients, c.created_at,
           t.name as template_name
    FROM campaigns c
    LEFT JOIN templates t ON c.template_id = t.id
    ORDER BY c.created_at DESC LIMIT 5
  `).all();

  const recentContacts = db.prepare('SELECT * FROM contacts ORDER BY created_at DESC LIMIT 10').all();

  const smtpStatus = db.prepare('SELECT id, name, sent_today, daily_limit, is_active, last_used_at FROM smtp_servers').all();

  res.json({
    contacts: { total: totalContacts, valid: validEmails, invalid: invalidEmails, unchecked: uncheckedEmails },
    smtp: { active: totalSmtp, sentToday: totalSentToday, dailyCapacity: totalDailyCapacity, servers: smtpStatus },
    campaigns: { total: totalCampaigns, active: activeCampaigns, totalSent },
    search: { totalResults: totalSearchResults, saved: savedResults },
    recentCampaigns,
    recentContacts,
  });
});

export default router;
