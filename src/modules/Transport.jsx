import React, { useState, useEffect } from 'react'
import {
  Truck,
  MapPin,
  Thermometer,
  DollarSign,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  User
} from 'lucide-react'
import { useS, SITES, trCost, refLabel, nowL } from '../store'
import { useDevice } from '../device'
import { Modal, Field, Badge, DetailModal, ViewBtn, f, tzs, fmtT, atOf } from '../ui'

export default function Transport() {
  const { s, a, t, spLabel } = useS()
  const { lowBandwidthMode } = useDevice()
  const [tab, setTab] = useState('deliveries') // 'deliveries' or 'costs'
  const [dispatchOrder, setDispatchOrder] = useState(null)
  const [viewDispatch, setViewDispatch] = useState(null)
  const [viewTrip, setViewTrip] = useState(null)
  const [costModal, setCostModal] = useState(false)

  useEffect(() => {
    const onQuickAdd = e => {
      if (e.detail?.tab !== 'transport') return
      setCostModal(true)
    }
    window.addEventListener('aquacatch:quick-add', onQuickAdd)
    return () => window.removeEventListener('aquacatch:quick-add', onQuickAdd)
  }, [])
  const [dispForm, setDispForm] = useState({ veh: 'T 342 EDK (KYC 3-Ton Refrigerated)', drv: 'Juma Ramadhani', st: 'In transit', temp: '1.8°C' })
  const [costForm, setCostForm] = useState({
    type: 'Industry Delivery',
    mode: 'KYC Refrigerated Truck',
    from: s.wh?.[0] || 'Main Cold Room (0°C to 2°C)',
    to: s.customers?.[0]?.name || 'Nyakato Processing Plant',
    ref: '',
    species: '',
    kg: '',
    pricePerKg: '',
    cost: '180000',
    veh: 'T 342 EDK',
    temp: '1.5°C',
    method: 'CRDB / NMB Bank',
    notes: ''
  })

  const trips = s.trips || []
  const totalTrCost = trCost(s)
  const totalKg = s.batches.reduce((t, b) => t + b.kg, 0)
  const costPerKg = totalKg ? Math.round(totalTrCost / totalKg) : 0

  const handleSaveDispatch = () => {
    if (!dispatchOrder) return
    a.dispatch(dispatchOrder.id, dispForm)
    setDispatchOrder(null)
  }

  const handleSaveCost = () => {
    const kgNum = +costForm.kg || 0
    const rateNum = +costForm.pricePerKg || 0
    const computedCost = +costForm.cost || (kgNum > 0 && rateNum > 0 ? kgNum * rateNum : 0)
    a.addTrip({
      ...costForm,
      kg: kgNum,
      pricePerKg: rateNum || (kgNum > 0 && computedCost > 0 ? Math.round(computedCost / kgNum) : 0),
      cost: computedCost,
      date: nowL().slice(0, 10),
      at: nowL()
    })
    setCostModal(false)
  }

  return (
    <div className="page-body">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 m-0">{t('Usafiri wa Baridi na Usambazaji', 'Refrigerated Transport & Delivery Logistics')}</h2>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            {t('Ufuatiliaji wa magari ya baridi (KYC), joto safarini, na hati za usafirishaji.', 'Cold chain vehicle monitoring (KYC light trucks & insulated carriers), temperature logging, and dispatch notes.')}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <button onClick={() => setCostModal(true)} className="btn-primary">
            <Plus size={16} /> {t('Rekodi Safari / Gharama ya Usafiri', 'Log Transport Run / Trip Cost')}
          </button>
        </div>
      </div>

      {/* Visual Cold Chain Fleet Header */}
      <div className="panel p-0 overflow-hidden flex flex-col md:flex-row items-center border border-slate-200">
        {!lowBandwidthMode && (
          <div className="hidden md:block w-full md:w-56 h-28 shrink-0 bg-slate-900 relative">
            <img
              src="/photos/refrigerated-truck.png"
              alt="Refrigerated Truck Loading"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-1.5 left-1.5 bg-slate-950/80 text-amber-300 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold backdrop-blur-sm">
              KYC COLD FLEET
            </span>
          </div>
        )}
        <div className="p-3.5 flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 m-0">Insulated Transport Fleet (Pier to Factory Gate)</h3>
            <p className="text-xs text-slate-500 m-0 mt-0.5">
              Tanzanian registration plates (T 342 EDK, T 819 DXZ) with continuous temperature compliance tracking and freight cost apportionment.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5 whitespace-nowrap self-start sm:self-auto shrink-0">
            <CheckCircle2 size={14} className="text-emerald-600" /> Active Fleet GPS &amp; Chill Logged
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap">
            <Truck size={22} />
          </div>
          <div className="kpi-content">
            <small>{t('Gharama Yote ya Usafiri', 'Total Transport Spend')}</small>
            <b>{tzs(totalTrCost)}</b>
            <span className="kpi-sub">{t('Sehemu ya gharama ya mzigo', 'Landed cost component')}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap amber">
            <DollarSign size={22} />
          </div>
          <div className="kpi-content">
            <small>{t('Gharama kwa Kilo', 'Freight Cost per Kg')}</small>
            <b>{tzs(costPerKg)} <span className="text-xs font-sans text-slate-400">/kg</span></b>
            <span className="kpi-sub">{t('Wastani wa safari zote', 'Average across trips')}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap green">
            <CheckCircle2 size={22} />
          </div>
          <div className="kpi-content">
            <small>{t('Mizigo Iliyofika', 'Dispatched Deliveries')}</small>
            <b>{s.sales.filter(x => x.dis.st === 'Delivered').length} <span className="text-xs font-sans text-slate-400">{t('imefika', 'completed')}</span></b>
            <span className="kpi-sub">{s.sales.filter(x => x.dis.st !== 'Delivered').length} {t('iko njiani', 'in transit')}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap purple">
            <Thermometer size={22} />
          </div>
          <div className="kpi-content">
            <small>{t('Joto la Baridi Safarini', 'Cold Chain Transit Temp')}</small>
            <b>1.5°C</b>
            <span className="kpi-sub text-emerald-600 font-semibold">{t('Baridi inafanya kazi', 'Active cooling active')}</span>
          </div>
        </div>
      </div>

      {/* Mobile Pill Tab Switcher (< md) */}
      <div className="flex md:hidden items-center gap-2 bg-slate-200/80 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => setTab('deliveries')}
          className={`flex-1 min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            tab === 'deliveries' ? 'bg-[#052d56] text-white shadow-sm' : 'text-slate-600'
          }`}
        >
          {t('Usafirishaji', 'Dispatches')} ({s.sales.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('costs')}
          className={`flex-1 min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            tab === 'costs' ? 'bg-[#052d56] text-white shadow-sm' : 'text-slate-600'
          }`}
        >
          {t('Gharama za Safari', 'Trip Costs')} ({trips.length})
        </button>
      </div>

      {/* Real KYC Cold Chain Vehicle Showcase & Live Dispatches */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${tab !== 'deliveries' ? 'hidden md:grid' : ''}`}>
        {/* Real Vehicle Asset Showcase (desktop) */}
        <div className="hidden lg:flex panel lg:col-span-1 p-0 overflow-hidden">
          {!lowBandwidthMode && (
            <div className="relative h-44 bg-slate-900">
              <img
                src="/assets/aistudio/image_eec00c9e.png"
                alt={t('Gari la Baridi Mwaloni', 'KYC Refrigerated Truck loading fish at pier')}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover opacity-75"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent p-4 flex flex-col justify-end">
                <span className="text-[11px] font-mono text-sky-400 uppercase tracking-wider">{t('Magari ya Kampuni', 'Fleet Asset')}</span>
                <h4 className="text-base font-bold text-white m-0">{t('Magari ya Baridi ya KYC', 'KYC Light Refrigerated Carriers')}</h4>
              </div>
            </div>
          )}
          <div className="p-4 flex flex-col gap-2.5 text-xs text-slate-600">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">{t('Aina ya Magari:', 'Fleet Standard:')}</span>
              <b className="text-slate-800">{t('Magari ya Baridi Tani 1–3', '1 to 3 Ton Insulated Box Trucks')}</b>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">{t('Magari Yaliyopo:', 'Active Fleet:')}</span>
              <b className="text-slate-800 font-mono">T 342 EDK, T 819 DXZ</b>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">{t('Joto Linalotakiwa:', 'Target Core Temp:')}</span>
              <b className="text-emerald-700 font-mono">0.0°C – 2.5°C</b>
            </div>
            <p className="text-[11px] text-slate-500 m-0 pt-1">
              {t('Hutunza ubora wa samaki kuanzia mialo ya Mwanza na Kigoma hadi viwandani.', 'Maintains seafood freshness from landing beaches in Mwanza & Kigoma to factory loading bays.')}
            </p>
          </div>
        </div>

        {/* Deliveries & Dispatches */}
        <div className="panel lg:col-span-2">
          <div className="panel-header">
            <div>
              <h3>{t('Mizigo ya Viwandani & Magari', 'Factory Shipments & Vehicle Assignments')}</h3>
              <p>{t('Usafirishaji kwenda ABC Fish Processing, Victoria Perch na wateja wa nje', 'Delivery dispatches to ABC Fish Processing, Victoria Perch & Export clients')}</p>
            </div>
          </div>

          {/* Mobile Dispatches Cards (< md) */}
          <div className="md:hidden flex flex-col gap-2.5">
            {[...s.sales].reverse().map(y => {
              const cusName = s.customers.find(z => z.id === y.cus)?.name || y.cus
              return (
                <div key={y.id} className="mobile-card flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <b className="text-sm text-slate-900 block truncate">{cusName}</b>
                      <span className="text-[11px] font-mono text-blue-700">{y.no} · {y.date}</span>
                    </div>
                    <Badge variant={y.dis.st === 'Delivered' ? 'green' : 'amber'}>
                      {y.dis.st === 'Delivered' ? t('Imefika', 'Delivered') : t('Iko Njiani', 'In transit')}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 rounded-xl p-2 border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block">{t('Samaki & Uzito', 'Cargo')}</span>
                      <b className="text-slate-900">{spLabel(y.sp)} · <span className="font-mono">{f(y.kg)} kg</span></b>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">{t('Gari & Dereva', 'Vehicle')}</span>
                      <b className="text-slate-800 block truncate">{y.dis.veh || 'T 342 EDK'}</b>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ViewBtn onClick={() => setViewDispatch({ ...y, cusName })} />
                    <button
                      type="button"
                      onClick={() => {
                        setDispatchOrder(y)
                        setDispForm({
                          veh: y.dis.veh || 'T 342 EDK (KYC 3-Ton Refrigerated)',
                          drv: y.dis.drv || 'Juma Ramadhani',
                          st: y.dis.st || 'In transit',
                          temp: '1.8°C'
                        })
                      }}
                      className="btn-primary flex-1 text-xs bg-[#052d56]"
                    >
                      {t('Sasisha Hali', 'Update Status')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="hidden md:block data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('Oda / Mzigo', 'Order / Dispatch')}</th>
                  <th>{t('Kiwanda', 'Factory Client')}</th>
                  <th>{t('Uzito', 'Dispatched Weight')}</th>
                  <th>{t('Gari & Dereva', 'Carrier & Driver')}</th>
                  <th>{t('Hali', 'Status')}</th>
                  <th className="text-right">{t('Kitendo', 'Action')}</th>
                </tr>
              </thead>
              <tbody>
                {[...s.sales].reverse().map(y => {
                  const cusName = s.customers.find(z => z.id === y.cus)?.name || y.cus
                  return (
                    <tr key={y.id}>
                      <td>
                        <b className="font-mono text-blue-700">{y.no}</b>
                        <small className="block font-mono text-slate-400">{y.date}</small>
                      </td>
                      <td>
                        <b className="text-slate-900 block">{cusName}</b>
                        <small className="text-slate-500">{spLabel(y.sp)} · {t('Daraja', 'Grade')} {y.grade}</small>
                      </td>
                      <td>
                        <b className="font-mono text-slate-900">{f(y.kg)} kg</b>
                      </td>
                      <td>
                        <span className="text-slate-800 block text-xs font-semibold">{y.dis.veh || 'T 342 EDK (KYC Truck)'}</span>
                        <small className="text-slate-500">{y.dis.drv || 'Driver Assigned'}</small>
                      </td>
                      <td>
                        <Badge variant={y.dis.st === 'Delivered' ? 'green' : 'amber'}>
                          {y.dis.st === 'Delivered' ? t('Imefika', 'Delivered') : t('Iko Njiani', 'In transit')}
                        </Badge>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <ViewBtn onClick={() => setViewDispatch({ ...y, cusName })} />
                          <button
                            onClick={() => {
                              setDispatchOrder(y)
                              setDispForm({
                                veh: y.dis.veh || 'T 342 EDK (KYC 3-Ton Refrigerated)',
                                drv: y.dis.drv || 'Juma Ramadhani',
                                st: y.dis.st || 'In transit',
                                temp: '1.8°C'
                              })
                            }}
                            className="btn-secondary text-xs px-2.5 py-1"
                          >
                            {t('Sasisha Hali', 'Update Status')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Transport Runs & Ledger */}
      <div className={`panel p-0 overflow-hidden ${tab !== 'costs' ? 'hidden md:flex' : ''}`}>
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 m-0">{t('Daftari la Gharama za Safari', 'Transport Trip Cost Journal')}</h3>
          <p className="text-xs text-slate-500 m-0">{t('Gharama za usafiri zinazoingia kwenye hesabu ya gharama ya mzigo', 'Freight expenses apportioned into landed cost calculation per batch')}</p>
        </div>

        {/* Mobile Trip Costs Cards (< md) */}
        <div className="md:hidden p-3 flex flex-col gap-2.5 bg-slate-50/50">
          {trips.map(tr => (
            <div key={tr.id} className="mobile-card flex flex-col gap-2" onClick={() => setViewTrip(tr)}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <b className="text-sm text-slate-900 block truncate">{tr.from} → {tr.to}</b>
                  <span className="text-[11px] font-mono text-slate-500">{refLabel(s, tr)} · {tr.veh || 'Fleet Truck'}</span>
                </div>
                <b className="font-mono text-sm text-slate-900 shrink-0 tabular-nums">{tzs(tr.cost)}</b>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                <Badge variant="blue">{tr.type}</Badge>
                <span className="font-mono text-[11px] text-slate-500">{fmtT(atOf(tr))}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:block data-table-wrap border-0 rounded-none">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('Njia (Kutoka → Kwenda)', 'Route (From → To)')}</th>
                <th>{t('Aina ya Safari', 'Run Type')}</th>
                <th>{t('Mzigo & Uzito', 'Cargo & Weight')}</th>
                <th>{t('Gari & Usafiri', 'Vehicle & Mode')}</th>
                <th>{t('Gharama (TZS)', 'Trip Cost (TZS)')}</th>
                <th>{t('Njia ya Malipo', 'Payment Channel')}</th>
                <th>{t('Tarehe & Muda', 'Date & Time')}</th>
                <th className="text-right">{t('Vitendo', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {trips.map(tr => (
                <tr key={tr.id}>
                  <td>
                    <b className="text-slate-900 block">{tr.from} &rarr; {tr.to}</b>
                    <small className="font-mono text-slate-400">{refLabel(s, tr)}</small>
                  </td>
                  <td>
                    <Badge variant="blue">{tr.type}</Badge>
                  </td>
                  <td>
                    <span className="text-slate-800 font-medium block">
                      {tr.species ? spLabel(tr.species) : refLabel(s, tr)}
                    </span>
                    <small className="font-mono text-slate-500">
                      {+tr.kg > 0 ? `${f(tr.kg)} kg` : '—'}
                      {+tr.pricePerKg > 0 ? ` · ${tzs(tr.pricePerKg)}/kg` : ''}
                    </small>
                  </td>
                  <td>
                    <span className="text-slate-800 font-medium block">{tr.mode}</span>
                    <small className="font-mono text-slate-400">{tr.veh || 'Fleet Truck'}</small>
                  </td>
                  <td>
                    <b className="font-mono text-slate-900 text-sm">{tzs(tr.cost)}</b>
                  </td>
                  <td>
                    <span className="text-xs text-slate-600">{tr.method || 'Bank Transfer'}</span>
                  </td>
                  <td>
                    <span className="font-mono text-xs text-slate-500">{fmtT(atOf(tr))}</span>
                  </td>
                  <td className="text-right">
                    <ViewBtn onClick={() => setViewTrip(tr)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewDispatch && (
        <DetailModal
          title={`${t('Maelezo ya Usafirishaji:', 'Dispatch Details:')} ${viewDispatch.no}`}
          subtitle={`${viewDispatch.cusName} · ${viewDispatch.date}`}
          badge={
            <Badge variant={viewDispatch.dis.st === 'Delivered' ? 'green' : 'amber'}>
              {viewDispatch.dis.st === 'Delivered' ? t('Imefika Kiwandani', 'Delivered') : t('Iko Njiani', 'In transit')}
            </Badge>
          }
          onClose={() => setViewDispatch(null)}
          fields={[
            { label: t('Namba ya Oda', 'Order Number'), value: viewDispatch.no, mono: true },
            { label: t('Kiwanda / Mteja', 'Factory Client'), value: viewDispatch.cusName },
            { label: t('Aina & Daraja la Samaki', 'Species & Grade'), value: `${spLabel(viewDispatch.sp)} (${t('Daraja', 'Grade')} ${viewDispatch.grade})` },
            { label: t('Uzito Uliosafirishwa', 'Dispatched Weight'), value: `${f(viewDispatch.kg)} kg`, mono: true, highlight: true },
            { label: t('Gari la Baridi', 'Refrigerated Vehicle'), value: viewDispatch.dis.veh || 'T 342 EDK (KYC Truck)', mono: true },
            { label: t('Dereva', 'Driver'), value: viewDispatch.dis.drv || 'Driver Assigned' },
            { label: t('Joto la Chumba cha Baridi', 'Cold Box Temp'), value: viewDispatch.dis.temp || '1.8°C', mono: true },
            { label: t('Tarehe', 'Date'), value: viewDispatch.date, mono: true },
          ]}
          actions={
            <button
              type="button"
              onClick={() => {
                const target = viewDispatch
                setViewDispatch(null)
                setDispatchOrder(target)
                setDispForm({
                  veh: target.dis.veh || 'T 342 EDK (KYC 3-Ton Refrigerated)',
                  drv: target.dis.drv || 'Juma Ramadhani',
                  st: target.dis.st || 'In transit',
                  temp: '1.8°C'
                })
              }}
              className="btn-primary text-xs"
            >
              {t('Sasisha Hali ya Usafiri', 'Update Dispatch Status')}
            </button>
          }
        />
      )}

      {viewTrip && (
        <DetailModal
          title={`${t('Maelezo ya Safari ya Usafiri', 'Transport Trip Details')}`}
          subtitle={`${viewTrip.from} → ${viewTrip.to}`}
          badge={<Badge variant="blue">{viewTrip.type}</Badge>}
          onClose={() => setViewTrip(null)}
          fields={[
            { label: t('Kutoka', 'Origin'), value: viewTrip.from },
            { label: t('Kwenda', 'Destination'), value: viewTrip.to },
            { label: t('Aina ya Safari', 'Run Type'), value: viewTrip.type },
            { label: t('Mzigo / Kumbukumbu', 'Batch / Reference'), value: refLabel(s, viewTrip), mono: true },
            { label: t('Aina ya Samaki / Mzigo', 'Cargo / Species'), value: viewTrip.species ? spLabel(viewTrip.species) : '—' },
            { label: t('Uzito (Kg)', 'Quantity / Weight (Kg)'), value: +viewTrip.kg > 0 ? `${f(viewTrip.kg)} kg` : '—', mono: true },
            { label: t('Bei kwa Kilo', 'Rate per Kg'), value: +viewTrip.pricePerKg > 0 ? `${tzs(viewTrip.pricePerKg)}/kg` : '—', mono: true },
            { label: t('Aina ya Usafiri', 'Transport Mode'), value: viewTrip.mode },
            { label: t('Namba ya Gari / Boti', 'Vehicle / Boat Reg'), value: viewTrip.veh || 'Fleet Truck', mono: true },
            { label: t('Joto Safarini', 'Transit Temp'), value: viewTrip.temp || '—', mono: true },
            { label: t('Gharama ya Safari', 'Trip Cost'), value: tzs(viewTrip.cost), mono: true, highlight: true },
            { label: t('Njia ya Malipo', 'Payment Channel'), value: viewTrip.method || 'CRDB / NMB Bank' },
            ...(viewTrip.notes ? [{ label: t('Maelezo', 'Notes'), value: viewTrip.notes }] : []),
            { label: t('Tarehe & Muda', 'Date & Time'), value: fmtT(atOf(viewTrip)), mono: true },
          ]}
        />
      )}

      {/* Dispatch Modal */}
      {dispatchOrder && (
        <Modal
          title={t(`Sasisha Hali ya Usafirishaji: ${dispatchOrder.no}`, `Update Dispatch Status: ${dispatchOrder.no}`)}
          subtitle={t(`Mteja: ${s.customers.find(z => z.id === dispatchOrder.cus)?.name}`, `Client: ${s.customers.find(z => z.id === dispatchOrder.cus)?.name}`)}
          onClose={() => setDispatchOrder(null)}
        >
          <div className="flex flex-col gap-4">
            <Field label={t('Namba ya Gari / Aina', 'Vehicle Registration / Carrier Model')}>
              <input
                type="text"
                value={dispForm.veh}
                onChange={e => setDispForm({ ...dispForm, veh: e.target.value })}
                className="input-field"
              />
            </Field>

            <Field label={t('Jina la Dereva & Simu', 'Driver Name & Contact')}>
              <input
                type="text"
                value={dispForm.drv}
                onChange={e => setDispForm({ ...dispForm, drv: e.target.value })}
                className="input-field"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t('Joto Safarini', 'Transit Temperature')}>
                <input
                  type="text"
                  value={dispForm.temp}
                  onChange={e => setDispForm({ ...dispForm, temp: e.target.value })}
                  className="input-field font-mono"
                />
              </Field>
              <Field label={t('Hali ya Usafirishaji', 'Delivery Status')}>
                <select
                  value={dispForm.st}
                  onChange={e => setDispForm({ ...dispForm, st: e.target.value })}
                  className="input-field"
                >
                  <option value="Loading at Chiller">{t('Inapakia kwenye Chumba cha Baridi', 'Loading at Chiller')}</option>
                  <option value="In transit">{t('Iko Njiani', 'In transit')}</option>
                  <option value="Delivered">{t('Imefika Kiwandani', 'Delivered')}</option>
                </select>
              </Field>
            </div>

            <button
              type="button"
              onClick={handleSaveDispatch}
              className="btn-primary bg-emerald-600 hover:bg-emerald-700 mt-2"
            >
              {t('Hifadhi Taarifa za Usafirishaji', 'Save Dispatch Details')}
            </button>
          </div>
        </Modal>
      )}

      {/* Log Transport Cost Modal */}
      {costModal && (
        <Modal
          title={t('Rekodi Gharama ya Usafiri wa Baridi', 'Log Cold Chain Transport Expense')}
          subtitle={t('Rekodi nauli ya safari kwa ajili ya hesabu ya gharama za mzigo', 'Record trip freight for inclusion in landed cost accounting')}
          onClose={() => setCostModal(false)}
        >
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t('Aina ya Safari', 'Trip Category')}>
                <select
                  value={costForm.type}
                  onChange={e => setCostForm({ ...costForm, type: e.target.value })}
                  className="input-field"
                >
                  <option value="Industry Delivery">{t('Usafirishaji Kiwandani', 'Industry Delivery (To Processing Plant)')}</option>
                  <option value="Landing Collection">{t('Ukusanyaji Mwaloni → Chumba cha Baridi', 'Landing Collection (Landing Site → Cold Room)')}</option>
                  <option value="Inter-Branch Transfer">{t('Uhamisho Kati ya Matawi', 'Inter-Branch Transfer')}</option>
                </select>
              </Field>
              <Field label={t('Aina ya Usafiri', 'Transport Mode')}>
                <select
                  value={costForm.mode}
                  onChange={e => setCostForm({ ...costForm, mode: e.target.value })}
                  className="input-field"
                >
                  <option value="KYC Refrigerated Truck">{t('Gari la Baridi (KYC Truck)', 'KYC Refrigerated Truck')}</option>
                  <option value="Insulated Van">{t('Gari la Baridi Dogo (Van)', 'Insulated Van')}</option>
                  <option value="Boat / Ferry">{t('Boti / Feri', 'Boat / Ferry')}</option>
                  <option value="Hired Truck">{t('Gari la Kukodi', 'Hired Truck')}</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t('Mzigo / Oda Husika', 'Batch / Sale Reference')}>
                <select
                  value={costForm.ref}
                  onChange={e => {
                    const refId = e.target.value
                    const batch = (s.batches || []).find(b => b.id === refId)
                    const sale = (s.sales || []).find(x => x.id === refId)
                    const picked = batch || sale
                    const nextKg = picked?.kg ? String(picked.kg) : costForm.kg
                    const nextRate = +costForm.pricePerKg || 0
                    const nextCost = (+nextKg > 0 && nextRate > 0) ? String(Math.round(+nextKg * nextRate)) : costForm.cost
                    setCostForm({
                      ...costForm,
                      ref: refId,
                      species: picked?.sp || costForm.species,
                      kg: nextKg,
                      cost: nextCost,
                    })
                  }}
                  className="input-field"
                >
                  <option value="">{t('— Chagua Mzigo / Oda (Hiari) —', '— Select Batch / Sale (Optional) —')}</option>
                  {(s.batches || []).map(b => (
                    <option key={b.id} value={b.id}>
                      {b.no} · {spLabel(b.sp)} ({f(b.kg)} kg)
                    </option>
                  ))}
                  {(s.sales || []).map(x => (
                    <option key={x.id} value={x.id}>
                      {x.no} · {spLabel(x.sp)} ({f(x.kg)} kg)
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('Aina ya Samaki / Mzigo', 'Cargo / Fish Type')}>
                <input
                  type="text"
                  placeholder={t('k.m. Sangara / Sato / Dagaa', 'e.g. Nile Perch / Tilapia')}
                  value={costForm.species}
                  onChange={e => setCostForm({ ...costForm, species: e.target.value })}
                  className="input-field"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t('Mahali pa Kuanzia', 'Origin Location')}>
                <input
                  type="text"
                  value={costForm.from}
                  onChange={e => setCostForm({ ...costForm, from: e.target.value })}
                  className="input-field"
                />
              </Field>
              <Field label={t('Mahali pa Kwenda', 'Destination')}>
                <input
                  type="text"
                  value={costForm.to}
                  onChange={e => setCostForm({ ...costForm, to: e.target.value })}
                  className="input-field"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t('Namba ya Gari / Boti', 'Vehicle / Boat Reg')}>
                <input
                  type="text"
                  placeholder="T 342 EDK"
                  value={costForm.veh}
                  onChange={e => setCostForm({ ...costForm, veh: e.target.value })}
                  className="input-field font-mono"
                />
              </Field>
              <Field label={t('Joto Safarini', 'Transit Temperature')}>
                <input
                  type="text"
                  placeholder="1.5°C"
                  value={costForm.temp}
                  onChange={e => setCostForm({ ...costForm, temp: e.target.value })}
                  className="input-field font-mono"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t('Uzito / Kiasi (Kg)', 'Quantity / Weight (Kg)')}>
                <input
                  type="number"
                  placeholder="0"
                  value={costForm.kg}
                  onChange={e => {
                    const nextKg = e.target.value
                    const rate = +costForm.pricePerKg || 0
                    const nextCost = (+nextKg > 0 && rate > 0) ? String(Math.round(+nextKg * rate)) : costForm.cost
                    setCostForm({ ...costForm, kg: nextKg, cost: nextCost })
                  }}
                  className="input-field font-mono"
                />
              </Field>
              <Field label={t('Bei kwa Kilo (TZS/kg)', 'Rate per Kg (TZS/kg)')}>
                <input
                  type="number"
                  placeholder="0"
                  value={costForm.pricePerKg}
                  onChange={e => {
                    const nextRate = e.target.value
                    const kgVal = +costForm.kg || 0
                    const nextCost = (kgVal > 0 && +nextRate > 0) ? String(Math.round(kgVal * +nextRate)) : costForm.cost
                    setCostForm({ ...costForm, pricePerKg: nextRate, cost: nextCost })
                  }}
                  className="input-field font-mono"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t('Gharama ya Safari (TZS)', 'Trip Expense Amount (TZS)')}>
                <input
                  type="number"
                  value={costForm.cost}
                  onChange={e => setCostForm({ ...costForm, cost: e.target.value })}
                  className="input-field font-mono font-bold"
                />
              </Field>
              <Field label={t('Njia ya Malipo', 'Payment Method')}>
                <select
                  value={costForm.method}
                  onChange={e => setCostForm({ ...costForm, method: e.target.value })}
                  className="input-field"
                >
                  <option value="CRDB / NMB Bank">CRDB / NMB Bank</option>
                  <option value="M-Pesa (Mobile Money)">M-Pesa (Mobile Money)</option>
                  <option value="Cash Voucher">{t('Pesa Taslimu', 'Cash Voucher')}</option>
                </select>
              </Field>
            </div>

            <Field label={t('Maelezo ya Ziada', 'Notes (Optional)')}>
              <input
                type="text"
                placeholder={t('Maelezo ya mzigo au safari...', 'Cargo or route notes...')}
                value={costForm.notes}
                onChange={e => setCostForm({ ...costForm, notes: e.target.value })}
                className="input-field"
              />
            </Field>

            <button
              type="button"
              disabled={!(+costForm.cost > 0)}
              onClick={handleSaveCost}
              className="btn-primary mt-2"
            >
              {t('Hifadhi Gharama ya Usafiri', 'Record Transport Expense')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
