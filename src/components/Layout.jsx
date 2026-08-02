import { supabase } from '../supabaseClient'

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'tradelog', label: 'Trade Log' },
  { id: 'lotcalc', label: 'Calculateur Lot Size' },
  { id: 'hypotheses', label: 'Hypothèses' },
  { id: 'funding', label: 'Objectifs Funding' },
  { id: 'resume', label: 'Résumé' }
]

export default function Layout({ active, onChange, children }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <svg className="mark" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L21 8V22H3V8L12 2Z" stroke="#A6874F" strokeWidth="1.4" strokeLinejoin="round"/>
            <path d="M8 22V13H16V22" stroke="#A6874F" strokeWidth="1.4" strokeLinejoin="round"/>
          </svg>
          Capstone Book
        </div>
        <button className="logout" onClick={() => supabase.auth.signOut()}>
          Se déconnecter
        </button>
      </header>

      <nav className="app-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={tab.id === active ? 'nav-btn active' : 'nav-btn'}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="app-main">{children}</main>
    </div>
  )
}
