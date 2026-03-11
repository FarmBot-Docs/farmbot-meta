(() => {
  const container = document.querySelector('[data-timeline]');
  if (!container || typeof d3 === 'undefined') {
    return;
  }

  const dataPaths = {
    sales: container.dataset.sales,
    accounts: container.dataset.accounts,
    manufacturing: container.dataset.manufacturing,
  };

  const parseDate = d3.timeParse('%Y-%m-%d');
  const parseMonth = d3.timeParse('%Y-%m');
  const parseUsDate = d3.timeParse('%m/%d/%Y');
  const formatDate = d3.timeFormat('%b %Y');
  const formatMonth = d3.timeFormat('%b %Y');
  const formatMonthKey = d3.timeFormat('%Y-%m');
  const formatNumber = d3.format(',.0f');
  const formatCurrency = d3.format('$,.0f');
  const totalSeriesKey = 'Total';

  function formatProductName(slug) {
    if (!slug) return '';
    const normalized = slug.trim().toLowerCase();
    const match = normalized.match(/^farmbot-(genesis|express)(-xl)?-v(\d+)-(\d+)$/);
    if (match) {
      const base = match[1];
      const isXl = Boolean(match[2]);
      const major = match[3];
      const minor = match[4];
      const baseName = base.charAt(0).toUpperCase() + base.slice(1);
      return `${baseName}${isXl ? ' XL' : ''} v${major}.${minor}`;
    }
    const withoutPrefix = normalized.replace(/^farmbot-/, '');
    const words = withoutPrefix
      .split('-')
      .filter(Boolean)
      .map((word) => {
        if (word === 'xl') return 'XL';
        if (word.startsWith('v') && /^v\d+$/.test(word)) return word.toLowerCase();
        return word.charAt(0).toUpperCase() + word.slice(1);
      });
    return words.length ? words.join(' ') : '';
  }

  function isXLProduct(name) {
    return /\sXL\b/.test(name);
  }

  function getBaseProductName(name) {
    return name.replace(/\sXL\b/, '');
  }

  function parseProductVersion(name) {
    const match = name.match(/^(Genesis|Express)(?:\sXL)?\sv(\d+)\.(\d+)$/);
    if (!match) return null;
    return {
      line: match[1],
      major: Number(match[2]),
      minor: Number(match[3]),
    };
  }

  function desaturateColor(color, factor) {
    const hsl = d3.hsl(color);
    hsl.s *= factor;
    return hsl.formatHex ? hsl.formatHex() : hsl.toString();
  }

  function getManufacturingTrack(productName) {
    if (!productName) return '';
    if (productName.startsWith('Genesis XL')) return 'Genesis XL';
    if (productName.startsWith('Genesis')) return 'Genesis';
    if (productName.startsWith('Express XL')) return 'Express XL';
    if (productName.startsWith('Express')) return 'Express';
    return '';
  }

  function getVersionLabel(productName) {
    if (!productName) return '';
    const match = productName.match(/v\d+\.\d+/);
    return match ? match[0] : productName;
  }

  function formatAccountLabel(name) {
    return name === 'Credit Cards' ? 'Credit' : name;
  }

  const chartWrap = container.querySelector('[data-chart-wrap]');
  const tooltip = container.querySelector('[data-tooltip]');
  const emptyState = container.querySelector('[data-empty]');

  const productFilterLists = Array.from(container.querySelectorAll('[data-product-filters]'));
  const productGroupToggles = Array.from(container.querySelectorAll('[data-product-group-toggle]'));
  const accountFilters = container.querySelector('[data-account-filters]');
  const timeframeButtons = Array.from(container.querySelectorAll('[data-timeframe]'));
  const startInput = container.querySelector('[data-start]');
  const endInput = container.querySelector('[data-end]');
  const applyButton = container.querySelector('[data-apply-range]');

  const productColors = [
    '#4e79a7', '#f28e2b', '#e15759', '#76b7b2',
    '#59a14f', '#edc949', '#af7aa1', '#ff9da7',
    '#9c755f', '#bab0ab', '#1b6ca8', '#8cd17d',
    '#b6992d', '#499894', '#d37295', '#fabfd2',
  ];
  const totalSeriesColor = '#111827';
  const accountColors = [
    '#003f5c', '#2f4b7c', '#665191', '#a05195',
    '#d45087', '#f95d6a', '#ff7c43', '#ffa600',
    '#7a5195',
  ];
  const eventColors = ['#9d4edd', '#3a86ff', '#fb5607', '#06d6a0', '#8338ec'];

  const parseFlexibleDate = (value) => parseDate(value) || parseMonth(value);
  const parseCurrency = (value) => {
    if (value === null || value === undefined) return NaN;
    const cleaned = String(value).replace(/[^0-9.-]/g, '');
    return cleaned ? Number(cleaned) : NaN;
  };
  const normalizeZero = (value, epsilon = 1e-6) => (
    Number.isFinite(value) && Math.abs(value) < epsilon ? 0 : value
  );

  Promise.all([
    d3.csv(dataPaths.sales, (d) => ({
      product: formatProductName(d['Product variant SKU']),
      date: parseFlexibleDate(d.Month || d.month || d.date),
      units: Number(d['Net items sold']),
      revenue: Number(d['Net sales']),
    })),
    d3.csv(dataPaths.accounts, (d) => ({
      account: d.account,
      file: d.file,
    })),
    d3.csv(dataPaths.manufacturing, (d) => ({
      product: formatProductName(d.product_line),
      start: parseFlexibleDate(d.start),
      end: parseFlexibleDate(d.end),
      unitsProduced: Number(d.units_produced),
      costPerUnit: Number(d['cost/unit']),
      unitsSellable: Number(d.units_sellable),
      ldoAdjustment: Number(d.ldo_balance_adjustment),
    })),
  ]).then(([salesRows, accountManifest, manufacturingRuns]) => {
    const sales = salesRows.filter((row) => row.product && row.date);

    const salesUnitsBase = [];
    const salesRevenueBase = [];
    sales.forEach((row) => {
      if (Number.isFinite(row.units)) {
        salesUnitsBase.push({ date: row.date, product: row.product, value: row.units });
      }
      if (Number.isFinite(row.revenue)) {
        salesRevenueBase.push({ date: row.date, product: row.product, value: row.revenue });
      }
    });

    function buildNonZeroBounds(series) {
      const bounds = new Map();
      series.forEach((entry) => {
        if (!entry.date || !Number.isFinite(entry.value) || entry.value === 0) return;
        const existing = bounds.get(entry.product);
        if (!existing) {
          bounds.set(entry.product, { min: entry.date, max: entry.date });
        } else {
          if (entry.date < existing.min) existing.min = entry.date;
          if (entry.date > existing.max) existing.max = entry.date;
        }
      });
      return bounds;
    }

    function buildTotalSeries(series) {
      const totals = new Map();
      series.forEach((entry) => {
        if (!entry.date || !Number.isFinite(entry.value)) return;
        const month = d3.timeMonth.floor(entry.date);
        const key = formatMonthKey(month);
        const existing = totals.get(key) || { date: month, product: totalSeriesKey, value: 0 };
        existing.value += entry.value;
        totals.set(key, existing);
      });
      return Array.from(totals.values());
    }

    const totalUnitsSeries = buildTotalSeries(salesUnitsBase);
    const totalRevenueSeries = buildTotalSeries(salesRevenueBase);

    const salesUnits = salesUnitsBase.concat(totalUnitsSeries);
    const salesRevenue = salesRevenueBase.concat(totalRevenueSeries);

    const salesUnitsBounds = buildNonZeroBounds(salesUnitsBase);
    const salesRevenueBounds = buildNonZeroBounds(salesRevenueBase);
    const totalUnitsBounds = buildNonZeroBounds(totalUnitsSeries).get(totalSeriesKey);
    const totalRevenueBounds = buildNonZeroBounds(totalRevenueSeries).get(totalSeriesKey);
    if (totalUnitsBounds) salesUnitsBounds.set(totalSeriesKey, totalUnitsBounds);
    if (totalRevenueBounds) salesRevenueBounds.set(totalSeriesKey, totalRevenueBounds);

    const parseAccountRow = (d) => ({
      date: parseFlexibleDate(d.date ?? d.Date),
      value: Number(d.value ?? d.Value ?? d.actual ?? d.Actual ?? d.gross ?? d.Gross),
    });

    const accountEntries = accountManifest
      .filter((entry) => entry.account && entry.file);
    const accountEntriesByName = d3.group(accountEntries, (entry) => entry.account);
    const ldoPaymentsEntry = accountEntriesByName.get('LDO Payments')?.[0] || null;
    accountEntriesByName.delete('LDO Payments');

    const accountPromises = Array.from(accountEntriesByName, ([account, entries]) => {
      const files = entries.map((entry) => entry.file).filter(Boolean);
      if (!files.length && account !== 'Cash') {
        return Promise.resolve({ account, rows: [] });
      }

      if (account === 'Cash') {
        const baseDir = entries[0]?.file
          ? entries[0].file.replace(/[^/]+$/, '')
          : '/assets/data/timeline/accounts/';
        const checkingFile = `${baseDir}checking.csv`;
        const savingsFile = `${baseDir}savings.csv`;

        return Promise.all([
          d3.csv(checkingFile, parseAccountRow),
          d3.csv(savingsFile, parseAccountRow),
        ]).then(([checkingRows, savingsRows]) => {
          const combined = new Map();
          const addRows = (rows) => {
            rows.forEach((row) => {
              if (!row.date || !Number.isFinite(row.value)) return;
              const month = d3.timeMonth.floor(row.date);
              const key = formatMonthKey(month);
              const entryRow = combined.get(key) || { date: month, value: 0 };
              entryRow.value += row.value;
              combined.set(key, entryRow);
            });
          };
          addRows(checkingRows);
          addRows(savingsRows);
          return { account, rows: Array.from(combined.values()) };
        });
      }

      if (account === 'AMEX Loan') {
        return Promise.all(files.map((file) => d3.csv(file, parseAccountRow))).then((fileRows) => {
          const transactions = fileRows.flat()
            .filter((row) => row.date && Number.isFinite(row.value))
            .sort((a, b) => a.date - b.date);
          let runningBalance = 0;
          const balanceByMonth = new Map();
          transactions.forEach((tx) => {
            runningBalance = normalizeZero(runningBalance + tx.value);
            const month = d3.timeMonth.floor(tx.date);
            const key = formatMonthKey(month);
            balanceByMonth.set(key, { date: month, value: runningBalance });
          });
          return { account, rows: Array.from(balanceByMonth.values()) };
        });
      }

      if (account === 'Shopify Loan') {
        return Promise.all(
          files.map((file) => d3.csv(file, (d) => ({
            date: parseFlexibleDate(d.date ?? d.Date),
            value: parseCurrency(d.balance ?? d.Balance),
          }))),
        ).then((fileRows) => {
          const rows = fileRows.flat()
            .filter((row) => row.date && Number.isFinite(row.value))
            .sort((a, b) => a.date - b.date);
          const balanceByMonth = new Map();
          rows.forEach((row) => {
            const month = d3.timeMonth.floor(row.date);
            const key = formatMonthKey(month);
            balanceByMonth.set(key, { date: month, value: normalizeZero(row.value) });
          });
          return { account, rows: Array.from(balanceByMonth.values()) };
        });
      }

      if (account === 'PayPal Loan') {
        return Promise.all(
          files.map((file) => d3.csv(file, (d) => ({
            date: parseFlexibleDate(d.date ?? d.Date) || parseUsDate(d.date ?? d.Date),
            value: parseCurrency(d.amount ?? d.Amount),
          }))),
        ).then((fileRows) => {
          const transactions = fileRows.flat()
            .filter((row) => row.date && Number.isFinite(row.value))
            .sort((a, b) => a.date - b.date);
          let runningBalance = 0;
          const balanceByMonth = new Map();
          transactions.forEach((tx) => {
            runningBalance = normalizeZero(runningBalance + tx.value);
            const month = d3.timeMonth.floor(tx.date);
            const key = formatMonthKey(month);
            balanceByMonth.set(key, { date: month, value: runningBalance });
          });
          return { account, rows: Array.from(balanceByMonth.values()) };
        });
      }

      if (account === 'Line of Credit') {
        return Promise.all(files.map((file) => d3.csv(file, parseAccountRow))).then((fileRows) => ({
          account,
          rows: fileRows.flat().map((row) => {
            if (!Number.isFinite(row.value)) return row;
            return { ...row, value: -row.value };
          }),
        }));
      }

      if (account === 'Credit Cards') {
        return Promise.all(files.map((file) => d3.csv(file, parseAccountRow))).then((fileRows) => {
          const balanceByMonth = new Map();
          fileRows.flat().forEach((row) => {
            if (!row.date || !Number.isFinite(row.value)) return;
            const month = d3.timeMonth.floor(row.date);
            const key = formatMonthKey(month);
            const entry = balanceByMonth.get(key) || { date: month, value: 0 };
            entry.value += row.value;
            balanceByMonth.set(key, entry);
          });
          return {
            account,
            rows: Array.from(balanceByMonth.values()).map((row) => ({
              ...row,
              // Card balances are stored as negatives in source files.
              value: normalizeZero(-row.value),
            })),
          };
        });
      }

      return Promise.all(files.map((file) => d3.csv(file, parseAccountRow)))
        .then((fileRows) => ({ account, rows: fileRows.flat() }));
    });
    const ldoPaymentsPromise = ldoPaymentsEntry
      ? d3.csv(ldoPaymentsEntry.file, (d) => ({
        date: parseFlexibleDate(d.date ?? d.Date),
        value: Number(d.amount ?? d.Gross ?? d.gross ?? d.value),
      }))
      : Promise.resolve([]);

    Promise.all([Promise.all(accountPromises), ldoPaymentsPromise]).then(
      ([accountData, ldoPayments]) => {
        const accountsBase = [];
        accountData.forEach(({ account, rows }) => {
          rows.forEach((row) => {
            if (!row.date || !Number.isFinite(row.value)) return;
            accountsBase.push({ date: row.date, account, value: row.value });
          });
        });

        const stockReceivedMap = new Map();
        const ldoDeltas = new Map();

        manufacturingRuns.forEach((run) => {
          if (!run.product || !run.start) return;
          const endDate = run.end || run.start;
          const startMonth = d3.timeMonth.floor(run.start);
          const endMonth = d3.timeMonth.floor(endDate);

          if (Number.isFinite(run.unitsSellable)) {
            const key = `${run.product}|${formatMonthKey(endMonth)}`;
            const entry = stockReceivedMap.get(key)
              || { date: endMonth, product: run.product, value: 0 };
            entry.value += run.unitsSellable;
            stockReceivedMap.set(key, entry);
          }

          const totalCost = Number.isFinite(run.unitsProduced) && Number.isFinite(run.costPerUnit)
            ? run.unitsProduced * run.costPerUnit
            : NaN;
          const adjustment = Number.isFinite(run.ldoAdjustment) ? run.ldoAdjustment : 0;

          if (Number.isFinite(totalCost) || adjustment !== 0) {
            const ldoKey = formatMonthKey(startMonth);
            ldoDeltas.set(ldoKey, (ldoDeltas.get(ldoKey) || 0) - (totalCost || 0) - adjustment);
          }
        });

        ldoPayments.forEach((payment) => {
          if (!payment.date || !Number.isFinite(payment.value)) return;
          const month = d3.timeMonth.floor(payment.date);
          const key = formatMonthKey(month);
          ldoDeltas.set(key, (ldoDeltas.get(key) || 0) - payment.value);
        });

        const stockReceived = Array.from(stockReceivedMap.values());
        const manufacturingEvents = manufacturingRuns
          .filter((run) => run.start)
          .map((run) => {
            const startMonth = d3.timeMonth.floor(run.start);
            const endDate = run.end || run.start;
            const endMonth = d3.timeMonth.floor(endDate);
            return {
              start: startMonth,
              end: endMonth,
              label: 'Manufacturing run',
              type: 'manufacturing',
              product: run.product || '',
            };
          });

        const allDates = [
          ...salesUnits.map((d) => d.date),
          ...salesRevenue.map((d) => d.date),
          ...stockReceived.map((d) => d.date),
          ...accountsBase.map((d) => d.date),
          ...ldoPayments.map((d) => d.date),
          ...manufacturingRuns.flatMap((run) => [run.start, run.end]),
          ...manufacturingEvents.flatMap((d) => [d.start, d.end]),
        ].filter(Boolean);

        const minDate = d3.min(allDates) || new Date();
        const maxDate = d3.max(allDates) || new Date();

        const monthStart = d3.timeMonth.floor(minDate);
        const monthEnd = d3.timeMonth.floor(maxDate);
        const months = d3.timeMonth.range(monthStart, d3.timeMonth.offset(monthEnd, 1));
        let runningBalance = 0;
        const zeroFillLoanAccounts = new Set(['AMEX Loan', 'Shopify Loan', 'PayPal Loan']);
        const accountsByAccount = d3.group(accountsBase, (entry) => entry.account);
        const filledAccounts = [];
        accountsByAccount.forEach((entries, account) => {
          const valueByMonth = new Map();
          entries.forEach((entry) => {
            const month = d3.timeMonth.floor(entry.date);
            valueByMonth.set(formatMonthKey(month), entry.value);
          });

          let lastValue = zeroFillLoanAccounts.has(account) ? 0 : null;
          months.forEach((month) => {
            const key = formatMonthKey(month);
            if (valueByMonth.has(key)) {
              lastValue = valueByMonth.get(key);
            }
            if (Number.isFinite(lastValue)) {
              filledAccounts.push({ date: month, account, value: lastValue });
            }
          });
        });

        const ldoBalance = months.map((month) => {
          const key = formatMonthKey(month);
          runningBalance += ldoDeltas.get(key) || 0;
          return { date: month, account: 'LDO Balance', value: runningBalance };
        });
        const accountsWithBalance = filledAccounts.concat(ldoBalance);

        const products = Array.from(
          new Set([
            ...sales.map((row) => row.product),
            ...manufacturingRuns.map((run) => run.product).filter(Boolean),
            ...manufacturingEvents.map((d) => d.product).filter(Boolean),
          ]),
        );

        const salesUnitsByProductMonth = new Map();
        salesUnitsBase.forEach((entry) => {
          if (!entry.date || !Number.isFinite(entry.value)) return;
          const month = d3.timeMonth.floor(entry.date);
          const key = `${entry.product}|${formatMonthKey(month)}`;
          salesUnitsByProductMonth.set(key, (salesUnitsByProductMonth.get(key) || 0) + entry.value);
        });
        const salesRevenueByProductMonth = new Map();
        salesRevenueBase.forEach((entry) => {
          if (!entry.date || !Number.isFinite(entry.value)) return;
          const month = d3.timeMonth.floor(entry.date);
          const key = `${entry.product}|${formatMonthKey(month)}`;
          salesRevenueByProductMonth.set(
            key,
            (salesRevenueByProductMonth.get(key) || 0) + entry.value,
          );
        });

        const receivedByProductMonth = new Map();
        manufacturingRuns.forEach((run) => {
          if (!run.product || !run.start || !Number.isFinite(run.unitsSellable)) return;
          const endDate = run.end || run.start;
          const endMonth = d3.timeMonth.floor(endDate);
          const key = `${run.product}|${formatMonthKey(endMonth)}`;
          receivedByProductMonth.set(key, (receivedByProductMonth.get(key) || 0) + run.unitsSellable);
        });

        const stockOnHand = [];
        products.forEach((product) => {
          let runningStock = 0;
          let hasActivity = false;
          months.forEach((month) => {
            const key = `${product}|${formatMonthKey(month)}`;
            const received = receivedByProductMonth.get(key) || 0;
            const sold = salesUnitsByProductMonth.get(key) || 0;
            if (received !== 0 || sold !== 0) {
              hasActivity = true;
            }
            runningStock += received - sold;
            stockOnHand.push({ date: month, product, value: runningStock });
          });
          if (!hasActivity) {
            for (let i = stockOnHand.length - months.length; i < stockOnHand.length; i += 1) {
              stockOnHand[i].skip = true;
            }
          }
        });

        const stockOnHandByProductMonth = new Map();
        stockOnHand.forEach((entry) => {
          const key = `${entry.product}|${formatMonthKey(entry.date)}`;
          stockOnHandByProductMonth.set(key, entry.value);
        });

        const priceSeriesByProduct = new Map();
        products.forEach((product) => priceSeriesByProduct.set(product, []));

        const lastPriceByProduct = new Map();
        const inventoryValue = [];
        months.forEach((month) => {
          const monthKey = formatMonthKey(month);
          let total = 0;
          products.forEach((product) => {
            const key = `${product}|${monthKey}`;
            const units = salesUnitsByProductMonth.get(key) || 0;
            const revenue = salesRevenueByProductMonth.get(key) || 0;
            const stock = stockOnHandByProductMonth.get(key) || 0;
            if (units !== 0 && Number.isFinite(revenue)) {
              lastPriceByProduct.set(product, revenue / units);
            }
            const price = lastPriceByProduct.get(product);
            if (Number.isFinite(price)) {
              priceSeriesByProduct.get(product).push({ date: month, value: price });
              if (Number.isFinite(stock)) {
                total += price * stock;
              }
            }
          });
          inventoryValue.push({ date: month, account: 'Inventory Value', value: total });
        });

        const accountsWithInventory = accountsWithBalance.concat(inventoryValue);

        const debtAccounts = new Set([
          'Credit Cards',
          'Line of Credit',
          'Shopify Loan',
          'PayPal Loan',
          'AMEX Loan',
          'Family Loan',
        ]);
        const accountsFlipped = accountsWithInventory.map((entry) => {
          if (debtAccounts.has(entry.account)) {
            return { ...entry, value: -entry.value };
          }
          return entry;
        });

        const accountsByMonth = new Map();
        accountsFlipped.forEach((entry) => {
          const month = d3.timeMonth.floor(entry.date);
          const key = formatMonthKey(month);
          const bucket = accountsByMonth.get(key) || {};
          bucket[entry.account] = entry.value;
          accountsByMonth.set(key, bucket);
        });

        const totalCash = months.map((month) => {
          const key = formatMonthKey(month);
          const bucket = accountsByMonth.get(key) || {};
          const total = Object.entries(bucket)
            .reduce((sum, [account, value]) => {
              if (account === 'Inventory Value') return sum;
              return sum + (Number.isFinite(value) ? value : 0);
            }, 0);
          return {
            date: month,
            account: 'Total Cash',
            value: total,
          };
        });

        const totalEquity = months.map((month) => {
          const key = formatMonthKey(month);
          const bucket = accountsByMonth.get(key) || {};
          const total = Object.values(bucket)
            .reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);
          return {
            date: month,
            account: 'Total Equity',
            value: total,
          };
        });

        const accounts = accountsFlipped.concat(totalCash, totalEquity);

        const filteredStockOnHand = stockOnHand.filter((entry) => !entry.skip);
        const totalStockSeries = buildTotalSeries(filteredStockOnHand);
        const stockOnHandSeries = filteredStockOnHand.concat(totalStockSeries);

        const accountsList = Array.from(
          new Set(accounts.map((d) => d.account)),
        );

        const productGroups = new Map();
        products.forEach((product) => {
          const group = getManufacturingTrack(product);
          if (!productGroups.has(group)) productGroups.set(group, []);
          productGroups.get(group).push(product);
        });

        const defaultStart = parseDate('2016-07-01');
        const initialStart = defaultStart
          ? (defaultStart < minDate ? minDate : defaultStart)
          : minDate;
        const rangeStart = initialStart > maxDate ? minDate : initialStart;
        const state = {
          products,
          accounts: accountsList,
          visibleProducts: new Set(products),
          visibleAccounts: new Set(accountsList),
          range: [rangeStart, maxDate],
        };

        const basePalette = productColors;
        const totalColor = totalSeriesColor;
        const baseProductNames = Array.from(
          new Set(products.map((name) => getBaseProductName(name))),
        );
        const baseColorScale = d3.scaleOrdinal(baseProductNames, basePalette);
        const productColorScale = (name) => {
          if (name === totalSeriesKey) return totalColor;
          const baseName = getBaseProductName(name);
          const versionInfo = parseProductVersion(name);
          let baseColor = baseColorScale(baseName);
          if (versionInfo) {
            const index = Number.isFinite(versionInfo.minor) ? versionInfo.minor % 2 : 0;
            if (versionInfo.line === 'Genesis') {
              const blue = '#1d4ed8';
              if (isXLProduct(name)) {
                const green = '#15803d';
                baseColor = index === 0 ? green : desaturateColor(green, 0.5);
              } else {
                baseColor = index === 0 ? blue : desaturateColor(blue, 0.5);
              }
            } else if (versionInfo.line === 'Express') {
              const orange = '#f97316';
              const red = '#dc2626';
              if (isXLProduct(name)) {
                baseColor = index === 0 ? red : desaturateColor(red, 0.5);
              } else {
                baseColor = index === 0 ? orange : desaturateColor(orange, 0.5);
              }
            }
          }
          return baseColor;
        };
        const accountColorScale = (name) => {
          if (name === 'Cash') return '#16a34a';
          if (name === 'Credit Cards') return '#dc2626';
          if (name === 'LDO Balance') return '#2563eb';
          if (name === 'Total Cash') return '#166534';
          if (name === 'Total Equity') return '#111827';
          if (name === 'Inventory Value') return desaturateColor('#f97316', 0.5);
          if (name === 'Line of Credit') return '#f97316';
          if (name === 'Family Loan') return '#e855b0';
          const index = accountsList.indexOf(name);
          return index >= 0 ? accountColors[index % accountColors.length] : accountColors[0];
        };
        const eventTypeScale = d3.scaleOrdinal(
          Array.from(new Set(manufacturingEvents.map((d) => d.type))),
          eventColors,
        );

        const sortedSalesUnits = salesUnits.slice().sort((a, b) => a.date - b.date);
        const sortedSalesRevenue = salesRevenue.slice().sort((a, b) => a.date - b.date);
        const sortedStockOnHand = stockOnHandSeries.slice().sort((a, b) => a.date - b.date);
        const sortedAccounts = accounts.slice().sort((a, b) => a.date - b.date);

        const bisectDate = d3.bisector((d) => d.date).left;

        function setActiveTimeframe(button) {
          timeframeButtons.forEach((btn) => btn.classList.remove('is-active'));
          if (button) {
            button.classList.add('is-active');
          }
        }

        function updateDateInputs() {
          const [start, end] = state.range;
          if (startInput && endInput) {
            startInput.value = d3.timeFormat('%Y-%m')(start);
            endInput.value = d3.timeFormat('%Y-%m')(end);
          }
        }

        const productInputMap = new Map();
        const productGroupMap = new Map(
          productFilterLists.map((el) => [el.dataset.productFilters || '', el]),
        );
        const productToggleMap = new Map(
          productGroupToggles.map((el) => [el.dataset.productGroupToggle || '', el]),
        );

        function updateProductGroupToggles() {
          productToggleMap.forEach((toggle, group) => {
            const items = productGroups.get(group) || [];
            if (!items.length) {
              toggle.checked = false;
              toggle.indeterminate = false;
              toggle.disabled = true;
              return;
            }
            toggle.disabled = false;
            const selectedCount = items.filter((item) => state.visibleProducts.has(item)).length;
            toggle.checked = selectedCount === items.length;
            toggle.indeterminate = selectedCount > 0 && selectedCount < items.length;
          });
        }

        function renderFilters(listEl, items, colorScale, type, labelFormatter, options = {}) {
          if (!listEl) return;
          if (options.clear !== false) {
            listEl.innerHTML = '';
          }
          items.forEach((item) => {
            const wrapper = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = true;
            checkbox.value = item;
            checkbox.dataset.filterType = type;
            checkbox.dataset.filterValue = item;

            const swatch = document.createElement('span');
            swatch.className = 'timeline-swatch';
            swatch.style.background = colorScale(item);

            const text = document.createElement('span');
            text.textContent = labelFormatter ? labelFormatter(item) : item;

            wrapper.appendChild(checkbox);
            wrapper.appendChild(swatch);
            wrapper.appendChild(text);
            listEl.appendChild(wrapper);

            if (type === 'product') {
              productInputMap.set(item, checkbox);
            }
          });
        }

        function renderProductFilters() {
          productInputMap.clear();
          productGroupMap.forEach((listEl, group) => {
            const items = (productGroups.get(group) || []).slice().sort((a, b) => a.localeCompare(b));
            renderFilters(listEl, items, productColorScale, 'product', getVersionLabel);
          });
          updateProductGroupToggles();
        }

        const loanAccountNames = new Set([
          'Shopify Loan',
          'PayPal Loan',
          'AMEX Loan',
          'Family Loan',
        ]);
        let loanToggle = null;
        let loanAccounts = [];

        function updateLoanToggle() {
          if (!loanToggle) return;
          if (!loanAccounts.length) {
            loanToggle.checked = false;
            loanToggle.indeterminate = false;
            loanToggle.disabled = true;
            return;
          }
          loanToggle.disabled = false;
          const selectedCount = loanAccounts.filter((account) => state.visibleAccounts.has(account)).length;
          loanToggle.checked = selectedCount === loanAccounts.length;
          loanToggle.indeterminate = selectedCount > 0 && selectedCount < loanAccounts.length;
        }

        function renderAccountFilters() {
          if (!accountFilters) return;
          accountFilters.innerHTML = '';
          loanAccounts = accountsList.filter((account) => loanAccountNames.has(account));
          let loanWrapper = null;
          if (loanAccounts.length) {
            const wrapper = document.createElement('label');
            wrapper.className = 'timeline-filter-toggle';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = true;
            checkbox.dataset.accountGroupToggle = 'Loans';

            const swatch = document.createElement('span');
            swatch.className = 'timeline-swatch';
            swatch.style.background = accountColorScale('PayPal Loan');

            const text = document.createElement('span');
            text.textContent = 'Loans';

            wrapper.appendChild(checkbox);
            wrapper.appendChild(swatch);
            wrapper.appendChild(text);
            loanWrapper = wrapper;
            loanToggle = checkbox;
          } else {
            loanToggle = null;
          }

          const accountRankForDisplay = (label) => {
            if (label === 'Cash') return 0;
            if (label === 'Line of Credit') return 1;
            if (label === 'Credit Cards') return 2;
            if (label === 'LDO Balance') return 3;
            if (label === 'Total Cash') return 4;
            if (label === 'Inventory Value') return 5;
            if (label === 'Total Equity') return 6;
            return 7;
          };
          const otherAccounts = accountsList
            .filter((account) => !loanAccountNames.has(account))
            .filter((account) => !(
              account === 'Line of Credit'
              && accountsList.includes('Credit Cards')
            ))
            .slice()
            .sort((a, b) => {
              const rankDiff = accountRankForDisplay(a) - accountRankForDisplay(b);
              return rankDiff !== 0 ? rankDiff : a.localeCompare(b);
            });
          renderFilters(
            accountFilters,
            otherAccounts,
            accountColorScale,
            'account',
            formatAccountLabel,
            { clear: false },
          );
          if (loanWrapper) {
            const filterRows = Array.from(accountFilters.querySelectorAll('label'));
            const creditRow = filterRows.find((row) => {
              const input = row.querySelector('input');
              return input && input.dataset.filterValue === 'Credit Cards';
            });
            if (creditRow) {
              accountFilters.insertBefore(loanWrapper, creditRow.nextSibling);
            } else {
              accountFilters.appendChild(loanWrapper);
            }
          }
          updateLoanToggle();
        }

        function setVisibility(type, value, isVisible) {
          const targetSet = type === 'product' ? state.visibleProducts : state.visibleAccounts;
          if (type === 'account' && value === 'Credit Cards' && state.accounts.includes('Line of Credit')) {
            if (isVisible) {
              targetSet.add('Credit Cards');
              targetSet.add('Line of Credit');
            } else {
              targetSet.delete('Credit Cards');
              targetSet.delete('Line of Credit');
            }
          } else if (isVisible) {
            targetSet.add(value);
          } else {
            targetSet.delete(value);
          }
          if (type === 'product') {
            updateProductGroupToggles();
          }
          if (type === 'account') {
            updateLoanToggle();
          }
          render();
        }

        function assignEventRows(eventList) {
          const sorted = eventList.slice().sort((a, b) => a.start - b.start);
          const rows = [];
          sorted.forEach((event) => {
            let placed = false;
            for (let i = 0; i < rows.length; i += 1) {
              if (event.start >= rows[i].lastEnd) {
                rows[i].events.push({ ...event, row: i });
                rows[i].lastEnd = event.end;
                placed = true;
                break;
              }
            }
            if (!placed) {
              rows.push({ lastEnd: event.end, events: [{ ...event, row: rows.length }] });
            }
          });
          return rows.flatMap((row) => row.events);
        }

        function getLatestDatum(series, date) {
          if (!series.length) return null;
          const index = bisectDate(series, date, 1);
          return series[index - 1] || null;
        }

        function buildTooltipContent(date, chartSeries, activeEvents, options = {}) {
          const {
            showProductTable = true,
            showAccountsTable = true,
          } = options;
          const sections = [];
          const unitsChart = chartSeries.find((chart) => chart.label === 'Sales (Units)');
          const revenueChart = chartSeries.find((chart) => chart.label === 'Sales (Revenue)');
          const stockChart = chartSeries.find((chart) => chart.label === 'Inventory (On Hand)');
          const withinBounds = (name, bounds) => {
            const range = bounds.get(name);
            if (!range) return false;
            return date >= range.min && date <= range.max;
          };

          const tableProducts = new Set();
          [unitsChart, revenueChart, stockChart].forEach((chart) => {
            if (!chart) return;
            chart.series.forEach((_, name) => tableProducts.add(name));
          });

          const tableRows = [];
          tableProducts.forEach((name) => {
            if (name === totalSeriesKey) return;
            const unitsPoint = unitsChart && withinBounds(name, salesUnitsBounds)
              ? getLatestDatum(unitsChart.series.get(name) || [], date)
              : null;
            const revenuePoint = revenueChart && withinBounds(name, salesRevenueBounds)
              ? getLatestDatum(revenueChart.series.get(name) || [], date)
              : null;
            const stockPoint = stockChart ? getLatestDatum(stockChart.series.get(name) || [], date) : null;
            const pricePoint = priceSeriesByProduct.has(name)
              ? getLatestDatum(priceSeriesByProduct.get(name), date)
              : null;

            const unitsValue = unitsPoint && Number.isFinite(unitsPoint.value) && unitsPoint.value !== 0
              ? formatNumber(unitsPoint.value)
              : '';
            const revenueValue = revenuePoint && Number.isFinite(revenuePoint.value) && revenuePoint.value !== 0
              ? formatCurrency(revenuePoint.value)
              : '';
            const stockValue = stockPoint && Number.isFinite(stockPoint.value) && stockPoint.value !== 0
              ? formatNumber(stockPoint.value)
              : '';
            const stockValueRaw = stockPoint
              && Number.isFinite(stockPoint.value)
              && stockPoint.value !== 0
              && pricePoint
              && Number.isFinite(pricePoint.value)
              ? pricePoint.value * stockPoint.value
              : null;
            const stockValueAmount = Number.isFinite(stockValueRaw) && stockValueRaw !== 0
              ? formatCurrency(stockValueRaw)
              : '';

            if (!unitsValue && !revenueValue && !stockValue && !stockValueAmount) return;
            tableRows.push({
              name,
              unitsValue,
              revenueValue,
              stockValue,
              stockValueAmount,
              stockValueRaw,
            });
          });

          tableRows.sort((a, b) => a.name.localeCompare(b.name));

          const totalUnitsPoint = unitsChart
            ? getLatestDatum(unitsChart.series.get(totalSeriesKey) || [], date)
            : null;
          const totalRevenuePoint = revenueChart
            ? getLatestDatum(revenueChart.series.get(totalSeriesKey) || [], date)
            : null;
          const totalInventoryUnitsPoint = stockChart
            ? getLatestDatum(stockChart.series.get(totalSeriesKey) || [], date)
            : null;
          const totalInventoryValueRaw = tableRows.reduce(
            (sum, row) => sum + (Number.isFinite(row.stockValueRaw) ? row.stockValueRaw : 0),
            0,
          );
          const totalRow = {
            label: 'Total',
            unitsValue: totalUnitsPoint && Number.isFinite(totalUnitsPoint.value) && totalUnitsPoint.value !== 0
              ? formatNumber(totalUnitsPoint.value)
              : '',
            revenueValue: totalRevenuePoint && Number.isFinite(totalRevenuePoint.value) && totalRevenuePoint.value !== 0
              ? formatCurrency(totalRevenuePoint.value)
              : '',
            inventoryUnitsValue: totalInventoryUnitsPoint
              && Number.isFinite(totalInventoryUnitsPoint.value)
              && totalInventoryUnitsPoint.value !== 0
              ? formatNumber(totalInventoryUnitsPoint.value)
              : '',
            inventoryValueAmount: Number.isFinite(totalInventoryValueRaw) && totalInventoryValueRaw !== 0
              ? formatCurrency(totalInventoryValueRaw)
              : '',
          };

          chartSeries.forEach((chart) => {
            if (
              chart.label === 'Sales (Units)'
              || chart.label === 'Sales (Revenue)'
              || chart.label === 'Inventory (On Hand)'
            ) {
              return;
            }
            if (chart.label === 'Accounts' && !showAccountsTable) return;
            const values = Array.from(chart.series.entries())
              .map(([name, series]) => {
                const point = getLatestDatum(series, date);
                if (!point || !Number.isFinite(point.value) || point.value === 0) return null;
                if (chart.label === 'Accounts' && Math.abs(point.value) < 1) return null;
                return {
                  label: name,
                  value: chart.format(point.value),
                };
              })
              .filter(Boolean);

            if (!values.length) return;
            if (chart.label === 'Accounts') {
              const loanNames = new Set([
                'Shopify Loan',
                'PayPal Loan',
                'AMEX Loan',
                'Family Loan',
              ]);
              const accountRank = (label) => {
                if (label === 'Cash') return 0;
                if (label === 'Line of Credit') return 1;
                if (label === 'Credit Cards') return 2;
                if (loanNames.has(label)) return 3;
                if (label === 'LDO Balance') return 4;
                if (label === 'Total Cash') return 5;
                if (label === 'Inventory Value') return 6;
                if (label === 'Total Equity') return 7;
                return 8;
              };
              values.sort((a, b) => {
                const rankDiff = accountRank(a.label) - accountRank(b.label);
                return rankDiff !== 0 ? rankDiff : a.label.localeCompare(b.label);
              });
            }
            sections.push({ title: chart.label, values });
          });

          const tableHtml = showProductTable && tableRows.length
            ? `
              <table class="timeline-tooltip-table">
                <thead>
                  <tr>
                    <th><i></i></th>
                    <th colspan="2" class="timeline-tooltip-group">Sales</th>
                    <th colspan="2" class="timeline-tooltip-group">Inventory</th>
                  </tr>
                  <tr>
                    <th>FarmBot</th>
                    <th class="right">Units</th>
                    <th class="right">Revenue</th>
                    <th class="right">Units</th>
                    <th class="right">Value</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows
                    .map((row) => {
                      const swatchStyle = `background:${productColorScale(row.name)};`;
                      return `
                        <tr>
                          <td><span class="timeline-tooltip-swatch" style="${swatchStyle}">${row.name}</span></td>
                          <td>${row.unitsValue || '—'}</td>
                          <td>${row.revenueValue || '—'}</td>
                          <td>${row.stockValue || '—'}</td>
                          <td>${row.stockValueAmount || '—'}</td>
                        </tr>
                      `;
                    })
                    .join('')}
                </tbody>
                <tfoot>
                  <tr>
                    <th><span class="timeline-tooltip-swatch" style="background:${productColorScale(totalSeriesKey)};">Total</span></th>
                    <td>${totalRow.unitsValue || '—'}</td>
                    <td>${totalRow.revenueValue || '—'}</td>
                    <td>${totalRow.inventoryUnitsValue || '—'}</td>
                    <td>${totalRow.inventoryValueAmount || '—'}</td>
                  </tr>
                </tfoot>
              </table>
            `
            : showProductTable
              ? '<p class="timeline-empty">No sales or inventory data</p>'
              : '';

          const sectionHtml = sections
            .map((section) => {
              if (section.title === 'Accounts') {
                const totalEntry = section.values.find((entry) => entry.label === 'Total Equity');
                const bodyRows = section.values.filter((entry) => entry.label !== 'Total Equity');
                const rows = bodyRows
                  .map((entry) => {
                    const swatchStyle = `background:${accountColorScale(entry.label)};`;
                    return `
                      <tr>
                        <td><span class="timeline-tooltip-swatch" style="${swatchStyle}">${entry.label}</span></td>
                        <td class="timeline-tooltip-number">${entry.value}</td>
                      </tr>
                    `;
                  })
                  .join('');
                const totalRow = totalEntry
                  ? `
                    <tfoot>
                      <tr>
                        <th><span class="timeline-tooltip-swatch" style="background:${accountColorScale(totalEntry.label)};">${totalEntry.label}</span></th>
                        <th class="timeline-tooltip-number">${totalEntry.value}</th>
                      </tr>
                    </tfoot>
                  `
                  : '';
                return `
                  <table class="timeline-tooltip-table timeline-tooltip-accounts">
                    <thead>
                      <tr>
                        <th>Account</th>
                        <th class="right">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${rows}
                    </tbody>
                    ${totalRow}
                  </table>
                `;
              }
              const items = section.values
                .map((entry) => `<li>${entry.label}: <strong>${entry.value}</strong></li>`)
                .join('');
              return `<h4>${section.title}</h4><ul>${items}</ul>`;
            })
            .join('');

          return `
            <h4>${formatDate(date)}</h4>
            ${tableHtml}
            ${sectionHtml}
          `;
        }

        function positionTooltip(event) {
          if (!tooltip) return;
          const bounds = chartWrap.getBoundingClientRect();
          const tooltipBounds = tooltip.getBoundingClientRect();
          const padding = 12;
          let x = event.clientX - bounds.left + padding;
          let y = event.clientY - bounds.top - tooltipBounds.height - padding;

          if (x + tooltipBounds.width > bounds.width) {
            x = bounds.width - tooltipBounds.width - padding;
          }
          if (y < padding) {
            y = padding;
          }
          tooltip.style.transform = `translate(${Math.max(x, padding)}px, ${Math.max(y, padding)}px)`;
        }

        function render() {
          if (!chartWrap) return;

          const isSalesVisible = (product) =>
            product === totalSeriesKey || state.visibleProducts.has(product);
          const withinSalesBounds = (entry, bounds) => {
            if (entry.product === totalSeriesKey) return true;
            const range = bounds.get(entry.product);
            if (!range) return false;
            return entry.date >= range.min && entry.date <= range.max;
          };
          const filteredSalesUnits = sortedSalesUnits.filter(
            (d) => isSalesVisible(d.product)
              && withinSalesBounds(d, salesUnitsBounds)
              && d.date >= state.range[0]
              && d.date <= state.range[1],
          );
          const filteredSalesRevenue = sortedSalesRevenue.filter(
            (d) => isSalesVisible(d.product)
              && withinSalesBounds(d, salesRevenueBounds)
              && d.date >= state.range[0]
              && d.date <= state.range[1],
          );
          const isStockVisible = (product) =>
            product === totalSeriesKey || state.visibleProducts.has(product);
          const filteredStockOnHand = sortedStockOnHand.filter(
            (d) => isStockVisible(d.product) && d.date >= state.range[0] && d.date <= state.range[1],
          );
          const filteredAccounts = sortedAccounts.filter(
            (d) => state.visibleAccounts.has(d.account) && d.date >= state.range[0] && d.date <= state.range[1],
          );

          const filteredEvents = manufacturingEvents.filter((event) => {
            if (!event.start || !event.end) return false;
            const withinRange = event.end >= state.range[0] && event.start <= state.range[1];
            if (!withinRange) return false;
            if (!event.product) return true;
            return state.visibleProducts.has(event.product);
          });

          const eventRowHeight = 22;
          const trackGap = 4;
          const trackLabels = ['Genesis', 'Genesis XL', 'Express', 'Express XL'];
          const trackLayouts = [];
          const eventRows = [];
          let trackOffset = 0;

          trackLabels.forEach((track, index) => {
            const trackEvents = filteredEvents.filter(
              (event) => getManufacturingTrack(event.product) === track,
            );
            const laidOut = assignEventRows(trackEvents);
            const rowCount = Math.max(1, d3.max(laidOut.map((d) => d.row)) + 1 || 1);
            const trackHeight = rowCount * eventRowHeight;

            trackLayouts.push({
              track,
              index,
              y: trackOffset,
              height: trackHeight,
            });

            laidOut.forEach((event) => {
              eventRows.push({
                ...event,
                y: trackOffset + event.row * eventRowHeight,
              });
            });

            trackOffset += trackHeight + trackGap;
          });

          const totalTrackHeight = trackLayouts.length
            ? Math.max(eventRowHeight, trackOffset - trackGap)
            : eventRowHeight;
          const eventsAxisOffset = totalTrackHeight + 8;
          const eventsAxisHeight = 24;
          const eventsHeight = totalTrackHeight + eventsAxisHeight + 8;
          const chartHeight = 250;
          const gap = 24;
          const margin = { top: 20, right: 28, bottom: 48, left: 58 };

          const width = chartWrap.clientWidth;
          const innerWidth = Math.max(240, width - margin.left - margin.right);
          const totalHeight =
            margin.top +
            eventsHeight +
            chartHeight * 4 +
            gap * 3 +
            margin.bottom;
          const timelineBottom = totalHeight - margin.top;

          const svg = d3
            .select(chartWrap)
            .selectAll('svg')
            .data([null])
            .join('svg')
            .attr('width', width)
            .attr('height', totalHeight);

          svg.selectAll('*').remove();

          const root = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

          const x = d3
            .scaleTime()
            .domain(state.range)
            .range([0, innerWidth]);

          const xAxis = d3.axisBottom(x).ticks(innerWidth < 520 ? 4 : 8).tickFormat(formatMonth);

          const focusLines = [];
          const chartSeriesForTooltip = [];

          function drawEvents(group) {
            const axisGroup = group.append('g').attr('class', 'y-axis');
            axisGroup.append('line')
              .attr('x1', 0)
              .attr('x2', 0)
              .attr('y1', 0)
              .attr('y2', totalTrackHeight)
              .attr('stroke', '#e5e7eb');
            axisGroup
              .selectAll('text.track-label')
              .data(trackLayouts)
              .join('text')
              .attr('class', 'track-label')
              .attr('x', -8)
              .attr('y', (d) => d.y + d.height / 2 + 4)
              .attr('fill', '#6b7280')
              .attr('font-size', '11px')
              .attr('text-anchor', 'end')
              .text((d) => d.track);

            group.append('g')
              .attr('class', 'x-axis')
              .attr('transform', `translate(0,${eventsAxisOffset})`)
              .call(xAxis);

            if (!eventRows.length) {
              group.append('text')
                .attr('x', 0)
                .attr('y', totalTrackHeight / 2)
                .attr('fill', '#9aa0a6')
                .attr('font-size', '12px')
                .text('No manufacturing runs in range');
              return;
            }

            const cornerSize = 4;

            group
              .selectAll('rect')
              .data(eventRows)
              .join('rect')
              .attr('x', (d) => x(d.start))
              .attr('y', (d) => d.y)
              .attr('width', (d) => Math.max(2, x(d.end) - x(d.start)))
              .attr('height', eventRowHeight - 6)
              .attr('rx', 4)
              .attr('ry', 4)
              .attr('fill', (d) => (d.product ? productColorScale(d.product) : eventTypeScale(d.type)));

            group
              .selectAll('rect.event-corner-fill')
              .data(eventRows)
              .join('rect')
              .attr('class', 'event-corner-fill')
              .attr('x', (d) => {
                const barWidth = Math.max(2, x(d.end) - x(d.start));
                return x(d.start) + Math.max(0, barWidth - cornerSize);
              })
              .attr('y', (d) => d.y)
              .attr('width', (d) => {
                const barWidth = Math.max(2, x(d.end) - x(d.start));
                return barWidth >= cornerSize ? cornerSize : 0;
              })
              .attr('height', eventRowHeight - 6)
              .attr('fill', (d) => (d.product ? productColorScale(d.product) : eventTypeScale(d.type)));

            group
              .selectAll('text.event-label')
              .data(eventRows)
              .join('text')
              .attr('class', 'event-label')
              .attr('x', (d) => x(d.start) + (Math.max(2, x(d.end) - x(d.start)) / 2))
              .attr('y', (d) => d.y + (eventRowHeight - 6) / 2)
              .attr('fill', '#ffffff')
              .attr('font-size', '11px')
              .attr('text-anchor', 'middle')
              .attr('dominant-baseline', 'middle')
              .text((d) => (d.product ? getVersionLabel(d.product) : d.label));
          }

          function drawLineChart(options) {
            const {
              title,
              data,
              key,
              colors,
              yLabel,
              format,
              group,
            } = options;

            const dataBySeries = d3.group(data, (d) => d[key]);
            const values = data.map((d) => d.value);

            const yDomain = values.length
              ? d3.extent(values)
              : [0, 1];

            if (yDomain[0] === yDomain[1]) {
              yDomain[0] -= 1;
              yDomain[1] += 1;
            }

            const y = d3.scaleLinear()
              .domain(yDomain)
              .range([chartHeight, 0])
              .nice();

            group.append('text')
              .attr('x', 0)
              .attr('y', -6)
              .attr('fill', '#5f6368')
              .attr('font-size', '12px')
              .text(title);

            group.append('g')
              .attr('class', 'y-axis')
              .call(d3.axisLeft(y).ticks(4).tickFormat(format));

            group.append('g')
              .attr('class', 'x-axis')
              .attr('transform', `translate(0,${chartHeight})`)
              .call(xAxis);

            group.append('text')
              .attr('x', -chartHeight / 2)
              .attr('y', -44)
              .attr('transform', 'rotate(-90)')
              .attr('fill', '#9aa0a6')
              .attr('font-size', '11px')
              .text(yLabel);

            if (!data.length) {
              group.append('text')
                .attr('x', 0)
                .attr('y', chartHeight / 2)
                .attr('fill', '#9aa0a6')
                .attr('font-size', '12px')
                .text('No data in range');
              return { y, series: dataBySeries };
            }

            const line = d3.line()
              .curve(d3.curveStepAfter)
              .x((d) => x(d.date))
              .y((d) => y(d.value));

            group
              .selectAll('path.series-line')
              .data(Array.from(dataBySeries.entries()))
              .join('path')
              .attr('class', 'series-line')
              .attr('fill', 'none')
              .attr('stroke', ([name]) => colors(name))
              .attr('stroke-width', ([name]) => (name === totalSeriesKey ? 3 : 2))
              .attr('d', ([, series]) => line(series));

            return { y, series: dataBySeries };
          }

          function drawStackedBarChart(options) {
            const {
              title,
              data,
              key,
              colors,
              yLabel,
              format,
              group,
              includeTotalLine,
              lineKeys = [],
            } = options;

            const dataBySeries = d3.group(data, (d) => d[key]);
            const lineKeySet = new Set(
              Array.isArray(lineKeys) ? lineKeys.filter(Boolean) : [lineKeys].filter(Boolean),
            );
            const seriesKeys = Array.from(dataBySeries.keys())
              .filter((name) => name !== totalSeriesKey && !lineKeySet.has(name));

            const monthMap = new Map();
            data.forEach((entry) => {
              if (!entry.date || !Number.isFinite(entry.value)) return;
              if (entry[key] === totalSeriesKey) return;
              const month = d3.timeMonth.floor(entry.date);
              const monthKey = formatMonthKey(month);
              const row = monthMap.get(monthKey) || { date: month };
              row[entry[key]] = (row[entry[key]] || 0) + entry.value;
              monthMap.set(monthKey, row);
            });

            const stackedRows = Array.from(monthMap.values()).sort((a, b) => a.date - b.date);
            stackedRows.forEach((row) => {
              seriesKeys.forEach((name) => {
                if (!Number.isFinite(row[name])) row[name] = 0;
              });
            });

            const stack = d3.stack()
              .keys(seriesKeys)
              .offset(d3.stackOffsetDiverging);
            const stackedSeries = stack(stackedRows);
            const minStackValue = d3.min(stackedSeries, (series) =>
              d3.min(series, (d) => d[0]),
            );
            const maxStackValue = d3.max(stackedSeries, (series) =>
              d3.max(series, (d) => d[1]),
            );
            const explicitLineSeries = includeTotalLine
              ? Array.from(lineKeySet)
                .filter((lineKey) => dataBySeries.has(lineKey))
                .map((lineKey) => ({ key: lineKey, series: dataBySeries.get(lineKey) }))
              : [];
            const lineValues = explicitLineSeries.flatMap((entry) => entry.series.map((point) => point.value));
            const lineMin = lineValues.length ? d3.min(lineValues) : null;
            const lineMax = lineValues.length ? d3.max(lineValues) : null;
            const yDomainMin = Math.min(
              0,
              Number.isFinite(minStackValue) ? minStackValue : 0,
              Number.isFinite(lineMin) ? lineMin : 0,
            );
            const yDomainMax = Math.max(
              0,
              Number.isFinite(maxStackValue) ? maxStackValue : 0,
              Number.isFinite(lineMax) ? lineMax : 0,
            );

            const y = d3.scaleLinear()
              .domain([yDomainMin, yDomainMax])
              .range([chartHeight, 0])
              .nice();

            if (title) {
              group.append('text')
                .attr('x', 0)
                .attr('y', -6)
                .attr('fill', '#5f6368')
                .attr('font-size', '12px')
                .text(title);
            }

            group.append('g')
              .attr('class', 'y-axis')
              .call(d3.axisLeft(y).ticks(4).tickFormat(format));

            group.append('g')
              .attr('class', 'x-axis')
              .attr('transform', `translate(0,${chartHeight})`)
              .call(xAxis);

            group.append('text')
              .attr('x', -chartHeight / 2)
              .attr('y', -44)
              .attr('transform', 'rotate(-90)')
              .attr('fill', '#9aa0a6')
              .attr('font-size', '11px')
              .text(yLabel);

            const drawZeroBaseline = () => {
              group.append('line')
                .attr('class', 'zero-baseline')
                .attr('x1', 0)
                .attr('x2', innerWidth)
                .attr('y1', y(0))
                .attr('y2', y(0))
                .attr('stroke', '#9aa0a6')
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', '4 4')
                .attr('opacity', 0.7);
            };

            if (!stackedRows.length) {
              drawZeroBaseline();
              group.append('text')
                .attr('x', 0)
                .attr('y', chartHeight / 2)
                .attr('fill', '#9aa0a6')
                .attr('font-size', '12px')
                .text('No data in range');
              return { y, series: dataBySeries };
            }

            const barWidth = (date) => {
              const next = d3.timeMonth.offset(date, 1);
              return Math.max(1, x(next) - x(date));
            };

            const stacks = group
              .selectAll('g.stack')
              .data(stackedSeries, (d) => d.key)
              .join('g')
              .attr('class', 'stack')
              .attr('fill', (d) => colors(d.key));

            stacks
              .selectAll('rect')
              .data((d) => d)
              .join('rect')
              .attr('x', (d) => x(d.data.date))
              .attr('y', (d) => y(Math.max(d[0], d[1])))
              .attr('width', (d) => barWidth(d.data.date))
              .attr('height', (d) => Math.abs(y(d[0]) - y(d[1])));

            if (includeTotalLine) {
              const overlayLine = d3.line()
                .curve(d3.curveStepAfter)
                .x((d) => x(d.date))
                .y((d) => y(d.value));
              if (explicitLineSeries.length) {
                group
                  .selectAll('path.series-line')
                  .data(explicitLineSeries, (d) => d.key)
                  .join('path')
                  .attr('class', 'series-line')
                  .attr('fill', 'none')
                  .attr('stroke', (d) => colors(d.key))
                  .attr('stroke-width', 1.5)
                  .attr('d', (d) => overlayLine(d.series));
              }
            }

            drawZeroBaseline();

            return { y, series: dataBySeries };
          }

          const eventsGroup = root.append('g');
          drawEvents(eventsGroup);
          const eventsFocus = eventsGroup.append('line')
            .attr('y1', 0)
            .attr('y2', eventsHeight)
            .attr('stroke', '#9aa0a6')
            .attr('stroke-dasharray', '4 4')
            .attr('opacity', 0);
          focusLines.push(eventsFocus);
          const eventsOverlay = eventsGroup.append('rect')
            .attr('width', innerWidth)
            .attr('height', eventsHeight)
            .attr('fill', 'transparent')
            .style('cursor', 'crosshair');

          const salesUnitsGroup = root.append('g').attr('transform', `translate(0, ${eventsHeight + gap})`);
          const salesRevenueGroup = root.append('g').attr('transform', `translate(0, ${eventsHeight + gap + chartHeight + gap})`);
          const stockReceivedGroup = root.append('g').attr('transform', `translate(0, ${eventsHeight + gap + chartHeight * 2 + gap * 2})`);
          const accountsGroup = root.append('g').attr('transform', `translate(0, ${eventsHeight + gap + chartHeight * 3 + gap * 3})`);

          const salesUnitsChart = drawStackedBarChart({
            title: '',
            data: filteredSalesUnits,
            key: 'product',
            colors: productColorScale,
            yLabel: 'Sales (Units)',
            format: formatNumber,
            group: salesUnitsGroup,
            includeTotalLine: true,
          });

          const salesRevenueChart = drawStackedBarChart({
            title: '',
            data: filteredSalesRevenue,
            key: 'product',
            colors: productColorScale,
            yLabel: 'Sales (Revenue)',
            format: formatCurrency,
            group: salesRevenueGroup,
            includeTotalLine: true,
          });

          const stockOnHandChart = drawStackedBarChart({
            title: '',
            data: filteredStockOnHand,
            key: 'product',
            colors: productColorScale,
            yLabel: 'Inventory',
            format: formatNumber,
            group: stockReceivedGroup,
            includeTotalLine: true,
          });

          const accountsChart = drawStackedBarChart({
            title: '',
            data: filteredAccounts,
            key: 'account',
            colors: accountColorScale,
            yLabel: 'Account Balances',
            format: formatCurrency,
            group: accountsGroup,
            includeTotalLine: true,
            lineKeys: ['Total Cash', 'Total Equity'],
          });

          root.append('g')
            .attr('class', 'event-completions')
            .attr('pointer-events', 'none')
            .selectAll('line')
            .data(
              eventRows.filter(
                (d) => d.end >= state.range[0] && d.end <= state.range[1],
              ),
            )
            .join('line')
            .attr('x1', (d) => Math.max(0, Math.min(x(d.end), innerWidth)))
            .attr('x2', (d) => Math.max(0, Math.min(x(d.end), innerWidth)))
            .attr('y1', (d) => d.y)
            .attr('y2', timelineBottom)
            .attr('stroke', (d) => (d.product ? productColorScale(d.product) : '#9aa0a6'))
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '4 4')
            .attr('opacity', 0.7);

          chartSeriesForTooltip.push({
            label: 'Sales (Units)',
            series: salesUnitsChart.series,
            format: formatNumber,
          });
          chartSeriesForTooltip.push({
            label: 'Sales (Revenue)',
            series: salesRevenueChart.series,
            format: formatCurrency,
          });
          chartSeriesForTooltip.push({
            label: 'Inventory (On Hand)',
            series: stockOnHandChart.series,
            format: formatNumber,
          });
          chartSeriesForTooltip.push({
            label: 'Accounts',
            series: accountsChart.series,
            format: formatCurrency,
          });

          [
            { group: salesUnitsGroup, showProductTable: true, showAccountsTable: false },
            { group: salesRevenueGroup, showProductTable: true, showAccountsTable: false },
            { group: stockReceivedGroup, showProductTable: true, showAccountsTable: false },
            { group: accountsGroup, showProductTable: false, showAccountsTable: true },
          ].forEach((config) => {
            const focus = config.group.append('line')
              .attr('y1', 0)
              .attr('y2', chartHeight)
              .attr('stroke', '#9aa0a6')
              .attr('stroke-dasharray', '4 4')
              .attr('opacity', 0);
            focusLines.push(focus);

            const overlay = config.group.append('rect')
              .attr('width', innerWidth)
              .attr('height', chartHeight + margin.bottom)
              .attr('fill', 'transparent')
              .style('cursor', 'crosshair');

            overlay
              .on('mouseenter', () => {
                focusLines.forEach((line) => line.attr('opacity', 1));
                if (tooltip) tooltip.classList.add('is-visible');
              })
              .on('mouseleave', () => {
                focusLines.forEach((line) => line.attr('opacity', 0));
                if (tooltip) tooltip.classList.remove('is-visible');
              })
              .on('mousemove', (event) => {
                const [mouseX] = d3.pointer(event, overlay.node());
                const hoveredDate = x.invert(mouseX);

                focusLines.forEach((line) => line.attr('x1', mouseX).attr('x2', mouseX));

                const activeEvents = filteredEvents.filter(
                  (ev) => hoveredDate >= ev.start && hoveredDate <= ev.end,
                );

                if (tooltip) {
                  tooltip.innerHTML = buildTooltipContent(
                    hoveredDate,
                    chartSeriesForTooltip,
                    activeEvents,
                    {
                      showProductTable: config.showProductTable,
                      showAccountsTable: config.showAccountsTable,
                    },
                  );
                  positionTooltip(event);
                }
              });
          });
          eventsOverlay
            .on('mouseenter', () => {
              focusLines.forEach((line) => line.attr('opacity', 1));
              if (tooltip) tooltip.classList.add('is-visible');
            })
            .on('mouseleave', () => {
              focusLines.forEach((line) => line.attr('opacity', 0));
              if (tooltip) tooltip.classList.remove('is-visible');
            })
            .on('mousemove', (event) => {
              const [mouseX] = d3.pointer(event, eventsOverlay.node());
              const hoveredDate = x.invert(mouseX);

              focusLines.forEach((line) => line.attr('x1', mouseX).attr('x2', mouseX));

              const activeEvents = filteredEvents.filter(
                (ev) => hoveredDate >= ev.start && hoveredDate <= ev.end,
              );

              if (tooltip) {
                tooltip.innerHTML = buildTooltipContent(
                  hoveredDate,
                  chartSeriesForTooltip,
                  activeEvents,
                  { showProductTable: false, showAccountsTable: false },
                );
                positionTooltip(event);
              }
            });

          const hasData = filteredSalesUnits.length
            || filteredSalesRevenue.length
            || filteredStockOnHand.length
            || filteredAccounts.length
            || filteredEvents.length;
          if (emptyState) {
            emptyState.textContent = hasData ? '' : 'No data available for the selected filters.';
          }
        }

        renderProductFilters();
        renderAccountFilters();
        updateDateInputs();

        container.addEventListener('change', (event) => {
          const target = event.target;
          if (!(target instanceof HTMLInputElement)) return;
          if (target.type !== 'checkbox') return;
          const groupToggle = target.dataset.productGroupToggle;
          if (groupToggle) {
            const items = productGroups.get(groupToggle) || [];
            items.forEach((item) => {
              if (target.checked) {
                state.visibleProducts.add(item);
              } else {
                state.visibleProducts.delete(item);
              }
              const input = productInputMap.get(item);
              if (input) input.checked = target.checked;
            });
            updateProductGroupToggles();
            render();
            return;
          }
          const accountGroupToggle = target.dataset.accountGroupToggle;
          if (accountGroupToggle === 'Loans') {
            loanAccounts.forEach((account) => {
              if (target.checked) {
                state.visibleAccounts.add(account);
              } else {
                state.visibleAccounts.delete(account);
              }
            });
            updateLoanToggle();
            render();
            return;
          }
          const filterType = target.dataset.filterType;
          const filterValue = target.dataset.filterValue;
          if (!filterType || !filterValue) return;
          setVisibility(filterType, filterValue, target.checked);
        });

        timeframeButtons.forEach((button) => {
          button.addEventListener('click', () => {
            const range = button.dataset.timeframe;
            if (!range) return;
            if (range === 'all') {
              const allStart = defaultStart
                ? (defaultStart < minDate ? minDate : defaultStart)
                : minDate;
              state.range = [allStart, maxDate];
            } else {
              const number = Number(range.replace('y', ''));
              const start = d3.timeYear.offset(maxDate, -number);
              state.range = [start, maxDate];
            }
            setActiveTimeframe(button);
            updateDateInputs();
            render();
          });
        });

        if (applyButton) {
          applyButton.addEventListener('click', () => {
            if (!startInput || !endInput) return;
            const startDate = parseMonth(startInput.value);
            const endDate = parseMonth(endInput.value);
            if (!startDate || !endDate || startDate > endDate) return;
            state.range = [startDate, endDate];
            setActiveTimeframe(null);
            render();
          });
        }

        render();

        if ('ResizeObserver' in window) {
          const observer = new ResizeObserver(() => render());
          observer.observe(chartWrap);
        }
      },
    );
  });
})();
