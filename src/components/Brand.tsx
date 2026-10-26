import { ArrowUpRightIcon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

export function BloomMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <ellipse key={angle} cx="20" cy="11.5" rx="5.8" ry="10" fill="currentColor" transform={`rotate(${angle} 20 20)`} />
      ))}
      <circle cx="20" cy="20" r="3.2" fill="var(--background)" />
    </svg>
  )
}

export function ArrowCircle() {
  return <span className="arrow-circle"><ArrowUpRightIcon weight="light" size={18} /></span>
}

export function ExternalLink({ href, children, className = '' }: { href: string; children: ReactNode; className?: string }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}<span className="sr-only"> (opens in a new tab)</span></a>
}
