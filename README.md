# Bloom

An editable HTML, CSS, and JavaScript website showcasing the R28 businesses with MetroReach at the heart of the constellation. The cream-and-forest design, local fonts, glowing network, directory, and three-step introduction work without React, npm, a build step, or an internet connection.

## Open the website

Double-click **index.html**, or run this in PowerShell from the project folder:

```powershell
Start-Process .\index.html
```

Use a current browser such as Chrome or Edge. To preview through a local address instead, with Python installed:

```powershell
py -B -m http.server 8000 --bind 127.0.0.1
```

Open **http://localhost:8000**. Press **Ctrl+C** in the terminal to stop the server. Python only serves the files; the website does not need a backend.

## Edit and refresh

| File | What to change |
| --- | --- |
| `index.html` | Headings, page copy, company information, logo paths, links, and contact email addresses. |
| `styles.css` | Colours in `:root`, typography, spacing, responsive layouts, and visual effects. |
| `script.js` | Interactions, filters, dialogs, and animation timing. `SPOTLIGHT_INTERVAL` controls company cycling in milliseconds. |
| `assets/logos/` | Company and MetroReach images. |
| `assets/fonts/` | Local fonts and their licences. |

Save a file and refresh your browser. There is no export or compilation command. If your browser caches an older stylesheet, press **Ctrl+F5**.

### Change a company

Search `index.html` for the **COMPANY DIRECTORY** comment. Each `<article data-company="...">` contains one company's name, sector, description, logo, headline, full profile, and R28 link. The paragraphs marked `hidden` supply the company dialog; keep them in the article.

Edit the visible name in `company-card-name`, the sector in `sector-label`, and the relevant paragraphs. JavaScript reads these fields and updates the network, directory, dialogs, accessible button names, filters, and counts automatically.

To add a company, copy an entire article, give `data-company` a unique value, and update its content, image path, and source link. Remove an entire article to remove that business. No JavaScript edits are required for company content.

## Share or host it

Send these four items together, preferably as a zip:

```text
index.html
styles.css
script.js
assets/
```

Recipients unzip the folder and open `index.html`. Keep the relative folder arrangement intact. To publish it, upload the same four items to any static website host; no build command is needed.

The remaining package files and `tests/` are optional maintainer tools. Your team does not need them or any package installation to view, edit, or share the website.

## Interactions

- Twelve businesses cycle automatically through the large glowing constellation. Select a surrounding logo to spotlight it, then select the main logo to open its profile. There are no playback controls.
- Hovering keeps the animation flowing. Keyboard interaction, an open dialog, a hidden tab, an off-screen network, or a reduced-motion preference preserves the current company.
- The directory combines sector and text filters and offers a reset when nothing matches.
- The three-step introduction validates name and business, offers a goal choice, and creates an encoded email draft. The visitor reviews and sends it in their own email app; the site stores and submits nothing.
- The hosted page copies its ecosystem link with a manual-copy fallback. A locally opened page explains how to share the complete folder.
- Native dialogs support keyboard focus, Escape, and backdrop dismissal. The company directory and main content remain readable with JavaScript disabled.

External links to R28 and MetroReach need an internet connection. Sending an email requires an email app or service and connectivity.

## Sources

Company names, sectors, descriptions, and logos were checked against [R28's directory](https://r28.ng/our-investments) and its individual profiles on 26 October 2026. There are 12 businesses across eight sectors. Each article retains its source link and the original logo URL in a comment. Local logos only trim surrounding whitespace and optimise the image format.

MetroReach's logo comes from [metroreach.ng/metroreach-logo.png](https://metroreach.ng/metroreach-logo.png). Its service description and sales/wholesale contacts come from [MetroReach](https://www.metroreach.ng).

The MetroReach presentation follows the project brief. R28's directory identifies its portfolio; it does not independently verify individual MetroReach customer contracts. No customer endorsements, contract details, or live network claims are implied.

## Optional maintainer checks

The website itself has no dependencies. Developers running the automated checks can use:

```sh
npm ci
npm run lint
npm test
```

Only ESLint, Playwright, and axe are development dependencies. Browser checks use Microsoft Edge and a temporary Python static server on port 8765. In another environment, install Playwright Chromium and remove `channel: 'msedge'` from `playwright.config.js`.

Checks cover automatic cycling, direct selection, filters, profiles, validated email drafts, sharing, keyboard access, reduced motion, mobile widths, and axe WCAG AA checks. Separate tests copy only the four website items to an isolated folder, open them offline, and verify that changing HTML and CSS immediately updates content, counts, filtering, and colours without a build.

Temporary test copies clean themselves up outside the repository. Automated accessibility checks do not replace an assistive-technology audit.
