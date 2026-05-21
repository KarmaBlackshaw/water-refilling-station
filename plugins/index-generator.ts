import fs from 'fs'
import path from 'path'
import os from 'os'
import fg from 'fast-glob'

import type { Plugin } from 'vite'

function stripExtension(fileName: string) {
  return fileName?.replace(/\.[^/.]+$/, '') ?? ''
}

function combinePathToName(filePath: string) {
  const pathNamesArray = filePath
    .split('/')
    .join('')
    .split(/(?=[A-Z])/)

  return pathNamesArray
    .filter((item, index) => pathNamesArray[index + 1] !== item)
    .join('')
    .replace(/\.vue$/, '')
    .replace(/index$/g, '')
}

function isMacOs() {
  return os.platform() === 'darwin'
}

async function generateTsEntry(directoryPath: string) {
  const outputFile = path.join(directoryPath, 'index.ts')
  const globPath = isMacOs() ? path.join(directoryPath, '**/*.ts') : `${directoryPath}**/*.ts`

  const files = await fg(globPath, { dot: true })
  const exportFiles = files.filter((file) => !file.endsWith('index.ts'))

  const exportStatements = ['/** This file is auto generated */\n']
    .concat(
      exportFiles
        .map((file) => {
          const tsPath = file.replace(directoryPath, '').replace('.ts', '')
          const relativePath = `./${tsPath}`
          return `export * from "${relativePath}";`
        })
        .sort()
    )
    .concat('')
    .join('\n')

  fs.writeFileSync(outputFile, exportStatements, 'utf8')
  console.log(`${outputFile} generated successfully.`)
}

async function generateVueEntry(directoryPath: string, prefill: string[] = []) {
  const outputFile = path.join(directoryPath, 'index.ts')
  const globPath = isMacOs() ? path.join(directoryPath, '**/*.vue') : `${directoryPath}**/*.vue`

  const files = await fg(globPath, { dot: true })
  const exportFiles = files.filter((file) => !file.endsWith('index.ts'))

  const header = ['/** This file is auto generated */\n', ...prefill]

  const exportStatements = header
    .concat(
      exportFiles
        .filter((file) => !file.includes('_'))
        .map((file) => {
          const vuePath = file.replace(directoryPath, '')
          const newFileName = combinePathToName(vuePath)
          const relativePath = `./${vuePath}`
          return `export { default as ${newFileName} } from "${relativePath}";`
        })
        .sort()
    )
    .concat('')
    .join('\n')

  fs.writeFileSync(outputFile, exportStatements, 'utf8')
  console.log(`${outputFile} generated successfully.`)
}

async function generateComponentsEntry() {
  const directoryPath = 'src/components/'
  const outputFile = path.join(directoryPath, 'index.ts')

  const prefill = [
    '/** This file is auto generated */\n',
    `export * from "./Base";`,
    `export * from "./Icon";`,
    `export * from "./The";`,
    '',
  ]

  fs.writeFileSync(outputFile, prefill.join('\n'), 'utf8')
  console.log(`${outputFile} generated successfully.`)
}

async function generateStoresEntry() {
  await generateTsEntry('src/stores/')
}

async function generateTypesEntry() {
  await generateTsEntry('src/types/')
}

async function generateComposablesEntry() {
  await generateTsEntry('src/composables/')
}

async function generateServicesEntry() {
  await generateTsEntry('src/services/')
}

async function generateLayoutsEntry() {
  await generateVueEntry('src/layouts/')
}

async function generateExportStatements() {
  await Promise.all([
    generateComponentsEntry(),
    generateStoresEntry(),
    generateTypesEntry(),
    generateComposablesEntry(),
    generateServicesEntry(),
    generateLayoutsEntry(),
    generateVueEntry('src/components/Base/'),
    generateVueEntry('src/components/Icon/'),
    generateVueEntry('src/components/The/'),
  ])
}

export default function indexGeneratorPlugin(): Plugin {
  return {
    name: 'index-generator-plugin',
    buildStart() {
      generateExportStatements()
    },
  }
}
