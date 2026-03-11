---
title: "Pushing FarmBot OS Updates"
slug: "pushing-farmbot-os-updates"
---

Currently with the release system, there are the following channels:

|Channel|Branch|Notes                         |
|-------|------|------------------------------|
|stable |main  |Should be considered consumer ready.
|beta   |qa/...|Should be considered almost consumer-ready, but expect bugs.
|alpha  |qa/...|Should be considered broken and should not be used by consumers.

To create an `alpha` or `beta` release:

 * Create a branch with the changes starting with `qa/`.
 * Bump the version number in the `VERSION` file.
 * Add a new version section in `CHANGELOG.md` describing the changes.
 * Commit and push to GitHub.
 * Wait for CI to finish tests and build a release.
 * Navigate to `https://github.com/FarmBot/Farmbot-Web-App/releases` and edit the automatically created draft release with a new version tag name, title, and description.
 * Publish the release.
 * Run the following command:
```
heroku run rake releases:publish --app=farmbot-staging
```
 * Follow the prompts to create a release. Once created, the release will be uploaded and sent out to all devices on that channel according to their update settings.

{%
include callout.html
type="info"
content="Publishing a new release to the `stable` channel will automatically reset all user channel selections to `stable`. Users who wish to switch back to `alpha` or `beta` will need to do so manually."
%}
