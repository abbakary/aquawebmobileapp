import React, { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Building2,
  Scale,
  Warehouse,
  ShoppingBag,
  Users,
  ShieldCheck,
  DollarSign,
  Truck,
  Receipt,
  FileText,
  ShieldAlert,
  BarChart3,
  UserCheck,
  LogOut,
  Menu,
  X,
  MapPin,
  PanelLeftClose,
  PanelLeftOpen,
  Fuel as FuelIcon,
  Wrench,
  Anchor,
  ChevronLeft,
  Bell,
  Plus,
  Wifi,
  WifiOff,
  RefreshCw,
  Smartphone,
  Gauge
} from 'lucide-react'
import { useS, ROLES } from './store'
import { useDevice } from './device'
import Home from './modules/Home'
import Buy from './modules/Buy'
import Crew from './modules/Crew'
import Fuel from './modules/Fuel'
import Maintenance from './modules/Maintenance'
import Stock from './modules/Stock'
import Sales from './modules/Sales'
import Suppliers from './modules/Suppliers'
import Quality from './modules/Quality'
import Payments from './modules/Payments'
import Transport from './modules/Transport'
import Expenses from './modules/Expenses'
import Compliance from './modules/Compliance'
import Audit from './modules/Audit'
import Reports from './modules/Reports'
import Staff from './modules/Staff'
import Hq from './modules/Hq'
import BiDashboard from './modules/BiDashboard'
import Super from './modules/Super'
import Landing from './modules/Landing'
import Register from './modules/Register'
import Login from './modules/Login'
import { PWAInstallButton, OfflineIndicator, SyncQueueModal, Modal, Badge } from './ui'
import { LangToggle } from './i18n'

const MODULE_DEFS = {
  home: { label: ['Muhtasari wa Biashara', 'Dashboard'], shortLabel: ['Nyumbani', 'Home'], icon: LayoutDashboard, component: Home, group: 'analytics' },
  bi: { label: ['Uchambuzi wa BI & Faida', 'BI & Profit/Loss'], shortLabel: ['BI & Faida', 'BI & P&L'], icon: BarChart3, component: BiDashboard, group: 'analytics' },
  hq: { label: ['Makao Makuu', 'HQ Multi-Branch'], shortLabel: ['Makao', 'HQ'], icon: Building2, component: Hq, group: 'analytics' },
  buy: { label: ['Manunuzi ya Samaki', 'Fish Procurement'], shortLabel: ['Manunuzi', 'Purchase'], icon: Scale, component: Buy, group: 'operations', quickAdd: true },
  crew: { label: ['Wavuvi & Meli', 'Fishermen & Fleet'], shortLabel: ['Wavuvi', 'Fleet'], icon: Anchor, component: Crew, group: 'operations', quickAdd: true },
  fuel: { label: ['Mafuta & Mikopo', 'Fishing Fuel & Credit'], shortLabel: ['Mafuta', 'Fuel'], icon: FuelIcon, component: Fuel, group: 'operations', quickAdd: true },
  maintenance: { label: ['Matengenezo ya Boti', 'Fleet Maintenance'], shortLabel: ['Matengenezo', 'Fleet Ops'], icon: Wrench, component: Maintenance, group: 'operations', quickAdd: true },
  stock: { label: ['Stoo na Mizigo', 'Inventory'], shortLabel: ['Stoo', 'Inventory'], icon: Warehouse, component: Stock, group: 'inventory' },
  sales: { label: ['Mauzo ya Viwanda', 'Industry Sales'], shortLabel: ['Mauzo', 'Sales'], icon: ShoppingBag, component: Sales, group: 'commercial', quickAdd: true },
  suppliers: { label: ['Wasambazaji & Wavuvi', 'Suppliers'], shortLabel: ['Wavuvi', 'Suppliers'], icon: Users, component: Suppliers, group: 'commercial', quickAdd: true },
  quality: { label: ['Ukaguzi wa Ubora', 'Quality Control'], shortLabel: ['Ubora', 'Quality'], icon: ShieldCheck, component: Quality, group: 'operations' },
  payments: { label: ['Malipo ya Wavuvi', 'Supplier Payments'], shortLabel: ['Malipo', 'Payments'], icon: DollarSign, component: Payments, group: 'commercial', quickAdd: true },
  transport: { label: ['Usafiri & Usambazaji', 'Transport & Delivery'], shortLabel: ['Usafiri', 'Transport'], icon: Truck, component: Transport, group: 'operations', quickAdd: true },
  expenses: { label: ['Matumizi & Gharama', 'Expenses & Landed Cost'], shortLabel: ['Matumizi', 'Expenses'], icon: Receipt, component: Expenses, group: 'commercial', quickAdd: true },
  compliance: { label: ['Vibali vya FiRCIS', 'Compliance & Permits'], shortLabel: ['Vibali', 'Compliance'], icon: FileText, component: Compliance, group: 'governance', quickAdd: true },
  reports: { label: ['Ripoti & Uchambuzi', 'Reports & Analytics'], shortLabel: ['Ripoti', 'Reports'], icon: BarChart3, component: Reports, group: 'analytics' },
  audit: { label: ['Kumbukumbu za Ukaguzi', 'Audit Trail'], shortLabel: ['Ukaguzi', 'Audit'], icon: ShieldAlert, component: Audit, group: 'governance' },
  staff: { label: ['Wafanyakazi & Majukumu', 'Staff & Roles'], shortLabel: ['Wafanyakazi', 'Staff'], icon: UserCheck, component: Staff, group: 'governance', quickAdd: true }
}

const MODULE_GROUPS = [
  { id: 'analytics', label: ['Takwimu na Makao', 'Analytics & HQ'], shortGroup: ['Makao', 'HQ & BI'], defaultTab: 'home', items: ['home', 'bi', 'hq', 'reports'] },
  { id: 'operations', label: ['Uendeshaji', 'Operations'], shortGroup: ['Ziwa', 'Lake Ops'], defaultTab: 'buy', items: ['buy', 'crew', 'fuel', 'maintenance', 'quality', 'transport'] },
  { id: 'inventory', label: ['Stoo ya Sasa', 'Live Inventory'], shortGroup: ['Stoo', 'Cold Room'], defaultTab: 'stock', items: ['stock'] },
  { id: 'commercial', label: ['Biashara na Mauzo', 'Commercial & Sales'], shortGroup: ['Biashara', 'Commercial'], defaultTab: 'sales', items: ['sales', 'suppliers', 'payments', 'expenses'] },
  { id: 'governance', label: ['Vibali na Ukaguzi', 'Compliance & Audit'], shortGroup: ['Usimamizi', 'Governance'], defaultTab: 'compliance', items: ['compliance', 'audit', 'staff'] }
]

const DRAWER_ORDER = [
  'home',
  'suppliers',
  'buy',
  'quality',
  'stock',
  'sales',
  'transport',
  'crew',
  'fuel',
  'maintenance',
  'payments',
  'expenses',
  'reports',
  'bi',
  'hq',
  'compliance',
  'audit',
  'staff'
]

export default function App() {
  const {
    s, T, B, me, x, ses, lang, setLang, t,
    isOnline, isSlowNetwork, lowBandwidthMode, pendingSyncCount, syncing, syncNow
  } = useS()
  const device = useDevice()

  const [view, setView] = useState(() => location.hash.replace('#/', '') || '')
  const [tab, setTab] = useState(() => {
    const v = location.hash.replace('#/', '') || ''
    return MODULE_DEFS[v] ? v : 'home'
  })
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('ft_sidebar_collapsed') === '1'
    } catch {
      return false
    }
  })
  const [moreOpen, setMoreOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [syncOpen, setSyncOpen] = useState(false)

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev
      try {
        localStorage.setItem('ft_sidebar_collapsed', next ? '1' : '0')
      } catch {}
      return next
    })
  }

  const nav = v => {
    location.hash = v ? '#/' + v : ''
    setView(v)
    if (MODULE_DEFS[v]) setTab(v)
    else setTab('home')
  }

  const changeTab = k => {
    setTab(k)
    location.hash = '#/' + k
  }

  useEffect(() => {
    const handleHash = () => {
      const v = location.hash.replace('#/', '') || ''
      setView(v)
      if (MODULE_DEFS[v]) setTab(v)
    }
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  if (ses && ses.kind === 'super') return <Super />
  if (!s) {
    if (view === 'login') return <Login go={nav} />
    if (view === 'register') return <Register go={nav} />
    return <Landing go={nav} />
  }

  const hq = !me.branch || me.branch === 'all'
  const isAllowed = k => !ROLES[s.role] || ROLES[s.role].includes(k)

  const currentTab = isAllowed(tab) ? tab : 'home'
  const activeGroup = MODULE_GROUPS.find(g => g.items.includes(currentTab))?.id || 'analytics'
  const ActiveComponent = MODULE_DEFS[currentTab]?.component || Home
  const currentModule = MODULE_DEFS[currentTab]

  const soon = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10)
  const pendingQcBatches = (s.batches || []).filter(b => b.st === 'pending')
  const expiringPermits = (s.comp || []).filter(c => c.exp < soon)
  const badges = {
    quality: pendingQcBatches.length,
    compliance: expiringPermits.length
  }
  const totalAlerts = badges.quality + badges.compliance + (pendingSyncCount > 0 ? 1 : 0)

  const out = () => {
    setMoreOpen(false)
    x.logout()
    nav('')
  }

  const triggerMobileAdd = () => {
    window.dispatchEvent(new CustomEvent('aquacatch:quick-add', { detail: { tab: currentTab } }))
  }

  return (
    <div className="app-container">
      <OfflineIndicator />

      {/* Desktop Enterprise Sticky Vertical Icon-Tile Sidebar */}
      <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <a href="#/" onClick={() => nav('')} className="sidebar-logo" title="AquaCatch · FishTrade ERP">
          <div className="sidebar-logo-icon">
            <img
              src="/assets/aistudio/AquaCatch_Sharkwave_Logo_df0743e7.png"
              alt="AquaCatch FishTrade ERP"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="sidebar-logo-text">
            <b>AquaCatch</b>
          </div>
        </a>

        <div className="sidebar-nav">
          {MODULE_GROUPS.map((grp, gIdx) => {
            const visibleItems = grp.items.filter(isAllowed)
            if (visibleItems.length === 0) return null
            const grpLabel = t(grp.label[0], grp.label[1])
            const grpShort = t(grp.shortGroup[0], grp.shortGroup[1])

            return (
              <div key={grp.id} className="flex flex-col gap-1">
                {gIdx > 0 && <div className="sidebar-group-divider" />}
                <div className="sidebar-group-micro" title={grpLabel}>
                  {grpShort}
                </div>
                {visibleItems.map(k => {
                  const item = MODULE_DEFS[k]
                  const Icon = item.icon
                  const badgeCount = badges[k] || 0
                  const active = currentTab === k
                  const itemLabel = t(item.label[0], item.label[1])
                  const itemShort = t(item.shortLabel[0], item.shortLabel[1])
                  return (
                    <button
                      key={k}
                      onClick={() => changeTab(k)}
                      className={`sidebar-link ${active ? 'active' : ''}`}
                      title={`${grpLabel} · ${itemLabel}`}
                    >
                      <Icon size={21} className="shrink-0" />
                      <span className="sidebar-label">{itemShort}</span>
                      {badgeCount > 0 && <span className="sidebar-badge">{badgeCount}</span>}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>

        <div className="sidebar-footer">
          <button onClick={out} className="sidebar-link text-slate-300 hover:text-white" title={t('Toka', 'Sign Out')}>
            <LogOut size={18} className="shrink-0" />
            <span className="sidebar-label">{t('Toka', 'Sign Out')}</span>
          </button>
        </div>
      </aside>

      {/* Main Viewport */}
      <div className="app-main">
        {ses.imp && (
          <div className="bg-amber-600 text-white px-4 py-2 text-xs flex justify-between items-center font-semibold">
            <span>{t(`Msaada: Kituo cha ${T.name}`, `Support View: Active session for ${T.name}`)}</span>
            <button
              onClick={x.exitImp}
              className="bg-white text-amber-900 px-3 py-0.5 rounded font-bold hover:bg-slate-100"
            >
              {t('Ondoka Msaada', 'Exit Support Mode')}
            </button>
          </div>
        )}

        {/* Mobile Deep Ocean Navy App Bar (< 768px, matching Reference UI) */}
        <header className="mobile-top-bar">
          {currentTab === 'home' ? (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-sm">
                  <img
                    src="/assets/aistudio/AquaCatch_Sharkwave_Logo_df0743e7.png"
                    alt="AquaCatch"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex flex-col leading-tight min-w-0">
                  <span className="text-[15px] font-extrabold text-white tracking-tight truncate">AquaCatch</span>
                  <span className="text-[10px] font-semibold text-sky-200 tracking-wide truncate">
                    FishTrade ERP · {B?.name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {(!isOnline || isSlowNetwork || pendingSyncCount > 0) && (
                  <button
                    type="button"
                    onClick={() => setSyncOpen(true)}
                    aria-label={t('Foleni ya Mtandao', 'Network & Sync Queue')}
                    className={`h-9 px-2.5 rounded-xl flex items-center gap-1 text-[11px] font-bold border transition ${
                      !isOnline
                        ? 'bg-amber-500/20 border-amber-300/40 text-amber-200'
                        : pendingSyncCount > 0
                          ? 'bg-emerald-500/20 border-emerald-300/40 text-emerald-200'
                          : 'bg-sky-500/20 border-sky-300/40 text-sky-200'
                    }`}
                  >
                    {!isOnline ? <WifiOff size={13} /> : <Gauge size={13} />}
                    <span>
                      {pendingSyncCount > 0
                        ? pendingSyncCount
                        : !isOnline
                          ? t('Nje', 'Offline')
                          : String(device.connectionType || '2G').toUpperCase()}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setNotifOpen(true)}
                  aria-label={t('Arifa', 'Notifications')}
                  className="relative w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                >
                  <Bell size={19} />
                  {totalAlerts > 0 && (
                    <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {totalAlerts}
                    </span>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => changeTab('home')}
                aria-label={t('Rudi Nyumbani', 'Back to Dashboard')}
                className="w-10 h-10 -ml-1 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0 transition"
              >
                <ChevronLeft size={22} />
              </button>

              <div className="flex-1 text-center min-w-0 px-2">
                <h1 className="text-[15.5px] font-bold text-white m-0 truncate">
                  {t(currentModule?.label[0], currentModule?.label[1])}
                </h1>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {(!isOnline || isSlowNetwork || pendingSyncCount > 0) && (
                  <button
                    type="button"
                    onClick={() => setSyncOpen(true)}
                    aria-label={t('Foleni ya Mtandao', 'Network & Sync Queue')}
                    className={`h-9 px-2 rounded-xl flex items-center gap-1 text-[11px] font-bold border transition ${
                      !isOnline
                        ? 'bg-amber-500/20 border-amber-300/40 text-amber-200'
                        : pendingSyncCount > 0
                          ? 'bg-emerald-500/20 border-emerald-300/40 text-emerald-200'
                          : 'bg-sky-500/20 border-sky-300/40 text-sky-200'
                    }`}
                  >
                    {!isOnline ? <WifiOff size={13} /> : <Gauge size={13} />}
                    {pendingSyncCount > 0 && <span>{pendingSyncCount}</span>}
                  </button>
                )}
                {currentModule?.quickAdd ? (
                  <button
                    type="button"
                    onClick={triggerMobileAdd}
                    aria-label={t('Ongeza Mpya', 'Add New')}
                    className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition"
                  >
                    <Plus size={20} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setNotifOpen(true)}
                    aria-label={t('Arifa', 'Notifications')}
                    className="relative w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                  >
                    <Bell size={18} />
                    {totalAlerts > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-400" />
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </header>

        {/* Desktop Top Header (>= 768px) */}
        <header className="top-header">
          <div className="header-left">
            <button
              onClick={toggleCollapsed}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition shrink-0"
              title={collapsed ? t('Panua menyu', 'Expand sidebar') : t('Punguza menyu', 'Collapse sidebar')}
            >
              {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>

            <div
              className="header-title-block"
              title={`${T.name} — ${t(currentModule?.label[0], currentModule?.label[1])}`}
            >
              <small>{T.name}</small>
              <h1>{t(currentModule?.label[0], currentModule?.label[1])}</h1>
            </div>

            {hq && T.branches.length > 1 ? (
              <div className="branch-select-box hidden sm:flex">
                <MapPin size={13} className="text-blue-700 shrink-0" />
                <select
                  value={B.id}
                  onChange={e => {
                    x.switchBranch(e.target.value)
                    changeTab('home')
                  }}
                  className="branch-select"
                >
                  {T.branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="branch-select-box hidden sm:flex">
                <MapPin size={13} className="text-blue-700 shrink-0" />
                <span>{B.name}</span>
              </div>
            )}
          </div>

          <div className="hidden xl:flex top-module-tabs">
            {MODULE_GROUPS.map(g => {
              const isActive = activeGroup === g.id
              return (
                <button
                  key={g.id}
                  onClick={() => changeTab(g.defaultTab)}
                  className={`top-module-tab ${isActive ? 'active' : ''}`}
                >
                  <span>{t(g.label[0], g.label[1])}</span>
                </button>
              )
            })}
          </div>

          <div className="header-right">
            <button
              type="button"
              onClick={() => (pendingSyncCount > 0 && isOnline ? syncNow() : setNotifOpen(true))}
              className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold shrink-0 transition ${
                !isOnline
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : isSlowNetwork
                    ? 'bg-sky-50 border-sky-200 text-sky-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
            >
              {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              {!isOnline
                ? t('Nje ya Mtandao', 'Offline')
                : pendingSyncCount > 0
                  ? `${pendingSyncCount} ${t('Zinasubiri', 'Queued')}`
                  : isSlowNetwork
                    ? t('Mtandao Mzito', 'Slow Net')
                    : t('Mtandaoni', 'Online')}
            </button>

            <LangToggle lang={lang} setLang={setLang} />
            <PWAInstallButton />

            <div className="user-pill">
              <div className="user-avatar">
                {me.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="user-details hidden sm:flex">
                <b>{me.name.split(' ')[0]}</b>
                <small>{s.role}</small>
              </div>
            </div>

            <button
              onClick={out}
              title={t('Toka', 'Sign Out')}
              className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition shrink-0"
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>

        {/* Dynamic Active Module */}
        <main className="flex-1 min-w-0">
          <ActiveComponent go={changeTab} />
        </main>

        {/* Mobile Bottom Navigation (< 768px, 5 tabs matching Reference UI) */}
        <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
          <button
            type="button"
            onClick={() => changeTab('home')}
            className={`mobile-nav-btn ${currentTab === 'home' ? 'active' : ''}`}
          >
            <LayoutDashboard size={20} />
            <span>{t('Nyumbani', 'Home')}</span>
          </button>
          {isAllowed('buy') && (
            <button
              type="button"
              onClick={() => changeTab('buy')}
              className={`mobile-nav-btn ${currentTab === 'buy' ? 'active' : ''}`}
            >
              <Scale size={20} />
              <span>{t('Manunuzi', 'Purchase')}</span>
            </button>
          )}
          {isAllowed('stock') && (
            <button
              type="button"
              onClick={() => changeTab('stock')}
              className={`mobile-nav-btn ${currentTab === 'stock' ? 'active' : ''}`}
            >
              <Warehouse size={20} />
              <span>{t('Stoo', 'Inventory')}</span>
            </button>
          )}
          {isAllowed('sales') && (
            <button
              type="button"
              onClick={() => changeTab('sales')}
              className={`mobile-nav-btn ${currentTab === 'sales' ? 'active' : ''}`}
            >
              <ShoppingBag size={20} />
              <span>{t('Mauzo', 'Sales')}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`mobile-nav-btn ${moreOpen ? 'active' : ''}`}
          >
            <Menu size={20} />
            <span>{t('Zaidi', 'More')}</span>
          </button>
        </nav>

        {/* Full-Height Deep Ocean Navy "More" Slide-Over Drawer (Screen 12) */}
        {moreOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-[2px] flex justify-end md:hidden"
            onClick={() => setMoreOpen(false)}
          >
            <aside
              onClick={e => e.stopPropagation()}
              className="w-[86%] max-w-[330px] h-full bg-gradient-to-b from-[#042242] via-[#052d56] to-[#073a6e] text-white flex flex-col relative overflow-hidden shadow-2xl"
              style={{
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)'
              }}
            >
              {/* Decorative Ocean Wave SVG at Bottom */}
              <svg
                viewBox="0 0 320 90"
                preserveAspectRatio="none"
                className="pointer-events-none absolute bottom-0 inset-x-0 w-full h-24 opacity-25"
              >
                <path
                  d="M0,45 C75,85 160,10 245,45 C280,60 305,40 320,30 L320,90 L0,90 Z"
                  fill="#18b8b2"
                />
                <path
                  d="M0,62 C90,25 190,85 320,50 L320,90 L0,90 Z"
                  fill="#38bdf8"
                />
              </svg>

              {/* Drawer Header */}
              <div className="px-4 pt-4 pb-3 border-b border-white/12 flex items-center justify-between gap-3 relative z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-white p-1.5 flex items-center justify-center shrink-0 shadow">
                    <img
                      src="/assets/aistudio/AquaCatch_Sharkwave_Logo_df0743e7.png"
                      alt="AquaCatch"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <b className="text-sm font-bold text-white block truncate">{T?.name || 'FishTrade ERP'}</b>
                    <span className="text-xs text-sky-200 block truncate">
                      {me.name} · {s.role}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  aria-label="Close navigation drawer"
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Adaptive Device & Network Telemetry Pill */}
              <div className="px-4 pt-3 pb-2 relative z-10 space-y-2">
                <div className="p-2.5 rounded-xl bg-white/8 border border-white/12 flex items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <Smartphone size={14} className="text-sky-300 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-bold text-white block truncate">{device.platformLabel}</span>
                      <span className="text-sky-200 block truncate">{device.networkLabel}</span>
                    </div>
                  </div>
                  {pendingSyncCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => syncNow()}
                      disabled={!isOnline || syncing}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white font-bold shrink-0 flex items-center gap-1"
                    >
                      <RefreshCw size={11} className={syncing ? 'animate-spin' : ''} />
                      {pendingSyncCount}
                    </button>
                  ) : (
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${isOnline ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                      {isOnline ? t('Tayari', 'Ready') : t('Nje', 'Offline')}
                    </span>
                  )}
                </div>

                {/* Branch Switcher on Mobile if HQ */}
                {hq && T.branches.length > 1 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs">
                    <MapPin size={14} className="text-sky-300 shrink-0" />
                    <select
                      value={B.id}
                      onChange={e => {
                        x.switchBranch(e.target.value)
                        changeTab('home')
                        setMoreOpen(false)
                      }}
                      className="bg-transparent text-white font-semibold w-full outline-none"
                    >
                      {T.branches.map(b => (
                        <option key={b.id} value={b.id} className="text-slate-900">
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Scrollable Module List */}
              <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1 relative z-10 no-scrollbar">
                {DRAWER_ORDER.filter(isAllowed).map(k => {
                  const item = MODULE_DEFS[k]
                  if (!item) return null
                  const Icon = item.icon
                  const active = currentTab === k
                  const badgeCount = badges[k] || 0
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        changeTab(k)
                        setMoreOpen(false)
                      }}
                      className={`w-full min-h-[44px] px-3.5 py-2 rounded-xl flex items-center justify-between text-left transition ${
                        active
                          ? 'bg-white/18 text-white font-bold shadow-sm'
                          : 'text-sky-100/90 hover:bg-white/10 font-medium'
                      }`}
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <Icon size={18} className={active ? 'text-[#18b8b2] shrink-0' : 'text-sky-300 shrink-0'} />
                        <span className="text-[13.5px] truncate">{t(item.label[0], item.label[1])}</span>
                      </span>
                      {badgeCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                          {badgeCount}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Drawer Footer Controls */}
              <div className="p-4 border-t border-white/12 space-y-2.5 relative z-10 bg-[#042242]/80 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => device.setLowBandwidthMode(lowBandwidthMode ? false : true)}
                    className="flex-1 min-h-[40px] px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-sky-100 flex items-center justify-between border border-white/10"
                  >
                    <span className="flex items-center gap-1.5">
                      <Gauge size={14} className="text-sky-300" />
                      {t('Data Kidogo', 'Low Data')}
                    </span>
                    <span className={`text-[10px] font-bold ${lowBandwidthMode ? 'text-emerald-300' : 'text-slate-400'}`}>
                      {lowBandwidthMode ? 'ON' : 'OFF'}
                    </span>
                  </button>
                  <div className="shrink-0">
                    <LangToggle lang={lang} setLang={setLang} />
                  </div>
                </div>

                <PWAInstallButton variant="drawer" />

                <button
                  type="button"
                  onClick={out}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/15 font-bold text-sm flex items-center gap-3 transition"
                >
                  <LogOut size={18} />
                  <span>{t('Toka Kwenye Mfumo', 'Logout')}</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Alerts & Sync Notifications Modal */}
        {notifOpen && (
          <Modal
            title={t('Arifa & Hali ya Mfumo', 'Alerts & Sync Status')}
            subtitle={`${device.platformLabel} · ${device.networkLabel}`}
            onClose={() => setNotifOpen(false)}
            maxWidth="max-w-md"
          >
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <b className="text-slate-900 block">{t('Hali ya Mtandao', 'Connectivity & Queue')}</b>
                  <span className="text-slate-500">
                    {pendingSyncCount > 0
                      ? t(`Miamala ${pendingSyncCount} inangoja kutumwa`, `${pendingSyncCount} offline actions pending sync`)
                      : t('Data zote zimesawazishwa', 'All records synced with server')}
                  </span>
                </div>
                {pendingSyncCount > 0 && isOnline ? (
                  <button type="button" onClick={() => syncNow()} className="btn-primary text-xs py-1.5 px-3">
                    <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} /> {t('Tuma', 'Sync')}
                  </button>
                ) : (
                  <Badge variant={isOnline ? 'green' : 'amber'}>{isOnline ? 'Online' : 'Offline'}</Badge>
                )}
              </div>

              {pendingQcBatches.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setNotifOpen(false); changeTab('quality') }}
                  className="w-full text-left p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between"
                >
                  <div>
                    <b className="text-amber-900 block">{pendingQcBatches.length} {t('Mizigo Inasubiri Ukaguzi (QC)', 'Batches Pending QC')}</b>
                    <span className="text-amber-700">{t('Gusa kukagua ubora na joto', 'Tap to inspect freshness & temperature')}</span>
                  </div>
                  <Badge variant="amber">QC</Badge>
                </button>
              )}

              {expiringPermits.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setNotifOpen(false); changeTab('compliance') }}
                  className="w-full text-left p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between"
                >
                  <div>
                    <b className="text-rose-900 block">{expiringPermits.length} {t('Vibali vya FiRCIS Vinakaribia Kwisha', 'Permits Expiring Soon')}</b>
                    <span className="text-rose-700">{t('Angalia vibali vya Wizara/BMU', 'Review Ministry & BMU compliance')}</span>
                  </div>
                  <Badge variant="red">FiRCIS</Badge>
                </button>
              )}

              {pendingQcBatches.length === 0 && expiringPermits.length === 0 && pendingSyncCount === 0 && (
                <div className="p-5 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  {t('Hakuna arifa mpya kwa sasa.', 'No urgent alerts right now.')}
                </div>
              )}

              <button
                type="button"
                onClick={() => { setNotifOpen(false); setSyncOpen(true) }}
                className="btn-secondary w-full justify-center text-xs"
              >
                <Gauge size={14} /> {t('Fungua Foleni ya Mtandao & Data Kidogo', 'Open Sync Queue & Low Data Settings')}
              </button>
            </div>
          </Modal>
        )}

        <SyncQueueModal open={syncOpen} onClose={() => setSyncOpen(false)} />
      </div>
    </div>
  )
}
