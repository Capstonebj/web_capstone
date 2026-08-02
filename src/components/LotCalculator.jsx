import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { lotArrondiSuperieur, lotAUtiliser, lotBrut } from '../lib/calculations'

export default function LotCalculator() {
  const [hypotheses, setHypotheses] = useState([])
  const [capital, setCapital] = useState(5000)
  const [riskPct, setRiskPct] = useState(0.005)
  const [selectedKey, setSelectedKey] = useState('')
  const [stopLossPts, setStopLossPts] = useState(50)

  useEffect(() => {
    supabase
      .from('hypotheses')
      .select('*')
      .order('broker')
      .then(({ data }) => {
        setHypotheses(data || [])
        if (data?.length) setSelectedKey(data[0].cle)
      })
  }, [])

  const selected = hypotheses.find((h) => h.cle === selectedKey)

  const results = useMemo(() => {
    const riskAmount = capital * riskPct
    const valeurPip001 = selected?.valeur_pip_001 ?? null
    const valeurPip100 = selected?.valeur_pip_100 ?? null
    const brut = valeurPip100 ? lotBrut(riskAmount, stopLossPts, valeurPip100) : null
    const aUtiliser = brut != null ? lotAUtiliser(brut) : null
    const arrondiSup = brut != null ? lotArrondiSuperieur(brut) : null
    const perteReelle = aUtiliser != null ? aUtiliser * stopLossPts * valeurPip100 : null
    const perteReelleSup = arrondiSup != null ? arrondiSup * stopLossPts * valeurPip100 : null

    return { riskAmount, valeurPip001, valeurPip100, brut, aUtiliser, arrondiSup, perteReelle, perteReelleSup }
  }, [capital, riskPct, stopLossPts, selected])

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Calculateur de Lot Size</h2>
        <p className="hint">Renseignez les paramètres. Le lot à utiliser est calculé automatiquement selon votre risque.</p>
      </div>

      <div className="form-grid">
        <label>
          Capital du compte ($)
          <input type="number" value={capital} onChange={(e) => setCapital(parseFloat(e.target.value) || 0)} />
        </label>
        <label>
          Risque par trade (%)
          <input
            type="number"
            step="0.001"
            value={riskPct}
            onChange={(e) => setRiskPct(parseFloat(e.target.value) || 0)}
          />
        </label>
        <label>
          Compte / Paire
          <select value={selectedKey} onChange={(e) => setSelectedKey(e.target.value)}>
            {hypotheses.map((h) => (
              <option key={h.cle} value={h.cle}>
                {h.broker} - {h.symbole}
              </option>
            ))}
          </select>
        </label>
        <label>
          Stop Loss (points/pips)
          <input type="number" value={stopLossPts} onChange={(e) => setStopLossPts(parseFloat(e.target.value) || 0)} />
        </label>
      </div>

      <div className="results-grid">
        <div className="result-item">
          <div className="k">Montant risqué ($)</div>
          <div className="v">{results.riskAmount.toFixed(2)}</div>
        </div>
        <div className="result-item">
          <div className="k">Valeur pip 0.01 lot ($)</div>
          <div className="v">{results.valeurPip001 ?? 'Non trouvé'}</div>
        </div>
        <div className="result-item">
          <div className="k">Valeur pip 1.00 lot ($)</div>
          <div className="v">{results.valeurPip100 ?? 'Non trouvé'}</div>
        </div>
        <div className="result-item">
          <div className="k">Lot calculé (brut)</div>
          <div className="v">{results.brut != null ? results.brut.toFixed(4) : '—'}</div>
        </div>
        <div className="result-item highlight">
          <div className="k">Lot à utiliser (arrondi 0.01)</div>
          <div className="v">{results.aUtiliser != null ? results.aUtiliser.toFixed(2) : '—'}</div>
        </div>
        <div className="result-item">
          <div className="k">Perte réelle si SL touché ($)</div>
          <div className="v">{results.perteReelle != null ? results.perteReelle.toFixed(2) : '—'}</div>
        </div>
        <div className="result-item">
          <div className="k">Lot arrondi supérieur (min 0.01)</div>
          <div className="v">{results.arrondiSup != null ? results.arrondiSup.toFixed(2) : '—'}</div>
        </div>
        <div className="result-item">
          <div className="k">Perte réelle (arrondi supérieur) ($)</div>
          <div className="v">{results.perteReelleSup != null ? results.perteReelleSup.toFixed(2) : '—'}</div>
        </div>
      </div>
      <p className="hint" style={{ marginTop: '20px' }}>
        Note : le lot est arrondi vers le bas pour ne jamais dépasser le risque fixé. L'arrondi
        supérieur permet de prendre le trade quand le lot brut est trop petit pour le pas de 0.01,
        au prix d'un risque réel légèrement supérieur.
      </p>
    </div>
  )
}
