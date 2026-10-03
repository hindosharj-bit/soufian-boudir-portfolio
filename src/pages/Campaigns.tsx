import { useState, useEffect } from 'react'
import { api } from '../api'

interface Campaign {
  id: number; name: string; template_id: number; status: string; total_recipients: number;
  sent_count: number; failed_count: number; opened_count: number; tags_filter: string;
  template_name: string; template_subject: string; created_at: string; started_at: string; completed_at: string
}

interface Template { id: number; name: string; subject: string }

interface Log { id: number; contact_id: number; email: string; contact_name: string; status: string; error_message: string; sent_at: string }

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', template_id: 0, tags_filter: '' })
  const [logs, setLogs] = useState<{ campaignId: number; data: Log[] } | null>(null)

  const load = () => {
    api.campaigns.list().then(setCampaigns)
    api.templates.list().then(setTemplates)
  }
  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    await api.campaigns.create(form)
    setShowForm(false)
    setForm({ name: '', template_id: 0, tags_filter: '' })
    load()
  }

  const handleSend = async (id: number) => {
    if (!confirm('Lancer cette campagne ? Les emails seront envoyes immediatement.')) return
    await api.campaigns.send(id)
    load()
    const interval = setInterval(() => {
      api.campaigns.list().then(data => {
        setCampaigns(data)
        const c = data.find((x: Campaign) => x.id === id)
        if (c && c.status !== 'sending') clearInterval(interval)
      })
    }, 3000)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette campagne et ses logs ?')) return
    await api.campaigns.delete(id)
    load()
  }

  const showLogs = async (id: number) => {
    const data = await api.campaigns.logs(id)
    setLogs({ campaignId: id, data })
  }

  const statusColor = (s: string) => {
    if (s === 'completed') return 'badge-green'
    if (s === 'sending') return 'badge-blue'
    if (s === 'failed') return 'badge-red'
    return 'badge-gray'
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Campagnes</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Nouvelle campagne</button>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Template</th>
              <th>Status</th>
              <th>Progres</th>
              <th>Filtre tags</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map(c => (
              <tr key={c.id}>
                <td><strong>{c.name}</strong></td>
                <td>{c.template_name || '-'}</td>
                <td><span className={`badge ${statusColor(c.status)}`}>{c.status}</span></td>
                <td>
                  <div className="campaign-progress">
                    <span>{c.sent_count}/{c.total_recipients}</span>
                    {c.failed_count > 0 && <span className="text-danger"> ({c.failed_count} echecs)</span>}
                  </div>
                  {c.total_recipients > 0 && (
                    <div className="progress-bar progress-sm">
                      <div className="progress-fill" style={{ width: `${(c.sent_count / c.total_recipients) * 100}%` }} />
                    </div>
                  )}
                </td>
                <td>{c.tags_filter || 'Tous'}</td>
                <td>{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                <td>
                  <div className="action-btns">
                    {c.status === 'draft' && (
                      <button className="btn btn-sm btn-primary" onClick={() => handleSend(c.id)}>Envoyer</button>
                    )}
                    <button className="btn btn-sm btn-outline" onClick={() => showLogs(c.id)}>Logs</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}>✕</button>
                  </div>
                </td>
              </tr>
            ))}
            {campaigns.length === 0 && (
              <tr><td colSpan={7} className="empty-text">Aucune campagne</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Nouvelle campagne</h2>
            <div className="form-stack">
              <input placeholder="Nom de la campagne" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <select value={form.template_id} onChange={e => setForm({ ...form, template_id: Number(e.target.value) })}>
                <option value={0}>Choisir un template</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name} - {t.subject}</option>
                ))}
              </select>
              <input
                placeholder="Filtrer par tags (optionnel, separes par virgule)"
                value={form.tags_filter}
                onChange={e => setForm({ ...form, tags_filter: e.target.value })}
              />
              <p className="form-hint">Laissez vide pour envoyer a tous les contacts avec un email.</p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={!form.name || !form.template_id}>Creer</button>
            </div>
          </div>
        </div>
      )}

      {logs && (
        <div className="modal-overlay" onClick={() => setLogs(null)}>
          <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
            <h2>Logs campagne #{logs.campaignId}</h2>
            <div className="table-container" style={{ maxHeight: '60vh' }}>
              <table className="table">
                <thead>
                  <tr><th>Email</th><th>Nom</th><th>Status</th><th>Erreur</th><th>Envoye a</th></tr>
                </thead>
                <tbody>
                  {logs.data.map(l => (
                    <tr key={l.id}>
                      <td className="text-truncate">{l.email}</td>
                      <td>{l.contact_name || '-'}</td>
                      <td><span className={`badge ${l.status === 'sent' ? 'badge-green' : 'badge-red'}`}>{l.status}</span></td>
                      <td className="text-truncate">{l.error_message || '-'}</td>
                      <td>{l.sent_at ? new Date(l.sent_at).toLocaleString('fr-FR') : '-'}</td>
                    </tr>
                  ))}
                  {logs.data.length === 0 && <tr><td colSpan={5} className="empty-text">Aucun log</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setLogs(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
