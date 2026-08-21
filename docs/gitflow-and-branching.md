# Gitflow and Branching

This is the day-to-day workflow: which branches exist, how work moves between them, and what deploys when. For one-time project setup, use [Using this template](using-this-template.md). For cutting versions and tags, use [Versioning and changesets](versioning-and-changesets.md).

## Branches and what they deploy

| Branch | Allowed shape | Role | Deployment |
| --- | --- | --- | --- |
| Feature | `feature/<name>` | Short-lived local work and pull requests | None |
| Non-production | `develop` | Integration branch | `wrangler deploy --env non-prod` |
| Production | `main` | Release branch | `wrangler deploy --env production` |

`release/<name>` and `hotfix/<name>` are also allowed as short-lived coordination branches. They do not deploy directly; merge them into `develop` or `main` through pull requests according to the change being prepared.

Branch names must use lowercase letters, numbers, dots, underscores, or hyphens after the prefix. `feature/add-health-check` is valid; `feature/AddHealthCheck` is not.

The ruleset in `.github/rulesets/gitflow-branch-names.json` allows the documented prefixes, but it must be applied through GitHub repository settings before it can reject a noncompliant name.

## Starting work

Create the branch with the prefix that matches the work, and include the issue number when the work comes from an issue:

```sh
# New work from develop
git switch develop
git pull --ff-only
git switch -c feature/1-add-health-check

# Release coordination from develop
git switch develop
git pull --ff-only
git switch -c release/0.2.0

# Production repair from main
git switch main
git pull --ff-only
git switch -c hotfix/2-fix-authentication
```

In a commit message, reference the related issue with a GitHub closing keyword — `Fixes #1`, `Closes #1`, or `Resolves #1`:

```sh
git commit -m "Add health check; fixes #1"
```

GitHub links the issue immediately and closes it once the commit reaches the default branch, normally when the pull request merges. For an issue in another repository, use `OWNER/REPOSITORY#NUMBER`. Labels stay useful for categorization but do not determine branch names.

## The development loop

```sh
git switch develop
git pull --ff-only
git switch -c feature/my-change
npm run dev
npm test
```

Open a pull request from `feature/my-change` into `develop`. CI must pass before merging. Merging to `develop` deploys the non-production Worker.

After validating there, open a pull request from `develop` into `main`. Merging to `main` deploys production, after the GitHub `production` environment approval gate.

Keep feature branches short-lived, start each one from the latest `develop`, and never commit directly to `develop` or `main`.

## Deployment is opt-in

The deployment workflow is skipped until the GitHub Actions repository **variable** `DEPLOY_ENABLED` is set to `true`. Set it only after your project has configured its Worker names, Cloudflare secrets, and protected environments. The flag is not a secret; it only enables deployment. This template repository leaves it unset, so pushes to `main` and `develop` here skip the deploy job entirely.

## Required repository policy

Protect `develop` and `main` from direct pushes, deletion, force-pushes, and merges without a pull request and passing CI. Require at least one approving review and resolved review threads. Leave feature branches unprotected apart from the naming rule, so local development stays lightweight.

The files in `.github/rulesets/` describe this policy but do not apply it automatically. Organization policy, repository ownership, and plan availability all affect which rules GitHub accepts, so inspect the ruleset after importing it. See [Using this template](using-this-template.md#5-apply-the-repository-rules) for the import commands.

## Rollback

Identify the previous successful version through the Cloudflare dashboard or Wrangler deployment history. Roll back with a reviewed commit on `main`; do not hot-edit production code in the dashboard. If production deployment must be stopped while you investigate, disable the `production` GitHub environment or tighten its required reviewers.
