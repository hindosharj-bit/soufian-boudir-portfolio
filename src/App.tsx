import { useState } from 'react'
import './App.css'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Contacts from './pages/Contacts'
import SmtpConfig from './pages/SmtpConfig'
import Templates from './pages/Templates'
import Campaigns from './pages/Campaigns'
import Search from './pages/Search'

export type Page = 'dashboard' | 'contacts' | 'smtp' | 'templates' | 'campaigns' | 'search'

function App() {
  const [page, setPage] = useState<Page>('dashboard')

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard onNavigate={setPage} />
      case 'contacts': return <Contacts />
      case 'smtp': return <SmtpConfig />
      case 'templates': return <Templates />
      case 'campaigns': return <Campaigns />
      case 'search': return <Search />
    }
  }

  return (
    <div className="app-layout">
      <Sidebar active={page} onNavigate={setPage} />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  )
}

export default App
