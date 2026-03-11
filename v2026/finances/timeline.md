---
title: "Timeline"
slug: "timeline"
---

This interactive timeline shows FarmBot Inc's manufacturing runs, sales, inventory, and account balances over time, providing a detailed look at the ebbs and flows of the company's cashflow and balance sheet.

<style>
  @import url("../../assets/css/timeline.css");
</style>

<div class="timeline-app" data-timeline
  data-sales="../../assets/data/timeline/sales.csv"
  data-accounts="../../assets/data/timeline/accounts/manifest.csv"
  data-manufacturing="../../assets/data/timeline/manufacturing_runs.csv">

  <div class="timeline-controls">
    <div class="timeline-panel">
      <h3 class="timeline-panel-title">
        <label class="timeline-panel-toggle">
          <input type="checkbox" data-product-group-toggle="Genesis" checked>
          <span>Genesis</span>
        </label>
      </h3>
      <div class="timeline-filter-list" data-product-filters="Genesis"></div>
    </div>

    <div class="timeline-panel">
      <h3 class="timeline-panel-title">
        <label class="timeline-panel-toggle">
          <input type="checkbox" data-product-group-toggle="Genesis XL" checked>
          <span>Genesis XL</span>
        </label>
      </h3>
      <div class="timeline-filter-list" data-product-filters="Genesis XL"></div>
    </div>

    <div class="timeline-panel">
      <h3 class="timeline-panel-title">
        <label class="timeline-panel-toggle">
          <input type="checkbox" data-product-group-toggle="Express" checked>
          <span>Express</span>
        </label>
      </h3>
      <div class="timeline-filter-list" data-product-filters="Express"></div>

      <h3 class="timeline-panel-title timeline-panel-subtitle">
        <label class="timeline-panel-toggle">
          <input type="checkbox" data-product-group-toggle="Express XL" checked>
          <span>Express XL</span>
        </label>
      </h3>
      <div class="timeline-filter-list" data-product-filters="Express XL"></div>
    </div>

    <div class="timeline-panel">
      <h3>Accounts</h3>
      <div class="timeline-filter-list" data-account-filters></div>
    </div>

    <div class="timeline-panel">
      <h3>Timeframe</h3>
      <div class="timeline-timeframe">
        <button type="button" class="is-active" data-timeframe="all">All</button>
        <button type="button" data-timeframe="5y">5y</button>
        <button type="button" data-timeframe="3y">3y</button>
      </div>
      <div class="timeline-dates">
        <label>
          <div class="timeline-date-label">Start</div>
          <input type="month" data-start>
        </label>
        <label>
          <div class="timeline-date-label">End</div>
          <input type="month" data-end>
        </label>
        <button type="button" data-apply-range>Apply</button>
      </div>
    </div>
  </div>

  <div class="timeline-chart-wrap" data-chart-wrap>
    <div class="timeline-tooltip" data-tooltip></div>
  </div>
  <div class="timeline-empty" data-empty></div>
</div>

<noscript>
  <p>This page needs JavaScript enabled to render the timeline.</p>
</noscript>

<script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
<script src="../../assets/js/timeline.js"></script>

# Updating the data

To update the timeline's data files, export reports from the following sources. Note that some exports will need to be converted to the correct CSV format in [this spreadsheet](https://docs.google.com/spreadsheets/d/1CZqhCI3ZNCZACf2h8m_46GRiprJedOUlilEQuNuFeU0/edit?usp=sharing).

- [FarmBot sales report](https://admin.shopify.com/store/farmbot/analytics/reports/241303650?ql=FROM+sales%0A++SHOW+net_items_sold%2C+net_sales%0A++WHERE+product_type+%3D+%27FarmBot+Kits%27%0A++++AND+product_variant_sku+NOT+CONTAINS+%27max%27%0A++GROUP+BY+product_variant_sku%2C+month+WITH+GROUP_TOTALS%2C+TOTALS%0A++TIMESERIES+month%0A++SINCE+2016-06-01+UNTIL+2025-12-31%0A++ORDER+BY+net_items_sold__product_variant_sku_totals+DESC%2C+month+ASC%2C%0A++++net_items_sold+DESC%2C+product_variant_sku+ASC%0A++LIMIT+10000%0AVISUALIZE+net_items_sold+MAX+22)
- [Account balance reports](https://reporting.xero.com/!b2WVB/v1/Run/15047366)
- [LDO payments report](https://reporting.xero.com/!b2WVB/v1/Run/15047282)
- Shopify Capital and PayPal loan statements can be downloaded directly from their respective dashboards.
