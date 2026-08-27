This is going to become a GitHub repo that can be used as a template to create cloudflare workers based discord bots.

Currently (as of the creation of this file), this is still ONLY a copy of the original workflow template.

Our goals for the coming work is to do several things:

1. update AGENTS.md, claude.md, and .github/copilot-instructions.md to reflect our new agenda for this repo (i.e. this is NOT the generic workers template, it is based on that via git and will become a new discord/workers bot template).  we don't want to encode anything into the AI files that discusses the TRANSITION work, but instead should be aiming at instructions and context that help us build and maintain the new template.
2. evaluate how to structure this project so that as changes to the upstream source update that repo, those can flow down to this without issue.  This includes changes to our src/index.js, package.json, claude.md or AGENTS.md or copilot-instructions.md, and more.  We'll look to use the upstream for "core" updates (such as when wrangler gets an update, and the package.json is updated), but also for tweaks to actions and similar.
3. determine what new packages are needed for implementing this as a generic discord bot template
4. determine how to streamline the addition of any tokens, keys, or other assets that must be secured and kept out of a repo so that users of the template understand what to do
5. ensure that the README.md and content in the docs/ director are all clear and help users implement this template
6. create a base discord bot script in src/ that lets the user set up the generic initial bot, configure with project-specific strings, and then test the bot live on discord to confirm that it is working

there may be more steps or things we are not considering or are missing.  this cannot be a perfect list, but it should be a good indication of our intentions as we begin working on this new project.  understand that any existing instructions or context are no longer directly relevant as we start this effort.  They are clearly good starting points but we will need to make many updates to convert this.