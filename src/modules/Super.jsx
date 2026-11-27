import React, { useState } from 'react'
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  ShieldCheck,
  LogOut,
  Search
} from 'lucide-react'
import { useS, PLANS } from '../store'
import { Sheet, Field, Btn, Badge, Kpis, tzs } from '../ui'

const rev = z =>
  z.branches.reduce(
    (a, b) => a + b.data.sales.reduce((q, s) => q + s.kg * s.price, 0),
    0
  )

export default function Super() {
  const { db, x, t: tr } = useS()
  const [t, setT] = useState('overview')
  const [o, setO] = useState(null)
  const [pin, setPin] = useState('')
  const [q, setQ] = useState('')

  const NAVS = [
    ['overview', LayoutDashboard, tr('Muhtasari', 'Overview')],
    ['tenants', Building2, tr('Kampuni', 'Tenants')],
    ['plans', CreditCard, tr('Vifurushi', 'Plans')],
    ['activity', ShieldCheck, tr('Matukio', 'Activity')]
  ]

  const pr = id => PLANS.find(p => p.id === id)?.price || 0
  const act = db.tenants.filter(z => z.status !== 'suspended')
  const mrr = act.reduce((a, z) => a + pr(z.plan), 0)
  const tn = o && db.tenants.find(z => z.id === o)
  const col = { active: 'green', trial: 'blue', suspended: 'red' }

  const mon = {}
  db.tenants.forEach(z => {
    const k = z.created.slice(0, 7)
    mon[k] = (mon[k] || 0) + 1
  })
  const mm = Math.max(1, ...Object.values(mon))
  const list = db.tenants.filter(z =>
    z.name.toLowerCase().includes(q.toLowerCase())
  )
  const currentNav = NAVS.find(n => n[0] === t) || NAVS[0]

  return (
    <div className="app-shell">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-[#052d56] text-white h-screen border-r border-slate-800/50">
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow overflow-hidden shrink-0">
            <img
              src="/assets/aistudio/AquaCatch_Sharkwave_Logo_df0743e7.png"
              alt="AquaCatch"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="leading-tight">
            <span className="text-sm font-extrabold block">AquaCatch</span>
            <span className="text-[10px] font-bold text-teal-300 uppercase tracking-wider">
              {tr('Mfumo Mkuu', 'Platform Admin')}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
          {NAVS.map(([id, Icon, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setT(id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                t === id
                  ? 'bg-[#18b8b2] text-slate-950 font-bold shadow-sm'
                  : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            type="button"
            onClick={x.logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 transition"
          >
            <LogOut size={15} /> {tr('Toka', 'Logout')}
          </button>
        </div>
      </aside>

      {/* Main Column */}
      <div className="main-content">
        {/* Desktop Header */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200 px-6 items-center justify-between shrink-0">
          <div>
            <small className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
              {tr('Mfumo wa FishTrade', 'FishTrade Platform')}
            </small>
            <h1 className="text-lg font-bold text-slate-900 m-0">{currentNav[2]}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <b className="text-xs text-slate-900 block">{tr('Msimamizi Mkuu', 'Super Admin')}</b>
              <small className="text-[11px] text-slate-500">{tr('Udhibiti kamili', 'Full control')}</small>
            </div>
            <button type="button" onClick={x.logout} className="btn-secondary text-xs">
              <LogOut size={14} /> {tr('Toka', 'Logout')}
            </button>
          </div>
        </header>

        {/* Mobile Sticky Top Bar */}
        <header className="mobile-top-bar md:hidden">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white p-0.5 flex items-center justify-center shrink-0">
              <img
                src="/assets/aistudio/AquaCatch_Sharkwave_Logo_df0743e7.png"
                alt="AquaCatch"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0 leading-tight">
              <span className="text-[10px] font-bold text-teal-300 uppercase tracking-wider block">
                {tr('Msimamizi Mkuu', 'Platform Admin')}
              </span>
              <h1 className="text-sm font-extrabold text-white m-0 truncate">{currentNav[2]}</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={x.logout}
            aria-label={tr('Toka', 'Logout')}
            className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center active:scale-95 transition shrink-0"
          >
            <LogOut size={16} />
          </button>
        </header>

        {/* Main Content */}
        <main className="main-scroll">
          <div className="page-body">
            {t === 'overview' && (
              <>
                <Kpis
                  a={[
                    [tr('Kampuni', 'Companies'), `${db.tenants.length} (${act.length}${tr(' hai)', ' live)')}`, '🏢'],
                    [tr('Mapato ya Mwezi (MRR)', 'Monthly revenue (MRR)'), tzs(mrr), '💳'],
                    [tr('Matawi', 'Branches'), db.tenants.reduce((a, z) => a + z.branches.length, 0), '🏬'],
                    [tr('Watumiaji', 'Users'), db.tenants.reduce((a, z) => a + z.staff.length, 0), '👥'],
                    [tr('Mauzo ya Mfumo', 'Platform sales volume'), tzs(db.tenants.reduce((a, z) => a + rev(z), 0)), '💰'],
                    [tr('Zilizosimamishwa', 'Suspended'), db.tenants.filter(z => z.status === 'suspended').length, '⛔']
                  ]}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="panel flex flex-col gap-3">
                    <h4 className="text-sm font-bold text-slate-900 m-0">
                      {tr('Kampuni mpya kwa mwezi', 'New companies by month')}
                    </h4>
                    <div className="flex flex-col gap-2.5">
                      {Object.entries(mon)
                        .sort()
                        .map(([k, v]) => (
                          <div key={k} className="flex flex-col gap-1 text-xs">
                            <div className="flex justify-between font-mono">
                              <span className="text-slate-600">{k}</span>
                              <b className="text-slate-900">{v}</b>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#052d56] rounded-full"
                                style={{ width: `${(v / mm) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="panel flex flex-col gap-3">
                    <h4 className="text-sm font-bold text-slate-900 m-0">
                      {tr('Kampuni zinazoongoza kwa mauzo', 'Top companies by sales')}
                    </h4>
                    <div className="divide-y divide-slate-100">
                      {[...db.tenants]
                        .sort((a, b) => rev(b) - rev(a))
                        .map(z => (
                          <div key={z.id} className="flex items-center justify-between py-2 text-xs gap-2">
                            <span className="font-medium text-slate-700 truncate">{z.name}</span>
                            <b className="font-mono text-slate-900 shrink-0">{tzs(rev(z))}</b>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="panel flex flex-col gap-3">
                    <h4 className="text-sm font-bold text-slate-900 m-0">
                      {tr('Mgawanyo wa Vifurushi', 'Plan mix')}
                    </h4>
                    <div className="divide-y divide-slate-100">
                      {PLANS.map(p => (
                        <div key={p.id} className="flex items-center justify-between py-2 text-xs gap-2">
                          <span className="font-semibold text-slate-700">{p.id}</span>
                          <b className="font-mono text-slate-900">
                            {db.tenants.filter(z => z.plan === p.id).length} {tr('kampuni', 'companies')}
                          </b>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {t === 'tenants' && (
              <div className="flex flex-col gap-3">
                <div className="relative w-full sm:max-w-md">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    placeholder={tr('Andika jina la kampuni...', 'Type a company name...')}
                    className="input-field pl-10 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {list.map(z => (
                    <div key={z.id} className="mobile-card flex flex-col gap-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <b className="text-sm text-slate-900 block truncate">{z.name}</b>
                          <span className="text-[11px] text-slate-500">
                            {z.plan} · {z.branches.length} {tr('matawi', 'branches')} · {z.staff.length} {tr('watumiaji', 'users')}
                          </span>
                        </div>
                        <Badge variant={col[z.status] || 'neutral'}>{z.status}</Badge>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs gap-2">
                        <div>
                          <span className="text-slate-400 block text-[11px]">{tr('tangu ', 'since ')}{z.created}</span>
                          <b className="font-mono text-slate-900">{tzs(rev(z))}</b>
                        </div>
                        <Btn className="text-xs py-1.5 px-3" onClick={() => setO(z.id)}>
                          {tr('Simamia', 'Manage')}
                        </Btn>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {t === 'plans' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PLANS.map(p => (
                  <div key={p.id} className="mobile-card flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <b className="text-base text-slate-900">{p.id}</b>
                        <Badge variant="blue">
                          {db.tenants.filter(z => z.plan === p.id).length} {tr('kampuni', 'companies')}
                        </Badge>
                      </div>
                      <b className="text-lg font-mono text-blue-900 block">
                        {tzs(p.price)}/{tr('mwezi', 'month')}
                      </b>
                      <p className="text-xs text-slate-600 mt-2 mb-0">{p.note}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 font-mono">
                      {tr('Hadi matawi ', 'Up to ')}
                      {p.branches > 50 ? tr('yasiyo na kikomo', 'unlimited') : p.branches} ·{' '}
                      {p.users > 500 ? tr('watumiaji wasio na kikomo', 'unlimited') : p.users}{' '}
                      {tr('watumiaji', 'users')}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {t === 'activity' && (
              <div className="flex flex-col gap-2.5">
                {db.plat.log.length ? (
                  db.plat.log.map(l => (
                    <div key={l.id} className="mobile-card flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <b className="text-xs text-slate-900">{l.m}</b>
                      <span className="text-[11px] font-mono text-slate-500 shrink-0">{l.t}</span>
                    </div>
                  ))
                ) : (
                  <div className="mobile-card text-center py-8 text-xs text-slate-400">
                    {tr('Hakuna matukio bado.', 'No platform activity yet.')}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="mobile-bottom-nav md:hidden">
          {NAVS.map(([id, Icon, label]) => {
            const active = t === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setT(id)}
                className={`mobile-nav-item ${active ? 'active' : ''}`}
              >
                <Icon size={20} strokeWidth={active ? 2.4 : 1.9} />
                <span>{label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Manage Tenant Sheet */}
      {tn && (
        <Sheet title={tn.name} onClose={() => setO(null)}>
          <div className="flex flex-col gap-4">
            <p className="text-xs text-slate-500 m-0">
              {tn.sector} · {tn.region} · {tr('mmiliki', 'owner')} @
              {(tn.staff.find(y => y.role === 'Owner') || tn.staff[0]).username}
            </p>

            <Field label={tr('Kifurushi', 'Plan')}>
              <select
                value={tn.plan}
                onChange={e =>
                  x.setTenant(tn.id, { plan: e.target.value }, 'Plan of ' + tn.name + ' set to ' + e.target.value)
                }
                className="input-field"
              >
                {PLANS.map(p => (
                  <option key={p.id}>{p.id}</option>
                ))}
              </select>
            </Field>

            <div className="flex flex-col gap-1.5">
              <h4 className="text-xs font-bold uppercase text-slate-500 m-0">{tr('Matawi', 'Branches')}</h4>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
                {tn.branches.map(b => (
                  <div key={b.id} className="flex items-center justify-between px-3 py-2 text-xs">
                    <span className="text-slate-700 font-medium">{b.name}</span>
                    <b className="font-mono text-slate-900">
                      {tzs(b.data.sales.reduce((a, s) => a + s.kg * s.price, 0))}
                    </b>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {tn.status === 'suspended' ? (
                <button
                  type="button"
                  onClick={() => x.setTenant(tn.id, { status: 'active' }, 'Activated ' + tn.name)}
                  className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-xs"
                >
                  {tr('Washa', 'Activate')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => x.setTenant(tn.id, { status: 'suspended' }, 'Suspended ' + tn.name)}
                  className="btn-primary bg-rose-600 hover:bg-rose-700 text-xs"
                >
                  {tr('Simamisha', 'Suspend')}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  x.impersonate(tn.id)
                  setO(null)
                }}
                className="btn-primary text-xs"
              >
                {tr('Fungua kama Mmiliki', 'Open as owner')}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end gap-2 pt-2 border-t border-slate-100">
              <div className="flex-1">
                <Field label={tr('Weka upya PIN ya Mmiliki', 'Reset owner PIN')}>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    placeholder={tr('PIN mpya (namba 4-6)', 'New 4-6 digit PIN')}
                    className="input-field font-mono"
                  />
                </Field>
              </div>
              <button
                type="button"
                disabled={!/^\d{4,6}$/.test(pin)}
                onClick={() => {
                  x.resetPin(tn.id, pin)
                  setPin('')
                }}
                className="btn-secondary text-xs disabled:opacity-50"
              >
                {tr('Weka upya PIN', 'Reset PIN')}
              </button>
            </div>
          </div>
        </Sheet>
      )}
    </div>
  )
}

