import { useState, useEffect } from 'react'
import { api } from '../api'
import type { Page } from '../App'

interface DashData {
  contacts: { total: number; valid: number; invalid: number; unchecked: number }
  smtp: { active: number; sentToday: number; dailyCapacity: number; servers: { id: number; name: string; sent_today: number; daily_limit: number; is_active: number }[] }
  campaigns: { total: number; active: number; totalSent: number }
  search: { totalResults: number; saved: number }
  recentCampaigns: { id: number; name: string; status: string; sent_count: number; total_recipients: number; template_name: string; created_at: string }[]
  recentContacts: { id: number; email: string; name: string; company: string; source: string; created_at: string }[]
}

export default function Dashboard({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [data, setData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.dashboard().then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="page-loading">Chargement...</div>
  if (!data) return <div className="page-empty">Impossible de charger le dashboard</div>

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="page-subtitle">Vue d'ensemble de votre plateforme</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card" onClick={() => onNavigate('contacts')}>
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <span className="stat-number">{data.contacts.total}</span>
            <span className="stat-label">Contacts</span>
          </div>
          <div className="stat-detail">
            <span className="badge badge-green">{data.contacts.valid} valides</span>
            <span className="badge badge-red">{data.contacts.invalid} invalides</span>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigate('smtp')}>
          <div className="stat-icon">📡</div>
          <div className="stat-info">
            <span className="stat-number">{data.smtp.active}</span>
            <span className="stat-label">SMTP actifs</span>
          </div>
          <div className="stat-detail">
            <span className="badge badge-blue">{data.smtp.sentToday}/{data.smtp.dailyCapacity} envois</span>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigate('campaigns')}>
          <div className="stat-icon">🚀</div>
          <div className="stat-info">
            <span className="stat-number">{data.campaigns.totalSent}</span>
            <span className="stat-label">Emails envoyes</span>
          </div>
          <div className="stat-detail">
            <span className="badge badge-purple">{data.campaigns.total} campagnes</span>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigate('search')}>
          <div className="stat-icon">🔍</div>
          <div className="stat-info">
            <span className="stat-number">{data.search.totalResults}</span>
            <span className="stat-label">Resultats trouves</span>
          </div>
          <div className="stat-detail">
            <span className="badge badge-green">{data.search.saved} sauvegardes</span>
          </div>
        </div>
      </div>

      {data.smtp.servers.length > 0 && (
        <div className="card">
          <h3>SMTP - Utilisation du jour</h3>
          <div className="smtp-bars">
            {data.smtp.servers.map(s => (
              <div key={s.id} className="smtp-bar-row">
                <span className="smtp-bar-name">{s.name}</span>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${s.daily_limit > 0 ? (s.sent_today / s.daily_limit) * 100 : 0}%` }}
                  />
                </div>
                <span className="smtp-bar-count">{s.sent_today}/{s.daily_limit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <h3>Campagnes recentes</h3>
          {data.recentCampaigns.length === 0 ? (
            <p className="empty-text">Aucune campagne</p>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Nom</th><th>Status</th><th>Envois</th></tr>
              </thead>
              <tbody>
                {data.recentCampaigns.map(c => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td><span className={`badge badge-${c.status === 'completed' ? 'green' : c.status === 'sending' ? 'blue' : 'gray'}`}>{c.status}</span></td>
                    <td>{c.sent_count}/{c.total_recipients}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h3>Derniers contacts</h3>
          {data.recentContacts.length === 0 ? (
            <p className="empty-text">Aucun contact</p>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Email</th><th>Nom</th><th>Source</th></tr>
              </thead>
              <tbody>
                {data.recentContacts.map(c => (
                  <tr key={c.id}>
                    <td className="text-truncate">{c.email}</td>
                    <td>{c.name || '-'}</td>
                    <td><span className="badge badge-gray">{c.source}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
