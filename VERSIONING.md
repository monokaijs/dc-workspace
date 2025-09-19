# Versioning Guide

This project uses semantic versioning with automated release management.

## Version Types

### Stable Releases
- **Format**: `MAJOR.MINOR.PATCH` (e.g., `1.2.3`)
- **Trigger**: Created using release scripts
- **Auto-update**: Users receive these as stable updates
- **Use case**: Production releases

### Beta Releases  
- **Format**: `MAJOR.MINOR.PATCH-beta.BUILD` (e.g., `1.2.4-beta.123`)
- **Trigger**: Automatic on main branch pushes
- **Auto-update**: Only beta testers receive these
- **Use case**: Testing and development

## Creating Releases

### Quick Commands

```bash
# Patch release (bug fixes: 1.0.0 -> 1.0.1)
npm run release:patch

# Minor release (new features: 1.0.0 -> 1.1.0)  
npm run release:minor

# Major release (breaking changes: 1.0.0 -> 2.0.0)
npm run release:major
```

### Interactive Release

```bash
# Shows current version and prompts for release type
npm run release
```

## What Happens During Release

1. **Version Update**: Updates `package.json` with new version
2. **Git Commit**: Commits the version change
3. **Git Tag**: Creates annotated tag (e.g., `v1.2.3`)
4. **Push**: Pushes tag and commit to GitHub
5. **Build**: GitHub Actions builds all platforms
6. **Release**: Creates GitHub release with installers
7. **Auto-update**: Users get notified of new version

## Beta Releases (Automatic)

Every push to `main` branch automatically:
1. Increments patch version
2. Adds beta suffix with build number
3. Creates prerelease on GitHub
4. Builds and uploads installers

## Version Strategy

- **Patch** (`x.x.X`): Bug fixes, security updates
- **Minor** (`x.X.x`): New features, improvements  
- **Major** (`X.x.x`): Breaking changes, major rewrites

## Examples

```bash
# Current version: 1.0.0

npm run release:patch  # -> 1.0.1 (stable)
npm run release:minor  # -> 1.1.0 (stable)  
npm run release:major  # -> 2.0.0 (stable)

# Push to main -> 1.0.1-beta.123 (beta)
```

## Monitoring Releases

- **GitHub Actions**: https://github.com/monokaijs/dc-workspace/actions
- **Releases**: https://github.com/monokaijs/dc-workspace/releases
- **Tags**: https://github.com/monokaijs/dc-workspace/tags

## Troubleshooting

### Release Script Issues

**Problem**: "Git working directory is not clean"
```bash
# Check status and commit/stash changes
git status
git add .
git commit -m "your changes"
```

**Problem**: "Failed to create git tag"
```bash
# Check if tag already exists
git tag -l
git tag -d v1.0.0  # Delete if needed
```

### Build Issues

**Problem**: Version not updating in app
- Check if `package.json` was updated
- Verify git tag was created and pushed
- Check GitHub Actions build logs

**Problem**: Auto-update not working
- Ensure release includes `.yml` metadata files
- Check if release is marked as "latest"
- Verify app's auto-update settings

## Best Practices

1. **Test before release**: Use beta releases for testing
2. **Meaningful commits**: Write clear commit messages
3. **Clean working directory**: Commit changes before releasing
4. **Monitor builds**: Check GitHub Actions after releasing
5. **Verify releases**: Test auto-update functionality

## Integration with Auto-Updates

The versioning system is tightly integrated with the auto-update functionality:

- **Stable releases** are offered to all users
- **Beta releases** are only offered to beta testers
- **Version comparison** uses semantic versioning rules
- **Update metadata** is automatically generated for each release
