-- Capstone Book — schéma Supabase
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > coller > Run

-- ============ TABLES ============

create table if not exists hypotheses (
  cle text primary key,
  broker text not null,
  symbole text not null,
  identifiant_cle text,
  type text,
  valeur_pip_001 numeric,
  valeur_pip_100 numeric,
  note text,
  paire text not null
);

create table if not exists point_sizes (
  paire text primary key,
  taille_point numeric not null,
  note text
);

create table if not exists trades (
  id bigint generated always as identity primary key,
  date date not null,
  instrument text not null,
  direction text not null check (direction in ('Buy', 'Sell')),
  entry_price numeric,
  exit_price numeric,
  stop_loss_pts numeric,
  target_pts numeric,
  risk_pct numeric default 0.005,
  strategy text,
  notes text,
  structure_signal text,
  confirmation_zone text,
  trend_tf text,
  confirmation_tf text,
  broker_compte text,
  created_at timestamptz default now()
);

create table if not exists funding_objectives (
  id bigint generated always as identity primary key,
  numero int,
  firm text not null,
  capital_vise numeric not null default 100000,
  auteur text,
  type_challenge text,
  nombre_steps int default 1,
  date_achat_prevue date,
  step1_valide boolean default false,
  step1_date date,
  step2_valide boolean default false,
  step2_date date,
  step3_valide boolean default false,
  step3_date date,
  compte_finance boolean default false,
  cle_compte text unique
);

-- ============ ROW LEVEL SECURITY ============
-- Usage individuel (un seul utilisateur connecté) : toute personne authentifiée
-- a accès complet. Adaptez si vous ajoutez d'autres utilisateurs plus tard.

alter table hypotheses enable row level security;
alter table point_sizes enable row level security;
alter table trades enable row level security;
alter table funding_objectives enable row level security;

create policy "authenticated_full_access" on hypotheses
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_full_access" on point_sizes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_full_access" on trades
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_full_access" on funding_objectives
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ============ DONNÉES INITIALES (reprises de Capstone_book.xlsx) ============

insert into point_sizes (paire, taille_point, note) values
  ('US30', 1, 'Indice : 1 point saisi = 1 unité de prix'),
  ('US100', 1, 'Indice : 1 point saisi = 1 unité de prix'),
  ('US500', 1, 'Indice : 1 point saisi = 1 unité de prix'),
  ('USDJPY', 0.01, 'Paire cotée à 2 décimales : 1 pip = 0.01'),
  ('XAUUSD', 0.01, 'À vérifier selon votre broker : souvent 1 point = 0.01, parfois 0.10'),
  ('NZDUSD', 0.0001, 'Paire cotée à 4 décimales : 1 pip = 0.0001'),
  ('USDCHF', 0.0001, 'Paire cotée à 4 décimales : 1 pip = 0.0001'),
  ('EURUSD', 0.0001, 'Paire cotée à 4 décimales : 1 pip = 0.0001'),
  ('GBPUSD', 0.0001, 'Paire cotée à 4 décimales : 1 pip = 0.0001'),
  ('USDCAD', 0.0001, 'Paire cotée à 4 décimales : 1 pip = 0.0001'),
  ('AUDUSD', 0.0001, 'Paire cotée à 4 décimales : 1 pip = 0.0001')
on conflict (paire) do nothing;

insert into hypotheses (cle, broker, symbole, identifiant_cle, type, valeur_pip_001, valeur_pip_100, note, paire) values
  ('Funding Pips|US30', 'Funding Pips', 'US30.cash', 'Funding Pips - US30.cash', 'Indice', 0.05, 5, 'Confirmé par capture MT : 0.01 lot, 2 points, P/L -0.10$ le 2026-07-15', 'US30'),
  ('FTMO|US30', 'FTMO', 'US30.cash', 'FTMO - US30.cash', 'Indice', 0.01, 1, 'Selon vos spécifications de compte : FTMO ~40$/point pour 1.00 lot', 'US30'),
  ('FundedNext|US30', 'FundedNext', 'DJI30', 'FundedNext - DJI30', 'Indice', 0.1, 10, 'Selon vos spécifications de compte : FundedNext ~0.4$/point pour 1.00 lot', 'US30'),
  ('Funding Pips|USDJPY', 'Funding Pips', 'USDJPY', 'Funding Pips - USDJPY', 'Forex', 0.05, 5, 'À confirmer sur votre plateforme', 'USDJPY'),
  ('FundedNext|USDJPY', 'FundedNext', 'USDJPY', 'FundedNext - USDJPY', 'Forex', null, null, 'À renseigner : valeur pip variable selon le cours', 'USDJPY'),
  ('FTMO|USDJPY', 'FTMO', 'USDJPY', 'FTMO - USDJPY', 'Forex', 0.06, 6, 'À renseigner : valeur pip variable selon le cours', 'USDJPY'),
  ('Funding Pips|NZDUSD', 'Funding Pips', 'NZDUSD', 'Funding Pips - NZDUSD', 'Forex', 0.1, 10, 'À confirmer sur votre plateforme', 'NZDUSD'),
  ('FundedNext|NZDUSD', 'FundedNext', 'NZDUSD', 'FundedNext - NZDUSD', 'Forex', null, null, 'À renseigner', 'NZDUSD'),
  ('FTMO|NZDUSD', 'FTMO', 'NZDUSD', 'FTMO - NZDUSD', 'Forex', 0.1, 10, 'À renseigner', 'NZDUSD'),
  ('Funding Pips|USDCHF', 'Funding Pips', 'USDCHF', 'Funding Pips - USDCHF', 'Forex', 0.12, 12, 'À confirmer sur votre plateforme', 'USDCHF'),
  ('FTMO|USDCHF', 'FTMO', 'USDCHF', 'FTMO - USDCHF', 'Forex', 0.1, 10, 'À renseigner', 'USDCHF'),
  ('FundedNext|USDCHF', 'FundedNext', 'USDCHF', 'FundedNext - USDCHF', 'Forex', null, null, 'À renseigner', 'USDCHF'),
  ('Funding Pips|EURUSD', 'Funding Pips', 'EURUSD', 'Funding Pips - EURUSD', 'Forex', null, null, 'À renseigner', 'EURUSD'),
  ('FTMO|EURUSD', 'FTMO', 'EURUSD', 'FTMO - EURUSD', 'Forex', null, null, 'À renseigner', 'EURUSD'),
  ('FundedNext|EURUSD', 'FundedNext', 'EURUSD', 'FundedNext - EURUSD', 'Forex', null, null, 'À renseigner', 'EURUSD'),
  ('Funding Pips|GBPUSD', 'Funding Pips', 'GBPUSD', 'Funding Pips - GBPUSD', 'Forex', null, null, 'À renseigner', 'GBPUSD'),
  ('FTMO|GBPUSD', 'FTMO', 'GBPUSD', 'FTMO - GBPUSD', 'Forex', null, null, 'À renseigner', 'GBPUSD'),
  ('FundedNext|GBPUSD', 'FundedNext', 'GBPUSD', 'FundedNext - GBPUSD', 'Forex', null, null, 'À renseigner', 'GBPUSD'),
  ('Funding Pips|USDCAD', 'Funding Pips', 'USDCAD', 'Funding Pips - USDCAD', 'Forex', null, null, 'À renseigner', 'USDCAD'),
  ('FTMO|USDCAD', 'FTMO', 'USDCAD', 'FTMO - USDCAD', 'Forex', null, null, 'À renseigner', 'USDCAD'),
  ('FundedNext|USDCAD', 'FundedNext', 'USDCAD', 'FundedNext - USDCAD', 'Forex', null, null, 'À renseigner', 'USDCAD'),
  ('Funding Pips|AUDUSD', 'Funding Pips', 'AUDUSD', 'Funding Pips - AUDUSD', 'Forex', null, null, 'À renseigner', 'AUDUSD'),
  ('FTMO|AUDUSD', 'FTMO', 'AUDUSD', 'FTMO - AUDUSD', 'Forex', null, null, 'À renseigner', 'AUDUSD'),
  ('FundedNext|AUDUSD', 'FundedNext', 'AUDUSD', 'FundedNext - AUDUSD', 'Forex', null, null, 'À renseigner', 'AUDUSD'),
  ('Funding Pips|US100', 'Funding Pips', 'US100.cash', 'Funding Pips - US100.cash', 'Indice', null, null, 'À renseigner : vérifier le symbole exact (Nasdaq 100)', 'US100'),
  ('FTMO|US100', 'FTMO', 'US100.cash', 'FTMO - US100.cash', 'Indice', null, null, 'À renseigner', 'US100'),
  ('FundedNext|US100', 'FundedNext', 'NAS100', 'FundedNext - NAS100', 'Indice', null, null, 'À renseigner : symbole probable Nasdaq 100', 'US100'),
  ('Funding Pips|US500', 'Funding Pips', 'US500.cash', 'Funding Pips - US500.cash', 'Indice', null, null, 'À renseigner : vérifier le symbole (S&P 500)', 'US500'),
  ('FTMO|US500', 'FTMO', 'US500.cash', 'FTMO - US500.cash', 'Indice', null, null, 'À renseigner', 'US500'),
  ('FundedNext|US500', 'FundedNext', 'SPX500', 'FundedNext - SPX500', 'Indice', null, null, 'À renseigner : symbole probable S&P 500', 'US500'),
  ('Funding Pips|XAUUSD', 'Funding Pips', 'XAUUSD', 'Funding Pips - XAUUSD', 'Metal', null, null, 'À renseigner (Or)', 'XAUUSD'),
  ('FTMO|XAUUSD', 'FTMO', 'XAUUSD', 'FTMO - XAUUSD', 'Metal', null, null, 'À renseigner (Or)', 'XAUUSD'),
  ('FundedNext|XAUUSD', 'FundedNext', 'XAUUSD', 'FundedNext - XAUUSD', 'Metal', null, null, 'À renseigner (Or)', 'XAUUSD')
on conflict (cle) do nothing;

insert into funding_objectives (numero, firm, capital_vise, auteur, type_challenge, nombre_steps, date_achat_prevue, cle_compte) values
  (1, 'Funding Pips', 100000, 'BAGNAN', '1-Step', 1, '2026-11-01', '1 - Funding Pips'),
  (2, 'FTMO', 100000, 'BAGNAN', '1-Step', 1, '2027-02-01', '2 - FTMO'),
  (3, 'Funding Pips', 100000, 'BAGNAN', '1-Step', 1, '2027-05-01', '3 - Funding Pips'),
  (4, 'FTMO', 100000, 'Capstone', '1-Step', 1, '2027-08-01', '4 - FTMO'),
  (5, 'FundedNext', 100000, 'BAGNAN', null, null, null, '5 - FundedNext')
on conflict (cle_compte) do nothing;

-- Trades existants (reprend votre historique du Trade Log)
-- Comptes non renseignés dans le fichier d'origine ; assignez-les à une clé
-- funding_objectives (ex: '1 - Funding Pips') une fois vos comptes ouverts.
insert into trades (date, instrument, direction, entry_price, exit_price, stop_loss_pts, target_pts, risk_pct, strategy, structure_signal, confirmation_zone) values
  ('2026-07-29', 'US30', 'Buy', 52230, 52130, 100, 770, 0.005, 'Supply', 'CHoCH', 'Supply'),
  ('2026-07-29', 'US30', 'Buy', 51915, 51815, 100, 715, 0.005, 'Extreme zone', 'CHoCH', 'Supply'),
  ('2026-07-30', 'USDJPY', 'Buy', 162.85, 162.60, 20, 200, 0.005, 'Extreme zone', null, null),
  ('2026-07-30', 'USDCHF', 'Buy', 0.8083, 0.806, 23, 200, 0.005, null, null, null),
  ('2026-07-30', 'US30', 'Sell', 52230, 52280, 50, 530, 0.005, null, null, null);
