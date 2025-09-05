#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 Starting local build process...')

try {
  // Read current package.json
  const packagePath = path.join(__dirname, '..', 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))

  console.log(`📦 Base version: ${packageJson.version}`)

  // Generate timestamp-based version
  const baseVersion = packageJson.version
  const versionParts = baseVersion.split('.')
  const timestamp = Math.floor(Date.now() / 1000)
  const newVersion = `${versionParts[0]}.${versionParts[1]}.${timestamp}`

  console.log(`🔢 Generated version: ${newVersion}`)

  // Update package.json temporarily for build
  packageJson.version = newVersion
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2))

  // Restore original version after build
  const originalVersion = baseVersion
  process.on('exit', () => {
    try {
      const restorePackage = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
      restorePackage.version = originalVersion
      fs.writeFileSync(packagePath, JSON.stringify(restorePackage, null, 2))
      console.log(`🔄 Restored version to: ${originalVersion}`)
    } catch (e) {
      console.warn('⚠️  Could not restore original version')
    }
  })
  
  // Run type check
  console.log('🔍 Running type check...')
  execSync('yarn typecheck', { stdio: 'inherit' })
  
  // Build the application
  console.log('🏗️  Building application...')
  execSync('yarn build', { stdio: 'inherit' })
  
  // Determine platform and run appropriate build
  const platform = process.platform
  let buildCommand
  
  if (platform === 'win32') {
    buildCommand = 'yarn build:win'
    console.log('🪟 Building for Windows...')
  } else if (platform === 'darwin') {
    buildCommand = 'yarn build:mac'
    console.log('🍎 Building for macOS...')
  } else {
    buildCommand = 'yarn build:linux'
    console.log('🐧 Building for Linux...')
  }
  
  execSync(buildCommand, { stdio: 'inherit' })
  
  console.log('✅ Build completed successfully!')
  console.log('📁 Check the dist/ folder for your built application')
  
} catch (error) {
  console.error('❌ Build failed:', error.message)
  process.exit(1)
}
