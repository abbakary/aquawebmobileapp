import React, { useState, useEffect } from 'react'
import {
  DollarSign,
  CreditCard,
  Search,
  CheckCircle2,
  Phone,
  Printer,
  Calendar,
  ArrowUpRight
} from 'lucide-react'
import { useS, supBal, supAccountStatement, supPurchaseStatus } from '../store'
import { Modal, Field, Badge, ReceiptModal, DetailModal, ViewBtn, f, tzs, fmtT } from '../ui'

export default function Payments() {
  const { s, a, t } = useS()
  const [mTab, setMTab] = useState('balances')
  const [payTarget, setPayTarget] = useState(null)
  const [viewSupBal, setViewSupBal] = useState(null)
  const [viewPay, setViewPay] = useState(null)
  const [amt, setAmt] = useState('')
  const [method, setMethod] = useState('M-Pesa (Mobile Money)')
  const [voucher, setVoucher] = useState(null)
  const [search, setSearch] = useState('')

  const totalOwed = s.suppliers.reduce((t, y) => t + supBal(s, y.id), 0)
  const totalPaid = s.pays.reduce((t, p) => t + p.amt, 0)

  useEffect(() => {
    const onQuickAdd = e => {
      if (e.detail?.tab !== 'payments') return
      const firstUnpaid = s.suppliers.find(y => supBal(s, y.id) > 0) || s.suppliers[0]
      if (firstUnpaid) {
        const bal = Math.max(0, supBal(s, firstUnpaid.id))
        setPayTarget(firstUnpaid)
        setAmt(String(bal))
      }
    }
    window.addEventListener('aquacatch:quick-add', onQuickAdd)
    return () => window.removeEventListener('aquacatch:quick-add', onQuickAdd)
  }, [s])

  const handlePay = () => {
    if (!payTarget) return
    const bal = Math.max(0, supBal(s, payTarget.id))
    const payAmt = Math.min(+amt || 0, bal)
    if (!(payAmt > 0)) return
    a.pay(payTarget.id, payAmt, method)
    setVoucher({
      sup: payTarget.name,
      site: payTarget.site,
      amt: payAmt,
      method,
      date: new Date().toLocaleDateString('en-GB')
    })
    setPayTarget(null)
    setAmt('')
  }

  const suppliers = s.suppliers.filter(y =>
    y.name.toLowerCase().includes(search.toLowerCase()) ||
    y.site.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page-body">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 m-0">{t('Malipo ya Wavuvi na Madeni', 'Supplier Payments & Fishermen Debts')}</h2>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            {t('Lipa wavuvi kwa M-Pesa, Airtel Money, au benki na fuatilia salio.', 'Disburse payments via mobile money (M-Pesa, Airtel Money) or bank transfer and track outstanding balances.')}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap amber">
            <DollarSign size={22} />
          </div>
          <div className="kpi-content">
            <small>{t('Jumla ya Madeni ya Wavuvi', 'Total Debt Owed to Fishermen')}</small>
            <b className="text-rose-700">{tzs(totalOwed)}</b>
            <span className="kpi-sub">{t('Katika mialo yote', 'Across all landing sites')}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap green">
            <CreditCard size={22} />
          </div>
          <div className="kpi-content">
            <small>{t('Jumla ya Malipo Yaliyotolewa', 'Total Payments Disbursed')}</small>
            <b>{tzs(totalPaid)}</b>
            <span className="kpi-sub font-mono">{s.pays.length} {t('risiti zimetolewa', 'vouchers issued')}</span>
          </div>
        </div>
      </div>

      {/* Mobile Pill Tab Switcher */}
      <div className="flex md:hidden items-center gap-2 bg-slate-200/80 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => setMTab('balances')}
          className={`flex-1 min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            mTab === 'balances' ? 'bg-[#052d56] text-white shadow-sm' : 'text-slate-600'
          }`}
        >
          {t('Salio la Wavuvi', 'Balances')} ({suppliers.length})
        </button>
        <button
          type="button"
          onClick={() => setMTab('history')}
          className={`flex-1 min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            mTab === 'history' ? 'bg-[#052d56] text-white shadow-sm' : 'text-slate-600'
          }`}
        >
          {t('Historia ya Malipo', 'History')} ({s.pays.length})
        </button>
      </div>

      {/* Supplier Balances Table */}
      <div className={`panel p-0 overflow-hidden ${mTab !== 'balances' ? 'hidden md:flex' : ''}`}>
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 m-0">{t('Salio la Akaunti za Wavuvi', 'Fishermen Account Balances')}</h3>
            <p className="text-xs text-slate-500 m-0">{t('Madeni ya sasa kutoka kwenye risiti za samaki', 'Active balances from fish delivery receipts')}</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('Tafuta mvuvi...', 'Search supplier...')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9 py-1.5 text-xs"
            />
          </div>
        </div>

        {/* Mobile Balances Cards (< md) */}
        <div className="md:hidden p-3 flex flex-col gap-2.5 bg-slate-50/50">
          {suppliers.map(y => {
            const bal = supBal(s, y.id)
            const rows = supPurchaseStatus(s, y.id)
            const nUnpaid = rows.filter(r => r.status === 'unpaid').length
            return (
              <div key={y.id} className="mobile-card flex flex-col gap-2.5">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 text-blue-800 font-bold text-sm flex items-center justify-center shrink-0">
                      {y.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <b className="text-sm text-slate-900 block truncate">{y.name}</b>
                      <span className="text-[11px] text-slate-500 block truncate">{y.site} · {y.phone}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <b className={`font-mono text-sm block tabular-nums ${bal > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {tzs(bal)}
                    </b>
                    <span className="text-[10px] text-slate-400">
                      {rows.length} {t('risiti', 'lots')}{nUnpaid > 0 ? ` · ${nUnpaid} ${t('bado', 'due')}` : ''}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <ViewBtn onClick={() => setViewSupBal(y)} />
                  {bal > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPayTarget(y)
                        setAmt(String(bal))
                      }}
                      className="btn-primary flex-1 text-xs bg-[#18b8b2] hover:bg-[#139c97]"
                    >
                      <CreditCard size={14} /> {t('Lipa Deni', 'Disburse Payment')}
                    </button>
                  ) : (
                    <span className="ml-auto text-xs font-bold text-emerald-700 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200">
                      {t('Amelipwa', 'Settled')}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="hidden md:block data-table-wrap border-0 rounded-none">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('Mvuvi / Mzabuni', 'Fisherman / Supplier')}</th>
                <th>{t('Kundi', 'Category')}</th>
                <th>{t('Mwalo', 'Landing Station')}</th>
                <th>{t('Namba ya Simu', 'Phone Number')}</th>
                <th>{t('Deni Analodai', 'Outstanding Debt')}</th>
                <th className="text-right">{t('Kitendo', 'Action')}</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(y => {
                const bal = supBal(s, y.id)
                const rows = supPurchaseStatus(s, y.id)
                const nUnpaid = rows.filter(r => r.status === 'unpaid').length
                const nPartial = rows.filter(r => r.status === 'partial').length
                return (
                  <tr key={y.id}>
                    <td>
                      <b className="text-slate-900 block">{y.name}</b>
                      <small className="text-slate-400 font-mono">{y.no || y.id}</small>
                    </td>
                    <td>
                      <Badge variant={y.cat === 'BMU Fishing Group' ? 'blue' : 'neutral'}>
                        {y.cat}
                      </Badge>
                    </td>
                    <td>{y.site}</td>
                    <td className="font-mono text-xs">{y.phone}</td>
                    <td>
                      <b className={`font-mono text-sm ${bal > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {tzs(bal)}
                      </b>
                      <small className="block text-[10px] text-slate-500">
                        {rows.length} {t('manunuzi', 'purchases')}
                        {nUnpaid > 0 && ` · ${nUnpaid} ${t('hayajalipwa', 'unpaid')}`}
                        {nPartial > 0 && ` · ${nPartial} ${t('kiasi', 'partial')}`}
                      </small>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <ViewBtn onClick={() => setViewSupBal(y)} />
                        {bal > 0 ? (
                          <button
                            onClick={() => {
                              setPayTarget(y)
                              setAmt(String(bal))
                            }}
                            className="btn-primary text-xs py-1 px-3 bg-emerald-600 hover:bg-emerald-700"
                          >
                            {t('Lipa Deni', 'Disburse Payment')}
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-700 font-semibold">{t('Amelipwa', 'Settled')}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History */}
      <div className={`panel p-0 overflow-hidden ${mTab !== 'history' ? 'hidden md:flex' : ''}`}>
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 m-0">{t('Malipo Yaliyofanyika Hivi Karibuni', 'Recent Payment Disbursements')}</h3>
          <p className="text-xs text-slate-500 m-0">{t('Risiti za malipo kupitia simu na benki', 'Vouchers paid via mobile money and bank')}</p>
        </div>

        {/* Mobile History Cards (< md) */}
        <div className="md:hidden p-3 flex flex-col gap-2.5 bg-slate-50/50">
          {[...s.pays].reverse().slice(0, 15).map((p, idx) => {
            const supObj = s.suppliers.find(y => y.id === p.sup)
            const refCode = p.ref || `PAY-00${idx + 1}`
            return (
              <div
                key={p.id || idx}
                className="mobile-card flex items-center justify-between gap-2.5"
                onClick={() => setViewPay({ ...p, ref: refCode, supName: supObj?.name || 'Fisherman' })}
              >
                <div className="min-w-0">
                  <b className="text-sm text-slate-900 block truncate">{supObj?.name || 'Fisherman'}</b>
                  <span className="text-[11px] font-mono text-blue-700 block">{refCode} · {p.date}</span>
                  <span className="text-[11px] text-slate-500">{p.m}</span>
                </div>
                <div className="text-right shrink-0">
                  <b className="font-mono text-sm text-emerald-700 block tabular-nums">{tzs(p.amt)}</b>
                  <Badge variant="green">{t('Imelipwa', 'Paid')}</Badge>
                </div>
              </div>
            )
          })}
        </div>

        <div className="hidden md:block data-table-wrap border-0 rounded-none">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('Risiti #', 'Voucher #')}</th>
                <th>{t('Mpokeaji', 'Recipient')}</th>
                <th>{t('Njia', 'Channel')}</th>
                <th>{t('Kiasi (TZS)', 'Amount (TZS)')}</th>
                <th>{t('Tarehe', 'Date')}</th>
                <th>{t('Hali', 'Status')}</th>
                <th className="text-right">{t('Vitendo', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {[...s.pays].reverse().slice(0, 10).map((p, idx) => {
                const supObj = s.suppliers.find(y => y.id === p.sup)
                return (
                  <tr key={p.id || idx}>
                    <td>
                      <span className="font-mono text-blue-700 font-semibold">{p.ref || `PAY-00${idx + 1}`}</span>
                    </td>
                    <td>
                      <b className="text-slate-900">{supObj?.name || 'Fisherman'}</b>
                      {p.pur && <small className="block font-mono text-[10px] text-blue-700">{p.pur}</small>}
                    </td>
                    <td>
                      <span className="text-slate-700">{p.m}</span>
                    </td>
                    <td>
                      <b className="font-mono text-emerald-700">{tzs(p.amt)}</b>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-slate-500">{p.date}</span>
                    </td>
                    <td>
                      <Badge variant="green">{t('Imelipwa', 'Disbursed')}</Badge>
                    </td>
                    <td className="text-right">
                      <ViewBtn onClick={() => setViewPay({ ...p, ref: p.ref || `PAY-00${idx + 1}`, supName: supObj?.name || 'Fisherman' })} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {viewSupBal && (() => {
        const bal = supBal(s, viewSupBal.id)
        const stmt = supAccountStatement(s, viewSupBal.id)
        const rows = supPurchaseStatus(s, viewSupBal.id)
        const nUnpaid = rows.filter(r => r.status === 'unpaid').length
        const nPartial = rows.filter(r => r.status === 'partial').length
        const nPaid = rows.filter(r => r.status === 'paid').length
        return (
          <DetailModal
            title={`${t('Taarifa ya Salio la Mvuvi:', 'Fisherman Balance Details:')} ${viewSupBal.name}`}
            subtitle={`${viewSupBal.no || viewSupBal.id} · ${viewSupBal.site} · ${viewSupBal.phone}`}
            badge={
              <Badge variant={bal > 0 ? 'amber' : 'green'}>
                {bal > 0 ? t('Anadai Malipo', 'Payment Due') : t('Amelipwa Yote', 'Settled')}
              </Badge>
            }
            onClose={() => setViewSupBal(null)}
            fields={[
              { label: t('Jina la Mvuvi', 'Fisherman Name'), value: viewSupBal.name },
              { label: t('Kundi', 'Category'), value: viewSupBal.cat },
              { label: t('Mwalo', 'Landing Station'), value: viewSupBal.site },
              { label: t('Namba ya Simu', 'Phone Number'), value: viewSupBal.phone, mono: true },
              { label: t('Thamani ya Samaki', 'Gross Catch Value'), value: tzs(stmt.totalCatchValue), mono: true },
              { label: t('Makato ya Deni', 'Credit Deductions'), value: tzs(stmt.totalCatchDeductions), mono: true },
              { label: t('Thamani Halisi', 'Net Catch Value'), value: tzs(stmt.totalCatchNet), mono: true },
              { label: t('Jumla Aliyolipwa', 'Total Cash Disbursed'), value: tzs(stmt.totalCatchPaid), mono: true },
              { label: t('Salio la Samaki', 'Fish Balance Owed'), value: tzs(stmt.fishOwed), mono: true },
              { label: t('Deni la Mafuta', 'Fuel Debt'), value: tzs(stmt.fuelDebt), mono: true },
              { label: t('Deni la Matengenezo', 'Maintenance Debt'), value: tzs(stmt.maintDebt), mono: true },
              { label: t('Salio Halisi la Akaunti', 'Net Account Balance'), value: tzs(stmt.netBalance), mono: true, highlight: true },
              { label: t('Manunuzi Yaliyolipwa', 'Purchases Paid'), value: `${nPaid} ${t('yamelipwa', 'paid')} · ${nPartial} ${t('kiasi', 'partial')} · ${nUnpaid} ${t('hayajalipwa', 'unpaid')}` },
            ]}
            actions={
              bal > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const target = viewSupBal
                    setViewSupBal(null)
                    setPayTarget(target)
                    setAmt(String(bal))
                  }}
                  className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-700"
                >
                  <CreditCard size={13} /> {t('Lipa Deni Sasa', 'Disburse Payment Now')}
                </button>
              )
            }
          />
        )
      })()}

      {viewPay && (
        <DetailModal
          title={`${t('Risiti ya Malipo:', 'Payment Voucher Details:')} ${viewPay.ref}`}
          subtitle={`${viewPay.supName} · ${viewPay.date}`}
          badge={<Badge variant="green">{t('Imelipwa', 'Disbursed')}</Badge>}
          onClose={() => setViewPay(null)}
          fields={[
            { label: t('Namba ya Risiti', 'Voucher #'), value: viewPay.ref, mono: true },
            { label: t('Mpokeaji', 'Recipient'), value: viewPay.supName },
            ...(viewPay.pur ? [{ label: t('Manunuzi', 'Purchase'), value: viewPay.pur, mono: true }] : []),
            { label: t('Njia ya Malipo', 'Payment Channel'), value: viewPay.m },
            { label: t('Kiasi Kilicholipwa', 'Amount Disbursed'), value: tzs(viewPay.amt), mono: true, highlight: true },
            { label: t('Tarehe ya Malipo', 'Payment Date'), value: viewPay.date, mono: true },
          ]}
          actions={
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-secondary text-xs"
            >
              <Printer size={13} /> {t('Chapa Risiti', 'Print Voucher')}
            </button>
          }
        />
      )}

      {/* Make Payment Modal */}
      {payTarget && (
        <Modal
          title={t(`Lipa Deni: ${payTarget.name}`, `Disburse Payment: ${payTarget.name}`)}
          subtitle={t(`Salio Analodai: ${tzs(supBal(s, payTarget.id))}`, `Current Balance Owed: ${tzs(supBal(s, payTarget.id))}`)}
          onClose={() => setPayTarget(null)}
        >
          <div className="flex flex-col gap-4">
            <Field label={t('Kiasi cha Kulipa (TZS)', 'Amount to Disburse (TZS)')}>
              <input
                type="number"
                value={amt}
                onChange={e => setAmt(e.target.value)}
                max={supBal(s, payTarget.id)}
                className="input-field font-mono text-lg font-bold"
              />
              {+amt > supBal(s, payTarget.id) && (
                <span className="text-[11px] text-rose-600 font-semibold">
                  {t('Kiasi kinazidi salio la mvuvi.', 'Amount exceeds the supplier balance.')}
                </span>
              )}
            </Field>

            <Field label={t('Njia ya Malipo', 'Payment Channel')}>
              <select
                value={method}
                onChange={e => setMethod(e.target.value)}
                className="input-field font-semibold"
              >
                <option>M-Pesa (Mobile Money)</option>
                <option>Airtel Money</option>
                <option>Tigo Pesa</option>
                <option>CRDB Bank</option>
                <option>NMB Bank</option>
                <option>{t('Pesa Taslimu', 'Cash Voucher')}</option>
              </select>
            </Field>

            <button
              type="button"
              disabled={!(+amt > 0 && +amt <= supBal(s, payTarget.id))}
              onClick={handlePay}
              className="btn-primary bg-emerald-600 hover:bg-emerald-700 mt-2"
            >
              {t('Thibitisha Malipo & Toa Risiti', 'Confirm Disbursement & Generate Voucher')}
            </button>
          </div>
        </Modal>
      )}

      {/* Voucher Modal */}
      {voucher && (
        <ReceiptModal
          title="Payment Disbursement Voucher"
          lines={[
            ['Payee', voucher.sup],
            ['Landing Station', voucher.site],
            ['Disbursement Channel', voucher.method],
            ['Amount Paid', tzs(voucher.amt)],
            ['Date', voucher.date],
            ['Status', 'PROCESSED & APPROVED']
          ]}
          onClose={() => setVoucher(null)}
        />
      )}
    </div>
  )
}
