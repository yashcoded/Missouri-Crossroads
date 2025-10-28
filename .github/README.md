# GitHub Actions Workflows

This directory contains GitHub Actions workflows that integrate AWS Amplify deployments with GitHub's deployment tracking.

## Workflows

### `pr-deployment.yml`

Automatically creates GitHub deployments when AWS Amplify deploys PR branches. This workflow:

- **Waits for Amplify deployments**: Polls for Amplify status checks when a PR is opened or updated (waits up to 5 minutes)
- **Creates GitHub deployments**: Creates a GitHub deployment with environment name `pr-{PR_NUMBER}` linking to the Amplify preview
- **Posts deployment comments**: Automatically comments on the PR with a link to the preview deployment
- **Updates deployment status**: Syncs GitHub deployment status based on Amplify's build status (success, failure, in progress)
- **Cleans up on close**: Removes GitHub deployments when PRs are closed

**Triggers:**
- `status` event: Fires when AWS Amplify posts a status check (for near-instant updates)
- `pull_request` event: Fires on PR open, update, sync, and close (polls for Amplify deployment)

**How it works:**
1. When you open a PR to `main`, this workflow starts automatically
2. It waits (polls) for AWS Amplify to post a status check on the commit
3. Once detected, it creates a GitHub deployment environment named `pr-{PR_NUMBER}`
4. A bot comment is posted on the PR with a direct link to the Amplify preview
5. The deployment status updates in real-time based on Amplify's build progress
6. When the PR is closed or merged, the deployment environment is cleaned up

### `amplify-main-deployment.yml`

Automatically syncs main branch deployments to GitHub:

- **Triggers on push to main**: When you push directly to main, it creates a GitHub deployment
- **Links to Amplify**: Connects the GitHub deployment to your Amplify app at `https://main.d4ca2esg7oi8k.amplifyapp.com`
- **Creates "production" environment**: Shows up in GitHub's deployments page

**How it works:**
1. You push to `main` branch
2. AWS Amplify automatically builds and deploys (if configured)
3. This workflow polls for Amplify status checks (waits up to 2 minutes)
4. Creates a GitHub deployment with environment "production"
5. The deployment appears in GitHub's deployment history

### `amplify-deployment.yml`

Manually trigger the creation of GitHub deployments for PRs. This is useful when:
- The automatic workflow didn't catch an Amplify deployment
- You want to retroactively create a deployment
- You need to refresh deployment status

**Usage:**
```bash
# Via GitHub CLI
gh workflow run amplify-deployment.yml

# Or visit Actions tab in GitHub UI
# Select "Trigger Amplify Deployment on GitHub"
# Optionally specify a PR number
```

## Why This Matters

Currently, when you open a PR:
- ✅ AWS Amplify automatically creates a preview deployment
- ✅ Amplify posts status checks to GitHub
- ✅ The deployment is visible on Amplify's website

But:
- ❌ GitHub doesn't show the deployment in the PR UI
- ❌ The deployment doesn't appear in the "Deployments" section
- ❌ You can't track deployment history

With these workflows:
- ✅ GitHub deployments are created for each PR
- ✅ Deployments are visible in the PR UI
- ✅ Deployments appear in the repository's "Environments" section
- ✅ Full deployment tracking and history
- ✅ Click-through links from GitHub to Amplify preview

## Deployment Environment Naming

Deployments use the pattern `pr-{PR_NUMBER}` for environment names, making it easy to identify which PR a deployment belongs to.

## Monitoring

View workflow runs and deployment status in:
- GitHub Actions tab (`Actions`)
- Pull request checks
- Repository deployments page (`Settings` → `Environments`)

## Troubleshooting

If deployments aren't showing up:

1. Check that the workflow is running: Go to Actions tab
2. Verify Amplify is creating status checks on your commits
3. Check that the PR is still open (deployments are cleaned up for closed PRs)
4. Manually trigger `amplify-deployment.yml` if needed
5. Look at workflow logs for any errors

## Requirements

- GitHub Actions enabled for the repository
- AWS Amplify connected to the repository
- Pull request preview enabled in AWS Amplify console
