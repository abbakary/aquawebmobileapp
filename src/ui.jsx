import React, { useState, useEffect } from 'react'
import {
  Fish,
  Scale,
  Anchor,
  ShieldCheck,
  QrCode,
  Share2,
  Printer,
  RefreshCw,
  WifiOff,
  Wifi,
  Smartphone,
  Eye,
  CheckCircle2,
  Edit3,
  Trash2,
  CloudUpload,
  Gauge
} from 'lucide-react'
import { getInitialLang } from './i18n'
import { useDevice } from './device'
import { useS } from './store'

const uiT = (sw, en) => (getInitialLang() === 'sw' ? sw : en)

export const f = n => Math.round(+n || 0).toLocaleString('en-US')
export const tzs = n => 'TZS ' + f(n)
export const fmtT = t => new Date(t).toLocaleString('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})
export const atOf = b => b.at || (b.date || '') + 'T00:00'

export const FISH_PHOTOS = {
  'Nile Perch': '/fish/nile-perch.jpg',
  'Tilapia': '/fish/tilapia.jpg',
  'Dagaa (Sardines)': '/fish/dagaa-sardines.jpg',
  'Catfish': '/fish/catfish.jpg'
}

export function FishPhoto({ sp, size = 40, className = '' }) {
  const [err, setErr] = useState(false)
  const normalized = Object.keys(FISH_PHOTOS).find(k => (sp || '').toLowerCase().includes(k.toLowerCase().split(' ')[0])) || 'Nile Perch'
  const src = FISH_PHOTOS[normalized]

  if (err || !src) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-blue-50 text-blue-700 border border-blue-200 shrink-0 ${className}`}
        style={{ width: size, height: size * 0.75 }}
      >
        <Fish size={size * 0.5} />
      </div>
    )
  }

  return (
    <div
      className={`relative rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100 ${className}`}
      style={{ width: size, height: size * 0.75 }}
    >
      <img
        src={src}
        alt={sp}
        loading="lazy"
        className="w-full h-full object-cover"
        onError={() => setErr(true)}
      />
    </div>
  )
}

export function Badge({ children, variant = 'neutral' }) {
  const styles = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-rose-50 text-rose-700 border-rose-200',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border whitespace-nowrap ${styles[variant] || styles.neutral}`}>
      {children}
    </span>
  )
}

export function Modal({ title, subtitle, onClose, close, children, maxWidth = 'max-w-2xl' }) {
  const handleClose = onClose || close

  useEffect(() => {
    if (!handleClose) return
    const onKey = e => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleClose])

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className={`modal-dialog ${maxWidth}`} onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mt-2.5 mb-0.5 sm:hidden shrink-0" />
        <div className="modal-header">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 m-0 leading-snug">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 m-0 mt-1">{subtitle}</p>}
          </div>
          {handleClose && (
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close modal"
              className="text-slate-400 hover:text-slate-800 hover:bg-slate-200/70 w-10 h-10 rounded-xl flex items-center justify-center transition shrink-0 text-base font-bold"
            >
              ✕
            </button>
          )}
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  )
}

export function DetailModal({
  title,
  subtitle,
  badge,
  onClose,
  fields = [],
  sections = [],
  actions = null,
  maxWidth = 'max-w-2xl'
}) {
  if (!title) return null
  return (
    <Modal title={title} subtitle={subtitle} onClose={onClose} maxWidth={maxWidth}>
      <div className="flex flex-col gap-4">
        {badge && (
          <div className="flex items-center justify-between bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {uiT('Hali ya Sasa', 'Current Status')}
            </span>
            {badge}
          </div>
        )}

        {fields.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fields.map((fld, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border ${
                  fld.highlight
                    ? 'bg-blue-50/70 border-blue-200'
                    : 'bg-slate-50/80 border-slate-200/80'
                } ${fld.fullWidth ? 'sm:col-span-2' : ''}`}
              >
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {fld.label}
                </div>
                <div
                  className={`mt-1 text-sm font-bold text-slate-900 break-words ${
                    fld.mono ? 'font-mono' : ''
                  }`}
                >
                  {fld.value ?? '—'}
                </div>
              </div>
            ))}
          </div>
        )}

        {sections.map((sec, idx) => (
          <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              {sec.icon}
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider m-0">
                {sec.title}
              </h4>
            </div>
            <div className="p-3.5">{sec.content}</div>
          </div>
        ))}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs ml-auto"
          >
            {uiT('Funga', 'Close')}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function ViewBtn({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={e => {
        e.stopPropagation()
        onClick()
      }}
      className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition"
    >
      <Eye size={14} />
      <span>{label || uiT('Angalia', 'View')}</span>
    </button>
  )
}

export function Field({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-baseline">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{label}</label>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

export function ScaleTerminal({ weight, onTare, onSimulateWeigh, onManualWeight, unit = 'kg' }) {
  const [manualMode, setManualMode] = useState(false)
  const [manualVal, setManualVal] = useState(weight || '')

  useEffect(() => {
    if (!manualMode) setManualVal(weight || '')
  }, [weight, manualMode])

  const applyManual = () => {
    const num = parseFloat(manualVal)
    if (!Number.isNaN(num) && num >= 0 && onManualWeight) {
      onManualWeight(num)
    }
    setManualMode(false)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Mobile-first Clean Scale Card matching Screen 6 */}
      <div className="sm:hidden bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="relative h-40 bg-slate-900">
          <img src="/photos/scale-dock.png" alt="Dock Digital Scale" className="w-full h-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-slate-950/80 to-transparent" />
          <span className="absolute bottom-2.5 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-200" />
            {uiT('Imeunganishwa', 'Connected')}
          </span>
          <span className="absolute bottom-2.5 left-3 text-white text-xs font-semibold">
            {uiT('Mizani ya Kidijitali · COM4', 'Digital Scale · COM4')}
          </span>
        </div>

        <div className="p-4 text-center">
          <div className="text-xs font-semibold text-slate-500">
            {uiT('Usomaji wa Mizani', 'Scale Reading')}
          </div>
          <div className="text-3xl font-extrabold font-mono text-emerald-600 tracking-tight mt-0.5 tabular-nums">
            {Number(weight || 0).toFixed(1)} {unit}
          </div>

          {manualMode && onManualWeight && (
            <div className="mt-3 flex gap-2">
              <input
                type="number"
                step="0.1"
                value={manualVal}
                onChange={e => setManualVal(e.target.value)}
                placeholder="0.0"
                className="input-field font-mono font-bold text-center"
                autoFocus
              />
              <button type="button" onClick={applyManual} className="btn-primary px-4">
                {uiT('Weka', 'Set')}
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5 mt-3.5">
            <button
              type="button"
              onClick={() => (onManualWeight ? setManualMode(v => !v) : onTare?.())}
              className="min-h-[48px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold flex flex-col items-center justify-center gap-1 transition"
            >
              <Edit3 size={15} className="text-slate-600" />
              <span>{onManualWeight ? uiT('Ingiza Kwa Mkono', 'Capture Manually') : uiT('Sifuri (Tare)', 'Tare (Zero)')}</span>
            </button>
            <button
              type="button"
              onClick={onSimulateWeigh}
              className="min-h-[48px] px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold flex flex-col items-center justify-center gap-1 transition"
            >
              <RefreshCw size={15} className="text-emerald-700" />
              <span>{uiT('Soma Kwenye Mizani', 'Capture from Scale')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Industrial Scale Terminal */}
      <div className="hidden sm:flex scale-terminal">
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
          <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
            <Scale size={14} /> {uiT('MIZANI YA KIDIJITALI IMEUNGANISHWA (COM4)', 'CONNECTED DIGITAL SCALE · PANASONIC INDUSTRIAL (COM4)')}
          </span>
          <span className="bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800 text-[10px] font-mono">
            {uiT('IMETULIA', 'STABLE')}
          </span>
        </div>
        <div className="flex flex-row gap-3 items-center">
          <div className="scale-screen flex-1 w-full">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">{uiT('UZITO WA JUMLA', 'GROSS WEIGHT')}</div>
              <div className="scale-digits">{Number(weight || 0).toFixed(1)}</div>
            </div>
            <div className="text-right">
              <div className="scale-unit">{unit}</div>
              <div className="text-[11px] text-emerald-500 font-mono">{uiT('UZITO WA CHOMBO: 0.0 kg', 'TARE: 0.0 kg')}</div>
            </div>
          </div>
          <div className="w-28 h-20 rounded-lg overflow-hidden border border-slate-700 shrink-0 relative bg-slate-900 shadow">
            <img src="/photos/scale-dock.png" alt="Dock Scale" className="w-full h-full object-cover" />
            <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[8px] text-emerald-400 text-center font-mono py-0.5">{uiT('MIZANI YA MWALO', 'DOCK SENSOR')}</span>
          </div>
        </div>
        <div className="scale-controls">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onTare}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold rounded border border-slate-700 transition"
            >
              {uiT('SIFURI (TARE)', 'TARE (ZERO)')}
            </button>
            <button
              type="button"
              onClick={onSimulateWeigh}
              className="px-3 py-1.5 bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-300 text-xs font-semibold rounded border border-emerald-700/60 flex items-center gap-1.5 transition"
            >
              <RefreshCw size={12} /> {uiT('Soma Uzito Moja kwa Moja', 'Auto-Capture Scale')}
            </button>
          </div>
          <span className="text-[11px] text-slate-400">{uiT('Imepimwa: 05/11/2026', 'Calibrated: 05/11/2026')}</span>
        </div>
      </div>
    </div>
  )
}

export function ReceiptModal({ title, lines, onClose, qrData }) {
  return (
    <Modal title={title} subtitle={uiT('Risiti Rasmi ya Manunuzi na Malipo ya FishTrade', 'Official FishTrade Delivery & Financial Voucher')} onClose={onClose}>
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col gap-3 font-mono text-xs text-slate-800">
        <div className="flex justify-between items-start border-b border-slate-200 pb-3">
          <div>
            <b className="text-sm font-sans text-slate-900">AQUACATCH · FISHTRADE ERP</b>
            <div className="text-[11px] text-slate-500 font-sans">{uiT('Biashara ya Samaki Ziwa Victoria', 'Lake Victoria Seafood Operations')}</div>
          </div>
          <div className="text-right">
            <span className="text-slate-400 text-[10px]">{uiT('KUMBUKUMBU HALALI', 'VERIFIED RECORD')}</span>
            <div className="text-emerald-600 font-bold">{uiT('IMEIDHINISHWA', 'APPROVED')}</div>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 py-2">
          {lines.map((l, i) => (
            <div key={i} className="flex justify-between gap-3 border-b border-dashed border-slate-200 py-1">
              {typeof l === 'string' ? <span>{l}</span> : <><span className="text-slate-500">{l[0]}</span><b className="text-right">{l[1]}</b></>}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[11px] text-slate-500">
          <span>{uiT('Ufuatiliaji wa QR: UMEWASHWA', 'Batch QR Traceability: ENABLED')}</span>
          <span>{uiT('Inakidhi FiRCIS', 'FiRCIS Compliant')}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-1">
        <a
          href={'https://wa.me/?text=' + encodeURIComponent(title + '\n' + lines.map(x => Array.isArray(x) ? x.join(': ') : x).join('\n'))}
          target="_blank"
          rel="noreferrer"
          className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-center justify-center no-underline"
        >
          <Share2 size={16} /> {uiT('Tuma kwa WhatsApp', 'Send via WhatsApp')}
        </a>
        <button
          type="button"
          onClick={() => window.print()}
          className="btn-secondary"
        >
          <Printer size={16} /> {uiT('Chapa Risiti', 'Print Voucher')}
        </button>
      </div>
    </Modal>
  )
}

export function TraceabilityModal({ batch, onClose }) {
  if (!batch) return null

  return (
    <Modal title={`Traceability Chain: ${batch.no}`} subtitle="Lake Victoria to Processing Factory Journey" onClose={onClose} maxWidth="max-w-2xl">
      <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 text-white mb-1">
        <img
          src="/photos/traceability-flow.png"
          alt="Traceability Flow"
          className="w-full h-36 object-cover opacity-65"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent p-4 flex flex-col justify-end">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] text-sky-400 font-mono uppercase tracking-wider">Certified GS1 & FiRCIS Traceable</span>
              <h4 className="text-lg font-bold m-0">{batch.sp} ({batch.grade})</h4>
            </div>
            <div className="bg-white/10 backdrop-blur px-3 py-1 rounded-lg border border-white/20 text-xs font-mono font-bold">
              {batch.kg} KG
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2 text-xs">
          <span className="font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
            <Anchor size={14} className="text-blue-600" /> 1. Origin & Catch
          </span>
          <div className="flex justify-between"><span className="text-slate-500">Landing Site:</span><b className="text-slate-800">{batch.site}</b></div>
          <div className="flex justify-between"><span className="text-slate-500">Supplier:</span><b className="text-slate-800">{batch.sup}</b></div>
          <div className="flex justify-between"><span className="text-slate-500">Harvest Date:</span><b className="text-slate-800 font-mono">{batch.date}</b></div>
          <div className="flex justify-between"><span className="text-slate-500">Purchase ID:</span><b className="text-blue-700 font-mono">{batch.pur}</b></div>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2 text-xs">
          <span className="font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" /> 2. Quality & Cold Chain
          </span>
          <div className="flex justify-between"><span className="text-slate-500">Inspection Status:</span><Badge variant={batch.st === 'accepted' ? 'green' : 'amber'}>{batch.st}</Badge></div>
          <div className="flex justify-between"><span className="text-slate-500">Reception Temp:</span><b className="text-emerald-700 font-mono">{batch.temp || 2.1}°C (Compliant)</b></div>
          <div className="flex justify-between"><span className="text-slate-500">Warehouse:</span><b className="text-slate-800">{batch.wh}</b></div>
          <div className="flex justify-between"><span className="text-slate-500">Current Stock:</span><b className="text-slate-900 font-mono">{batch.rem} kg remaining</b></div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-lg border border-blue-200 flex items-center justify-center p-1 text-slate-900 shrink-0">
            <QrCode size={36} />
          </div>
          <div>
            <b className="text-sm text-blue-950">QR Code Traceability Tag</b>
            <p className="text-xs text-blue-800 m-0">Scan at processing plant or customs export point</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="btn-secondary bg-white text-xs"
        >
          <Printer size={14} /> Print Tag
        </button>
      </div>
    </Modal>
  )
}

export function PWAInstallButton({ variant = 'default' }) {
  const device = useDevice()
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    const handler = e => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (device.isStandalone) return null

  const triggerInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setDeferredPrompt(null)
    } else {
      setShowGuide(true)
    }
  }

  const label = device.isIOS
    ? uiT('Sakinisha iPhone App', 'Add to iPhone Home')
    : uiT('Sakinisha App', 'Install App')

  return (
    <>
      <button
        type="button"
        onClick={triggerInstall}
        className={
          variant === 'drawer'
            ? 'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/15 transition'
            : 'btn-secondary text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
        }
      >
        <span className="flex items-center gap-2">
          <Smartphone size={14} /> {label}
        </span>
        {variant === 'drawer' && <span className="text-[10px] text-sky-200 uppercase">PWA</span>}
      </button>

      {showGuide && (
        <Modal
          title={device.isIOS ? uiT('Sakinisha kwenye iPhone / iPad', 'Install on iPhone / iPad') : uiT('Sakinisha App kwenye Simu', 'Install Mobile App')}
          onClose={() => setShowGuide(false)}
          maxWidth="max-w-md"
        >
          {device.isIOS ? (
            <div className="space-y-3 text-sm text-slate-700">
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
                {uiT('Kwenye Safari, AquaCatch inaweza kufanya kazi kama App kamili hata bila intaneti.', 'In Safari, AquaCatch installs as a full-screen app with offline storage at lake piers.')}
              </div>
              <ol className="list-decimal pl-5 space-y-2 text-xs leading-relaxed">
                <li>{uiT('Bofya kitufe cha Share (mraba wenye mshale kwenda juu) chini ya Safari.', 'Tap the Share button (square with upward arrow) in the Safari toolbar.')}</li>
                <li>{uiT('Shuka chini kisha chagua "Add to Home Screen".', 'Scroll down and tap "Add to Home Screen".')}</li>
                <li>{uiT('Thibitisha "Add" — ikoni ya AquaCatch itatokea kwenye skrini yako.', 'Tap "Add" — the AquaCatch icon will appear on your Home Screen.')}</li>
              </ol>
            </div>
          ) : (
            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <p>{uiT('Fungua menyu ya kivinjari (⋮) kisha chagua "Install app" au "Add to Home screen".', 'Open your browser menu (⋮) and tap "Install app" or "Add to Home screen" for offline access.')}</p>
            </div>
          )}
        </Modal>
      )}
    </>
  )
}

export function OfflineIndicator() {
  const store = useS()
  const device = useDevice()
  const [queueOpen, setQueueOpen] = useState(false)

  if (!store) return null
  const { isOnline, isSlowNetwork, pendingSyncCount, pendingQueue = [], syncing, syncError, syncNow, clearFailedQueueItem } = store

  if (isOnline && !isSlowNetwork && pendingSyncCount === 0) return null

  return (
    <>
      <div className="offline-banner">
        <div className="flex items-center gap-2 min-w-0">
          {!isOnline ? (
            <WifiOff size={15} className="text-amber-400 shrink-0" />
          ) : isSlowNetwork ? (
            <Gauge size={15} className="text-sky-300 shrink-0" />
          ) : (
            <CloudUpload size={15} className="text-emerald-400 shrink-0" />
          )}
          <span className="truncate">
            {!isOnline
              ? uiT('Nje ya Mtandao — Data inahifadhiwa', 'Offline Mode — Saved locally')
              : pendingSyncCount > 0
                ? uiT(`${pendingSyncCount} zinangoja kutumwa`, `${pendingSyncCount} queued to sync`)
                : uiT('Mtandao Mzito (2G/3G)', `Slow Network (${String(device.connectionType || '3g').toUpperCase()})`)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {pendingSyncCount > 0 && (
            <button
              type="button"
              onClick={() => setQueueOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold"
            >
              {pendingSyncCount}
            </button>
          )}
          {isOnline && pendingSyncCount > 0 && (
            <button
              type="button"
              onClick={() => syncNow?.()}
              disabled={syncing}
              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1"
            >
              <RefreshCw size={11} className={syncing ? 'animate-spin' : ''} />
              {syncing ? uiT('Inatuma...', 'Syncing...') : uiT('Tuma Sasa', 'Sync')}
            </button>
          )}
        </div>
      </div>

      {queueOpen && (
        <Modal
          title={uiT('Foleni ya Kutuma Mtandaoni', 'Offline Sync Queue')}
          subtitle={uiT('Miamala iliyorekodiwa bila intaneti itatumwa kiotomatiki', 'Transactions recorded offline replay automatically once connected')}
          onClose={() => setQueueOpen(false)}
          maxWidth="max-w-lg"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="flex items-center gap-2 font-semibold text-slate-700">
                {isOnline ? <Wifi size={15} className="text-emerald-600" /> : <WifiOff size={15} className="text-amber-600" />}
                <span>{device.networkLabel}</span>
              </div>
              <button
                type="button"
                disabled={!isOnline || syncing || pendingSyncCount === 0}
                onClick={() => syncNow?.()}
                className="btn-primary text-xs py-1.5 px-3"
              >
                <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
                {syncing ? uiT('Inatuma...', 'Syncing...') : uiT('Tuma Yote', 'Sync All')}
              </button>
            </div>

            {syncError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {syncError}
              </div>
            )}

            {pendingQueue.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 size={24} className="text-emerald-600 mx-auto mb-1.5" />
                {uiT('Kila kitu kimeshasawazishwa!', 'All records are synced with the server.')}
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {pendingQueue.map(item => (
                  <div key={item.id} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <b className="text-slate-900 block truncate">{item.label || item.op}</b>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {new Date(item.createdAt).toLocaleTimeString()} · {item.op}
                      </span>
                      {item.lastError && (
                        <span className="block text-[11px] text-rose-600 mt-0.5">{item.lastError}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => clearFailedQueueItem?.(item.id)}
                      aria-label="Discard queued item"
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  )
}

export const Sheet = ({ title, onClose, children }) => (
  <Modal title={title} onClose={onClose}>
    {children}
  </Modal>
)

export const Btn = ({ c = '', children, ...p }) => (
  <button {...p} className={`btn-primary ${c}`}>
    {children}
  </button>
)

export const Fab = ({ onClick, children }) => (
  <button onClick={onClick} className="btn-primary fixed bottom-20 right-4 sm:right-6 shadow-xl z-40 rounded-full py-3 px-5">
    {children}
  </button>
)

export const Seg = ({ v, set, items }) => (
  <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-semibold overflow-x-auto no-scrollbar">
    {items.map(i => (
      <button
        key={i}
        type="button"
        onClick={() => set(i)}
        className={`px-3 py-2 sm:py-1.5 rounded-lg transition whitespace-nowrap ${v === i ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
      >
        {i}
      </button>
    ))}
  </div>
)

export const Empty = ({ t }) => (
  <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
    <Fish size={32} className="text-slate-400 mx-auto mb-2" />
    <p className="text-sm text-slate-500 m-0">{t}</p>
  </div>
)

export const Kpis = ({ a }) => (
  <div className="kpi-grid">
    {a.map(k => (
      <div className="kpi-card" key={k[0]}>
        <div className="kpi-content">
          <small>{k[0]}</small>
          <b>{k[1]}</b>
        </div>
      </div>
    ))}
  </div>
)

export const FishImg = ({ sp, s = 40 }) => (
  <FishPhoto sp={sp} size={s} />
)

export const Scene = () => null
