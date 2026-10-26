# Bloom

A responsive company constellation with MetroReach on the left and the businesses in R28’s public directory unfolding around it. Built with React, TypeScript, Vite, Tailwind CSS, Framer Motion, and shadcn/ui with Base UI accessibility primitives.

## Run

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173. Use `npm run build` for the production bundle and `npm run preview` to serve that bundle locally.

## What works

- Twelve businesses cycle automatically through large, overlapping, glowing spotlights, with their actual logos and readable descriptions.
- An expansive constellation without visible playback controls, arrows, or a timeline. Select a logo to discover a company. Hovering keeps the experience flowing; keyboard focus, open profiles, and hidden pages preserve the current position. Reduced-motion preferences disable autoplay.
- A directory with combined sector and text filters, a resettable empty state, and linked company profiles.
- A three-step introduction to MetroReach: name and business, goal selection, and a ready-to-review email draft. The visitor sends it from their email app; the site does not claim to submit or store enquiries.
- Shareable ecosystem links, a manual clipboard fallback, mobile navigation, and keyboard-accessible dialogs.

The current experience is static and needs no backend, account, API key, database, or tracking service. If server-side enquiries or accounts are added, use Python/FastAPI as requested; no unused backend scaffolding is included.

## Edit

- `src/data/companies.ts`: all company profiles, sectors, descriptions, and original logo filenames.
- `src/components/Network.tsx`: constellation layout and playback.
- `src/components/Directory.tsx` and `Dialogs.tsx`: discovery and contact flows.
- `src/App.tsx` and `src/index.css`: page composition and the shared design system.
- `public/logos/`: locally hosted logos; fonts are bundled locally as well.

## Sources

Company names, sectors, and descriptions were checked against [R28’s public directory](https://r28.ng/our-investments) and its individual company profiles on 26 October 2026. There are 12 entries across eight directory sectors. Each profile links back to its source. Logo source URLs are `https://r28.ng/assets/` plus the `logoSource` filename in `companies.ts`; local copies only trim surrounding whitespace and optimise the image format.

MetroReach’s logo comes from [metroreach.ng/metroreach-logo.png](https://metroreach.ng/metroreach-logo.png). Its service description and sales/wholesale contacts come from [MetroReach](https://www.metroreach.ng).

The MetroReach network presentation follows the project brief. R28’s directory identifies its portfolio; it does not independently verify individual MetroReach customer contracts. The interface therefore avoids contract details, customer endorsements, invented performance metrics, and live network claims.

## Checks

```sh
npm run lint
npm run build
npm test
```

Playwright uses Microsoft Edge, which is installed on this workspace. For another environment, install Playwright Chromium and remove `channel: 'msedge'` from `playwright.config.ts`. The browser suite covers automatic cycling, direct logo selection, filters, profiles, email draft validation, sharing, reduced motion, mobile layouts, and automated axe WCAG AA checks. Automated accessibility checks do not replace an assistive-technology audit.

Test output goes to the operating system’s temporary directory, outside the repository. Source, necessary configuration, assets, and tests are kept in the project; generated previews and ad hoc scripts are not.
