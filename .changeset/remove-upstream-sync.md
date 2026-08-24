---
"cloudflare-workers-template": major
---

Remove the automated upstream-sync mechanism. Both `.github/workflows/upstream-sync.yml` (inherited from the generic `cloudflare-workers-template`) and `.github/workflows/sync-upstream.yml` are deleted, along with the contract test that asserted their shape. This repository no longer tracks `cloudflare-workers-template` on a schedule or via manual dispatch, and no replacement mechanism is provided — keeping dependencies and upstream changes current is left entirely to whoever maintains a given project instance.

**Migration:** if your fork relied on either workflow to open upstream-sync pull requests, that automation is gone for good, not paused. If you set the `UPSTREAM_REPOSITORY` repository variable for `upstream-sync.yml`, remove it — it is a GitHub setting, not a committed file, so nothing deletes it automatically. To adopt future upstream changes, add this repository as a Git remote and use `git log`, `git diff`, or `git cherry-pick` by hand; see `docs/using-this-template.md`.
