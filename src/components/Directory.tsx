import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRightIcon, MagnifyingGlassIcon } from '@phosphor-icons/react'
import { type Company, companyLogo } from '@/data/companies'

export function EmptyResults({ onReset }: { onReset: () => void }) {
  return <div className="empty-results">
    <div className="empty-orbit"><MagnifyingGlassIcon weight="light" size={32} /></div>
    <h3>A new connection is one search away.</h3>
    <p>No businesses match these filters. Try another name or explore the whole ecosystem.</p>
    <button className="primary-button" onClick={onReset}>Explore all businesses <ArrowUpRightIcon weight="light" size={18} /></button>
  </div>
}

export function Directory({ companies, onExplore }: { companies: Company[]; onExplore: (company: Company) => void }) {
  const reduceMotion = useReducedMotion()
  return <motion.div className="directory-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduceMotion ? 0 : 0.3 }}>
    {companies.map((company, index) => <motion.button key={company.id} className="company-card-shell" onClick={() => onExplore(company)}
      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduceMotion ? 0 : Math.min(index * 0.04, 0.25), duration: reduceMotion ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
      aria-label={`Read about ${company.name}`}>
      <span className="company-card">
        <span className="company-card-top"><span className="directory-logo"><img src={companyLogo(company)} alt="" loading="lazy" width="130" height="65" /></span><span className="company-card-arrow"><ArrowUpRightIcon size={20} weight="light" /></span></span>
        <span className="sector-label">{company.sector}</span>
        <span className="company-card-name">{company.name}</span>
        <span className="company-card-description">{company.description}</span>
      </span>
    </motion.button>)}
  </motion.div>
}
