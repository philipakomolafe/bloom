import { useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeftIcon, ArrowRightIcon, ArrowUpRightIcon, BuildingsIcon, CheckIcon, EnvelopeSimpleIcon, HandshakeIcon, LinkSimpleIcon, WifiHighIcon } from '@phosphor-icons/react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { ArrowCircle, BloomMark, ExternalLink } from './Brand'
import { type Company, companyLogo, companyProfile } from '@/data/companies'

export function CompanyDialog({ company, onClose }: { company: Company | null; onClose: () => void }) {
  return <Dialog open={!!company} onOpenChange={(open) => { if (!open) onClose() }}>
    <DialogContent className="bloom-dialog company-dialog">
      {company && <>
        <div className="profile-art"><span className="profile-orbit" /><span className="profile-orbit orbit-inner" /><div className="profile-logo"><img src={companyLogo(company)} alt="" width="160" height="100" /></div><span className="profile-art-caption">THE R28 ECOSYSTEM</span></div>
        <div className="profile-body">
          <span className="sector-label">{company.sector}</span>
          <DialogTitle>{company.name}</DialogTitle>
          <DialogDescription>{company.headline}</DialogDescription>
          <p className="profile-detail">{company.detail}</p>
          <div className="profile-meta"><span>Part of the bigger picture</span><span>R28 portfolio <ArrowUpRightIcon weight="light" size={14} /></span></div>
          <ExternalLink href={companyProfile(company)} className="primary-button">Explore on R28 <ArrowCircle /></ExternalLink>
          <p className="source-note">Company information sourced from <ExternalLink href={companyProfile(company)}>R28’s company profile</ExternalLink>.</p>
        </div>
      </>}
    </DialogContent>
  </Dialog>
}

const goals = [
  { name: 'Connect my business', description: 'Explore full-fibre business internet.', icon: WifiHighIcon },
  { name: 'Build on your network', description: 'Discuss wholesale connectivity.', icon: BuildingsIcon },
  { name: 'Explore a partnership', description: 'Start a conversation about working together.', icon: HandshakeIcon },
]

function IntroductionForm() {
  const reduceMotion = useReducedMotion()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [business, setBusiness] = useState('')
  const [goal, setGoal] = useState(goals[0].name)
  const [error, setError] = useState('')
  const [direction, setDirection] = useState(1)
  const heading = useRef<HTMLHeadingElement>(null)
  const recipient = goal === goals[1].name ? 'wholesale@metroreach.ng' : 'sales@metroreach.ng'
  const body = `Hello MetroReach,\n\nI'm ${name.trim()} from ${business.trim()}. I discovered your company through Bloom and would like to ${goal.toLowerCase()}.\n\nPlease share the next steps.\n\nThank you,\n${name.trim()}`
  const mailto = `mailto:${recipient}?subject=${encodeURIComponent(`Bloom introduction: ${goal}`)}&body=${encodeURIComponent(body)}`

  function next() {
    // Trim before validation so blank input cannot become an email introduction.
    if (step === 0 && (!name.trim() || !business.trim())) {
      setError('Please add your name and your business name.')
      return
    }
    setError('')
    setDirection(1)
    setStep(step + 1)
  }

  return <>
    <div className="intro-brand"><BloomMark /> <span>A good connection changes everything.</span></div>
    <div className="step-indicators" aria-label={`Step ${step + 1} of 3`}>
      {['Introduce yourself', 'Your next chapter', 'Make a connection'].map((label, index) => <span key={label} className={step >= index ? 'complete' : ''}><span>{step > index ? <CheckIcon size={12} weight="bold" /> : index + 1}</span><small>{label}</small></span>)}
    </div>
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div key={step} custom={direction} variants={{ enter: (d: number) => ({ opacity: 0, x: d * 22 }), visible: { opacity: 1, x: 0 }, exit: (d: number) => ({ opacity: 0, x: -d * 18 }) }}
        initial="enter" animate="visible" exit="exit" transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
        onAnimationComplete={() => { if (step > 0) heading.current?.focus() }}>
        <DialogTitle ref={heading} tabIndex={-1}>{step === 0 ? 'Great things start with hello.' : step === 1 ? `What’s next, ${name.trim().split(' ')[0]}?` : 'Your next chapter awaits.'}</DialogTitle>
        <DialogDescription>{step === 0 ? 'Tell us a little about yourself. Let’s make your next connection a meaningful one.' : step === 1 ? 'Choose what brings you here. We’ll help you start the right conversation with MetroReach.' : 'Your introduction is ready. Open your email app to review it and send it to the MetroReach team.'}</DialogDescription>
        {step === 0 && <form className="intro-form" onSubmit={(event) => { event.preventDefault(); next() }}>
          <label htmlFor="intro-name">Your name<div className="input-shell"><input id="intro-name" name="name" autoComplete="name" placeholder="e.g. Philip" value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} /></div></label>
          <label htmlFor="intro-business">Business name<div className="input-shell"><input id="intro-business" name="organization" autoComplete="organization" placeholder="Where great things happen" value={business} onChange={(event) => setBusiness(event.target.value)} required maxLength={120} /></div></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <Button className="primary-button" type="submit">Let’s get acquainted <span className="arrow-circle"><ArrowRightIcon size={18} weight="light" /></span></Button>
          <p className="form-footnote">A simple introduction. No account needed.</p>
        </form>}
        {step === 1 && <>
          <fieldset className="goal-options"><legend className="sr-only">What would you like to do?</legend>
            {goals.map(({ name: item, description, icon: Icon }) => <label className={`goal-option ${goal === item ? 'selected' : ''}`} key={item}>
              <input type="radio" name="goal" value={item} checked={goal === item} onChange={() => setGoal(item)} />
              <Icon size={26} weight="light" /><span><strong>{item}</strong><small>{description}</small></span><span className="goal-radio">{goal === item && <CheckIcon size={12} weight="bold" />}</span>
            </label>)}
          </fieldset>
          <Button className="primary-button" onClick={next}>Prepare my introduction <span className="arrow-circle"><ArrowRightIcon size={18} weight="light" /></span></Button>
        </>}
        {step === 2 && <>
          <div className="intro-success"><motion.div initial={{ scale: 0.6, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 12 }}><BloomMark /></motion.div><span>New possibilities, {name.trim().split(' ')[0]}.</span></div>
          <dl className="intro-summary"><div><dt>From</dt><dd>{name.trim()} · {business.trim()}</dd></div><div><dt>Let’s talk about</dt><dd>{goal}</dd></div><div><dt>To</dt><dd>{recipient}</dd></div></dl>
          <a className="primary-button" href={mailto}>Open email draft <span className="arrow-circle"><EnvelopeSimpleIcon size={18} weight="light" /></span></a>
          <p className="form-footnote">Nothing has been sent. You’re in control of the final message.</p>
        </>}
        {step > 0 && <button className="back-button" onClick={() => { setDirection(-1); setStep(step - 1) }}><ArrowLeftIcon size={15} weight="light" /> Go back</button>}
      </motion.div>
    </AnimatePresence>
  </>
}

export function ConnectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <Dialog open={open} onOpenChange={(value) => { if (!value) onClose() }}>
    <DialogContent className="bloom-dialog connect-dialog">{open && <IntroductionForm />}</DialogContent>
  </Dialog>
}

export function ShareDialog({ onClose }: { onClose: () => void }) {
  const [copyStatus, setCopyStatus] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const url = `${window.location.origin}${window.location.pathname}#ecosystem`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopyStatus('Link copied. Ready to share.')
    } catch {
      input.current?.select()
      setCopyStatus('Copy the selected link to share this ecosystem.')
    }
  }

  return <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
    <DialogContent className="bloom-dialog share-dialog"><div className="share-icon"><LinkSimpleIcon size={27} weight="light" /></div><DialogTitle>Good connections are worth sharing.</DialogTitle><DialogDescription>Invite someone to discover the businesses in this ecosystem.</DialogDescription><label className="share-url-label" htmlFor="share-url">Link to this ecosystem</label><div className="input-shell"><input ref={input} id="share-url" value={url} readOnly onFocus={(event) => event.target.select()} /></div><button className="primary-button" onClick={copyLink}>{copyStatus.startsWith('Link copied') ? 'Copied to clipboard' : 'Copy link'}<span className="arrow-circle">{copyStatus.startsWith('Link copied') ? <CheckIcon size={18} /> : <LinkSimpleIcon size={18} />}</span></button><p className="copy-status" role="status">{copyStatus}</p></DialogContent>
  </Dialog>
}
