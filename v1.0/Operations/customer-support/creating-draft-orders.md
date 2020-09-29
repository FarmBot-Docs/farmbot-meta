---
title: "Creating Draft Orders"
slug: "creating-draft-orders"
---

* toc
{:toc}

Sometimes a customer is not able to simply place an order in our online shop. Instead, they require us to create a **draft order** in Shopify, and then send them the email link to complete the purchase. Here are some common examples when we need to do this:

* A school is applying for grant money and needs an official quote from us.
* A company needs a PDF invoice for their finance department to send a check.
* Someone is having trouble using our online shop to place an order, and just wants us to figure it out for them.

# Creating a draft order

To create a draft order, you'll need the following information from the customer:

* Customer's name, phone number, and email address
* Exact products and quantities desired
* Exact shipping address (used to calculate shipping fees, and to send the products!)
* Billing address if different from the shipping address

Once you have this information, go to [neworder.farm.bot](http://neworder.farm.bot) to create the draft order in the Shopify backend. Ensure all information is correct, the shipping fee has been added, and then save the draft order and use the Shopify feature to send the customer an email with the draft order information.

{%
include callout.html
type="info"
title="Draft orders use current pricing"
content="Note that when you create or update a draft order, it will use the most current pricing for the products. If a customer is referencing a previous sale price that we are going to honor, then you'll need to add a manual discount."
%}

The draft order email will contain a big button for the customer to complete their purchase. This button will navigate them to the checkout page with all of their order details pre-loaded, except for payment info. When the customer completes the payment, a real order will be created from the draft order.

The email will also contain a link to download a PDF invoice. This PDF, or the email itself, is usually enough for anyone who needs a quote or invoice, though sometimes these documents need to be edited to include specific wording, VAT numbers, etc. To do so, you can download the PDF from the draft order screen in the Shopify backend, and edit it using Adobe Acrobat or another PDF editing tool.

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

