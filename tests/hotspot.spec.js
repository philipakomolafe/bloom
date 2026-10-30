import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { createHash } from 'node:crypto'
import { mockRouter, renderRouterPage } from './routeros.js'

for (const mode of ['pap', 'chap', 'empty-password']) {
  test(`${mode} sends the native RouterOS login fields and follows its redirect`, async ({ page }) => {
    const password = mode === 'empty-password' ? '' : 'correct horse'
    const chap = mode === 'chap'
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('requestfailed', (request) => errors.push(`${request.url()}: ${request.failure()?.errorText}`))
    await mockRouter(page, chap ? { 'chap-id': '\\001', 'chap-challenge': '\\201\\002\\377\\000' } : {})
    let payload
    await page.route('**/hotspot-metro/login', async (route) => {
      expect(route.request().method()).toBe('POST')
      payload = Object.fromEntries(new URLSearchParams(route.request().postData()))
      // RouterOS serves alogin after accepting the POST; its script redirects to the destination.
      await route.fulfill({ contentType: 'text/html', body: await renderRouterPage('alogin.html') })
    })
    await page.route('**/connected', (route) => route.fulfill({ contentType: 'text/html', body: '<h1>Destination reached</h1>' }))
    await page.goto('/hotspot-metro/login.html')
    expect(errors).toEqual([])
    await expect(page.getByRole('button', { name: 'Log in & connect' })).toBeEnabled()
    await page.getByLabel('Username', { exact: true }).fill('philip')
    await page.getByLabel('Password', { exact: true }).fill(password)
    await page.getByRole('button', { name: 'Log in & connect' }).click()
    await expect(page.getByRole('heading', { name: 'Destination reached' })).toBeVisible()
    const expectedPassword = chap
      ? createHash('md5').update(Buffer.concat([Buffer.from([1]), Buffer.from(password), Buffer.from([129, 2, 255, 0])])).digest('hex')
      : password
    expect(payload).toEqual({ username: 'philip', password: expectedPassword, dst: 'https://example.test/welcome?a=1&b=2', popup: 'true' })
    expect(errors).toEqual([])
  })
}

test('CHAP refuses submission when its hash script fails to load', async ({ page }) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await mockRouter(page, { 'chap-id': '\\001', 'chap-challenge': '\\201\\002' })
  await page.route('**/md5.js', (route) => route.abort())
  const posts = []
  page.on('request', (request) => { if (request.method() === 'POST') posts.push(request.url()) })
  await page.goto('/hotspot-metro/login.html')
  expect(errors).toEqual([])
  await page.getByLabel('Username', { exact: true }).fill('philip')
  await page.getByLabel('Password', { exact: true }).fill('do-not-send')
  await page.getByRole('button', { name: 'Log in & connect' }).click()
  await expect(page.getByRole('alert')).toContainText('Reload the page')
  expect(posts).toEqual([])
})

test('router errors preserve the username, suppress trial access, and allow a retry', async ({ page }) => {
  await mockRouter(page, { username: 'philip', error: 'Invalid username or password.', trial: 'yes' })
  await page.goto('/hotspot-metro/login.html')
  await expect(page.getByRole('alert')).toHaveText('Invalid username or password.')
  await expect(page.getByLabel('Username', { exact: true })).toHaveValue('philip')
  await expect(page.locator('#trial-access')).toBeHidden()
  await page.getByLabel('Password', { exact: true }).fill('try-again')
  await expect(page.getByRole('alert')).toBeHidden()
  await expect(page.getByRole('button', { name: 'Log in & connect' })).toBeEnabled()
})

for (const trial of ['yes', 'no']) {
  test(`trial access follows the router setting: ${trial}`, async ({ page }) => {
    await mockRouter(page, { trial })
    await page.goto('/hotspot-metro/login.html')
    const link = page.getByRole('link', { name: 'Try a free connection' })
    if (trial === 'no') {
      await expect(link).toBeHidden()
      return
    }
    await expect(link).toBeVisible()
    await page.route('**/hotspot-metro/login?*', (route) => route.fulfill({ body: 'Trial requested' }))
    await link.click()
    const destination = new URL(page.url())
    expect(destination.searchParams.get('username')).toBe('T-AA:BB:CC:DD:EE:FF')
    expect(destination.searchParams.get('dst')).toBe('https://example.test/welcome?a=1&b=2')
  })
}

test('logout shows the completed session and reconnects using the router URL', async ({ page }) => {
  await mockRouter(page, { username: 'philip', 'session-time-left': '36m' })
  await page.goto('/hotspot-metro/logout.html')
  await expect(page.getByRole('heading', { name: 'You’re logged out.' })).toBeVisible()
  await expect(page.locator('.session-account p')).toHaveText('philip')
  await expect(page.locator('.session-metrics dd')).toHaveText(['1h 24m', '42.5 MiB', '680.2 MiB'])
  await expect(page.locator('.session-remaining dd')).toHaveText('36m')
  await page.getByText('Connection details', { exact: true }).click()
  await expect(page.locator('.connection-details dd')).toHaveText(['10.5.50.25', 'AA:BB:CC:DD:EE:FF'])
  await page.getByRole('link', { name: 'Log in again' }).click()
  await expect(page).toHaveURL(/\/hotspot-metro\/login.html\?dst=https%3A%2F%2Fexample.test%2Fwelcome$/)
})

test('an unlimited session hides time remaining and blocked popups reconnect in place', async ({ page }) => {
  await mockRouter(page, { username: 'philip' })
  await page.goto('/hotspot-metro/logout.html')
  await expect(page.locator('.session-remaining')).toHaveCount(0)
  await page.evaluate(() => { window.name = 'hotspot_logout'; window.open = () => null })
  await page.getByRole('link', { name: 'Log in again' }).click()
  await expect(page).toHaveURL(/\/hotspot-metro\/login.html\?dst=/)
  expect(page.isClosed()).toBe(false)
})

test('the logout popup opens a login window before closing itself', async ({ page, context }) => {
  await mockRouter(page, { username: 'philip' })
  await page.goto('/hotspot-metro/login.html')
  const popupPromise = context.waitForEvent('page')
  await page.evaluate(() => window.open('logout.html', 'hotspot_logout'))
  const popup = await popupPromise
  await popup.waitForLoadState()
  const loginPromise = context.waitForEvent('page')
  await popup.getByRole('link', { name: 'Log in again' }).click()
  const login = await loginPromise
  await expect(login).toHaveURL(/\/hotspot-metro\/login.html\?dst=/)
  await expect.poll(() => popup.isClosed()).toBe(true)
})

test('the status page keeps its logout navigation when popups are blocked', async ({ page }) => {
  await mockRouter(page, { username: 'philip' })
  await page.route(/\/hotspot-metro\/logout(?:\?.*)?$/, async (route) => route.fulfill({ contentType: 'text/html', body: await renderRouterPage('logout.html', { username: 'philip' }) }))
  await page.goto('/hotspot-metro/status.html')
  await page.evaluate(() => { window.name = 'hotspot_status'; window.open = () => null })
  await page.getByRole('button', { name: 'Log out', exact: true }).click()
  await expect(page).toHaveURL(/\/hotspot-metro\/logout\??$/)
  await expect(page.getByRole('link', { name: 'Log in again' })).toBeVisible()
})

test('logout remains responsive, accessible, and usable without the animation library', async ({ page }) => {
  await mockRouter(page, { username: 'a'.repeat(253), 'session-time-left': '36m' })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('**/assets/vendor/motion.js', (route) => route.abort())
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/hotspot-metro/logout.html')
  await page.getByText('Connection details', { exact: true }).click()
  for (const width of [280, 320, 390, 560, 760, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow at ${width}`).toBe(true)
  }
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    expect(result.violations).toEqual([])
  }
  expect(errors).toEqual([])
})

test('local logout previews hide router tokens and reconnect to the local login', async ({ page }) => {
  await page.goto('/hotspot-metro/logout.html')
  await expect(page.locator('.session-metrics dd')).toHaveText(['—', '—', '—'])
  await expect(page.locator('body')).not.toContainText('$(')
  await page.getByRole('link', { name: 'Log in again' }).click()
  await expect(page).toHaveURL(/\/hotspot-metro\/login.html$/)
})

test('rendered login cannot submit passwords with JavaScript disabled; logout still reconnects', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  try {
    const page = await context.newPage()
    await mockRouter(page, { 'chap-id': '\\001', 'chap-challenge': '\\201\\002', username: 'philip' })
    const posts = []
    page.on('request', (request) => { if (request.method() === 'POST') posts.push(request.url()) })
    await page.goto('http://127.0.0.1:8765/hotspot-metro/login.html')
    await page.getByLabel('Password', { exact: true }).fill('do-not-send')
    await page.getByLabel('Password', { exact: true }).press('Enter')
    await expect(page.getByRole('button', { name: 'Log in & connect' })).toBeDisabled()
    expect(posts).toEqual([])
    await page.goto('http://127.0.0.1:8765/hotspot-metro/logout.html')
    await page.getByRole('link', { name: 'Log in again' }).click()
    await expect(page).toHaveURL(/\/hotspot-metro\/login.html\?dst=/)
  } finally { await context.close() }
})

test('the retained captive portal API renders valid connected and disconnected responses', async () => {
  expect(JSON.parse(await renderRouterPage('api.json'))).toEqual({ captive: false, 'user-portal-url': '/hotspot-metro/login', 'can-extend-session': true })
  const disconnected = JSON.parse(await renderRouterPage('api.json', { 'logged-in': 'no', 'session-timeout-secs': '900', 'remain-bytes-total': '1024' }))
  expect(disconnected).toEqual({ captive: true, 'user-portal-url': '/hotspot-metro/login', 'seconds-remaining': 900, 'bytes-remaining': 1024, 'can-extend-session': true })
})
