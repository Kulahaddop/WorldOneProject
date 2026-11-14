# EMEA Finance Consolidation Dashboard

A lightweight, browser-based planning dashboard for consolidating illustrative or imported financial data across EMEA territories. It uses plain HTML, CSS, and JavaScript; there are no build steps, package installs, tracking cookies, or server-side dependencies.

> **Sample data only:** the included figures and exchange rates are fictional planning examples. Replace them with finance-approved data and rates before using the dashboard for business decisions.

## Run locally

Open `index.html` in a modern browser. To serve the files locally instead, run one of these commands from the project directory:

```powershell
py -m http.server 8000
```

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Use the dashboard

- Choose **Base plan**, **Growth case**, **Downside case**, or **FX neutral**, or adjust the revenue-growth, cost-inflation, and FX assumptions to build a custom scenario.
- Search for territories and select the markets to include. **All**, **None**, and **Reset** update the consolidation scope.
- Review consolidated revenue, operating costs, EBITDA, EBITDA margin, and the per-territory comparison.
- Select **Import CSV** to replace the current territory set with your own data.
- Select **Export CSV** to download the currently selected territories and consolidated total.

Scenario assumptions are applied to the imported or sample baseline. Revenue growth and cost inflation apply to all territories; FX movement applies to non-EUR territories only. The FX control is a relative movement against each row's supplied FX-to-EUR rate, not a live exchange-rate feed.

## Import data

Use the provided [`data/emea-sample.csv`](data/emea-sample.csv) as a template. Required column names (case-insensitive) are:

| Column | Meaning |
| --- | --- |
| `Territory` | Territory or market name; must be non-empty and unique. |
| `Currency` | Three-letter local currency code, for display. |
| `FX to EUR` | Positive rate in **EUR per one unit of local currency**. Use `1` for EUR. |
| `Revenue` | Positive revenue in **millions of local currency**. |
| `Operating costs` | Operating costs in **millions of local currency**; zero is allowed. |

Values may use decimal points and optional thousands separators. The CSV parser supports quoted fields, commas in quoted names, and doubled quotes. Do not include currency symbols in numeric cells. An invalid file is rejected with a row-specific error; the current dashboard data remains in place.

Calculations for each territory are:

```text
EUR revenue = local revenue × FX to EUR × (1 + revenue growth) × (1 + FX movement, for non-EUR only)
EUR costs   = local operating costs × FX to EUR × (1 + cost inflation) × (1 + FX movement, for non-EUR only)
EBITDA      = EUR revenue − EUR costs
EBITDA %    = EBITDA ÷ EUR revenue
```

The scenario's percentage changes are applied to each base amount rather than compounded across periods. Consolidated margin is calculated from consolidated EBITDA divided by consolidated revenue, not as the average of territory margins.

## Project files

- `index.html` — dashboard layout and controls
- `styles.css` — responsive dashboard styling
- `app.js` — sample dataset, CSV import/export, scenarios, calculations, and rendering
- `data/emea-sample.csv` — example CSV with 28 territories
- `.github/workflows/pages.yml` — automated GitHub Pages deployment

## Publish with GitHub Pages

The included [Pages workflow](.github/workflows/pages.yml) publishes the static site automatically when changes are pushed to `main`, or when the workflow is run manually.

1. Add these project files to the root of a GitHub repository whose default deployment branch is `main`.
2. In the repository, open **Settings → Pages** and set the source to **GitHub Actions**.
3. Push to `main` or run **Deploy static dashboard to GitHub Pages** from the **Actions** tab.
4. Open the Pages URL shown in the workflow deployment or repository settings.

This is a static, client-side app. Imported data stays in the browser and is not uploaded by the dashboard. Treat exports and imported files according to your organization's data policies.
