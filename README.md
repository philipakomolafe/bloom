# MetroReach Internet

A standalone login-page design for the team to integrate with its existing system. It pairs a username/password form with an automatically sliding carousel: one slide per company, using all twelve original R28 logos and MetroReach branding. Desktop and phones share the design, with swipe support and no playback buttons.

**Send only the `hotspot` folder.** Open `index.html` or `hotspot/login.html` to preview. There is no backend or MikroTik authentication implementation. Preview submissions send nothing.

See [hotspot/README.md](hotspot/README.md) for the file guide and the integration point in `script.js`. No package installation is needed to use or share the folder.

## Maintainer checks

```sh
npm ci
npm run lint
npm test
```

Checks use Playwright, Microsoft Edge, axe, and Python's static server. Test artifacts and isolated folder copies stay outside the repository.

Framer Motion is installed per project preferences; its small DOM build and license are bundled locally. `shadcn@latest init --defaults` was attempted but does not support this plain HTML project. The page stays native HTML/CSS so the team can integrate it without a framework or build pipeline.
