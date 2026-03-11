---
title: "Deployment of Web Services"
slug: "deployment-of-web-services"
---

# Software development workflow

 * Changes to the core software are developed in feature branches.
 * Once a feature is complete, the change is [proposed for a merge](https://help.github.com/articles/about-pull-requests/) into the `staging` branch.
 * Changes are not merged until the [CI system](https://circleci.com/gh/FarmBot/Farmbot-Web-App) can verify:
   * Test coverage will not drop by merging the branch
   * There are no type errors or compilation warnings at build time
   * All unit and integration tests pass
 * After CI checks pass, the changes may be merged by a maintainer.

# Production release workflow

 * Once a pull request is merged into the `staging` branch, it is automatically deployed to a staging server for manual QA testing.
 * After determining that there are no deficiencies noted in the software, a deploy is scheduled.
 * A pull request from the `staging` branch is proposed to the `main` branch.
 * A team member (not the same person proposing the pull request) must review changes prior to merging into `main`.
 * After merging, a [new release is tagged](https://help.github.com/articles/creating-releases/) (see: [Release Naming Conventions](#release-naming-conventions)).
 * Prior to a production deploy, the developer team must ensure that Heroku has created a recent database backup.
 * The software is deployed to the production server via [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
 * Database migrations are performed as needed.
 * A "health check" is performed on the server.
 * Occasionally, a full [dyno restart](https://devcenter.heroku.com/articles/dynos#restarting) is performed (as needed).
 * Manual QA checks are performed on a production FarmBot device to ensure the deploy succeeded.

# System health checks

The following checks should be performed regularly to ensure the system is running as intended:

 * Checking error reporting tools (Rollbar, Skylight) for new and unknown runtime exceptions.
 * Ensuring that scheduled database backups are actually happening.
 * Checking memory usage of RabbitMQ nodes
 * Checking skylight for extremely slow HTTP endpoints.
 * Running `npm outdated` and `bundle outdated` to find old dependencies.
 * Checking Github security alerts for vulnerable dependencies.
 * Checking the FarmBot forum for service interruptions and bug reports
 * Checking the database for throttled devices (a sign of possible firmware or FBOS bugs)

# Release naming conventions

The project loosely follows [semantic versioning](https://semver.org/) practices. Occasional, breaking changes outside of the package will trigger a major version release. An example would be performing a major version bump on the API to match a major version bump in FarmBot OS.

Every major version receives a "code name". The code name is collectively determined at the time of release by team members. The code name adheres to the following rules:

 * A code name is comprised of two words.
 * The first word is an adjective.
 * The second word is the name of a plant.
 * Both words must begin with the same letter.

## Past release names

 * v14: Opulent Orchid
 * v13: Noble Nettle
 * v12: Majestic Mango
 * v11: Lucky Lavender
 * v10: Kind Kale
 * v9: Jolly Juniper
 * v8: Iridescent Iris
 * v7: Happy Hibiscus
 * v6: Gracious Guava
 * v5: Fantastic Fern
 * v4: Emergent Echinacea
 * v3: Deciduous Daffodil
 * v2: Conic Cactus
 * v1: Adventive Acacia
