import React, { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  CheckCircle2,
  Printer,
  QrCode,
  ArrowRight,
  ArrowLeft,
  Ship,
  User,
  Check,
  Edit3
} from 'lucide-react'
import { useS, SPECIES, SITES, tot, batchNet, batchDeduction, supPurchaseStatus, payStatusOf, supFuelDebt, supMaintDebt, nowL, today } from '../store'
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
  sourceType: 'independent',
  boatId: '',
  fishermanId: '',
  fishermanName: '',
  sup: '',
  sp: SPECIES[0],
  grade: 'A',
  kg: '350',
  price: '8000',
  site: '',
  purchaseDate: '',
  payMode: 'full',
  paid: '',
  method: 'M-Pesa (Mobile Money)',
  manual: false,
  when: '',
  deductFuel: true,
  fuelDeduction: '',
  deductMaint: true,
  maintDeduction: '',
  // Step 3 (QC) state
  temp: '2.1',
  qcFresh: true,
  qcTempOk: true,
  qcNoSpoilage: true,
  qcUniformity: false,
  qcNotes: 'Good quality, accepted.',
  qcApproveOnSave: true,
}

const emptySup = { name: '', phone: '', site: '', cat: 'Individual Fisherman', boat: '' }

export default function Buy() {
  const { s, a, t, spLabel } = useS()
  const [open, setOpen] = useState(false)
  const [rc, setRc] = useState(null)
  const [traceBatch, setTraceBatch] = useState(null)
  const [viewPurchase, setViewPurchase] = useState(null)
  const [step, setStep] = useState(0)
  const [d, setD] = useState(() => ({ ...init, purchaseDate: today() }))
  const [search, setSearch] = useState('')
  const [filterSp, setFilterSp] = useState('All')
  const [addingSup, setAddingSup] = useState(false)
  const [newSup, setNewSup] = useState(emptySup)
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState(null)

  const startNewPurchase = () => {
    setD({ ...init, sup: s.suppliers[0]?.id || '', purchaseDate: today() })
    setStep(0)
    setAddingSup(false)
    setNewSup(emptySup)
    setSaveErr(null)
    setOpen(true)
  }

  useEffect(() => {
    const onQuickAdd = e => {
      if (e.detail?.tab === 'buy') startNewPurchase()
    }
    window.addEventListener('aquacatch:quick-add', onQuickAdd)
    return () => window.removeEventListener('aquacatch:quick-add', onQuickAdd)
  }, [s.suppliers])

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
  const okStep1 = isCompany
    ? (!!(d.boatId || (s.boats && s.boats.length > 0)) && +d.price > 0)
    : (!!sup && !addingSup && +d.price > 0)
  const okWeigh = +d.kg > 0 && !(d.manual && (!d.when || d.when > nowL()))
  const canSave = okStep1 && okWeigh && (isCompany || d.payMode !== 'partial' || (+d.paid > 0 && +d.paid <= netEarnings))

  const registerSup = async () => {
    if (!newSup.name.trim() || !newSup.phone.trim()) return
    const id = await a.addSup({
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
      const res = await a.buy({
        at,
        date: d.purchaseDate || at.slice(0, 10),
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
        notes: d.qcNotes || '',
      })

      let savedBatch = res?.batch || null
      if (savedBatch?.id && d.qcApproveOnSave && d.qcNoSpoilage) {
        try {
          await a.inspect(savedBatch.id, +d.kg, +d.temp || 2.1, d.qcNotes || '')
          savedBatch = { ...savedBatch, st: 'accepted', temp: +d.temp || 2.1 }
        } catch {
          // If offline or QC deferred, purchase is still saved cleanly
        }
      }

      setOpen(false)
      setStep(0)
      setD({ ...init, purchaseDate: today() })
      setAddingSup(false)
      setNewSup(emptySup)
      if (savedBatch) setRc(savedBatch)
    } catch (err) {
      setSaveErr(err?.message || t('Hitilafu ya mtandao, jaribu tena', 'Network error — please try again'))
    } finally {
      setSaving(false)
    }
  }

  const payRows = {}
  s.suppliers.forEach(supx => {
    supPurchaseStatus(s, supx.id).forEach(r => {
      payRows[r.batch.id] = r
    })
  })

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

  const wizardSteps = [
    { key: 'details', label: t('Maelezo', 'Details') },
    { key: 'weigh', label: t('Pima', 'Weigh') },
    { key: 'quality', label: t('Ubora', 'Quality') },
    { key: 'payment', label: t('Malipo', 'Payment') },
  ]

  return (
    <div className="page-body">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="hidden md:block">
          <h2 className="text-xl font-bold text-slate-900 m-0">{t('Manunuzi ya Samaki na Mizani', 'Fish Purchasing & Weighing')}</h2>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            {t('Rekodi samaki kutoka kwa wavuvi, unganisha mizani ya kidijitali, na toa risiti.', 'Capture catches from fishermen, connect digital scales, and issue verified purchase vouchers.')}
          </p>
        </div>
        <button onClick={startNewPurchase} className="btn-primary w-full md:w-auto justify-center">
          <Plus size={16} /> {t('Manunuzi Mapya ya Samaki', 'New Fish Purchase')}
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t('Tafuta manunuzi, mzigo, mvuvi...', 'Search purchase #, batch #, supplier...')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10 rounded-2xl md:rounded-xl"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {['All', ...SPECIES].map(sp => (
            <button
              key={sp}
              type="button"
              onClick={() => setFilterSp(sp)}
              className={`px-3.5 py-2 md:py-1.5 rounded-full md:rounded-lg text-xs font-semibold whitespace-nowrap transition border shrink-0 ${
                filterSp === sp
                  ? 'bg-[#052d56] text-white border-[#052d56]'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {sp === 'All' ? t('Wote', 'All') : spLabel(sp)}
            </button>
          ))}
        </div>
      </div>

      {/* ─── MOBILE PURCHASE BATCH CARDS (< md) ─── */}
      <div className="md:hidden space-y-2.5">
        {batches.map(b => {
          const supObj = s.suppliers.find(x => x.id === b.sup)
          const row = payRows[b.id] || {
            net: batchNet(s, b),
            paid: +b.paid || 0,
            balance: Math.max(0, batchNet(s, b) - (+b.paid || 0)),
            status: b.payStatus || 'unpaid'
          }
          return (
            <div key={b.id} onClick={() => setViewPurchase(b)} className="mobile-card space-y-2.5 cursor-pointer active:scale-[0.99] transition">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FishPhoto sp={b.sp} size={46} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <b className="text-xs font-mono text-[#052d56]">{b.pur}</b>
                      <span className="text-[10px] font-mono text-slate-400">· {b.no}</span>
                    </div>
                    <b className="text-[14px] font-extrabold text-slate-900 block truncate">
                      {spLabel(b.sp)} · {t('Daraja', 'Grade')} {b.grade}
                    </b>
                    <span className="text-[11.5px] text-slate-500 block truncate">
                      {supObj?.name || b.sup} · {b.site}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <b className="text-sm font-mono font-extrabold text-slate-900 block">{f(b.kg)} kg</b>
                  <span className="text-[11px] font-mono text-slate-500">{tzs(tot(b))}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Badge variant={row.status === 'paid' ? 'green' : row.status === 'partial' ? 'amber' : 'red'}>
                    {row.status === 'paid' ? t('Imelipwa', 'Paid') : row.status === 'partial' ? t('Kiasi', 'Partial') : t('Haijalipwa', 'Unpaid')}
                  </Badge>
                  <Badge variant={b.st === 'accepted' ? 'green' : b.st === 'rejected' ? 'red' : 'amber'}>
                    {b.st === 'accepted' ? t('QC Safi', 'QC OK') : b.st === 'rejected' ? t('Imekataliwa', 'Rejected') : t('Inasubiri QC', 'Pending QC')}
                  </Badge>
                </div>
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setTraceBatch(b)}
                    aria-label="QR Traceability"
                    className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center"
                  >
                    <QrCode size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRc(b)}
                    aria-label="Print Receipt"
                    className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center"
                  >
                    <Printer size={15} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {batches.length === 0 && (
          <div className="mobile-card p-8 text-center text-xs text-slate-500">
            {t('Hakuna manunuzi yaliyopatikana.', 'No purchase batches found.')}
          </div>
        )}
      </div>

      {/* ─── DESKTOP TABLE (md+) ─── */}
      <div className="hidden md:block data-table-wrap">
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
                    <small className="block font-mono text-slate-500">{t('Halisi', 'Net')}: {tzs(row.net)}</small>
                  </td>
                  <td><span className="text-xs text-slate-600 font-mono">{fmtT(atOf(b))}</span></td>
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
                      <button onClick={() => setTraceBatch(b)} title={t('Ufuatiliaji wa QR', 'Traceability Chain & QR')} className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded">
                        <QrCode size={16} />
                      </button>
                      <button onClick={() => setRc(b)} title={t('Chapa Risiti', 'View & Print Voucher')} className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded">
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

      {/* Purchase Detail Modal */}
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
                <button type="button" onClick={() => { const b = viewPurchase; setViewPurchase(null); setRc(b) }} className="btn-primary text-xs">
                  <Printer size={13} /> {t('Fungua Risiti', 'Open Voucher')}
                </button>
                <button type="button" onClick={() => { const b = viewPurchase; setViewPurchase(null); setTraceBatch(b) }} className="btn-secondary text-xs">
                  <QrCode size={13} /> {t('Ufuatiliaji wa QR', 'QR Traceability')}
                </button>
              </>
            }
          />
        )
      })()}

      {/* ─── 4-STEP PROCUREMENT WIZARD (Screens 5–8) ─── */}
      {open && (
        <Modal
          title={
            step === 0
              ? t('Manunuzi ya Samaki', 'Fish Procurement')
              : step === 1
                ? t('Pima Samaki', 'Weigh Fish')
                : step === 2
                  ? t('Ukaguzi wa Ubora', 'Quality Control')
                  : t('Malipo ya Msambazaji', 'Supplier Payment')
          }
          subtitle={t('Utaratibu wa Kupokea Samaki Mwaloni', 'Tanzania Lake Victoria Landing Protocol')}
          onClose={() => {
            setOpen(false)
            setStep(0)
            setAddingSup(false)
            setNewSup(emptySup)
          }}
          maxWidth="max-w-2xl"
        >
          {/* 4-Step Visual Progress Bar matching Screens 5–8 */}
          <div className="grid grid-cols-4 gap-1 border-b border-slate-100 pb-3.5">
            {wizardSteps.map((st, idx) => {
              const done = idx < step
              const active = idx === step
              return (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => {
                    if (done || (idx === 1 && okStep1) || (idx === 2 && okStep1 && okWeigh) || (idx === 3 && okStep1 && okWeigh)) {
                      setStep(idx)
                    }
                  }}
                  className="flex flex-col items-center gap-1 text-center cursor-pointer bg-transparent border-0 p-0"
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold transition ${
                      done
                        ? 'bg-[#18b8b2] text-white'
                        : active
                          ? 'bg-[#052d56] text-white ring-4 ring-blue-100'
                          : 'bg-slate-100 text-slate-500 border border-slate-300'
                    }`}
                  >
                    {done ? <Check size={14} strokeWidth={3} /> : idx + 1}
                  </div>
                  <span
                    className={`text-[11px] font-bold ${
                      active ? 'text-[#052d56]' : done ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    {st.label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* ── STEP 1: DETAILS (Screen 5) ── */}
          {step === 0 && (
            <div className="flex flex-col gap-3.5">
              {/* Source Classification */}
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
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition ${
                    isCompany ? 'border-[#052d56] bg-blue-50/70' : 'border-slate-200 bg-white'
                  }`}
                >
                  <Ship size={17} className={isCompany ? 'text-[#052d56]' : 'text-slate-400'} />
                  <div className="min-w-0">
                    <b className="text-xs block truncate text-slate-900">{t('01 · Boti ya Kampuni', '01 · Company Fleet')}</b>
                    <span className="text-[10px] text-slate-500 block truncate">{t('Mavuno ya ndani', 'Internal catch')}</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setD(prev => ({ ...prev, sourceType: 'independent' }))}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition ${
                    !isCompany ? 'border-[#052d56] bg-blue-50/70' : 'border-slate-200 bg-white'
                  }`}
                >
                  <User size={17} className={!isCompany ? 'text-[#052d56]' : 'text-slate-400'} />
                  <div className="min-w-0">
                    <b className="text-xs block truncate text-slate-900">{t('02 · Msambazaji', '02 · External Supplier')}</b>
                    <span className="text-[10px] text-slate-500 block truncate">{t('Mvuvi / BMU / Dalali', 'Fisher / Group / Agent')}</span>
                  </div>
                </button>
              </div>

              {isCompany ? (
                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label={t('Boti ya Kampuni', 'Company Boat')}>
                    <select
                      value={d.boatId}
                      onChange={e => {
                        const bid = e.target.value
                        const bObj = s.boats?.find(b => b.id === bid)
                        setD(prev => ({ ...prev, boatId: bid, fishermanName: bObj?.captain || prev.fishermanName }))
                      }}
                      className="input-field"
                    >
                      {(!s.boats || s.boats.length === 0) && <option value="">MV Furaha</option>}
                      {(s.boats || []).map(b => <option key={b.id} value={b.id}>{b.name} ({b.code || b.regNo || 'Boat'})</option>)}
                    </select>
                  </Field>
                  <Field label={t('Nahodha / Mvuvi', 'Captain / Crew Leader')}>
                    <input
                      type="text"
                      value={d.fishermanName}
                      onChange={e => setD({ ...d, fishermanName: e.target.value })}
                      placeholder={t('Jina la nahodha', 'Captain name')}
                      className="input-field"
                    />
                  </Field>
                </div>
              ) : (
                <>
                  <Field
                    label={t('Msambazaji / Mvuvi *', 'Supplier *')}
                    hint={
                      <button
                        type="button"
                        onClick={() => setAddingSup(v => !v)}
                        className="text-xs font-bold text-[#052d56] hover:underline"
                      >
                        {addingSup ? t('Ghairi', 'Cancel') : `+ ${t('Sajili Mpya', 'Add Supplier')}`}
                      </button>
                    }
                  >
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
                      {s.suppliers.map(x => (
                        <option key={x.id} value={x.id}>
                          {x.name} ({x.no || x.phone || 'SUP'})
                        </option>
                      ))}
                      <option value="__new__">+ {t('Sajili Mvuvi Mpya', 'Register New Supplier')}</option>
                    </select>
                  </Field>

                  {addingSup && (
                    <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col gap-2.5">
                      <b className="text-xs text-emerald-950">{t('Sajili Mvuvi Mpya Papo Hapo', 'Quick Register Supplier')}</b>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          value={newSup.name}
                          onChange={e => setNewSup({ ...newSup, name: e.target.value })}
                          placeholder={t('Jina Kamili', 'Full Name')}
                          className="input-field"
                        />
                        <input
                          type="tel"
                          value={newSup.phone}
                          onChange={e => setNewSup({ ...newSup, phone: e.target.value })}
                          placeholder="+255 7XX XXX XXX"
                          className="input-field font-mono"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={registerSup}
                        disabled={!newSup.name.trim() || !newSup.phone.trim()}
                        className="btn-primary bg-emerald-600 hover:bg-emerald-700 self-start text-xs"
                      >
                        <Plus size={14} /> {t('Hifadhi & Tumia', 'Save & Select')}
                      </button>
                    </div>
                  )}
                </>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={t('Mwalo wa Kupokelea *', 'Landing Site *')}>
                  <input
                    type="text"
                    value={d.site !== '' ? d.site : (sx?.site || SITES[0])}
                    onChange={e => setD({ ...d, site: e.target.value })}
                    list="buy-landing-sites"
                    className="input-field"
                  />
                  <datalist id="buy-landing-sites">
                    {SITES.map(site => <option key={site} value={site} />)}
                  </datalist>
                </Field>
                <Field label={t('Tarehe ya Manunuzi *', 'Purchase Date *')}>
                  <input
                    type="date"
                    value={d.purchaseDate || today()}
                    onChange={e => setD({ ...d, purchaseDate: e.target.value })}
                    className="input-field font-mono"
                  />
                </Field>
              </div>

              {/* Fish Item Card matching Screen 5 */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800">{t('Aina ya Samaki & Bei', 'Fish Item & Unit Price')}</span>
                  <span className="text-[11px] font-mono text-slate-500">BATCH-{String(s.batches.length + 1).padStart(3, '0')}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {SPECIES.map(x => (
                    <button
                      key={x}
                      type="button"
                      onClick={() => {
                        const defaults = { 'Nile Perch': 8000, 'Tilapia': 5200, 'Dagaa (Sardines)': 2600, 'Catfish': 4500 }
                        setD({ ...d, sp: x, price: String(defaults[x] || 7000) })
                      }}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition text-center ${
                        d.sp === x ? 'border-[#052d56] bg-blue-50/80 ring-1 ring-[#052d56]' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <FishPhoto sp={x} size={40} />
                      <span className="text-[10.5px] font-bold text-slate-800 leading-tight line-clamp-2">{spLabel(x)}</span>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <Field label={t('Daraja', 'Grade')}>
                    <select value={d.grade} onChange={e => setD({ ...d, grade: e.target.value })} className="input-field font-bold">
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  </Field>
                  <Field label={t('Kadirio (kg)', 'Est. kg')}>
                    <input type="number" step="0.1" value={d.kg} onChange={e => setD({ ...d, kg: e.target.value })} className="input-field font-mono font-bold" />
                  </Field>
                  <Field label={t('Bei / kg', 'Price / kg')}>
                    <input type="number" value={d.price} onChange={e => setD({ ...d, price: e.target.value })} className="input-field font-mono font-bold" />
                  </Field>
                </div>
              </div>

              {/* Soft-Mint Total Amount Box matching Screen 5 */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                <span className="text-xs font-semibold text-emerald-800 block">
                  {t('Jumla ya Fedha', 'Total Amount')}
                </span>
                <b className="text-2xl font-extrabold font-mono text-slate-900 tracking-tight tabular-nums">
                  {tzs(total)}
                </b>
              </div>

              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={!okStep1}
                className="btn-primary w-full justify-center py-3"
              >
                {t('Inayofuata: Kupima Mizani', 'Next: Weighing')} <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ── STEP 2: WEIGH FISH (Screen 6) ── */}
          {step === 1 && (
            <div className="flex flex-col gap-3.5">
              <ScaleTerminal
                weight={d.kg}
                onTare={() => setD({ ...d, kg: '0.0' })}
                onManualWeight={val => setD({ ...d, kg: String(val) })}
                onSimulateWeigh={() => {
                  const simulated = (250 + Math.random() * 450).toFixed(1)
                  setD({ ...d, kg: simulated })
                }}
              />

              <Field label={t('Uzito Halisi (kg)', 'Confirmed Net Weight (kg)')}>
                <input
                  type="number"
                  step="0.1"
                  value={d.kg}
                  onChange={e => setD({ ...d, kg: e.target.value })}
                  className="input-field font-mono font-extrabold text-center text-lg"
                />
              </Field>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <button type="button" onClick={() => setStep(0)} className="btn-secondary justify-center">
                  <ArrowLeft size={15} /> {t('Rudi', 'Back')}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!okWeigh}
                  className="btn-primary col-span-2 justify-center"
                >
                  {t('Inayofuata: Ukaguzi wa Ubora', 'Next: Quality Check')} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: QUALITY CONTROL (Screen 7) ── */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <FishPhoto sp={d.sp} size={40} />
                  <div>
                    <b className="text-sm font-extrabold text-slate-900 block">
                      {spLabel(d.sp)} - {f(d.kg)} kg
                    </b>
                    <span className="text-[11px] text-slate-500">{d.site || sx?.site || SITES[0]}</span>
                  </div>
                </div>
                <Badge variant="blue">{tzs(total)}</Badge>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  {t('Weka Daraja la Ubora *', 'Assign Grade *')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['A', 'B', 'C'].map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setD({ ...d, grade: g })}
                      className={`py-2.5 rounded-xl border text-sm font-extrabold transition ${
                        d.grade === g
                          ? 'bg-[#052d56] text-white border-[#052d56] shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">
                    {t('Orodha ya Ukaguzi wa Ubora', 'Quality Checklist')}
                  </label>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-500 font-semibold">{t('Joto:', 'Temp:')}</span>
                    <input
                      type="number"
                      step="0.1"
                      value={d.temp}
                      onChange={e => setD({ ...d, temp: e.target.value })}
                      className="w-16 px-2 py-1 rounded-lg border border-slate-200 font-mono font-bold text-center text-xs bg-white"
                    />
                    <span className="font-mono text-slate-600">°C</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  {[
                    ['qcFresh', t('Upya / Mwonekano (macho, matamvua)', 'Freshness / Appearance (eyes, gills)')],
                    ['qcTempOk', t('Joto (0 - 4 °C)', 'Temperature (0 - 4 °C)')],
                    ['qcNoSpoilage', t('Hakuna dalili za kuharibika', 'No signs of spoilage')],
                    ['qcUniformity', t('Ukubwa / Usawa', 'Size / Uniformity')],
                  ].map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={!!d[key]}
                        onChange={e => setD({ ...d, [key]: e.target.checked })}
                        className="w-4 h-4 rounded accent-[#052d56]"
                      />
                      <span className="font-semibold text-slate-800">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Field label={t('Maoni ya Ukaguzi (Hiari)', 'Remarks (optional)')}>
                <textarea
                  rows={2}
                  value={d.qcNotes}
                  onChange={e => setD({ ...d, qcNotes: e.target.value })}
                  className="input-field"
                  placeholder={t('Ubora mzuri, umekubaliwa.', 'Good quality, accepted.')}
                />
              </Field>

              <label className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs cursor-pointer">
                <span className="font-bold text-emerald-900">
                  {t('Idhinisha QC mara moja & ingiza stoo', 'Auto-approve QC into cold stock on save')}
                </span>
                <input
                  type="checkbox"
                  checked={d.qcApproveOnSave}
                  onChange={e => setD({ ...d, qcApproveOnSave: e.target.checked })}
                  className="w-4 h-4 accent-emerald-600"
                />
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary justify-center">
                  <ArrowLeft size={15} /> {t('Rudi', 'Back')}
                </button>
                <button type="button" onClick={() => setStep(3)} className="btn-primary col-span-2 justify-center">
                  {t('Inayofuata: Malipo', 'Next: Payment')} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: SUPPLIER PAYMENT & RECEIPT (Screen 8) ── */}
          {step === 3 && (
            <div className="flex flex-col gap-3.5">
              {/* Purchase Summary Card matching Screen 8 */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <b className="text-sm text-slate-900 block pb-1 border-b border-slate-200">
                  {t('Muhtasari wa Manunuzi', 'Purchase Summary')}
                </b>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('Namba ya Manunuzi', 'Purchase No.')}</span>
                  <b className="font-mono text-slate-900">PUR-{String(s.batches.length + 1).padStart(6, '0')}</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('Msambazaji', 'Supplier')}</span>
                  <b className="text-slate-900">
                    {isCompany ? (s.boats?.find(b => b.id === d.boatId)?.name || 'Company Boat') : (sx?.name || '-')}
                  </b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('Aina ya Samaki', 'Species')}</span>
                  <b className="text-slate-900">{spLabel(d.sp)} ({t('Daraja', 'Grade')} {d.grade})</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('Uzito', 'Quantity')}</span>
                  <b className="font-mono text-slate-900">{f(d.kg)} kg</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('Bei / kg', 'Price / kg')}</span>
                  <b className="font-mono text-slate-900">{tzs(d.price)}</b>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-extrabold text-slate-900">
                  <span>{t('Jumla', 'Total')}</span>
                  <span className="font-mono">{tzs(total)}</span>
                </div>
              </div>

              {isCompany ? (
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl space-y-2 text-xs">
                  <b className="text-blue-900 block">{t('Mavuno ya Boti ya Kampuni', 'Company Fleet Harvest')}</b>
                  <p className="text-blue-800 m-0">
                    {t('Samaki wanaingizwa moja kwa moja stoo bila deni la mzabuni.', 'Stock enters cold room directly with zero supplier payable.')}
                  </p>
                  <Field label={t('Posho ya Safari (Hiari)', 'Crew Allowance (Optional)')}>
                    <input type="number" placeholder="0" value={d.paid} onChange={e => setD({ ...d, paid: e.target.value })} className="input-field font-mono" />
                  </Field>
                </div>
              ) : (
                <>
                  {(activeFuelDebt > 0 || activeMaintDebt > 0) && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between font-bold text-amber-950">
                        <span>{t('Makato ya Deni la Mafuta / Boti', 'Fuel / Boat Debt Auto-Offset')}</span>
                        <span className="font-mono text-emerald-700">{t('Halisi:', 'Net:')} {tzs(netEarnings)}</span>
                      </div>
                      {activeFuelDebt > 0 && (
                        <label className="flex items-center justify-between bg-white p-2 rounded-lg border border-amber-200 cursor-pointer">
                          <span className="flex items-center gap-2">
                            <input type="checkbox" checked={d.deductFuel} onChange={e => setD({ ...d, deductFuel: e.target.checked })} />
                            {t('Deni la Mafuta', 'Fuel Debt')} ({tzs(activeFuelDebt)})
                          </span>
                          <b className="font-mono text-rose-600">-{tzs(fuelOff)}</b>
                        </label>
                      )}
                      {activeMaintDebt > 0 && (
                        <label className="flex items-center justify-between bg-white p-2 rounded-lg border border-amber-200 cursor-pointer">
                          <span className="flex items-center gap-2">
                            <input type="checkbox" checked={d.deductMaint} onChange={e => setD({ ...d, deductMaint: e.target.checked })} />
                            {t('Deni la Matengenezo', 'Maint Debt')} ({tzs(activeMaintDebt)})
                          </span>
                          <b className="font-mono text-amber-700">-{tzs(maintOff)}</b>
                        </label>
                      )}
                    </div>
                  )}

                  {/* Payment Status Radio List matching Screen 8 */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-2">
                      {t('Hali ya Malipo', 'Payment Status')}
                    </label>
                    <div className="space-y-2">
                      {[
                        { id: 'full', label: t('Malipo Kamili', 'Full Payment'), right: tzs(netEarnings) },
                        { id: 'partial', label: t('Malipo Kiasi', 'Partial Payment'), right: d.payMode === 'partial' ? tzs(paidNow) : '' },
                        { id: 'unpaid', label: t('Inasubiri / Deni', 'Pending'), right: '' },
                      ].map(mode => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setD({ ...d, payMode: mode.id, paid: mode.id === 'full' ? String(netEarnings) : d.paid })}
                          className={`w-full px-3.5 py-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold transition ${
                            d.payMode === mode.id
                              ? 'border-[#052d56] bg-blue-50/70 text-[#052d56]'
                              : 'border-slate-200 bg-white text-slate-700'
                          }`}
                        >
                          <span className="flex items-center gap-2.5">
                            <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${d.payMode === mode.id ? 'border-[#052d56]' : 'border-slate-300'}`}>
                              {d.payMode === mode.id && <span className="w-2 h-2 rounded-full bg-[#052d56]" />}
                            </span>
                            {mode.label}
                          </span>
                          {mode.right && <b className="font-mono">{mode.right}</b>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {d.payMode === 'partial' && (
                    <Field label={t('Kiasi Kinacholipwa Sasa (TZS)', 'Amount Paying Now (TZS)')}>
                      <input
                        type="number"
                        value={d.paid}
                        onChange={e => setD({ ...d, paid: e.target.value })}
                        max={netEarnings}
                        className="input-field font-mono font-bold"
                      />
                    </Field>
                  )}

                  {paidNow > 0 && (
                    <Field label={t('Njia ya Malipo', 'Payment Method')}>
                      <select value={d.method} onChange={e => setD({ ...d, method: e.target.value })} className="input-field">
                        <option>Mobile Money (M-Pesa)</option>
                        <option>Airtel Money</option>
                        <option>Tigo Pesa</option>
                        <option>{t('Pesa Taslimu', 'Cash Voucher')}</option>
                        <option>{t('Benki (CRDB/NMB)', 'Bank Transfer (CRDB/NMB)')}</option>
                      </select>
                    </Field>
                  )}
                </>
              )}

              {saveErr && <p className="text-xs text-red-600 font-medium m-0">{saveErr}</p>}

              <div className="grid grid-cols-3 gap-2 pt-1">
                <button type="button" onClick={() => setStep(2)} className="btn-secondary justify-center">
                  <ArrowLeft size={15} /> {t('Rudi', 'Back')}
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={!canSave || saving}
                  className="btn-primary col-span-2 justify-center"
                >
                  {saving
                    ? t('Inahifadhi…', 'Saving…')
                    : <><Printer size={15} /> {t('Hifadhi & Chapa Risiti', 'Save & Print Receipt')}</>
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

      {traceBatch && <TraceabilityModal batch={traceBatch} onClose={() => setTraceBatch(null)} />}
    </div>
  )
}
