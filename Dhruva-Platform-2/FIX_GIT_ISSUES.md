# Fix Git Issues: Line Endings and Virtual Environment

## Problems

1. **Line ending warnings** - Git warning about LF/CRLF conversion
2. **Virtual environment in Git** - `migration_venv/` is being tracked (should be ignored)

## Solution

### Step 1: Remove migration_venv from Git Index

```bash
# Remove migration_venv from Git tracking (but keep it locally)
git rm -r --cached Dhruva-Platform-2/migration_venv/

# Or if you're in the root directory
git rm -r --cached migration_venv/
```

### Step 2: Configure Git for Line Endings

```bash
# Disable automatic line ending conversion
git config core.autocrlf false
```

### Step 3: Normalize Files

```bash
# Normalize all files according to .gitattributes
git add --renormalize .
```

### Step 4: Add Updated .gitignore Files

```bash
# Add the updated .gitignore files
git add .gitignore Dhruva-Platform-2/.gitignore .gitattributes

# Verify migration_venv is now ignored
git status
```

### Step 5: Commit

```bash
git commit -m "Add .gitattributes, update .gitignore to exclude migration_venv"
```

## Complete Command Sequence

```bash
# 1. Remove virtual environment from Git
git rm -r --cached Dhruva-Platform-2/migration_venv/

# 2. Configure Git
git config core.autocrlf false

# 3. Add .gitignore updates and .gitattributes
git add .gitignore Dhruva-Platform-2/.gitignore .gitattributes

# 4. Normalize line endings
git add --renormalize .

# 5. Verify what will be committed
git status

# 6. Commit
git commit -m "Fix line endings and exclude migration_venv from Git"
```

## Verify Fix

```bash
# Check that migration_venv is ignored
git status | grep migration_venv
# Should return nothing (it's ignored)

# Check for line ending warnings
git add .
# Should not show warnings
```

## Why migration_venv Should Be Ignored

- Virtual environments are **large** (hundreds of MB)
- They're **platform-specific** (won't work on different OS)
- They can be **recreated** easily with `python3 -m venv migration_venv`
- They contain **binary files** that cause issues on Windows

## Notes

- The `migration_venv/` directory will remain on your local filesystem
- It just won't be tracked by Git anymore
- Anyone cloning the repo can recreate it using `run_migration_wsl.sh` or manually

