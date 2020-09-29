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

