let territories = [
      { name: "United Kingdom", currency: "GBP", fx: 1.17, revenue: 428, costRatio: .70 },
      { name: "Germany", currency: "EUR", fx: 1, revenue: 392, costRatio: .72 },
      { name: "France", currency: "EUR", fx: 1, revenue: 341, costRatio: .73 },
      { name: "Italy", currency: "EUR", fx: 1, revenue: 274, costRatio: .74 },
      { name: "Spain", currency: "EUR", fx: 1, revenue: 236, costRatio: .72 },
      { name: "Netherlands", currency: "EUR", fx: 1, revenue: 188, costRatio: .69 },
      { name: "Switzerland", currency: "CHF", fx: 1.06, revenue: 176, costRatio: .68 },
      { name: "Belgium", currency: "EUR", fx: 1, revenue: 142, costRatio: .74 },
      { name: "Sweden", currency: "SEK", fx: .088, revenue: 128, costRatio: .71 },
      { name: "Poland", currency: "PLN", fx: .23, revenue: 121, costRatio: .76 },
      { name: "United Arab Emirates", currency: "AED", fx: .25, revenue: 116, costRatio: .67 },
      { name: "Austria", currency: "EUR", fx: 1, revenue: 107, costRatio: .73 },
      { name: "Ireland", currency: "EUR", fx: 1, revenue: 99, costRatio: .70 },
      { name: "Denmark", currency: "DKK", fx: .134, revenue: 91, costRatio: .71 },
      { name: "South Africa", currency: "ZAR", fx: .05, revenue: 86, costRatio: .78 },
      { name: "Turkey", currency: "TRY", fx: .027, revenue: 83, costRatio: .77 },
      { name: "Portugal", currency: "EUR", fx: 1, revenue: 78, costRatio: .75 },
      { name: "Czechia", currency: "CZK", fx: .04, revenue: 72, costRatio: .74 },
      { name: "Saudi Arabia", currency: "SAR", fx: .25, revenue: 69, costRatio: .68 },
      { name: "Norway", currency: "NOK", fx: .087, revenue: 64, costRatio: .72 },
      { name: "Romania", currency: "RON", fx: .20, revenue: 57, costRatio: .76 },
      { name: "Greece", currency: "EUR", fx: 1, revenue: 53, costRatio: .77 },
      { name: "Egypt", currency: "EGP", fx: .019, revenue: 49, costRatio: .79 },
      { name: "Hungary", currency: "HUF", fx: .0025, revenue: 44, costRatio: .75 },
      { name: "Israel", currency: "ILS", fx: .26, revenue: 41, costRatio: .71 },
      { name: "Morocco", currency: "MAD", fx: .092, revenue: 34, costRatio: .78 },
      { name: "Luxembourg", currency: "EUR", fx: 1, revenue: 31, costRatio: .66 },
      { name: "Qatar", currency: "QAR", fx: .25, revenue: 28, costRatio: .65 }
    ];

    // Convert the seeded EUR-equivalent revenues to local currency for the same FX model used by CSV imports.
    territories.forEach(territory => {
      if (territory.currency !== "EUR") territory.revenue /= territory.fx;
    });

    const presets = {
      base: { growth: 4, cost: 3, fx: -1, label: "Base plan" },
      upside: { growth: 10, cost: 2, fx: 1, label: "Growth case" },
      downside: { growth: -5, cost: 7, fx: -4, label: "Downside case" },
      fx: { growth: 4, cost: 3, fx: 0, label: "FX neutral" }
    };
    const selected = new Set(territories.map((_, index) => index));
    const controls = {
      growth: document.getElementById("growth-range"),
      cost: document.getElementById("cost-range"),
      fx: document.getElementById("fx-range")
    };
    const fmt = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 });
    const money = value => "€" + fmt.format(value) + "m";
    const signed = value => (value > 0 ? "+" : value < 0 ? "−" : "") + Math.abs(value).toFixed(1) + "%";

    function renderTerritories() {
      const query = document.getElementById("territory-search").value.trim().toLowerCase();
      const list = document.getElementById("territory-list");
      list.replaceChildren();
      territories.forEach((territory, index) => {
        if (!territory.name.toLowerCase().includes(query)) return;
        const label = document.createElement("label");
        label.className = "territory-option";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = selected.has(index);
        checkbox.setAttribute("aria-label", territory.name);
        checkbox.addEventListener("change", () => {
          checkbox.checked ? selected.add(index) : selected.delete(index);
          render();
        });
        const name = document.createElement("span");
        name.textContent = territory.name;
        label.append(checkbox, name);
        list.append(label);
      });
      document.getElementById("scope-count").textContent = selected.size + " / " + territories.length;
    }

    function currentAssumptions() {
      return {
        growth: Number(controls.growth.value) / 100,
        cost: Number(controls.cost.value) / 100,
        fx: Number(controls.fx.value) / 100
      };
    }

    function calculate() {
      const assumptions = currentAssumptions();
      const rows = [...selected].sort((a, b) => territories[a].name.localeCompare(territories[b].name)).map(index => {
        const territory = territories[index];
        const fxFactor = territory.fx * (territory.currency === "EUR" ? 1 : 1 + assumptions.fx);
        const revenue = territory.revenue * (1 + assumptions.growth) * fxFactor;
        const costs = territory.revenue * territory.costRatio * (1 + assumptions.cost) * fxFactor;
        return { ...territory, revenue, costs, ebitda: revenue - costs };
      });
      return { rows, totals: rows.reduce((sum, row) => ({
        revenue: sum.revenue + row.revenue,
        costs: sum.costs + row.costs,
        ebitda: sum.ebitda + row.ebitda
      }), { revenue: 0, costs: 0, ebitda: 0 }) };
    }

    function renderChart(rows) {
      const svg = document.getElementById("chart");
      const width = Math.max(560, Math.floor(svg.parentElement.clientWidth));
      const height = 181;
      const left = 38, right = 9, top = 10, bottom = 36;
      const plotWidth = width - left - right;
      const plotHeight = height - top - bottom;
      const max = rows.length ? Math.max(...rows.map(row => row.revenue)) * 1.12 : 1;
      const step = plotWidth / Math.max(rows.length, 1);
      const barWidth = Math.max(5, Math.min(20, step * .62));
      const ticks = 3;
      let markup = `<title>Revenue and EBITDA by selected territory, EUR millions</title>`;
      for (let tick = 0; tick <= ticks; tick++) {
        const value = max * tick / ticks;
        const y = top + plotHeight - (plotHeight * tick / ticks);
        markup += `<line class="gridline" x1="${left}" y1="${y}" x2="${width - right}" y2="${y}"></line>`;
        markup += `<text class="axis-label" x="${left - 7}" y="${y + 3}" text-anchor="end">${Math.round(value)}</text>`;
      }
      rows.forEach((row, index) => {
        const x = left + index * step + (step - barWidth) / 2;
        const revenueHeight = Math.max(0, row.revenue / max * plotHeight);
        const profitHeight = Math.max(0, row.ebitda / max * plotHeight);
        const label = row.name.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
        markup += `<g><title>${label}: Revenue €${row.revenue.toFixed(1)}m, EBITDA €${row.ebitda.toFixed(1)}m</title>`;
        markup += `<rect class="territory-bar" x="${x}" y="${top + plotHeight - revenueHeight}" width="${barWidth}" height="${revenueHeight}" rx="2"></rect>`;
        markup += `<rect class="profit-bar" x="${x}" y="${top + plotHeight - profitHeight}" width="${barWidth}" height="${profitHeight}" rx="2"></rect>`;
        if (rows.length <= 14) markup += `<text class="bar-label" transform="translate(${x + barWidth / 2},${height - 5}) rotate(-38)" text-anchor="end">${label}</text>`;
        markup += `</g>`;
      });
      if (!rows.length) markup += `<text class="axis-label" x="${width / 2}" y="${height / 2}" text-anchor="middle">Select territories to display results</text>`;
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg.innerHTML = markup;
    }

    function render() {
      Object.entries(controls).forEach(([key, input]) => {
        const value = Number(input.value);
        document.getElementById(key + "-value").textContent = signed(value);
      });
      const { rows, totals } = calculate();
      const { growth, cost, fx } = currentAssumptions();
      const baseline = [...selected].reduce((sum, index) => sum + territories[index].revenue * territories[index].fx * (1 - territories[index].costRatio), 0);
      const baseRevenue = [...selected].reduce((sum, index) => sum + territories[index].revenue * territories[index].fx, 0);
      const margin = totals.revenue ? totals.ebitda / totals.revenue * 100 : 0;
      const baseMargin = baseRevenue ? baseline / baseRevenue * 100 : 0;
      document.getElementById("revenue-metric").textContent = money(totals.revenue);
      document.getElementById("cost-metric").textContent = money(totals.costs);
      document.getElementById("ebitda-metric").textContent = money(totals.ebitda);
      document.getElementById("margin-metric").textContent = margin.toFixed(1) + "%";
      const revenueDelta = baseRevenue ? ((totals.revenue / baseRevenue - 1) * 100) : 0;
      const ebitdaDelta = baseline ? ((totals.ebitda / baseline - 1) * 100) : 0;
      const revenueDeltaEl = document.getElementById("revenue-delta");
      revenueDeltaEl.textContent = signed(revenueDelta);
      revenueDeltaEl.className = revenueDelta >= 0 ? "positive" : "negative";
      const ebitdaDeltaEl = document.getElementById("ebitda-delta");
      ebitdaDeltaEl.textContent = signed(ebitdaDelta);
      ebitdaDeltaEl.className = ebitdaDelta >= 0 ? "positive" : "negative";
      const marginDeltaEl = document.getElementById("margin-delta");
      const marginDelta = margin - baseMargin;
      marginDeltaEl.textContent = (marginDelta > 0 ? "+" : "") + marginDelta.toFixed(1) + " pp";
      marginDeltaEl.className = marginDelta >= 0 ? "positive" : "negative";
      document.getElementById("cost-scope").textContent = selected.size + " selected " + (selected.size === 1 ? "territory" : "territories");

      const activePreset = document.getElementById("scenario-select").value;
      const scenarioLabel = activePreset === "custom" ? "Custom assumptions" : presets[activePreset].label;
      document.getElementById("scenario-caption").textContent = scenarioLabel;
      document.getElementById("table-meta").textContent = `Showing ${rows.length} of ${territories.length} territories · Consolidated in EUR`;
      const body = document.getElementById("results-body");
      body.replaceChildren();
      if (!rows.length) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 5;
        td.className = "empty-state";
        td.textContent = "No territories selected. Select at least one territory to see consolidated results.";
        tr.append(td);
        body.append(tr);
      } else {
        rows.forEach(row => {
          const tr = document.createElement("tr");
          const territoryCell = document.createElement("td");
          const territoryName = document.createElement("span");
          territoryName.className = "territory-name";
          territoryName.textContent = row.name;
          const currencyTag = document.createElement("span");
          currencyTag.className = "currency-tag";
          currencyTag.textContent = row.currency;
          territoryCell.append(territoryName, currencyTag);
          tr.append(territoryCell);
          const values = [
            fmt.format(row.revenue),
            fmt.format(row.costs),
            fmt.format(row.ebitda),
            `<span class="margin-cell">${(row.ebitda / row.revenue * 100).toFixed(1)}%</span>`
          ];
          values.forEach((value, index) => {
            const td = document.createElement("td");
            if (index === 3) td.innerHTML = value;
            else td.textContent = value;
            tr.append(td);
          });
          body.append(tr);
        });
      }
      const foot = document.getElementById("results-foot");
      foot.replaceChildren();
      if (rows.length) {
        const tr = document.createElement("tr");
        const values = ["Consolidated total", fmt.format(totals.revenue), fmt.format(totals.costs), fmt.format(totals.ebitda), margin.toFixed(1) + "%"];
        values.forEach((value, index) => {
          const td = document.createElement("td");
          td.textContent = value;
          if (index === 4) td.className = "margin-cell";
          tr.append(td);
        });
        foot.append(tr);
      }
      renderChart(rows);
    }

    function applyPreset(name) {
      if (!presets[name]) return;
      Object.entries(presets[name]).forEach(([key, value]) => {
        if (key in controls) controls[key].value = value;
      });
      render();
    }

    function parseCsv(text) {
      const rows = [];
      let row = [];
      let field = "";
      let quoted = false;
      for (let index = 0; index < text.length; index++) {
        const char = text[index];
        if (quoted) {
          if (char === '"' && text[index + 1] === '"') {
            field += '"';
            index++;
          } else if (char === '"') quoted = false;
          else field += char;
        } else if (char === '"' && field.length === 0) quoted = true;
        else if (char === ",") {
          row.push(field.trim());
          field = "";
        } else if (char === "\n" || char === "\r") {
          if (char === "\r" && text[index + 1] === "\n") index++;
          row.push(field.trim());
          if (row.some(value => value !== "")) rows.push(row);
          row = [];
          field = "";
        } else field += char;
      }
      if (quoted) throw new Error("The CSV has an unclosed quoted field.");
      row.push(field.trim());
      if (row.some(value => value !== "")) rows.push(row);
      if (rows.length < 2) throw new Error("The CSV needs a header row and at least one territory.");

      const normalize = value => value.replace(/^\uFEFF/, "").toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
      const headers = rows[0].map(normalize);
      const required = ["territory", "currency", "fx to eur", "revenue", "operating costs"];
      const columns = required.map(name => headers.indexOf(name));
      if (columns.some(index => index < 0)) throw new Error("Required columns: Territory, Currency, FX to EUR, Revenue, Operating costs.");

      const seen = new Set();
      return rows.slice(1).map((values, index) => {
        const line = index + 2;
        const [name, currency, fxText, revenueText, costsText] = columns.map(column => (values[column] || "").trim());
        const fx = Number(fxText.replace(/,/g, ""));
        const revenue = Number(revenueText.replace(/,/g, ""));
        const costs = Number(costsText.replace(/,/g, ""));
        const key = name.toLowerCase();
        if (!name || !currency) throw new Error(`Row ${line}: Territory and Currency are required.`);
        if (seen.has(key)) throw new Error(`Row ${line}: duplicate territory "${name}".`);
        if (!Number.isFinite(fx) || fx <= 0 || !Number.isFinite(revenue) || revenue <= 0 || !Number.isFinite(costs) || costs < 0) {
          throw new Error(`Row ${line}: FX and revenue must be positive numbers; operating costs must be zero or more.`);
        }
        seen.add(key);
        const normalizedCurrency = currency.toUpperCase();
        return { name, currency: normalizedCurrency, fx: normalizedCurrency === "EUR" ? 1 : fx, revenue, costRatio: costs / revenue };
      });
    }

    document.getElementById("import-button").addEventListener("click", () => document.getElementById("import-file").click());
    document.getElementById("import-file").addEventListener("change", async event => {
      const file = event.target.files[0];
      if (!file) return;
      const status = document.getElementById("import-status");
      try {
        const imported = parseCsv(await file.text());
        territories = imported;
        selected.clear();
        territories.forEach((_, index) => selected.add(index));
        document.getElementById("territory-search").value = "";
        document.getElementById("scenario-select").value = "base";
        renderTerritories();
        applyPreset("base");
        status.style.color = "";
        status.textContent = `Loaded ${territories.length} territories from ${file.name}.`;
      } catch (error) {
        status.textContent = error instanceof Error ? `Import failed: ${error.message}` : "Import failed due to an unexpected error.";
        status.style.color = "#b45242";
      } finally {
        event.target.value = "";
      }
    });

    document.getElementById("scenario-select").addEventListener("change", event => {
      if (event.target.value === "custom") return render();
      applyPreset(event.target.value);
    });
    Object.values(controls).forEach(input => input.addEventListener("input", () => {
      document.getElementById("scenario-select").value = "custom";
      render();
    }));
    document.getElementById("territory-search").addEventListener("input", renderTerritories);
    document.getElementById("select-all").addEventListener("click", () => {
      territories.forEach((_, index) => selected.add(index));
      renderTerritories(); render();
    });
    document.getElementById("select-none").addEventListener("click", () => {
      selected.clear();
      renderTerritories(); render();
    });
    document.getElementById("reset-button").addEventListener("click", () => {
      selected.clear();
      territories.forEach((_, index) => selected.add(index));
      document.getElementById("territory-search").value = "";
      document.getElementById("scenario-select").value = "base";
      applyPreset("base");
      renderTerritories();
    });
    document.getElementById("export-button").addEventListener("click", () => {
      const { rows, totals } = calculate();
      const csvRows = [
        ["Territory", "Currency", "Revenue (EUR m)", "Operating costs (EUR m)", "EBITDA (EUR m)", "EBITDA margin (%)"],
        ...rows.map(row => [row.name, row.currency, row.revenue.toFixed(1), row.costs.toFixed(1), row.ebitda.toFixed(1), (row.ebitda / row.revenue * 100).toFixed(1)]),
        ...(rows.length ? [["Consolidated total", "EUR", totals.revenue.toFixed(1), totals.costs.toFixed(1), totals.ebitda.toFixed(1), (totals.ebitda / totals.revenue * 100).toFixed(1)]] : [])
      ];
      const csv = csvRows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\r\n");
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "emea-consolidation.csv";
      link.click();
      URL.revokeObjectURL(url);
    });
    window.addEventListener("resize", render);

    renderTerritories();
    applyPreset("base");
