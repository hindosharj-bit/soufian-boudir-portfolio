const BASE = '/api'

async function request(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

export const api = {
  dashboard: () => request('/dashboard'),

  contacts: {
    list: (page = 1, search = '', tag = '') =>
      request(`/contacts?page=${page}&search=${encodeURIComponent(search)}&tag=${encodeURIComponent(tag)}`),
    create: (data: Record<string, string>) => request('/contacts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Record<string, string>) => request(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/contacts/${id}`, { method: 'DELETE' }),
    deleteBulk: (ids: number[]) => request('/contacts', { method: 'DELETE', body: JSON.stringify({ ids }) }),
    validate: (id: number) => request(`/contacts/validate/${id}`, { method: 'POST' }),
    validateBulk: () => request('/contacts/validate-bulk', { method: 'POST' }),
    import: (file: File, tags: string) => {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('tags', tags)
      return fetch(`${BASE}/contacts/import`, { method: 'POST', body: fd }).then(r => r.json())
    },
    export: () => {
      window.open(`${BASE}/contacts/export`)
    },
  },

  smtp: {
    list: () => request('/smtp'),
    create: (data: Record<string, unknown>) => request('/smtp', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Record<string, unknown>) => request(`/smtp/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/smtp/${id}`, { method: 'DELETE' }),
    test: (id: number) => request(`/smtp/test/${id}`, { method: 'POST' }),
    resetCounters: () => request('/smtp/reset-counters', { method: 'POST' }),
  },

  templates: {
    list: () => request('/campaigns/templates'),
    create: (data: Record<string, string>) => request('/campaigns/templates', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Record<string, string>) => request(`/campaigns/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/campaigns/templates/${id}`, { method: 'DELETE' }),
  },

  campaigns: {
    list: () => request('/campaigns'),
    create: (data: Record<string, unknown>) => request('/campaigns', { method: 'POST', body: JSON.stringify(data) }),
    send: (id: number) => request(`/campaigns/${id}/send`, { method: 'POST' }),
    logs: (id: number) => request(`/campaigns/${id}/logs`),
    delete: (id: number) => request(`/campaigns/${id}`, { method: 'DELETE' }),
  },

  search: {
    scrape: (url: string) => request('/search/scrape', { method: 'POST', body: JSON.stringify({ url }) }),
    search: (query: string, pages = 1) => request('/search/search', { method: 'POST', body: JSON.stringify({ query, pages }) }),
    history: (limit = 100) => request(`/search/history?limit=${limit}`),
    save: (id: number) => request(`/search/save/${id}`, { method: 'POST' }),
    saveAll: (ids: number[]) => request('/search/save-all', { method: 'POST', body: JSON.stringify({ ids }) }),
    clearHistory: () => request('/search/history', { method: 'DELETE' }),
  },
}
