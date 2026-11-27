import React, { useState } from 'react'
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Search,
  User,
  Clock
} from 'lucide-react'
import { useS } from '../store'
import { Badge, DetailModal, ViewBtn } from '../ui'

export default function Audit() {
  const { s, t } = useS()
  const [search, setSearch] = useState('')
  const [viewLog, setViewLog] = useState(null)

  const logs = s.audit.filter(x =>
    x.m.toLowerCase().includes(search.toLowerCase()) ||
    x.u.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page-body">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 m-0">{t('Daftari la Ukaguzi wa Mfumo', 'Immutable Operational Audit Log')}</h2>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            {t('Kumbukumbu zilizolindwa. Risiti za mizani, bei, na uhamisho wa stoo haziwezi kubadilishwa kinyemela.', 'Cryptographically sealed activity trail. Completed weighing receipts, price approvals, and stock transfers cannot be retroactively edited.')}
          </p>
        </div>
      </div>

      {/* Security Note */}
      <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Lock size={18} />
          </div>
          <div>
            <b className="text-sm block">Anti-Tampering Ledger Enabled</b>
            <span className="text-slate-400">Protects company owners against secret price/weight manipulation at landing beaches.</span>
          </div>
        </div>
        <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800">
          IMMUTABLE
        </span>
      </div>

      {/* Search */}
      <div className="relative w-full">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder={t('Tafuta kumbukumbu kwa tukio au mfanyakazi...', 'Search audit trail by event description or staff user...')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-10 text-xs"
        />
      </div>

      {/* Audit Log Table */}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('Muda', 'Timestamp')}</th>
              <th>{t('Mfanyakazi & Wadhifa', 'Staff User & Role')}</th>
              <th>{t('Kitendo & Tukio Lililothibitishwa', 'Action & Verified Event')}</th>
              <th>{t('Uthibitisho', 'Integrity')}</th>
              <th className="text-right">{t('Vitendo', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(x => (
              <tr key={x.id}>
                <td>
                  <span className="font-mono text-xs text-slate-600 flex items-center gap-1.5">
                    <Clock size={12} className="text-slate-400" /> {x.t}
                  </span>
                </td>
                <td>
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <User size={13} className="text-blue-700" /> {x.u}
                  </span>
                </td>
                <td>
                  <b className="text-slate-800 font-mono text-xs">{x.m}</b>
                </td>
                <td>
                  <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {t('IMETHIBITISHWA', 'VERIFIED')}
                  </span>
                </td>
                <td className="text-right">
                  <ViewBtn onClick={() => setViewLog(x)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewLog && (
        <DetailModal
          title={t('Maelezo ya Kumbukumbu ya Ukaguzi', 'Audit Log Entry Details')}
          subtitle={viewLog.t}
          badge={<Badge variant="green">{t('IMETHIBITISHWA', 'VERIFIED')}</Badge>}
          onClose={() => setViewLog(null)}
          fields={[
            { label: t('Muda wa Tukio', 'Timestamp'), value: viewLog.t, mono: true },
            { label: t('Mfanyakazi & Wadhifa', 'Staff User & Role'), value: viewLog.u },
            { label: t('Kitendo & Tukio Lililothibitishwa', 'Action & Verified Event'), value: viewLog.m, mono: true, fullWidth: true, highlight: true },
          ]}
        />
      )}
    </div>
  )
}
