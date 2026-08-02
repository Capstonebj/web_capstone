import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const EMPTY = {
  numero: '',
  firm: '',
  capital_vise: 100000,
  auteur: '',
  type_challenge: '1-Step',
  nombre_steps: 1,
  date_achat_prevue: '',
  cle_compte: ''
}

export default function FundingObjectives() {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('funding_objectives').select('*').order('numero')
    setRows(data || [])
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const cle = form.cle_compte || `${form.numero} - ${form.firm}`
    const { error } = await supabase.from('funding_objectives').insert({ ...form, cle_compte: cle })
    if (error) {
      alert('Erreur : ' + error.message)
      return
    }
    setForm(EMPTY)
    load()
  }

  async function toggleStep(id, step, currentValue) {
    await supabase
      .from('funding_objectives')
      .update({ [`step${step}_valide`]: !currentValue })
      .eq('id', id)
    load()
  }

  async function toggleFinance(id, currentValue) {
    await supabase.from('funding_objectives').update({ compte_finance: !currentValue }).eq('id', id)
    load()
  }

  async function deleteRow(id) {
    if (!confirm('Supprimer cet objectif ?')) return
    await supabase.from('funding_objectives').delete().eq('id', id)
    load()
  }

  if (loading) return <div className="panel">Chargement…</div>

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Objectifs Funding</h2>
        <p className="hint">Plan d'achat des challenges prop firm — statut mis à jour manuellement.</p>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          N°
          <input type="number" value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} />
        </label>
        <label>
          Firm
          <input type="text" value={form.firm} onChange={(e) => setForm({ ...form, firm: e.target.value })} />
        </label>
        <label>
          Capital visé ($)
          <input
            type="number"
            value={form.capital_vise}
            onChange={(e) => setForm({ ...form, capital_vise: parseFloat(e.target.value) || 0 })}
          />
        </label>
        <label>
          Auteur
          <input type="text" value={form.auteur} onChange={(e) => setForm({ ...form, auteur: e.target.value })} />
        </label>
        <label>
          Type de challenge
          <input
            type="text"
            value={form.type_challenge}
            onChange={(e) => setForm({ ...form, type_challenge: e.target.value })}
          />
        </label>
        <label>
          Nombre de steps
          <input
            type="number"
            value={form.nombre_steps}
            onChange={(e) => setForm({ ...form, nombre_steps: parseInt(e.target.value) || 1 })}
          />
        </label>
        <label>
          Date d'achat prévue
          <input
            type="date"
            value={form.date_achat_prevue}
            onChange={(e) => setForm({ ...form, date_achat_prevue: e.target.value })}
          />
        </label>
        <div className="span-2">
          <button type="submit">Ajouter l'objectif</button>
        </div>
      </form>

      <div className="table-scroll" style={{ marginTop: '32px' }}>
        <table>
          <thead>
            <tr>
              <th>N°</th>
              <th>Firm</th>
              <th>Capital visé ($)</th>
              <th>Auteur</th>
              <th>Steps</th>
              <th>Step 1</th>
              <th>Step 2</th>
              <th>Step 3</th>
              <th>Compte financé</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.numero}</td>
                <td>{r.firm}</td>
                <td>{r.capital_vise?.toLocaleString()}</td>
                <td>{r.auteur}</td>
                <td>{r.nombre_steps}</td>
                <td>
                  <input type="checkbox" checked={!!r.step1_valide} onChange={() => toggleStep(r.id, 1, r.step1_valide)} />
                </td>
                <td>
                  {r.nombre_steps >= 2 && (
                    <input type="checkbox" checked={!!r.step2_valide} onChange={() => toggleStep(r.id, 2, r.step2_valide)} />
                  )}
                </td>
                <td>
                  {r.nombre_steps >= 3 && (
                    <input type="checkbox" checked={!!r.step3_valide} onChange={() => toggleStep(r.id, 3, r.step3_valide)} />
                  )}
                </td>
                <td>
                  <input type="checkbox" checked={!!r.compte_finance} onChange={() => toggleFinance(r.id, r.compte_finance)} />
                </td>
                <td>{r.compte_finance ? 'Compte financé' : 'Challenge non commencé'}</td>
                <td>
                  <button className="icon-btn" onClick={() => deleteRow(r.id)}>
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
