import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { computeAccountCascade, computeDashboard } from '../lib/calculations'

export default function Dashboard() {
  const [trades, setTrades] = useState([])
  const [hypotheses, setHypotheses] = useState([])
  const [pointSizes, setPointSizes] = useState([])
  const [initialBalances, setInitialBalances] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const [{ data: t }, { data: h }, { data: ps }, { data: fo }] = await Promise.all([
      supabase.from('trades').select('*').order('date').order('id'),
      supabase.from('hypotheses').select('*'),
      supabase.from('point_sizes').select('*'),
      supabase.from('funding_objectives').select('cle_compte, capital_vise')
    ])
    setTrades(t || [])
    setHypotheses(h || [])
    setPointSizes(ps || [])
    const balances = {}
    ;(fo || []).forEach((f) => (balances[f.cle_compte] = f.capital_vise || 5000))
    setInitialBalances(balances)
    setLoading(false)
  }

  const hypothesesLookup = useMemo(() => {
    const map = {}
    hypotheses.forEach((h) => (map[`${h.broker}|${h.paire}`] = h))
    return map
  }, [hypotheses])

  const pointSizeLookup = useMemo(() => {
    const map = {}
    pointSizes.forEach((p) => (map[p.paire] = p.taille_point))
    return map
  }, [pointSizes])

  const stats = useMemo(() => {
    const byAccount = {}
    trades.forEach((t) => {
      const acc = t.broker_compte || 'Sans compte'
      if (!byAccount[acc]) byAccount[acc] = []
      byAccount[acc].push(t)
    })
    let all = []
    Object.entries(byAccount).forEach(([acc, list]) => {
      const initial = initialBalances[acc] ?? 5000
      all = all.concat(computeAccountCascade(list, initial, hypothesesLookup, pointSizeLookup))
    })
    return computeDashboard(all)
  }, [trades, hypothesesLookup, pointSizeLookup, initialBalances])

  if (loading) return <div className="panel">Chargement…</div>

  const cards = [
    { label: 'Total Trades', value: stats.totalTrades },
    { label: 'Wins', value: stats.wins },
    { label: 'Losses', value: stats.losses },
    { label: 'Win Rate (%)', value: stats.winRate.toFixed(1) },
    { label: 'R Réalisé Moyen', value: stats.avgRRealized.toFixed(2) },
    { label: 'R Réalisé Total', value: stats.totalRRealized.toFixed(2) },
    { label: 'P&L Total ($)', value: stats.totalPnl.toFixed(2), highlight: true },
    { label: 'R-Multiple Système', value: stats.systemPointValue.toFixed(2) }
  ]

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Dashboard</h2>
        <p className="hint">Calculé automatiquement à partir du Trade Log.</p>
      </div>
      <div className="results-grid">
        {cards.map((c) => (
          <div key={c.label} className={c.highlight ? 'result-item highlight' : 'result-item'}>
            <div className="k">{c.label}</div>
            <div className={'v' + (c.label.includes('P&L') && stats.totalPnl < 0 ? ' neg' : '')}>{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
