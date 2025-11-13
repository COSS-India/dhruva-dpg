# Fix Git Line Ending Warnings

## Problem

Git warning: `LF will be replaced by CRLF the next time Git touches it`

This happens because Git is trying to convert Unix-style line endings (LF) to Windows-style (CRLF).

## Solution

### Step 1: Configure Git (Recommended)

**Option A: Disable automatic line ending conversion (Recommended for cross-platform projects)**

```bash
# Disable automatic conversion
git config core.autocrlf false

# Or set it globally
git config --global core.autocrlf false
```

**Option B: Use input mode (LF in repo, convert to CRLF on checkout)**

```bash
git config core.autocrlf input
```

### Step 2: Normalize Existing Files

After creating `.gitattributes`, normalize all files:

```bash
# Remove files from Git index (but keep them in working directory)
git rm --cached -r .

# Re-add all files (Git will now respect .gitattributes)
git add .

# Or normalize just the shell scripts
git add --renormalize *.sh
```

### Step 3: Commit the Changes

```bash
# Stage the .gitattributes file
git add .gitattributes

# Commit
git commit -m "Add .gitattributes to handle line endings"
```

## Quick Fix Commands

**One-liner to fix everything:**

```bash
# Configure Git
git config core.autocrlf false

# Normalize files
git add --renormalize .

# Commit
git add .gitattributes
git commit -m "Fix line endings"
```

## Verify Fix

```bash
# Check Git config
git config core.autocrlf

# Check if warning is gone
git status
```

## What the .gitattributes File Does

The `.gitattributes` file I created:
- Forces `*.sh` files to use LF (Unix) line endings
- Forces `*.py`, `*.js`, `*.ts`, `*.yml`, etc. to use LF
- Allows Git to auto-detect text files
- Marks binary files as binary

This ensures:
- Shell scripts work correctly on Linux/WSL
- No line ending warnings
- Consistent line endings across the repository

## Alternative: Ignore the Warning

If you just want to commit without fixing:

```bash
# The warning is harmless, you can just commit
git commit -m "Your commit message"
```

However, it's better to fix it properly with `.gitattributes` to avoid future issues.

