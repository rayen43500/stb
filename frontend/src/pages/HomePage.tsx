import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
//import { FolderOpen } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
//import { roleLabelFr, roleMission } from '../lib/roleLabels'
import type { CreditLite } from '../lib/homeDashboard'
import { formatTnd } from '../lib/money'
import { statusBadgeClass, statusLabelFr } from '../lib/creditStatusStyle'
import { creditTypeLabel } from '../lib/creditTypeLabels'
import type { Role } from '../types'
import type { SafeUser } from '../types'
import { PublicLandingPage } from './PublicLandingPage'
import { PortfolioCharts } from '../components/dashboard/WorkspaceCharts'
//const PAGE_SIZE = 6

//type NotifRow = {
  //_id: string
 // title: string
 // message: string
 // createdAt?: string
//}

type WorkspacePayload = {
  role: Role
  kpis: Record<string, number>
  statusMap: Record<string, number>
  byCreditType: Record<string, number>
  recent: Array<{
    _id: string
    status: string
    amount: number
    creditType?: string
    updatedAt: string
    applicantId?: { firstName?: string; lastName?: string }
  }>
}
type ClientStats = {
  demandesActives: number
  enAttente: number
  approuvees: number
  montantTotal: number
  total: number
}

//const shellCard =
  //'rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm transition duration-150 hover:shadow-md sm:p-5'
//const btnPrimary =
  //'inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#1D4ED8] px-4 text-sm font-semibold text-white shadow-sm transition duration-150 hover:bg-[#1E40AF]'
//const btnSecondary =
  //'inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-[#E2E8F0] bg-white px-4 text-sm font-medium text-[#0F172A] transition duration-150 hover:bg-[#F8FAFC]'


export function LegacyPublicHome() {
  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: '#F0F4F8' }}>

      {/* ===== HERO ===== */}
      <section style={{
        background: 'linear-gradient(135deg, #0A2463 0%, #1D4ED8 60%, #1E88E5 100%)',
        padding: '64px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '40px',
        flexWrap: 'wrap',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: '-80px', top: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: '80px', bottom: '-120px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '520px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '24px', padding: '6px 16px', marginBottom: '20px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ADE80' }} />
            <span style={{ color: '#BAE6FD', fontSize: '12px', fontWeight: 500 }}>Portail officiel STB Bank — Crédits</span>
          </div>
          <h1 style={{ color: 'white', fontSize: '36px', fontWeight: 700, lineHeight: 1.25, marginBottom: '16px' }}>
            Votre assistant crédit<br />
            <span style={{ color: '#BAE6FD' }}>simple, rapide et sécurisé</span>
          </h1>
          <p style={{ color: '#BAE6FD', fontSize: '15px', lineHeight: 1.7, marginBottom: '32px', maxWidth: '420px' }}>
            Simulez, soumettez et suivez vos demandes de crédit en ligne. Une plateforme dédiée aux clients et aux agents de la STB Bank.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link to="/register" style={{ background: 'white', color: '#0A2463', padding: '12px 28px', borderRadius: '8px', fontWeight: 700, fontSize: '14px', textDecoration: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>Créer un compte</Link>
            <Link to="/simulation" style={{ background: 'transparent', color: 'white', padding: '12px 28px', borderRadius: '8px', fontWeight: 600, fontSize: '14px', textDecoration: 'none', border: '1.5px solid rgba(255,255,255,0.4)' }}>Simuler un crédit</Link>
            <Link to="/login" style={{ background: 'transparent', color: '#BAE6FD', padding: '12px 28px', borderRadius: '8px', fontWeight: 600, fontSize: '14px', textDecoration: 'none', border: '1.5px solid rgba(186,230,253,0.3)' }}>Connexion</Link>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', zIndex: 1 }}>
          {[
            { label: 'Dossiers traités', value: '+2 400', icon: '📁' },
            { label: "Taux d'approbation", value: '78 %', icon: '✅' },
            { label: 'Délai moyen de réponse', value: '48 h', icon: '⏱️' },
          ].map((s) => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '16px 24px', minWidth: '200px' }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>{s.icon}</div>
              <div style={{ color: '#BAE6FD', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
              <div style={{ color: 'white', fontSize: '24px', fontWeight: 700 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== ÉTAPES ===== */}
      <section style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '20px 48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', flexWrap: 'wrap' }}>
        {[
          { n: '1', label: 'Inscription' },
          { n: '2', label: 'Simulation' },
          { n: '3', label: 'Soumission' },
          { n: '4', label: 'Étude du dossier' },
          { n: '5', label: 'Décision' },
        ].map((s, i, arr) => (
          <div key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
              <div style={{ width: '28px', height: '28px', background: '#1D4ED8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>{s.n}</div>
              <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{s.label}</span>
            </div>
            {i < arr.length - 1 && <span style={{ color: '#CBD5E1', fontSize: '18px' }}>→</span>}
          </div>
        ))}
      </section>

      {/* ===== SERVICES CRÉDIT ===== */}
      <section style={{ padding: '48px 48px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>Nos solutions</p>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0A2463', marginBottom: '8px' }}>Tous types de crédits disponibles</h2>
          <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '480px', margin: '0 auto' }}>Choisissez le crédit adapté à votre projet et simulez en quelques secondes</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {[
            { icon: '🏠', title: 'Crédit Immobilier', desc: "Financez l'achat ou la construction de votre logement.", color: '#EFF6FF', border: '#BFDBFE' },
            { icon: '🚗', title: 'Crédit Auto', desc: "Achetez votre véhicule neuf ou d'occasion facilement.", color: '#F0FDF4', border: '#BBF7D0' },
            { icon: '💳', title: 'Crédit Consommation', desc: 'Financez vos projets personnels et achats importants.', color: '#FFF7ED', border: '#FED7AA' },
            
          ].map((c) => (
            <div key={c.title} style={{ background: c.color, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '24px 20px' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>{c.icon}</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>{c.title}</div>
              <div style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>{c.desc}</div>
              <Link to="/simulation" style={{ display: 'inline-block', marginTop: '14px', fontSize: '12px', fontWeight: 600, color: '#1D4ED8', textDecoration: 'none' }}>Simuler →</Link>
            </div>
          ))}
        </div>
      </section>

      {/* ===== À PROPOS STB ===== */}
      <section style={{ margin: '48px 48px 0', background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '40px', display: 'flex', gap: '48px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '260px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px' }}>À propos</p>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0A2463', marginBottom: '16px', lineHeight: 1.3 }}>La STB Bank, votre partenaire financier depuis 1958</h2>
          <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.7, marginBottom: '16px' }}>
            La Société Tunisienne de Banque (STB) est l'une des plus grandes banques publiques de Tunisie. Avec un réseau de plus de 130 agences à travers tout le pays, la STB accompagne particuliers, professionnels et entreprises dans leurs projets financiers.
          </p>
          <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
            Notre portail de crédits en ligne vous permet de gérer vos demandes de financement de manière simple, rapide et totalement sécurisée, 24h/24 et 7j/7.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', minWidth: '260px' }}>
          {[
            { value: '130+', label: 'Agences en Tunisie' },
            { value: '1958', label: 'Année de fondation' },
            { value: '1M+', label: 'Clients servis' },
            { value: '24/7', label: 'Service en ligne' },
          ].map((s) => (
            <div key={s.label} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#1D4ED8', marginBottom: '4px' }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== NOS AGENCES + CARTE ===== */}
      <section style={{ margin: '48px 48px 0', background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ padding: '28px 32px', borderBottom: '1px solid #E2E8F0' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '6px' }}>Réseau STB</p>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0A2463' }}>Nos Agences en Tunisie</h2>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>Plus de 130 agences à travers tout le territoire tunisien</p>
        </div>
        <div style={{ position: 'relative', height: '320px', background: '#E8F0FE' }}>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d207972.48!2d10.1!3d36.8!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12fd337f5e7ef543%3A0xd671924e714a0275!2sTunis%2C%20Tunisia!5e0!3m2!1sen!2stn!4v1234567890"
            width="100%"
            height="320"
            style={{ border: 'none', display: 'block' }}
            allowFullScreen
            loading="lazy"
            title="Carte agences STB"
          />
        </div>
      </section>

      {/* ===== CTA + CONTACT + RÉSEAUX SOCIAUX ===== */}
      <section style={{
        margin: '48px 48px 0',
        background: 'linear-gradient(135deg, #0A2463, #1D4ED8)',
        borderRadius: '16px', padding: '40px 48px',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '24px',
      }}>
        <div>
          <h3 style={{ color: 'white', fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>Prêt à démarrer votre demande ?</h3>
          <p style={{ color: '#BAE6FD', fontSize: '14px' }}>Créez votre compte et soumettez votre premier dossier en quelques minutes.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/register" style={{ background: 'white', color: '#0A2463', padding: '12px 28px', borderRadius: '8px', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>Créer un compte</Link>
          <Link to="/login" style={{ background: 'transparent', color: 'white', padding: '12px 28px', borderRadius: '8px', fontWeight: 600, fontSize: '14px', textDecoration: 'none', border: '1.5px solid rgba(255,255,255,0.4)' }}>Se connecter</Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{ background: '#0A2463', margin: '48px 0 0', padding: '48px 48px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '40px' }}>

          {/* Logo + description */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <img src="/stb-logo.png" alt="STB Bank" style={{ height: '36px', filter: 'brightness(0) invert(1)' }} />
            </div>
            <p style={{ color: '#93C5FD', fontSize: '13px', lineHeight: 1.6 }}>
              La Société Tunisienne de Banque, votre partenaire financier de confiance depuis 1958.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ color: 'white', fontSize: '14px', fontWeight: 600, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Contactez-nous</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { icon: '📍', text: 'Rue Hedi Nouira 1001 Tunis' },
                { icon: '📞', text: '+216 70 140 000' },
                { icon: '📠', text: '+216 70 140 333' },
                { icon: '✉️', text: 'stb@stb.com.tn' },
                { icon: '🌐', text: 'www.stb.com.tn' },
              ].map((c) => (
                <div key={c.text} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '14px' }}>{c.icon}</span>
                  <span style={{ color: '#93C5FD', fontSize: '13px' }}>{c.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Plan du site */}
          <div>
            <h4 style={{ color: 'white', fontSize: '14px', fontWeight: 600, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Plan du site</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Simulation', path: '/simulation' },
                { label: 'Inscription', path: '/register' },
                { label: 'Connexion', path: '/login' },
                { label: 'Assistant', path: '/assistant' },
              ].map((l) => (
                <Link key={l.path} to={l.path} style={{ color: '#93C5FD', fontSize: '13px', textDecoration: 'none' }}>
                  → {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Réseaux sociaux */}
          <div>
            <h4 style={{ color: 'white', fontSize: '14px', fontWeight: 600, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Suivez-nous</h4>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {[
                { name: 'Facebook', icon: '📘', url: 'https://facebook.com/stbbank' },
                { name: 'Instagram', icon: '📸', url: 'https://instagram.com/stbbank' },
                { name: 'LinkedIn', icon: '💼', url: 'https://linkedin.com/company/stb-bank' },
              ].map((s) => (
                <a key={s.name} href={s.url} target="_blank" rel="noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px', padding: '8px 14px',
                  color: 'white', fontSize: '13px', textDecoration: 'none',
                }}>
                  <span>{s.icon}</span>
                  <span>{s.name}</span>
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Ligne de séparation */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <p style={{ color: '#64748B', fontSize: '12px' }}>© 2025 STB Bank. Tous droits réservés.</p>
          <p style={{ color: '#64748B', fontSize: '12px' }}>Portail de gestion des crédits en ligne</p>
        </div>
      </footer>

    </div>
  )
}


function ClientHome({ user }: { user: SafeUser }) {
  const [credits, setCredits] = useState<CreditLite[]>([])
  const [stats, setStats] = useState<ClientStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get<CreditLite[]>('/credits/'),
      api.get<ClientStats>('/stats/client'),
    ])
      .then(([cr, st]) => {
        setCredits(cr.data)
        setStats(st.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const recent = useMemo(
    () => [...credits].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5),
    [credits],
  )

  function statusBadge(status: string) {
    if (status === 'APPROUVÉ')
      return <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">Approuvé</span>
    if (status === 'EN_ANALYSE')
      return <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-orange-50 text-orange-600 ring-1 ring-orange-200">En analyse</span>
    if (status === 'BROUILLON')
      return <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-500 ring-1 ring-slate-200">Brouillon</span>
    if (status === 'SOUMIS')
      return <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-600 ring-1 ring-blue-200">Soumis</span>
    if (status === 'REFUSÉ')
      return <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-50 text-red-600 ring-1 ring-red-200">Refusé</span>
    return <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-500 ring-1 ring-slate-200">{statusLabelFr(status)}</span>
  }

  return (
    <div className="flex flex-col gap-6">

      {/* En-tête */}
      <section className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">
              Bonjour, {user.firstName || user.email}
            </h1>
            <p className="mt-1 text-sm text-[#64748B]">
              Bienvenue sur votre espace STB Crédits
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/demande"
              className="inline-flex h-10 items-center justify-center rounded-[10px] bg-[#1D4ED8] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#1E40AF]"
            >
              + Nouvelle demande
            </Link>
            <Link
              to="/simulation"
              className="inline-flex h-10 items-center justify-center rounded-[10px] border border-[#E2E8F0] bg-white px-5 text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
            >
              Simuler un crédit
            </Link>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: 'DEMANDES ACTIVES',
            value: loading ? '—' : String(stats?.demandesActives ?? 0),
            color: 'text-[#0F172A]',
          },
          {
            label: 'APPROUVÉES',
            value: loading ? '—' : String(stats?.approuvees ?? 0),
            color: 'text-emerald-600',
          },
          {
            label: 'EN ATTENTE',
            value: loading ? '—' : String(stats?.enAttente ?? 0),
            color: 'text-orange-500',
          },
          {
            label: 'MONTANT ACCORDÉ',
            value: loading ? '—' : stats ? `${(stats.montantTotal / 1000).toFixed(0)}k DT` : '0 DT',
            color: 'text-[#0F172A]',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
              {kpi.label}
            </p>
            <p className={`mt-3 text-3xl font-bold tabular-nums ${kpi.color}`}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tableau dossiers récents */}
      <section className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
          <h2 className="text-base font-semibold text-[#0F172A]">Mes dossiers récents</h2>
          <Link
            to="/dossiers"
            className="text-xs font-semibold text-[#1D4ED8] hover:underline"
          >
            Voir tout →
          </Link>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-center text-sm text-[#64748B]">Chargement…</div>
        ) : recent.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-[#64748B]">
            Aucun dossier pour le moment.{' '}
            <Link to="/demande" className="font-semibold text-[#1D4ED8] hover:underline">
              Créer une demande
            </Link>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <tr>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">Référence</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">Type</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">Montant</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">Statut</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {recent.map((row) => (
                <tr key={row._id} className="hover:bg-[#F8FAFC] transition">
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-[#1D4ED8]">
                    <Link to={`/dossiers/${row._id}`} className="hover:underline">
                      …{row._id.slice(-8)}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-[#334155]">{creditTypeLabel(row.creditType)}</td>
                  <td className="px-6 py-4 tabular-nums font-medium text-[#0F172A]">
                    {formatTnd(row.amount)}
                  </td>
                  <td className="px-6 py-4">{statusBadge(row.status)}</td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/dossiers/${row._id}`}
                      className="text-xs font-semibold text-[#1D4ED8] hover:underline"
                    >
                      Voir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

    </div>
  )
}
const AGENT_RECENT_STATUSES = new Set(['SOUMIS', 'EN_ANALYSE', 'À_MODIFIER'])
const CHEF_RECENT_STATUSES = new Set(['EN_VALIDATION_CHEF', 'EN_VALIDATION_COMITE', 'APPROUVÉ', 'REFUSÉ'])

function StaffHome({ user }: { user: SafeUser }) {
  const [ws, setWs] = useState<WorkspacePayload | null>(null)
  const [notifs, setNotifs] = useState<{ _id: string; title: string; message: string; createdAt?: string }[]>([])
  const [loading, setLoading] = useState(true)
  const isAgent = user.role === 'AGENT_BANCAIRE'
  const isChef = user.role === 'CHEF_AGENCE'

  useEffect(() => {
  Promise.all([
    api.get<WorkspacePayload>('/stats/workspace'),
    api.get<{ _id: string; title: string; message: string; createdAt?: string }[]>('/notifications'),
  ])
    .then(([workspace, n]) => {
      setWs(workspace.data)
      setNotifs(n.data.slice(0, 5))
    })
    .catch((err) => console.log('erreur:', err))
    .finally(() => setLoading(false))
}, [])

  const dashboardTitle = isAgent
    ? 'Tableau de bord — Analyse'
    : isChef
      ? 'Tableau de bord — Validation chef'
      : 'Tableau de bord STB'

  const dashboardLead = isAgent
    ? 'Dossiers soumis et en cours d’analyse : vérifiez les pièces puis transmettez au chef.'
    : isChef
      ? 'Dossiers en validation chef : approuvez, orientez vers le comité ou renvoyez au client.'
      : 'Vue d’ensemble de l’activité crédit.'

  const recentRows = useMemo(() => {
    if (!ws) return []
    const pool = ws.recent
    if (isAgent) return pool.filter((r) => AGENT_RECENT_STATUSES.has(r.status))
    if (isChef) return pool.filter((r) => CHEF_RECENT_STATUSES.has(r.status))
    return pool
  }, [ws, isAgent, isChef])

  const kpiLabels: Record<string, string> = {
    dossiersRecus: 'Dossiers reçus',
    enAttenteTraitement: 'En attente',
    dossiersEnvoyesScoring: 'Envoyés au scoring',
    retournesClient: 'Retournés au client',
    enAttente: 'En attente',
    envoyesScoring: 'Envoyés au scoring',
    dossiersEnAttente: 'En attente',
    totalDossiers: 'Total dossiers',
    totalUtilisateurs: 'Utilisateurs',
  }
  const kpiColors: Record<string, string> = {
    dossiersRecus: 'text-[#0F172A]',
    enAttenteTraitement: 'text-orange-500',
    dossiersEnvoyesScoring: 'text-blue-600',
    retournesClient: 'text-red-500',
    enAttente: 'text-orange-500',
    envoyesScoring: 'text-blue-600',
    dossiersEnAttente: 'text-orange-500',
    totalDossiers: 'text-blue-700',
    totalUtilisateurs: 'text-violet-700',
  }

  const kpisToShow = ws
  ? Object.entries(ws.kpis).slice(0, 4)
  : []

  function timeAgo(dateStr?: string) {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const min = Math.floor(diff / 60000)
    if (min < 60) return `Il y a ${min} min`
    const h = Math.floor(min / 60)
    if (h < 24) return `Il y a ${h}h`
    return `Il y a ${Math.floor(h / 24)}j`
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Titre */}
      <div>
        <h1 className="text-xl font-bold text-[#0F172A]">{dashboardTitle}</h1>
        <p className="mt-1 text-sm text-[#64748B]">{dashboardLead}</p>
        {isChef && (
          <Link to="/documents" className="mt-2 inline-block text-xs font-semibold text-[#1D4ED8] hover:underline">
            Espace documents STB →
          </Link>
        )}
      </div>

      {/* KPIs */}
      {loading ? (
        <div className="text-sm text-[#64748B]">Chargement…</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {kpisToShow.map(([key, val]) => (
            <div key={key} className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-[#64748B]">
                {kpiLabels[key] || formatKpiLabel(key)}
              </p>
              <p className={`mt-3 text-3xl font-bold tabular-nums ${kpiColors[key] || 'text-[#0F172A]'}`}>
                {val}
              </p>
            </div>
          ))}
        </div>
      )}

      {ws && !isAgent && <PortfolioCharts statusMap={ws.statusMap} byCreditType={ws.byCreditType} />}

      {/* Contenu principal */}
      {ws && (
        <div className="flex gap-6">

          {/* Tableau dossiers */}
          <div className="flex-1 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
              <h2 className="text-base font-semibold text-[#0F172A]">Derniers dossiers</h2>
              <Link to="/dossiers" className="text-xs font-semibold text-[#1D4ED8] hover:underline">
                Voir tout →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <tr>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">Client</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">Crédit</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">Montant</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">Date</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">Statut</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {recentRows.slice(0, 8).map((r) => (
                    <tr key={r._id} className="hover:bg-[#F8FAFC] transition">
                      <td className="px-4 py-3 font-medium text-[#0F172A]">
                        {typeof r.applicantId === 'object' && r.applicantId
                          ? `${r.applicantId.firstName || ''} ${r.applicantId.lastName || ''}`.trim() || '—'
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-[#334155]">{creditTypeLabel(r.creditType)}</td>
                      <td className="px-4 py-3 tabular-nums font-medium text-[#0F172A]">{formatTnd(r.amount)}</td>
                      <td className="px-4 py-3 text-xs text-[#64748B]">
                        {new Date(r.updatedAt).toLocaleDateString('fr-TN')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${statusBadgeClass(r.status)}`}>
                          {statusLabelFr(r.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/dossiers/${r._id}`}
                          className="text-xs font-semibold text-[#1D4ED8] hover:underline"
                        >
                          Consulter
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notifications */}
          <div className="w-64 shrink-0 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-[#0F172A]">Notifications</h2>
            {notifs.length === 0 ? (
              <p className="text-sm text-[#64748B]">Aucune notification.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {notifs.map((n) => (
                  <li key={n._id} className="flex gap-2">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#1D4ED8]" />
                    <div>
                      <p className="text-sm font-medium text-[#0F172A]">{n.title}</p>
                      <p className="text-xs text-[#64748B]">{timeAgo(n.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      )}
    </div>
  )
}

function formatKpiLabel(key: string): string {
  const map: Record<string, string> = {
    dossiersRecus: 'Dossiers reçus',
    dossiersEnAttente: 'En attente traitement',
    dossiersEnvoyesScoring: 'En analyse risque',
    retournesClient: 'Retours client',
    attenteValidationChef: 'Attente validation chef',
    attenteDecisionFinale: 'Attente décision comité',
    dossiersApprouves: 'Approuvés',
    dossiersRefuses: 'Refusés',
    montantTotalAccorde: 'Montant accordé',
    enAttente: 'En attente',
    envoyesScoring: 'En analyse risque',
    attenteComite: 'Attente comité',
    totalDossiers: 'Total dossiers',
    totalUtilisateurs: 'Utilisateurs',
  }
  return map[key] || key
}

export function HomePage() {
  const { user, token } = useAuth()

 if (token && user?.role === 'CLIENT') {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <ClientHome user={user} />
    </div>
  )
}

  if (token && user) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <StaffHome user={user} />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PublicLandingPage />
    </div>
  )
}
