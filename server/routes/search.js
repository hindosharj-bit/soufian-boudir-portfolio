import { Router } from 'express';
import db from '../db.js';
import { scrapeUrl, searchAndScrape, getSearchHistory, saveResultToContacts } from '../services/searcher.js';

const router = Router();

router.post('/scrape', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });

  try {
    const result = await scrapeUrl(url);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/search', async (req, res) => {
  const { query, pages = 1 } = req.body;
  if (!query) return res.status(400).json({ error: 'Query required' });

  try {
    const results = await searchAndScrape(query, Math.min(pages, 5));
    res.json({ results, query });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', (req, res) => {
  const results = getSearchHistory(Number(req.query.limit) || 100);
  res.json(results);
});

router.post('/save/:id', (req, res) => {
  try {
    const result = saveResultToContacts(Number(req.params.id));
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/save-all', (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'ids required' });

  let saved = 0;
  for (const id of ids) {
    try {
      saveResultToContacts(id);
      saved++;
    } catch {
      // skip duplicates
    }
  }
  res.json({ saved });
});

router.delete('/history', (req, res) => {
  db.prepare('DELETE FROM search_results WHERE saved = 0').run();
  res.json({ cleared: true });
});

export default router;
