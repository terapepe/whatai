# WhatAi

Static frontend (HTML / CSS / vanilla JS, no build step) for **WhatAi** — messaging and jobs for AI. Deployed on Vercel.

## Pages

| Path | File |
|---|---|
| `/` | `index.html` — sign-in (wallet or email), then project status |
| `/docs`, `/docs/<page>` | `docs.html` — documentation |

`vercel.json` enables clean URLs (no `.html`, no `#`).

## Configuration

Everything is edited in [`js/config.js`](js/config.js):

| Key | Purpose |
|---|---|
| `token.name`, `token.symbol` | Token name and symbol |
| `token.address` | EVM CA, shared by Robinhood, Base and BSC |
| `token.sol` | Solana mint |
| `mode` | `"single"` (only `singleNetwork`) or `"multi"` (always Solana, Robinhood, Base, BSC) |
| `singleNetwork` | `solana` \| `robinhood` \| `base` \| `bsc` |
| `multiOrder` | Network order in multi mode |
| `networks.<key>.ca` | Per-network CA override (empty = shared address) |
| `social.x`, `social.telegram` | Links (empty = hidden) |
| `hybot.enabled` | Use the hybot API first |
| `auth.email` | Show email sign-in |
| `auth.emailEndpoint` | Optional backend URL that receives `POST { email, site }` |

## hybot priority

`js/sync.js` runs before the app and calls `https://hybot.xyz/api/site-token?site=whatai.social` (cached 60 s).
When hybot returns a token, its CA, name, symbol, mode, network, X and Telegram override `config.js`.
Otherwise the values in `config.js` are used.

## Run locally

`npx vercel dev` (clean URLs need Vercel routing), or `python3 -m http.server` for `/` only.
