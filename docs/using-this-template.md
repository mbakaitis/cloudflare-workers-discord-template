# Using This Template

This guide takes you from "I want a new Worker" to "my project deploys to Cloudflare safely." Work through it once, when you create the project. For day-to-day work afterwards, use [Gitflow and branching](gitflow-and-branching.md) and [Versioning and changesets](versioning-and-changesets.md).

It covers the things that files in your new repository cannot configure for you: repository ownership, branches, Cloudflare targets, GitHub Actions secrets, and repository rules.

## 0. Choosing how to start

There are two ways to get these files, and the difference that matters is what your project's commit history looks like afterward.

| | Use this template | Clone only |
| --- | --- | --- |
| Creates a GitHub repository for you | Yes | No |
| Commit history | Fresh start, single initial commit | Full history of this repository, but no repository of your own until you repoint it |
| Linked to this repository on GitHub | No | No |
| Best for | Real projects | Evaluating the template, or preserving history to cherry-pick from later |

Neither path merges upstream changes into your repository automatically — see [Keeping up with upstream changes](#8-keeping-up-with-upstream-changes) for how to adopt them deliberately either way.

### Use this template (recommended for real projects)

Select **Use this template > Create a new repository**, then choose the owner, name, and visibility. Your project starts with a clean, single-commit history that belongs to you: no inherited commits, issues, or pull requests from this repository, and nothing for a new contributor to page through when they run `git log`. This is the leaner of the two paths.

One consequence to plan for: GitHub copies only the default branch unless you check **Include all branches**. You will create `develop` yourself in step 3 either way, since this repository does not carry one.

### Clone only

`git clone` copies this repository's full commit history to your computer without creating anything on GitHub. Its `origin` remote still points at **this** repository, so you cannot push your work anywhere of your own, and pushing at all would target the template. Use this to read the code or run the tests before deciding, or because you specifically want that history available locally (for example, to `git cherry-pick` a later template commit instead of reapplying it by hand).

To turn a clone into a project later, create an empty repository on GitHub and repoint the remote:

```sh
git remote set-url origin https://github.com/YOUR-OWNER/YOUR-REPOSITORY.git
git push -u origin main
```

This carries the full history into your new repository, which is heavier than **Use this template** but keeps every commit.

## 1. Create and clone your repository

Pick a path above and create the repository. The project name is yours; it does not have to resemble this template's name. For example, creating `acme-weather-api` under the organization `acme` gives you `github.com/acme/acme-weather-api`.

Then clone **your** repository — not this one — and install dependencies:

```sh
git clone https://github.com/acme/acme-weather-api.git
cd acme-weather-api
npm install
```

Replace `acme/acme-weather-api` with what you actually created. The `cd` command enters the directory `git clone` created, so run it only after cloning.

Keep the `.github/`, `docs/`, `src/`, `test/`, `package.json`, and `wrangler.jsonc` files unless your project has a deliberate alternative.

### Replace the AI instruction files

If you use an AI coding tool, replace the template's maintainer-facing instruction files with the application-facing ones shipped alongside them — the maintainer versions describe keeping this boilerplate up to date for many future projects, which no longer applies once you're building on top of it:

```sh
mv claude-for-users.md claude.md
mv AGENTS-for-users.md AGENTS.md
mv .github/copilot-instructions-for-users.md .github/copilot-instructions.md
```

If you don't use AI tooling, delete all six files instead. See [Using AI With This Template](using-ai.md#the-instruction-files) for what each file is for.

## 2. Name your Workers

This step assigns the Cloudflare Worker resource names for your project. These are not GitHub repository names, branch names, domains, or API tokens. A Worker name identifies a deployed Worker inside your Cloudflare account, so choose names that are unique and recognizable.

| Wrangler field | Example value | Used for |
| --- | --- | --- |
| Top-level `name` | `acme-weather-api` | Local development; also used if someone runs `wrangler deploy` without `--env` |
| `env.non-prod.name` | `acme-weather-api-non-prod` | The Worker deployed when `develop` changes |
| `env.production.name` | `acme-weather-api-production` | The Worker deployed when `main` changes |

The template ships with:

```jsonc
{
  "name": "cloudflare-workers-template",
  "main": "src/index.js",
  "compatibility_date": "2026-08-18",
  "observability": {
    "enabled": true
  },
  "env": {
    "non-prod": {
      "name": "cloudflare-workers-template-non-prod"
    },
    "production": {
      "name": "cloudflare-workers-template-production"
    }
  }
}
```

Change only the three `name` values:

```jsonc
{
  "name": "acme-weather-api",
  "main": "src/index.js",
  "compatibility_date": "2026-08-18",
  "observability": {
    "enabled": true
  },
  "env": {
    "non-prod": {
      "name": "acme-weather-api-non-prod"
    },
    "production": {
      "name": "acme-weather-api-production"
    }
  }
}
```

Also update `name` in `package.json` so the package and the Worker agree. Confirm in the Cloudflare dashboard that these names are available and that the non-production and production names refer to separate Workers.

Leave `compatibility_date` alone unless you have a reason to move it, and treat any change to it as a deliberate, documented decision. `observability.enabled` captures logs and telemetry for the deployed Worker; keep it on.

Add bindings inside the matching environment only. A non-production D1 database belongs under `env.non-prod`; a production D1 database belongs under `env.production`. Never point non-production at production databases, buckets, queues, or other stateful resources. See [Adding environment-specific bindings](#adding-environment-specific-bindings).

### Environment isolation is enforced

Isolation is not just advice here — **contract tests** run as part of `npm test` and verify:

- **Unique Worker names.** The top-level, `non-prod`, and `production` Workers must all have distinct names.
- **Clear naming.** The `non-prod` name should contain `non-prod`, `staging`, or `dev`; the `production` name should contain `production` or `prod`.
- **No production bindings at the top level.** D1 databases, R2 buckets, KV namespaces, and similar bindings must not sit in the top-level configuration.
- **Environment structure.** The configuration must define separate `env.non-prod` and `env.production` sections.

So if you give `env.non-prod` and `env.production` the same name, or attach a database at the top level, `npm test` fails before you can deploy. Verify locally with:

```sh
npm test
npx wrangler deploy --dry-run --env non-prod
npx wrangler deploy --dry-run --env production
```

The dry runs report what each environment would deploy and bind, without deploying anything.

## 3. Create the Git branches

The long-lived branches are `main` and `develop`. Initialize them from the same verified starting commit:

```sh
git switch main
git push -u origin main
git switch -c develop
git push -u origin develop
```

If your repository starts on a different default branch, rename it to `main` first. Use `feature/<name>` for day-to-day work; `release/<name>` and `hotfix/<name>` are also permitted for short-lived coordination branches.

## 4. Configure GitHub environments and secrets

Deployment is disabled by default. This is what stops a brand-new project from attempting a Cloudflare deployment before a Worker, an account, and credentials exist.

Create these GitHub Actions environments:

- `non-prod`, restricted to the `develop` branch.
- `production`, restricted to the `main` branch, with required reviewers enabled.

Add these secrets at repository or environment scope:

- `CLOUDFLARE_API_TOKEN` — see [Creating the API token](#creating-the-api-token) below.
- `CLOUDFLARE_ACCOUNT_ID` — the Cloudflare account containing them. Find it on the Workers & Pages overview page in the dashboard.

Then, and only then, enable deployment. `DEPLOY_ENABLED` is deliberately a repository **variable**, not a secret: it holds no sensitive value and exists purely as the explicit opt-in. Add it with the value `true` under **Settings > Secrets and variables > Actions > Variables**.

Setting `DEPLOY_ENABLED` does not deploy anything by itself — it only removes the guard inside a step that already exists in [.github/workflows/deploy.yml](../.github/workflows/deploy.yml). `deploy.yml` triggers on `push` to `main` or `develop`; a repository variable change is not a push, so it does not start a run. The next push or merge to `develop` or `main` is what actually deploys — the sequence in that run is: checkout, install, lint, test, and only if all of that passes and `DEPLOY_ENABLED` is `true`, `wrangler deploy --env non-prod` (from `develop`) or `--env production` (from `main`, after the `production` environment's required reviewer approves). If you enabled the flag without a fresh push already queued, merge or push once more to trigger the first real deployment. Until `DEPLOY_ENABLED` exists, the deploy job is skipped every time and no Cloudflare credentials are used.

Never commit these values or put them in `.env`, `.dev.vars`, or generated files.

### Creating the API token

Create the token at **My Profile > API Tokens > Create Token** in the Cloudflare dashboard, using **Custom Token**, not a predefined template — the predefined "Edit Cloudflare Workers" and "Workers Builds" templates grant more than this workflow needs (KV/R2 storage edit, zone-wide Workers Routes edit) because they're built for the dashboard's own Git integration, which this template does not use (see [above](#do-not-also-connect-the-repository-in-the-cloudflare-dashboard)).

For the base template with no bindings, add a single permission:

| Scope | Permission |
| --- | --- |
| Account | Workers Scripts — Edit |

Restrict the token to your account under **Account Resources**. This is sufficient for `wrangler deploy` to create and update both Workers by name — the workflow already supplies `CLOUDFLARE_ACCOUNT_ID` explicitly, so the token does not need account-listing permissions.

As you add bindings (see [Adding environment-specific bindings](#adding-environment-specific-bindings)), add the matching Edit permission to this same token — for example, **Workers R2 Storage — Edit** for an R2 bucket, or **Workers KV Storage — Edit** for a KV namespace. A deploy that references a binding your token cannot manage fails with an authorization error at deploy time, not at token-creation time, so update the token in the same pull request that adds the binding.

### Do not also connect the repository in the Cloudflare dashboard

Cloudflare offers a separate feature called [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) (**Settings > Builds > Connect** on a Worker in the dashboard) that watches a GitHub or GitLab repository and deploys on every push, independent of GitHub Actions. This template does not use it, and connecting a Worker this way conflicts with the workflow above:

- Workers Builds runs its own deploy command (`npx wrangler deploy` by default) on every push to the branch you connect. It does not know about the `production` environment's required reviewers, `DEPLOY_ENABLED`, or this repository's lint and test gates — it would deploy regardless of whether they pass.
- Both mechanisms would target the same Worker names from the same pushes, so you cannot tell which system produced a given deployment.

Leave your Workers unconnected in the dashboard. `.github/workflows/deploy.yml` is the only deployment path this template's contract tests and documentation assume.

## 5. Configure branch protection

This template does not ship a ruleset file to import. An imported JSON payload can save with fewer rules than it declares — plan tier, organization policy, and repository visibility all affect what GitHub accepts — so a committed file that looks authoritative can silently stop matching what's actually enforced. Configure the settings by hand instead, and verify what actually saved.

Go to **Settings > Rules > Rulesets > New branch ruleset** (classic **Settings > Branches** protection rules work too) and apply this to both `main` and `develop`:

| Setting | Value | Why |
| --- | --- | --- |
| Enforcement status | Active | "Evaluate" or "Disabled" protects nothing |
| Restrict deletions | On | The branch can't be deleted |
| Block force pushes | On | History can't be rewritten |
| Require a pull request before merging | On | No direct pushes |
| ↳ Required approvals | 1 | Minimum review gate |
| ↳ Dismiss stale approvals on push | On | A new commit needs a fresh look |
| ↳ Require conversation resolution | On | Open review threads can't be merged around |
| Require status checks to pass | On | CI must be green |
| ↳ Status check | `test` | Matches the job name in `.github/workflows/ci.yml` |
| ↳ Require branches to be up to date before merging | On | No merging around a stale base |

Do not add a `branch_name_pattern` rule. See [Gitflow and branching](gitflow-and-branching.md#our-approach-to-branches) for why: it requires GitHub Team or Enterprise and is rejected outright on Free and Pro. Branch naming stays enforced through code review.

After saving, confirm it actually took effect — `gh api repos/OWNER/REPOSITORY/rulesets` — and check that the ruleset's `enforcement` is `"active"` and its `rules` array contains everything in the table above. Re-check after any change to organization policy or plan.

## 6. Verify the deployment path

Prove the whole path works before you rely on it. Create a small feature branch and open a pull request into `develop`:

```sh
git switch -c feature/verify-gitflow
npm run dev
npm test
git push -u origin feature/verify-gitflow
```

After merging into `develop`, check the non-production Worker. Then open a pull request from `develop` into `main`; after the production environment approval, check the production Worker.

The deploy workflow never runs for feature branches. Local work uses `npm run dev`; only merges to `develop` and `main` deploy.

## 7. Releases

Changesets is already configured. Keep the `.changeset/` directory and `.github/workflows/release.yml`. For a change that affects your project's contract, run `npm run changeset`, choose the SemVer increment, and commit the generated file with your pull request. Merging to `main` opens a release pull request; merging that versions the package and creates a tag. It does not publish to npm.

If your project makes the package public or wants npm publication, update the Changesets `access` and `privatePackages` settings, add registry authentication through CI secrets, and review the workflow before enabling publication. Do not put registry credentials in the repository.

Full details are in [Versioning and changesets](versioning-and-changesets.md).

## 8. Keeping up with upstream changes

Nothing merges upstream changes into your repository automatically, regardless of which path you chose in [Choosing how to start](#0-choosing-how-to-start). Adopt them deliberately instead. Add this repository as a second remote once:

```sh
git remote add upstream https://github.com/mbakaitis/workers.git
git fetch upstream
```

Then pick up individual changes. `git cherry-pick` works whether or not your repository shares history with this one:

```sh
git log --oneline upstream/main
git cherry-pick <commit>
```

Or review a single file before copying anything:

```sh
git diff HEAD upstream/main -- .github/workflows/ci.yml
```

Read this template's `CHANGELOG.md` for each release to see what changed and whether it requires migration.

Rollback is a reviewed revert or a deployment of the previous successful commit. Never hot-edit production code in the Cloudflare dashboard.

## Setup is complete when

- `main` and `develop` both exist on your remote.
- Branch rules prevent direct changes to `main` and `develop`.
- The `non-prod` and `production` GitHub environments have the correct branch restrictions, and `production` requires a reviewer.
- Your three Worker names are distinct, and any bindings are environment-specific and intentional.
- `npm test` passes, including the contract tests.
- A merge to `develop` deploys non-production, and an approved merge to `main` deploys production.
- The AI instruction files describe your project: `claude.md`, `AGENTS.md`, and `.github/copilot-instructions.md` came from the `-for-users` files (or you deleted all six, if you don't use AI tooling).

## Adding environment-specific bindings

As your project grows you will add Cloudflare resources — D1 databases, R2 buckets, KV namespaces, Queues, Durable Objects. One rule governs all of them: **a binding goes in the environment it serves, never at the top level.**

### The rule

All bindings, regardless of service type, belong inside `env.non-prod` or `env.production`. The contract tests verify this automatically.

When adding a resource:

1. Create it in your Cloudflare account.
2. Add it to the matching `env` section in `wrangler.jsonc`.
3. Give it a distinct, environment-aware name, such as `my-api-non-prod` versus `my-api-production`.

**Incorrect** — a binding at the top level, which fails the contract tests:

```jsonc
{
  "name": "my-worker",
  "d1_databases": [
    {
      "binding": "DB",
      "database_id": "abc123"
    }
  ]
}
```

**Correct** — environment sections ready for bindings:

```jsonc
{
  "name": "my-worker",
  "main": "src/index.js",
  "compatibility_date": "2026-08-18",
  "env": {
    "non-prod": {
      "name": "my-worker-non-prod"
      // Service bindings go here (d1_databases, r2_buckets, kv_namespaces, etc.)
    },
    "production": {
      "name": "my-worker-production"
      // Service bindings go here (d1_databases, r2_buckets, kv_namespaces, etc.)
    }
  }
}
```

**Correct** — the same binding name pointing at separate resources per environment:

```jsonc
{
  "name": "my-worker",
  "main": "src/index.js",
  "compatibility_date": "2026-08-18",
  "env": {
    "non-prod": {
      "name": "my-worker-non-prod",
      "d1_databases": [
        {
          "binding": "DB",
          "database_id": "abc123-non-prod"
        }
      ]
    },
    "production": {
      "name": "my-worker-production",
      "d1_databases": [
        {
          "binding": "DB",
          "database_id": "def456-production"
        }
      ]
    }
  }
}
```

Your Worker code reads `env.DB` in both cases; only the underlying resource differs. Document each binding you add with JSDoc in `src/index.js` — this project is plain JavaScript and deliberately does not generate TypeScript binding types. If you want editor autocomplete for bindings in your own project, `npx wrangler types` will generate them on demand, but nothing here requires it.

### Validating a binding change

1. **Run the contract tests** to catch structural mistakes:

   ```sh
   npm test
   ```

2. **Dry-run both environments** before merging:

   ```sh
   npx wrangler deploy --dry-run --env non-prod
   npx wrangler deploy --dry-run --env production
   ```

   Confirm each environment binds the resources you expect.

3. **Review in the pull request** to catch logical mistakes: resource IDs genuinely distinct between environments, no cross-environment references, consistent naming.

Never copy a resource ID from production into non-production or the reverse. The contract tests catch structural mistakes; naming discipline and human review catch logical ones.
