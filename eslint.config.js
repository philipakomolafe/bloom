import js from '@eslint/js'
import globals from 'globals'

// The upload folder runs locally; npm is only needed for maintainer checks.
export default [
  { ignores: ['node_modules', 'hotspot/assets/vendor'] },
  js.configs.recommended,
  { files: ['hotspot/*.js'], languageOptions: { globals: globals.browser } },
  { files: ['tests/*.js', 'playwright.config.js'], languageOptions: { globals: { ...globals.browser, ...globals.node } } },
]
