# GitHub Actions Workflows

This directory contains GitHub Actions workflows that integrate AWS Amplify deployments with GitHub's deployment tracking.

## Workflows

### `pr-deployment.yml`

Automatically creates GitHub deployments when AWS Amplify deploys PR branches. This workflow:

- **Listens for Amplify status checks**: When AWS Amplify creates a status check on a commit, this workflow detects it and creates a corresponding GitHub deployment
- **Manages deployment lifecycle**: Creates deployments when Amplify starts building, updates them when the deployment completes, and cleans them up when PRs are closed
- **Syncs deployment status**: Updates GitHub deployment status based on Amplify's build status (success, failure, in progress)

**Triggers:**
- `status` event: Fires when any commit status changes (including Amplify deployments)
- `pull_request` event: Fires on PR open, update, sync, and close

**How it works:**
1. When you open a PR, Amplify automatically starts building
2. Amplify creates status checks on the commit
3. This workflow detects Amplify status checks
4. Creates a GitHub deployment with environment name `pr-{PR_NUMBER}`
5. Updates the deployment status based on Amplify's build result
6. When the PR is closed, it cleans up the deployment

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
