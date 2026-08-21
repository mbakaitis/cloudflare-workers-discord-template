# Using AI With This Template

This template was built with AI assistance, and it is wired so that AI tools are useful on it from the first clone. Nothing here requires you to use AI — every command works the same way by hand. But if you do, the scaffolding is already in place.

Two ideas drive the design:

1. **Give the tools the context they need.** Maintenance rules, environment boundaries, and workflow expectations are written down in files the tools read automatically, not held in someone's head or a chat history.
2. **Do not trust context alone.** Instructions guide an assistant; they cannot constrain it. So the promises that matter are enforced by tests and by human gates that no assistant can bypass.

## What is already set up

| Piece | Where | What it does |
| --- | --- | --- |
| Instruction files | `claude.md`, `AGENTS.md`, `.github/copilot-instructions.md` | Tell an assistant how to work in this repository |
| Documentation MCP server | `.mcp.json`, `.vscode/mcp.json` | Lets an assistant read current Cloudflare documentation instead of guessing |
| GitHub MCP server | `.mcp.json`, `.vscode/mcp.json` | Lets an assistant read issues and repository data you already have access to |
| Contract tests | `test/contracts/` | Fail the build when a change breaks an environment or workflow promise |
| Human gates | `DEPLOY_ENABLED`, protected environments, required review | Keep deployment and production out of reach of automation |

## The instruction files

Three files carry the same guidance for different tools:

| File | Read by |
| --- | --- |
| [claude.md](../claude.md) | Claude Code, and the canonical version of the guidance |
| [AGENTS.md](../AGENTS.md) | Tools that follow the `AGENTS.md` convention |
| [.github/copilot-instructions.md](../.github/copilot-instructions.md) | GitHub Copilot |

`claude.md` is the full maintenance guide. The other two are shorter entry points that must stay consistent with it — they exist because different tools look for different filenames, not because they say different things.

They carry an **instruction contract version** in their headers, separate from the package version, so a change in expectations is visible and reviewable rather than silent. If you change guidance in one file, change all three and bump that version. See [Versioning and changesets](versioning-and-changesets.md#two-version-numbers).

### Adapt them for your project

These files describe *this template's* rules — keep the base Worker minimal, don't add TypeScript, treat downstream projects carefully. Once you have your own project, some of that stops applying and your own rules take over: your domain vocabulary, your architecture decisions, your review expectations.

Edit them. Keep the parts that protect you — environment isolation, TDD, no secrets in source — and replace the template-maintenance parts with what your project actually needs. Then keep all three in sync, because a stale instruction file is worse than none: it confidently misleads.

## MCP servers

Both configuration files declare the same two servers in the two schemas that tools expect. `.mcp.json` uses the Claude-compatible `mcpServers` key; `.vscode/mcp.json` uses VS Code's `servers` key. A contract test asserts both stay in agreement.

- **Cloudflare Docs** (`https://docs.mcp.cloudflare.com/mcp`) — current Workers and Wrangler documentation. This matters more than it sounds: Cloudflare's platform moves quickly, and a model's training data will confidently describe Wrangler behavior that changed a year ago. Looking it up beats remembering it.
- **GitHub** (`https://api.githubcopilot.com/mcp/`) — issues and repository data. Your editor prompts you to authenticate on first use.

**Neither file contains a token.** They hold only non-secret server URLs, which is why they are safe to commit. If a tool needs credentials, they belong in that tool's own local configuration.

In VS Code, `.vscode/mcp.json` is the configuration to use. If you rely on another client's configuration instead, you may need to enable `chat.mcp.discovery.enabled`.

### Documentation lookup is not authorization

Reading documentation is research. It is not permission to deploy, change a Cloudflare account, create resources, or handle secrets. An assistant that has just read the Wrangler documentation still has no business running a deployment.

Verify important platform claims against official documentation, and record the decision and the link in the repository when it affects the template contract. A documentation link in a pull request is worth more than a confident assertion in a chat window.

## The guardrails that actually hold

Instruction files are advisory. These are not.

**Contract tests** (`test/contracts/`) run as part of `npm test` and encode the promises that matter:

- Non-production and production Workers must have distinct names.
- Production bindings must not sit in the top-level Wrangler configuration.
- Deployment must stay behind the explicit `DEPLOY_ENABLED` opt-in.
- The release and upstream-sync workflows must keep their reviewed shape.
- One Node.js version, declared in one place.

This is the layer that makes AI assistance safe here. An assistant that suggests pointing non-production at a production database does not produce a subtle bug for a reviewer to catch six weeks later — it produces a failing test, immediately, before anything is deployed. When a contract test fails, that is the system working.

**Human gates** cover what tests cannot. Deployment is off until you set `DEPLOY_ENABLED`, production requires environment approval, protected branches require review, and Cloudflare credentials live in GitHub secrets that no local tool can read. Automation can open a pull request; it cannot ship to production.

## Working effectively

**Test-driven development is the requirement, and it is also what makes AI-assisted changes reviewable.** Write the failing test first, then the change. A test that failed before and passes after is evidence. A confident explanation is not. This is also the honest reason this project skips TypeScript: tests catch the mistakes that matter, in the runtime the code actually runs in.

**Point at the guide, not at the whole repository.** "Follow the environment rules in `claude.md` and add a contract test" produces better results than "add a D1 binding," because the first prompt carries the constraints and the second invites a plausible guess.

**Ask for current documentation.** When a change touches Wrangler configuration, compatibility dates, or bindings, ask the assistant to check the Cloudflare documentation and cite what it found.

**Review the diff, every time.** Look specifically for secrets, cross-wired environments, application logic that drifted into the template, and unnecessary lockfile churn. This is in the change workflow in `claude.md` because it is the step most easily skipped.

**Run the checks yourself.** `npm test` and `npm run lint` are the same commands CI runs. Do not take "the tests should pass" for an answer.

**Documentation-only changes skip the checks.** A change touching only Markdown does not need tests or lint — verify instead that the commands, paths, and links it mentions actually exist. This exists so that fixing a typo does not cost a full validation cycle.

## Keep secrets and permissions out of shared configuration

- `.claude/settings.local.json` is local and permission-scoped, and it is gitignored. Keep it that way. Do not broaden tool permissions to make a task convenient.
- `.dev.vars`, `.env` files with values, and generated deployment state stay out of Git. The ignore rules already cover them; keep them current.
- Never paste a Cloudflare API token, account identifier you intend to keep private, or production data into a prompt. Assume prompt content leaves your machine.
- Deployment credentials belong in GitHub secrets, reachable only by the reviewed workflows.

## If you would rather not use AI

Delete the instruction files and the MCP configuration. Everything else — the Worker, the tests, the environments, the release workflow — works exactly the same. The contract tests protect the same promises whether a human or a model wrote the change, which is rather the point.
