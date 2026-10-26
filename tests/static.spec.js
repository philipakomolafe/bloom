import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import assert from 'node:assert/strict'
import { copyFile, cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

test.use({ offline: true, reducedMotion: 'reduce' })

async function withCopiedSite(run) {
  const directory = await mkdtemp(join(tmpdir(), 'bloom editable '))
  const root = fileURLToPath(new URL('../', import.meta.url))
  try {
    for (const name of ['index.html', 'styles.css', 'script.js']) await copyFile(join(root, name), join(directory, name))
    await cp(join(root, 'assets'), join(directory, 'assets'), { recursive: true })
    await run({ directory, url: pathToFileURL(join(directory, 'index.html')).href })
  } finally {
    // Only remove the isolated directory created by this test, outside the repository.
    assert.ok(resolve(directory).startsWith(resolve(tmpdir()) + sep + 'bloom editable '), 'Unexpected temporary path')
    await rm(directory, { recursive: true, force: true })
  }
}

test('the four website items work offline from a folder with no packages', async ({ page }) => {
  await withCopiedSite(async ({ directory, url }) => {
    const errors = []
    const externalRequests = []
    const localPrefix = pathToFileURL(directory).href + '/'
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('requestfailed', (request) => errors.push(request.url()))
    page.on('request', (request) => { if (!request.url().startsWith(localPrefix)) externalRequests.push(request.url()) })
    expect((await readdir(directory)).sort()).toEqual(['assets', 'index.html', 'script.js', 'styles.css'])
    await page.goto(url)
    await expect(page.getByRole('button', { name: 'Discover Arbico Plc', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Directory', exact: true }).click()
    await expect(page.getByRole('button', { name: /Read about/ })).toHaveCount(12)
    expect(await page.locator('#directory img, .provider-logo img, .connection-logo img').evaluateAll(async (images) => {
      await Promise.all(images.map((image) => image.decode()))
      return images.every((image) => image.complete && image.naturalWidth > 0)
    })).toBe(true)
    expect(await page.evaluate(async () => {
      const fonts = await Promise.all(['16px "Geist Variable"', '16px "Instrument Serif"', 'italic 16px "Instrument Serif"'].map((font) => document.fonts.load(font, 'Bloom')))
      return fonts.every((faces) => faces.length > 0 && faces.every((face) => face.status === 'loaded'))
    })).toBe(true)

    await page.getByRole('button', { name: 'Read about Veenocks' }).click()
    await expect(page.getByRole('dialog').getByRole('heading')).toHaveText('Veenocks')
    await page.keyboard.press('Escape')
    await page.locator('.header-cta').click()
    await page.getByLabel('Your name').fill('Ada & Co')
    await page.getByLabel('Business name').fill('Local Studio')
    await page.getByRole('button', { name: /Let’s get acquainted/ }).click()
    await page.getByRole('radio', { name: /Build on your network/ }).check()
    await page.getByRole('button', { name: /Prepare my introduction/ }).click()
    await expect(page.getByRole('link', { name: 'Open email draft' })).toHaveAttribute('href', /^mailto:wholesale@metroreach.ng/)
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Share network', exact: true }).click()
    await expect(page.getByRole('dialog')).toContainText('Zip and send the website folder')
    await expect(page.getByRole('button', { name: 'Copy link', exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: 'Got it' }).click()

    await page.getByRole('button', { name: 'Search businesses', exact: true }).click()
    await page.getByRole('searchbox').fill('Veenocks')
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    }
    expect(errors).toEqual([])
    expect(externalRequests).toEqual([])
    // Audit after recording runtime requests: axe may fetch file stylesheets itself.
    await page.getByRole('button', { name: 'Share network', exact: true }).click()
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([])
    await page.close()
  })
})

test('editing HTML and CSS updates content, filtering, counts, and colours without a build', async ({ page }) => {
  await withCopiedSite(async ({ directory, url }) => {
    const htmlPath = join(directory, 'index.html')
    const cssPath = join(directory, 'styles.css')
    let html = await readFile(htmlPath, 'utf8')
    const article = html.match(/<article class="company-card-shell" data-company="arbico">[\s\S]*?<\/article>/)[0]
    const newArticle = article.replace('data-company="arbico"', 'data-company="studio"').replaceAll('Arbico Plc', 'Studio &amp; Co').replace('>Construction<', '>Design<')
    html = html.replace(article, article + '\n' + newArticle).replace('<h1>Every connection,', '<h1>Every great idea,')
    await writeFile(htmlPath, html)
    await writeFile(cssPath, (await readFile(cssPath, 'utf8')).replace('--primary: #20533e', '--primary: #234b63'))

    await page.goto(url)
    await expect(page.locator('h1')).toContainText('Every great idea,')
    await expect(page.locator('.header-cta')).toHaveCSS('background-color', 'rgb(35, 75, 99)')
    await expect(page.locator('[data-company-count]')).toHaveText('13')
    await expect(page.locator('[data-sector-count]')).toHaveText('09')
    await page.getByRole('combobox', { name: 'Filter by sector' }).selectOption('Design')
    await expect(page.getByRole('button', { name: 'Discover Studio & Co' })).toBeVisible()
    await page.getByRole('button', { name: 'Directory', exact: true }).click()
    await expect(page.getByRole('button', { name: /Read about/ })).toHaveCount(1)
    await page.getByRole('button', { name: 'Read about Studio & Co' }).click()
    await expect(page.getByRole('dialog').getByRole('heading')).toHaveText('Studio & Co')
    await page.close()
  })
})

test('the company directory and primary page content remain readable without JavaScript', async ({ browser }) => {
  await withCopiedSite(async ({ url }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, offline: true })
    try {
      const page = await context.newPage()
      await page.goto(url)
      await expect(page.locator('h1')).toContainText('Every connection')
      await expect(page.getByRole('button', { name: /Read about/ })).toHaveCount(12)
      await expect(page.getByRole('link', { name: 'contact MetroReach by email' })).toHaveAttribute('href', 'mailto:sales@metroreach.ng')
    } finally {
      await context.close()
    }
  })
})
