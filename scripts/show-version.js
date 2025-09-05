#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Read current package.json
const packagePath = path.join(__dirname, '..', 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))

// Get base version
const baseVersion = packageJson.version
const versionParts = baseVersion.split('.')

// Generate timestamp
const timestamp = Math.floor(Date.now() / 1000)
const newVersion = `${versionParts[0]}.${versionParts[1]}.${timestamp}`

// Convert timestamp to readable date
const date = new Date(timestamp * 1000)
const readableDate = date.toISOString().replace('T', ' ').replace(/\..+/, '')

console.log('📦 Version Information:')
console.log(`   Base version: ${baseVersion}`)
console.log(`   Timestamp: ${timestamp}`)
console.log(`   Generated version: ${newVersion}`)
console.log(`   Build date: ${readableDate} UTC`)
console.log('')
console.log('🏷️  Release tag would be: v' + newVersion)
console.log('📁 Artifacts would be named:')
console.log(`   Windows: Browser-${newVersion}-setup.exe`)
console.log(`   macOS: Browser-${newVersion}.dmg`)
