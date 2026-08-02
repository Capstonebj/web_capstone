import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { computeAccountCascade } from '../lib/calculations'

const EMPTY_TRADE = {
  date: new Date().toISOString().slice(0, 10),
  instrument: 'US30',
  direction: 'Buy',
  entry_price: '',
  exit_price: '',
  stop_loss_pts: '',
  target_pts: '',
  risk_pct: 0.005,
  strategy: '',
  notes: '',
  structure_signal: '',
  confirmation_zone: '',
  trend_tf: '',
  confirmation_tf: '',
  broker_compte: ''
}

export default function TradeLog() {
  const [trades, setTrades] = useState([])
  const [hypotheses, setHypotheses] = useState([])
  const [pointSizes, setPointSizes] = useState([])
  const [fundingKeys, setFundingKeys] = useState([])
  const [initialBalances, setInitialBalances] = useState({})
  const [form, setForm] = useState(EMPTY_TRADE)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
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
    setFundingKeys((fo || []).map((f) => f.cle_compte))
    const balances = {}
    ;(fo || []).forEach((f) => {
      balances[f.cle_compte] = f.capital_vise || 5000
    })
    setInitialBalances(balances)
    setLoading(false)
  }

  const hypothesesLookup = useMemo(() => {
    const map = {}
    hypotheses.forEach((h) => {
      map[`${h.broker}|${h.paire}`] = h
    })
    return map
  }, [hypotheses])

  const pointSizeLookup = useMemo(() => {
    const map = {}
    pointSizes.forEach((p) => {
      map[p.paire] = p.taille_point
    })
    return map
  }, [pointSizes])

  const enrichedTrades = useMemo(() => {
    const byAccount = {}
    trades.forEach((t) => {
      const acc = t.broker_compte || 'Sans compte'
      if (!byAccount[acc]) byAccount[acc] = []
      byAccount[acc].push(t)
    })
    let all = []
    Object.entries(byAccount).forEach(([acc, list]) => {
      const initial = initialBalances[acc] ?? 5000
      const enriched = computeAccountCascade(list, initial, hypothesesLookup, pointSizeLookup)
      all = all.concat(enriched)
    })
    return all.sort((a, b) => new Date(a.date) - new Date(b.date) || a.id - b.id)
  }, [trades, hypothesesLookup, pointSizeLookup, initialBalances])

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      ...form,
      entry_price: form.entry_price ? parseFloat(form.entry_price) : null,
      exit_price: form.exit_price ? parseFloat(form.exit_price) : null,
      stop_loss_pts: form.stop_loss_pts ? parseFloat(form.stop_loss_pts) : null,
      target_pts: form.target_pts ? parseFloat(form.target_pts) : null,
      risk_pct: parseFloat(form.risk_pct) || 0.005
    }
    const { error } = await supabase.from('trades').insert(payload)
    if (error) {
      alert('Erreur : ' + error.message)
      return
    }
    setForm(EMPTY_TRADE)
    loadAll()
  }

  async function deleteTrade(id) {
    if (!confirm('Supprimer ce trade ?')) return
    await supabase.from('trades').delete().eq('id', id)
    loadAll()
  }

  if (loading) return <div className="panel">Chargement…</div>

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Trade Log</h2>
        <p className="hint">Stratégie : Supply and Demand Zones — Risque par défaut : 0.5%</p>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Date
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </label>
        <label>
          Instrument
          <select value={form.instrument} onChange={(e) => setForm({ ...form, instrument: e.target.value })}>
            {['US30', 'USDJPY', 'NZDUSD', 'USDCHF', 'EURUSD', 'GBPUSD', 'USDCAD', 'AUDUSD', 'US100', 'US500', 'XAUUSD'].map(
              (p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              )
            )}
          </select>
        </label>
        <label>
          Direction
          <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}>
            <option value="Buy">Buy</option>
            <option value="Sell">Sell</option>
          </select>
        </label>
        <label>
          Entry Price
          <input type="number" step="any" value={form.entry_price} onChange={(e) => setForm({ ...form, entry_price: e.target.value })} />
        </label>
        <label>
          Exit Price
          <input type="number" step="any" value={form.exit_price} onChange={(e) => setForm({ ...form, exit_price: e.target.value })} />
        </label>
        <label>
          Stop Loss (pts)
          <input type="number" step="any" value={form.stop_loss_pts} onChange={(e) => setForm({ ...form, stop_loss_pts: e.target.value })} />
        </label>
        <label>
          Target (pts)
          <input type="number" step="any" value={form.target_pts} onChange={(e) => setForm({ ...form, target_pts: e.target.value })} />
        </label>
        <label>
          Risque (%)
          <input type="number" step="0.001" value={form.risk_pct} onChange={(e) => setForm({ ...form, risk_pct: e.target.value })} />
        </label>
        <label>
          Broker / Compte
          <select value={form.broker_compte} onChange={(e) => setForm({ ...form, broker_compte: e.target.value })}>
            <option value="">—</option>
            {fundingKeys.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        <label>
          Structure Signal
          <input type="text" value={form.structure_signal} onChange={(e) => setForm({ ...form, structure_signal: e.target.value })} />
        </label>
        <label>
          Confirmation Zone
          <input type="text" value={form.confirmation_zone} onChange={(e) => setForm({ ...form, confirmation_zone: e.target.value })} />
        </label>
        <label className="span-2">
          Notes
          <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </label>
        <div className="span-2">
          <button type="submit">Ajouter le trade</button>
        </div>
      </form>

      <div className="table-scroll" style={{ marginTop: '32px' }}>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Instrument</th>
              <th>Dir.</th>
              <th>Entry</th>
              <th>Exit</th>
              <th>SL</th>
              <th>TP</th>
              <th>R-Mult.</th>
              <th>Solde ($)</th>
              <th>Risque ($)</th>
              <th>R réalisé</th>
              <th>P&L ($)</th>
              <th>Compte</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {enrichedTrades.map((t) => (
              <tr key={t.id}>
                <td>{t.date}</td>
                <td>{t.instrument}</td>
                <td>{t.direction}</td>
                <td>{t.entry_price}</td>
                <td>{t.exit_price ?? '—'}</td>
                <td>{t.stop_loss_pts}</td>
                <td>{t.target_pts}</td>
                <td>{t.point_value_r?.toFixed(2)}</td>
                <td>{t.account_balance?.toFixed(2)}</td>
                <td>{t.risk_amount?.toFixed(2)}</td>
                <td>{t.r_realized != null ? t.r_realized.toFixed(2) : '—'}</td>
                <td className={t.pnl > 0 ? 'pos' : t.pnl < 0 ? 'neg' : ''}>
                  {t.pnl != null ? t.pnl.toFixed(2) : '—'}
                </td>
                <td>{t.broker_compte}</td>
                <td>
                  <button className="icon-btn" onClick={() => deleteTrade(t.id)} title="Supprimer">
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
