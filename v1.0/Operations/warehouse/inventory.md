---
title: "Inventory"
slug: "inventory"
---

* toc
{:toc}

# Organizational system
Our organizational system both in the warehouse and within Shopify is based on our various FarmBot kits:

|Product Line                  |Version                       |
|------------------------------|------------------------------|
|FarmBot Genesis               |v1.2
|                              |v1.3
|                              |v1.4
|FarmBot Genesis XL            |v1.4

In the warehouse, this organization manifests in the form of storage racks dedicated to each kit's partial kits and individual parts, as well as areas used for the palletized full kits.

In Shopify, this organization manifests in the form of product **collections** named after each of the kits, for example: `FarmBot Genesis v1.3`. These collections include the kit itself as well as all individual parts and partial kits that are used in the kit. For a product to appear in a collection, it must be added.

## Overlap parts
Many parts, such as **M5 x 10mm screws**, are used in multiple FarmBot kits. We call these *overlap parts*. When designing a new FarmBot kit, we try to maximize the number of overlap parts in order to simplify the manufacturing and supply chains and also provide customers with an ecosystem of parts that can be easily mixed and matched without compatibility issues. Think: upgrades, custom builds, etc.

In Shopify, we handle overlap parts by adding the same product to multiple collections.

In the warehouse, rather than keeping an overlap part on multiple racks, we only keep the product on the rack for the most recent version of the kit that the part is included in. This minimizes the space needed for spare parts in the warehouse, facilitates inventory tracking/auditing, and reduces duplicate places where the same product may be stored in the warehouse.

## Examples

|Product                       |Shopify Collections           |Warehouse Racks               |
|------------------------------|------------------------------|------------------------------|
|FarmBot Genesis v1.4 (full kit)|`FarmBot Genesis v1.4`        |FarmBot Genesis v1.4
|FarmBot Genesis v1.3 Plastic Parts Kit (partial kit)|`FarmBot Genesis v1.3`        |FarmBot Genesis v1.3
|M5 x 10mm Screws (individual part)|`FarmBot Genesis v1.2`<br>`FarmBot Genesis v1.3`<br>`FarmBot Genesis v1.4`<br>`FarmBot Genesis XL v1.4`|FarmBot Genesis v1.4<br>FarmBot Genesis XL v1.4
|v1.2 Camera Mounts (individual part)|`FarmBot Genesis v1.2`        |FarmBot Genesis v1.2



{%
include callout.html
type="info"
title=""
content="Note that at this time, because of huge similarity between Genesis v1.4 and Genesis XL v1.4, these two product's partial kits and individual parts are sharing the same racks."
%}

# Receiving inventory


# Reconciling inventory with Shopify

{%
include callout.html
type="info"
title="Product not yet in Shopify?"
content="If we receive inventory of new products, follow the instructions here to add them to Shopify."
%}



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

