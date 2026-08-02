import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Hypotheses() {
  const [rows, setRows] = useState([])
  const [pointSizes, setPointSizes] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const [{ data: hyp }, { data: ps }] = await Promise.all([
      supabase.from('hypotheses').select('*').order('paire'),
      supabase.from('point_sizes').select('*').order('paire')
    ])
    setRows(hyp || [])
    setPointSizes(ps || [])
    setLoading(false)
  }

  async function updateCell(cle, field, value) {
    setSavingKey(cle)
    const numericFields = ['valeur_pip_001', 'valeur_pip_100']
    const payload = { [field]: numericFields.includes(field) ? parseFloat(value) || null : value }
    await supabase.from('hypotheses').update(payload).eq('cle', cle)
    setRows((prev) => prev.map((r) => (r.cle === cle ? { ...r, ...payload } : r)))
    setSavingKey(null)
  }

  if (loading) return <div className="panel">Chargement…</div>

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Hypothèses</h2>
        <p className="hint">
          Valeur par point/pip pour un ordre micro (0.01 lot) et 1.00 lot, par broker et par paire.
          Champs en jaune = à saisir vous-même. Le calculateur de lot et le Trade Log s'appuient sur ces valeurs.
        </p>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Broker</th>
              <th>Symbole</th>
              <th>Type</th>
              <th>Pip 0.01 lot ($)</th>
              <th>Pip 1.00 lot ($)</th>
              <th>Note / Source</th>
              <th>Paire normalisée</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.cle}>
                <td>{r.broker}</td>
                <td>{r.symbole}</td>
                <td>{r.type}</td>
                <td>
                  <input
                    className="cell-input"
                    type="number"
                    step="0.01"
                    defaultValue={r.valeur_pip_001 ?? ''}
                    placeholder="À renseigner"
                    onBlur={(e) => updateCell(r.cle, 'valeur_pip_001', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="cell-input"
                    type="number"
                    step="0.01"
                    defaultValue={r.valeur_pip_100 ?? ''}
                    placeholder="À renseigner"
                    onBlur={(e) => updateCell(r.cle, 'valeur_pip_100', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="cell-input wide"
                    type="text"
                    defaultValue={r.note ?? ''}
                    onBlur={(e) => updateCell(r.cle, 'note', e.target.value)}
                  />
                </td>
                <td>{r.paire}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel-head" style={{ marginTop: '32px' }}>
        <h2>Taille du point par paire</h2>
        <p className="hint">
          Unité de prix correspondant à 1 point saisi dans le Trade Log (colonnes Stop Loss / Target).
        </p>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Paire</th>
              <th>Taille du point</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {pointSizes.map((p) => (
              <tr key={p.paire}>
                <td>{p.paire}</td>
                <td>{p.taille_point}</td>
                <td>{p.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {savingKey && <div className="saving-indicator">Enregistrement…</div>}
    </div>
  )
}
