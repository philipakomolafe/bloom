import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import assert from 'node:assert/strict'
import { cp, mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

test('the copied hotspot folder works offline without repository files', async ({ browser }) => {
  const directory = await mkdtemp(join(tmpdir(), 'metroreach isolated '))
  const context = await browser.newContext({ offline: true, reducedMotion: 'reduce' })
  try {
    await cp(fileURLToPath(new URL('../hotspot', import.meta.url)), directory, { recursive: true })
    expect((await readdir(directory)).filter((file) => file.endsWith('.html'))).toEqual(['login.html'])
    const page = await context.newPage()
    const errors = []
    const external = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('requestfailed', (request) => errors.push(request.url()))
    page.on('request', (request) => { if (!request.url().startsWith(pathToFileURL(directory).href)) external.push(request.url()) })
    await page.goto(pathToFileURL(join(directory, 'login.html')).href)
    await expect(page.getByRole('button', { name: 'Log in & connect' })).toBeEnabled()
    expect(await page.locator('img').evaluateAll(async (images) => {
      await Promise.all(images.map((image) => image.decode()))
      return images.every((image) => image.naturalWidth > 0)
    })).toBe(true)
    await page.locator('.brand-carousel').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('.is-current h3')).toHaveText('Biswal')
    expect(await page.evaluate(async () => {
      const fonts = await Promise.all(['16px Geist', 'italic 16px "Instrument Serif"'].map((font) => document.fonts.load(font)))
      return fonts.every((faces) => faces.length > 0 && faces.every((face) => face.status === 'loaded'))
    })).toBe(true)
    await page.getByLabel('Username', { exact: true }).fill('offline-user')
    await page.getByLabel('Password', { exact: true }).fill('preview-only')
    await page.getByRole('button', { name: 'Log in & connect' }).click()
    await expect(page.getByRole('alert')).toContainText('No login details have been sent')
    expect(external).toEqual([])
    expect(errors).toEqual([])
  } finally {
    await context.close()
    assert.ok(resolve(directory).startsWith(resolve(tmpdir()) + sep + 'metroreach isolated '))
    await rm(directory, { recursive: true, force: true })
  }
})

test('preview validation, password visibility, and inline help work without submitting', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/hotspot\/login.html$/)
  await expect(page.getByRole('button', { name: 'Log in & connect' })).toBeEnabled()
  const posts = []
  page.on('request', (request) => { if (request.method() === 'POST') posts.push(request.url()) })
  await page.getByLabel('Username', { exact: true }).fill('   ')
  await page.getByLabel('Password', { exact: true }).fill('preview-only')
  await page.getByRole('button', { name: 'Log in & connect' }).click()
  await expect(page.getByRole('alert')).toContainText('Enter your username')
  await page.getByLabel('Username', { exact: true }).fill('philip')
  await page.getByRole('button', { name: 'Show password', exact: true }).click()
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'text')
  await page.getByRole('button', { name: 'Hide password', exact: true }).click()
  await page.getByRole('button', { name: 'Log in & connect' }).click()
  await expect(page.getByRole('alert')).toHaveText('This is a design preview. No login details have been sent.')
  await page.locator('summary').focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('link', { name: 'Contact MetroReach' })).toBeVisible()
  expect(posts).toEqual([])
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0])
})

test('one slide per company loops through all twelve companies without playback buttons', async ({ page }) => {
  await page.clock.install()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/hotspot/login.html')
  await expect(page.locator('.carousel-card:not([data-clone])')).toHaveCount(12)
  await expect(page.locator('.brand-carousel button')).toHaveCount(0)
  await expect(page.locator('.is-current h3')).toHaveText('Arbico Plc')
  await page.clock.runFor(100)
  const seen = new Set(['Arbico Plc'])
  for (let i = 0; i < 12; i++) {
    await page.clock.runFor(4200)
    seen.add(await page.locator('.is-current h3').textContent())
  }
  expect(seen.size).toBe(12)
  await page.clock.runFor(1000)
  await expect(page.locator('.is-current:not([data-clone]) h3')).toHaveText('Arbico Plc')
  expect(errors).toEqual([])
})

test('reduced motion stops autoplay and keeps manual scene changes available', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.clock.install()
  await page.goto('/hotspot/login.html')
  await page.clock.runFor(16000)
  await expect(page.locator('.is-current h3')).toHaveText('Arbico Plc')
  await page.locator('.brand-carousel').focus()
  await page.keyboard.press('ArrowLeft')
  await expect(page.locator('.is-current h3')).toHaveText('Utopian Consulting')
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('.is-current h3')).toHaveText('Arbico Plc')
})

test('small screens stay within the viewport and the page meets automated WCAG AA checks', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/hotspot/login.html')
  for (const width of [320, 390, 760, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow at ${width}`).toBe(true)
  }
  await page.locator('summary').click()
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    expect(result.violations.map(({ id, nodes }) => ({ id, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) }))).toEqual([])
  }
})

test('a missing animation library leaves form interactions usable', async ({ page }) => {
  await page.route('**/assets/vendor/motion.js', (route) => route.abort())
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/hotspot/login.html')
  await page.getByLabel('Username', { exact: true }).fill('test')
  await page.getByLabel('Password', { exact: true }).fill('not-sent')
  await page.getByRole('button', { name: 'Log in & connect' }).click()
  await expect(page.getByRole('alert')).toContainText('No login details have been sent')
  expect(errors).toEqual([])
})

test('disabled JavaScript shows guidance and cannot submit credentials', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  try {
    const page = await context.newPage()
    await page.goto('http://127.0.0.1:8765/hotspot/login.html')
    await expect(page.getByRole('button', { name: 'Log in & connect' })).toBeDisabled()
    await expect(page.getByText('Enable JavaScript to use this login page.')).toBeVisible()
    await page.getByLabel('Username', { exact: true }).fill('test')
    await page.getByLabel('Password', { exact: true }).fill('not-sent')
    await page.getByLabel('Password', { exact: true }).press('Enter')
    await expect(page).toHaveURL(/login.html$/)
  } finally { await context.close() }
})
