import { lazy, Suspense, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowDownIcon, ArrowUpRightIcon, CirclesThreePlusIcon, GlobeHemisphereWestIcon, GridFourIcon, MagnifyingGlassIcon, ShareNetworkIcon, SlidersHorizontalIcon, XIcon } from '@phosphor-icons/react'
import { companies, filterCompanies, sectors, type Company } from './data/companies'
import { ArrowCircle, BloomMark, ExternalLink } from './components/Brand'
import { Directory, EmptyResults } from './components/Directory'
import { Network } from './components/Network'

// Load the accessible modal stack only when a visitor opens a conversation or profile.
const CompanyDialog = lazy(() => import('./components/Dialogs').then((module) => ({ default: module.CompanyDialog })))
const ConnectDialog = lazy(() => import('./components/Dialogs').then((module) => ({ default: module.ConnectDialog })))
const ShareDialog = lazy(() => import('./components/Dialogs').then((module) => ({ default: module.ShareDialog })))

export default function App() {
  const reduceMotion = useReducedMotion()
  const [view, setView] = useState<'network' | 'directory'>('network')
  const [sector, setSector] = useState('All sectors')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Company | null>(null)
  const [connectOpen, setConnectOpen] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchInput = useRef<HTMLInputElement>(null)
  const filtered = filterCompanies(query, sector)
  const reveal = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: reduceMotion ? 0 : 0.85, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }

  function navigate(next: 'network' | 'directory') {
    setView(next)
    setMobileMenu(false)
    document.getElementById('ecosystem')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }

  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header page-width">
      <a className="brand" href="#" aria-label="Bloom home"><BloomMark /><span>bloom<span className="brand-period">.</span></span></a>
      <nav className="desktop-nav" aria-label="Main navigation">
        <a href="#ecosystem" className={view === 'network' ? 'active' : ''} onClick={(event) => { event.preventDefault(); navigate('network') }}>The ecosystem<span /></a>
        <a href="#ecosystem" onClick={(event) => { event.preventDefault(); navigate('directory') }}>Our businesses</a>
        <a href="#connection">The connection</a>
      </nav>
      <div className="header-right"><span className="powered-label">An experience by <b>MetroReach</b></span><button className="primary-button header-cta" onClick={() => setConnectOpen(true)}>Let’s connect <ArrowCircle /></button><button className={`mobile-menu-button ${mobileMenu ? 'is-open' : ''}`} onClick={() => setMobileMenu(!mobileMenu)} aria-label={mobileMenu ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileMenu}><span /><span /></button></div>
    </header>
    <AnimatePresence>{mobileMenu && <motion.nav className="mobile-nav" aria-label="Mobile navigation" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
      <button onClick={() => navigate('network')}>The ecosystem <ArrowUpRightIcon /></button><button onClick={() => navigate('directory')}>Our businesses <ArrowUpRightIcon /></button><a href="#connection" onClick={() => setMobileMenu(false)}>The connection <ArrowUpRightIcon /></a>
    </motion.nav>}</AnimatePresence>

    <main id="main">
      <section className="hero page-width">
        <motion.div {...reveal} className="hero-content">
          <span className="eyebrow"><span className="mini-flower">✳</span> GREAT BUSINESSES GROW TOGETHER</span>
          <h1>Every connection,<br />a new <em>possibility.</em><span className="heading-spark" aria-hidden="true">✳</span></h1>
        </motion.div>
        <motion.div {...reveal} className="hero-aside">
          <p>Meet the businesses shaping our world.<br className="desktop-break" /> A living network of ideas, industries, and ambition — with MetroReach at its heart.</p>
          <a href="#ecosystem" className="explore-link">Discover the ecosystem <span><ArrowDownIcon size={16} weight="light" /></span></a>
        </motion.div>
        <div className="hero-decoration" aria-hidden="true"><BloomMark /><BloomMark /></div>
      </section>

      <section className="ecosystem page-width" id="ecosystem" aria-label="Explore the ecosystem">
        <div className="ecosystem-toolbar">
          <div className="view-switch" aria-label="View options">
            <button className={view === 'network' ? 'selected' : ''} aria-pressed={view === 'network'} onClick={() => setView('network')}><CirclesThreePlusIcon size={17} weight="light" /> Network view</button>
            <button className={view === 'directory' ? 'selected' : ''} aria-pressed={view === 'directory'} onClick={() => setView('directory')}><GridFourIcon size={17} weight="light" /> Directory</button>
          </div>
          <div className="toolbar-actions">
            <div className={`search-box ${searchOpen || query ? 'is-open' : ''}`}>
              <button aria-label="Search businesses" onClick={() => { setSearchOpen(true); requestAnimationFrame(() => searchInput.current?.focus()) }}><MagnifyingGlassIcon size={19} weight="light" /></button>
              <input ref={searchInput} aria-label="Search businesses by name or description" placeholder="Find a business…" value={query} onChange={(event) => { setQuery(event.target.value); setView('directory') }} onKeyDown={(event) => { if (event.key === 'Escape') { setQuery(''); setSearchOpen(false) } }} />
              {query && <button aria-label="Clear search" onClick={() => { setQuery(''); searchInput.current?.focus() }}><XIcon size={14} /></button>}
            </div>
            <label className="sector-select"><SlidersHorizontalIcon size={17} weight="light" /><span className="sr-only">Filter by sector</span><select value={sector} onChange={(event) => setSector(event.target.value)}><option>All sectors</option>{sectors.map((item) => <option key={item}>{item}</option>)}</select></label>
            <span className="toolbar-divider" />
            <button className="share-button" aria-label="Share network" onClick={() => setShareOpen(true)}><ShareNetworkIcon size={18} weight="light" /><span>Share network</span></button>
          </div>
        </div>
        <div className={`experience-frame ${view === 'directory' ? 'directory-frame' : ''}`}>
          {filtered.length === 0 ? <EmptyResults onReset={() => { setQuery(''); setSector('All sectors') }} /> : view === 'network'
            ? <Network key={sector + query} companies={filtered} onExplore={setSelected} suspended={!!selected || connectOpen || shareOpen || mobileMenu} />
            : <Directory companies={filtered} onExplore={setSelected} />}
        </div>
        {view === 'directory' && <div className="experience-caption"><p><span className="caption-dot" />{filtered.length} businesses. Each with something remarkable to share.</p><span><GlobeHemisphereWestIcon size={15} weight="light" /> Rooted in Nigeria. Reaching further.</span></div>}
      </section>

      <section className="network-facts page-width" aria-label="The ecosystem in numbers">
        <div className="facts-intro"><span className="eyebrow">MANY INDUSTRIES. SHARED AMBITION.</span><p>Extraordinary on their own.<br /><em>Even better, together.</em></p></div>
        <div className="fact"><span>{companies.length.toString().padStart(2, '0')}<sup>↗</sup></span><p>Remarkable businesses</p></div><div className="fact"><span>{sectors.length.toString().padStart(2, '0')}</span><p>Industries, endless possibilities</p></div><div className="fact fact-last"><span>One<span className="small-flower">✳</span></span><p>Connected ecosystem</p></div>
      </section>

      <motion.section {...reveal} className="connection-section page-width" id="connection">
        <div className="connection-visual-shell"><div className="connection-visual"><div className="connection-ring ring-a" /><div className="connection-ring ring-b" /><div className="connection-ring ring-c" /><div className="connection-logo"><img src="/logos/metroreach.webp" alt="MetroReach" width="240" height="50" /></div><span className="connection-visual-note"><span className="status-dot" /> FIBRE DEEP. REACH WIDE.</span><span className="visual-corner corner-top">01 — THE ENABLER</span><span className="visual-corner corner-bottom">BUILT FOR WHAT’S NEXT <ArrowUpRightIcon size={15} weight="light" /></span></div></div>
        <div className="connection-copy"><span className="eyebrow">THE THREAD THAT CONNECTS US</span><h2>Behind every possibility,<br />a stronger <em>connection.</em></h2><p>Great ideas need room to grow. MetroReach brings full-fibre internet to homes, businesses, and wholesale partners — creating the connections that help ambition go further.</p><p>Explore the R28 businesses above. Discover the connectivity behind this experience below.</p><ExternalLink href="https://www.metroreach.ng" className="primary-button">Meet MetroReach <ArrowCircle /></ExternalLink><span className="connection-location"><GlobeHemisphereWestIcon weight="light" size={16} /> Lagos, Nigeria · Connected to possibility</span></div>
      </motion.section>

      <motion.section {...reveal} className="final-cta page-width"><BloomMark className="cta-flower" /><div><span className="eyebrow">THERE’S ROOM FOR YOUR NEXT CHAPTER</span><h2>Good things start with <em>a connection.</em></h2><p>Let’s see where yours could take you.</p></div><button className="primary-button" onClick={() => setConnectOpen(true)}>Let’s connect <ArrowCircle /></button></motion.section>
    </main>

    <footer className="site-footer page-width"><div className="footer-top"><a className="brand" href="#" aria-label="Bloom home"><BloomMark /><span>bloom<span className="brand-period">.</span></span></a><p>Every business. A story worth connecting with.</p><a className="back-to-top" href="#">Back to the beginning <ArrowUpRightIcon size={17} weight="light" /></a></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Bloom. A MetroReach showcase.</span><span>Company profiles & logos from <ExternalLink href="https://r28.ng/our-investments">R28 <ArrowUpRightIcon size={12} /></ExternalLink></span><ExternalLink href="https://www.metroreach.ng/privacy">Privacy</ExternalLink></div></footer>

    <Suspense fallback={null}>
      {selected && <CompanyDialog company={selected} onClose={() => setSelected(null)} />}
      {connectOpen && <ConnectDialog open onClose={() => setConnectOpen(false)} />}
      {shareOpen && <ShareDialog onClose={() => setShareOpen(false)} />}
    </Suspense>
  </>
}
