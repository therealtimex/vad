#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

const root = process.cwd()
const versionArg = process.argv[2]
if (!versionArg || !/^\d+\.\d+\.\d+$/.test(versionArg)) {
  console.error('Usage: node scripts/bump-version.mjs <version> (e.g., 0.1.3)')
  process.exit(1)
}
const newVersion = versionArg

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}
function writeJSON(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8')
}

// Update package versions
const webPkgPath = path.join(root, 'packages/web/package.json')
const reactPkgPath = path.join(root, 'packages/react/package.json')

const webPkg = readJSON(webPkgPath)
webPkg.version = newVersion
writeJSON(webPkgPath, webPkg)

const reactPkg = readJSON(reactPkgPath)
reactPkg.version = newVersion
if (reactPkg.dependencies && reactPkg.dependencies['@realtimex/vad-web']) {
  reactPkg.dependencies['@realtimex/vad-web'] = `^${newVersion}`
}
writeJSON(reactPkgPath, reactPkg)

// Update examples package.json deps
const examples = [
  'examples/bundler/package.json',
  'examples/react-bundler/package.json',
  'examples/nextjs/package.json',
]
for (const rel of examples) {
  const p = path.join(root, rel)
  if (!fs.existsSync(p)) continue
  const pkg = readJSON(p)
  if (pkg.dependencies && pkg.dependencies['@realtimex/vad-web']) {
    pkg.dependencies['@realtimex/vad-web'] = `^${newVersion}`
  }
  if (pkg.dependencies && pkg.dependencies['@realtimex/vad-react']) {
    pkg.dependencies['@realtimex/vad-react'] = `^${newVersion}`
  }
  writeJSON(p, pkg)
}

// Update README/CDN snippets and script-tag example
function replaceInFile(file, replacers) {
  if (!fs.existsSync(file)) return
  let content = fs.readFileSync(file, 'utf8')
  for (const [pattern, replacement] of replacers) {
    content = content.replace(pattern, replacement)
  }
  fs.writeFileSync(file, content, 'utf8')
}

const versionPattern = /@realtimex\/vad-web@\d+\.\d+\.\d+/g
replaceInFile(path.join(root, 'README.md'), [
  [versionPattern, `@realtimex/vad-web@${newVersion}`],
])
replaceInFile(path.join(root, 'packages/web/README.md'), [
  [versionPattern, `@realtimex/vad-web@${newVersion}`],
])
replaceInFile(path.join(root, 'examples/script-tags/index.html'), [
  [versionPattern, `@realtimex/vad-web@${newVersion}`],
])

console.log(`Bumped versions to ${newVersion}`)
