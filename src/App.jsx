import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Login from './components/Login'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import TradeLog from './components/TradeLog'
import LotCalculator from './components/LotCalculator'
import Hypotheses from './components/Hypotheses'
import FundingObjectives from './components/FundingObjectives'
import Resume from './components/Resume'

export default function App() {
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)
  const [active, setActive] = useState('dashboard')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setChecking(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (checking) return <div className="loading-screen">Chargement…</div>
  if (!session) return <Login />

  return (
    <Layout active={active} onChange={setActive}>
      {active === 'dashboard' && <Dashboard />}
      {active === 'tradelog' && <TradeLog />}
      {active === 'lotcalc' && <LotCalculator />}
      {active === 'hypotheses' && <Hypotheses />}
      {active === 'funding' && <FundingObjectives />}
      {active === 'resume' && <Resume />}
    </Layout>
  )
}
