import React, { useState } from 'react'
import {
  Scale,
  Plus,
  Search,
  CheckCircle2,
  Share2,
  Printer,
  QrCode,
  ShieldCheck,
  Calendar,
  DollarSign,
  User,
  ArrowRight,
  RefreshCw,
  Clock,
  Ship,
  Compass
} from 'lucide-react'
import { useS, SPECIES, SITES, tot, batchNet, batchDeduction, supPurchaseStatus, payStatusOf, supFuelDebt, supMaintDebt, nowL } from '../store'
import {
  Modal,
  Field,
  Badge,
  ScaleTerminal,
  ReceiptModal,
  TraceabilityModal,
  FishPhoto,
  DetailModal,
  ViewBtn,
  f,
  tzs,
  fmtT,
  atOf
} from '../ui'

const init = {
  sourceType: 'independent', // 'company_managed' | 'independent' | 'business_supplier' | 'trader'
  boatId: '',
  fishermanId: '',
  fishermanName: '',
  sup: '',
  sp: SPECIES[0],
  grade: 'A',
  kg: '350',
  price: '8000',
  site: '',
  payMode: 'full',
  paid: '',
  method: 'M-Pesa (Mobile Money)',
  manual: false,
  when: '',
  deductFuel: true,
  fuelDeduction: '',
  deductMaint: true,
  maintDeduction: ''
}

const emptySup = { name: '', phone: '', site: '', cat: 'Individual Fisherman', boat: '' }

export default function Buy() {
  const { s, a, t, spLabel } = useS()
  const [open, setOpen] = useState(false)
  const [rc, setRc] = useState(null)
  const [traceBatch, setTraceBatch] = useState(null)
  const [viewPurchase, setViewPurchase] = useState(null)
  const [step, setStep] = useState(0)
  const [d, setD] = useState(init)
  const [search, setSearch] = useState('')
  const [filterSp, setFilterSp] = useState('All')
  const [addingSup, setAddingSup] = useState(false)
  const [newSup, setNewSup] = useState(emptySup)
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState(null)

  const isCompany = d.sourceType === 'company_managed'
  const total = (+d.kg || 0) * (+d.price || 0)
  const sup = d.sup
  const sx = s.suppliers.find(x => x.id === sup)

  const activeFuelDebt = sup ? supFuelDebt(s, sup) : 0
  const activeMaintDebt = sup ? supMaintDebt(s, sup) : 0

  const fuelOff = (!isCompany && d.deductFuel) ? Math.min(activeFuelDebt, +d.fuelDeduction || activeFuelDebt, total) : 0
  const maintOff = (!isCompany && d.deductMaint)
    ? Math.min(activeMaintDebt, +d.maintDeduction || activeMaintDebt, Math.max(0, total - fuelOff))
    : 0
  const totalOffset = fuelOff + maintOff
  const netEarnings = isCompany ? 0 : Math.max(0, total - totalOffset)
  const requestedPaid = isCompany
    ? (+d.paid || 0)
    : (d.payMode === 'full' ? netEarnings : d.payMode === 'partial' ? +d.paid || 0 : 0)
  const paidNow = isCompany ? requestedPaid : Math.min(Math.max(0, requestedPaid), netEarnings)
  const outstanding = isCompany ? 0 : Math.max(0, netEarnings - paidNow)
  const payStatus = isCompany ? 'internal_catch' : payStatusOf(netEarnings, paidNow)
  const ok2 = +d.kg > 0 && +d.price > 0 && !(d.manual && (!d.when || d.when > nowL()))
  const canSave = isCompany
    ? (ok2 && (d.boatId || (s.boats && s.boats.length > 0)))
    : (!!sup && !addingSup && ok2 && (d.payMode !== 'partial' || (+d.paid > 0 && +d.paid <= netEarnings)))

  const registerSup = () => {
    if (!newSup.name.trim() || !newSup.phone.trim()) return
    const id = a.addSup({
      name: newSup.name.trim(),
      phone: newSup.phone.trim(),
      site: newSup.site,
      cat: newSup.cat,
      boat: newSup.boat.trim()
    })
    setD(prev => ({ ...prev, sup: id }))
    setAddingSup(false)
    setNewSup(emptySup)
  }

  const save = async () => {
    if (!canSave || saving) return
    setSaving(true)
    setSaveErr(null)
    try {
      const at = d.manual && d.when ? d.when : nowL()
      await a.buy({
        at,
        date: at.slice(0, 10),
        manual: !!(d.manual && d.when),
        sup: isCompany ? (sup || 'sup_internal_fleet') : sup,
        sp: d.sp,
        grade: d.grade,
        kg: +d.kg,
        price: +d.price,
        paid: isCompany ? (+d.paid || 0) : paidNow,
        method: d.method,
        fuelDeducted: isCompany ? 0 : fuelOff,
        maintDeducted: isCompany ? 0 : maintOff,
        site: (d.site && d.site.trim()) || sx?.site || 'Kirumba Mwaloni',
        sourceType: d.sourceType,
        boatId: d.boatId,
        fishermanId: d.fishermanId,
        fishermanName: d.fishermanName,
      })
      setOpen(false)
      setStep(0)
      setD(init)
      setAddingSup(false)
      setNewSup(emptySup)
    } catch (err) {
      setSaveErr(err?.message || t('Hitilafu ya mtandao, jaribu tena', 'Network error — please try again'))
    } finally {
      setSaving(false)
    }
  }

  // Per-purchase settlement status (FIFO for untagged payments)
  const payRows = {}
  s.suppliers.forEach(supx => {
    supPurchaseStatus(s, supx.id).forEach(r => {
      payRows[r.batch.id] = r
    })
  })

  // Filtered batches
  const batches = [...s.batches].reverse().filter(b => {
    const supName = s.suppliers.find(x => x.id === b.sup)?.name || ''
    const matchSearch =
      b.pur.toLowerCase().includes(search.toLowerCase()) ||
      b.no.toLowerCase().includes(search.toLowerCase()) ||
      b.sp.toLowerCase().includes(search.toLowerCase()) ||
      supName.toLowerCase().includes(search.toLowerCase())
    const matchSp = filterSp === 'All' || b.sp === filterSp
    return matchSearch && matchSp
  })

  return (
    <div className="page-body">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 m-0">{t('Manunuzi ya Samaki na Mizani', 'Fish Purchasing & Weighing')}</h2>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            {t('Rekodi samaki kutoka kwa wavuvi, unganisha mizani ya kidijitali, na toa risiti.', 'Capture catches from fishermen, connect digital scales, and issue verified purchase vouchers.')}
          </p>
        </div>
        <button
          onClick={() => {
            setD({ ...init, sup: s.suppliers[0]?.id || '' })
            setAddingSup(false)
            setNewSup(emptySup)
            setOpen(true)
          }}
          className="btn-primary"
        >
          <Plus size={16} /> {t('Manunuzi Mapya', 'New Fish Purchase')} (<span className="text-xs font-mono">&lt; 1 min</span>)
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t('Tafuta kwa namba ya manunuzi, mzigo, mvuvi, au aina ya samaki...', 'Search by purchase #, batch #, supplier, or species...')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10 text-xs"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['All', ...SPECIES].map(sp => (
            <button
              key={sp}
              onClick={() => setFilterSp(sp)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
                filterSp === sp
                  ? 'bg-blue-900 text-white border-blue-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {sp === 'All' ? t('Wote', 'All') : spLabel(sp)}
            </button>
          ))}
        </div>
      </div>

      {/* Purchases Data Table */}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('Manunuzi na Mzigo', 'Purchase & Batch')}</th>
              <th>{t('Aina ya Samaki', 'Fish Species')}</th>
              <th>{t('Mvuvi / BMU', 'Supplier / BMU')}</th>
              <th>{t('Uzito na Bei', 'Weight & Price')}</th>
              <th>{t('Jumla ya Fedha', 'Total Amount')}</th>
              <th>{t('Muda', 'Timestamp')}</th>
              <th>{t('Malipo', 'Payment')}</th>
              <th>{t('Hali', 'Status')}</th>
              <th className="text-right">{t('Vitendo', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {batches.map(b => {
              const supObj = s.suppliers.find(x => x.id === b.sup)
              const row = payRows[b.id] || {
                net: batchNet(s, b),
                paid: +b.paid || 0,
                balance: Math.max(0, batchNet(s, b) - (+b.paid || 0)),
                status: b.payStatus || 'unpaid'
              }
              return (
                <tr key={b.id}>
                  <td>
                    <b className="font-mono text-blue-700">{b.pur}</b>
                    <small className="block font-mono text-slate-400">{b.no}</small>
                  </td>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <FishPhoto sp={b.sp} size={36} />
                      <div>
                        <span className="font-bold text-slate-900 block">{spLabel(b.sp)}</span>
                        <small className="text-slate-500 font-mono">{t('Daraja', 'Grade')} {b.grade}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="font-medium text-slate-800 block">{supObj?.name || b.sup}</span>
                    <small className="text-slate-400">{b.site}</small>
                  </td>
                  <td>
                    <b className="font-mono text-slate-900">{f(b.kg)} kg</b>
                    <small className="block text-slate-400 font-mono">@ {tzs(b.price)}/kg</small>
                  </td>
                  <td>
                    <b className="font-mono text-slate-900">{tzs(tot(b))}</b>
                    <small className="block font-mono text-slate-500">
                      {t('Halisi', 'Net')}: {tzs(row.net)}
                    </small>
                  </td>
                  <td>
                    <span className="text-xs text-slate-600 font-mono">{fmtT(atOf(b))}</span>
                  </td>
                  <td>
                    <Badge variant={row.status === 'paid' ? 'green' : row.status === 'partial' ? 'amber' : 'red'}>
                      {row.status === 'paid' ? t('Imelipwa', 'Paid') : row.status === 'partial' ? t('Kiasi', 'Partial') : t('Haijalipwa', 'Unpaid')}
                    </Badge>
                    <small className={`block font-mono mt-0.5 ${row.balance > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {t('Salio', 'Bal')}: {tzs(row.balance)}
                    </small>
                  </td>
                  <td>
                    <Badge variant={b.st === 'accepted' ? 'green' : b.st === 'rejected' ? 'red' : 'amber'}>
                      {b.st === 'accepted' ? t('Imekubaliwa', 'Accepted') : b.st === 'rejected' ? t('Imekataliwa', 'Rejected') : t('Inasubiri Ukaguzi', 'Pending QC')}
                    </Badge>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <ViewBtn onClick={() => setViewPurchase(b)} />
                      <button
                        onClick={() => setTraceBatch(b)}
                        title={t('Ufuatiliaji wa QR', 'Traceability Chain & QR')}
                        className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                      >
                        <QrCode size={16} />
                      </button>
                      <button
                        onClick={() => setRc(b)}
                        title={t('Chapa Risiti', 'View & Print Voucher')}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                      >
                        <Printer size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {viewPurchase && (() => {
        const supObj = s.suppliers.find(x => x.id === viewPurchase.sup)
        const row = supPurchaseStatus(s, viewPurchase.sup).find(r => r.batch.id === viewPurchase.id)
        const ded = batchDeduction(s, viewPurchase)
        const net = row ? row.net : batchNet(s, viewPurchase)
        const paidToDate = row ? row.paid : +viewPurchase.paid || 0
        const purchaseBal = row ? row.balance : Math.max(0, net - paidToDate)
        const pStatus = row ? row.status : viewPurchase.payStatus || 'unpaid'
        return (
          <DetailModal
            title={`${t('Maelezo ya Manunuzi:', 'Purchase Details:')} ${viewPurchase.pur}`}
            subtitle={`${viewPurchase.no} · ${spLabel(viewPurchase.sp)} · ${viewPurchase.site}`}
            badge={
              <Badge variant={viewPurchase.st === 'accepted' ? 'green' : viewPurchase.st === 'rejected' ? 'red' : 'amber'}>
                {viewPurchase.st === 'accepted' ? t('Imekubaliwa', 'Accepted') : viewPurchase.st === 'rejected' ? t('Imekataliwa', 'Rejected') : t('Inasubiri Ukaguzi', 'Pending QC')}
              </Badge>
            }
            onClose={() => setViewPurchase(null)}
            fields={[
              { label: t('Namba ya Manunuzi', 'Purchase ID'), value: viewPurchase.pur, mono: true },
              { label: t('Namba ya Mzigo', 'Batch Code'), value: viewPurchase.no, mono: true },
              { label: t('Aina & Daraja', 'Species & Grade'), value: `${spLabel(viewPurchase.sp)} (${t('Daraja', 'Grade')} ${viewPurchase.grade})` },
              { label: t('Mvuvi / BMU', 'Fisherman / BMU'), value: supObj?.name || viewPurchase.sup },
              { label: t('Mwalo', 'Landing Station'), value: viewPurchase.site },
              { label: t('Ghala la Baridi', 'Cold Room'), value: viewPurchase.wh || 'Mwanza Main Cold Room' },
              { label: t('Uzito wa Samaki', 'Weight'), value: `${f(viewPurchase.kg)} kg (${viewPurchase.crates || Math.round(viewPurchase.kg / 40)} ${t('kreti', 'crates')})`, mono: true },
              { label: t('Bei kwa Kilo', 'Unit Price'), value: tzs(viewPurchase.price), mono: true },
              { label: t('Jumla ya Thamani', 'Gross Catch Value'), value: tzs(tot(viewPurchase)), mono: true },
              { label: t('Makato ya Deni', 'Credit Deductions'), value: tzs(ded), mono: true },
              { label: t('Thamani Halisi', 'Net Payable'), value: tzs(net), mono: true, highlight: true },
              { label: t('Iliyolipwa Hadi Sasa', 'Paid to Date'), value: tzs(paidToDate), mono: true },
              { label: t('Salio la Manunuzi', 'Purchase Balance'), value: tzs(purchaseBal), mono: true, highlight: true },
              { label: t('Hali ya Malipo', 'Payment Status'), value: pStatus === 'paid' ? t('Imelipwa', 'Paid') : pStatus === 'partial' ? t('Kiasi', 'Partially Paid') : t('Haijalipwa', 'Unpaid') },
              { label: t('Stoo Iliyobaki', 'Remaining Stock'), value: `${f(viewPurchase.rem ?? viewPurchase.kg)} kg`, mono: true },
              { label: t('Joto la Kupokelea', 'Reception Temp'), value: `${viewPurchase.temp || 2.1}°C`, mono: true },
              { label: t('Tarehe & Muda', 'Timestamp'), value: fmtT(atOf(viewPurchase)), mono: true },
            ]}
            actions={
              <>
                <button
                  type="button"
                  onClick={() => {
                    const b = viewPurchase
                    setViewPurchase(null)
                    setRc(b)
                  }}
                  className="btn-primary text-xs"
                >
                  <Printer size={13} /> {t('Fungua Risiti', 'Open Voucher')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const b = viewPurchase
                    setViewPurchase(null)
                    setTraceBatch(b)
                  }}
                  className="btn-secondary text-xs"
                >
                  <QrCode size={13} /> {t('Ufuatiliaji wa QR', 'QR Traceability')}
                </button>
              </>
            }
          />
        )
      })()}

      {/* New Purchase Modal Dialog */}
      {open && (
        <Modal
          title={t('Rekodi Manunuzi & Upimaji wa Samaki', 'Record Fish Purchase & Weighing')}
          subtitle={t('Utaratibu wa Kupokea Samaki Mwaloni', 'Tanzania Lake Victoria Landing Protocol')}
          onClose={() => {
            setOpen(false)
            setStep(0)
            setAddingSup(false)
            setNewSup(emptySup)
          }}
          maxWidth="max-w-2xl"
        >
          {/* Progress Steps */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs">
            {[
              t('1. Mvuvi & Mizani', '1. Fisherman & Scale'),
              t('2. Aina & Daraja', '2. Species & Grading'),
              t('3. Risiti & Malipo', '3. Voucher & Payment')
            ].map((title, i) => (
              <span
                key={title}
                className={`font-semibold ${i === step ? 'text-blue-700' : i < step ? 'text-emerald-600' : 'text-slate-400'}`}
              >
                {title}
              </span>
            ))}
          </div>

          {step === 0 && (
            <div className="flex flex-col gap-4">
              {/* Electronic Scale Simulator (Panasonic Model matching dock photo) */}
              <ScaleTerminal
                weight={d.kg}
                onTare={() => setD({ ...d, kg: '0.0' })}
                onSimulateWeigh={() => {
                  const simulated = (250 + Math.random() * 450).toFixed(1)
                  setD({ ...d, kg: simulated })
                }}
              />

              {/* Source Classification Toggle */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  {t('Nani Anayeleta Samaki? (Aina ya Chanzo)', 'Who is supplying the fish? (Source Classification)')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const firstBoat = s.boats?.[0]
                      setD(prev => ({
                        ...prev,
                        sourceType: 'company_managed',
                        boatId: prev.boatId || firstBoat?.id || '',
                        fishermanName: prev.fishermanName || firstBoat?.captain || '',
                      }))
                    }}
                    className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-all ${
                      isCompany
                        ? 'border-blue-600 bg-blue-50/80 ring-1 ring-blue-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <Ship size={18} className={isCompany ? 'text-blue-600' : 'text-slate-400'} />
                    <div>
                      <b className={`text-xs block ${isCompany ? 'text-blue-900' : 'text-slate-800'}`}>
                        {t('01 · Mavuno ya Kampuni', '01 · Company Catch')}
                      </b>
                      <span className="text-[10px] text-slate-500">{t('Boti na mabaharia wa kampuni', 'Company vessels & crew')}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setD(prev => ({
                        ...prev,
                        sourceType: 'independent',
                      }))
                    }}
                    className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-all ${
                      !isCompany
                        ? 'border-blue-600 bg-blue-50/80 ring-1 ring-blue-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <User size={18} className={!isCompany ? 'text-blue-600' : 'text-slate-400'} />
                    <div>
                      <b className={`text-xs block ${!isCompany ? 'text-blue-900' : 'text-slate-800'}`}>
                        {t('02 · Ununuzi wa Mzabuni', '02 · External Purchase')}
                      </b>
                      <span className="text-[10px] text-slate-500">{t('Mvuvi huru / Kampuni / Dalali', 'Independent fisher / Company / Trader')}</span>
                    </div>
                  </button>
                </div>
              </div>

              {isCompany ? (
                <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl flex flex-col gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                    <Ship size={14} /> {t('Taarifa za Chombo & Nahodha wa Kampuni', 'Company Vessel & Crew Info')}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label={t('Chagua Boti ya Kampuni', 'Select Company Boat')}>
                      <select
                        value={d.boatId}
                        onChange={e => {
                          const bid = e.target.value
                          const bObj = s.boats?.find(b => b.id === bid)
                          setD(prev => ({
                            ...prev,
                            boatId: bid,
                            fishermanName: bObj?.captain || prev.fishermanName,
                          }))
                        }}
                        className="input-field"
                      >
                        {(!s.boats || s.boats.length === 0) && (
                          <option value="">{t('MV Furaha (Boti ya Kampuni)', 'MV Furaha (Default Company Boat)')}</option>
                        )}
                        {(s.boats || []).map(b => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.code || b.regNo || 'Boti'})
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label={t('Nahodha / Mvuvi Aliyetua Mzigo', 'Captain / Crew Leader')}>
                      <input
                        type="text"
                        placeholder={t('mf. Juma Ramadhani (Nahodha)', 'e.g. Juma Ramadhani (Captain)')}
                        value={d.fishermanName}
                        onChange={e => setD({ ...d, fishermanName: e.target.value })}
                        className="input-field"
                      />
                    </Field>
                  </div>
                </div>
              ) : (
                <>
                  <Field label={t('Mvuvi / Mzabuni / BMU', 'Supplier / Fisherman / BMU')} hint={t('Chagua aliyesajiliwa au sajili mpya papo hapo', 'Select a registered supplier or register one inline')}>
                    <select
                      value={addingSup ? '__new__' : sup || ''}
                      onChange={e => {
                        const v = e.target.value
                        if (v === '__new__') {
                          setAddingSup(true)
                          setD({ ...d, sup: '' })
                        } else {
                          setAddingSup(false)
                          setD({ ...d, sup: v })
                        }
                      }}
                      className="input-field"
                    >
                      {!sup && !addingSup && <option value="">{t('-- Chagua Mvuvi --', '-- Select Supplier --')}</option>}
                      {s.suppliers.map(x => {
                        const extra = x.no || x.phone || x.cat || ''
                        return (
                          <option key={x.id} value={x.id}>
                            {x.name}{extra ? ` (${extra})` : ''}{x.site ? ` · ${x.site}` : ''}
                          </option>
                        )
                      })}
                      <option value="__new__">+ {t('Sajili Mvuvi / Mzabuni Mpya', 'Register New Supplier')}</option>
                    </select>
                  </Field>

                  {addingSup && (
                    <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <b className="text-xs text-emerald-950">{t('Sajili Mvuvi Mpya Bila Kuondoka', 'Register New Supplier Inline')}</b>
                        <button
                          type="button"
                          onClick={() => {
                            setAddingSup(false)
                            setNewSup(emptySup)
                            if (!d.sup && s.suppliers[0]) setD({ ...d, sup: s.suppliers[0].id })
                          }}
                          className="text-xs text-slate-500 hover:text-slate-800"
                        >
                          {t('Ghairi', 'Cancel')}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label={t('Jina Kamili', 'Full Name')}>
                          <input
                            type="text"
                            value={newSup.name}
                            onChange={e => setNewSup({ ...newSup, name: e.target.value })}
                            placeholder={t('Mfano: Juma Hamisi', 'e.g. Juma Hamisi')}
                            className="input-field"
                          />
                        </Field>
                        <Field label={t('Namba ya Simu', 'Phone Number')}>
                          <input
                            type="tel"
                            value={newSup.phone}
                            onChange={e => setNewSup({ ...newSup, phone: e.target.value })}
                            placeholder="+255 7XX XXX XXX"
                            className="input-field font-mono"
                          />
                        </Field>
                        <Field label={t('Mwalo / Eneo la Kupakulia', 'Landing Station / Area')}>
                          <input
                            type="text"
                            value={newSup.site}
                            onChange={e => setNewSup({ ...newSup, site: e.target.value })}
                            placeholder={t('Weka jina la eneo au mwalo...', 'Enter landing site or area...')}
                            list="buy-new-sup-sites"
                            className="input-field"
                          />
                          <datalist id="buy-new-sup-sites">
                            {SITES.map(site => <option key={site} value={site} />)}
                          </datalist>
                        </Field>
                        <Field label={t('Kundi', 'Category')}>
                          <select
                            value={newSup.cat}
                            onChange={e => setNewSup({ ...newSup, cat: e.target.value })}
                            className="input-field"
                          >
                            <option value="Individual Fisherman">{t('Mvuvi Binafsi', 'Individual Fisherman')}</option>
                            <option value="BMU Fishing Group">{t('Kikundi cha BMU', 'BMU Fishing Group')}</option>
                            <option value="Fish Trader">{t('Mfanyabiashara wa Samaki', 'Fish Trader')}</option>
                          </select>
                        </Field>
                      </div>
                      <button
                        type="button"
                        onClick={registerSup}
                        disabled={!newSup.name.trim() || !newSup.phone.trim()}
                        className="btn-primary bg-emerald-600 hover:bg-emerald-700 self-start text-xs"
                      >
                        <Plus size={14} /> {t('Sajili & Tumia Mvuvi Huyu', 'Register & Use This Supplier')}
                      </button>
                    </div>
                  )}

                  {sup && (
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                      <Badge variant="blue">{sx?.name}</Badge>
                      <span>{sx?.phone}</span>
                      <span>· {sx?.site}</span>
                      {supFuelDebt(s, sup) > 0 && <Badge variant="amber">{t('Deni la Mafuta', 'Fuel Debt')}: {tzs(supFuelDebt(s, sup))}</Badge>}
                      {supMaintDebt(s, sup) > 0 && <Badge variant="amber">{t('Deni la Matengenezo', 'Maintenance Debt')}: {tzs(supMaintDebt(s, sup))}</Badge>}
                    </div>
                  )}
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Field label={t('Uzito Halisi wa Samaki (kg)', 'Net Fish Weight (kg)')}>
                  <input
                    type="number"
                    step="0.1"
                    value={d.kg}
                    onChange={e => setD({ ...d, kg: e.target.value })}
                    className="input-field font-mono text-base font-bold text-slate-900"
                  />
                </Field>
                <Field label={t('Mwalo / Eneo la Kupakulia', 'Landing Site / Area')}>
                  <input
                    type="text"
                    value={d.site !== '' ? d.site : (sx?.site || '')}
                    onChange={e => setD({ ...d, site: e.target.value })}
                    placeholder={t('Weka au chagua eneo la kupakulia...', 'Enter or choose landing site/area...')}
                    list="buy-landing-sites"
                    className="input-field font-semibold"
                  />
                  <datalist id="buy-landing-sites">
                    {SITES.map(site => <option key={site} value={site} />)}
                    {Array.from(new Set(s.suppliers.map(x => x.site).filter(Boolean))).map(site => (
                      <option key={site} value={site} />
                    ))}
                  </datalist>
                </Field>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={!(+d.kg > 0) || !sup || addingSup}
                  className="btn-primary"
                >
                  {t('Endelea: Aina & Bei', 'Continue to Species & Pricing')} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-4">
              <Field label={t('Chagua Aina ya Samaki', 'Fish Species Selection')}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {SPECIES.map(x => (
                    <button
                      key={x}
                      type="button"
                      onClick={() => {
                        const defaults = {
                          'Nile Perch': 8000,
                          'Tilapia': 5200,
                          'Dagaa (Sardines)': 2600,
                          'Catfish': 4500
                        }
                        setD({ ...d, sp: x, price: String(defaults[x] || 7000) })
                      }}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition text-center ${
                        d.sp === x
                          ? 'border-blue-700 bg-blue-50/70 text-blue-950 font-bold shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <FishPhoto sp={x} size={54} />
                      <span className="text-xs leading-tight">{spLabel(x)}</span>
                    </button>
                  ))}
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label={t('Daraja la Ubora', 'Quality Classification')}>
                  <select
                    value={d.grade}
                    onChange={e => setD({ ...d, grade: e.target.value })}
                    className="input-field"
                  >
                    <option value="A">{t('Daraja A (Kuuza Nje / Bora Zaidi)', 'Grade A (Export / Prime)')}</option>
                    <option value="B">{t('Daraja B (Uchakataji wa Ndani)', 'Grade B (Local Processing)')}</option>
                    <option value="C">{t('Daraja C (Kukausha / Moshi)', 'Grade C (Smoke / Dry)')}</option>
                  </select>
                </Field>
                <Field label={t('Bei kwa Kilo (TZS)', 'Price per kg (TZS)')}>
                  <input
                    type="number"
                    value={d.price}
                    onChange={e => setD({ ...d, price: e.target.value })}
                    className="input-field font-mono font-bold"
                  />
                </Field>
              </div>

              {/* Calculated Total Bar */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-blue-800 uppercase tracking-wider block font-semibold">
                    {t('Jumla ya Hesabu', 'Calculated Total')} ({f(d.kg)} kg × TZS {f(d.price)})
                  </span>
                  <span className="text-xl font-bold font-mono text-blue-950">{tzs(total)}</span>
                </div>
                <Badge variant="blue">{t('Mzigo', 'Batch')}: BATCH-{String(s.batches.length + 1).padStart(3, '0')}</Badge>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button type="button" onClick={() => setStep(0)} className="btn-secondary">
                  {t('Rudi', 'Back')}
                </button>
                <button type="button" onClick={() => setStep(2)} className="btn-primary">
                  {t('Kagua & Lipa', 'Review & Issue Payment')} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2 text-xs">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">{t('Chanzo cha Samaki:', 'Fish Source:')}</span>
                  <b className="text-slate-900">
                    {isCompany
                      ? `${t('01 · Mavuno ya Kampuni: ', '01 · Company Fleet: ')}${s.boats?.find(b => b.id === d.boatId)?.name || 'MV Furaha'}`
                      : `${sx?.name} (${sx?.site})`}
                  </b>
                </div>
                {isCompany && d.fishermanName && (
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">{t('Nahodha / Mvuvi:', 'Captain / Fisher:')}</span>
                    <b className="text-slate-900">{d.fishermanName}</b>
                  </div>
                )}
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">{t('Samaki & Daraja:', 'Fish & Grade:')}</span>
                  <b className="text-slate-900">{spLabel(d.sp)} · {t('Daraja', 'Grade')} {d.grade}</b>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">{t('Uzito Jumla:', 'Gross Quantity:')}</span>
                  <b className="font-mono text-slate-900">{f(d.kg)} kg</b>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1">
                  <span>{isCompany ? t('Thamani ya Uzalishaji:', 'Catch Valuation:') : t('Thamani ya Manunuzi:', 'Gross Catch Purchase Value:')}</span>
                  <span className="font-mono text-slate-900">{tzs(total)}</span>
                </div>
              </div>

              {isCompany ? (
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex flex-col gap-2.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-blue-950">
                    <Ship size={15} />
                    <span>{t('Mapokezi ya Mavuno ya Ndani (Company-managed Catch)', 'Internal Company Harvest Protocol')}</span>
                  </div>
                  <p className="text-[11px] text-blue-900 m-0">
                    {t(
                      'Samaki wanaingizwa moja kwa moja kwenye stoo ya ghala. Hakuna deni la mzabuni linalotengenezwa, gharama za boti, mafuta na vibarua hurekodiwa kupitia vitabu vya boti.',
                      'Fish is added directly to cold room stock. Zero accounts payable generated; vessel expenses, fuel and crew advances are managed via fleet ledgers.'
                    )}
                  </p>
                  <div className="pt-2 border-t border-blue-200 flex flex-col gap-2">
                    <Field label={t('Posho ya Safari / Gawio la Baharia (Hiari)', 'Crew Landing Allowance / Cash Voucher (Optional)')}>
                      <input
                        type="number"
                        placeholder="0"
                        value={d.paid}
                        onChange={e => setD({ ...d, paid: e.target.value })}
                        className="input-field font-mono font-bold"
                      />
                    </Field>
                  </div>
                </div>
              ) : (
                <>
                  {/* Automatic Fisherman Credit Recovery (Fuel & Maintenance) */}
                  {(activeFuelDebt > 0 || activeMaintDebt > 0) && (
                    <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex flex-col gap-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-amber-950">
                          <span>{t('Makato ya Deni la Mvuvi', 'Fisherman Credit Settlement (Catch Deduction)')}</span>
                        </div>
                        <Badge variant="amber">{t('Makato Moja kwa Moja', 'Auto-offset')}</Badge>
                      </div>
                      <span className="text-[11px] text-amber-800">
                        {t('Mvuvi ana deni la mafuta au matengenezo ya boti. Makato yataingizwa kwenye taarifa yake.', 'The fisherman has outstanding fuel credit and/or boat repair debt. Deductions will be logged into their account statement without double-counting.')}
                      </span>

                      {activeFuelDebt > 0 && (
                        <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-amber-200">
                          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                            <input
                              type="checkbox"
                              checked={d.deductFuel}
                              onChange={e => setD({ ...d, deductFuel: e.target.checked })}
                              className="rounded text-blue-900 focus:ring-blue-900"
                            />
                            <span>{t('Kata Deni la Mafuta (Salio: ', 'Deduct Outstanding Fuel Debt (Balance: ')}{tzs(activeFuelDebt)})</span>
                          </label>
                          <b className="font-mono text-red-600 font-bold">-{tzs(fuelOff)}</b>
                        </div>
                      )}

                      {activeMaintDebt > 0 && (
                        <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-amber-200">
                          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                            <input
                              type="checkbox"
                              checked={d.deductMaint}
                              onChange={e => setD({ ...d, deductMaint: e.target.checked })}
                              className="rounded text-blue-900 focus:ring-blue-900"
                            />
                            <span>{t('Kata Deni la Matengenezo ya Boti (Salio: ', 'Deduct Boat Maintenance Advance (Balance: ')}{tzs(activeMaintDebt)})</span>
                          </label>
                          <b className="font-mono text-amber-700 font-bold">-{tzs(maintOff)}</b>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-1 border-t border-amber-200 font-bold text-slate-900">
                        <span>{t('Malipo Halisi kwa Mvuvi (Baada ya Makato):', 'Net Catch Payment (After Credit Clear):')}</span>
                        <span className="text-base font-mono text-emerald-700">{tzs(netEarnings)}</span>
                      </div>
                    </div>
                  )}

                  <Field label={t('Hali ya Malipo ya Manunuzi', 'Purchase Payment Mode')}>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'full', sw: 'Malipo Yote', en: 'Full Payment' },
                        { id: 'partial', sw: 'Malipo Kiasi', en: 'Partial Payment' },
                        { id: 'unpaid', sw: 'Haijalipwa', en: 'Unpaid (On Account)' }
                      ].map(mode => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setD({ ...d, payMode: mode.id, paid: mode.id === 'full' ? String(netEarnings) : d.paid })}
                          className={`px-2 py-2 rounded-lg border text-xs font-semibold transition ${
                            d.payMode === mode.id
                              ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {t(mode.sw, mode.en)}
                        </button>
                      ))}
                    </div>
                  </Field>

                  {d.payMode === 'partial' && (
                    <Field
                      label={t('Kiasi Kinacholipwa Sasa (TZS)', 'Amount Paying Now (TZS)')}
                      hint={t(`Kati ya 1 na ${tzs(netEarnings)}`, `Between 1 and ${tzs(netEarnings)}`)}
                    >
                      <input
                        type="number"
                        value={d.paid}
                        onChange={e => setD({ ...d, paid: e.target.value })}
                        max={netEarnings}
                        className="input-field font-mono font-bold"
                      />
                      {+d.paid > netEarnings && (
                        <span className="text-[11px] text-rose-600 font-semibold">
                          {t('Kiasi kinazidi malipo halisi.', 'Amount exceeds the net payable.')}
                        </span>
                      )}
                    </Field>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <small className="text-slate-500 block">{t('Malipo Halisi', 'Net Payable')}</small>
                      <b className="font-mono text-slate-900">{tzs(netEarnings)}</b>
                    </div>
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <small className="text-emerald-700 block">{t('Analipwa Sasa', 'Paying Now')}</small>
                      <b className="font-mono text-emerald-800">{tzs(paidNow)}</b>
                    </div>
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg">
                      <small className="text-rose-700 block">{t('Salio la Manunuzi', 'Purchase Balance')}</small>
                      <b className="font-mono text-rose-700">{tzs(outstanding)}</b>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{t('Hali ya malipo:', 'Payment status:')}</span>
                    <Badge variant={payStatus === 'paid' ? 'green' : payStatus === 'partial' ? 'amber' : 'red'}>
                      {payStatus === 'paid' ? t('Imelipwa Yote', 'Paid in Full') : payStatus === 'partial' ? t('Imelipwa Kiasi', 'Partially Paid') : t('Haijalipwa', 'Unpaid')}
                    </Badge>
                  </div>
                </>
              )}

              {paidNow > 0 ? (
                <Field label={t('Njia ya Malipo', 'Payment Disbursement Method')}>
                  <select
                    value={d.method}
                    onChange={e => setD({ ...d, method: e.target.value })}
                    className="input-field"
                  >
                    <option>M-Pesa (Mobile Money)</option>
                    <option>Airtel Money</option>
                    <option>Tigo Pesa</option>
                    <option>{t('Pesa Taslimu', 'Cash Voucher')}</option>
                    <option>{t('Benki (CRDB/NMB)', 'Bank Transfer (CRDB/NMB)')}</option>
                  </select>
                </Field>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                  {t('Hakuna malipo ya papo hapo. Salio lote litaingizwa kwenye akaunti ya mvuvi kama deni.', 'No cash disbursement now. The full amount will be posted to the supplier account as outstanding debt.')}
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                  {t('Rudi', 'Back')}
                </button>
                {saveErr && (
                  <p className="text-xs text-red-600 font-medium flex-1 text-right">{saveErr}</p>
                )}
                <button
                  type="button"
                  onClick={save}
                  disabled={!canSave || saving}
                  className="btn-primary bg-emerald-600 hover:bg-emerald-700"
                >
                  {saving
                    ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> {t('Inahifadhi…', 'Saving…')}</>
                    : <><CheckCircle2 size={16} /> {t('Kamilisha & Hifadhi Manunuzi', 'Complete & Save Purchase')}</>
                  }
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Voucher / Receipt Modal */}
      {rc && (() => {
        const row = supPurchaseStatus(s, rc.sup).find(r => r.batch.id === rc.id)
        const ded = batchDeduction(s, rc)
        const net = row ? row.net : batchNet(s, rc)
        const paidToDate = row ? row.paid : +rc.paid || 0
        const purchaseBal = row ? row.balance : Math.max(0, net - paidToDate)
        const pStatus = row ? row.status : rc.payStatus || 'unpaid'
        return (
          <ReceiptModal
            title={t(`Risiti ya Manunuzi ${rc.pur}`, `Purchase Voucher ${rc.pur}`)}
            lines={[
              [t('Namba ya Manunuzi', 'Purchase ID'), rc.pur],
              [t('Namba ya Mzigo', 'Batch ID'), rc.no],
              [t('Mvuvi / Mzabuni', 'Supplier'), s.suppliers.find(x => x.id === rc.sup)?.name || rc.sup],
              [t('Mwalo', 'Landing Site'), rc.site],
              [t('Samaki & Daraja', 'Species & Grade'), `${spLabel(rc.sp)} (${t('Daraja', 'Grade')} ${rc.grade})`],
              [t('Uzito Uliopimwa', 'Verified Weight'), `${f(rc.kg)} kg`],
              [t('Bei kwa Kilo', 'Unit Price'), `@ ${tzs(rc.price)}/kg`],
              [t('Jumla ya Fedha', 'Gross Catch Value'), tzs(tot(rc))],
              [t('Makato ya Deni', 'Credit Deductions'), tzs(ded)],
              [t('Thamani Halisi', 'Net Payable'), tzs(net)],
              [t('Iliyolipwa Hadi Sasa', 'Paid to Date'), tzs(paidToDate)],
              [t('Salio la Manunuzi', 'Purchase Balance'), tzs(purchaseBal)],
              [t('Hali ya Malipo', 'Payment Status'), pStatus === 'paid' ? t('Imelipwa', 'Paid') : pStatus === 'partial' ? t('Kiasi', 'Partially Paid') : t('Haijalipwa', 'Unpaid')],
              [t('Muda', 'Timestamp'), fmtT(atOf(rc))]
            ]}
            onClose={() => setRc(null)}
          />
        )
      })()}

      {/* Traceability Modal */}
      {traceBatch && (
        <TraceabilityModal batch={traceBatch} onClose={() => setTraceBatch(null)} />
      )}
    </div>
  )
}
