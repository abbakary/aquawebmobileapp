import React, { useState } from 'react'
import {
  Users,
  UserPlus,
  DollarSign,
  CreditCard,
  CheckCircle2,
  Search,
  Shield,
  Printer,
  Edit3,
  Calendar,
  Building2,
  Wallet,
  Send
} from 'lucide-react'
import { useS, ROLES } from '../store'
import { Modal, Field, Badge, DetailModal, ViewBtn, f, tzs, fmtT } from '../ui'

const MOD_LABELS = {
  home: ['Nyumbani', 'Home'],
  hq: ['Makao Makuu', 'HQ Analytics'],
  buy: ['Manunuzi', 'Purchases'],
  fuel: ['Mafuta', 'Fuel & Credit'],
  maintenance: ['Matengenezo', 'Maintenance'],
  stock: ['Stoo', 'Stock'],
  sales: ['Mauzo', 'Sales'],
  quality: ['Ubora', 'Quality'],
  suppliers: ['Wavuvi', 'Fishermen'],
  payments: ['Malipo', 'Payments'],
  transport: ['Usafiri', 'Transport'],
  expenses: ['Matumizi', 'Expenses'],
  compliance: ['Vibali', 'Licences'],
  reports: ['Ripoti', 'Reports'],
  audit: ['Ukaguzi', 'Audit Log'],
  staff: ['Wafanyakazi', 'Staff']
}

const accessList = r => (ROLES[r] ? ROLES[r] : Object.keys(MOD_LABELS))

export default function Staff() {
  const { s, a, T, db, t } = useS()
  const me = s.staff.find(x => x.id === s.me)
  const owner = me?.role === 'Owner'
  const canManage = owner || me?.role === 'General Manager' || me?.role === 'Accountant'

  const [tab, setTab] = useState('staff') // 'staff' | 'payroll' | 'roles'
  const [search, setSearch] = useState('')
  const [payFilter, setPayFilter] = useState('All')

  // Add / Edit Employee Modal
  const [empModal, setEmpModal] = useState(null)

  // Pay Single Employee Modal
  const [payModal, setPayModal] = useState(false)
  const currentMonth = new Date().toISOString().slice(0, 7)
  const [payForm, setPayForm] = useState({
    staffId: s.staff[0]?.id || '',
    type: 'Mshahara',
    month: currentMonth,
    gross: String(s.staff[0]?.salary || 950000),
    deduction: '0',
    method: 'M-Pesa',
    note: ''
  })

  // Batch Monthly Payroll Modal
  const [batchModal, setBatchModal] = useState(false)
  const [batchMonth, setBatchMonth] = useState(currentMonth)
  const [batchMethod, setBatchMethod] = useState('Benki (CRDB / NMB)')

  // Payslip Receipt Modal
  const [payslip, setPayslip] = useState(null)
  const [viewEmp, setViewEmp] = useState(null)

  const assignable = Object.keys(ROLES).filter(r => owner || (r !== 'Owner' && r !== 'General Manager'))
  const canEdit = u => owner || (u.role !== 'Owner' && u.role !== 'General Manager')
  const isNew = empModal && !empModal.id
  const ownersCount = s.staff.filter(x => x.role === 'Owner' && x.active).length

  let empErr = ''
  if (empModal) {
    if (!empModal.name.trim()) {
      empErr = t('Ingiza jina kamili la mfanyakazi.', 'Enter the full name.')
    } else if (isNew && !/^[a-z0-9._]{3,}$/.test(empModal.username)) {
      empErr = t('Jina la kuingia: herufi ndogo au namba 3+.', 'Username: 3+ lowercase letters or numbers.')
    } else if (isNew && db.tenants.some(tn => tn.staff.some(x => x.username === empModal.username))) {
      empErr = t('Jina hilo la kuingia tayari linatumika.', 'That username is already used.')
    } else if ((isNew || empModal.pin) && !/^\d{4,6}$/.test(empModal.pin)) {
      empErr = t('PIN lazima iwe namba 4 hadi 6.', 'PIN must be 4 to 6 digits.')
    } else if (empModal.id === me?.id && !empModal.active) {
      empErr = t('Huwezi kuzima akaunti yako mwenyewe.', 'You cannot disable your own account.')
    } else if (
      empModal.was === 'Owner' &&
      (empModal.role !== 'Owner' || !empModal.active) &&
      ownersCount <= 1
    ) {
      empErr = t('Lazima awepo Mmiliki angalau mmoja aliye hai.', 'There must be at least one active Owner.')
    }
  }

  const saveEmployee = () => {
    if (empErr) return
    const { id, was, username, ...rest } = empModal
    if (id) {
      a.updStaff(id, { ...rest, pin: empModal.pin || undefined })
    } else {
      a.addStaff({ ...rest, username })
    }
    setEmpModal(null)
  }

  const activeStaff = s.staff.filter(u => u.active)
  const monthlyBudget = activeStaff.reduce((sum, u) => sum + (+u.salary || 0), 0)
  const payments = s.staffPayments || []
  const paidThisMonth = payments
    .filter(p => p.month === currentMonth)
    .reduce((sum, p) => sum + (+p.net || 0), 0)
  const pendingPayroll = Math.max(0, monthlyBudget - paidThisMonth)

  const filteredStaff = s.staff.filter(u => {
    const q = search.toLowerCase()
    return (
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q)
    )
  })

  const filteredPayments = payments.filter(p => {
    const q = search.toLowerCase()
    const matchType = payFilter === 'All' || p.type === payFilter
    const matchQ =
      !q ||
      (p.staffName || '').toLowerCase().includes(q) ||
      (p.no || '').toLowerCase().includes(q) ||
      (p.method || '').toLowerCase().includes(q)
    return matchType && matchQ
  })

  const openPayForEmployee = u => {
    setPayForm({
      staffId: u.id,
      type: 'Mshahara',
      month: currentMonth,
      gross: String(u.salary || 950000),
      deduction: '0',
      method: 'M-Pesa',
      note: ''
    })
    setPayModal(true)
  }

  const handlePayEmployeeChange = staffId => {
    const emp = s.staff.find(x => x.id === staffId)
    setPayForm(prev => ({
      ...prev,
      staffId,
      gross: prev.type === 'Mshahara' ? String(emp?.salary || 950000) : prev.gross
    }))
  }

  const submitPayEmployee = () => {
    const emp = s.staff.find(x => x.id === payForm.staffId)
    if (!emp || !(+payForm.gross > 0)) return
    a.payStaff({
      staffId: emp.id,
      staffName: emp.name,
      role: emp.role,
      type: payForm.type,
      month: payForm.month,
      gross: +payForm.gross,
      deduction: +payForm.deduction || 0,
      method: payForm.method,
      note: payForm.note
    })
    setPayModal(false)
    setTab('payroll')
  }

  const submitBatchPayroll = () => {
    if (activeStaff.length === 0) return
    a.runPayroll({
      month: batchMonth,
      method: batchMethod,
      items: activeStaff
    })
    setBatchModal(false)
    setTab('payroll')
  }

  const netPayPreview = Math.max(0, (+payForm.gross || 0) - (+payForm.deduction || 0))

  return (
    <div className="page-body">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 m-0">
            {t('Usimamizi wa Wafanyakazi & Mishahara', 'Employees & Payroll Management')}
          </h2>
          <p className="text-xs text-slate-500 m-0">
            {t(
              'Sajili wafanyakazi, weka mishahara, lipa mishahara/posho, na kagua ruhusa za mfumo.',
              'Register staff, set monthly salaries, disburse payroll & allowances, and manage system roles.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManage && (
            <>
              <button
                type="button"
                onClick={() => setBatchModal(true)}
                className="btn-secondary text-xs"
              >
                <Send size={15} /> {t('Lipa Mishahara Yote', 'Run Monthly Payroll')}
              </button>
              <button
                type="button"
                onClick={() => {
                  const first = s.staff[0]
                  setPayForm({
                    staffId: first?.id || '',
                    type: 'Mshahara',
                    month: currentMonth,
                    gross: String(first?.salary || 950000),
                    deduction: '0',
                    method: 'M-Pesa',
                    note: ''
                  })
                  setPayModal(true)
                }}
                className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-700"
              >
                <DollarSign size={15} /> + {t('Lipa Mfanyakazi', 'Pay Employee')}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() =>
              setEmpModal({
                name: '',
                phone: '',
                username: '',
                role: assignable.find(r => r === 'Purchasing Officer') || assignable[0],
                salary: '950000',
                pin: '',
                active: true,
                branch: 'all'
              })
            }
            className="btn-primary text-xs"
          >
            <UserPlus size={15} /> + {t('Sajili Mfanyakazi', 'Add Employee')}
          </button>
        </div>
      </div>

      {/* Executive KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap blue">
            <Users size={22} />
          </div>
          <div className="kpi-content">
            <small>{t('Wafanyakazi Hai', 'Active Employees')}</small>
            <b>{activeStaff.length} / {s.staff.length}</b>
            <span className="kpi-sub">{t('Katika matawi yote', 'Across all branches')}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap purple">
            <Wallet size={22} />
          </div>
          <div className="kpi-content">
            <small>{t('Bajeti ya Mishahara / Mwezi', 'Monthly Payroll Budget')}</small>
            <b>{tzs(monthlyBudget)}</b>
            <span className="kpi-sub">{t('Mishahara ya msingi', 'Base monthly salaries')}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap green">
            <CheckCircle2 size={22} />
          </div>
          <div className="kpi-content">
            <small>{t('Imelipwa Mwezi Huu', 'Paid This Month')}</small>
            <b className="text-emerald-700">{tzs(paidThisMonth)}</b>
            <span className="kpi-sub">{payments.filter(p => p.month === currentMonth).length} {t('miamala ya malipo', 'payment vouchers')}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap amber">
            <CreditCard size={22} />
          </div>
          <div className="kpi-content">
            <small>{t('Salio la Mishahara', 'Pending Payroll')}</small>
            <b className="text-amber-700">{tzs(pendingPayroll)}</b>
            <span className="kpi-sub">{t('Mwezi wa', 'For month')} {currentMonth}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setTab('staff')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              tab === 'staff' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users size={14} /> {t('Orodha ya Wafanyakazi', 'Employees & Salaries')} ({s.staff.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('payroll')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              tab === 'payroll' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <DollarSign size={14} /> {t('Malipo ya Mishahara & Posho', 'Payroll & Payments')} ({payments.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('roles')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              tab === 'roles' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Shield size={14} /> {t('Majukumu & Ruhusa', 'Roles & Permissions')} ({Object.keys(ROLES).length})
          </button>
        </div>

        {tab !== 'roles' && (
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('Tafuta mfanyakazi au namba...', 'Search employee or voucher...')}
              className="input-field pl-9 py-1.5 text-xs"
            />
          </div>
        )}
      </div>

      {/* TAB 1: EMPLOYEES & SALARIES */}
      {tab === 'staff' && (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('Mfanyakazi', 'Employee')}</th>
                <th>{t('Wadhifa', 'Role')}</th>
                <th>{t('Tawi', 'Branch')}</th>
                <th>{t('Mshahara / Mwezi', 'Monthly Salary')}</th>
                <th>{t('Hali', 'Status')}</th>
                <th className="text-right">{t('Vitendo', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map(u => {
                const branchName =
                  u.branch && u.branch !== 'all'
                    ? T.branches.find(b => b.id === u.branch)?.name || u.branch
                    : t('Matawi Yote (Makao Makuu)', 'All Branches (HQ)')
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {u.name
                            .split(' ')
                            .slice(0, 2)
                            .map(w => w[0])
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div>
                          <b className="text-slate-900 block">
                            {u.name} {u.id === me?.id && <span className="text-blue-700 text-xs">{t('(Wewe)', '(You)')}</span>}
                          </b>
                          <small className="text-slate-500 font-mono">
                            @{u.username} · {u.phone || '0754 000 111'}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge variant={u.role === 'Owner' ? 'blue' : u.role === 'General Manager' ? 'green' : 'neutral'}>
                        {u.role}
                      </Badge>
                    </td>
                    <td>
                      <span className="text-xs text-slate-700 flex items-center gap-1">
                        <Building2 size={13} className="text-slate-400" /> {branchName}
                      </span>
                    </td>
                    <td>
                      <b className="font-mono text-slate-900">{tzs(u.salary || 0)}</b>
                    </td>
                    <td>
                      <Badge variant={u.active ? 'green' : 'red'}>
                        {u.active ? t('Hai', 'Active') : t('Amezimwa', 'Disabled')}
                      </Badge>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <ViewBtn onClick={() => setViewEmp({ ...u, branchName })} />
                        {canManage && u.active && (
                          <button
                            type="button"
                            onClick={() => openPayForEmployee(u)}
                            className="btn-primary text-xs py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700"
                          >
                            <DollarSign size={13} /> {t('Lipa', 'Pay')}
                          </button>
                        )}
                        {canEdit(u) && (
                          <button
                            type="button"
                            onClick={() =>
                              setEmpModal({
                                ...u,
                                salary: String(u.salary || 950000),
                                was: u.role,
                                pin: ''
                              })
                            }
                            className="btn-secondary text-xs py-1 px-2.5"
                          >
                            <Edit3 size={13} /> {t('Hariri', 'Edit')}
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
      )}

      {/* TAB 2: PAYROLL & PAYMENTS LEDGER */}
      {tab === 'payroll' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {['All', 'Mshahara', 'Posho', 'Advance'].map(tp => (
              <button
                key={tp}
                type="button"
                onClick={() => setPayFilter(tp)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  payFilter === tp
                    ? 'bg-blue-900 text-white border-blue-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tp === 'All' ? t('Malipo Yote', 'All Payments') : tp}
              </button>
            ))}
          </div>

          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('Risiti #', 'Voucher #')}</th>
                  <th>{t('Mfanyakazi', 'Employee')}</th>
                  <th>{t('Aina & Mwezi', 'Type & Month')}</th>
                  <th>{t('Mshahara Ghafi', 'Gross')}</th>
                  <th>{t('Makato', 'Deductions')}</th>
                  <th>{t('Kiasi Halisi', 'Net Paid')}</th>
                  <th>{t('Njia ya Malipo', 'Channel')}</th>
                  <th className="text-right">{t('Payslip', 'Payslip')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400 text-xs">
                      {t('Hakuna rekodi za malipo ya wafanyakazi bado.', 'No employee payment records yet.')}
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map(p => (
                    <tr key={p.id}>
                      <td>
                        <b className="font-mono text-blue-700">{p.no}</b>
                        <small className="block font-mono text-slate-400">{p.date}</small>
                      </td>
                      <td>
                        <b className="text-slate-900 block">{p.staffName}</b>
                        <small className="text-slate-500">{p.role}</small>
                      </td>
                      <td>
                        <Badge variant={p.type === 'Mshahara' ? 'blue' : p.type === 'Posho' ? 'green' : 'amber'}>
                          {p.type}
                        </Badge>
                        <small className="block font-mono text-slate-400 mt-0.5">{p.month}</small>
                      </td>
                      <td>
                        <span className="font-mono text-slate-700">{tzs(p.gross)}</span>
                      </td>
                      <td>
                        <span className="font-mono text-rose-600">
                          {p.deduction > 0 ? `-${tzs(p.deduction)}` : '-'}
                        </span>
                      </td>
                      <td>
                        <b className="font-mono text-emerald-700">{tzs(p.net)}</b>
                      </td>
                      <td>
                        <span className="text-xs font-medium text-slate-700">{p.method}</span>
                        {p.note && <small className="block text-slate-400 truncate max-w-[160px]">{p.note}</small>}
                      </td>
                      <td className="text-right">
                        <ViewBtn onClick={() => setPayslip(p)} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewEmp && (() => {
        const empPays = (s.staffPayments || []).filter(p => p.staffId === viewEmp.id)
        const totalEmpPaid = empPays.reduce((sum, p) => sum + (p.net || 0), 0)
        return (
          <DetailModal
            title={`${t('Taarifa za Mfanyakazi:', 'Employee Details:')} ${viewEmp.name}`}
            subtitle={`@${viewEmp.username} · ${viewEmp.role} · ${viewEmp.branchName}`}
            badge={
              <Badge variant={viewEmp.active ? 'green' : 'red'}>
                {viewEmp.active ? t('Hai', 'Active') : t('Amezimwa', 'Disabled')}
              </Badge>
            }
            onClose={() => setViewEmp(null)}
            fields={[
              { label: t('Jina Kamili', 'Full Name'), value: viewEmp.name },
              { label: t('Jina la Kuingia', 'Username'), value: `@${viewEmp.username}`, mono: true },
              { label: t('Wadhifa', 'Role'), value: viewEmp.role },
              { label: t('Tawi / Kituo', 'Branch / Station'), value: viewEmp.branchName },
              { label: t('Namba ya Simu', 'Phone Number'), value: viewEmp.phone || '0754 000 111', mono: true },
              { label: t('Mshahara wa Mwezi', 'Monthly Salary'), value: tzs(viewEmp.salary || 0), mono: true, highlight: true },
              { label: t('Jumla Aliyolipwa (Historia)', 'Total Paid (History)'), value: tzs(totalEmpPaid), mono: true },
              { label: t('Idadi ya Malipo', 'Payment Count'), value: `${empPays.length} ${t('malipo', 'payments')}`, mono: true },
            ]}
            actions={
              canManage && viewEmp.active && (
                <button
                  type="button"
                  onClick={() => {
                    const target = viewEmp
                    setViewEmp(null)
                    openPayForEmployee(target)
                  }}
                  className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-700"
                >
                  <DollarSign size={13} /> {t('Lipa Mshahara / Posho', 'Pay Salary / Allowance')}
                </button>
              )
            }
          />
        )
      })()}

      {/* TAB 3: ROLES & PERMISSIONS */}
      {tab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.keys(ROLES).map(r => (
            <div key={r} className="panel p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-blue-700" />
                  <b className="text-sm text-slate-900">{r}</b>
                </div>
                <Badge variant="blue">
                  {s.staff.filter(x => x.role === r).length} {t('wafanyakazi', 'staff')}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {accessList(r).map(k => (
                  <span
                    key={k}
                    className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200"
                  >
                    {MOD_LABELS[k] ? t(MOD_LABELS[k][0], MOD_LABELS[k][1]) : k}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: ADD / EDIT EMPLOYEE */}
      {empModal && (
        <Modal
          title={isNew ? t('Sajili Mfanyakazi Mpya', 'Register New Employee') : t('Hariri Taarifa za ', 'Edit Employee: ') + empModal.name}
          subtitle={t('Weka wadhifa, mshahara wa mwezi, na ruhusa za mfumo', 'Configure role, monthly base salary, and branch access')}
          onClose={() => setEmpModal(null)}
        >
          <div className="flex flex-col gap-4">
            <Field label={t('Jina Kamili', 'Full Name')}>
              <input
                type="text"
                placeholder={t('mf. Asha Juma (Afisa Manunuzi)', 'e.g. Asha Juma (Purchasing Officer)')}
                value={empModal.name}
                onChange={e => setEmpModal({ ...empModal, name: e.target.value })}
                className="input-field"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t('Namba ya Simu', 'Phone Number')}>
                <input
                  type="tel"
                  placeholder="0754 000 111"
                  value={empModal.phone}
                  onChange={e => setEmpModal({ ...empModal, phone: e.target.value })}
                  className="input-field font-mono"
                />
              </Field>
              <Field label={t('Jina la Kuingia (Username)', 'Username')}>
                <input
                  type="text"
                  disabled={!isNew}
                  autoCapitalize="none"
                  placeholder="asha.juma"
                  value={empModal.username}
                  onChange={e => setEmpModal({ ...empModal, username: e.target.value.toLowerCase() })}
                  className="input-field font-mono"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t('Wadhifa / Cheo', 'System Role')}>
                <select
                  value={empModal.role}
                  onChange={e => setEmpModal({ ...empModal, role: e.target.value })}
                  className="input-field"
                >
                  {assignable.map(r => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('Mshahara wa Msingi kwa Mwezi (TZS)', 'Monthly Base Salary (TZS)')}>
                <input
                  type="number"
                  value={empModal.salary}
                  onChange={e => setEmpModal({ ...empModal, salary: e.target.value })}
                  className="input-field font-mono font-bold"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t('Tawi Analofanyia Kazi', 'Branch Access')}>
                <select
                  value={empModal.branch || 'all'}
                  onChange={e => setEmpModal({ ...empModal, branch: e.target.value })}
                  className="input-field"
                >
                  <option value="all">{t('Matawi Yote (Makao Makuu)', 'All Branches (HQ)')}</option>
                  {T.branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label={
                  isNew
                    ? t('PIN ya Kuingia (Namba 4–6)', 'Login PIN (4–6 digits)')
                    : t('PIN Mpya (Acha wazi kubakiza)', 'New PIN (Leave blank to keep)')
                }
              >
                <input
                  type="password"
                  inputMode="numeric"
                  placeholder="••••"
                  value={empModal.pin}
                  onChange={e => setEmpModal({ ...empModal, pin: e.target.value })}
                  className="input-field font-mono"
                />
              </Field>
            </div>

            {!isNew && (
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={empModal.active}
                  onChange={e => setEmpModal({ ...empModal, active: e.target.checked })}
                  className="rounded text-blue-900"
                />
                <span>{t('Akaunti iko hai (Anaweza kuingia kwenye mfumo)', 'Account active (Can sign in)')}</span>
              </label>
            )}

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase block mb-2">
                {t('Moduli Anazoweza Kufungua:', 'Accessible Modules:')}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {accessList(empModal.role).map(k => (
                  <span
                    key={k}
                    className="px-2 py-0.5 rounded bg-white text-slate-700 text-[11px] font-semibold border border-slate-200"
                  >
                    {MOD_LABELS[k] ? t(MOD_LABELS[k][0], MOD_LABELS[k][1]) : k}
                  </span>
                ))}
              </div>
            </div>

            {empErr && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-semibold">
                {empErr}
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <button type="button" onClick={() => setEmpModal(null)} className="btn-secondary">
                {t('Ghairi', 'Cancel')}
              </button>
              <button
                type="button"
                disabled={!!empErr}
                onClick={saveEmployee}
                className="btn-primary"
              >
                <CheckCircle2 size={15} /> {isNew ? t('Sajili Mfanyakazi', 'Create Employee') : t('Hifadhi Mabadiliko', 'Save Changes')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: PAY SINGLE EMPLOYEE */}
      {payModal && (
        <Modal
          title={t('Lipa Mshahara / Posho ya Mfanyakazi', 'Disburse Employee Salary / Allowance')}
          subtitle={t('Malipo yanaingia moja kwa moja kwenye daftari la mishahara na matumizi', 'Automatically logs into payroll ledger and operating expenses')}
          onClose={() => setPayModal(false)}
        >
          <div className="flex flex-col gap-4">
            <Field label={t('Chagua Mfanyakazi', 'Select Employee')}>
              <select
                value={payForm.staffId}
                onChange={e => handlePayEmployeeChange(e.target.value)}
                className="input-field font-semibold"
              >
                {s.staff.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.role} ({tzs(u.salary || 0)})
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t('Aina ya Malipo', 'Payment Type')}>
                <select
                  value={payForm.type}
                  onChange={e => setPayForm({ ...payForm, type: e.target.value })}
                  className="input-field"
                >
                  <option value="Mshahara">{t('Mshahara wa Mwezi', 'Monthly Salary')}</option>
                  <option value="Posho">{t('Posho / Bonasi', 'Allowance / Bonus')}</option>
                  <option value="Advance">{t('Mkopo wa Mshahara (Advance)', 'Salary Advance')}</option>
                </select>
              </Field>
              <Field label={t('Mwezi wa Malipo', 'Payroll Month')}>
                <input
                  type="month"
                  value={payForm.month}
                  onChange={e => setPayForm({ ...payForm, month: e.target.value })}
                  className="input-field font-mono"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t('Kiasi Ghafi (TZS)', 'Gross Amount (TZS)')}>
                <input
                  type="number"
                  value={payForm.gross}
                  onChange={e => setPayForm({ ...payForm, gross: e.target.value })}
                  className="input-field font-mono font-bold"
                />
              </Field>
              <Field label={t('Makato (Advance / NSSF) (TZS)', 'Deductions (TZS)')}>
                <input
                  type="number"
                  value={payForm.deduction}
                  onChange={e => setPayForm({ ...payForm, deduction: e.target.value })}
                  className="input-field font-mono font-bold text-rose-600"
                />
              </Field>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-800 uppercase font-bold block">
                  {t('Kiasi Halisi Anacholipwa', 'Net Payable Amount')}
                </span>
                <span className="text-xl font-mono font-extrabold text-emerald-950">{tzs(netPayPreview)}</span>
              </div>
              <Badge variant="green">{payForm.type}</Badge>
            </div>

            <Field label={t('Njia ya Malipo', 'Payment Channel')}>
              <select
                value={payForm.method}
                onChange={e => setPayForm({ ...payForm, method: e.target.value })}
                className="input-field"
              >
                <option value="M-Pesa">M-Pesa (Vodacom)</option>
                <option value="Airtel Money">Airtel Money</option>
                <option value="Tigo Pesa">Tigo Pesa / Mixx by Yas</option>
                <option value="Benki (CRDB / NMB)">{t('Benki (CRDB / NMB)', 'Bank Transfer (CRDB / NMB)')}</option>
                <option value="Pesa Taslimu">{t('Pesa Taslimu (Cash)', 'Cash Voucher')}</option>
              </select>
            </Field>

            <Field label={t('Maelezo / Kumbukumbu', 'Payment Notes')}>
              <input
                type="text"
                placeholder={t('mf. Mshahara wa mwezi au posho ya kazi maalum', 'e.g. Monthly salary or overtime allowance')}
                value={payForm.note}
                onChange={e => setPayForm({ ...payForm, note: e.target.value })}
                className="input-field"
              />
            </Field>

            <div className="flex justify-between items-center pt-2">
              <button type="button" onClick={() => setPayModal(false)} className="btn-secondary">
                {t('Ghairi', 'Cancel')}
              </button>
              <button
                type="button"
                disabled={!(+payForm.gross > 0)}
                onClick={submitPayEmployee}
                className="btn-primary bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 size={16} /> {t('Thibitisha & Lipa', 'Confirm & Disburse')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 3: RUN BATCH MONTHLY PAYROLL */}
      {batchModal && (
        <Modal
          title={t('Lipa Mishahara ya Wafanyakazi Wote', 'Run Monthly Batch Payroll')}
          subtitle={t('Lipa wafanyakazi wote walio hai kwa mkupuo mmoja', 'Disburse base monthly salaries to all active employees at once')}
          onClose={() => setBatchModal(false)}
        >
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('Mwezi wa Mishahara', 'Payroll Month')}>
                <input
                  type="month"
                  value={batchMonth}
                  onChange={e => setBatchMonth(e.target.value)}
                  className="input-field font-mono"
                />
              </Field>
              <Field label={t('Njia ya Malipo', 'Disbursement Channel')}>
                <select
                  value={batchMethod}
                  onChange={e => setBatchMethod(e.target.value)}
                  className="input-field"
                >
                  <option value="Benki (CRDB / NMB)">{t('Benki (CRDB / NMB)', 'Bank Transfer (CRDB / NMB)')}</option>
                  <option value="M-Pesa">M-Pesa Bulk Pay</option>
                  <option value="Pesa Taslimu">{t('Pesa Taslimu', 'Cash')}</option>
                </select>
              </Field>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('Mfanyakazi', 'Employee')}</th>
                    <th>{t('Wadhifa', 'Role')}</th>
                    <th className="text-right">{t('Mshahara', 'Salary')}</th>
                  </tr>
                </thead>
                <tbody>
                  {activeStaff.map(u => (
                    <tr key={u.id}>
                      <td className="font-semibold text-slate-900">{u.name}</td>
                      <td className="text-xs text-slate-500">{u.role}</td>
                      <td className="text-right font-mono font-bold text-slate-900">{tzs(u.salary || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-blue-800 uppercase font-bold block">
                  {t('Jumla ya Mishahara Yote', 'Total Batch Payroll')} ({activeStaff.length} {t('wafanyakazi', 'staff')})
                </span>
                <span className="text-xl font-mono font-extrabold text-blue-950">{tzs(monthlyBudget)}</span>
              </div>
              <Badge variant="blue">{batchMonth}</Badge>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button type="button" onClick={() => setBatchModal(false)} className="btn-secondary">
                {t('Ghairi', 'Cancel')}
              </button>
              <button
                type="button"
                disabled={activeStaff.length === 0}
                onClick={submitBatchPayroll}
                className="btn-primary bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 size={16} /> {t('Lipa Wote Sasa', 'Disburse All Now')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 4: PAYSLIP RECEIPT */}
      {payslip && (
        <Modal
          title={t('Risiti ya Mshahara (Payslip)', 'Employee Payment Slip')}
          subtitle={payslip.no + ' · ' + payslip.date}
          onClose={() => setPayslip(null)}
          maxWidth="max-w-md"
        >
          <div className="flex flex-col gap-3 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">{t('Mfanyakazi:', 'Employee:')}</span>
                <b className="text-slate-900">{payslip.staffName}</b>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">{t('Wadhifa:', 'Role:')}</span>
                <b className="text-slate-900">{payslip.role}</b>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">{t('Aina & Mwezi:', 'Type & Month:')}</span>
                <b className="text-slate-900">{payslip.type} ({payslip.month})</b>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">{t('Kiasi Ghafi:', 'Gross Amount:')}</span>
                <b className="font-mono text-slate-900">{tzs(payslip.gross)}</b>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">{t('Makato:', 'Deductions:')}</span>
                <b className="font-mono text-rose-600">-{tzs(payslip.deduction)}</b>
              </div>
              <div className="flex justify-between text-sm font-bold text-emerald-700 pt-1">
                <span>{t('Kiasi Halisi Kilicholipwa:', 'Net Amount Paid:')}</span>
                <span className="font-mono">{tzs(payslip.net)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-[11px] text-slate-500">
                <span>{t('Njia:', 'Channel:')} {payslip.method}</span>
                <span>{t('Aliyeidhinisha:', 'Approved by:')} {payslip.paidBy}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => window.print()} className="btn-primary text-xs">
                <Printer size={14} /> {t('Chapisha Payslip', 'Print Payslip')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
