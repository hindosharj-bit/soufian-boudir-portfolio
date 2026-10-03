import { useState, useEffect, useRef } from 'react'
import { api } from '../api'

interface Contact {
  id: number; email: string; phone: string; name: string; company: string;
  website: string; source: string; email_valid: number; phone_valid: number;
  tags: string; created_at: string
}

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [form, setForm] = useState({ email: '', phone: '', name: '', company: '', website: '', tags: '' })
  const [editId, setEditId] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [importTags, setImportTags] = useState('')

  const load = () => {
    api.contacts.list(page, search).then(d => {
      setContacts(d.contacts)
      setTotal(d.total)
    })
  }

  useEffect(() => { load() }, [page, search])

  const handleSave = async () => {
    if (editId) {
      await api.contacts.update(editId, form)
    } else {
      await api.contacts.create(form)
    }
    setShowAdd(false)
    setEditId(null)
    setForm({ email: '', phone: '', name: '', company: '', website: '', tags: '' })
    load()
  }

  const handleEdit = (c: Contact) => {
    setForm({ email: c.email || '', phone: c.phone || '', name: c.name || '', company: c.company || '', website: c.website || '', tags: c.tags || '' })
    setEditId(c.id)
    setShowAdd(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce contact ?')) return
    await api.contacts.delete(id)
    load()
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Supprimer ${selected.size} contacts ?`)) return
    await api.contacts.deleteBulk([...selected])
    setSelected(new Set())
    load()
  }

  const handleValidate = async (id: number) => {
    await api.contacts.validate(id)
    load()
  }

  const handleBulkValidate = async () => {
    await api.contacts.validateBulk()
    load()
  }

  const handleImport = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    await api.contacts.import(file, importTags)
    setShowImport(false)
    setImportTags('')
    load()
  }

  const toggleSelect = (id: number) => {
    const s = new Set(selected)
    if (s.has(id)) s.delete(id); else s.add(id)
    setSelected(s)
  }

  const toggleAll = () => {
    if (selected.size === contacts.length) setSelected(new Set())
    else setSelected(new Set(contacts.map(c => c.id)))
  }

  const validBadge = (v: number) => {
    if (v === 1) return <span className="badge badge-green">Valide</span>
    if (v === -1) return <span className="badge badge-red">Invalide</span>
    return <span className="badge badge-gray">Non verifie</span>
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Contacts ({total})</h1>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={() => api.contacts.export()}>Exporter CSV</button>
          <button className="btn btn-outline" onClick={() => setShowImport(true)}>Importer CSV</button>
          <button className="btn btn-outline" onClick={handleBulkValidate}>Valider tous</button>
          <button className="btn btn-primary" onClick={() => { setShowAdd(true); setEditId(null); setForm({ email: '', phone: '', name: '', company: '', website: '', tags: '' }) }}>+ Ajouter</button>
        </div>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Rechercher par email, nom, entreprise..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      {selected.size > 0 && (
        <div className="bulk-bar">
          <span>{selected.size} selectionnes</span>
          <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>Supprimer</button>
        </div>
      )}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th><input type="checkbox" onChange={toggleAll} checked={selected.size === contacts.length && contacts.length > 0} /></th>
              <th>Email</th>
              <th>Telephone</th>
              <th>Nom</th>
              <th>Entreprise</th>
              <th>Email OK</th>
              <th>Source</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map(c => (
              <tr key={c.id}>
                <td><input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} /></td>
                <td className="text-truncate">{c.email || '-'}</td>
                <td>{c.phone || '-'}</td>
                <td>{c.name || '-'}</td>
                <td>{c.company || '-'}</td>
                <td>{validBadge(c.email_valid)}</td>
                <td><span className="badge badge-gray">{c.source}</span></td>
                <td>
                  <div className="action-btns">
                    <button className="btn-icon" onClick={() => handleValidate(c.id)} title="Valider">✓</button>
                    <button className="btn-icon" onClick={() => handleEdit(c)} title="Modifier">✏️</button>
                    <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(c.id)} title="Supprimer">✕</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > 50 && (
        <div className="pagination">
          <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Precedent</button>
          <span>Page {page} / {Math.ceil(total / 50)}</span>
          <button className="btn btn-sm" disabled={page >= Math.ceil(total / 50)} onClick={() => setPage(p => p + 1)}>Suivant</button>
        </div>
      )}

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editId ? 'Modifier' : 'Ajouter'} un contact</h2>
            <div className="form-grid">
              <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <input placeholder="Telephone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <input placeholder="Nom" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <input placeholder="Entreprise" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
              <input placeholder="Site web" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} />
              <input placeholder="Tags (separes par virgule)" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowAdd(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSave}>Sauvegarder</button>
            </div>
          </div>
        </div>
      )}

      {showImport && (
        <div className="modal-overlay" onClick={() => setShowImport(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Importer des contacts (CSV)</h2>
            <p className="modal-hint">Le fichier doit contenir les colonnes : email, phone, name, company, website</p>
            <input type="file" accept=".csv" ref={fileRef} />
            <input placeholder="Tags a appliquer" value={importTags} onChange={e => setImportTags(e.target.value)} style={{ marginTop: '0.5rem' }} />
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowImport(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleImport}>Importer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
