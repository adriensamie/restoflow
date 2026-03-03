/**
 * scripts/simulate.ts
 * Simulation enterprise org multi-site × 12 mois
 * Usage: npx tsx scripts/simulate.ts [--force]
 *
 * Cible l'org enterprise (plan='enterprise'), cree 3 child orgs
 * et peuple chaque enfant avec ses propres donnees.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import * as path from 'path'
import type { Database } from '../types/database'

// ─── Load .env.local ─────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) {
    console.error('.env.local introuvable')
    process.exit(1)
  }
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1)
    if (!process.env[key]) process.env[key] = val
  }
}
loadEnv()

// ─── Types ───────────────────────────────────────────────────────────────────

type OrgSize = 'small' | 'medium' | 'large'

interface RestaurantProfile {
  nom: string; type: string; ville: string; adresse: string
}

interface CatalogFournisseur {
  nom: string; contact_nom: string; contact_email: string
  contact_telephone: string; adresse: string; delai_livraison: number
  conditions_paiement: string; specialite: string
}
interface CatalogProduit {
  nom: string; categorie: string; unite: string; prix_unitaire: number
  seuil_alerte: number; allergenes: string[]; fournisseur_idx: number
}
interface CatalogEmploye {
  prenom: string; nom: string; poste: string
  taux_horaire: number; heures_contrat: number
}
interface CatalogRecette {
  nom: string; type: string; prix_vente_ttc: number; nb_portions: number
  description: string; allergenes: string[]
  ingredients: { produit_idx: number; quantite: number; unite: string }[]
}
interface CatalogVin {
  nom: string; appellation: string; categorie: string; zone: string
  prix_achat_ht: number; prix_vente_ttc: number
  vendu_au_verre: boolean; prix_verre_ttc: number | null
}
interface CatalogHaccp {
  nom: string; type: string; description: string; frequence: string
  valeur_min: number | null; valeur_max: number | null; unite: string | null
}
interface CatalogueData {
  fournisseurs: CatalogFournisseur[]; produits: CatalogProduit[]
  employes: CatalogEmploye[]; recettes: CatalogRecette[]
  vins: CatalogVin[]; haccp_templates: CatalogHaccp[]
}

interface OrgContext {
  orgId: string; orgIdx: number; profile: RestaurantProfile
  size: OrgSize; catalogue: CatalogueData; baseDailyRevenue: number
  fournisseurIds: string[]; produitIds: string[]; employeIds: string[]
  recetteIds: string[]; vinIds: string[]; haccpTemplateIds: string[]
}

// ─── Constants ───────────────────────────────────────────────────────────────

const BATCH_SIZE = 500

const SEASONAL: Record<number, number> = {
  3: 0.85, 4: 0.85, 5: 1.10, 6: 1.10, 7: 1.15,
  8: 0.70, 9: 1.05, 10: 1.05, 11: 1.15, 12: 1.15, 1: 0.80, 2: 0.80,
}

const FERIES = new Set([
  '2025-04-21','2025-05-01','2025-05-08','2025-05-29','2025-06-09',
  '2025-07-14','2025-08-15','2025-11-01','2025-11-11','2025-12-25','2026-01-01',
])

const METEO: Record<number, { cond: string[]; temp: [number, number] }> = {
  3: { cond: ['nuageux','pluie','ensoleille'], temp: [8,15] },
  4: { cond: ['ensoleille','nuageux','pluie'], temp: [10,18] },
  5: { cond: ['ensoleille','nuageux'], temp: [14,22] },
  6: { cond: ['ensoleille','chaud'], temp: [18,28] },
  7: { cond: ['ensoleille','chaud','canicule'], temp: [22,35] },
  8: { cond: ['ensoleille','chaud','orage'], temp: [20,33] },
  9: { cond: ['ensoleille','nuageux'], temp: [16,25] },
  10: { cond: ['nuageux','pluie','ensoleille'], temp: [10,18] },
  11: { cond: ['pluie','nuageux','froid'], temp: [5,12] },
  12: { cond: ['froid','neige','nuageux'], temp: [0,8] },
  1: { cond: ['froid','neige','nuageux'], temp: [-2,6] },
  2: { cond: ['froid','nuageux','pluie'], temp: [0,10] },
}

const COLORS = [
  '#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7',
  '#DDA0DD','#98D8C8','#F7DC6F','#BB8FCE','#82E0AA',
  '#F8C471','#85C1E9','#F1948A','#73C6B6','#D7BDE2',
  '#A9CCE3','#A3E4D7','#FAD7A0','#D5F5E3','#FADBD8',
]

const TYPE_SIZE: Record<string, OrgSize> = {
  bistrot:'small', creperie:'small', pizzeria:'small', kebab:'small',
  traiteur:'small', bar_restaurant:'small',
  sushi:'medium', italien:'medium', thai:'medium', indien:'medium',
  libanais:'medium', burger:'medium',
  gastronomique:'large', brasserie:'large', hotel_restaurant:'large', fruits_de_mer:'large',
}

interface SizeCfg {
  fournisseurs: [number, number]; produits: [number, number]
  employes: [number, number]; recettes: [number, number]; vins: [number, number]
  orders: [number, number]; planning: [number, number]; haccp: [number, number]
  sorties: [number, number]; pertes: [number, number]; caisse: [number, number]
  invLignes: [number, number]; previsions: [number, number]
  lots: [number, number]; prix: [number, number]; cave: [number, number]
  revenue: [number, number]
}

const CFG: Record<OrgSize, SizeCfg> = {
  small: {
    fournisseurs:[3,5], produits:[20,40], employes:[3,5], recettes:[8,15], vins:[5,10],
    orders:[2,4], planning:[100,150], haccp:[150,200], sorties:[100,200],
    pertes:[4,8], caisse:[40,50], invLignes:[20,40], previsions:[10,12],
    lots:[5,15], prix:[5,15], cave:[8,12], revenue:[800,1500],
  },
  medium: {
    fournisseurs:[5,8], produits:[40,80], employes:[6,10], recettes:[15,30], vins:[10,25],
    orders:[4,6], planning:[150,250], haccp:[200,250], sorties:[200,350],
    pertes:[6,10], caisse:[45,55], invLignes:[40,80], previsions:[12,15],
    lots:[15,30], prix:[10,25], cave:[12,18], revenue:[1500,3000],
  },
  large: {
    fournisseurs:[8,15], produits:[80,150], employes:[10,20], recettes:[30,60], vins:[25,60],
    orders:[6,8], planning:[200,300], haccp:[250,300], sorties:[350,500],
    pertes:[8,12], caisse:[50,60], invLignes:[80,150], previsions:[13,15],
    lots:[25,40], prix:[20,30], cave:[15,20], revenue:[3000,6000],
  },
}

const MONTHS: [number, number][] = [
  [2025,3],[2025,4],[2025,5],[2025,6],[2025,7],[2025,8],
  [2025,9],[2025,10],[2025,11],[2025,12],[2026,1],[2026,2],[2026,3],
]

const DELETE_ORDER = [
  'lignes_retour','retours_fournisseur','lots_produit','prix_produit_historique',
  'notifications','notification_preferences','push_subscriptions','role_permissions',
  'pin_sessions','lignes_inventaire','sessions_inventaire','mouvements_cave',
  'objectifs_kpi','haccp_releves','haccp_templates','fiches_paie',
  'creneaux_planning','employes','snapshots_food_cost','previsions',
  'events_caisse','config_caisse','recette_ingredients','recettes',
  'mouvements_stock','commande_lignes','commandes','produit_fournisseur',
  'fournisseurs','vins','produits',
] as const

// ─── Child site definitions ─────────────────────────────────────────────────

interface ChildSiteDef {
  nom: string
  type: string
  size: OrgSize
  ville: string
  adresse: string
}

const CHILD_SITES: ChildSiteDef[] = [
  { nom: 'Le Bernardin', type: 'fruits_de_mer', size: 'large', ville: 'Paris', adresse: '12 rue de Rivoli, 75001 Paris' },
  { nom: 'Chez Paul', type: 'bistrot', size: 'small', ville: 'Lyon', adresse: '45 rue Merciere, 69002 Lyon' },
  { nom: 'La Pizzeria Napoli', type: 'pizzeria', size: 'small', ville: 'Marseille', adresse: '8 quai du Port, 13002 Marseille' },
]

// ─── Seeded PRNG ─────────────────────────────────────────────────────────────

class Rng {
  private s: number
  constructor(seed = 42) { this.s = seed }
  next() { this.s = (this.s * 1664525 + 1013904223) & 0xFFFFFFFF; return (this.s >>> 0) / 0xFFFFFFFF }
  int(a: number, b: number) { return Math.floor(this.next() * (b - a + 1)) + a }
  float(a: number, b: number) { return this.next() * (b - a) + a }
  pick<T>(arr: T[]): T { return arr[this.int(0, arr.length - 1)] }
  pickN<T>(arr: T[], n: number): T[] {
    const sh = [...arr]
    for (let i = sh.length - 1; i > 0; i--) { const j = this.int(0, i);[sh[i], sh[j]] = [sh[j], sh[i]] }
    return sh.slice(0, Math.min(n, sh.length))
  }
  chance(p: number) { return this.next() < p }
}
const rng = new Rng(42)

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(msg: string) { console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`) }
function logErr(msg: string) { console.error(`[${new Date().toISOString().slice(11, 19)}] ERR ${msg}`) }

function monthDates(y: number, m: number) {
  const days = new Date(y, m, 0).getDate()
  return Array.from({ length: days }, (_, i) =>
    `${y}-${String(m).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`)
}
function workDays(y: number, m: number) {
  return monthDates(y, m).filter(d => new Date(d).getDay() !== 0)
}
function ym(y: number, m: number) { return `${y}-${String(m).padStart(2, '0')}` }
function ymd1(y: number, m: number) { return `${ym(y, m)}-01` }
function round2(n: number) { return Math.round(n * 100) / 100 }

const VALID_POSTES = ['cuisine','salle','bar','plonge','livraison','direction','autre'] as const
const VALID_HACCP_TYPES = ['temperature','nettoyage','reception','dlc','huile_friture','pest_control','autre'] as const

function mapPoste(raw: string): string {
  const l = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (/chef|cuisinier|second|commis|patissier|boulanger/i.test(l)) return 'cuisine'
  if (/serveur|salle|hote|maitre|sommelier|manager_salle/i.test(l)) return 'salle'
  if (/barman|bar/i.test(l)) return 'bar'
  if (/plong/i.test(l)) return 'plonge'
  if (/livr/i.test(l)) return 'livraison'
  if (/direct|patron|gerant|manager/i.test(l)) return 'direction'
  if (/apprenti/i.test(l)) return 'cuisine'
  if (VALID_POSTES.includes(l as any)) return l
  return 'autre'
}

function mapHaccpType(raw: string): string {
  const l = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (/temper/i.test(l)) return 'temperature'
  if (/nettoy|propret|hygien/i.test(l)) return 'nettoyage'
  if (/recep/i.test(l)) return 'reception'
  if (/dlc|date.*limit|perem/i.test(l)) return 'dlc'
  if (/huile|frit/i.test(l)) return 'huile_friture'
  if (/nuisib|pest|rongeur|insect/i.test(l)) return 'pest_control'
  if (/traca/i.test(l)) return 'dlc'
  if (VALID_HACCP_TYPES.includes(l as any)) return l
  return 'autre'
}

function repairJSON(text: string): string {
  let s = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  const start = s.search(/[\[{]/)
  if (start === -1) throw new Error('No JSON found')
  s = s.slice(start)
  s = s.replace(/,\s*([\]}])/g, '$1')
  s = s.replace(/:\s*([}\]])/g, ':null$1')
  s = s.replace(/:\s*,/g, ':null,')
  if (!s.includes('"') && s.includes("'")) s = s.replace(/'/g, '"')
  const opens: string[] = []
  let inStr = false, esc = false
  for (const ch of s) {
    if (esc) { esc = false; continue }
    if (ch === '\\') { esc = true; continue }
    if (ch === '"') { inStr = !inStr; continue }
    if (inStr) continue
    if (ch === '{' || ch === '[') opens.push(ch)
    if (ch === '}') { if (opens.length && opens[opens.length - 1] === '{') opens.pop() }
    if (ch === ']') { if (opens.length && opens[opens.length - 1] === '[') opens.pop() }
  }
  while (opens.length) {
    const o = opens.pop()
    s = s.replace(/,\s*$/, '')
    s += o === '{' ? '}' : ']'
  }
  return s
}

function parseJSON(text: string) {
  try { return JSON.parse(text) } catch {}
  try { return JSON.parse(repairJSON(text)) } catch (e: any) {
    throw new Error(`JSON parse failed: ${e.message}`)
  }
}

// ─── Supabase + Anthropic ────────────────────────────────────────────────────

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) { console.error('Missing SUPABASE env vars'); process.exit(1) }
  return createClient<Database>(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function batchInsert(sb: SupabaseClient<Database>, table: string, rows: any[]): Promise<{ data: any[]; errs: string[] }> {
  const out: any[] = [], errs: string[] = []
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { data, error } = await (sb.from(table) as any).insert(batch).select()
    if (error) errs.push(`${table}[${i}]: ${error.message}`)
    else if (data) out.push(...data)
  }
  return { data: out, errs }
}

// ─── Claude AI generation ────────────────────────────────────────────────────

async function genCataloguePart1(ai: Anthropic, type: string): Promise<Pick<CatalogueData, 'fournisseurs' | 'produits' | 'employes'>> {
  log(`  Catalogue "${type}" part 1/3 (fournisseurs+produits+employes)...`)
  const resp = await ai.messages.create({
    model: 'claude-haiku-4-5-20251001', max_tokens: 8000,
    messages: [{ role: 'user', content:
      `Genere pour un restaurant "${type}" en France. JSON strict, sans markdown, sans commentaires.
{"fournisseurs":[10 objets: nom, contact_nom, contact_email, contact_telephone, adresse, delai_livraison (int 1-5), conditions_paiement, specialite],
"produits":[40 objets: nom, categorie, unite (kg/g/L/cl/piece), prix_unitaire (number), seuil_alerte (int), fournisseur_idx (int 0-9)],
"employes":[15 objets: prenom, nom, poste, taux_horaire (number), heures_contrat (int)]}` }],
  })
  return parseJSON((resp.content[0] as any).text)
}

async function genCataloguePart2(ai: Anthropic, type: string, nbProduits: number): Promise<Pick<CatalogueData, 'recettes' | 'vins'>> {
  log(`  Catalogue "${type}" part 2/3 (recettes+vins)...`)
  const maxIdx = Math.max(0, nbProduits - 1)
  const resp = await ai.messages.create({
    model: 'claude-haiku-4-5-20251001', max_tokens: 8000,
    messages: [{ role: 'user', content:
      `Genere pour un restaurant "${type}" en France. JSON strict, sans markdown.
{"recettes":[20 objets: nom, type (entree/plat/dessert), prix_vente_ttc (number), nb_portions (int), description (10 mots max), ingredients ([{produit_idx:int 0-${maxIdx}, quantite:number, unite:string}] 3-5 par recette)],
"vins":[15 objets: nom, appellation, categorie (rouge/blanc/rose), zone, prix_achat_ht (number), prix_vente_ttc (number), vendu_au_verre (bool), prix_verre_ttc (number ou null)]}` }],
  })
  return parseJSON((resp.content[0] as any).text)
}

async function genCataloguePart3(ai: Anthropic, type: string): Promise<Pick<CatalogueData, 'haccp_templates'>> {
  log(`  Catalogue "${type}" part 3/3 (haccp)...`)
  const resp = await ai.messages.create({
    model: 'claude-haiku-4-5-20251001', max_tokens: 2000,
    messages: [{ role: 'user', content:
      `Genere 8 templates HACCP pour un restaurant "${type}" en France, format JSON strict sans markdown:
{"haccp_templates":[8 objets: nom, type (temperature/proprete/huile/tracabilite/reception/date_limite), description (courte), frequence (quotidien/hebdomadaire/mensuel/a_reception), valeur_min (number ou null), valeur_max (number ou null), unite ("°C"/"%"/null)]}` }],
  })
  return parseJSON((resp.content[0] as any).text)
}

async function withRetry<T>(fn: () => Promise<T>, label: string, retries = 2): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try { return await fn() }
    catch (e: any) {
      if (attempt < retries) { log(`  Retry ${attempt + 1}/${retries} for ${label}: ${e.message}`) }
      else throw e
    }
  }
  throw new Error('unreachable')
}

async function genCatalogue(ai: Anthropic, type: string): Promise<CatalogueData> {
  log(`Generating catalogue for "${type}"...`)
  const p1 = await withRetry(() => genCataloguePart1(ai, type), `${type} p1`)
  const p2 = await withRetry(() => genCataloguePart2(ai, type, p1.produits.length), `${type} p2`)
  const p3 = await withRetry(() => genCataloguePart3(ai, type), `${type} p3`)
  return { ...p1, ...p2, ...p3 }
}

// ─── Reference data insertion ────────────────────────────────────────────────

async function insertRefData(sb: SupabaseClient<Database>, ctx: OrgContext) {
  const { orgId, size, catalogue: cat } = ctx
  const c = CFG[size]

  // Fournisseurs
  const nF = rng.int(c.fournisseurs[0], c.fournisseurs[1])
  const fRows = cat.fournisseurs.slice(0, nF).map(f => ({
    organization_id: orgId, nom: f.nom, contact_nom: f.contact_nom,
    contact_email: f.contact_email, contact_telephone: f.contact_telephone,
    adresse: f.adresse, delai_livraison: f.delai_livraison,
    conditions_paiement: f.conditions_paiement, actif: true,
  }))
  const { data: fData, errs: fE } = await batchInsert(sb, 'fournisseurs', fRows)
  fE.forEach(e => logErr(e))
  ctx.fournisseurIds = fData.map((r: any) => r.id)
  log(`  ${ctx.fournisseurIds.length} fournisseurs`)

  // Produits
  const nP = rng.int(c.produits[0], c.produits[1])
  const pRows = cat.produits.slice(0, nP).map(p => ({
    organization_id: orgId, nom: p.nom, categorie: p.categorie || 'epicerie',
    unite: p.unite || 'kg', prix_unitaire: p.prix_unitaire ?? 5,
    seuil_alerte: p.seuil_alerte ?? 10, actif: true,
  }))
  const { data: pData, errs: pE } = await batchInsert(sb, 'produits', pRows)
  pE.forEach(e => logErr(e))
  ctx.produitIds = pData.map((r: any) => r.id)
  log(`  ${ctx.produitIds.length} produits`)

  // Produit-Fournisseur links
  const pfRows: any[] = []
  for (let i = 0; i < ctx.produitIds.length; i++) {
    const cp = cat.produits[i]
    if (!cp) continue
    const fi = cp.fournisseur_idx % ctx.fournisseurIds.length
    pfRows.push({
      organization_id: orgId, produit_id: ctx.produitIds[i],
      fournisseur_id: ctx.fournisseurIds[fi],
      prix_negocie: round2(cp.prix_unitaire * rng.float(0.85, 0.95)),
      unite_commande: cp.unite, fournisseur_principal: true,
    })
    if (rng.chance(0.3) && ctx.fournisseurIds.length > 1) {
      const fi2 = (fi + 1) % ctx.fournisseurIds.length
      pfRows.push({
        organization_id: orgId, produit_id: ctx.produitIds[i],
        fournisseur_id: ctx.fournisseurIds[fi2],
        prix_negocie: round2(cp.prix_unitaire * rng.float(0.90, 1.05)),
        unite_commande: cp.unite, fournisseur_principal: false,
      })
    }
  }
  const { errs: pfE } = await batchInsert(sb, 'produit_fournisseur', pfRows)
  pfE.forEach(e => logErr(e))
  log(`  ${pfRows.length} liens produit-fournisseur`)

  // Employes
  const nE = rng.int(c.employes[0], c.employes[1])
  const eRows = cat.employes.slice(0, nE).map((e, i) => ({
    organization_id: orgId, prenom: e.prenom, nom: e.nom,
    poste: mapPoste(e.poste),
    taux_horaire: e.taux_horaire ?? 12, heures_contrat: e.heures_contrat ?? 35,
    couleur: COLORS[i % COLORS.length], actif: true,
  }))
  const { data: eData, errs: eE } = await batchInsert(sb, 'employes', eRows)
  eE.forEach(e => logErr(e))
  ctx.employeIds = eData.map((r: any) => r.id)
  log(`  ${ctx.employeIds.length} employes`)

  // Recettes + ingredients
  const nR = rng.int(c.recettes[0], c.recettes[1])
  const rRows = cat.recettes.slice(0, nR).map(r => ({
    organization_id: orgId, nom: r.nom, type: r.type || 'plat',
    prix_vente_ttc: r.prix_vente_ttc ?? 15, nb_portions: r.nb_portions ?? 1,
    description: r.description || null, actif: true,
  }))
  const { data: rData, errs: rE } = await batchInsert(sb, 'recettes', rRows)
  rE.forEach(e => logErr(e))
  ctx.recetteIds = rData.map((r: any) => r.id)
  log(`  ${ctx.recetteIds.length} recettes`)

  const ingRows: any[] = []
  for (let i = 0; i < ctx.recetteIds.length; i++) {
    const cr = cat.recettes[i]
    if (!cr?.ingredients) continue
    for (let j = 0; j < cr.ingredients.length; j++) {
      const ing = cr.ingredients[j]
      const pi = ing.produit_idx % ctx.produitIds.length
      const pu = cat.produits[pi]?.prix_unitaire
      ingRows.push({
        organization_id: orgId, recette_id: ctx.recetteIds[i],
        produit_id: ctx.produitIds[pi],
        quantite: typeof ing.quantite === 'number' ? ing.quantite : 1,
        unite: typeof ing.unite === 'string' ? ing.unite : 'g',
        cout_unitaire: typeof pu === 'number' ? pu : null, ordre: j + 1,
      })
    }
  }
  if (ingRows.length) {
    const { errs } = await batchInsert(sb, 'recette_ingredients', ingRows)
    errs.forEach(e => logErr(e))
  }
  log(`  ${ingRows.length} ingredients`)

  // Vins
  const nV = rng.int(c.vins[0], c.vins[1])
  const vRows = cat.vins.slice(0, nV).map(v => ({
    organization_id: orgId, nom: v.nom, appellation: v.appellation,
    categorie: v.categorie, zone: v.zone,
    prix_achat_ht: v.prix_achat_ht, prix_vente_ttc: v.prix_vente_ttc,
    vendu_au_verre: v.vendu_au_verre, prix_verre_ttc: v.prix_verre_ttc,
    contenance_verre: v.vendu_au_verre ? 15 : null,
    stock_bouteilles: rng.int(6, 48), seuil_alerte: rng.int(3, 12), actif: true,
  }))
  const { data: vData, errs: vE } = await batchInsert(sb, 'vins', vRows)
  vE.forEach(e => logErr(e))
  ctx.vinIds = vData.map((r: any) => r.id)
  log(`  ${ctx.vinIds.length} vins`)

  // HACCP templates
  const tRows = cat.haccp_templates.map(t => ({
    organization_id: orgId, nom: t.nom, type: mapHaccpType(t.type),
    description: t.description || null,
    frequence: t.frequence || 'quotidien',
    valeur_min: typeof t.valeur_min === 'number' ? t.valeur_min : null,
    valeur_max: typeof t.valeur_max === 'number' ? t.valeur_max : null,
    unite: t.unite || null, actif: true,
  }))
  const { data: tData, errs: tE } = await batchInsert(sb, 'haccp_templates', tRows)
  tE.forEach(e => logErr(e))
  ctx.haccpTemplateIds = tData.map((r: any) => r.id)
  log(`  ${ctx.haccpTemplateIds.length} templates HACCP`)
}

// ─── Monthly simulation ─────────────────────────────────────────────────────

async function simMonth(sb: SupabaseClient<Database>, ctx: OrgContext, year: number, month: number): Promise<number> {
  if (!ctx.produitIds.length || !ctx.employeIds.length || !ctx.fournisseurIds.length) return 0
  let total = 0
  const dates = monthDates(year, month)
  const wDays = workDays(year, month)
  if (!wDays.length) return 0
  const seas = SEASONAL[month] ?? 1.0
  const cfg = CFG[ctx.size]
  const dailyRev = ctx.baseDailyRevenue * seas
  const met = METEO[month] ?? { cond: ['nuageux'], temp: [10, 20] as [number, number] }

  // Check if this is the current month (mars 2026) for brouillon/envoyee statuses
  const now = new Date()
  const isCurrentMonth = year === now.getFullYear() && month === (now.getMonth() + 1)

  // ── 1. Commandes ──────────────────────────────────────────────────────
  const nCmd = rng.int(cfg.orders[0], cfg.orders[1])
  const cmdIds: string[] = []
  const stockEntrees: any[] = []

  for (let c = 0; c < nCmd; c++) {
    const fIdx = rng.int(0, ctx.fournisseurIds.length - 1)
    const dateCmd = rng.pick(wDays.slice(0, Math.max(1, wDays.length - 3)))
    const dateLiv = dates[Math.min(dates.indexOf(dateCmd) + rng.int(1, 5), dates.length - 1)]
    const nLig = rng.int(5, 15)
    const prods = rng.pickN(ctx.produitIds, nLig)

    const lignes = prods.map(pId => {
      const pi = ctx.produitIds.indexOf(pId)
      const cp = ctx.catalogue.produits[pi]
      return { produitId: pId, qty: rng.int(2, 30), prix: cp?.prix_unitaire ?? rng.float(1, 20) }
    })
    const totalHt = round2(lignes.reduce((s, l) => s + l.qty * l.prix, 0))
    const numero = `CMD-${dateCmd.replace(/-/g, '')}-${String(ctx.orgIdx).padStart(2, '0')}${String(c).padStart(3, '0')}`

    // For current month: create a mix of brouillon, envoyee, and recue
    let statut: string
    if (isCurrentMonth) {
      if (c < 2) statut = 'brouillon'
      else if (c < 4) statut = 'envoyee'
      else statut = 'recue'
    } else {
      const isPast = new Date(dateCmd) < new Date()
      statut = isPast ? 'recue' : 'envoyee'
    }

    const isRecue = statut === 'recue'

    const { data: cmd, error } = await sb.from('commandes').insert({
      organization_id: ctx.orgId, fournisseur_id: ctx.fournisseurIds[fIdx],
      numero, statut, date_livraison_prevue: dateLiv,
      date_livraison_reelle: isRecue ? dateLiv : null, total_ht: totalHt,
    }).select('id').single()
    if (error) { logErr(`cmd: ${error.message}`); continue }
    cmdIds.push(cmd.id)
    total++

    // commande_lignes — NO organization_id
    const clRows = lignes.map(l => {
      const qr = isRecue ? Math.max(0, l.qty + rng.int(-1, 1)) : null
      return {
        commande_id: cmd.id, produit_id: l.produitId,
        quantite_commandee: l.qty, quantite_recue: qr, prix_unitaire: round2(l.prix),
      }
    })
    const { errs: clE } = await batchInsert(sb, 'commande_lignes', clRows)
    clE.forEach(e => logErr(e))
    total += clRows.length

    // Stock entrees from received commands
    if (isRecue) {
      for (const l of lignes) {
        const qr = Math.max(1, l.qty + rng.int(-1, 1))
        stockEntrees.push({
          organization_id: ctx.orgId, produit_id: l.produitId,
          type: 'entree' as const, quantite: qr, prix_unitaire: round2(l.prix),
          motif: 'Livraison commande',
          created_at: `${dateCmd}T${rng.int(7, 11)}:${String(rng.int(0, 59)).padStart(2, '0')}:00Z`,
        })
      }
    }
  }

  if (stockEntrees.length) {
    const { errs } = await batchInsert(sb, 'mouvements_stock', stockEntrees)
    errs.forEach(e => logErr(e))
    total += stockEntrees.length
  }

  // ── 2. Planning ───────────────────────────────────────────────────────
  const nPlan = rng.int(cfg.planning[0], cfg.planning[1])
  const planRows: any[] = []
  for (let i = 0; i < nPlan; i++) {
    const date = rng.pick(wDays)
    const empId = rng.pick(ctx.employeIds)
    const empIdx = ctx.employeIds.indexOf(empId)
    const ce = ctx.catalogue.employes[empIdx]
    const midi = rng.chance(0.5)
    const hD = midi ? `${rng.int(9, 11)}:00` : `${rng.int(17, 19)}:00`
    const hF = midi ? `${rng.int(14, 16)}:00` : `${rng.int(22, 23)}:30`
    const hStart = parseInt(hD)
    const hEnd = parseInt(hF) + (hF.includes(':30') ? 0.5 : 0)
    const hrs = hEnd - hStart
    planRows.push({
      organization_id: ctx.orgId, employe_id: empId, date,
      heure_debut: hD, heure_fin: hF,
      poste: mapPoste(ce?.poste ?? 'serveur'), service: midi ? 'midi' : 'soir',
      statut: 'confirme', cout_prevu: round2(hrs * (ce?.taux_horaire ?? 12)),
    })
  }
  if (planRows.length) {
    const { errs } = await batchInsert(sb, 'creneaux_planning', planRows)
    errs.forEach(e => logErr(e))
    total += planRows.length
  }

  // ── 3. HACCP releves ──────────────────────────────────────────────────
  const nH = rng.int(cfg.haccp[0], cfg.haccp[1])
  const haccpRows: any[] = []
  for (let i = 0; i < nH; i++) {
    const date = rng.pick(dates)
    const tId = rng.pick(ctx.haccpTemplateIds)
    const ti = ctx.haccpTemplateIds.indexOf(tId)
    const tpl = ctx.catalogue.haccp_templates[ti]
    const ok = rng.chance(0.95)
    let val: number | null = null
    if (tpl?.valeur_min != null && tpl?.valeur_max != null) {
      val = ok
        ? round2(rng.float(tpl.valeur_min, tpl.valeur_max))
        : round2(rng.chance(0.5) ? tpl.valeur_min - rng.float(1, 5) : tpl.valeur_max + rng.float(1, 5))
    }
    const empN = ctx.catalogue.employes[rng.int(0, Math.min(ctx.employeIds.length - 1, ctx.catalogue.employes.length - 1))]
    haccpRows.push({
      organization_id: ctx.orgId, template_id: tId,
      nom_controle: tpl?.nom ?? 'Controle temperature', type: mapHaccpType(tpl?.type ?? 'temperature'),
      valeur: val, unite: tpl?.unite ?? null,
      resultat: ok ? 'conforme' : 'non_conforme',
      action_corrective: ok ? null : 'Action corrective effectuee',
      zone: rng.pick(['cuisine', 'chambre_froide', 'reserve', 'salle', 'bar']),
      employe_nom: empN ? `${empN.prenom} ${empN.nom}` : null,
      created_at: `${date}T${rng.int(6, 22)}:${String(rng.int(0, 59)).padStart(2, '0')}:00Z`,
    })
  }
  if (haccpRows.length) {
    const { errs } = await batchInsert(sb, 'haccp_releves', haccpRows)
    errs.forEach(e => logErr(e))
    total += haccpRows.length
  }

  // ── 4. Stock sorties ──────────────────────────────────────────────────
  const nS = rng.int(cfg.sorties[0], cfg.sorties[1])
  const sortRows: any[] = []
  for (let i = 0; i < nS; i++) {
    const pId = rng.pick(ctx.produitIds)
    const pi = ctx.produitIds.indexOf(pId)
    sortRows.push({
      organization_id: ctx.orgId, produit_id: pId,
      type: 'sortie' as const, quantite: round2(rng.float(0.5, 10)),
      prix_unitaire: ctx.catalogue.produits[pi]?.prix_unitaire ?? null,
      motif: 'Consommation service',
      created_at: `${rng.pick(wDays)}T${rng.pick(['12','13','19','20','21'])}:${String(rng.int(0, 59)).padStart(2, '0')}:00Z`,
    })
  }
  if (sortRows.length) {
    const { errs } = await batchInsert(sb, 'mouvements_stock', sortRows)
    errs.forEach(e => logErr(e))
    total += sortRows.length
  }

  // ── 5. Pertes ─────────────────────────────────────────────────────────
  const nPe = rng.int(cfg.pertes[0], cfg.pertes[1])
  const perteRows: any[] = []
  for (let i = 0; i < nPe; i++) {
    const pId = rng.pick(ctx.produitIds)
    const pi = ctx.produitIds.indexOf(pId)
    perteRows.push({
      organization_id: ctx.orgId, produit_id: pId,
      type: 'perte' as const, quantite: round2(rng.float(0.2, 5)),
      prix_unitaire: ctx.catalogue.produits[pi]?.prix_unitaire ?? null,
      motif: rng.pick(['Perime', 'Deteriore', 'Casse', 'DLC depassee', 'Surplus non utilise']),
      created_at: `${rng.pick(wDays)}T${rng.int(14, 17)}:${String(rng.int(0, 59)).padStart(2, '0')}:00Z`,
    })
  }
  if (perteRows.length) {
    const { errs } = await batchInsert(sb, 'mouvements_stock', perteRows)
    errs.forEach(e => logErr(e))
    total += perteRows.length
  }

  // ── 6. Events caisse ──────────────────────────────────────────────────
  const caisseRows: any[] = []
  for (const date of wDays) {
    for (const svc of ['midi', 'soir'] as const) {
      const mt = round2(dailyRev / 2 * rng.float(0.7, 1.3))
      const couv = Math.round(mt / rng.float(18, 35))
      const en = ctx.catalogue.employes[rng.int(0, Math.min(ctx.employeIds.length - 1, ctx.catalogue.employes.length - 1))]
      caisseRows.push({
        organization_id: ctx.orgId, event_type: 'paiement', montant: mt,
        mode_paiement: rng.pick(['cb', 'cb', 'cb', 'especes', 'ticket_resto']),
        employe_nom: en ? `${en.prenom} ${en.nom}` : null,
        nb_couverts: couv, service: svc, source: 'manuel',
        created_at: `${date}T${svc === 'midi' ? '14:30' : '23:00'}:00Z`,
      })
    }
  }
  if (caisseRows.length) {
    const { errs } = await batchInsert(sb, 'events_caisse', caisseRows)
    errs.forEach(e => logErr(e))
    total += caisseRows.length
  }

  // ── 7. Inventaire ─────────────────────────────────────────────────────
  const lastDay = dates[dates.length - 1]
  const { data: ses, error: sesE } = await sb.from('sessions_inventaire').insert({
    organization_id: ctx.orgId, nom: `Inventaire ${ym(year, month)}`, zone: 'complet',
    statut: 'valide', validated_at: `${lastDay}T22:00:00Z`,
  }).select('id').single()
  if (sesE) { logErr(`inv session: ${sesE.message}`) }
  else {
    total++
    const nInv = rng.int(cfg.invLignes[0], cfg.invLignes[1])
    const invProds = rng.pickN(ctx.produitIds, Math.min(nInv, ctx.produitIds.length))
    const invRows = invProds.map(pId => {
      const st = round2(rng.float(5, 100))
      return {
        organization_id: ctx.orgId, session_id: ses.id, produit_id: pId,
        stock_theorique: st, quantite_comptee: round2(st * rng.float(0.95, 1.05)),
        counted_at: `${lastDay}T${rng.int(20, 22)}:${String(rng.int(0, 59)).padStart(2, '0')}:00Z`,
      }
    })
    if (invRows.length) {
      const { errs } = await batchInsert(sb, 'lignes_inventaire', invRows)
      errs.forEach(e => logErr(e))
      total += invRows.length
    }
  }

  // ── 8. Fiches paie ───────────────────────────────────────────────────
  const paieRows: any[] = []
  for (let i = 0; i < ctx.employeIds.length; i++) {
    const ce = ctx.catalogue.employes[i]
    if (!ce) continue
    const hNorm = round2(ce.heures_contrat * 4.33)
    const hSup = rng.chance(0.3) ? round2(rng.float(2, 15)) : 0
    const hAbs = rng.chance(0.1) ? round2(rng.float(4, 16)) : 0
    const brut = round2((hNorm + hSup * 1.25 - hAbs) * ce.taux_horaire)
    const cotis = round2(brut * 0.22)
    paieRows.push({
      organization_id: ctx.orgId, employe_id: ctx.employeIds[i],
      mois: ymd1(year, month),
      heures_normales: hNorm, heures_sup: hSup, heures_absences: hAbs,
      salaire_brut: brut, cotisations: cotis, salaire_net: round2(brut - cotis),
      statut: 'valide',
    })
  }
  if (paieRows.length) {
    const { errs } = await batchInsert(sb, 'fiches_paie', paieRows)
    errs.forEach(e => logErr(e))
    total += paieRows.length
  }

  // ── 9. KPI + snapshot ─────────────────────────────────────────────────
  const caTotal = round2(caisseRows.reduce((s, e) => s + e.montant, 0))
  const coutMat = round2(stockEntrees.reduce((s, e) => s + e.quantite * (e.prix_unitaire ?? 0), 0))
  const massSal = round2(paieRows.reduce((s, p) => s + p.salaire_brut, 0))
  const nbCouv = caisseRows.reduce((s, e) => s + (e.nb_couverts ?? 0), 0)
  const fcr = caTotal > 0 ? round2(coutMat / caTotal * 100) : 0
  const mb = caTotal > 0 ? round2((caTotal - coutMat) / caTotal * 100) : 0
  const mn = caTotal > 0 ? round2((caTotal - coutMat - massSal) / caTotal * 100) : 0
  const tm = nbCouv > 0 ? round2(caTotal / nbCouv) : 0

  const { error: kE } = await sb.from('objectifs_kpi').insert({
    organization_id: ctx.orgId, mois: ymd1(year, month),
    food_cost_cible: round2(rng.float(25, 35)),
    masse_salariale_cible: round2(rng.float(30, 40)),
    marge_nette_cible: round2(rng.float(10, 20)),
    ca_cible: round2(dailyRev * wDays.length),
  })
  if (kE) logErr(`kpi: ${kE.message}`); else total++

  const { error: sE } = await sb.from('snapshots_food_cost').insert({
    organization_id: ctx.orgId, mois: ymd1(year, month),
    ca_total: caTotal, cout_matieres: coutMat, masse_salariale: massSal,
    nb_couverts: nbCouv, source: 'simulation',
    food_cost_reel: fcr, marge_brute: mb, marge_nette: mn, ticket_moyen: tm,
  })
  if (sE) logErr(`snap: ${sE.message}`); else total++

  // ── 10. Previsions ────────────────────────────────────────────────────
  const nPrev = rng.int(cfg.previsions[0], cfg.previsions[1])
  const prevDates = rng.pickN(wDays, nPrev)
  const prevRows = prevDates.map(d => ({
    organization_id: ctx.orgId, date_prevision: d,
    couverts_midi: rng.int(20, 80), couverts_soir: rng.int(30, 100),
    ca_prevu: round2(dailyRev * rng.float(0.8, 1.2)),
    meteo_condition: rng.pick(met.cond),
    meteo_temperature: rng.int(met.temp[0], met.temp[1]),
    est_ferie: FERIES.has(d), est_vacances: month === 8 || (month === 7 && rng.chance(0.5)),
    confiance: rng.pick(['haute', 'moyenne', 'basse']),
    couverts_reel_midi: rng.int(15, 85), couverts_reel_soir: rng.int(25, 105),
    ca_reel: round2(dailyRev * rng.float(0.75, 1.25)),
  }))
  if (prevRows.length) {
    const { errs } = await batchInsert(sb, 'previsions', prevRows)
    errs.forEach(e => logErr(e))
    total += prevRows.length
  }

  // ── 11. Lots produit (skip if table not migrated) ───────────────────
  // ── 12. Prix historique (skip if table not migrated) ───────────────

  // ── 13. Mouvements cave ───────────────────────────────────────────────
  if (ctx.vinIds.length) {
    const nCave = rng.int(cfg.cave[0], cfg.cave[1])
    const caveRows: any[] = []
    const deltas = new Map<string, number>()
    for (let i = 0; i < nCave; i++) {
      const vId = rng.pick(ctx.vinIds)
      const isIn = rng.chance(0.4)
      const qty = isIn ? rng.int(6, 24) : rng.int(1, 6)
      const vi = ctx.vinIds.indexOf(vId)
      const sortieType = rng.pick(['sortie_bouteille', 'sortie_bouteille', 'sortie_verre'] as const)
      caveRows.push({
        organization_id: ctx.orgId, vin_id: vId,
        type: isIn ? 'entree' : sortieType, quantite: qty,
        prix_unitaire: ctx.catalogue.vins[vi]?.prix_achat_ht ?? null,
        note: isIn ? 'Reception fournisseur' : rng.pick(['Service midi', 'Service soir', 'Vente au verre']),
        created_at: `${rng.pick(wDays)}T${rng.int(10, 22)}:${String(rng.int(0, 59)).padStart(2, '0')}:00Z`,
      })
      deltas.set(vId, (deltas.get(vId) ?? 0) + (isIn ? qty : -qty))
    }
    if (caveRows.length) {
      const { errs } = await batchInsert(sb, 'mouvements_cave', caveRows)
      errs.forEach(e => logErr(e))
      total += caveRows.length
    }
    for (const [vId, delta] of deltas) {
      if (delta !== 0) {
        const { error } = await sb.rpc('increment_vin_stock', { p_vin_id: vId, p_org_id: ctx.orgId, p_delta: delta })
        if (error) logErr(`increment_vin_stock: ${error.message}`)
      }
    }
  }

  return total
}

// ─── Force reset ─────────────────────────────────────────────────────────────

async function forceReset(sb: SupabaseClient<Database>, orgIds: string[]) {
  for (const orgId of orgIds) {
    log(`Reset org ${orgId}...`)

    // commande_lignes: no org_id, delete via commande FK
    const { data: cmds } = await sb.from('commandes').select('id').eq('organization_id', orgId)
    if (cmds?.length) {
      for (let i = 0; i < cmds.length; i += BATCH_SIZE) {
        const ids = cmds.slice(i, i + BATCH_SIZE).map(c => c.id)
        await sb.from('commande_lignes').delete().in('commande_id', ids)
      }
    }

    // lignes_retour: no org_id, delete via retour FK
    const { data: rets } = await sb.from('retours_fournisseur').select('id').eq('organization_id', orgId)
    if (rets?.length) {
      for (let i = 0; i < rets.length; i += BATCH_SIZE) {
        const ids = rets.slice(i, i + BATCH_SIZE).map(r => r.id)
        await sb.from('lignes_retour').delete().in('retour_id', ids)
      }
    }

    // All other tables in FK order (skip the two handled above; ignore missing tables)
    for (const table of DELETE_ORDER) {
      if (table === 'commande_lignes' || table === 'lignes_retour') continue
      const { error } = await (sb.from(table) as any).delete().eq('organization_id', orgId)
      if (error && !error.message.includes('schema cache')) logErr(`reset ${table}: ${error.message}`)
    }
  }
}

// ─── Create child organizations ──────────────────────────────────────────────

async function createChildOrgs(
  sb: SupabaseClient<Database>,
  parentOrg: { id: string; clerk_org_id: string; nom: string }
): Promise<{ id: string; nom: string; type: string; size: OrgSize }[]> {
  const children: { id: string; nom: string; type: string; size: OrgSize }[] = []

  for (const site of CHILD_SITES) {
    // Check if child already exists
    const { data: existing } = await sb
      .from('organizations')
      .select('id')
      .eq('nom', site.nom)
      .eq('parent_organization_id', parentOrg.id)
      .single()

    if (existing) {
      log(`  Site "${site.nom}" deja existant (${existing.id})`)
      children.push({ id: existing.id, nom: site.nom, type: site.type, size: site.size })
      continue
    }

    // Create child org — same clerk_org_id as parent
    const { data: child, error } = await sb
      .from('organizations')
      .insert({
        clerk_org_id: parentOrg.clerk_org_id,
        nom: site.nom,
        slug: site.nom.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
        adresse: site.adresse,
        plan: 'enterprise' as const,
        parent_organization_id: parentOrg.id,
      })
      .select('id')
      .single()

    if (error) {
      logErr(`Erreur creation site "${site.nom}": ${error.message}`)
      continue
    }

    log(`  Site "${site.nom}" cree (${child.id})`)
    children.push({ id: child.id, nom: site.nom, type: site.type, size: site.size })
  }

  return children
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function ensureParentOrgColumn(sb: SupabaseClient<Database>) {
  // Add parent_organization_id column if it doesn't exist
  const { error } = await sb.rpc('exec_sql' as any, {
    query: `
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'organizations'
            AND column_name = 'parent_organization_id'
        ) THEN
          ALTER TABLE public.organizations
            ADD COLUMN parent_organization_id uuid REFERENCES public.organizations(id);
        END IF;
      END $$;
    `
  })
  // If exec_sql doesn't exist, try raw SQL via REST (will fail silently)
  if (error) {
    log('Note: parent_organization_id column may already exist or needs manual migration')
  }
}

async function main() {
  const args = process.argv.slice(2)
  const force = args.includes('--force')

  log('Simulation RestoFlow — Multi-site Enterprise')
  if (force) log('Mode --force : suppression des donnees existantes')

  const sb = adminClient()
  const ai = new Anthropic()

  // 0. Ensure parent_organization_id column exists
  await ensureParentOrgColumn(sb)

  // 1. Find the enterprise org (plan = 'enterprise')
  // Try with parent_organization_id filter first, fallback without
  let enterpriseOrgs: any[] | null = null
  let orgE: any = null

  const { data: orgsWithParent, error: err1 } = await sb
    .from('organizations')
    .select('id, nom, clerk_org_id, plan')
    .eq('plan', 'enterprise')
    .is('parent_organization_id', null)

  if (!err1 && orgsWithParent?.length) {
    enterpriseOrgs = orgsWithParent
  } else {
    // Fallback: just find enterprise orgs without parent filter
    const { data: orgsSimple, error: err2 } = await sb
      .from('organizations')
      .select('id, nom, clerk_org_id, plan')
      .eq('plan', 'enterprise')
    enterpriseOrgs = orgsSimple
    orgE = err2
  }

  if (orgE || !enterpriseOrgs?.length) {
    console.error('Aucune organisation enterprise trouvee:', orgE?.message)
    console.error('Assurez-vous qu\'une org avec plan=enterprise existe dans Supabase')
    process.exit(1)
  }

  const parentOrg = enterpriseOrgs[0]
  log(`Organisation enterprise trouvee: "${parentOrg.nom}" (${parentOrg.id})`)

  // 2. Create/find child organizations
  log('\n--- Creation des sites enfants ---')
  const childSites = await createChildOrgs(sb, parentOrg)
  if (!childSites.length) {
    console.error('Aucun site enfant cree')
    process.exit(1)
  }
  log(`${childSites.length} sites enfants prets`)

  // 3. Force reset child orgs data if requested
  if (force) {
    await forceReset(sb, childSites.map(c => c.id))
    log('Reset des sites enfants termine')
  }

  // 4. Generate catalogues by type (one per unique restaurant type)
  const types = [...new Set(childSites.map(c => c.type))]
  log(`\n${types.length} types uniques: ${types.join(', ')}`)

  const catalogues = new Map<string, CatalogueData>()
  for (const t of types) {
    try {
      catalogues.set(t, await genCatalogue(ai, t))
      log(`Catalogue "${t}" OK`)
    } catch (e: any) {
      logErr(`Catalogue "${t}": ${e.message}`)
    }
  }

  // 5. Simulate each child site
  let totalRows = 0, okCount = 0, errCount = 0

  for (let i = 0; i < childSites.length; i++) {
    const site = childSites[i]
    const cat = catalogues.get(site.type)

    if (!cat) {
      logErr(`Pas de catalogue pour "${site.type}" - skip ${site.nom}`)
      errCount++; continue
    }

    // Idempotent check
    if (!force) {
      const { count } = await sb.from('fournisseurs').select('id', { count: 'exact', head: true }).eq('organization_id', site.id)
      if (count && count > 0) { log(`Skip ${site.nom} (${count} fournisseurs existants)`); continue }
    }

    const profile: RestaurantProfile = {
      nom: site.nom,
      type: site.type,
      ville: CHILD_SITES[i]?.ville ?? 'Paris',
      adresse: CHILD_SITES[i]?.adresse ?? '',
    }

    const cfg = CFG[site.size]
    const ctx: OrgContext = {
      orgId: site.id, orgIdx: i, profile, size: site.size, catalogue: cat,
      baseDailyRevenue: rng.float(cfg.revenue[0], cfg.revenue[1]),
      fournisseurIds: [], produitIds: [], employeIds: [],
      recetteIds: [], vinIds: [], haccpTemplateIds: [],
    }

    log(`\n[${i + 1}/${childSites.length}] ${site.nom} (${site.type}, ${site.size})`)

    try {
      await insertRefData(sb, ctx)
      if (!ctx.produitIds.length || !ctx.employeIds.length || !ctx.fournisseurIds.length) {
        logErr(`Donnees de reference vides pour ${site.nom} - skip`)
        errCount++; continue
      }
      let orgRows = 0
      for (const [y, m] of MONTHS) {
        try {
          const rows = await simMonth(sb, ctx, y, m)
          orgRows += rows
          process.stdout.write(`  ${ym(y, m)} -> ${rows} lignes\n`)
        } catch (e: any) {
          logErr(`Mois ${y}-${m}: ${e.message}`)
        }
      }
      totalRows += orgRows
      okCount++
      log(`  Total site: ${orgRows} lignes`)
    } catch (e: any) {
      logErr(`Site ${site.nom}: ${e.message}`)
      errCount++
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  log('RESUME FINAL')
  console.log(`  Organisation parent: ${parentOrg.nom} (${parentOrg.id})`)
  console.log(`  Sites enfants: ${childSites.length}`)
  childSites.forEach(s => console.log(`    - ${s.nom} (${s.type}, ${s.size})`))
  console.log(`  Sites simules: ${okCount}/${childSites.length}`)
  console.log(`  Erreurs: ${errCount}`)
  console.log(`  Total lignes inserees: ~${totalRows.toLocaleString()}`)
  console.log('='.repeat(60))
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })
