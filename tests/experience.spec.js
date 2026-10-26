import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('loads original local logos and opens a sourced company profile', async ({ page }) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  expect(errors).toEqual([])
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Every connection')
  await page.getByRole('button', { name: 'Discover Arbico Plc', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading')).toHaveText('Arbico Plc')
  await expect(dialog.getByRole('link', { name: /Explore on R28/ })).toHaveAttribute('href', 'https://r28.ng/our-investments/arbico')
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Discover Arbico Plc', exact: true })).toBeFocused()
  await expect.poll(() => page.locator('#network img').evaluateAll((images) => images
    .filter((image) => !image.complete || image.naturalWidth === 0)
    .map((image) => ({ source: image.getAttribute('src'), currentSource: image.currentSrc, complete: image.complete, width: image.naturalWidth })))).toEqual([])
  expect(errors).toEqual([])
})

test('every business remains discoverable directly without playback controls', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByRole('button', { name: /Pause animation|Play animation|Replay|Next company|Previous company|Playback speed/ })).toHaveCount(0)
  for (const name of ['Biswal', 'Nivafer', 'Asaba Airport Company', 'Veenocks', 'AFL Networks', 'FIDC', 'LEDCo', 'Eco Joinery', 'Anker Support Services', 'Prestige Chen Jun', 'Utopian Consulting', 'Arbico Plc']) {
    await page.getByRole('button', { name: `Spotlight ${name}`, exact: true }).last().click()
    await expect(page.locator('.spotlight-story h3').last()).toHaveText(name)
  }
})

test('automatically advances even when the pointer rests over a company', async ({ page }) => {
  await page.goto('/')
  await page.locator('.network-shell').scrollIntoViewIfNeeded()
  await page.locator('.spotlight-logo').last().hover()
  await expect(page.locator('.spotlight-story h3').last()).toHaveText('Biswal', { timeout: 12000 })
})

test('directory search, sector filters, and empty state remain consistent', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Directory', exact: true }).click()
  await expect(page.getByRole('button', { name: /Read about/ })).toHaveCount(12)
  await page.getByRole('combobox', { name: 'Filter by sector' }).selectOption('Manufacturing')
  await expect(page.getByRole('button', { name: /Read about/ })).toHaveCount(2)
  await page.getByRole('button', { name: 'Search businesses', exact: true }).click()
  await page.getByRole('searchbox', { name: 'Search businesses by name or description' }).fill('  VeeNocks ')
  await expect(page.getByRole('button', { name: /Read about/ })).toHaveCount(1)
  await expect(page.locator('.company-card-shell:not([hidden]) .company-card-name')).toHaveText('Veenocks')
  await page.getByRole('searchbox', { name: 'Search businesses by name or description' }).fill('unmatched business')
  await expect(page.getByRole('heading', { name: 'A new connection is one search away.' })).toBeVisible()
  await page.getByRole('button', { name: 'Explore all businesses' }).click()
  await expect(page.getByRole('button', { name: /Read about/ })).toHaveCount(12)
  await page.getByRole('combobox', { name: 'Filter by sector' }).selectOption('Healthcare')
  await page.getByRole('button', { name: 'Network view', exact: true }).click()
  await expect(page.locator('.spotlight-inner:not(.is-leaving) h3')).toHaveText('Utopian Consulting')
  await expect(page.getByRole('button', { name: /^Spotlight / })).toHaveCount(0)
})

test('contact flow validates input and creates an encoded, unsent email draft', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Let’s connect', exact: true }).first().click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Your name').fill('   ')
  await dialog.getByLabel('Business name').fill('   ')
  await dialog.getByRole('button', { name: /Let’s get acquainted/ }).click()
  await expect(dialog.getByRole('alert')).toHaveText('Please add your name and your business name.')
  await dialog.getByLabel('Your name').fill('Philip & Co')
  await dialog.getByLabel('Business name').fill('A+B / Lagos')
  await dialog.getByRole('button', { name: /Let’s get acquainted/ }).click()
  await dialog.getByRole('radio', { name: /Build on your network/ }).check()
  await dialog.getByRole('button', { name: /Prepare my introduction/ }).click()
  await expect(dialog.getByRole('heading')).toHaveText('Your next chapter awaits.')
  const href = await dialog.getByRole('link', { name: 'Open email draft' }).getAttribute('href')
  expect(href).toMatch(/^mailto:wholesale@metroreach.ng\?subject=/)
  expect(decodeURIComponent(href)).toContain('Philip & Co from A+B / Lagos')
  await expect(dialog.getByText('Nothing has been sent.', { exact: false })).toBeVisible()
  await dialog.getByRole('button', { name: 'Go back' }).click()
  await expect(dialog.getByRole('radio', { name: /Build on your network/ })).toBeChecked()
})

test('sharing supports clipboard success and a manual-copy fallback', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/')
  await page.getByRole('button', { name: 'Share network', exact: true }).click()
  await page.getByRole('button', { name: 'Copy link', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('Link copied. Ready to share.')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('http://127.0.0.1:8765/#ecosystem')
  await page.keyboard.press('Escape')
  await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('Unavailable') } })
  await page.getByRole('button', { name: 'Share network', exact: true }).click()
  await page.getByRole('button', { name: 'Copy link', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('Copy the selected link to share this ecosystem.')
})

test('keyboard focus preserves the current company while the user interacts', async ({ page }) => {
  await page.goto('/')
  await page.locator('.network-shell').scrollIntoViewIfNeeded()
  await page.keyboard.press('Tab')
  await page.getByRole('button', { name: 'Discover Arbico Plc', exact: true }).focus()
  await page.clock.install()
  await page.clock.runFor(9000)
  await expect(page.locator('.spotlight-story h3')).toHaveText('Arbico Plc')
  await expect(page.getByRole('button', { name: 'Discover Arbico Plc', exact: true })).toBeFocused()
})

test('reduced motion stops automatic cycling and keeps logo selection usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('button', { name: 'Spotlight Biswal', exact: true }).click()
  await expect(page.locator('.spotlight-story h3').last()).toHaveText('Biswal')
  await page.clock.install()
  await page.clock.runFor(10000)
  await expect(page.locator('.spotlight-story h3')).toHaveText('Biswal')
})

test('mobile navigation, touch profiles, and small viewports work without overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Our businesses' }).click()
  await expect(page.getByRole('button', { name: /Read about/ })).toHaveCount(12)
  await page.getByRole('button', { name: 'Read about Arbico Plc' }).click()
  await expect(page.getByRole('dialog').getByRole('heading')).toHaveText('Arbico Plc')
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await page.getByRole('button', { name: 'Network view', exact: true }).click()
  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), { message: `No horizontal overflow at ${width}px` }).toBe(true)
  }
})

test('the network, directory, company profile, and introduction meet axe WCAG AA checks', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  for (const section of ['#connection', '.final-cta']) {
    await page.locator(section).scrollIntoViewIfNeeded()
    await expect(page.locator(section)).toHaveCSS('opacity', '1')
  }
  await page.locator('#ecosystem').scrollIntoViewIfNeeded()
  const check = async () => {
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    expect(result.violations.map((item) => ({ id: item.id, nodes: item.nodes.map((node) => ({ target: node.target, reason: node.failureSummary })) }))).toEqual([])
  }
  await check()
  await page.getByRole('button', { name: 'Directory', exact: true }).click()
  await check()
  await page.getByRole('button', { name: 'Read about Arbico Plc' }).click()
  await check()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Let’s connect', exact: true }).first().click()
  await check()
  await page.getByLabel('Your name').fill('Philip')
  await page.getByLabel('Business name').fill('Bloom')
  await page.getByRole('button', { name: /Let’s get acquainted/ }).click()
  await check()
  await page.getByRole('button', { name: /Prepare my introduction/ }).click()
  await check()
})
