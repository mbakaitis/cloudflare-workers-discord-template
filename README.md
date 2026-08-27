# Cloudflare Workers Discord Bot Template

A minimal, production-shaped starting point for a Discord bot on Cloudflare Workers: Ed25519 signature verification, interaction handling, and slash-command registration, tests that run in the real Workers runtime, separate non-production and production environments, and a documented release path.

This is a GitHub template repository. Create your own project from it, then add your bot's commands. Nothing here deploys to Cloudflare or registers commands with Discord until you deliberately turn those on.

## What you get

- A Discord bot Worker in [src/index.js](src/index.js): an explicit `fetch` handler that verifies every incoming interaction's Ed25519 signature, answers Discord's `PING` endpoint check, and dispatches slash commands.
- A shared command-definitions module ([src/command-definitions.js](src/command-definitions.js)) that both the Worker and the registration script read, so a command Discord shows users can never drift from what the Worker actually handles.
- A zero-dependency command-registration script ([scripts/register-commands.js](scripts/register-commands.js)) that bulk-overwrites your bot's slash commands against Discord's REST API, globally or scoped to a test server.
- Tests that execute in the Workers runtime locally through Miniflare, no Cloudflare account or live Discord calls required.
- Contract tests that fail if non-production and production configuration get crossed.
- Separate `non-prod` and `production` Wrangler environments, with deployment disabled by default.
- A documented branch, promotion, and release workflow.

## Quickstart

1. **Create your repository.** Select **Use this template** on GitHub for a clean start, or **Fork** if you want to keep this repository's history and contribute improvements back. The two paths differ in ways worth understanding first — see [Choosing how to start](docs/using-this-template.md#0-choosing-how-to-start).

2. **Clone it and install.** Clone the repository you just created, not this one.

   ```sh
   git clone https://github.com/YOUR-OWNER/YOUR-REPOSITORY.git
   cd YOUR-REPOSITORY
   npm install
   ```

3. **Name your Workers.** Change the three `name` fields in [wrangler.jsonc](wrangler.jsonc) from `cloudflare-workers-discord-template` to your own project slug, keeping the `-non-prod` and `-production` suffixes. Update `name` in [package.json](package.json) to match.

4. **Create a Discord application and fill in `.dev.vars`.** Create an application in the [Discord Developer Portal](https://discord.com/developers/applications) and copy `.dev.vars.example` to `.dev.vars` with its public key, application ID, and bot token. See [Configuring Discord secrets](docs/using-this-template.md#configuring-discord-secrets).

5. **Run it locally and register your test commands.**

   ```sh
   npm run dev
   npm run register:guild
   ```

6. **Confirm the guardrails still pass.** The contract tests check that your two environments are distinct.

   ```sh
   npm test
   ```

7. **Create the `develop` branch.** Feature work merges into `develop`; releases go out from `main`.

   ```sh
   git switch -c develop
   git push -u origin develop
   ```

8. **Turn on deployment when you are ready.** Configure the Cloudflare secrets and protected GitHub environments, set the `DEPLOY_ENABLED` Actions variable to `true`, then set each Discord application's Interactions Endpoint URL to its deployed Worker's URL.

Steps 3, 4, 7, and 8 have details that matter — bindings, secrets, branch protection, environment isolation, and Discord application setup. Work through [Using this template](docs/using-this-template.md) before your first deployment.

## Everyday commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Run the Worker locally with Wrangler |
| `npm test` | Run the unit tests and the configuration contract tests |
| `npm run test:watch` | Re-run unit tests as you edit |
| `npm run lint` | Check JavaScript style |
| `npm run lint:fix` | Apply safe automatic style fixes, then review the diff |
| `npm run register` | Bulk-overwrite your bot's slash commands (global, or guild-scoped if `DISCORD_GUILD_ID` is set) |
| `npm run register:guild` | Bulk-overwrite slash commands for one test server, for fast iteration |
| `npm run changeset` | Record the release impact of a change |
| `npm run deploy:non-prod` | Deploy the non-production Worker |
| `npm run deploy:production` | Deploy the production Worker |

Node.js 22 is the supported version. `.nvmrc` is the single source of truth — run `nvm use` if you manage Node with nvm — and `engines.node` plus every GitHub Actions workflow read from it.

Local development uses the top-level Wrangler configuration and never deploys a Worker. Keep production credentials out of local environment files.

## Deployment

Merges to `develop` deploy the non-production Worker; merges to `main` deploy production after an environment approval gate. Both are skipped until the GitHub Actions repository **variable** `DEPLOY_ENABLED` is set to `true`. That flag is not a secret — it is only the explicit opt-in, which keeps this template and unconfigured projects from ever contacting Cloudflare. The Cloudflare API token and account ID remain GitHub secrets.

You can also deploy from your machine with `npm run deploy:non-prod` or `npm run deploy:production`, but the reviewed GitHub Actions path is the intended route to production.

Deploying a Worker is not the same as Discord recognizing it. After the first deploy of each environment, set that Discord application's Interactions Endpoint URL to the deployed Worker's URL — see [Setting the Interactions Endpoint URL](docs/using-this-template.md#setting-the-interactions-endpoint-url) — and run `npm run register` (or `register:guild`) so its slash commands exist.

## Documentation

| Document | Read it when |
| --- | --- |
| [Using this template](docs/using-this-template.md) | Starting a project: choosing template vs. fork vs. clone, naming Workers, bindings, secrets, repository rules |
| [Gitflow and branching](docs/gitflow-and-branching.md) | Day-to-day branching, pull requests, promotion, and rollback |
| [Versioning and changesets](docs/versioning-and-changesets.md) | Cutting a version, understanding the release pull request and tags |
| [Using AI with this template](docs/using-ai.md) | Working with AI assistants: instruction files, MCP servers, and the guardrails |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Improving this template itself |
| [CHANGELOG.md](CHANGELOG.md) | Checking what changed and whether you need to migrate |

## AI is already wired in

This template was built with AI assistance, and it ships ready for it. You do not have to use AI — every command works the same by hand — but if you do, the setup is done:

- **Instruction files** tell an assistant how to work here: [claude.md](claude.md) is the canonical maintenance guide, with matching entry points in [AGENTS.md](AGENTS.md) and [.github/copilot-instructions.md](.github/copilot-instructions.md). They carry a versioned contract, so changes in expectations are reviewable rather than silent.
- **MCP servers** for Cloudflare documentation and GitHub are declared in `.mcp.json` and `.vscode/mcp.json`, in both schema formats. An assistant can look up current Wrangler behavior instead of recalling a version that changed a year ago. Neither file contains a token.
- **Contract tests** in `test/contracts/` are what make this safe. Suggest pointing non-production at a production database and you get a failing test immediately, not a subtle bug discovered later.
- **Human gates** cover the rest: deployment stays off until you opt in, production requires approval, and Cloudflare credentials live in GitHub secrets that no local tool can read. Automation can open a pull request; it cannot ship to production.

Instructions guide an assistant; they cannot constrain one. That is why the promises that matter are tests and gates rather than prose. See [Using AI with this template](docs/using-ai.md) for the details, including how to adapt the instruction files to your own project.

## License

MIT. See [LICENSE.md](LICENSE.md).
