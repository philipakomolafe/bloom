# MetroReach Internet

A MikroTik RouterOS hotspot portal combining the MetroReach login design with the imported hotspot authentication and session pages. The login keeps its twelve-company carousel; logout uses the same fonts, colors, and responsive layout with a session summary and reconnect action.

**Deploy only `hotspot-metro`.** It contains the login, logout, status, redirects, CHAP helper, captive portal API, XML templates, and local assets. There is one portal folder.

Open `index.html` to preview login or `hotspot-metro/logout.html` to preview logout. Local previews send no credentials and show dashes for session values. RouterOS renders the real endpoints, session values, and redirects when deployed. Account creation, passwords, access plans, and session limits remain managed by the existing router/RADIUS setup.

See [hotspot-metro/README.md](hotspot-metro/README.md) for deployment and file details. No installation or build step is needed on the router.

## Maintainer checks

```sh
npm ci
npm run lint
npm test
```

Checks use Playwright, Microsoft Edge, axe, and Python's static server. Tests render RouterOS templates in memory and intercept requests to verify PAP/CHAP login, redirects, errors, trial access, logout, popup fallbacks, accessibility, and offline assets. Test artifacts and isolated folder copies stay outside the repository.

These checks simulate RouterOS; verify successful and unsuccessful login, session status, logout, and reconnect on the actual router before replacing its active portal.

Framer Motion is installed per project preferences; its small DOM build and license are bundled locally. `shadcn@latest init --defaults` does not support this plain HTML project. The portal stays native HTML/CSS/JavaScript for RouterOS compatibility.
