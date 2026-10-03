import { useState, useEffect } from 'react'
import { api } from '../api'

interface Template {
  id: number; name: string; subject: string; body_html: string; body_text: string; created_at: string
}

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', subject: '', body_html: '', body_text: '' })
  const [preview, setPreview] = useState<string | null>(null)

  const load = () => { api.templates.list().then(setTemplates) }
  useEffect(() => { load() }, [])

  const handleSave = async () => {
    if (editId) {
      await api.templates.update(editId, form)
    } else {
      await api.templates.create(form)
    }
    setShowForm(false)
    setEditId(null)
    setForm({ name: '', subject: '', body_html: '', body_text: '' })
    load()
  }

  const handleEdit = (t: Template) => {
    setForm({ name: t.name, subject: t.subject, body_html: t.body_html, body_text: t.body_text || '' })
    setEditId(t.id)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce template ?')) return
    await api.templates.delete(id)
    load()
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Templates Email</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', subject: '', body_html: '', body_text: '' }) }}>
            + Nouveau template
          </button>
        </div>
      </div>

      <p className="page-hint">Variables disponibles : {'{{name}}'}, {'{{email}}'}, {'{{company}}'}, {'{{phone}}'}, {'{{website}}'}</p>

      <div className="cards-grid">
        {templates.map(t => (
          <div key={t.id} className="card">
            <div className="card-header">
              <h3>{t.name}</h3>
            </div>
            <div className="card-body">
              <div className="card-row"><span>Sujet</span><span className="text-truncate">{t.subject}</span></div>
              <div className="card-row"><span>Cree le</span><span>{new Date(t.created_at).toLocaleDateString('fr-FR')}</span></div>
            </div>
            <div className="card-actions">
              <button className="btn btn-sm btn-outline" onClick={() => setPreview(t.body_html)}>Apercu</button>
              <button className="btn btn-sm btn-outline" onClick={() => handleEdit(t)}>Modifier</button>
              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(t.id)}>Supprimer</button>
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div className="empty-state">
            <p>Aucun template</p>
            <p className="empty-hint">Creez un template HTML pour vos campagnes email</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
            <h2>{editId ? 'Modifier' : 'Creer'} un template</h2>
            <div className="template-form">
              <input placeholder="Nom du template" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <input placeholder="Sujet de l'email (ex: Bonjour {{name}})" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
              <div className="template-editor">
                <div className="editor-half">
                  <label>HTML</label>
                  <textarea
                    placeholder="<html><body><h1>Bonjour {{name}}</h1><p>Votre contenu ici...</p></body></html>"
                    value={form.body_html}
                    onChange={e => setForm({ ...form, body_html: e.target.value })}
                    rows={15}
                  />
                </div>
                <div className="editor-half">
                  <label>Apercu</label>
                  <div className="html-preview" dangerouslySetInnerHTML={{ __html: form.body_html }} />
                </div>
              </div>
              <textarea
                placeholder="Version texte (optionnel)"
                value={form.body_text}
                onChange={e => setForm({ ...form, body_text: e.target.value })}
                rows={3}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSave}>Sauvegarder</button>
            </div>
          </div>
        </div>
      )}

      {preview && (
        <div className="modal-overlay" onClick={() => setPreview(null)}>
          <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
            <h2>Apercu du template</h2>
            <div className="html-preview-full" dangerouslySetInnerHTML={{ __html: preview }} />
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setPreview(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
