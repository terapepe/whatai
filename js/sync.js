/* WhatAi — hybot sync.
 * Token name, symbol, CA, network mode, X and Telegram are taken from the hybot API first.
 * Values in config.js are the fallback when hybot has no token for this site or is unreachable.
 * Loaded synchronously right after config.js so every later script sees the final values.
 */
(function (C) {
  if (!C || !C.hybot || !C.hybot.enabled || typeof window === "undefined") return;

  var host = String(location.hostname || "").replace(/^www\./, "");
  var isPreview = !/\./.test(host) || /(^|\.)(vercel\.app|localhost|127\.0\.0\.1)$/.test(host);
  var site = isPreview ? C.brand.domain : host;
  if (!site) return;

  var key = "hybot:" + site, d = null;
  try {
    var c = JSON.parse(localStorage.getItem(key) || "null");
    if (c && Date.now() - c.t < (C.hybot.cacheMs || 60000)) d = c.d;
  } catch (e) {}

  if (!d) {
    try {
      var x = new XMLHttpRequest();
      x.open("GET", C.hybot.api + "?site=" + encodeURIComponent(site), false);
      x.send();
      if (x.status === 200) {
        d = JSON.parse(x.responseText);
        try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), d: d })); } catch (e) {}
      }
    } catch (e) {}
  }

  if (!d || !d.found) return;
  var ca = String(d.ca || "").trim();
  var isEvm = /^0x[0-9a-fA-F]{40}$/.test(ca);
  var isSol = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(ca);
  if (!isEvm && !isSol) return;

  if (d.name) C.token.name = d.name;
  if (d.symbol) C.token.symbol = String(d.symbol).replace(/^\$/, "");
  if (isEvm) C.token.address = ca; else C.token.sol = ca;

  if (d.mode === "single" || d.mode === "multi") C.mode = d.mode;
  var net = d.singleNetwork || d.primaryNetwork || (isSol ? "solana" : "");
  if (net && C.networks[net]) C.singleNetwork = net;
  if (C.mode === "single" && C.networks[C.singleNetwork]) C.networks[C.singleNetwork].ca = "";

  if (d.x) C.social.x = /^https?:/i.test(d.x) ? d.x : "https://x.com/" + String(d.x).replace(/^@/, "");
  if (d.telegram) C.social.telegram = /^https?:/i.test(d.telegram) ? d.telegram : "https://t.me/" + String(d.telegram).replace(/^@/, "");
})(window.WHATAI_CONFIG);
