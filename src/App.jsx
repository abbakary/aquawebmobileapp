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
  ChevronDown,
  Menu,
  X,
  Fish,
  MapPin,
  Smartphone,
  PanelLeftClose,
  PanelLeftOpen,
  Fuel as FuelIcon,
  Wrench,
  Anchor
} from 'lucide-react'
import { useS, ROLES } from './store'
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
import { PWAInstallButton, OfflineIndicator } from './ui'

import { LangToggle } from './i18n'

const MODULE_DEFS = {
  home: { label: ['Muhtasari wa Biashara', 'Business Overview'], shortLabel: ['Nyumbani', 'Home'], icon: LayoutDashboard, component: Home, group: 'analytics' },
  bi: { label: ['Uchambuzi wa BI & Faida', 'BI & Profit/Loss'], shortLabel: ['BI & Faida', 'BI & P&L'], icon: BarChart3, component: BiDashboard, group: 'analytics' },
  hq: { label: ['Makao Makuu', 'HQ Analytics'], shortLabel: ['Makao', 'HQ'], icon: Building2, component: Hq, group: 'analytics' },
  buy: { label: ['Manunuzi na Mizani', 'Purchases & Weighing'], shortLabel: ['Manunuzi', 'Purchases'], icon: Scale, component: Buy, group: 'operations' },
  crew: { label: ['Usimamizi wa Wavuvi', 'Fisherman & Fleet'], shortLabel: ['Wavuvi', 'Fishermen'], icon: Anchor, component: Crew, group: 'operations' },
  fuel: { label: ['Mafuta na Mikopo', 'Fishing Fuel & Credit'], shortLabel: ['Mafuta', 'Fuel'], icon: FuelIcon, component: Fuel, group: 'operations' },
  maintenance: { label: ['Meli na Matengenezo', 'Fleet & Maintenance'], shortLabel: ['Matengenezo', 'Fleet'], icon: Wrench, component: Maintenance, group: 'operations' },
  stock: { label: ['Stoo na Vyumba Baridi', 'Stock & Cold Rooms'], shortLabel: ['Stoo', 'Stock'], icon: Warehouse, component: Stock, group: 'inventory' },
  sales: { label: ['Mauzo ya Viwanda', 'Industry Sales'], shortLabel: ['Mauzo', 'Sales'], icon: ShoppingBag, component: Sales, group: 'commercial' },
  suppliers: { label: ['Wavuvi na BMU', 'Fishermen & BMUs'], shortLabel: ['Wavuvi', 'Suppliers'], icon: Users, component: Suppliers, group: 'commercial' },
  quality: { label: ['Ukaguzi wa Ubora', 'Quality Inspection'], shortLabel: ['Ubora', 'Quality'], icon: ShieldCheck, component: Quality, group: 'operations' },
  payments: { label: ['Malipo ya Wavuvi', 'Supplier Payments'], shortLabel: ['Malipo', 'Payments'], icon: DollarSign, component: Payments, group: 'commercial' },
  transport: { label: ['Usafiri wa Baridi', 'Cold Chain Transport'], shortLabel: ['Usafiri', 'Transport'], icon: Truck, component: Transport, group: 'operations' },
  expenses: { label: ['Matumizi na Gharama', 'Expenses & Landed Cost'], shortLabel: ['Matumizi', 'Expenses'], icon: Receipt, component: Expenses, group: 'commercial' },
  compliance: { label: ['Vibali vya FiRCIS', 'FiRCIS & Permits'], shortLabel: ['Vibali', 'Compliance'], icon: FileText, component: Compliance, group: 'governance' },
  reports: { label: ['Ripoti za Biashara', 'BI Reports & Exports'], shortLabel: ['Ripoti', 'Reports'], icon: BarChart3, component: Reports, group: 'analytics' },
  audit: { label: ['Kumbukumbu za Ukaguzi', 'Audit Trail'], shortLabel: ['Ukaguzi', 'Audit'], icon: ShieldAlert, component: Audit, group: 'governance' },
  staff: { label: ['Wafanyakazi na Majukumu', 'Staff & Roles'], shortLabel: ['Wafanyakazi', 'Staff'], icon: UserCheck, component: Staff, group: 'governance' }
}

const MODULE_GROUPS = [
  { id: 'analytics', label: ['Takwimu na Makao', 'Analytics & HQ'], shortGroup: ['Makao', 'HQ & BI'], defaultTab: 'home', items: ['home', 'bi', 'hq', 'reports'] },
  { id: 'operations', label: ['Uendeshaji', 'Operations'], shortGroup: ['Ziwa', 'Lake Ops'], defaultTab: 'buy', items: ['buy', 'crew', 'fuel', 'maintenance', 'quality', 'transport'] },
  { id: 'inventory', label: ['Stoo ya Sasa', 'Live Inventory'], shortGroup: ['Stoo', 'Cold Room'], defaultTab: 'stock', items: ['stock'] },
  { id: 'commercial', label: ['Biashara na Mauzo', 'Commercial & Sales'], shortGroup: ['Biashara', 'Commercial'], defaultTab: 'sales', items: ['sales', 'suppliers', 'payments', 'expenses'] },
  { id: 'governance', label: ['Vibali na Ukaguzi', 'Compliance & Audit'], shortGroup: ['Usimamizi', 'Governance'], defaultTab: 'compliance', items: ['compliance', 'audit', 'staff'] }
]

const SIDEBAR_ITEMS = [
  'home',
  'bi',
  'hq',
  'buy',
  'crew',
  'fuel',
  'maintenance',
  'stock',
  'sales',
  'quality',
  'suppliers',
  'payments',
  'transport',
  'expenses',
  'reports',
  'compliance',
  'audit',
  'staff'
]

const MOBILE_NAV_KEYS = ['home', 'buy', 'stock', 'sales', 'more']

export default function App() {
  const { s, T, B, me, x, ses, lang, setLang, t } = useS()
  const [view, setView] = useState(() => location.hash.replace('#/', '') || '')
  const [tab, setTab] = useState(() => {
    const v = location.hash.replace('#/', '') || ''
    return MODULE_DEFS[v] ? v : 'home'
  })
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('ft_sidebar_collapsed') === '1'
    } catch (e) {
      return false
    }
  })
  const [moreOpen, setMoreOpen] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState({})

  const toggleGroup = gid => {
    setCollapsedGroups(prev => ({ ...prev, [gid]: !prev[gid] }))
  }

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev
      try {
        localStorage.setItem('ft_sidebar_collapsed', next ? '1' : '0')
      } catch (e) {}
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
      if (MODULE_DEFS[v]) {
        setTab(v)
      }
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

  const soon = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10)
  const badges = {
    quality: s.batches.filter(b => b.st === 'pending').length,
    compliance: s.comp.filter(c => c.exp < soon).length
  }

  const out = () => {
    x.logout()
    nav('')
  }

  return (
    <div className="app-container">
      {/* Offline Status PWA Banner */}
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

        {/* Top Header with Modular Tabs */}
        <header className="top-header">
          <div className="header-left">
            {/* Collapse / Expand Toggle Button */}
            <button
              onClick={toggleCollapsed}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition shrink-0"
              title={collapsed ? t('Panua menyu', 'Expand sidebar') : t('Punguza menyu', 'Collapse sidebar')}
            >
              {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>

            <div
              className="header-title-block"
              title={`${T.name} — ${t(MODULE_DEFS[currentTab]?.label[0], MODULE_DEFS[currentTab]?.label[1])}`}
            >
              <small>{T.name}</small>
              <h1>{t(MODULE_DEFS[currentTab]?.label[0], MODULE_DEFS[currentTab]?.label[1])}</h1>
            </div>

            {/* Station Switcher */}
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

          {/* Center: Top Modular Switcher Tabs */}
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
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t('Moja kwa Moja', 'Live Ops')}
            </span>

            {/* Swahili / English Switcher */}
            <LangToggle lang={lang} setLang={setLang} />

            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* User Profile */}
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
        <main className="flex-1">
          <ActiveComponent go={changeTab} />
        </main>

        {/* Mobile Bottom Navigation (< 768px) */}
        <nav className="mobile-bottom-nav">
          <button
            onClick={() => changeTab('home')}
            className={`mobile-nav-btn ${currentTab === 'home' ? 'active' : ''}`}
          >
            <LayoutDashboard size={20} />
            <span>{t('Nyumbani', 'Overview')}</span>
          </button>
          {isAllowed('buy') && (
            <button
              onClick={() => changeTab('buy')}
              className={`mobile-nav-btn ${currentTab === 'buy' ? 'active' : ''}`}
            >
              <Scale size={20} />
              <span>{t('Manunuzi', 'Buy')}</span>
            </button>
          )}
          {isAllowed('stock') && (
            <button
              onClick={() => changeTab('stock')}
              className={`mobile-nav-btn ${currentTab === 'stock' ? 'active' : ''}`}
            >
              <Warehouse size={20} />
              <span>{t('Stoo', 'Stock')}</span>
            </button>
          )}
          {isAllowed('sales') && (
            <button
              onClick={() => changeTab('sales')}
              className={`mobile-nav-btn ${currentTab === 'sales' ? 'active' : ''}`}
            >
              <ShoppingBag size={20} />
              <span>{t('Mauzo', 'Sales')}</span>
            </button>
          )}
          <button
            onClick={() => setMoreOpen(true)}
            className="mobile-nav-btn"
          >
            <Menu size={20} />
            <span>{t('Zaidi', 'More')}</span>
          </button>
        </nav>

        {/* Mobile "More" Drawer Modal */}
        {moreOpen && (
          <div className="modal-overlay" onClick={() => setMoreOpen(false)}>
            <div className="modal-dialog max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <b className="text-base text-slate-900">{t('Moduli Zote', 'All Modules')}</b>
                <button onClick={() => setMoreOpen(false)} className="text-slate-400 p-1">
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <div className="grid grid-cols-2 gap-2.5">
                  {SIDEBAR_ITEMS.filter(isAllowed).map(k => {
                    const item = MODULE_DEFS[k]
                    const Icon = item.icon
                    return (
                      <button
                        key={k}
                        onClick={() => {
                          changeTab(k)
                          setMoreOpen(false)
                        }}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-center transition ${
                          currentTab === k ? 'bg-blue-50 border-blue-700 text-blue-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <Icon size={22} className={currentTab === k ? 'text-blue-700' : 'text-slate-500'} />
                        <span className="text-xs leading-tight">{t(item.label[0], item.label[1])}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
