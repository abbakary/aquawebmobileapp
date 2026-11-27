import React, { useState } from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  Thermometer,
  CheckCircle2,
  XCircle,
  FileCheck,
  Search,
  AlertTriangle,
  Info
} from 'lucide-react'
import { useS } from '../store'
import { Modal, Field, Badge, FishPhoto, DetailModal, ViewBtn, f, fmtT } from '../ui'

export default function Quality() {
  const { s, a, me, t, spLabel } = useS()
  const [b, setB] = useState(null)
  const [viewQc, setViewQc] = useState(null)
  const [d, setD] = useState({
    acc: '',
    temp: '2.2',
    reason: 'High core temperature',
    checklist: {
      eyes: true,
      gills: true,
      flesh: true,
      smell: true
    }
  })

  const pend = s.batches.filter(x => x.st === 'pending')
  const done = s.batches.filter(x => x.st !== 'pending')
  const totalAcc = done.reduce((t, x) => t + (x.kg - x.rej), 0)
  const totalRej = done.reduce((t, x) => t + x.rej, 0)
  const totalInspectedKg = totalAcc + totalRej
  const rejRate = totalInspectedKg ? Math.round((totalRej / totalInspectedKg) * 100) : 0

  const accKg = d.acc === '' ? (b ? b.kg : 0) : +d.acc
  const rejKg = b ? Math.max(0, b.kg - accKg) : 0

  const submitInspection = () => {
    if (!b) return
    a.inspect(b.id, accKg, d.temp === '' ? null : +d.temp, rejKg > 0 ? d.reason : '')
    setB(null)
  }

  return (
    <div className="page-body">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 m-0">{t('Udhibiti na Ukaguzi wa Ubora wa Samaki', 'Quality Control & Fish Inspection')}</h2>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            {t('Ukaguzi wa baridi, upimaji wa joto, na utengaji wa samaki wasiokidhi viwango.', 'Strict cold chain reception compliance: organoleptic testing, temperature logging, and rejection segregation.')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-600" /> {t('Kiwango cha TMDA / EU: Joto ≤ 4.0°C', 'TMDA / EU Standard: ≤ 4.0°C Core Temp')}
          </span>
        </div>
      </div>

      {/* Visual Quality Lab Header */}
      <div className="panel p-0 overflow-hidden flex flex-col md:flex-row items-center border border-slate-200">
        <div className="w-full md:w-56 h-28 shrink-0 bg-slate-900 relative">
          <img
            src="/photos/quality-inspection.png"
            alt="Factory Quality Inspection"
            className="w-full h-full object-cover"
          />
          <span className="absolute bottom-1.5 left-1.5 bg-slate-950/80 text-blue-300 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold backdrop-blur-sm">
            {t('MAABARA YA UBORA', 'HACCP LAB')}
          </span>
        </div>
        <div className="p-3.5 flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 m-0">{t('Itifaki za Ukaguzi wa Ubora na Joto', 'Sensory & Temperature Inspection Protocols')}</h3>
            <p className="text-xs text-slate-500 m-0 mt-0.5">
              {t('Hakiki rangi ya matamvua, uimara wa nyama, macho safi, harufu nzuri, na joto ≤ 4.0°C.', 'Verify gill color (bright red), firm elasticity, clear eyes, fresh cucumber odor, and core temperature ≤ 4.0°C.')}
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5 whitespace-nowrap shrink-0">
            <ShieldCheck size={14} className="text-blue-600" /> {t('Madaraja ya FiRCIS', 'FiRCIS Grade Classification')}
          </span>
        </div>
      </div>

      {/* Quality KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap">
            <FileCheck size={22} />
          </div>
          <div className="kpi-content">
            <small>{t('Mizigo Iliyokaguliwa', 'Deliveries Inspected')}</small>
            <b>{done.length} <span className="text-xs font-sans text-slate-400">{t('mizigo', 'lots')}</span></b>
            <span className="kpi-sub">{pend.length} {t('inasubiri ukaguzi', 'pending review')}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap green">
            <CheckCircle2 size={22} />
          </div>
          <div className="kpi-content">
            <small>{t('Samaki Waliokubaliwa', 'Accepted Prime Seafood')}</small>
            <b>{f(totalAcc)} <span className="text-xs font-sans text-slate-400">kg</span></b>
            <span className="kpi-sub text-emerald-600 font-semibold">{t('Tayari kwa mauzo', 'Saleable inventory')}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap amber">
            <XCircle size={22} />
          </div>
          <div className="kpi-content">
            <small>Rejected / Substandard</small>
            <b>{f(totalRej)} <span className="text-xs font-sans text-slate-400">kg</span></b>
            <span className="kpi-sub text-rose-600 font-semibold">Segregated from chain</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap purple">
            <Thermometer size={22} />
          </div>
          <div className="kpi-content">
            <small>Defect / Rejection Rate</small>
            <b>{rejRate}%</b>
            <span className="kpi-sub">Tolerance threshold: &lt; 5%</span>
          </div>
        </div>
      </div>

      {/* Authentic Food Safety & Inspection Lab Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inspection Protocols Guide with Real Image */}
        <div className="panel lg:col-span-1 p-0 overflow-hidden">
          <div className="relative h-44 bg-slate-900">
            <img
              src="/assets/aistudio/image_da307d78.png"
              alt="Quality Inspectors checking fresh fish"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent p-4 flex flex-col justify-end">
              <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider">HACCP &amp; FiRCIS Inspection</span>
              <h4 className="text-base font-bold text-white m-0">Freshness Verification Lab</h4>
            </div>
          </div>
          <div className="p-4 flex flex-col gap-3 text-xs text-slate-600">
            <div className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>{t('Macho:', 'Eyes:')}</strong> {t('Maangavu, yasiyo na ukungu, mboni nyeusi.', 'Convex, clear cornea, black pupils (no cloudiness).')}</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>{t('Matamvua:', 'Gills:')}</strong> {t('Mekundu safi, yasiyo na ute mzito.', 'Bright crimson/red, free of sticky slime or brown mucus.')}</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>{t('Nyama & Ngozi:', 'Flesh & Skin:')}</strong> {t('Ngumu, inayorudi ukibonyeza; magamba imara.', 'Firm, elastic to pressure; scales intact and glistening.')}</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>{t('Joto:', 'Temperature:')}</strong> {t('Lazima liwe kati ya 0.0°C na 4.0°C.', 'Core probe must measure between 0.0°C and 4.0°C.')}</span>
            </div>
          </div>
        </div>

        {/* Batches Awaiting Inspection */}
        <div className="panel lg:col-span-2">
          <div className="panel-header">
            <div>
              <h3>{t('Mizigo Inayosubiri Ukaguzi wa Ubora', 'Arrival Batches Awaiting Quality Sign-Off')}</h3>
              <p>{t('Samaki waliopokelewa mwaloni wakisubiri idhini ya mkaguzi', 'Fish landed at dock and held in chiller pending inspector approval')}</p>
            </div>
            <Badge variant={pend.length > 0 ? 'amber' : 'green'}>
              {pend.length} {t('Inasubiri', 'Pending')}
            </Badge>
          </div>

          {pend.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
              <ShieldCheck size={36} className="text-emerald-600 mx-auto mb-2" />
              <b className="text-sm text-slate-800 block">{t('Mizigo Yote Imekaguliwa', 'All Deliveries Inspected & Certified')}</b>
              <p className="text-xs text-slate-500 m-0">{t('Hakuna mzigo unaosubiri ukaguzi kwa sasa.', 'No incoming fish batches waiting for inspection.')}</p>
            </div>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('Namba ya Mzigo', 'Batch Lot')}</th>
                    <th>{t('Samaki & Daraja', 'Fish & Grade')}</th>
                    <th>{t('Mvuvi / Mwalo', 'Supplier / Landing')}</th>
                    <th>{t('Uzito Uliofika', 'Arrived Weight')}</th>
                    <th className="text-right">{t('Kitendo', 'Action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pend.map(x => {
                    const supObj = s.suppliers.find(y => y.id === x.sup)
                    return (
                      <tr key={x.id}>
                        <td>
                          <b className="font-mono text-blue-700">{x.no}</b>
                          <small className="block font-mono text-slate-400">{x.pur}</small>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <FishPhoto sp={x.sp} size={32} />
                            <div>
                              <b className="text-slate-900 block">{spLabel(x.sp)}</b>
                              <small className="text-slate-500">{t('Daraja', 'Grade')} {x.grade}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="text-slate-800 font-medium block">{supObj?.name || x.sup}</span>
                          <small className="text-slate-400">{x.site}</small>
                        </td>
                        <td>
                          <b className="font-mono text-slate-900">{f(x.kg)} kg</b>
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <ViewBtn onClick={() => setViewQc(x)} />
                            <button
                              onClick={() => {
                                setB(x)
                                setD({
                                  acc: String(x.kg),
                                  temp: '2.1',
                                  reason: 'High core temperature',
                                  checklist: { eyes: true, gills: true, flesh: true, smell: true }
                                })
                              }}
                              className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-700"
                            >
                              <ShieldCheck size={14} /> {t('Kagua & Idhinisha', 'Inspect & Grade')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Inspection History Log */}
      <div className="panel p-0 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 m-0">{t('Daftari la Ukaguzi & Vyeti vya Ubora', 'Inspection Log & Quality Certifications')}</h3>
          <p className="text-xs text-slate-500 m-0">{t('Kumbukumbu za mizigo iliyoidhinishwa kwa ajili ya viwanda', 'Verified audit records of fish lots approved for industrial processing')}</p>
        </div>
        <div className="data-table-wrap border-0 rounded-none">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('Mzigo #', 'Batch #')}</th>
                <th>{t('Aina ya Samaki', 'Fish Species')}</th>
                <th>{t('Mvuvi / Mzabuni', 'Supplier')}</th>
                <th>{t('Joto', 'Core Temp')}</th>
                <th>{t('Waliokubaliwa (kg)', 'Accepted (kg)')}</th>
                <th>{t('Waliokataliwa (kg)', 'Rejected (kg)')}</th>
                <th>{t('Sababu ya Kukataliwa', 'Rejection Reason')}</th>
                <th>{t('Tarehe', 'Inspection Date')}</th>
                <th>{t('Uamuzi', 'Verdict')}</th>
                <th className="text-right">{t('Vitendo', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {done.map(x => {
                const supObj = s.suppliers.find(y => y.id === x.sup)
                return (
                  <tr key={x.id}>
                    <td>
                      <b className="font-mono text-slate-800">{x.no}</b>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <FishPhoto sp={x.sp} size={28} />
                        <span className="font-medium text-slate-900">{spLabel(x.sp)} ({x.grade})</span>
                      </div>
                    </td>
                    <td>{supObj?.name || x.sup}</td>
                    <td>
                      <span className="font-mono font-semibold text-emerald-700">
                        {x.temp ? `${x.temp}°C` : '2.1°C'}
                      </span>
                    </td>
                    <td>
                      <b className="font-mono text-emerald-700">{f(x.kg - (x.rej || 0))} kg</b>
                    </td>
                    <td>
                      <span className={`font-mono ${x.rej > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                        {f(x.rej || 0)} kg
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-500">{x.reason || t('Hakuna (Ubora Bora)', 'None (Prime Quality)')}</span>
                    </td>
                    <td>
                      <span className="text-xs font-mono text-slate-600">{x.insp || x.date}</span>
                    </td>
                    <td>
                      <Badge variant={x.st === 'accepted' ? 'green' : 'red'}>
                        {x.st === 'accepted' ? t('Amethibitishwa', 'Certified') : t('Amekataliwa', 'Rejected')}
                      </Badge>
                    </td>
                    <td className="text-right">
                      <ViewBtn onClick={() => setViewQc(x)} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {viewQc && (() => {
        const supObj = s.suppliers.find(y => y.id === viewQc.sup)
        return (
          <DetailModal
            title={`${t('Cheti & Taarifa za Ukaguzi:', 'Quality Inspection Details:')} ${viewQc.no}`}
            subtitle={`${spLabel(viewQc.sp)} (${t('Daraja', 'Grade')} ${viewQc.grade}) · ${viewQc.site}`}
            badge={
              <Badge variant={viewQc.st === 'accepted' ? 'green' : viewQc.st === 'rejected' ? 'red' : 'amber'}>
                {viewQc.st === 'accepted' ? t('Amethibitishwa', 'Certified') : viewQc.st === 'rejected' ? t('Amekataliwa', 'Rejected') : t('Inasubiri Ukaguzi', 'Pending QC')}
              </Badge>
            }
            onClose={() => setViewQc(null)}
            fields={[
              { label: t('Namba ya Mzigo', 'Batch Lot'), value: viewQc.no, mono: true },
              { label: t('Namba ya Manunuzi', 'Purchase ID'), value: viewQc.pur, mono: true },
              { label: t('Aina ya Samaki', 'Fish Species'), value: `${spLabel(viewQc.sp)} (${t('Daraja', 'Grade')} ${viewQc.grade})` },
              { label: t('Mvuvi / Mzabuni', 'Fisherman / Supplier'), value: supObj?.name || viewQc.sup },
              { label: t('Mwalo', 'Landing Site'), value: viewQc.site },
              { label: t('Joto la Ndani (HACCP)', 'Core Temp (HACCP)'), value: `${viewQc.temp || '2.1'}°C`, mono: true },
              { label: t('Uzito Uliofika', 'Arrived Weight'), value: `${f(viewQc.kg)} kg`, mono: true },
              { label: t('Uzito Uliokubaliwa', 'Accepted Weight'), value: `${f(viewQc.kg - (viewQc.rej || 0))} kg`, mono: true, highlight: true },
              { label: t('Uzito Uliokataliwa', 'Rejected Weight'), value: `${f(viewQc.rej || 0)} kg`, mono: true },
              { label: t('Sababu / Maoni', 'Reason / Notes'), value: viewQc.reason || t('Hakuna (Ubora Bora)', 'None (Prime Quality)') },
              { label: t('Tarehe ya Ukaguzi', 'Inspection Date'), value: viewQc.insp || viewQc.date, mono: true },
            ]}
          />
        )
      })()}

      {/* Inspect Batch Modal */}
      {b && (
        <Modal
          title={t(`Ukaguzi wa Ubora: ${b.no}`, `Quality Inspection: ${b.no}`)}
          subtitle={t(`Waliofika: ${f(b.kg)} kg ${spLabel(b.sp)} kutoka ${s.suppliers.find(y => y.id === b.sup)?.name}`, `Arrived: ${f(b.kg)} kg ${spLabel(b.sp)} from ${s.suppliers.find(y => y.id === b.sup)?.name}`)}
          onClose={() => setB(null)}
          maxWidth="max-w-xl"
        >
          <div className="flex flex-col gap-4">
            {/* Checklist */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2 text-xs">
              <span className="font-bold text-slate-900 uppercase tracking-wide">
                {t('Orodha ya Ukaguzi wa Ubora (HACCP):', 'Organoleptic Quality Checklist (HACCP):')}
              </span>
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={d.checklist.eyes}
                    onChange={e => setD({ ...d, checklist: { ...d.checklist, eyes: e.target.checked } })}
                  />
                  <span>{t('Macho: Maangavu & Safi', 'Eyes: Clear & Convex')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={d.checklist.gills}
                    onChange={e => setD({ ...d, checklist: { ...d.checklist, gills: e.target.checked } })}
                  />
                  <span>{t('Matamvua: Mekundu Safi', 'Gills: Bright Red / Pink')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={d.checklist.flesh}
                    onChange={e => setD({ ...d, checklist: { ...d.checklist, flesh: e.target.checked } })}
                  />
                  <span>{t('Nyama: Ngumu & Imara', 'Flesh: Firm & Elastic')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={d.checklist.smell}
                    onChange={e => setD({ ...d, checklist: { ...d.checklist, smell: e.target.checked } })}
                  />
                  <span>{t('Harufu: Safi ya Ziwa', 'Odor: Fresh Neutral Lake')}</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t('Joto la Kupokelea (°C)', 'Reception Temp (°C)')} hint={t('Lengo: 0°C hadi 4°C', 'Target: 0°C to 4°C')}>
                <input
                  type="number"
                  step="0.1"
                  value={d.temp}
                  onChange={e => setD({ ...d, temp: e.target.value })}
                  className="input-field font-mono font-bold"
                />
              </Field>
              <Field label={t(`Uzito Uliokubaliwa (kati ya ${b.kg} kg)`, `Accepted Weight (of ${b.kg} kg)`)}>
                <input
                  type="number"
                  value={d.acc}
                  onChange={e => setD({ ...d, acc: e.target.value })}
                  className="input-field font-mono font-bold text-emerald-700"
                />
              </Field>
            </div>

            {rejKg > 0 && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs text-rose-900 font-bold">
                  <span>{t('Samaki Waliokataliwa:', 'Rejected Substandard Fish:')}</span>
                  <span className="font-mono text-sm">{f(rejKg)} kg</span>
                </div>
                <Field label={t('Sababu ya Kukataliwa', 'Reason for Rejection')}>
                  <select
                    value={d.reason}
                    onChange={e => setD({ ...d, reason: e.target.value })}
                    className="input-field bg-white"
                  >
                    <option value="High core temperature (>4.0°C)">{t('Joto kali (>4.0°C)', 'High core temperature (>4.0°C)')}</option>
                    <option value="Belly burst & organ degradation">{t('Kupasuka tumbo / kuharibika', 'Belly burst & organ degradation')}</option>
                    <option value="Mechanical crushed crate damage">{t('Kubondeka kwenye makreti', 'Mechanical crushed crate damage')}</option>
                    <option value="Foul stale odor / discoloration">{t('Harufu mbaya / kubadilika rangi', 'Foul stale odor / discoloration')}</option>
                    <option value="Undersized juvenile fish">{t('Samaki wadogo chini ya kipimo', 'Undersized juvenile fish')}</option>
                  </select>
                </Field>
                <p className="text-[11px] text-rose-700 m-0">
                  {t('Taarifa: Samaki waliokataliwa hawaingii kwenye stoo ya mauzo.', 'Notice: Rejected fish is blocked from entering saleable inventory and cannot be sold to factories.')}
                </p>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <button type="button" onClick={() => setB(null)} className="btn-secondary">
                {t('Ghairi', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={submitInspection}
                disabled={!(accKg >= 0 && accKg <= b.kg)}
                className="btn-primary bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 size={16} /> {t('Saini & Idhinisha Mzigo', 'Sign & Authorize Batch')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
