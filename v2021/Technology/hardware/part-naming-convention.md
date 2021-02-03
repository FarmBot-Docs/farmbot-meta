---
title: "Part Naming Convention"
slug: "part-naming-convention"
description: "Scheme for accurately identifying FarmBot parts"
---

* toc
{:toc}

The following **part naming convention** applies across our product offerings and throughout the prototyping and R&D phase. Use the convention when writing docs, providing customer support, listing a product for sale, designing parts, and in discussions with manufacturing partners.

# Convention
`Product Line` `Product Version` `Part Name` `Part Revision`

## Notes
  * `Product Line` should not include "FarmBot". For example, write "Genesis" instead of "FarmBot Genesis".
  * FarmBot size designations are part of the `Product Line`, **not** the `Product Version`. For example, "Genesis XL v1.4" should be interpreted as `Genesis XL` `v1.4` instead of `Genesis` `XL v1.4`.
  * `Part Revision` should be a letter, and abbreviated. For example, "Rev C".

## Omitting elements
Omitting elements of the naming convention is recommended to make communication less verbose. Remember: the naming convention is a tool to **help** us, not burden us. However, omitting elements must be done cautiously and within the following rules, so that the naming convention does not lose [precision](#precision-is-key).
  * `Part Revision` may be omitted when referring to the **latest revision** of the part. This omission can be useful when referring to production parts (assuming we're manufacturing the latest revision that was designed). Or, when we communicate about a part to the public such as in the docs, during customer support, or in the online shop.
  * `Product Version` may be omitted when referring to the **latest product version** of the product line. For example, the "Genesis [omitted product version] electronics box" refers to the electronics box in the latest version of the Genesis product line.
  * `Product Line` may be omitted when the part name refers to the same part across multiple product lines, but only if that part name isn't ever used to refer to a different part. For example, our M5 x 10mm screws are used in every product line and version we have, and we don't have anything named "M5 x 10mm screws" that is actually a different part. Thus, for brevity, we can simply call these parts "M5 x 10mm screws".

{%
include callout.html
type="success"
title="When in doubt, don't omit"
content="If you're ever in doubt about omitting an element, **don't omit it**. It is better to say a few extra words to ensure precision."
%}

# Precision is key
When used correctly, the naming convention should refer to **exactly one part** ([at the current time](#think-about-the-future)), even when elements are omitted. Employing this level of communication precision is critical in reducing manufacturing mixups, ensuring customers get correct replacement parts, and providing accurate documentation and product listings.

{%
include callout.html
type="success"
title="Multiple names can refer to one part"
content="Many of our parts are used in more than one product line and in more than one product version. When this is the case, there may be **multiple names** that can refer to that **one part**. This is okay.

For example: `Genesis v1.2 M5 x 10mm screws`, `Genesis v1.3 M5 x 10mm screws`, `Genesis v1.4 M5 x 10mm screws`, `Genesis XL v1.4 M5 x 10mm screws`, `Genesis M5 x 10mm screws`, and even simply `M5 x 10mm screws` all refer to the same, one part. They are all okay to use, though for brevity's sake, you should probably use the last one in that list."
%}



{%
include callout.html
type="danger"
title="One name should never refer to multiple parts"
content="If everyone follows the omission rules above, there shouldn't be a problem with one name referring to multiple parts ([at the current time](#think-about-the-future)). Nevertheless, making omissions will increase the likelihood of a miscommunication happening. So when in doubt, don't omit.

If someone is using a name that could refer to multiple parts (because they didn't follow the omission rules), make sure you get clarification. For example, when a new product version is being developed, say, v1.5, you shouldn't omit product version. If you did, one person may think you're talking about the production v1.4 part (the one currently being sold), while another person may think you're talking about the v1.5 part (the one being developed)."
%}

## Think about the future
While omitting some information might make sense and follow the convention _now_, think about if it will make sense and provide precision in a year, or five.

We won't remember spoken words with such detail in a month. And we probably won't look back at years-old chat logs either. But we (and customers and partners) will probably look back at documentation, engineering drawings, exported files, CAD models, and more. In some cases, omissions may make determining precisely which part was being referenced difficult. Again, when in doubt, don't omit.


