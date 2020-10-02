---
title: "Software Development Workflows"
slug: "software-development-workflows"
---

* toc
{:toc}

This document outlines FarmBot's day-to-day software development practices as used by the software development team. It outlines the non-technical aspects of software development at FarmBot, Inc. For a technical overview of our software development, please see the [developer portal](https://developer.farm.bot).

# Tools
We use a variety of tools to create, test, manage, and deploy software. These tools help our team stay on the same page, write quality code, and help prevent regressions and the introduction of bugs in production environments.

## GitHub

{%
include callout.html
type="info"
title=""
content="Farmbot uses **Git** for version control. The source code is publicly available on **GitHub** [here](https://github.com/farmbot/)."
%}

The source code has two main branches:

 * The `master` branch is stable and contains the latest public release. It is only updated during public releases and for emergency security updates.
 * The `staging` branch contains features which the author believes to be stable, but which have not yet received formal QA testing. This branch is stable enough for use by software developers and quality assurance personnel, but is not stable enough for real-world use.

Under certain circumstances (discussed later in this document), a `next` branch will be created, which should only be used under limited circumstances. The `next` branch is less stable than `staging` and is only suitable for internal use.

Short lived "feature branches" are also used and are discussed later.

## Circle CI

## Coveralls

# Development workflow

Acceptance testing at FarmBot, Inc works as follows:

## Step 1: Issue creation

### For employees

If a change is made to FarmBot software by an employee of FarmBot, Inc. and the change is intended for deployment to staging or production environments (as a public-facing, developer-facing, or internal-only feature), opening an **issue** in the appropriate repository on GitHub is most likely **required**. The issue should then be add to the org-level **project board**, and triaged to the appropriate column. Any employee may open an issue, although issues may be re-prioritized or archived due to business requirements.

Here are some examples of work that require an issue:

 * Bug fixes
 * New software features
 * Verbiage or styling changes

Here are examples of tasks that would not warrant opening an issue:

 * Helping customers on the forum
 * Performing routine system health checks
 * Routine dependency upgrades

There are other situations where opening an issue is encouraged, but not explicitly required. Some examples of this are listed below.

 * Software architecture planning
 * Group discussions where details emerge over time and which are not well suited to real-time chat. This is a great alternative to lengthy email threads.
 * Situations where an employee is uncertain about if an issue is required.

{%
include callout.html
type="success"
title="Issues keep everyone on the same page"
content="It is crucial for all changes to be tracked with issues to keep everyone updated on how the app is changing over time. This is especially important because we are a distributed team and not everyone is involved in every conversation about a new feature or design change.

Furthermore, there are more than just software engineers looking at GitHub. Think: designers who need to know how features function, support staff who need to relay information to customers about when a bug is fixed, marketing people who are showcasing our software (sometimes live on stage!), and business people who ensure we're efficiently allocating resources to propel the company forward.

Just because you know what's going on isn't an excuse to not open an issue, not keep it updated, or not accurately move it through the project board."
%}

### For outside contributions

Members of the general public are welcome to submit change requests to the codebase as well, and should open up issues as a means of discussing and proposing changes to the codebase.

Some examples of past contributions from third party developers include:

 * Translation and typographical fixes
 * Bug fixes
 * Styling fixes
 * New features

We want everyone to enjoy contributing to the FarmBot project. Unfortunately, **not all pull requests can be accepted.** For this reason, we ask that first time contributors making large contributions to the project open a GitHub issue thread before beginning work on the contribution. It is never fun to close a pull request that was well intentioned but not within the scope of the project.

Certain outside contributions are less likely to be accepted. These contributions include:

 * Extremely large pull requests that change the formatting of existing code but which do not fix bugs or add new features (high risk of adding defects).
 * Extremely large pull requests from developers that do not have an established history with the project (high risk of adding defects).
 * Pull requests for large new features that were not previously discussed with the core team and which might not fit long term project goals (out of scope).
 * Code that has architectural or style issues which cannot be resolved during code review (increased maintenance burden).
 * Code which is valid but based mostly on style preferences that is in conflict with the norms and preferences of core maintainers (increased maintenance burden).

## Step 2: Development

Once you are ready to work on an issue, assign yourself to it on GitHub and move it to the **In Progress** column on the project board. This signals to other team members that the issue is being actively worked on and they should work on other issues to avoid merge conflicts or duplication of effort.

Below are some general guidelines for the development process:

 * As mentioned earlier, **all software changes require an issue**. This is essential to information flow within a distributed team, and all team members need to be informed. Progress needs to be tracked not only for the software engineers, but also for designers, QA people, and customer support staff.
 * Always create a feature branch for new software changes.
 * Do not keep a feature branch open for more than 5 business days. Please see the [long running branches](#long-running-branches) section for features that require more than 5 days of work to complete.
 * When the branch is stable enough to merge into the `staging` branch, submit a pull request. Please note that having a stable branch is not always the same thing as having a complete feature. We prefer merging into `staging` as often as possible as long as it does not degrade the stability of the `staging` branch.

### Pausing and resuming work

If you must pause work on a particular issue and it is safe for other team members to continue work on it, move it to the **TODO** column of the project board.

If you are pausing work on the issue and intend to resume work in less than 5 business days, leave the issue in the **TODO** column.

If you are taking a long break from an issue, it should be moved back to the category it came from.

In all cases, leave a comment detailing:

 * Your progress on the issue when you stopped working on it.
 * Relevant details to keep other team members up-to-date. Example: reasons for pausing development, questions for other team members, etc.

{%
include callout.html
type="info"
title="Efficiently allocating resources"
content="We should strive to have as little work on pause as possible. Of course, priorities will sometimes change (eg: security incident) that require other work to be put on pause. However, it is not an efficient use of our time to work on too many issues at once, which risks more of them to being put on pause before completion, increases the likelihood of merge conflicts, and lengthens the time new changes can be used by customers."
%}

### Long running branches

Long running branches are problematic in many ways. They block developers, cause merge conflicts and prevent team members from having a full picture of codebase progress. Most issues can and should be completed within **5 business days**.

There are several accepted courses of action in the rare case that a feature cannot be completed in five business days.

 * Break the issue into smaller issues that can be safely merged into `staging` within 5 business days.
 * If the slow down is due to missing information, stop working on the issue and notify team members that you are blocked.
 * Put the feature behind a "feature flag" and merge into `staging`.
 * Write unit tests for the in-progress feature but do not integrate it into the application.

### The "next" branch

If the courses of action listed above are not appropriate and you are still unable to merge your code into `staging` within 5 business days, a special branch called `next` must be created. The `next` branch functions similarly to the `staging` branch, except that it will have lower stability standards than the `staging` branch.

When a `next` branch is in use, all other team members should work off of `next` rather than `staging`. The branch should be merged into `staging` and deleted as soon as reasonably possible. During this period, the only changes that will be accepted into `staging` are security patches and emergency hot-fixes. The `next` branch must meet reasonable stability expectations at the time of merge into `staging`.

The situation outlined above is a rare occurrence and typically only happens during major version upgrades, such as the transition from FBOS v7 to v8, or when performing aggressive dependency upgrades such as upgrades from Rails 5 to Rails 6. Using `next` branches is disruptive to the workflow of other team members and is a compromise intended to reduce merge conflicts, progress blocking, and duplication of effort.

### Finishing an issue

After completing an issue, it is important to ensure that the code is adequately tested by the developer. Some questions to ask are:

 * Does type checking succeed?
 * Do all automated tests pass?
 * Is the application still in working order?

Such checks will minimize time spent in QA and avoid regressions.

## Step 3: Pull request and code review

After a feature is complete, the proposed change must be submitted as a **pull request** to the main GitHub repository. Include the following information in your pull request:

 * **WHY**: A detailed summary of the author's intent.
 * **WHAT CHANGED**: A list of functional areas affected by the proposed change.
 * **WHAT'S NEXT** (optional): This is useful for large projects that have many issues or require multiple pull requests.

After submitting the pull request, all **continuous integration tests** must pass. Common checks include:

 * Type checks
 * Unit tests
 * Testing coverage checks.

{%
include callout.html
type="success"
title="Test coverage must not decrease"
content="As a matter of policy, FarmBot does not accept pull requests that lower the unit test coverage of a repository. The only exceptions are critical security updates and fixes to an active service outage."
%}

Once your pull request is merged, you may move the issue from the **In progress** column to the **Done (needs QA)** column.

## Step 4: Staging and QA

After your pull request is accepted, it is deployed to `staging.farm.bot` within an hour via automated means. A team member (ideally, not the author) will begin manually testing the feature for quality assurance. If no faults are noted, the QA tester may move the issue from the **Done (needs QA)** column  to the **QA'd, ready to deploy** column. The feature is now ready for a production release.

If issues are noted during QA testing, the QA tester will move the issue back to the **TODO** column and leave a message indicating the problem and steps to reproduce. When the author is able to rectify the situation, a new pull request is created, following the same process as mentioned previously.

## Step 5: Public release

When the staging environment is ready for public consumption, a pull request merging `staging` into `master` can be created. Such pull requests require an approval from a second developer, ideally one that is familiar with the package being released.

After a second reviewer approves the changes and all CI checks have passed, the pull request is merged and a GitHub release can be tagged.

Unlike `staging`, a deployment to the production environment does not happen automatically, for safety reasons. See the [Deployment of Web Services](deployment-of-web-services.md) document for additional details.

<style>
.hub-container {
  max-width: 1350px;
}
.value-icon {
  display: inline-block;
  height: 18px;
  margin-bottom: -2px;
}
  
a[title="Guides"] {
  color: #f4f4f4!important;
  border-bottom: 5px solid #f4f4f4;
  padding-bottom: 20px!important;
}
  
a[title="Guides"]:hover {
  color: white!important;
  border-bottom-color: white;
}
  
#hub-header li a:hover {
  box-shadow: none!important;
}
</style>

<meta name="theme-color" content="#434343">

