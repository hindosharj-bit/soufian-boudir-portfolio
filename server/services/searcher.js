import db from '../db.js';

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+?\d{1,3}[\s\-]?)?\(?\d{2,4}\)?[\s\-]?\d{3,4}[\s\-]?\d{3,4}/g;

const BLOCKED_DOMAINS = [
  'google.', 'gstatic.', 'youtube.', 'schema.org', 'w3.org',
  'googleapis.', 'duckduckgo.', 'bing.', 'yahoo.', 'facebook.com',
  'twitter.com', 'instagram.com', 'linkedin.com', 'wikipedia.org',
  'amazon.', 'microsoft.com', 'apple.com', 'github.com',
];

const FAKE_EMAIL_PATTERNS = [
  'example.com', 'sentry', 'wixpress', 'test.com', 'email.com',
  'domain.com', 'yoursite.com', 'website.com', 'company.com',
  '.png', '.jpg', '.gif', '.svg', '.webp', '.css', '.js',
];

function extractEmails(text) {
  const matches = text.match(EMAIL_REGEX) || [];
  return [...new Set(matches)].filter(e =>
    !FAKE_EMAIL_PATTERNS.some(p => e.toLowerCase().includes(p))
  );
}

function extractPhones(text) {
  const matches = text.match(PHONE_REGEX) || [];
  return [...new Set(matches.map(p => p.trim()))].filter(p => {
    const digits = p.replace(/\D/g, '');
    return digits.length >= 8 && digits.length <= 15;
  });
}

function extractUrlsFromDDG(html) {
  const urls = [];
  const linkRegex = /href="(?:\/\/duckduckgo\.com\/l\/\?uddg=|https?:\/\/)([^"&]+)/g;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    let url = match[1];
    try {
      url = decodeURIComponent(url);
    } catch {}
    if (url.startsWith('http')) {
      urls.push(url.split('&')[0]);
    }
  }

  const directRegex = /class="result__a"[^>]*href="([^"]+)"/g;
  while ((match = directRegex.exec(html)) !== null) {
    let url = match[1];
    if (url.startsWith('//duckduckgo.com/l/?uddg=')) {
      try { url = decodeURIComponent(url.split('uddg=')[1].split('&')[0]); } catch {}
    }
    if (url.startsWith('http')) urls.push(url);
  }

  const hrefRegex = /href="(https?:\/\/[^"]+)"/g;
  while ((match = hrefRegex.exec(html)) !== null) {
    urls.push(match[1]);
  }

  const unique = [...new Set(urls)].filter(u =>
    !BLOCKED_DOMAINS.some(d => u.includes(d))
  );
  return unique;
}

export async function scrapeUrl(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return { url, title: '', emails: [], phones: [], error: `HTTP ${response.status}` };
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain') && !contentType.includes('application/xhtml')) {
      return { url, title: '', emails: [], phones: [], error: 'Not HTML' };
    }

    const html = await response.text();
    const emails = extractEmails(html);
    const phones = extractPhones(html);

    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
    const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : '';

    return { url, title, emails, phones };
  } catch (err) {
    return { url, title: '', emails: [], phones: [], error: err.message };
  }
}

export async function searchAndScrape(query, pages = 1) {
  const results = [];
  const scrapedUrls = new Set();
  const log = [];

  for (let page = 0; page < pages; page++) {
    try {
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&s=${page * 30}`;
      log.push(`Searching: ${searchUrl}`);

      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `q=${encodeURIComponent(query)}&s=${page * 30}&dc=${page * 30 + 1}&o=json&api=d.js`,
        signal: AbortSignal.timeout(20000),
      });

      if (!response.ok) {
        log.push(`Search returned HTTP ${response.status}`);
        continue;
      }

      const html = await response.text();
      const siteUrls = extractUrlsFromDDG(html);
      log.push(`Found ${siteUrls.length} URLs to scrape`);

      const urlsToScrape = siteUrls
        .filter(u => !scrapedUrls.has(u))
        .slice(0, 8);

      const scrapePromises = urlsToScrape.map(async (siteUrl) => {
        scrapedUrls.add(siteUrl);
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

          return scraped;
        } catch {
          return null;
        }
      });

      const scraped = await Promise.allSettled(scrapePromises);
      const succeeded = scraped.filter(r => r.status === 'fulfilled' && r.value).length;
      log.push(`Scraped ${succeeded}/${urlsToScrape.length} URLs`);

      if (page < pages - 1) {
        await new Promise(r => setTimeout(r, 1500 + Math.random() * 1500));
      }
    } catch (err) {
      log.push(`Page ${page + 1} failed: ${err.message}`);
    }
  }

  return { results, log, totalScraped: scrapedUrls.size };
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
