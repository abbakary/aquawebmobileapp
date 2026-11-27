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
  Gauge,
  Ship,
  ShoppingCart,
  Store,
  BadgeCheck,
  Wallet,
  CreditCard,
  FileSpreadsheet,
  Droplets,
  TrendingUp,
  ArrowLeftRight,
  LayoutGrid,
  Home as HomeIcon
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

const MOBILE_LAUNCHER_GROUPS = [
  {
    id: 'core',
    title: ['USIMAMIZI WA SAMAKI', 'CORE FISH MANAGEMENT'],
    items: [
      { id: 'crew', tab: 'crew', subTab: 'company', label: ['Wavuvi', 'Crew'], icon: Ship, card: 'bg-slate-100/85 border-slate-200/80', color: 'text-[#0b3a8c]' },
      { id: 'buy', tab: 'buy', label: ['Manunuzi', 'Purchasing'], icon: ShoppingCart, card: 'bg-blue-50/85 border-blue-100', color: 'text-blue-700' },
      { id: 'suppliers', tab: 'suppliers', label: ['Wasambazaji', 'Fishermen'], icon: Users, card: 'bg-teal-50/85 border-teal-100', color: 'text-teal-700' },
      { id: 'stock', tab: 'stock', label: ['Stoo', 'Storage'], icon: Warehouse, card: 'bg-indigo-50/85 border-indigo-100', color: 'text-indigo-700' },
      { id: 'sales', tab: 'sales', label: ['Mauzo', 'Sales'], icon: Store, card: 'bg-purple-50/85 border-purple-100', color: 'text-purple-700' },
      { id: 'quality', tab: 'quality', label: ['Ubora', 'Quality'], icon: BadgeCheck, card: 'bg-emerald-50/85 border-emerald-100', color: 'text-emerald-700' },
      { id: 'transport', tab: 'transport', label: ['Usafiri', 'Transport'], icon: Truck, card: 'bg-teal-50/75 border-teal-100', color: 'text-emerald-700' },
      { id: 'payments', tab: 'payments', label: ['Malipo', 'Payments'], icon: Wallet, card: 'bg-amber-50/85 border-amber-100', color: 'text-amber-700' }
    ]
  },
  {
    id: 'ops',
    title: ['UENDESHAJI & GHARAMA', 'OPERATIONS & COSTS'],
    items: [
      { id: 'fuel', tab: 'fuel', subTab: 'issue', label: ['Mafuta', 'Fuel'], icon: FuelIcon, card: 'bg-amber-50/85 border-amber-100', color: 'text-amber-600' },
      { id: 'boats', tab: 'maintenance', subTab: 'orders', label: ['Boti', 'Boats'], icon: Wrench, card: 'bg-orange-50/85 border-orange-100', color: 'text-orange-700' },
      { id: 'spares', tab: 'maintenance', subTab: 'spares', label: ['Zana', 'Spares'], icon: Anchor, card: 'bg-cyan-50/85 border-cyan-100', color: 'text-cyan-700' },
      { id: 'accounts', tab: 'fuel', subTab: 'accounts', label: ['Akaunti', 'Accounts'], icon: Droplets, card: 'bg-emerald-50/85 border-emerald-100', color: 'text-emerald-700' },
      { id: 'advances', tab: 'crew', subTab: 'financials', label: ['Mikopo', 'Advances'], icon: CreditCard, card: 'bg-rose-50/85 border-rose-100', color: 'text-rose-600' },
      { id: 'settlements', tab: 'fuel', subTab: 'settlements', label: ['Makato', 'Settlements'], icon: FileSpreadsheet, card: 'bg-sky-50/85 border-sky-100', color: 'text-[#0b3a8c]' }
    ]
  },
  {
    id: 'leadership',
    title: ['UONGOZI & TAKWIMU', 'LEADERSHIP & ANALYTICS'],
    items: [
      { id: 'hq', tab: 'hq', label: ['Makao', 'HQ'], icon: Building2, card: 'bg-slate-100/85 border-slate-200/80', color: 'text-[#052d56]' },
      { id: 'bi', tab: 'bi', label: ['BI & Faida', 'BI & P&L'], icon: TrendingUp, card: 'bg-sky-50/85 border-sky-100', color: 'text-blue-700' },
      { id: 'expenses', tab: 'expenses', label: ['Matumizi', 'Expenses'], icon: Receipt, card: 'bg-purple-50/85 border-purple-100', color: 'text-purple-600' },
      { id: 'reports', tab: 'reports', label: ['Ripoti', 'Reports'], icon: BarChart3, card: 'bg-emerald-50/85 border-emerald-100', color: 'text-emerald-700' },
      { id: 'compliance', tab: 'compliance', label: ['Vibali', 'Licences'], icon: FileText, card: 'bg-rose-50/85 border-rose-100', color: 'text-rose-600' },
      { id: 'audit', tab: 'audit', label: ['Ukaguzi', 'Audit'], icon: ShieldAlert, card: 'bg-slate-100/85 border-slate-200/80', color: 'text-slate-700' },
      { id: 'staff', tab: 'staff', label: ['Wafanyakazi', 'Staff'], icon: UserCheck, card: 'bg-violet-50/85 border-violet-100', color: 'text-violet-700' },
      { id: 'home', tab: 'home', label: ['Nyumbani', 'Home'], icon: HomeIcon, card: 'bg-blue-50/85 border-blue-100', color: 'text-[#0b3a8c]' }
    ]
  }
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

  const changeTab = (k, subTab) => {
    if (subTab) {
      try {
        sessionStorage.setItem('ft_subtab', JSON.stringify({ tab: k, subTab }))
      } catch {}
      window.dispatchEvent(new CustomEvent('aquacatch:subtab', { detail: { tab: k, subTab } }))
    }
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

        {/* Mobile Bottom Navigation (< 768px, Distinct Mobile App Icons) */}
        <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
          <button
            type="button"
            onClick={() => changeTab('home')}
            className={`mobile-nav-btn ${currentTab === 'home' ? 'active' : ''}`}
          >
            <HomeIcon size={20} strokeWidth={currentTab === 'home' ? 2.4 : 1.9} />
            <span>{t('Nyumbani', 'Home')}</span>
          </button>
          {isAllowed('buy') && (
            <button
              type="button"
              onClick={() => changeTab('buy')}
              className={`mobile-nav-btn ${currentTab === 'buy' ? 'active' : ''}`}
            >
              <ShoppingCart size={20} strokeWidth={currentTab === 'buy' ? 2.4 : 1.9} />
              <span>{t('Manunuzi', 'Purchase')}</span>
            </button>
          )}
          {isAllowed('stock') && (
            <button
              type="button"
              onClick={() => changeTab('stock')}
              className={`mobile-nav-btn ${currentTab === 'stock' ? 'active' : ''}`}
            >
              <Warehouse size={20} strokeWidth={currentTab === 'stock' ? 2.4 : 1.9} />
              <span>{t('Stoo', 'Inventory')}</span>
            </button>
          )}
          {isAllowed('sales') && (
            <button
              type="button"
              onClick={() => changeTab('sales')}
              className={`mobile-nav-btn ${currentTab === 'sales' ? 'active' : ''}`}
            >
              <Store size={20} strokeWidth={currentTab === 'sales' ? 2.4 : 1.9} />
              <span>{t('Mauzo', 'Sales')}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`mobile-nav-btn ${moreOpen ? 'active' : ''}`}
          >
            <LayoutGrid size={20} strokeWidth={moreOpen ? 2.4 : 1.9} />
            <span>{t('Moduli', 'Apps')}</span>
          </button>
        </nav>

        {/* Mobile App-Icon Launcher Bottom Sheet (Matches Reference Mobile Launcher) */}
        {moreOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[2px] flex items-end md:hidden"
            onClick={() => setMoreOpen(false)}
          >
            <section
              onClick={e => e.stopPropagation()}
              className="w-full max-h-[91dvh] bg-white rounded-t-[26px] flex flex-col overflow-hidden shadow-2xl animate-[sheetSlideUp_0.22s_ease-out]"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              {/* Drag Handle */}
              <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mt-2.5 mb-2 shrink-0" />

              {/* Blue Gradient Brand Hero Card */}
              <div className="mx-4 rounded-2xl bg-gradient-to-r from-[#052d56] via-[#0b3a8c] to-[#135fd4] p-3.5 text-white flex items-center justify-between gap-2 shadow-md shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-sm">
                    <img
                      src="/assets/aistudio/AquaCatch_Sharkwave_Logo_df0743e7.png"
                      alt="AquaCatch"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 leading-tight">
                    <b className="text-[14.5px] font-extrabold text-white block truncate">
                      {T?.name || 'FishTrade ERP'}
                    </b>
                    <span className="text-xs text-sky-100/90 block truncate mt-0.5">
                      {me.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <LangToggle lang={lang} setLang={setLang} />
                  <span className="px-2.5 py-1.5 rounded-lg bg-white/18 text-white text-[11px] font-bold">
                    {s.role}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMoreOpen(false)}
                    aria-label="Close app launcher"
                    className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Scrollable App Launcher Content */}
              <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4 space-y-4 no-scrollbar">
                {/* Single Clean Branch Selector Row */}
                <div className="relative flex items-center justify-between gap-3 px-2 py-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0b3a8c] flex items-center justify-center shrink-0">
                      <MapPin size={18} />
                    </div>
                    <div className="min-w-0">
                      <b className="text-sm text-slate-900 block leading-tight">
                        {hq && T.branches.length > 1 ? t('Chagua Tawi', 'Select Branch') : t('Kituo Cha Sasa', 'Active Branch')}
                      </b>
                      <span className="text-xs text-slate-500 block truncate mt-0.5">{B?.name}</span>
                    </div>
                  </div>
                  {hq && T.branches.length > 1 && (
                    <>
                      <ArrowLeftRight size={17} className="text-slate-500 shrink-0" />
                      <select
                        value={B.id}
                        aria-label={t('Chagua Tawi', 'Select Branch')}
                        onChange={e => {
                          x.switchBranch(e.target.value)
                          changeTab('home')
                          setMoreOpen(false)
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      >
                        {T.branches.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </div>

                {/* Grouped 4-Column Colored App-Icon Grids */}
                {MOBILE_LAUNCHER_GROUPS.map(grp => {
                  const visibleItems = grp.items.filter(item => isAllowed(item.tab))
                  if (visibleItems.length === 0) return null
                  return (
                    <div key={grp.id}>
                      <h4 className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400 m-0 mb-2 px-0.5">
                        {t(grp.title[0], grp.title[1])}
                      </h4>
                      <div className="grid grid-cols-4 gap-2.5">
                        {visibleItems.map(item => {
                          const Icon = item.icon
                          const active = currentTab === item.tab && !item.subTab
                          const badgeCount = !item.subTab ? badges[item.tab] || 0 : 0
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                changeTab(item.tab, item.subTab)
                                setMoreOpen(false)
                              }}
                              className={`relative flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-2xl border transition active:scale-95 ${item.card} ${
                                active ? 'ring-2 ring-[#052d56] shadow-sm' : ''
                              }`}
                            >
                              <Icon size={22} className={`${item.color} shrink-0`} strokeWidth={2.1} />
                              <span className={`text-[11px] font-semibold leading-tight text-center truncate w-full px-0.5 ${item.color}`}>
                                {t(item.label[0], item.label[1])}
                              </span>
                              {badgeCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow">
                                  {badgeCount}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}

                {/* Adaptive Connectivity, Low Data & PWA Install Row */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMoreOpen(false)
                        setSyncOpen(true)
                      }}
                      className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-left"
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        !isOnline ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {isOnline ? <Smartphone size={16} /> : <WifiOff size={16} />}
                      </div>
                      <div className="min-w-0">
                        <b className="text-[11px] text-slate-900 block truncate">{device.platformLabel}</b>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {pendingSyncCount > 0
                            ? `${pendingSyncCount} ${t('foleni', 'queued')}`
                            : device.networkLabel}
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => device.setLowBandwidthMode(!lowBandwidthMode)}
                      className={`flex items-center justify-between gap-2 p-2.5 rounded-2xl border text-left ${
                        lowBandwidthMode
                          ? 'bg-sky-50 border-sky-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-[#0b3a8c] flex items-center justify-center shrink-0">
                          <Gauge size={16} />
                        </div>
                        <span className="text-[11px] font-bold text-slate-800 truncate">
                          {t('Data Kidogo', 'Low Data')}
                        </span>
                      </div>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                        lowBandwidthMode ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {lowBandwidthMode ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  </div>

                  <PWAInstallButton />
                </div>

                {/* Sign Out Row */}
                <button
                  type="button"
                  onClick={out}
                  className="w-full flex items-center gap-3 px-1 py-2.5 border-t border-slate-100 text-rose-600 hover:bg-rose-50/60 rounded-xl font-bold text-sm transition"
                >
                  <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <LogOut size={17} />
                  </div>
                  <span>{t('Toka Kwenye Mfumo', 'Sign Out')}</span>
                </button>
              </div>
            </section>
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
