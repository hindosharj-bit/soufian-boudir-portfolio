import db from '../db.js';

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+?\d{1,3}[\s\-]?)?\(?\d{2,4}\)?[\s\-]?\d{3,4}[\s\-]?\d{3,4}/g;

function extractEmails(text) {
  const matches = text.match(EMAIL_REGEX) || [];
  return [...new Set(matches)].filter(e =>
    !e.endsWith('.png') && !e.endsWith('.jpg') && !e.endsWith('.gif') &&
    !e.includes('example.com') && !e.includes('sentry')
  );
}

function extractPhones(text) {
  const matches = text.match(PHONE_REGEX) || [];
  return [...new Set(matches.map(p => p.trim()))].filter(p => p.replace(/\D/g, '').length >= 8);
}

export async function scrapeUrl(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(15000),
    });

    const html = await response.text();
    const emails = extractEmails(html);
    const phones = extractPhones(html);

    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    return { url, title, emails, phones };
  } catch (err) {
    return { url, title: '', emails: [], phones: [], error: err.message };
  }
}

export async function searchAndScrape(query, pages = 1) {
  const results = [];

  for (let page = 0; page < pages; page++) {
    try {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&start=${page * 10}`;
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8',
        },
        signal: AbortSignal.timeout(15000),
      });

      const html = await response.text();
      const urlMatches = html.match(/https?:\/\/[^\s"<>]+/g) || [];
      const siteUrls = [...new Set(urlMatches)]
        .filter(u =>
          !u.includes('google.') && !u.includes('gstatic.') &&
          !u.includes('youtube.') && !u.includes('schema.org') &&
          !u.includes('w3.org') && !u.includes('googleapis.') &&
          u.startsWith('http')
        )
        .slice(0, 5);

      for (const siteUrl of siteUrls) {
        try {
          const scraped = await scrapeUrl(siteUrl);
          if (scraped.emails.length > 0 || scraped.phones.length > 0) {
            results.push(scraped);

            for (const email of scraped.emails) {
              db.prepare(`
                INSERT INTO search_results (query, name, email, website, source)
                VALUES (?, ?, ?, ?, 'scrape')
              `).run(query, scraped.title, email, siteUrl);
            }

            for (const phone of scraped.phones) {
              db.prepare(`
                INSERT INTO search_results (query, phone, website, source)
                VALUES (?, ?, ?, 'scrape')
              `).run(query, phone, siteUrl);
            }
          }
        } catch {
          // skip failed URLs
        }
      }

      await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));
    } catch (err) {
      results.push({ error: `Search page ${page + 1} failed: ${err.message}` });
    }
  }

  return results;
}

export function getSearchHistory(limit = 100) {
  return db.prepare('SELECT * FROM search_results ORDER BY created_at DESC LIMIT ?').all(limit);
}

export function saveResultToContacts(resultId) {
  const result = db.prepare('SELECT * FROM search_results WHERE id = ?').get(resultId);
  if (!result) throw new Error('Result not found');

  if (result.email) {
    const existing = db.prepare('SELECT id FROM contacts WHERE email = ?').get(result.email);
    if (!existing) {
      db.prepare(`
        INSERT INTO contacts (email, phone, name, company, website, source, tags)
        VALUES (?, ?, ?, ?, ?, 'search', ?)
      `).run(result.email, result.phone, result.name, '', result.website, result.query);
    }
  }

  db.prepare('UPDATE search_results SET saved = 1 WHERE id = ?').run(resultId);
  return { saved: true };
}
