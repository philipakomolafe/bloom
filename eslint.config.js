import js from '@eslint/js'
import globals from 'globals'

// The upload folder runs locally; npm is only needed for maintainer checks.
export default [
  { ignores: ['node_modules', 'hotspot-metro/assets/vendor', 'hotspot-metro/md5.js'] },
  js.configs.recommended,
  { files: ['hotspot-metro/*.js'], languageOptions: { globals: globals.browser } },
  { files: ['tests/*.js', 'playwright.config.js'], languageOptions: { globals: { ...globals.browser, ...globals.node } } },
]
