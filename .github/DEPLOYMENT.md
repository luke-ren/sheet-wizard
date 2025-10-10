# GitHub Actions Deployment Setup

This guide explains how to set up automated deployment to Google Apps Script using GitHub Actions.

## Prerequisites

1. A Google Apps Script project created via `clasp create`
2. Encrypted `.clasprc.json.gpg` file in your repository
3. GitHub repository with Actions enabled
4. `prepare.sh` script in your repository root

## Setup Steps

### 1. Login to Clasp

First, authenticate with Google Apps Script:
```bash
clasp login
```

This creates `~/.clasprc.json` with your credentials.

### 2. Encrypt Your Clasp Credentials

Run the hash password script to encrypt your clasp credentials:
```bash
npm run hash_password
```

When prompted:
1. Enter a strong passphrase (you'll need this for GitHub Secrets)
2. Confirm the passphrase
3. Confirm overwrite if `.clasprc.json.gpg` already exists

This creates `.clasprc.json.gpg` which should be committed to your repository.

### 3. Get Your Script ID

Find your script ID in `.clasp.json`:
```json
{
  "scriptId": "YOUR_SCRIPT_ID_HERE",
  "rootDir": "./dist/src"
}
```

Or get it from the Apps Script editor URL:
```
https://script.google.com/home/projects/YOUR_SCRIPT_ID_HERE/edit
```

### 4. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

#### `CLASP_SECRET`
The passphrase you used to encrypt `.clasprc.json.gpg`

#### `CLASP_SCRIPT_ID`
Your Apps Script project ID (from `.clasp.json` or the URL)

### 5. Setup GitHub Environment (Optional)

For additional protection:
1. Go to Settings → Environments
2. Create environment named `main`
3. Add protection rules (e.g., required reviewers)

### 6. Commit and Push

The workflow will automatically trigger on pushes to the `main` branch:

```bash
git add .github/workflows/deploy.yml
git add .clasprc.json.gpg
git add prepare.sh
git commit -m "ci: add GitHub Actions deployment"
git push origin main
```

## Workflow Details

The GitHub Action will:

1. ✅ Checkout your code
2. ✅ Setup Node.js 22 with npm cache
3. ✅ Install clasp globally
4. ✅ Install dependencies (`npm ci`)
5. ✅ Build the TypeScript project
6. ✅ Run `prepare.sh` to create `.clasp.json` with `CLASP_SCRIPT_ID`
7. ✅ Decrypt clasp credentials using `CLASP_SECRET`
8. ✅ Deploy to Google Apps Script (`clasp push -f`)
9. ✅ Cleanup sensitive files (always runs, even on failure)

## Security Notes

- ⚠️ **Never commit** `.clasprc.json` (unencrypted)
- ⚠️ **Never commit** `.clasp.json` (contains script ID)
- ✅ **Do commit** `.clasprc.json.gpg` (encrypted)
- ✅ **Do use** GitHub Secrets for sensitive data

## Troubleshooting

### Deployment fails with "Invalid credentials"

- Verify `CLASP_SECRET` matches the passphrase used to encrypt
- Re-run `npm run hash_password` and update the encrypted file

### Deployment fails with "Script not found"

- Verify `CLASP_SCRIPT_ID` is correct
- Check that the script ID exists and you have access

### Build fails

- Check that all dependencies are in `package.json`
- Verify TypeScript compiles locally with `npm run build`

## Manual Deployment

To deploy manually:

```bash
npm run build
npm run push
```

## Viewing Deployment Logs

Go to your GitHub repository → Actions → Select the workflow run
