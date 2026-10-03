import { useState, useEffect } from 'react'
import { api } from '../api'

interface Smtp {
  id: number; name: string; host: string; port: number; secure: number;
  username: string; from_name: string; from_email: string;
  daily_limit: number; sent_today: number; is_active: number; last_used_at: string
}

const EMPTY = { name: '', host: '', port: 587, secure: false, username: '', password: '', from_name: '', from_email: '', daily_limit: 500, is_active: true }

export default function SmtpConfig() {
  const [servers, setServers] = useState<Smtp[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState<number | null>(null)
  const [testing, setTesting] = useState<number | null>(null)
  const [testResult, setTestResult] = useState<{ id: number; success: boolean; message: string } | null>(null)

  const load = () => { api.smtp.list().then(setServers) }
  useEffect(() => { load() }, [])

  const handleSave = async () => {
    if (editId) {
      await api.smtp.update(editId, form as unknown as Record<string, unknown>)
    } else {
      await api.smtp.create(form as unknown as Record<string, unknown>)
    }
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY)
    load()
  }

  const handleEdit = (s: Smtp) => {
    setForm({ name: s.name, host: s.host, port: s.port, secure: s.secure === 1, username: s.username, password: '', from_name: s.from_name, from_email: s.from_email, daily_limit: s.daily_limit, is_active: s.is_active === 1 })
    setEditId(s.id)
    setShowForm(true)
  }

  const handleTest = async (id: number) => {
    setTesting(id)
    try {
      const result = await api.smtp.test(id)
      setTestResult({ id, ...result })
    } catch (err) {
      setTestResult({ id, success: false, message: (err as Error).message })
    }
    setTesting(null)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce serveur SMTP ?')) return
    await api.smtp.delete(id)
    load()
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Configuration SMTP</h1>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={() => { api.smtp.resetCounters(); load() }}>Reset compteurs</button>
          <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY) }}>+ Ajouter SMTP</button>
        </div>
      </div>

      <div className="cards-grid">
        {servers.map(s => (
          <div key={s.id} className={`card smtp-card ${s.is_active ? '' : 'card-inactive'}`}>
            <div className="card-header">
              <h3>{s.name}</h3>
              <span className={`badge ${s.is_active ? 'badge-green' : 'badge-red'}`}>
                {s.is_active ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <div className="card-body">
              <div className="card-row"><span>Serveur</span><span>{s.host}:{s.port}</span></div>
              <div className="card-row"><span>Utilisateur</span><span className="text-truncate">{s.username}</span></div>
              <div className="card-row"><span>Expediteur</span><span className="text-truncate">{s.from_name} &lt;{s.from_email}&gt;</span></div>
              <div className="card-row">
                <span>Envois du jour</span>
                <span>{s.sent_today} / {s.daily_limit}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${s.daily_limit > 0 ? (s.sent_today / s.daily_limit) * 100 : 0}%` }} />
              </div>
            </div>
            {testResult?.id === s.id && (
              <div className={`test-result ${testResult.success ? 'test-success' : 'test-error'}`}>
                {testResult.success ? '✓ ' : '✕ '}{testResult.message}
              </div>
            )}
            <div className="card-actions">
              <button className="btn btn-sm btn-outline" onClick={() => handleTest(s.id)} disabled={testing === s.id}>
                {testing === s.id ? 'Test...' : 'Tester'}
              </button>
              <button className="btn btn-sm btn-outline" onClick={() => handleEdit(s)}>Modifier</button>
              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s.id)}>Supprimer</button>
            </div>
          </div>
        ))}

        {servers.length === 0 && (
          <div className="empty-state">
            <p>Aucun serveur SMTP configure</p>
            <p className="empty-hint">Ajoutez un serveur SMTP pour commencer a envoyer des emails</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <h2>{editId ? 'Modifier' : 'Ajouter'} un serveur SMTP</h2>
            <div className="form-grid">
              <input placeholder="Nom (ex: Gmail 1)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <input placeholder="Serveur SMTP (ex: smtp.gmail.com)" value={form.host} onChange={e => setForm({ ...form, host: e.target.value })} />
              <input placeholder="Port" type="number" value={form.port} onChange={e => setForm({ ...form, port: Number(e.target.value) })} />
              <label className="checkbox-label">
                <input type="checkbox" checked={form.secure} onChange={e => setForm({ ...form, secure: e.target.checked })} />
                SSL/TLS
              </label>
              <input placeholder="Nom d'utilisateur" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
              <input placeholder="Mot de passe" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              <input placeholder="Nom expediteur" value={form.from_name} onChange={e => setForm({ ...form, from_name: e.target.value })} />
              <input placeholder="Email expediteur" value={form.from_email} onChange={e => setForm({ ...form, from_email: e.target.value })} />
              <input placeholder="Limite journaliere" type="number" value={form.daily_limit} onChange={e => setForm({ ...form, daily_limit: Number(e.target.value) })} />
              <label className="checkbox-label">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                Actif
              </label>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSave}>Sauvegarder</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
