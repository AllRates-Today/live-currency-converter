# Live Currency Rates — `live-currency-rates`

A zero-dependency TypeScript library that **fetches the rate and does the conversion in one call**: `Convert(100).from('USD').to('EUR')`. It works out of the box with no API key, and you can point it at a different rate provider whenever you need more currencies or real-time data.

Published to npm as **[`live-currency-rates`](https://www.npmjs.com/package/live-currency-rates)**. The repo also ships a static demo page under `docs/`.

[![npm](https://img.shields.io/npm/v/live-currency-rates?color=cb3837)](https://www.npmjs.com/package/live-currency-rates)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](https://www.npmjs.com/package/live-currency-rates)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)](https://www.typescriptlang.org/)
[![Powered by AllRatesToday](https://img.shields.io/badge/Powered%20by-AllRatesToday-orange.svg)](https://allratestoday.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 🚀 Features

- 🔗 **Fluent API** — `Convert(amount).from(x).to(y)`, plus `Rate`, `Rates` and `Symbols`
- 🆓 **No key needed** — defaults to the free Frankfurter (ECB) provider
- 🔀 **Three providers, one interface** — swap the data source without touching call sites
- 📦 **Zero runtime dependencies** — built on the platform `fetch`; ships CJS + ESM + `.d.ts`
- ⏱️ **Built-in timeout** — every request is aborted after 10s by default (`AbortSignal.timeout`)
- 🔠 **Case-insensitive codes** — `from('usd')` and `from('USD')` behave identically

## 📦 Installation

```bash
npm install live-currency-rates
```

Requires a runtime with global `fetch` and `AbortSignal.timeout` (Node 18+, modern browsers, Deno, workers).

## 🏁 Quick start

```typescript
import { Convert } from 'live-currency-rates';

const result = await Convert(100).from('USD').to('EUR');
console.log(result.amount); // converted amount
console.log(result.rate);   // rate used
```

No configuration, no signup — the default provider is Frankfurter (European Central Bank reference rates).

CommonJS works too:

```javascript
const { Convert } = require('live-currency-rates');

Convert(100).from('USD').to('EUR').then(r => console.log(r.amount));
```

## 🔀 Providers

| Provider | Key required | Coverage | Source |
|---|---|---|---|
| `frankfurter` *(default)* | no | ~30 currencies | European Central Bank daily reference rates, via `api.frankfurter.dev` |
| `fawaz` | no | 200+ incl. crypto | `@fawazahmed0/currency-api`, served from the jsDelivr CDN |
| `allrates` | yes | 160+ currencies | AllRatesToday — institutional interbank market data |

Provider selection is resolved per call: an explicit `provider` wins; otherwise supplying an `apiKey` selects `allrates`; otherwise `frankfurter`.

```typescript
import { setup, Convert } from 'live-currency-rates';

setup({ provider: 'fawaz' });          // free, 200+ currencies incl. crypto
setup({ apiKey: 'art_live_...' });     // implies provider: 'allrates'
```

## 🔑 Get your API key

The `allrates` provider calls `https://allratestoday.com/api/v1/rates` and `/api/v1/symbols` with an `Authorization: Bearer <key>` header. Get a free key at **[allratestoday.com/register](https://allratestoday.com/register)**. Calling it without a key throws before any request is made.

## 📚 API reference

| Export | Signature | Returns |
|---|---|---|
| `Convert` | `Convert(amount, config?).from(code).to(code)` | `Promise<ConvertResult>` |
| `Rate` | `Rate(code, config?).to(code)` | `Promise<RateResult>` |
| `Rates` | `Rates(base, targets?, config?)` | `Promise<Record<string, number>>` |
| `Symbols` | `Symbols(config?)` | `Promise<Record<string, string>>` |
| `setup` | `setup(config)` | `void` |

`Convert` is also the default export.

### `Convert`

```typescript
const result = await Convert(250).from('GBP').to('JPY');
// { amount, rate, from: 'GBP', to: 'JPY', originalAmount: 250 }
```

`amount` is computed client-side as `originalAmount * rate`.

### `Rate`

```typescript
const { rate, from, to } = await Rate('USD').to('EUR');
```

### `Rates`

```typescript
const rates = await Rates('USD', ['EUR', 'GBP', 'JPY']);
// { EUR: …, GBP: …, JPY: … }
```

Omit the target list to get every rate the provider publishes for that base. With `frankfurter`, the base currency is added back as `1` (the upstream API omits it).

### `Symbols`

```typescript
const symbols = await Symbols();
// { USD: 'United States Dollar', EUR: 'Euro', … }
```

Codes are normalised to uppercase across all three providers.

### `setup`

```typescript
setup({
  provider: 'frankfurter', // | 'fawaz' | 'allrates'
  apiKey: 'art_live_...',  // only used by 'allrates'
  baseUrl: '...',          // override the provider endpoint
  timeout: 10000,          // ms, default 10000
});
```

`setup()` replaces the global config. Every call also accepts the same object as its last argument for a one-off override, which is merged over the global config:

```typescript
await Convert(10, { apiKey: 'art_live_...' }).from('USD').to('EUR');
```

## 💡 Recipes

### React — render a price in the user's currency

```tsx
import { useEffect, useState } from 'react';
import { Convert } from 'live-currency-rates';

function Price({ usd, currency }: { usd: number; currency: string }) {
  const [local, setLocal] = useState<number | null>(null);

  useEffect(() => {
    Convert(usd).from('USD').to(currency).then(r => setLocal(r.amount));
  }, [usd, currency]);

  return <span>{local == null ? '…' : `${local.toFixed(2)} ${currency}`}</span>;
}
```

### Express — a convert endpoint

```javascript
const express = require('express');
const { Convert } = require('live-currency-rates');

const app = express();

// GET /convert?amount=100&from=USD&to=EUR
app.get('/convert', async (req, res) => {
  const { amount, from, to } = req.query;
  const result = await Convert(Number(amount)).from(from).to(to);
  res.json(result);
});

app.listen(3000);
```

### Next.js — a rate in a Route Handler

```typescript
import { Rate } from 'live-currency-rates';

export async function GET() {
  const { rate } = await Rate('USD').to('EUR');
  return Response.json({ usdEur: rate });
}
```

## 🛡️ Error handling

Every failure surfaces as a thrown `Error`:

| Condition | Message |
|---|---|
| Non-2xx HTTP response | The upstream `error` field, else `HTTP <status>` |
| `allrates` used with no key | `API key required for \`allrates\` provider…` |
| Unknown base code (`fawaz`) | `Unknown currency: <CODE>` |
| Target missing from the response | `No rate available for <FROM> -> <TO>` |
| Request exceeds `timeout` | `AbortSignal.timeout` aborts the fetch |

## 🖥️ Demo site

`docs/` contains a dependency-free converter page plus a 20-question FAQ, deployed to GitHub Pages by the `Deploy Pages` workflow (`.github/workflows/pages.yml`) on every push to `main`. The page imports the published package straight from `esm.sh` and converts using the free Frankfurter provider, so it needs no key and no build step.

Live at [cahthuranag.github.io/live-currency-converter](https://cahthuranag.github.io/live-currency-converter/) — the canonical URL declared in `docs/index.html` and in the `homepage` field of `package.json`.

## 💡 Notes

- **Build:** `npm run build` bundles CJS + ESM + type declarations with `tsup`; only `dist/` is published.
- **Tests:** `npm test` runs Vitest against `src/index.test.ts`. That suite was written against the earlier AllRatesToday-only API — it asserts an `amount` query parameter and a `{ from, to, rate }` response envelope that the current multi-provider `src/index.ts` does not produce — so parts of it fail until it is rewritten. Treat it as known-stale, not as a signal about the library.
- **Rate freshness** depends on the provider: Frankfurter publishes daily ECB reference rates, while the AllRatesToday provider serves real-time mid-market rates.

## 🔗 Links

- **npm:** [live-currency-rates](https://www.npmjs.com/package/live-currency-rates)
- **Repository:** [github.com/AllRates-Today/live-currency-converter](https://github.com/AllRates-Today/live-currency-converter)
- **Website:** [allratestoday.com](https://allratestoday.com)
- **API docs:** [allratestoday.com/docs](https://allratestoday.com/docs)
- **Free API key:** [allratestoday.com/register](https://allratestoday.com/register)
- **Status:** [allratestoday.com/status](https://allratestoday.com/status)
- **Support:** [allratestoday.com/contact](https://allratestoday.com/contact)

## 📜 License

MIT — see [LICENSE](LICENSE).
