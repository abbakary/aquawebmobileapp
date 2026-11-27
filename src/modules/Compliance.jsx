import React, { useState } from 'react'
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Calendar,
  Building,
  CheckCircle2,
  ExternalLink
} from 'lucide-react'
import { useS } from '../store'
import { Modal, Field, Badge, f } from '../ui'

const PERMIT_TYPES = [
  'FiRCIS Fish Movement Permit',
  'Commercial Fish Dealer Licence',
  'Landing Station Registration',
  'Sanitary & Cold Chain Inspection Cert',
  'Export Health Clearance Certificate',
  'Fisheries Transport Permit'
]

export default function Compliance() {
  const { s, a, t } = useS()
  const [open, setOpen] = useState(false)
  const [d, setD] = useState({
    type: PERMIT_TYPES[0],
    ref: 'FMP-MWZ-2026-',
    who: 'Ministry of Livestock and Fisheries',
    exp: '2027-04-30'
  })

  const sortedComp = [...s.comp].sort((x, y) => x.exp.localeCompare(y.exp))

  const handleSave = () => {
    a.addComp({
      type: d.type,
      ref: d.ref,
      who: d.who,
      exp: d.exp,
      status: 'Valid'
    })
    setOpen(false)
    setD({
      type: PERMIT_TYPES[0],
      ref: 'FMP-MWZ-2026-',
      who: 'Ministry of Livestock and Fisheries',
      exp: '2027-04-30'
    })
  }

  return (
    <div className="page-body">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 m-0">{t('Vibali na Nyaraka za FiRCIS', 'Compliance & FiRCIS Documentation')}</h2>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            {t('Nyaraka za Wizara ya Mifugo na Uvuvi, vibali vya usafirishaji, na vyeti vya afya.', 'Ministry of Livestock & Fisheries regulatory archives, movement permits, and sanitary certificate expiries.')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setOpen(true)} className="btn-primary">
            <Plus size={16} /> {t('Hifadhi Kibali / Leseni Mpya', 'Archive New Permit / Licence')}
          </button>
        </div>
      </div>

      {/* Advisory Note */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-900">
        <ShieldCheck size={20} className="text-blue-700 shrink-0 mt-0.5" />
        <div>
          <strong className="block text-blue-950 font-bold mb-0.5">Government Regulatory Notice</strong>
          <span>
            FishTrade ERP archives internal operational copies and sends expiry alerts. Official statutory fish movement permits and export health certificates are legally issued via the Ministry’s FiRCIS portal (fircis.mlf.go.tz).
          </span>
        </div>
      </div>

      {/* Permits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sortedComp.map(c => {
          const daysLeft = Math.ceil((new Date(c.exp) - new Date()) / 864e5)
          const isExpired = daysLeft < 0
          const isExpiringSoon = daysLeft <= 30 && !isExpired

          return (
            <div
              key={c.id}
              className={`p-5 rounded-2xl bg-white border flex flex-col justify-between gap-4 shadow-sm ${
                isExpired ? 'border-rose-300 bg-rose-50/20' : isExpiringSoon ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center">
                    <FileText size={16} />
                  </div>
                  <div>
                    <b className="text-sm text-slate-900 block">{c.type}</b>
                    <span className="font-mono text-xs text-blue-700 font-semibold">{c.ref}</span>
                  </div>
                </div>
                <Badge variant={isExpired ? 'red' : isExpiringSoon ? 'amber' : 'green'}>
                  {isExpired ? t('Imeisha Muda', 'Expired') : isExpiringSoon ? `${daysLeft} ${t('siku zimebaki', 'days left')}` : t('Hai', 'Valid')}
                </Badge>
              </div>

              <div className="text-xs text-slate-600 flex flex-col gap-1.5 border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('Mamlaka Iliyotoa:', 'Issuing Authority:')}</span>
                  <b className="text-slate-800">{c.who}</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('Tarehe ya Kuisha:', 'Expiry Date:')}</span>
                  <b className="font-mono text-slate-900">{c.exp}</b>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Document Modal */}
      {open && (
        <Modal
          title={t('Hifadhi Kibali au Leseni ya Uvuvi', 'Archive Fisheries Permit or Licence')}
          subtitle={t('Rekodi taarifa za kibali ili kupata tahadhari kabla muda haujaisha', 'Record regulatory document details for automatic renewal warnings')}
          onClose={() => setOpen(false)}
        >
          <div className="flex flex-col gap-4">
            <Field label={t('Aina ya Kibali / Hati', 'Document Type')}>
              <select
                value={d.type}
                onChange={e => setD({ ...d, type: e.target.value })}
                className="input-field"
              >
                {PERMIT_TYPES.map(pt => (
                  <option key={pt}>{pt}</option>
                ))}
              </select>
            </Field>

            <Field label={t('Namba ya Kibali / Leseni', 'Document Reference / Permit Number')}>
              <input
                type="text"
                placeholder="e.g. FMP-MWZ-2026-089"
                value={d.ref}
                onChange={e => setD({ ...d, ref: e.target.value })}
                className="input-field font-mono"
              />
            </Field>

            <Field label={t('Mamlaka / Kituo Kilichotoa', 'Issuing Authority / Station')}>
              <input
                type="text"
                placeholder={t('mf. Wizara ya Mifugo na Uvuvi (Mwanza)', 'e.g. Ministry of Livestock & Fisheries (Mwanza)')}
                value={d.who}
                onChange={e => setD({ ...d, who: e.target.value })}
                className="input-field"
              />
            </Field>

            <Field label={t('Tarehe ya Kuisha Muda', 'Permit Expiry Date')}>
              <input
                type="date"
                value={d.exp}
                onChange={e => setD({ ...d, exp: e.target.value })}
                className="input-field font-mono"
              />
            </Field>

            <button
              type="button"
              disabled={!d.ref || !d.exp}
              onClick={handleSave}
              className="btn-primary mt-2"
            >
              {t('Hifadhi Kwenye Daftari la Vibali', 'Save to Compliance Registry')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
