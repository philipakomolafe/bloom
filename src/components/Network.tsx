import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimationFrame, useInView, useReducedMotion } from 'framer-motion'
import { type Company, companyLogo } from '@/data/companies'
import { ExternalLink } from './Brand'

// Coordinates are shared by the SVG paths and percentage-positioned logo tiles.
const satellites = [
  { x: 42, y: 18, scale: 0.76 },
  { x: 70, y: 14, scale: 0.65 },
  { x: 87, y: 43, scale: 0.85 },
  { x: 82, y: 82, scale: 0.69 },
  { x: 36, y: 82, scale: 0.64 },
]
const endpoints = [{ x: 59, y: 42 }, ...satellites]
const curve = ({ x, y }: { x: number; y: number }) => `M 185 225 C 330 225, ${x * 10 - 150} ${y * 4.6}, ${x * 10} ${y * 4.6}`

function ConnectionLines({ moving, count }: { moving: boolean; count: number }) {
  return (
    <svg className="connection-lines desktop-lines" viewBox="0 0 1000 460" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="connection-gradient"><stop stopColor="#6eaf76" stopOpacity=".08" /><stop offset=".6" stopColor="#a4c881" stopOpacity=".65" /><stop offset="1" stopColor="#cce7ad" stopOpacity=".25" /></linearGradient>
      </defs>
      {endpoints.slice(0, count).map((point, index) => (
        <g key={index}>
          <path d={curve(point)} stroke="url(#connection-gradient)" strokeWidth={index === 0 ? 1.4 : 0.7} fill="none" />
          {moving && <motion.circle r={index === 0 ? 2.4 : 1.6} fill="#d6edb8"
            initial={{ opacity: 0 }}
            animate={{
              x: Array.from({ length: 31 }, (_, n) => {
                const t = n / 30, u = 1 - t
                return u ** 3 * 185 + 3 * u ** 2 * t * 330 + 3 * u * t ** 2 * (point.x * 10 - 150) + t ** 3 * point.x * 10
              }),
              y: Array.from({ length: 31 }, (_, n) => {
                const t = n / 30, u = 1 - t
                return u ** 3 * 225 + 3 * u ** 2 * t * 225 + 3 * u * t ** 2 * point.y * 4.6 + t ** 3 * point.y * 4.6
              }),
              opacity: [0, 0.9, 0.9, 0],
            }}
            transition={{ duration: 4.5 + index * 0.6, delay: index * 0.8, repeat: Infinity, ease: [0.32, 0.1, 0.65, 1] }}
          />}
        </g>
      ))}
      {count > 5 && <path d="M420 83 Q550 2 700 64 M700 64 Q940 58 870 198 M870 198 Q955 331 820 377 M820 377 Q620 443 360 377 M360 377 Q350 330 420 83" stroke="#a6c69c" strokeOpacity=".09" strokeWidth=".7" strokeDasharray="3 6" fill="none" />}
      {Array.from({ length: 35 }, (_, i) => <circle key={i} cx={75 + (i * 137) % 860} cy={30 + (i * 89) % 395} r={i % 4 === 0 ? 1.5 : 0.8} fill="#cce8b5" opacity={i % 4 === 0 ? 0.4 : 0.13} />)}
    </svg>
  )
}

export function Network({ companies, onExplore, suspended }: { companies: Company[]; onExplore: (company: Company) => void; suspended: boolean }) {
  const reduceMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [keyboardFocus, setKeyboardFocus] = useState(false)
  const [visible, setVisible] = useState(!document.hidden)
  const canvas = useRef<HTMLDivElement>(null)
  const inView = useInView(canvas, { amount: 0.15 })
  const elapsed = useRef(0)
  const active = companies[index % companies.length]
  const moving = !reduceMotion && !keyboardFocus && visible && inView && !suspended

  // Save work off-screen; keyboard focus and open profiles keep their place.
  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useAnimationFrame((_, delta) => {
    if (!moving || companies.length < 2) return
    elapsed.current += Math.min(delta, 100)
    if (elapsed.current >= 7500) {
      elapsed.current = 0
      setIndex((current) => (current + 1) % companies.length)
    }
  })

  function select(next: number) {
    elapsed.current = 0
    setIndex((next + companies.length) % companies.length)
  }

  return (
    <div className="network-shell" ref={canvas}
      onFocusCapture={(event) => setKeyboardFocus(event.target.matches(':focus-visible'))}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setKeyboardFocus(false) }}>
      <div className="network-scene" role="region" aria-label="MetroReach company constellation">
        <div className="network-atmosphere" aria-hidden="true" />
        <ConnectionLines moving={moving} count={companies.length} />
        <svg className="connection-lines mobile-lines" viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true">
          <path d="M250 147 C420 147 500 165 690 165" fill="none" stroke="#a9cb82" strokeWidth="1" strokeOpacity=".35" />
          {['M250 147 C150 230 140 425 240 425', 'M250 147 C490 147 370 437 540 437', 'M250 147 C700 147 650 432 820 432'].slice(0, companies.length - 1).map((path) => <path key={path} d={path} fill="none" stroke="#a9cb82" strokeWidth="1" strokeOpacity=".2" />)}
          {moving && <motion.circle r="3" fill="#d8eebd" animate={{ x: [250, 370, 540, 690], y: [147, 150, 160, 165], opacity: [0, 1, 1, 0] }} transition={{ duration: 4, repeat: Infinity, ease: [0.32, 0.1, 0.65, 1] }} />}
        </svg>

        <div className="provider-node">
          <div className="provider-orbit orbit-one" aria-hidden="true" />
          <div className="provider-orbit orbit-two" aria-hidden="true" />
          <ExternalLink href="https://www.metroreach.ng" className="provider-logo">
            <img src="/logos/metroreach.webp" alt="MetroReach" width="166" height="60" />
            <span className="provider-status"><span className="status-dot" /> SERVICE PROVIDER</span>
          </ExternalLink>
          <p>Fibre deep. Reach wide.</p>
        </div>

        {satellites.slice(0, Math.min(5, companies.length - 1)).map((position, slot) => {
          const companyIndex = (index + slot + 1) % companies.length
          const company = companies[companyIndex]
          return (
            <div className={`satellite satellite-${slot}`} style={{ left: `${position.x}%`, top: `${position.y}%` }} key={slot}>
              <AnimatePresence mode="sync" initial={false}>
                <motion.button key={company.id} className="satellite-button" aria-label={`Spotlight ${company.name}`}
                  initial={{ opacity: 0, scale: position.scale * 0.7, y: 12 }}
                  animate={{ opacity: 0.75, scale: position.scale, y: 0 }}
                  exit={{ opacity: 0, scale: position.scale * 0.85, y: -9 }}
                  whileHover={{ opacity: 1, scale: position.scale + 0.05 }}
                  whileFocus={{ opacity: 1, scale: position.scale + 0.05 }}
                  transition={{ duration: reduceMotion ? 0 : 1.1, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => select(companyIndex)}>
                  <span className="satellite-logo"><img src={companyLogo(company)} alt="" width="140" height="64" /></span>
                  <span className="satellite-name">{company.name}</span>
                </motion.button>
              </AnimatePresence>
            </div>
          )
        })}

        <div className="spotlight">
          <AnimatePresence mode="sync" initial={false}>
            <motion.div className="spotlight-inner" key={active.id} initial={{ opacity: 0, scale: 0.88, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 1.05, y: -10 }}
              transition={{ duration: reduceMotion ? 0 : 1.15, ease: [0.22, 1, 0.36, 1] }}>
              <motion.div className="spotlight-bloom" aria-hidden="true" animate={moving ? { scale: [0.9, 1.16, 0.9], opacity: [0.6, 1, 0.6] } : { scale: 1, opacity: 0.8 }} transition={moving ? { duration: 7.5, repeat: Infinity, ease: [0.32, 0.1, 0.65, 1] } : { duration: 0.3 }} />
              <button className="spotlight-logo" onClick={() => onExplore(active)} aria-label={`Discover ${active.name}`}>
                <img src={companyLogo(active)} alt={active.name} width="180" height="85" />
              </button>
              <div className="spotlight-story">
                <span className="sector-label">{active.sector}</span>
                <h3>{active.name}</h3>
                <p>{active.description}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
