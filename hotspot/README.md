# MetroReach Internet login page

**Send this `hotspot` folder on its own.** Open `login.html` to view it. No installation, build command, internet connection, or other repository files are needed.

This is a frontend design for your team to integrate with its current login system. It contains no authentication service, MikroTik configuration, account creation, or session pages. Submitting the form in this preview sends nothing.

- `login.html` — the page, copy, and username/password form.
- `styles.css` — responsive layout, colors, and local fonts.
- `script.js` — password visibility, preview validation, and the sliding carousel.
- `assets/` — the existing project's logos and fonts, plus a small local Motion browser library and licenses.

**Replacing an existing login page:** the design uses plain HTML, CSS, and JavaScript, so no new framework or backend is required. The team must connect the form to its current sign-in flow before publishing it.

1. Use this `login.html` as the new presentation and copy its CSS, JavaScript, and assets into the existing portal. Preserve the current portal's authentication scripts and supporting pages. Merge or rename any colliding asset files and update their references.
2. Connect `#login-form` to the existing login endpoint. The fields already use `name="username"` and `name="password"`. Keep their IDs for the page's interactions. Restore the current portal's hidden fields, template variables, and any required form name or callbacks.
3. Find the `INTEGRATION` comment in `script.js` and replace that preview submit listener with the existing login flow. For a native form POST, remove the preview listener's `preventDefault()` behavior. Keep the password visibility and carousel code. Display real login errors as text in `#form-message` and remove its `hidden` attribute when needed.
4. For MikroTik, retain the existing login action, destination fields, CHAP/password handling, and success/logout redirects. Check both a successful and unsuccessful login on the team's existing setup before switching visitors to the new page.

The existing system continues to manage users, passwords, plans, and sessions. This folder supplies the replacement interface; simply uploading the preview does not enable authentication.

The carousel gives each of the twelve original R28 companies its own slide, with its logo, sector, name, and description. It advances every 4.2 seconds, has no playback buttons, and supports swipes and keyboard arrows. Desktop and phones share the same carousel above or beside the login form. It respects reduced motion and pauses while hovered, keyboard-focused, off-screen, or in a hidden tab. The Facebook screenshot inspired only the split layout.

Original assets: [MetroReach](https://www.metroreach.ng) and [R28's portfolio](https://r28.ng/our-investments). The portfolio presentation does not claim MetroReach customer contracts.
