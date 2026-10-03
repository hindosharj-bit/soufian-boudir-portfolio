import type { Page } from '../App'

const NAV_ITEMS: { id: Page; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'search', label: 'Recherche', icon: '🔍' },
  { id: 'contacts', label: 'Contacts', icon: '👥' },
  { id: 'smtp', label: 'SMTP', icon: '📡' },
  { id: 'templates', label: 'Templates', icon: '📝' },
  { id: 'campaigns', label: 'Campagnes', icon: '🚀' },
]

export default function Sidebar({ active, onNavigate }: { active: Page; onNavigate: (p: Page) => void }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">⚡</span>
        <span className="logo-text">MultiSend</span>
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`sidebar-item ${active === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-version">v1.0.0</div>
      </div>
    </aside>
  )
}
