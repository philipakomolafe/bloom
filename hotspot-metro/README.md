# MetroReach hotspot portal

This is the complete deployment folder. The MetroReach login design replaces the imported default login, and the logout page matches it. All assets load locally so the portal works before internet access is granted.

## Deploy

1. Upload this entire folder to the router, preserving `assets/`, `css/`, `img/`, and `xml/` and every supporting file.
2. In the existing Hotspot server profile, set **HTML Directory** to the uploaded folder’s actual path, for example `hotspot-metro` or `flash/hotspot-metro`, depending on the router’s file layout. Keep the existing authentication methods, RADIUS/user configuration, certificates, and limits.
3. From a connected client, check valid and invalid credentials, the original destination redirect, status, logout, and reconnect. Check trial access if the router enables it.

The frontend uses the router’s existing users. It does not provision accounts or change hotspot configuration.

## Login and session handling

- `login.html` / `script.js`: native POST to `$(link-login-only)` with `username`, `password`, `dst`, and `popup`. When CHAP is enabled, the original `md5.js` computes the response from the router challenge and the password; the clear password is not posted. If the CHAP helper fails to load, submission stops. Passwordless credentials remain supported where the router allows them.
- Router errors and the last username appear in the form. Trial access appears only when the router enables it and there is no login error.
- `logout.html` / `session.js`: completed session time, uploads/downloads, optional remaining time, and expandable IP/MAC details. Reconnect uses `$(link-login)` and preserves the imported popup flow, with normal navigation if popups are blocked.
- `status.html`: the imported status logic, with a larger logout popup and a fallback when that popup is blocked.
- `alogin.html`, `rlogin.html`, `redirect.html`, `radvert.html`, `error.html`, `errors.txt`, `api.json`, and `xml/`: retained RouterOS success, redirect, advertisement, error, captive portal discovery, and XML behavior. `css/style.css`, `img/`, and `favicon.ico` remain available to these imported pages.
- `styles.css` / `assets/`: shared login/logout styling, fonts, logos, and the local Motion browser library with licenses.

Keep the `$(...)` template variables and conditionals intact. The small inline CHAP script deliberately remains a classic script because RouterOS can emit JavaScript octal escape sequences for the challenge bytes.

## Preview and checks

Open `login.html` or `logout.html` directly. Unexpanded router templates trigger a local preview: login sends nothing and logout shows dashes instead of session data. The other session and redirect templates need RouterOS to render them. JavaScript is required for login; logout’s router link also works without JavaScript.

The carousel gives each of the twelve R28 companies its own color treatment and a clickable card. Links open in a separate tab with no access to the login window. Swiping changes slides without opening a website. Only the current slide’s link is in the keyboard order, and focusing it pauses autoplay. The carousel also supports arrow keys and pauses for hover, reduced motion, hidden tabs, and off-screen content. Motion is optional for both pages. No credentials or session details are written to browser storage.

Company websites require internet access unless their domains and required resources are permitted by the existing hotspot’s walled-garden rules. Adding these links does not change router access rules. All carousel images, fonts, and animations still load locally.

Company destinations were checked against [R28’s official portfolio](https://r28.ng/our-investments). They are maintained directly on the `.company-link` anchors in `login.html`. Prestige Chen Jun links to its official R28 profile because that profile does not list a separate website.

| Company | Destination |
| --- | --- |
| Arbico Plc | https://www.arbico.ng/ |
| Biswal | https://www.biswal.ng/ |
| Nivafer | https://nivafer.com/ |
| Asaba Airport Company | https://www.asabaairport.com/corporate |
| Veenocks | https://www.veenocks.ng/ |
| AFL Networks | https://www.afl.ng/ |
| FIDC | https://www.fidc.ng/ |
| LEDCo | https://www.ledco.ng/ |
| Eco Joinery | https://www.ecojoinery.ng/ |
| Anker Support Services | https://www.hilti.com.ng/ |
| Prestige Chen Jun | https://r28.ng/our-investments/prestige-chen-jun |
| Utopian Consulting | https://www.utopian-consulting.com/ |

Run `npm ci`, `npm run lint`, and `npm test` from the repository root for maintainer checks. Browser tests use simulated RouterOS values and requests; a real-router acceptance check is still needed.

Original assets: [MetroReach](https://www.metroreach.ng) and [R28’s portfolio](https://r28.ng/our-investments). The portfolio presentation does not claim MetroReach customer contracts.
