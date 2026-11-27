import React, { useState, useEffect } from 'react'
import {
  Building2,
  DollarSign,
  Truck,
  Plus,
  Search,
  FileText,
  Printer,
  Share2,
  CheckCircle2,
  AlertTriangle,
  QrCode
} from 'lucide-react'
import { useS, stock, cusBal } from '../store'
import { Modal, Field, Badge, FishPhoto, ReceiptModal, DetailModal, ViewBtn, f, tzs, fmtT } from '../ui'

export default function Sales() {
  const { s, a, t, spLabel } = useS()
  const [tab, setTab] = useState('orders') // 'orders' or 'customers'
  const [modalMode, setModalMode] = useState(null)
  const [rc, setRc] = useState(null) // receive payment modal
  const [inv, setInv] = useState(null) // invoice receipt view
  const [viewSale, setViewSale] = useState(null)
  const [viewCus, setViewCus] = useState(null)
  const [amt, setAmt] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const onQuickAdd = e => {
      if (e.detail?.tab !== 'sales') return
      setModalMode('sale')
    }
    window.addEventListener('aquacatch:quick-add', onQuickAdd)
    return () => window.removeEventListener('aquacatch:quick-add', onQuickAdd)
  }, [])

  const st = stock(s)
  const keys = Object.keys(st)
  const [d, setD] = useState({ cus: '', key: '', kg: '1000', price: '11000', paid: '8000000' })
  const [n, setN] = useState({ name: '', phone: '', location: '', limit: '30000000', contact: '' })

  const cus = d.cus || s.customers[0]?.id
  const key = d.key || keys[0] || '|'
  const [sp, grade] = key.split('|')
  const av = st[key] || 0
  const total = (+d.kg || 0) * (+d.price || 0)

  const currentCus = s.customers.find(c => c.id === cus)
  const lim = currentCus?.limit || Infinity
  const currentOwed = cus ? cusBal(s, cus) : 0
  const over = cus && currentOwed + total - (+d.paid || 0) > lim
  const okS = cus && +d.kg > 0 && +d.kg <= av && +d.price > 0 && !over

  const handleSell = () => {
    a.sell({
      cus,
      sp,
      grade,
      kg: +d.kg,
      price: +d.price,
      paid: Math.min(+d.paid || 0, total)
    })
    setModalMode(null)
    setD({ ...d, kg: '', price: '', paid: '' })
  }

  const handleAddCus = () => {
    a.addCus({ ...n, limit: +n.limit || 0 })
    setModalMode(null)
    setN({ name: '', phone: '', location: '', limit: '30000000', contact: '' })
  }

  const handleReceivePay = () => {
    if (!rc || !(+amt > 0)) return
    a.receive(rc.id, +amt)
    setRc(null)
    setAmt('')
  }

  const totalRev = s.sales.reduce((t, x) => t + x.kg * x.price, 0)
  const totalSoldKg = s.sales.reduce((t, x) => t + x.kg, 0)
  const totalReceivables = s.customers.reduce((t, c) => t + cusBal(s, c.id), 0)

  return (
    <div className="page-body">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 m-0">{t('Mauzo ya Viwanda na Ankara', 'Industry Sales & Dispatch Invoicing')}</h2>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            {t('Mikataba ya viwanda vya samaki, ukomo wa mikopo, hati za usafirishaji, na ankara.', 'Commercial contracts with fish processing plants, credit limits, delivery notes, and FIFO batch allocation.')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setModalMode('sale')} className="hidden md:inline-flex btn-primary">
            <Plus size={16} /> {t('Oda Mpya ya Mauzo', 'New Industry Sales Order')}
          </button>
          <button onClick={() => setModalMode('cus')} className="btn-secondary text-xs w-full md:w-auto justify-center">
            <Building2 size={14} /> {t('Ongeza Kiwanda', 'Add Factory Account')}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap">
            <DollarSign size={22} />
          </div>
          <div className="kpi-content">
            <small>{t('Mapato Ghafi ya Viwanda', 'Gross Industry Revenue')}</small>
            <b>{tzs(totalRev)}</b>
            <span className="kpi-sub">{t('Jumla ya mauzo yaliyotolewa ankara', 'Total sales invoiced')}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap amber">
            <Truck size={22} />
          </div>
          <div className="kpi-content">
            <small>{t('Uzito Uliosafirishwa', 'Volume Delivered')}</small>
            <b>{f(totalSoldKg)} <span className="text-xs font-sans text-slate-400">kg</span></b>
            <span className="kpi-sub">{t('Mizigo iliyofika viwandani', 'Processing industry supplies')}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap green">
            <Building2 size={22} />
          </div>
          <div className="kpi-content">
            <small>{t('Madeni ya Viwanda', 'Outstanding Receivables')}</small>
            <b className="text-blue-800">{tzs(totalReceivables)}</b>
            <span className="kpi-sub">{t('Salio la mikopo ya viwanda', 'Industry credit balances')}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap purple">
            <Building2 size={22} />
          </div>
          <div className="kpi-content">
            <small>{t('Akaunti za Viwanda', 'Factory Accounts')}</small>
            <b>{s.customers.length} <span className="text-xs font-sans text-slate-400">{t('wateja', 'clients')}</span></b>
            <span className="kpi-sub">{t('Mwanza, Dar & Nje ya Nchi', 'Mwanza, Dar & Export')}</span>
          </div>
        </div>
      </div>

      {/* Mobile Pill Switcher + Search (< md) */}
      <div className="flex md:hidden flex-col gap-2.5">
        <div className="flex items-center gap-2 bg-slate-200/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setTab('orders')}
            className={`flex-1 min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              tab === 'orders' ? 'bg-[#052d56] text-white shadow-sm' : 'text-slate-600'
            }`}
          >
            {t('Oda za Mauzo', 'Orders')} ({s.sales.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('customers')}
            className={`flex-1 min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              tab === 'customers' ? 'bg-[#052d56] text-white shadow-sm' : 'text-slate-600'
            }`}
          >
            {t('Viwanda', 'Factories')} ({s.customers.length})
          </button>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={tab === 'orders' ? t('Tafuta ankara au kiwanda...', 'Search invoice or factory...') : t('Tafuta kiwanda...', 'Search factory...')}
            className="input-field pl-10 text-sm"
          />
        </div>
      </div>

      {/* Desktop Tab Selector */}
      <div className="hidden md:flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab('orders')}
          className={`pb-3 px-2 text-xs font-bold border-b-2 transition ${
            tab === 'orders' ? 'border-blue-700 text-blue-900' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('Ankara za Mauzo & Usafirishaji', 'Sales Invoices & Dispatches')} ({s.sales.length})
        </button>
        <button
          onClick={() => setTab('customers')}
          className={`pb-3 px-2 text-xs font-bold border-b-2 transition ${
            tab === 'customers' ? 'border-blue-700 text-blue-900' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('Akaunti za Viwanda vya Samaki', 'Fish Processing Factory Accounts')} ({s.customers.length})
        </button>
      </div>

      {tab === 'orders' ? (
        <>
          {/* Mobile Orders Cards (< md) */}
          <div className="md:hidden flex flex-col gap-2.5">
            {[...s.sales]
              .reverse()
              .filter(x => {
                if (!search.trim()) return true
                const cusObj = s.customers.find(c => c.id === x.cus)
                const q = search.toLowerCase()
                return (x.no || '').toLowerCase().includes(q) || (cusObj?.name || '').toLowerCase().includes(q) || spLabel(x.sp).toLowerCase().includes(q)
              })
              .map(x => {
                const cusObj = s.customers.find(c => c.id === x.cus)
                const saleTotal = x.kg * x.price
                const balDue = saleTotal - x.paid
                return (
                  <div key={x.id} className="mobile-card flex flex-col gap-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FishPhoto sp={x.sp} size={38} />
                        <div className="min-w-0">
                          <b className="text-sm text-slate-900 block truncate">{cusObj?.name || x.cus}</b>
                          <span className="text-[11px] font-mono text-blue-700">{x.no} · {x.date}</span>
                        </div>
                      </div>
                      <Badge variant={x.dis.st === 'Delivered' ? 'green' : 'amber'}>
                        {x.dis.st === 'Delivered' ? t('Imefika', 'Delivered') : t('Njiani', 'Transit')}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 rounded-xl p-2 border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block">{t('Samaki', 'Qty')}</span>
                        <b className="font-mono text-slate-900">{f(x.kg)} kg</b>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">{t('Jumla', 'Total')}</span>
                        <b className="font-mono text-slate-900">{tzs(saleTotal)}</b>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">{t('Salio', 'Due')}</span>
                        <b className={`font-mono ${balDue > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{tzs(balDue)}</b>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ViewBtn onClick={() => setViewSale(x)} />
                      <button
                        type="button"
                        onClick={() => setInv(x)}
                        className="btn-secondary text-xs py-1.5 px-3"
                      >
                        <Printer size={14} /> {t('Ankara', 'Invoice')}
                      </button>
                      {balDue > 0 && (
                        <button
                          type="button"
                          onClick={() => { setRc(x); setAmt(String(balDue)) }}
                          className="btn-primary flex-1 text-xs bg-[#18b8b2] hover:bg-[#139c97]"
                        >
                          {t('Pokea Malipo', 'Receive')}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>

          {/* Desktop Sales Orders Table */}
          <div className="hidden md:block data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('Ankara / Oda', 'Invoice / Order')}</th>
                  <th>{t('Kiwanda', 'Processing Factory')}</th>
                  <th>{t('Samaki & Daraja', 'Fish & Grade')}</th>
                  <th>{t('Uzito Uliosafirishwa', 'Dispatched Quantity')}</th>
                  <th>{t('Jumla ya Ankara', 'Total Invoiced')}</th>
                  <th>{t('Kiasi Kilicholipwa', 'Paid Amount')}</th>
                  <th>{t('Salio la Deni', 'Balance Due')}</th>
                  <th>{t('Usafirishaji', 'Dispatch Logistics')}</th>
                  <th className="text-right">{t('Vitendo', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {[...s.sales].reverse().map(x => {
                  const cusObj = s.customers.find(c => c.id === x.cus)
                  const saleTotal = x.kg * x.price
                  const balDue = saleTotal - x.paid
                  return (
                    <tr key={x.id}>
                      <td>
                        <b className="font-mono text-blue-700">{x.no}</b>
                        <small className="block font-mono text-slate-400">{x.date}</small>
                      </td>
                      <td>
                        <b className="text-slate-900 block">{cusObj?.name || x.cus}</b>
                        <small className="text-slate-400">{cusObj?.location || 'Mwanza'}</small>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <FishPhoto sp={x.sp} size={30} />
                          <div>
                            <span className="font-medium text-slate-900 block">{spLabel(x.sp)}</span>
                            <small className="text-slate-500">{t('Daraja', 'Grade')} {x.grade}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <b className="font-mono text-slate-900">{f(x.kg)} kg</b>
                        <small className="block text-slate-400 font-mono">@ {tzs(x.price)}/kg</small>
                      </td>
                      <td>
                        <b className="font-mono text-slate-900">{tzs(saleTotal)}</b>
                      </td>
                      <td>
                        <span className="font-mono text-emerald-700 font-semibold">{tzs(x.paid)}</span>
                      </td>
                      <td>
                        <b className={`font-mono ${balDue > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          {tzs(balDue)}
                        </b>
                      </td>
                      <td>
                        <Badge variant={x.dis.st === 'Delivered' ? 'green' : 'amber'}>
                          {x.dis.st === 'Delivered' ? t('Imefika', 'Delivered') : t('Iko Njiani', 'In transit')}
                        </Badge>
                        <small className="block text-slate-400">{x.dis.veh || 'KYC Truck'}</small>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <ViewBtn onClick={() => setViewSale(x)} />
                          <button
                            onClick={() => setInv(x)}
                            title={t('Chapa Ankara', 'Print Sales Invoice')}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                          >
                            <Printer size={15} />
                          </button>
                          {balDue > 0 && (
                            <button
                              onClick={() => {
                                setRc(x)
                                setAmt(String(balDue))
                              }}
                              className="btn-primary text-xs py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700"
                            >
                              {t('Pokea Malipo', 'Receive')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          {/* Mobile Factory Cards (< md) */}
          <div className="md:hidden flex flex-col gap-2.5">
            {s.customers
              .filter(c => !search.trim() || c.name.toLowerCase().includes(search.toLowerCase()) || (c.location || '').toLowerCase().includes(search.toLowerCase()))
              .map(c => {
                const owed = cusBal(s, c.id)
                const limit = c.limit || 30000000
                const util = Math.min(100, Math.round((owed / limit) * 100))
                return (
                  <div key={c.id} className="mobile-card flex flex-col gap-2.5" onClick={() => setViewCus(c)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <b className="text-sm text-slate-900 block truncate">{c.name}</b>
                        <span className="text-[11px] text-slate-500 block truncate">{c.contact || 'Commercial Dept'} · {c.phone}</span>
                      </div>
                      <Badge variant={owed > 0 ? 'blue' : 'green'}>
                        {owed > 0 ? t('Deni', 'Active') : t('Safi', 'Settled')}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{t('Deni:', 'Balance:')} <b className="font-mono text-slate-900">{tzs(owed)}</b></span>
                      <span className="font-mono text-slate-500">{util}% {t('ya kikomo', 'limit')}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full rounded-full ${util > 80 ? 'bg-rose-500' : 'bg-[#18b8b2]'}`} style={{ width: `${util}%` }} />
                    </div>
                  </div>
                )
              })}
          </div>

          {/* Desktop Customers Table */}
          <div className="hidden md:block data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('Namba & Kiwanda', 'Customer Code & Factory')}</th>
                  <th>{t('Mtu wa Mawasiliano', 'Primary Contact')}</th>
                  <th>{t('Mahali Kiwanda Kilipo', 'Physical Plant Location')}</th>
                  <th>{t('Ukomo wa Mkopo', 'Credit Limit')}</th>
                  <th>{t('Deni la Sasa', 'Current Balance Owed')}</th>
                  <th>{t('Matumizi ya Mkopo', 'Credit Utilization')}</th>
                  <th className="text-right">{t('Vitendo', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {s.customers.map(c => {
                  const owed = cusBal(s, c.id)
                  const limit = c.limit || 30000000
                  const util = Math.min(100, Math.round((owed / limit) * 100))
                  return (
                    <tr key={c.id}>
                      <td>
                        <b className="text-slate-900 block">{c.name}</b>
                        <small className="font-mono text-slate-400">{c.code || 'IND-0' + c.id.slice(1)}</small>
                      </td>
                      <td>
                        <span className="text-slate-800 block">{c.contact || 'Commercial Purchasing Dept'}</span>
                        <small className="text-slate-500 font-mono">{c.phone}</small>
                      </td>
                      <td>
                        <span className="text-slate-700 text-xs">{c.location || 'Lake Victoria Industrial Area'}</span>
                      </td>
                      <td>
                        <b className="font-mono text-slate-900">{tzs(limit)}</b>
                      </td>
                      <td>
                        <b className={`font-mono text-sm ${owed > 0 ? 'text-blue-800' : 'text-slate-400'}`}>
                          {tzs(owed)}
                        </b>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${util > 80 ? 'bg-rose-500' : 'bg-blue-600'}`}
                              style={{ width: `${util}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-slate-500">{util}%</span>
                        </div>
                      </td>
                      <td className="text-right">
                        <ViewBtn onClick={() => setViewCus(c)} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {viewSale && (() => {
        const cusObj = s.customers.find(c => c.id === viewSale.cus)
        const saleTotal = viewSale.kg * viewSale.price
        const balDue = saleTotal - viewSale.paid
        return (
          <DetailModal
            title={`${t('Maelezo ya Ankara ya Mauzo:', 'Sales Invoice Details:')} ${viewSale.no}`}
            subtitle={`${cusObj?.name || viewSale.cus} · ${viewSale.date}`}
            badge={
              <Badge variant={viewSale.dis.st === 'Delivered' ? 'green' : 'amber'}>
                {viewSale.dis.st === 'Delivered' ? t('Imefika Kiwandani', 'Delivered') : t('Iko Njiani', 'In transit')}
              </Badge>
            }
            onClose={() => setViewSale(null)}
            fields={[
              { label: t('Namba ya Ankara', 'Invoice Number'), value: viewSale.no, mono: true },
              { label: t('Tarehe', 'Date'), value: viewSale.date, mono: true },
              { label: t('Kiwanda / Mteja', 'Processing Factory'), value: cusObj?.name || viewSale.cus },
              { label: t('Mahali', 'Location'), value: cusObj?.location || 'Mwanza' },
              { label: t('Aina & Daraja la Samaki', 'Species & Grade'), value: `${spLabel(viewSale.sp)} (${t('Daraja', 'Grade')} ${viewSale.grade})` },
              { label: t('Uzito Uliosafirishwa', 'Dispatched Weight'), value: `${f(viewSale.kg)} kg`, mono: true },
              { label: t('Bei kwa Kilo', 'Unit Price'), value: tzs(viewSale.price), mono: true },
              { label: t('Jumla ya Ankara', 'Total Invoiced'), value: tzs(saleTotal), mono: true, highlight: true },
              { label: t('Kiasi Kilicholipwa', 'Paid Amount'), value: tzs(viewSale.paid), mono: true },
              { label: t('Salio la Deni', 'Balance Due'), value: tzs(balDue), mono: true, highlight: balDue > 0 },
              { label: t('Gari la Baridi', 'Refrigerated Vehicle'), value: viewSale.dis.veh || 'KYC Truck', mono: true },
              { label: t('Dereva', 'Driver'), value: viewSale.dis.drv || 'Assigned Driver' },
            ]}
            actions={
              <>
                <button
                  type="button"
                  onClick={() => {
                    const target = viewSale
                    setViewSale(null)
                    setInv(target)
                  }}
                  className="btn-secondary text-xs"
                >
                  <Printer size={13} /> {t('Chapa Ankara', 'Print Invoice')}
                </button>
                {balDue > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = viewSale
                      setViewSale(null)
                      setRc(target)
                      setAmt(String(balDue))
                    }}
                    className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-700"
                  >
                    <DollarSign size={13} /> {t('Pokea Malipo', 'Receive Payment')}
                  </button>
                )}
              </>
            }
          />
        )
      })()}

      {viewCus && (() => {
        const owed = cusBal(s, viewCus.id)
        const limit = viewCus.limit || 30000000
        const cusSales = s.sales.filter(x => x.cus === viewCus.id)
        const totalBoughtKg = cusSales.reduce((sum, x) => sum + x.kg, 0)
        const totalInvoiced = cusSales.reduce((sum, x) => sum + x.kg * x.price, 0)
        return (
          <DetailModal
            title={`${t('Akaunti ya Kiwanda:', 'Factory Account Details:')} ${viewCus.name}`}
            subtitle={`${viewCus.code || 'IND'} · ${viewCus.location || 'Mwanza'}`}
            badge={
              <Badge variant={owed > 0 ? 'amber' : 'green'}>
                {owed > 0 ? t('Inadaiwa Salio', 'Balance Due') : t('Akaunti Safi', 'Settled')}
              </Badge>
            }
            onClose={() => setViewCus(null)}
            fields={[
              { label: t('Jina la Kiwanda', 'Factory Name'), value: viewCus.name },
              { label: t('Namba ya Mteja', 'Customer Code'), value: viewCus.code || 'IND-0' + viewCus.id.slice(1), mono: true },
              { label: t('Mtu wa Mawasiliano', 'Primary Contact'), value: viewCus.contact || 'Commercial Purchasing Dept' },
              { label: t('Namba ya Simu', 'Phone Number'), value: viewCus.phone, mono: true },
              { label: t('Mahali Kiwanda Kilipo', 'Plant Location'), value: viewCus.location || 'Lake Victoria Industrial Area', fullWidth: true },
              { label: t('Ukomo wa Mkopo', 'Credit Limit'), value: tzs(limit), mono: true },
              { label: t('Deni la Sasa', 'Current Balance Owed'), value: tzs(owed), mono: true, highlight: true },
              { label: t('Jumla ya Samaki Walionunua', 'Total Fish Purchased'), value: `${f(totalBoughtKg)} kg (${cusSales.length} ${t('oda', 'orders')})`, mono: true },
              { label: t('Jumla ya Thamani ya Mauzo', 'Total Sales Value'), value: tzs(totalInvoiced), mono: true },
            ]}
          />
        )
      })()}

      {/* New Sales Order Modal */}
      {modalMode === 'sale' && (
        <Modal
          title={t('Unda Oda ya Mauzo & Noti ya Mzigo', 'Create Industry Sales Order & Delivery Note')}
          subtitle={t('Usafirishaji wa moja kwa moja kiwandani kutoka stoo ya baridi', 'Direct dispatch to fish-processing plant from available cold stock')}
          onClose={() => setModalMode(null)}
          maxWidth="max-w-xl"
        >
          <div className="flex flex-col gap-4">
            <Field label={t('Mteja / Kiwanda', 'Customer / Factory')}>
              <select
                value={cus}
                onChange={e => setD({ ...d, cus: e.target.value })}
                className="input-field"
              >
                {s.customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({t('Ukomo wa Mkopo', 'Credit Limit')}: {tzs(c.limit)})
                  </option>
                ))}
              </select>
            </Field>

            <Field label={t('Samaki & Daraja Waliopo Stoo ya Baridi', 'Fish Species & Grade Available In Cold Room')}>
              <select
                value={key}
                onChange={e => setD({ ...d, key: e.target.value })}
                className="input-field font-semibold"
              >
                {keys.map(k => {
                  const [kSp, kGr] = k.split('|')
                  return (
                    <option key={k} value={k}>
                      {spLabel(kSp)} · {t('Daraja', 'Grade')} {kGr} — {f(st[k])} kg {t('stoo', 'available in cold storage')}
                    </option>
                  )
                })}
              </select>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t('Kiasi cha Kuuza (kg)', 'Quantity to Sell (kg)')}>
                <input
                  type="number"
                  value={d.kg}
                  onChange={e => setD({ ...d, kg: e.target.value })}
                  max={av}
                  className="input-field font-mono font-bold"
                />
              </Field>
              <Field label={t('Bei kwa Kilo (TZS)', 'Agreed Price per kg (TZS)')}>
                <input
                  type="number"
                  value={d.price}
                  onChange={e => setD({ ...d, price: e.target.value })}
                  className="input-field font-mono font-bold"
                />
              </Field>
            </div>

            {/* Total Invoiced */}
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-blue-800 uppercase block font-semibold">{t('Jumla ya Ankara', 'Total Invoiced Amount')}</span>
                <span className="text-xl font-mono font-bold text-blue-950">{tzs(total)}</span>
              </div>
              <span className="text-xs text-blue-700">{t('Waliopo', 'Available')}: {f(av)} kg</span>
            </div>

            {over && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle size={16} /> {t('Ukomo wa mkopo kwa kiwanda hiki umezidi. Ongeza malipo ya awali.', 'Credit limit exceeded for this factory account. Increase deposit.')}
              </div>
            )}

            <Field label={t('Malipo ya Awali Yaliyopokelewa (TZS)', 'Initial Deposit / Payment Received (TZS)')}>
              <input
                type="number"
                value={d.paid}
                onChange={e => setD({ ...d, paid: e.target.value })}
                className="input-field font-mono font-bold"
              />
            </Field>

            <div className="flex justify-between items-center pt-2">
              <button type="button" onClick={() => setModalMode(null)} className="btn-secondary">
                {t('Ghairi', 'Cancel')}
              </button>
              <button
                type="button"
                disabled={!okS}
                onClick={handleSell}
                className="btn-primary bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 size={16} /> {t('Idhinisha Oda & Safirisha', 'Authorize Order & Dispatch')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Customer Modal */}
      {modalMode === 'cus' && (
        <Modal
          title={t('Ongeza Mteja Mpya wa Kiwanda', 'Add New Fish Processing Industry Client')}
          subtitle={t('Weka masharti ya mkopo na mahali pa kufikisha mzigo', 'Establish commercial credit terms and plant delivery details')}
          onClose={() => setModalMode(null)}
        >
          <div className="flex flex-col gap-4">
            <Field label={t('Jina la Kiwanda / Kampuni', 'Processing Plant / Company Name')}>
              <input
                type="text"
                placeholder={t('mf. Victoria Perch Processors Ltd', 'e.g. Victoria Perch Processors Ltd')}
                value={n.name}
                onChange={e => setN({ ...n, name: e.target.value })}
                className="input-field"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t('Mtu wa Mawasiliano', 'Plant Contact Person')}>
                <input
                  type="text"
                  placeholder={t('mf. Patrick Temba', 'e.g. Patrick Temba')}
                  value={n.contact}
                  onChange={e => setN({ ...n, contact: e.target.value })}
                  className="input-field"
                />
              </Field>
              <Field label={t('Namba ya Simu', 'Phone Number')}>
                <input
                  type="tel"
                  placeholder="028 250 110"
                  value={n.phone}
                  onChange={e => setN({ ...n, phone: e.target.value })}
                  className="input-field font-mono"
                />
              </Field>
            </div>

            <Field label={t('Mahali Kiwanda Kilipo', 'Plant Location / Delivery Gate')}>
              <input
                type="text"
                placeholder="Nyakato Industrial Area, Plot 42, Mwanza"
                value={n.location}
                onChange={e => setN({ ...n, location: e.target.value })}
                className="input-field"
              />
            </Field>

            <Field label={t('Ukomo wa Mkopo Ulioidhinishwa (TZS)', 'Approved Credit Limit (TZS)')}>
              <input
                type="number"
                value={n.limit}
                onChange={e => setN({ ...n, limit: e.target.value })}
                className="input-field font-mono font-bold"
              />
            </Field>

            <button
              type="button"
              disabled={!n.name}
              onClick={handleAddCus}
              className="btn-primary mt-2"
            >
              {t('Hifadhi Mteja wa Kiwanda', 'Save Factory Client')}
            </button>
          </div>
        </Modal>
      )}

      {/* Receive Payment Modal */}
      {rc && (
        <Modal
          title={t(`Pokea Malipo: ${rc.no}`, `Receive Payment: ${rc.no}`)}
          subtitle={t(`Mteja: ${s.customers.find(c => c.id === rc.cus)?.name}`, `Client: ${s.customers.find(c => c.id === rc.cus)?.name}`)}
          onClose={() => setRc(null)}
        >
          <div className="flex flex-col gap-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between text-xs">
              <span className="text-slate-500">{t('Jumla ya Ankara:', 'Invoice Total:')}</span>
              <b className="font-mono text-slate-900">{tzs(rc.kg * rc.price)}</b>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between text-xs">
              <span className="text-blue-800">{t('Salio Lililobaki:', 'Remaining Balance Due:')}</span>
              <b className="font-mono text-blue-950 font-bold">{tzs(rc.kg * rc.price - rc.paid)}</b>
            </div>
            <Field label={t('Malipo Yaliyopokelewa (TZS)', 'Payment Received (TZS)')}>
              <input
                type="number"
                value={amt}
                onChange={e => setAmt(e.target.value)}
                className="input-field font-mono text-lg font-bold"
              />
            </Field>
            <button
              type="button"
              disabled={!(+amt > 0 && +amt <= (rc.kg * rc.price - rc.paid))}
              onClick={handleReceivePay}
              className="btn-primary bg-emerald-600 hover:bg-emerald-700"
            >
              {t('Ingiza Malipo Kwenye Akaunti', 'Post Payment to Account')}
            </button>
          </div>
        </Modal>
      )}

      {/* Invoice Modal */}
      {inv && (
        <ReceiptModal
          title={t(`Ankara ya Mauzo: ${inv.no}`, `Commercial Sales Invoice: ${inv.no}`)}
          lines={[
            [t('Mteja', 'Customer'), s.customers.find(c => c.id === inv.cus)?.name || inv.cus],
            [t('Mahali pa Kufikisha', 'Delivery Destination'), s.customers.find(c => c.id === inv.cus)?.location || t('Lango la Kiwanda', 'Factory Gate')],
            [t('Samaki & Daraja', 'Fish Species & Grade'), `${spLabel(inv.sp)} (${t('Daraja', 'Grade')} ${inv.grade})`],
            [t('Uzito Halisi', 'Net Weight Delivered'), `${f(inv.kg)} kg`],
            [t('Bei ya Mkataba', 'Contract Price'), `@ ${tzs(inv.price)}/kg`],
            [t('Jumla ya Ankara', 'Gross Total Invoiced'), tzs(inv.kg * inv.price)],
            [t('Malipo ya Awali', 'Initial Payment Received'), tzs(inv.paid)],
            [t('Salio la Deni', 'Outstanding Receivable'), tzs(inv.kg * inv.price - inv.paid)],
            [t('Mizigo (FIFO)', 'Allocated Batches (FIFO)'), inv.alloc.map(l => s.batches.find(b => b.id === l.b)?.no).join(', ')]
          ]}
          onClose={() => setInv(null)}
        />
      )}
    </div>
  )
}
