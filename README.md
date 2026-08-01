# live-currency-rates

[![Powered by AllRatesToday](https://img.shields.io/badge/Powered%20by-AllRatesToday-orange.svg)](https://allratestoday.com)

Convert currencies with live exchange rates. Simple, fluent API. Multiple providers — use a free one (no key) or bring your own.

[![npm](https://img.shields.io/npm/v/live-currency-rates?color=cb3837)](https://www.npmjs.com/package/live-currency-rates)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](https://www.npmjs.com/package/live-currency-rates)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Install

```bash
npm install live-currency-rates
```

## Quick Start (no key)

```typescript
import { Convert } from 'live-currency-rates';

const result = await Convert(100).from('USD').to('EUR');
console.log(result.amount); // 92.45
```

By default, the package uses the free **Frankfurter** provider (ECB data) — no signup, no API key.

## Why live-currency-rates?

Most popular "currency" packages do the **math** but make you fetch the **rates** yourself:

| Package                   | Converts amounts | Fetches live rates          | No API key |
| ------------------------- | :--------------: | :-------------------------: | :--------: |
| **live-currency-rates**   |        ✅        |             ✅              |     ✅     |
| cashify                   |        ✅        | ❌ you supply rates         |     —      |
| money / money.js          |        ✅        | ❌ you supply rates         |     —      |
| dinero.js / currency.js   |        ✅        | ❌ math/format only         |     —      |

With cashify or money.js you still have to find a rate source, fetch it, and keep it fresh. `live-currency-rates` does the fetch **and** the conversion in one call — and works with zero config out of the box.

## Providers

Pick a provider based on your needs:

| Provider      | Key?  | Currencies | Source                    | Notes                         |
| ------------- | ----- | ---------- | ------------------------- | ----------------------------- |
| `frankfurter` | no    | ~30        | European Central Bank     | Default. Daily updates.       |
| `fawaz`       | no    | 200+       | fawazahmed0/currency-api  | Includes crypto. CDN-hosted.  |
| `allrates`    | yes   | 160+       | AllRatesToday (Reuters)   | Real-time mid-market rates.   |

Choose a provider with `setup()`:

```typescript
import { setup, Convert } from 'live-currency-rates';

// Free, no key — 200+ currencies including crypto
setup({ provider: 'fawaz' });

// AllRatesToday — get a free key at https://allratestoday.com/register
setup({ apiKey: 'art_live_...' });
```

## API

### `Convert(amount).from('XXX').to('YYY')`

```typescript
const result = await Convert(250).from('GBP').to('JPY');
console.log(`250 GBP = ${result.amount} JPY`);
console.log(`Rate: ${result.rate}`);
```

Returns: `{ amount, rate, from, to, originalAmount }`

### `Rate('XXX').to('YYY')`

```typescript
import { Rate } from 'live-currency-rates';

const { rate } = await Rate('USD').to('EUR');
console.log(`1 USD = ${rate} EUR`);
```

### `Rates('XXX', ['YYY', 'ZZZ'])`

```typescript
import { Rates } from 'live-currency-rates';

const rates = await Rates('USD', ['EUR', 'GBP', 'JPY']);
// { EUR: 0.92, GBP: 0.78, JPY: 149.5 }
```

Omit the target list to get all available rates for the base currency.

### `Symbols()`

```typescript
import { Symbols } from 'live-currency-rates';

const symbols = await Symbols();
// { USD: 'United States Dollar', EUR: 'Euro', ... }
```

### `setup(config)`

```typescript
setup({
  provider: 'frankfurter' | 'fawaz' | 'allrates',
  apiKey: 'art_live_...',   // only for provider: 'allrates'
  baseUrl: '...',           // optional override
  timeout: 10000,           // ms, default 10000
});
```

## Recipes

### React — show prices in the user's currency

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

### Next.js — server-side rate in a Route Handler

```typescript
import { Rate } from 'live-currency-rates';

export async function GET() {
  const { rate } = await Rate('USD').to('EUR');
  return Response.json({ usdEur: rate });
}
```

## CommonJS

```javascript
const { Convert } = require('live-currency-rates');

Convert(100).from('USD').to('EUR').then(r => console.log(r.amount));
```

## License

MIT
