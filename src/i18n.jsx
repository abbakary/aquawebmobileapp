import React from 'react'

export const LANG_KEY = 'ft_lang'

export function getInitialLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY)
    if (saved === 'en' || saved === 'sw') return saved
  } catch (e) {}
  return 'sw' // Swahili is default
}

export function saveLang(lang) {
  try {
    localStorage.setItem(LANG_KEY, lang)
  } catch (e) {}
}

export const SPECIES_SW = {
  'Nile Perch': 'Sangara',
  'Tilapia': 'Sato',
  'Dagaa (Sardines)': 'Dagaa',
  'Catfish': 'Kambale'
}

export const CATS_SW = {
  'Individual Fisherman': 'Mvuvi Binafsi',
  'Independent Fisherman': 'Mvuvi Huru',
  'Company-managed Fishermen': 'Wavuvi wa Kampuni',
  'BMU Fishing Group': 'Kikundi cha Uvuvi cha BMU',
  'Dealer / Fish Trader': 'Mfanyabiashara / Dalali wa Samaki',
  'Dealer / Middleman': 'Mfanyabiashara / Dalali',
  'Aquaculture Farm': 'Shamba la Ufugaji wa Samaki',
  'Fish Trader / Agent': 'Dalali / Wakala wa Samaki',
  'Fishing Company': 'Kampuni ya Uvuvi',
}

export function catName(cat, lang = getInitialLang()) {
  if (!cat) return cat
  return lang === 'sw' ? (CATS_SW[cat] || cat) : cat
}

export function spName(sp, lang = getInitialLang()) {
  if (!sp) return sp
  return lang === 'sw' ? (SPECIES_SW[sp] || sp) : sp
}

export function LangToggle({ lang, setLang, dark = false }) {
  return (
    <div
      className={`inline-flex items-center rounded-full p-0.5 border text-[11px] font-bold shrink-0 ${
        dark
          ? 'bg-slate-900/80 border-white/20 text-slate-200'
          : 'bg-slate-100 border-slate-200 text-slate-700'
      }`}
      role="group"
      aria-label="Language switcher"
    >
      <button
        type="button"
        onClick={() => setLang('sw')}
        className={`px-2.5 py-1 rounded-full transition cursor-pointer ${
          lang === 'sw'
            ? 'bg-emerald-600 text-white shadow-sm'
            : dark
            ? 'text-slate-300 hover:text-white'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        TZ SW
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`px-2.5 py-1 rounded-full transition cursor-pointer ${
          lang === 'en'
            ? 'bg-blue-700 text-white shadow-sm'
            : dark
            ? 'text-slate-300 hover:text-white'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        GB EN
      </button>
    </div>
  )
}
