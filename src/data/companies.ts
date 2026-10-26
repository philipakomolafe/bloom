export type Company = {
  id: string
  name: string
  sector: string
  headline: string
  description: string
  detail: string
  logoSource: string
}

// R28's public company directory is the source of truth for this curated collection.
// The MetroReach constellation is a showcase requested by the project owner,
// not an assertion of independently verified customer contracts or live telemetry.
export const companies: Company[] = [
  {
    id: 'arbico', name: 'Arbico Plc', sector: 'Construction',
    headline: 'Building the places that move us forward.',
    description: 'Building and civil engineering, from ambitious blueprints to enduring landmarks.',
    detail: 'Founded in 1958, Arbico delivers building and civil engineering projects. Its work spans design and construction, general contracting, and project management for public and private clients.',
    logoSource: 'arbico-SsAP4DBo.jpg',
  },
  {
    id: 'biswal', name: 'Biswal', sector: 'Telecommunications',
    headline: 'Behind the networks we rely on.',
    description: 'Technical support, infrastructure deployment, and energy management for telecom operators.',
    detail: 'Biswal supports telecommunications companies with the technical expertise and resources needed to deploy and maintain their infrastructure. Its services include maintenance and energy management for local and international markets.',
    logoSource: 'biswal-npUkgJNJ.jpg',
  },
  {
    id: 'nivafer', name: 'Nivafer', sector: 'Construction',
    headline: 'Big ideas. Engineered in steel.',
    description: 'Structural steel engineering and fabrication for complex industrial projects.',
    detail: 'Nivafer Engineering and Construction fabricates and installs steel structures for the oil and gas sector and allied industries. Its capabilities include subsea equipment, pressure vessels, industrial piping, and storage tanks.',
    logoSource: 'nivafer--ZePhtzT.jpg',
  },
  {
    id: 'aac', name: 'Asaba Airport Company', sector: 'Aviation & infrastructure',
    headline: 'Opening up a world of possibility.',
    description: 'Airport operations connecting Asaba and the Niger Delta to opportunities beyond.',
    detail: 'Asaba Airport Company manages, operates, maintains, and develops Asaba International Airport. Its work supports regional travel and the commercial opportunities surrounding aviation.',
    logoSource: 'aac-ymcA0IIh.jpg',
  },
  {
    id: 'veenocks', name: 'Veenocks', sector: 'Manufacturing',
    headline: 'A beautiful foundation for everyday life.',
    description: 'Quality tiles made for residential and commercial spaces.',
    detail: 'Veenocks manufactures and supplies tiles for homes and commercial projects, combining modern production technology with carefully selected materials to focus on durability and long-term performance.',
    logoSource: 'veenock-investment-logo--fqv-OR0.png',
  },
  {
    id: 'afl', name: 'AFL Networks', sector: 'Telecommunications',
    headline: 'The infrastructure of connection.',
    description: 'Open-access metropolitan fibre infrastructure in Lagos.',
    detail: 'Aldreda Fields Limited, trading as AFL Networks, provides open-access metropolitan fibre-optic infrastructure in Lagos, Nigeria.',
    logoSource: 'afl-Y7pBIXqN.jpg',
  },
  {
    id: 'fidc', name: 'FIDC', sector: 'Real estate',
    headline: 'Creating places for what comes next.',
    description: 'Real estate investment and development across residential, commercial, and leisure spaces.',
    detail: 'First Investment Development Company is a real estate development and investment business established in 2008. It focuses on regeneration projects across residential, commercial, and leisure properties.',
    logoSource: 'fidc-yDzrMj5X.jpg',
  },
  {
    id: 'ledco', name: 'LEDCo', sector: 'Aviation & infrastructure',
    headline: 'A brighter outlook for our cities.',
    description: 'Intelligent lighting and power management for more efficient environments.',
    detail: 'LEDCo provides public lighting, energy management, and bespoke indoor and outdoor LED solutions. Its turnkey services extend from design and manufacturing to delivery for individual project requirements.',
    logoSource: 'ledco-X7WaJjTV.jpg',
  },
  {
    id: 'eco-joinery', name: 'Eco Joinery', sector: 'Manufacturing',
    headline: 'Opening doors. Crafted close to home.',
    description: 'Locally manufactured interior doors, combining Nigerian craft with European expertise.',
    detail: 'Eco Joinery manufactures internal doors in Nigeria in collaboration with European door specialists. Its Lagos Island factory emphasises local sourcing, skilled craftsmanship, and opportunities for Nigerian workers.',
    logoSource: 'ecojoinery-mFX0SZSp.jpg',
  },
  {
    id: 'anker', name: 'Anker Support Services', sector: 'Retail',
    headline: 'Equipping the people who build.',
    description: 'Hilti tools, consumables, and specialist support for construction professionals.',
    detail: 'R28 describes Anker as the Nigerian distributor of Hilti power tools, consumables, and services. The business pairs product sales with after-sales expertise and tool servicing.',
    logoSource: 'anker-js-Se4vI.jpg',
  },
  {
    id: 'prestige-chen-jun', name: 'Prestige Chen Jun', sector: 'Mining',
    headline: 'Part of a resourceful future.',
    description: 'A mining business within the R28 investment portfolio.',
    detail: 'Prestige Chen Jun is listed in the mining sector of R28’s company directory. Explore its R28 profile for the latest information about the business.',
    logoSource: 'prestige-T_jT4RN2.jpg',
  },
  {
    id: 'utopian', name: 'Utopian Consulting', sector: 'Healthcare',
    headline: 'Better thinking for better healthcare.',
    description: 'Healthcare consulting that brings together technology, legal expertise, and industry insight.',
    detail: 'Utopian Consulting LLC works with international healthcare providers. It combines technology, legal expertise, and healthcare knowledge to support informed decisions and business development.',
    logoSource: 'utopian-18VC4jrC.jpg',
  },
]

export const sectors = [...new Set(companies.map((company) => company.sector))]
export const companyProfile = (company: Company) => `https://r28.ng/our-investments/${company.id}`
export const companyLogo = (company: Company) => `/logos/${company.id}.webp`

export function filterCompanies(query: string, sector: string) {
  const search = query.trim().toLocaleLowerCase()
  return companies.filter((company) =>
    (sector === 'All sectors' || company.sector === sector) &&
    `${company.name} ${company.sector} ${company.description}`.toLocaleLowerCase().includes(search),
  )
}
