---
title: "Pushing FarmBot OS Updates"
slug: "pushing-farmbot-os-updates"
---

* toc
{:toc}

Currently with the NervesHub update system, there are the following channels:

|Channel                       |Deployed by...                |When...                       |Notes                         |
|------------------------------|------------------------------|------------------------------|------------------------------|
|stable                        |CircleCI                      |The `master` branch of FBOS is pushed.|Should be considered consumer ready.
|staging                       |CircleCI                      |The `staging` branch of FBOS is pushed.|Should be considered almost consumer-ready, but expect bugs.
|beta                          |CircleCI                      |The `beta` branch of FBOS is pushed.|Should be considered broken and should not be used by consumers.




