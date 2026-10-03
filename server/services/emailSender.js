import nodemailer from 'nodemailer';
import db from '../db.js';

function getActiveSmtpServers() {
  return db.prepare(`
    SELECT * FROM smtp_servers
    WHERE is_active = 1 AND sent_today < daily_limit
    ORDER BY sent_today ASC
  `).all();
}

function getNextSmtp() {
  const servers = getActiveSmtpServers();
  if (servers.length === 0) return null;
  return servers[0];
}

function createTransport(smtp) {
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure === 1,
    auth: {
      user: smtp.username,
      pass: smtp.password,
    },
    tls: { rejectUnauthorized: false },
  });
}

function replaceVars(text, contact) {
  return text
    .replace(/\{\{name\}\}/gi, contact.name || '')
    .replace(/\{\{email\}\}/gi, contact.email || '')
    .replace(/\{\{company\}\}/gi, contact.company || '')
    .replace(/\{\{phone\}\}/gi, contact.phone || '')
    .replace(/\{\{website\}\}/gi, contact.website || '');
}

export async function sendEmail(contact, subject, htmlBody, textBody) {
  const smtp = getNextSmtp();
  if (!smtp) throw new Error('No SMTP server available');

  const transport = createTransport(smtp);
  const finalHtml = replaceVars(htmlBody, contact);
  const finalText = replaceVars(textBody || '', contact);
  const finalSubject = replaceVars(subject, contact);

  const result = await transport.sendMail({
    from: `"${smtp.from_name}" <${smtp.from_email}>`,
    to: contact.email,
    subject: finalSubject,
    html: finalHtml,
    text: finalText,
  });

  db.prepare("UPDATE smtp_servers SET sent_today = sent_today + 1, last_used_at = datetime('now') WHERE id = ?")
    .run(smtp.id);

  return { messageId: result.messageId, smtpId: smtp.id };
}

export async function sendCampaign(campaignId) {
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId);
  if (!campaign) throw new Error('Campaign not found');

  const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(campaign.template_id);
  if (!template) throw new Error('Template not found');

  let contactsQuery = "SELECT * FROM contacts WHERE email IS NOT NULL AND email != ''";
  if (campaign.tags_filter) {
    const tags = campaign.tags_filter.split(',').map(t => t.trim());
    const clauses = tags.map(t => `tags LIKE '%${t}%'`).join(' OR ');
    contactsQuery += ` AND (${clauses})`;
  }
  const contacts = db.prepare(contactsQuery).all();

  db.prepare("UPDATE campaigns SET status = 'sending', started_at = datetime('now'), total_recipients = ? WHERE id = ?")
    .run(contacts.length, campaignId);

  let sentCount = 0;
  let failedCount = 0;

  for (const contact of contacts) {
    try {
      const result = await sendEmail(contact, template.subject, template.body_html, template.body_text);

      db.prepare(`
        INSERT INTO campaign_logs (campaign_id, contact_id, smtp_id, status, sent_at)
        VALUES (?, ?, ?, 'sent', datetime('now'))
      `).run(campaignId, contact.id, result.smtpId);

      sentCount++;
      await new Promise(r => setTimeout(r, 500 + Math.random() * 1500));
    } catch (err) {
      db.prepare(`
        INSERT INTO campaign_logs (campaign_id, contact_id, status, error_message)
        VALUES (?, ?, 'failed', ?)
      `).run(campaignId, contact.id, err.message);
      failedCount++;
    }

    db.prepare('UPDATE campaigns SET sent_count = ?, failed_count = ? WHERE id = ?')
      .run(sentCount, failedCount, campaignId);
  }

  db.prepare("UPDATE campaigns SET status = 'completed', completed_at = datetime('now') WHERE id = ?")
    .run(campaignId);

  return { sentCount, failedCount, total: contacts.length };
}

export function resetDailyCounters() {
  db.prepare('UPDATE smtp_servers SET sent_today = 0').run();
}
