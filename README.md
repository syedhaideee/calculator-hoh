# House of Horticulturists — Profit Sharing Calculator

Next.js app that splits project gross profit between **Hamid Ali** (Partner 1) and **Syed Haider** (Partner 2) and exports a PDF receipt.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
# or for production
npm run build && npm start
```

## Rules (edit in `lib/calc.js`)

**Scenario 1 – New (first-time) clients.** All new-client gross profit is summed. One rate, chosen from that total, is applied to the whole sum for Haider:

| Total new-client gross profit | Haider |
|---|---|
| up to £5,000 | 10% |
| £5,000.01 – £7,500 | 8% |
| above £7,500 | 6% |

**Scenario 2 – Repeat clients.** All repeat-client gross profit is summed; Haider gets a flat 5%.

**Scenario 3 – Monthly garden maintenance subscribers.** Haider gets a fixed £5 per subscriber project, whatever its price.

Hamid receives the remainder in every scenario.

## Working out gross profit (optional)

Each project has a **"Calculate gross profit from price − cost"** checkbox. Tick it to enter the project price and the overall cost; the gross profit is then calculated as price − cost and used in the scenarios above. Leave it unticked to type the gross profit in directly. When any project uses it, the PDF receipt adds Price and Cost columns.

## Files

- `app/page.js` — the calculator UI (entries are remembered in the browser)
- `lib/calc.js` — all the profit-sharing logic and rates
- `lib/pdf.js` — PDF receipt (jsPDF + jspdf-autotable)
