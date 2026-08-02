// Reproduit fidèlement les formules du fichier Capstone_book.xlsx (onglet Legend).
// Chaque fonction correspond à une colonne du Trade Log.

/**
 * Point Value (R-Multiple) = Target / Stop Loss
 */
export function pointValueR(targetPts, stopLossPts) {
  if (!stopLossPts) return 0
  return targetPts / stopLossPts
}

/**
 * Reward % = Risk % x R-Multiple (corrigé 2026-08-01)
 */
export function rewardPct(riskPct, targetPts, stopLossPts) {
  return riskPct * pointValueR(targetPts, stopLossPts)
}

/**
 * Risk Amount ($) = Account Balance x Risk %
 */
export function riskAmount(accountBalance, riskPct) {
  return accountBalance * riskPct
}

/**
 * Potential Reward ($) = Risk Amount x Point Value (R-Multiple)
 */
export function potentialReward(accountBalance, riskPct, targetPts, stopLossPts) {
  return riskAmount(accountBalance, riskPct) * pointValueR(targetPts, stopLossPts)
}

/**
 * R Realized = différence de prix (ajustée selon la direction, convertie en points
 * via la taille du point) / Stop Loss (pts).
 */
export function rRealized(direction, entryPrice, exitPrice, stopLossPts, pointSize) {
  if (!stopLossPts || !pointSize) return 0
  const rawDiff = direction === 'Buy' ? exitPrice - entryPrice : entryPrice - exitPrice
  const diffInPoints = rawDiff / pointSize
  return diffInPoints / stopLossPts
}

/**
 * P&L ($) = R Realized x Risk Amount
 */
export function pnl(rRealizedValue, riskAmountValue) {
  return rRealizedValue * riskAmountValue
}

/**
 * Lot calculé (brut) = Risque ($) / (Stop Loss en points x valeur pip 1.00 lot)
 */
export function lotBrut(riskAmountValue, stopLossPts, valeurPip100) {
  if (!stopLossPts || !valeurPip100) return 0
  return riskAmountValue / (stopLossPts * valeurPip100)
}

/**
 * Lot à utiliser = arrondi au pas de 0.01, vers le bas (ne jamais dépasser le risque cible).
 * Si le lot brut est inférieur à 0.01, retourne 0 (voir lotArrondiSuperieur pour l'alternative).
 */
export function lotAUtiliser(lotBrutValue) {
  return Math.floor(lotBrutValue * 100) / 100
}

/**
 * Arrondi supérieur : permet de prendre le trade même quand le lot brut est trop
 * petit pour le pas de 0.01 (minimum 0.01), au prix d'un risque réel légèrement
 * supérieur au risque visé.
 */
export function lotArrondiSuperieur(lotBrutValue) {
  const rounded = Math.ceil(lotBrutValue * 100) / 100
  return rounded < 0.01 ? 0.01 : rounded
}

/**
 * Calcule l'ensemble des champs dérivés d'un trade, étant donné :
 * - le trade brut (inputs saisis par l'utilisateur)
 * - le solde du compte AVANT ce trade (calculé en cascade depuis le trade précédent
 *   du même compte)
 * - la valeur pip 1.00 lot (lookup Hypothèses via broker + paire)
 * - la taille du point (lookup table Hypothèses, par paire normalisée)
 */
export function computeTradeDerived(trade, accountBalanceBefore, valeurPip100, pointSize) {
  const riskPct = trade.risk_pct ?? 0.005
  const reward_pct = rewardPct(riskPct, trade.target_pts, trade.stop_loss_pts)
  const point_value_r = pointValueR(trade.target_pts, trade.stop_loss_pts)
  const risk_amount = riskAmount(accountBalanceBefore, riskPct)
  const potential_reward = potentialReward(accountBalanceBefore, riskPct, trade.target_pts, trade.stop_loss_pts)
  const r_realized =
    trade.exit_price != null
      ? rRealized(trade.direction, trade.entry_price, trade.exit_price, trade.stop_loss_pts, pointSize)
      : null
  const pnl_value = r_realized != null ? pnl(r_realized, risk_amount) : null
  const lot_brut = valeurPip100 ? lotBrut(risk_amount, trade.stop_loss_pts, valeurPip100) : null
  const lot_a_utiliser = lot_brut != null ? lotAUtiliser(lot_brut) : null

  return {
    account_balance: accountBalanceBefore,
    reward_pct,
    point_value_r,
    risk_amount,
    potential_reward,
    r_realized,
    pnl: pnl_value,
    lot_brut,
    lot_a_utiliser
  }
}

/**
 * Parcourt les trades (triés par date puis id) d'un même compte et calcule
 * le solde en cascade (Account Balance x trade N = solde initial + somme des P&L des trades 1..N-1).
 */
export function computeAccountCascade(trades, initialBalance, hypothesesLookup, pointSizeLookup) {
  let runningBalance = initialBalance
  const results = []
  for (const trade of trades) {
    const key = `${trade.broker_compte}|${trade.instrument}`
    const valeurPip100 = hypothesesLookup[key]?.valeur_pip_100 ?? null
    const pointSize = pointSizeLookup[trade.instrument] ?? null
    const derived = computeTradeDerived(trade, runningBalance, valeurPip100, pointSize)
    results.push({ ...trade, ...derived })
    if (derived.pnl != null) runningBalance += derived.pnl
  }
  return results
}

/**
 * Dashboard : agrège une liste de trades déjà enrichis (computeAccountCascade).
 */
export function computeDashboard(enrichedTrades) {
  const withOutcome = enrichedTrades.filter((t) => t.entry_price != null)
  const withPnl = enrichedTrades.filter((t) => t.pnl != null)
  const wins = withPnl.filter((t) => t.pnl > 0).length
  const losses = withPnl.filter((t) => t.pnl < 0).length
  const totalR = withPnl.reduce((sum, t) => sum + (t.r_realized ?? 0), 0)
  const totalPnl = withPnl.reduce((sum, t) => sum + (t.pnl ?? 0), 0)
  const avgR = withPnl.length ? totalR / withPnl.length : 0
  const avgPointValue = enrichedTrades.length
    ? enrichedTrades.reduce((sum, t) => sum + (t.point_value_r ?? 0), 0) / enrichedTrades.length
    : 0

  return {
    totalTrades: withOutcome.length,
    wins,
    losses,
    winRate: withPnl.length ? (wins / withPnl.length) * 100 : 0,
    avgRRealized: avgR,
    totalRRealized: totalR,
    totalPnl,
    systemPointValue: avgPointValue
  }
}
