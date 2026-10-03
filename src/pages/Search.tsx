import { useState, useEffect } from 'react'
import { api } from '../api'

interface SearchResult {
  id: number; query: string; name: string; email: string; phone: string;
  website: string; address: string; source: string; saved: number; created_at: string
}

interface ScrapeResult {
  url: string; title: string; emails: string[]; phones: string[]; error?: string
}

export default function Search() {
  const [tab, setTab] = useState<'search' | 'scrape' | 'history'>('search')
  const [query, setQuery] = useState('')
  const [pages, setPages] = useState(1)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<ScrapeResult[]>([])
  const [scrapeResult, setScrapeResult] = useState<ScrapeResult | null>(null)
  const [history, setHistory] = useState<SearchResult[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (tab === 'history') loadHistory()
  }, [tab])

  const loadHistory = () => { api.search.history().then(setHistory) }

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const data = await api.search.search(query, pages)
      setSearchResults(data.results)
      loadHistory()
    } catch (err) {
      alert((err as Error).message)
    }
    setLoading(false)
  }

  const handleScrape = async () => {
    if (!url.trim()) return
    setLoading(true)
    try {
      const data = await api.search.scrape(url)
      setScrapeResult(data)
    } catch (err) {
      alert((err as Error).message)
    }
    setLoading(false)
  }

  const handleSave = async (id: number) => {
    await api.search.save(id)
    loadHistory()
  }

  const handleSaveAll = async () => {
    const ids = [...selected]
    if (ids.length === 0) {
      const unsaved = history.filter(r => !r.saved)
      await api.search.saveAll(unsaved.map(r => r.id))
    } else {
      await api.search.saveAll(ids)
    }
    setSelected(new Set())
    loadHistory()
  }

  const handleClearHistory = async () => {
    if (!confirm('Supprimer les resultats non sauvegardes ?')) return
    await api.search.clearHistory()
    loadHistory()
  }

  const toggleSelect = (id: number) => {
    const s = new Set(selected)
    if (s.has(id)) s.delete(id); else s.add(id)
    setSelected(s)
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Recherche & Scraping</h1>
      </div>

      <div className="tab-bar">
        <button className={`tab ${tab === 'search' ? 'active' : ''}`} onClick={() => setTab('search')}>
          Recherche par mot-cle
        </button>
        <button className={`tab ${tab === 'scrape' ? 'active' : ''}`} onClick={() => setTab('scrape')}>
          Scraper une URL
        </button>
        <button className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
          Historique ({history.length})
        </button>
      </div>

      {tab === 'search' && (
        <div className="search-section">
          <div className="search-form">
            <input
              type="text"
              placeholder="Ex: restaurant casablanca, agence immobiliere marrakech, dentiste rabat..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="search-input-lg"
            />
            <div className="search-options">
              <label>
                Pages a scraper :
                <select value={pages} onChange={e => setPages(Number(e.target.value))}>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={5}>5</option>
                </select>
              </label>
              <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
                {loading ? 'Recherche en cours...' : 'Lancer la recherche'}
              </button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="results-section">
              <h3>Resultats ({searchResults.length} sites scrapes)</h3>
              {searchResults.map((r, i) => (
                <div key={i} className="card result-card">
                  <div className="card-header">
                    <h4>{r.title || r.url}</h4>
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="link-sm">{r.url}</a>
                  </div>
                  {r.error ? (
                    <p className="text-danger">{r.error}</p>
                  ) : (
                    <div className="card-body">
                      {r.emails.length > 0 && (
                        <div className="result-items">
                          <span className="result-label">Emails :</span>
                          {r.emails.map(e => <span key={e} className="badge badge-green">{e}</span>)}
                        </div>
                      )}
                      {r.phones.length > 0 && (
                        <div className="result-items">
                          <span className="result-label">Telephones :</span>
                          {r.phones.map(p => <span key={p} className="badge badge-blue">{p}</span>)}
                        </div>
                      )}
                      {r.emails.length === 0 && r.phones.length === 0 && (
                        <p className="empty-text">Aucun email ou telephone trouve</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'scrape' && (
        <div className="search-section">
          <div className="search-form">
            <input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleScrape()}
              className="search-input-lg"
            />
            <button className="btn btn-primary" onClick={handleScrape} disabled={loading}>
              {loading ? 'Scraping...' : 'Scraper cette URL'}
            </button>
          </div>

          {scrapeResult && (
            <div className="card result-card">
              <div className="card-header">
                <h4>{scrapeResult.title || scrapeResult.url}</h4>
              </div>
              <div className="card-body">
                {scrapeResult.emails.length > 0 && (
                  <div className="result-items">
                    <span className="result-label">Emails trouves :</span>
                    {scrapeResult.emails.map(e => <span key={e} className="badge badge-green">{e}</span>)}
                  </div>
                )}
                {scrapeResult.phones.length > 0 && (
                  <div className="result-items">
                    <span className="result-label">Telephones trouves :</span>
                    {scrapeResult.phones.map(p => <span key={p} className="badge badge-blue">{p}</span>)}
                  </div>
                )}
                {scrapeResult.emails.length === 0 && scrapeResult.phones.length === 0 && (
                  <p className="empty-text">Aucun email ou telephone trouve sur cette page</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="search-section">
          <div className="header-actions" style={{ marginBottom: '1rem' }}>
            <button className="btn btn-primary btn-sm" onClick={handleSaveAll}>
              Sauvegarder {selected.size > 0 ? `(${selected.size})` : 'tout'} dans Contacts
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleClearHistory}>Vider l'historique</button>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th><input type="checkbox" onChange={() => {
                    if (selected.size === history.length) setSelected(new Set())
                    else setSelected(new Set(history.map(r => r.id)))
                  }} /></th>
                  <th>Requete</th>
                  <th>Email</th>
                  <th>Telephone</th>
                  <th>Site</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map(r => (
                  <tr key={r.id}>
                    <td><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} /></td>
                    <td>{r.query}</td>
                    <td className="text-truncate">{r.email || '-'}</td>
                    <td>{r.phone || '-'}</td>
                    <td className="text-truncate"><a href={r.website} target="_blank" rel="noopener noreferrer">{r.website}</a></td>
                    <td>{r.saved ? <span className="badge badge-green">Sauvegarde</span> : <span className="badge badge-gray">Non sauve</span>}</td>
                    <td>
                      {!r.saved && <button className="btn btn-sm btn-outline" onClick={() => handleSave(r.id)}>Sauvegarder</button>}
                    </td>
                  </tr>
                ))}
                {history.length === 0 && <tr><td colSpan={7} className="empty-text">Aucun resultat</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
