# Using This Template

This guide takes you from "I want a new Worker" to "my project deploys to Cloudflare safely." Work through it once, when you create the project. For day-to-day work afterwards, use [Gitflow and branching](gitflow-and-branching.md) and [Versioning and changesets](versioning-and-changesets.md).

It covers the things that files in your new repository cannot configure for you: repository ownership, branches, Cloudflare targets, GitHub Actions secrets, and repository rules.

## 0. Choosing how to start

There are three ways to get these files, and they are not interchangeable. The difference is what relationship your project keeps with this repository.

| | Use this template | Fork | Clone only |
| --- | --- | --- | --- |
| Creates a GitHub repository for you | Yes | Yes | No |
| Commit history | Fresh start, single initial commit | Full history of this repository | Full history, but no repository of your own |
| Linked to this repository on GitHub | No | Yes, shown as "forked from" | No |
| Automated upstream sync works | **No** | Yes | Not applicable |
| Can open pull requests back to this repository | Not easily | Yes | No |
| Best for | Real projects | Contributing upstream, or wanting automated sync | Evaluating the template |

### Use this template (recommended for real projects)

Select **Use this template > Create a new repository**, then choose the owner, name, and visibility. Your project starts with a clean history that belongs to you, with no "forked from" relationship and no inherited issues or pull requests.

Two consequences to plan for:

- GitHub copies only the default branch unless you check **Include all branches**. You will create `develop` yourself in step 3 either way, since this repository does not carry one.
- Your repository shares **no commit history** with this one. That means `.github/workflows/upstream-sync.yml` cannot merge upstream changes into it — Git refuses to merge unrelated histories. See [Keeping up with upstream changes](#8-keeping-up-with-upstream-changes) for how to adopt updates by hand.

### Fork

Select **Fork**, then choose the destination owner. Your project keeps this repository's full commit history and a live upstream link, so GitHub can compare the two and the automated sync workflow works out of the box.

Trade-offs:

- GitHub labels the repository as a fork, and a fork of a private repository stays private.
- You get one fork per account for a given repository.
- GitHub disables scheduled workflows in forks by default. Enable Actions in your fork, and expect to start the sync workflow with **Run workflow** on the Actions tab until you re-enable its schedule.

Fork if you intend to send improvements back to this template, or if reviewing an automated upstream pull request each week is worth more to you than a clean history.

### Clone only

`git clone` copies the repository to your computer without creating anything on GitHub. Its `origin` remote still points at **this** repository, so you cannot push your work anywhere of your own, and pushing at all would target the template. Use this to read the code or run the tests before deciding.

To turn a clone into a project later, create an empty repository on GitHub and repoint the remote:

```sh
git remote set-url origin https://github.com/YOUR-OWNER/YOUR-REPOSITORY.git
git push -u origin main
```

This keeps the history but creates no fork link, so it behaves like the template path for upstream sync.

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

- `CLOUDFLARE_API_TOKEN` — a least-privilege token that can deploy your two Workers.
- `CLOUDFLARE_ACCOUNT_ID` — the Cloudflare account containing them.

Then, and only then, enable deployment. `DEPLOY_ENABLED` is deliberately a repository **variable**, not a secret: it holds no sensitive value and exists purely as the explicit opt-in. Add it with the value `true` under **Settings > Secrets and variables > Actions > Variables**. Until it exists, the deploy job is skipped and no Cloudflare credentials are used.

Never commit these values or put them in `.env`, `.dev.vars`, or generated files.

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

Do not add a `branch_name_pattern` rule. See [Gitflow and branching](gitflow-and-branching.md#branches-and-what-they-deploy) for why: it requires GitHub Team or Enterprise and is rejected outright on Free and Pro. Branch naming stays enforced through code review.

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

How you adopt template updates depends on the path you chose in [Choosing how to start](#choosing-how-to-start).

### If you forked

`.github/workflows/upstream-sync.yml` does the work. It runs weekly and on demand from the Actions tab, fetches `main` from the configured upstream, merges it into a temporary `upstream-sync` branch, runs your `npm run lint` and `npm test`, and opens a pull request only if everything passes.

Set the repository Actions **variable** `UPSTREAM_REPOSITORY` to the upstream owner and repository, for example `mbakaitis/workers`. The workflow falls back to this template when the variable is unset. Do not put credentials in it; public upstream repositories are fetched over HTTPS.

The workflow is intentionally review-only. A merge conflict or a failing project-specific test stops it and produces no pull request — that is the signal to sync by hand. Review every generated pull request for your own bindings, configuration, and migration notes before merging.

### If you used the template

The sync workflow cannot merge into your repository, because there is no shared history. Adopt changes deliberately instead. Add this repository as a second remote once:

```sh
git remote add upstream https://github.com/mbakaitis/workers.git
git fetch upstream
```

Then pick up individual changes. `git cherry-pick` works across unrelated histories:

```sh
git log --oneline upstream/main
git cherry-pick <commit>
```

Or review a single file before copying anything:

```sh
git diff HEAD upstream/main -- .github/workflows/ci.yml
```

Read this template's `CHANGELOG.md` for each release to see what changed and whether it requires migration. If you remove `.github/workflows/upstream-sync.yml` because you cannot use it, also remove the assertion that covers it in `test/contracts/workflow.test.js`, or your own contract tests will fail.

### Either way

Rollback is a reviewed revert or a deployment of the previous successful commit. Never hot-edit production code in the Cloudflare dashboard.

## Setup is complete when

- `main` and `develop` both exist on your remote.
- Branch rules prevent direct changes to `main` and `develop`.
- The `non-prod` and `production` GitHub environments have the correct branch restrictions, and `production` requires a reviewer.
- Your three Worker names are distinct, and any bindings are environment-specific and intentional.
- `npm test` passes, including the contract tests.
- A merge to `develop` deploys non-production, and an approved merge to `main` deploys production.

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
