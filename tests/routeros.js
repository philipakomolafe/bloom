import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const defaults = {
  'link-login-only': '/hotspot-metro/login',
  'link-login': '/hotspot-metro/login.html?dst=https%3A%2F%2Fexample.test%2Fwelcome',
  'link-orig': 'https://example.test/welcome?a=1&b=2',
  'link-orig-esc': encodeURIComponent('https://example.test/welcome?a=1&b=2'),
  'link-redirect': '/connected',
  'link-redirect-esc': encodeURIComponent('/connected'),
  'link-status': '/hotspot-metro/status.html',
  'link-logout': '/hotspot-metro/logout',
  'chap-id': '',
  'chap-challenge': '',
  'session-time-left': '',
  'refresh-timeout': '',
  'advert-pending': 'no',
  'login-by': 'http-pap',
  'login-by-mac': 'no',
  'logged-in': 'yes',
  'session-timeout-secs': '0',
  'remain-bytes-total': '',
  username: '',
  error: '',
  trial: 'no',
  popup: 'false',
  blocked: 'no',
  ip: '10.5.50.25',
  hostname: 'hotspot.example.test',
  mac: 'AA:BB:CC:DD:EE:FF',
  'mac-esc': 'AA%3ABB%3ACC%3ADD%3AEE%3AFF',
  uptime: '1h 24m',
  'bytes-in-nice': '42.5 MiB',
  'bytes-out-nice': '680.2 MiB',
}

// Render the real templates in memory; only RouterOS variables/conditionals are simulated.
export async function renderRouterPage(file, overrides = {}) {
  assert.match(file, /^[a-z-]+\.(html|json)$/)
  const source = await readFile(new URL(`../hotspot-metro/${file}`, import.meta.url), 'utf8')
  const values = { ...defaults, ...overrides }
  const stack = []
  let active = true
  let result = ''
  let position = 0

  function condition(expression) {
    const comparison = expression.match(/^([\w-]+)\s*(==|!=)\s*(.*)$/)
    if (!comparison) return Boolean(values[expression])
    const [, key, operator, quoted] = comparison
    const value = quoted.replace(/^(['"])(.*)\1$/, '$2')
    const equal = String(values[key] ?? '') === value
    return operator === '==' ? equal : !equal
  }

  for (const token of source.matchAll(/\$\(([^)]+)\)/g)) {
    if (active) result += source.slice(position, token.index)
    position = token.index + token[0].length
    const expression = token[1]
    if (expression.startsWith('if ')) {
      const matched = condition(expression.slice(3))
      stack.push({ parent: active, matched })
      active = active && matched
    } else if (expression === 'else' || expression.startsWith('elif ')) {
      const branch = stack.at(-1)
      assert.ok(branch, 'Conditional branch without an if')
      const matched = !branch.matched && (expression === 'else' || condition(expression.slice(5)))
      active = branch.parent && matched
      branch.matched ||= matched
    } else if (expression === 'endif') {
      assert.ok(stack.length, 'Closing conditional without an if')
      active = stack.pop().parent
    } else if (active) {
      assert.ok(Object.hasOwn(values, expression), `Missing router fixture: ${expression}`)
      result += values[expression]
    }
  }
  assert.equal(stack.length, 0, 'Unclosed router conditional')
  if (active) result += source.slice(position)
  return result
}

export async function mockRouter(page, values = {}) {
  await page.context().route(/\/hotspot-metro\/[a-z-]+\.html(?:\?.*)?$/, async (route) => {
    const file = new URL(route.request().url()).pathname.split('/').at(-1)
    await route.fulfill({ contentType: 'text/html; charset=utf-8', body: await renderRouterPage(file, values) })
  })
}
