import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Resume() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('funding_objectives')
      .select('*')
      .then(({ data }) => {
        setRows(data || [])
        setLoading(false)
      })
  }, [])

  const stats = useMemo(() => {
    const totalChallenges = rows.length
    const capitalVise = rows.reduce((sum, r) => sum + (r.capital_vise || 0), 0)
    const financed = rows.filter((r) => r.compte_finance)
    const capitalFinance = financed.reduce((sum, r) => sum + (r.capital_vise || 0), 0)
    const restants = totalChallenges - financed.length
    const progression = totalChallenges ? (financed.length / totalChallenges) * 100 : 0

    const byFirm = {}
    rows.forEach((r) => {
      if (!byFirm[r.firm]) byFirm[r.firm] = { count: 0, capital: 0, financed: 0 }
      byFirm[r.firm].count += 1
      byFirm[r.firm].capital += r.capital_vise || 0
      if (r.compte_finance) byFirm[r.firm].financed += 1
    })

    return { totalChallenges, capitalVise, financedCount: financed.length, capitalFinance, restants, progression, byFirm }
  }, [rows])

  if (loading) return <div className="panel">Chargement…</div>

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Résumé — Progression des objectifs de funding</h2>
        <p className="hint">Mis à jour automatiquement à partir de l'onglet Objectifs Funding.</p>
      </div>

      <div className="results-grid">
        <div className="result-item">
          <div className="k">Nombre total de challenges</div>
          <div className="v">{stats.totalChallenges}</div>
        </div>
        <div className="result-item highlight">
          <div className="k">Capital total visé ($)</div>
          <div className="v">{stats.capitalVise.toLocaleString()}</div>
        </div>
        <div className="result-item">
          <div className="k">Comptes financés</div>
          <div className="v">{stats.financedCount}</div>
        </div>
        <div className="result-item">
          <div className="k">Capital financé ($)</div>
          <div className="v">{stats.capitalFinance.toLocaleString()}</div>
        </div>
        <div className="result-item">
          <div className="k">Challenges restants</div>
          <div className="v">{stats.restants}</div>
        </div>
        <div className="result-item">
          <div className="k">Progression (%)</div>
          <div className="v">{stats.progression.toFixed(1)}</div>
        </div>
      </div>

      <div className="panel-head" style={{ marginTop: '32px' }}>
        <h2>Répartition par firm</h2>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Firm</th>
              <th>Nb challenges</th>
              <th>Capital visé ($)</th>
              <th>Comptes financés</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats.byFirm).map(([firm, v]) => (
              <tr key={firm}>
                <td>{firm}</td>
                <td>{v.count}</td>
                <td>{v.capital.toLocaleString()}</td>
                <td>{v.financed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
