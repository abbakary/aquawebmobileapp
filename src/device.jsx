import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const DeviceContext = createContext(null)
const LOW_BW_KEY = 'fishtrade.low_bandwidth'

function readDeviceSnapshot() {
  if (typeof window === 'undefined') {
    return {
      os: 'desktop',
      browser: 'other',
      isIOS: false,
      isAndroid: false,
      isTouch: false,
      viewport: 'desktop',
      orientation: 'landscape',
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      width: 1280,
      height: 800,
      isStandalone: false,
      isOnline: true,
      connectionType: '4g',
      downlink: null,
      rtt: null,
      saveData: false,
      isSlowNetwork: false,
    }
  }

  const ua = navigator.userAgent || ''
  const platform = navigator.platform || ''
  const maxTouch = navigator.maxTouchPoints || 0

  const isIOS = /iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && maxTouch > 1)
  const isAndroid = /Android/i.test(ua)
  const os = isIOS ? 'ios' : isAndroid ? 'android' : 'desktop'

  const isEdge = /Edg|EdgiOS|EdgA/i.test(ua)
  const isFirefox = /Firefox|FxiOS/i.test(ua)
  const isChrome = /Chrome|CriOS/i.test(ua) && !isEdge
  const isSafari = /Safari/i.test(ua) && !/Chrome|CriOS|FxiOS|Edg|OPR/i.test(ua)
  const browser = isSafari ? 'safari' : isChrome ? 'chrome' : isEdge ? 'edge' : isFirefox ? 'firefox' : 'other'

  const width = window.innerWidth || 1280
  const height = window.innerHeight || 800
  const orientation = width > height ? 'landscape' : 'portrait'
  const isTouch = 'ontouchstart' in window || maxTouch > 0
  const viewport = width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop'

  const isStandalone = Boolean(
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: minimal-ui)').matches ||
    window.navigator.standalone === true
  )

  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  const isOnline = navigator.onLine !== false
  const connectionType = conn?.effectiveType || (isOnline ? '4g' : 'offline')
  const downlink = typeof conn?.downlink === 'number' ? conn.downlink : null
  const rtt = typeof conn?.rtt === 'number' ? conn.rtt : null
  const saveData = Boolean(conn?.saveData)
  const isSlowNetwork =
    !isOnline ||
    saveData ||
    connectionType === 'slow-2g' ||
    connectionType === '2g' ||
    connectionType === '3g' ||
    (downlink !== null && downlink > 0 && downlink < 1.2) ||
    (rtt !== null && rtt > 550)

  return {
    os,
    browser,
    isIOS,
    isAndroid,
    isTouch,
    viewport,
    orientation,
    isMobile: viewport === 'mobile',
    isTablet: viewport === 'tablet',
    isDesktop: viewport === 'desktop',
    width,
    height,
    isStandalone,
    isOnline,
    connectionType,
    downlink,
    rtt,
    saveData,
    isSlowNetwork,
  }
}

export function DeviceProvider({ children }) {
  const [info, setInfo] = useState(readDeviceSnapshot)
  const [manualLowBw, setManualLowBw] = useState(() => {
    try {
      const saved = localStorage.getItem(LOW_BW_KEY)
      return saved === null ? null : saved === '1'
    } catch {
      return null
    }
  })

  useEffect(() => {
    const sync = () => setInfo(readDeviceSnapshot())
    sync()

    window.addEventListener('resize', sync)
    window.addEventListener('orientationchange', sync)
    window.addEventListener('online', sync)
    window.addEventListener('offline', sync)

    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    conn?.addEventListener?.('change', sync)

    const mq = window.matchMedia?.('(display-mode: standalone)')
    mq?.addEventListener?.('change', sync)

    return () => {
      window.removeEventListener('resize', sync)
      window.removeEventListener('orientationchange', sync)
      window.removeEventListener('online', sync)
      window.removeEventListener('offline', sync)
      conn?.removeEventListener?.('change', sync)
      mq?.removeEventListener?.('change', sync)
    }
  }, [])

  const lowBandwidthMode = manualLowBw !== null ? manualLowBw : info.isSlowNetwork

  const setLowBandwidthMode = next => {
    setManualLowBw(next)
    try {
      if (next === null) localStorage.removeItem(LOW_BW_KEY)
      else localStorage.setItem(LOW_BW_KEY, next ? '1' : '0')
    } catch {
      // ignore storage failure
    }
  }

  useEffect(() => {
    const root = document.documentElement
    root.dataset.os = info.os
    root.dataset.browser = info.browser
    root.dataset.viewport = info.viewport
    root.dataset.orientation = info.orientation
    root.dataset.standalone = info.isStandalone ? 'true' : 'false'
    root.dataset.network = !info.isOnline ? 'offline' : lowBandwidthMode ? 'slow' : 'fast'
    root.dataset.touch = info.isTouch ? 'true' : 'false'
  }, [info.os, info.browser, info.viewport, info.orientation, info.isStandalone, info.isOnline, info.isTouch, lowBandwidthMode])

  const value = useMemo(() => ({
    ...info,
    lowBandwidthMode,
    manualLowBandwidth: manualLowBw,
    setLowBandwidthMode,
    platformLabel: info.isIOS
      ? (info.isStandalone ? 'iPhone / iPad App (PWA)' : `iPhone / iPad (${info.browser === 'safari' ? 'Safari' : info.browser.toUpperCase()})`)
      : info.isAndroid
        ? (info.isStandalone ? 'Android App (PWA)' : `Android (${info.browser === 'chrome' ? 'Chrome' : info.browser.toUpperCase()})`)
        : (info.isStandalone ? 'Desktop App (PWA)' : 'Desktop Web'),
    networkLabel: !info.isOnline
      ? 'Offline'
      : lowBandwidthMode
        ? `Slow Network (${String(info.connectionType || '2g/3g').toUpperCase()})`
        : `Online (${String(info.connectionType || '4G').toUpperCase()})`,
  }), [info, lowBandwidthMode, manualLowBw])

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>
}

export function useDevice() {
  const ctx = useContext(DeviceContext)
  if (!ctx) return { ...readDeviceSnapshot(), lowBandwidthMode: false, setLowBandwidthMode: () => {} }
  return ctx
}
