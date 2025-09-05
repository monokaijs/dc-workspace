#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 Starting local build process...')

try {
  // Read current package.json
  const packagePath = path.join(__dirname, '..', 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
  
  console.log(`📦 Current version: ${packageJson.version}`)
  
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
