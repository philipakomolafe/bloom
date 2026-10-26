import js from '@eslint/js'
import globals from 'globals'

// Optional maintainer checks; the website itself has no package dependencies.
export default [
  { ignores: ['node_modules'] },
  js.configs.recommended,
  { files: ['script.js'], languageOptions: { globals: globals.browser } },
  { files: ['tests/*.js', 'playwright.config.js'], languageOptions: { globals: { ...globals.browser, ...globals.node } } },
]
