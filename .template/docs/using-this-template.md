# Project provenance

This project was created from [{{TEMPLATE_REPOSITORY}}]({{TEMPLATE_REPOSITORY}}) at version **{{TEMPLATE_VERSION}}**, and `npm run setup` has already run. There is no template setup left to do here.

This page exists because several documents in `docs/` link to it. The full setup guide lives upstream: [Using this template]({{TEMPLATE_REPOSITORY}}/blob/main/docs/using-this-template.md).

## What is still done by hand

Setup renamed the Workers, pruned the template's scaffolding, and wrote the provenance recorded in `package.json` under `template`. Four things only a human can do:

1. Create two Discord applications, one per environment, and note each one's public key, application ID, and bot token.
2. Set those three secrets on each Worker with `npx wrangler secret put <NAME> --env non-prod` and again with `--env production`.
3. Set the GitHub environment secret *values* — `npm run setup:github` creates the environments, the `DEPLOY_ENABLED` variable, and the branch ruleset, and reports which secret names are missing, but it never sets a value.
4. Paste each Worker's `https://.../interactions` URL into its own Discord application's **Interactions Endpoint URL**, after the first deploy.

## Adopting a later upstream change

There is no automatic sync. Fetch the template as a second remote, review the diff, and cherry-pick what you want:

```sh
git remote add upstream {{TEMPLATE_REPOSITORY}}.git   # setup did this if no upstream existed
git fetch upstream
git log --oneline upstream/main
```

A repository created with **Use this template** shares no history with upstream, so there is no revision range to diff against. `package.json`'s `template.commit` records the upstream commit this project started from; everything after it in `git log upstream/main` is a candidate to cherry-pick.

Application code, bindings, and deployment topology are yours; upstream cannot know about them, so every adoption is a reviewed change.
