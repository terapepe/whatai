/* WhatAi — networks, wallets, session and shared UI (header, footer, CA chips). */
(function () {
  const CFG = window.WHATAI_CONFIG;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- Networks ---------- */
  const Chain = {
    isMulti() { return CFG.mode === "multi"; },
    get(id) { const n = CFG.networks[id]; return n ? { id, ...n } : null; },
    primaryId() { return CFG.networks[CFG.singleNetwork] ? CFG.singleNetwork : Object.keys(CFG.networks)[0]; },
    list() {
      if (!Chain.isMulti()) return [Chain.get(Chain.primaryId())];
      return [...new Set([...(CFG.multiOrder || []), "solana", "robinhood", "base", "bsc"])]
        .filter((id) => CFG.networks[id]).map(Chain.get);
    },
    ca(id) {
      const n = CFG.networks[id];
      if (!n) return "";
      return String(n.ca || (n.type === "solana" ? CFG.token.sol : CFG.token.address) || "").trim();
    },
    caGroups() {
      return Chain.list().reduce((acc, n) => {
        const ca = Chain.ca(n.id), k = ca ? ca.toLowerCase() : "none:" + n.type, g = acc.find((x) => x.k === k);
        g ? g.nets.push(n) : acc.push({ k, ca, nets: [n] });
        return acc;
      }, []);
    },
    explorer(id) { const n = CFG.networks[id], a = Chain.ca(id); return n && a ? n.explorer + n.explorerToken + a : ""; },
    byChainId(cid) { return Chain.list().find((n) => n.type === "evm" && n.chainId === Number(cid)) || null; },
    hex(cid) { return "0x" + Number(cid).toString(16); },
  };

  /* ---------- Wallets ---------- */
  const evm = new Map();
  const SOL = [
    { key: "phantom", name: "Phantom", url: "https://phantom.app", get: () => window.phantom?.solana?.isPhantom ? window.phantom.solana : (window.solana?.isPhantom ? window.solana : null) },
    { key: "solflare", name: "Solflare", url: "https://solflare.com", get: () => window.solflare?.isSolflare ? window.solflare : null },
    { key: "backpack", name: "Backpack", url: "https://backpack.app", get: () => window.backpack?.solana || null },
  ];
  const EVM_SUGGEST = [
    { name: "MetaMask", url: "https://metamask.io" },
    { name: "Rabby", url: "https://rabby.io" },
    { name: "Coinbase Wallet", url: "https://www.coinbase.com/wallet" },
  ];
  const KEY = "whatai.session";

  const Session = {
    state: null,
    load() { try { Session.state = JSON.parse(localStorage.getItem(KEY) || "null"); } catch { Session.state = null; } return Session.state; },
    save(s) { Session.state = s; try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} emit(); },
    clear() { Session.state = null; try { localStorage.removeItem(KEY); } catch {} emit(); },
  };
  const emit = () => window.dispatchEvent(new CustomEvent("session:change", { detail: Session.state }));

  const Wallet = {
    providers: {},
    init() {
      window.addEventListener("eip6963:announceProvider", (e) => {
        const { info, provider } = e.detail || {};
        if (info && provider) evm.set(info.rdns || info.uuid, { info, provider });
      });
      window.dispatchEvent(new Event("eip6963:requestProvider"));
    },
    evmWallets() {
      const l = [...evm.values()];
      if (!l.length && window.ethereum) l.push({ info: { name: window.ethereum.isMetaMask ? "MetaMask" : "Browser Wallet", rdns: "injected", icon: "" }, provider: window.ethereum });
      return l;
    },
    solWallets() { return SOL.map((w) => ({ key: w.key, name: w.name, url: w.url, icon: w.get()?.icon || "", installed: !!w.get() })); },

    async connect(netId, key) {
      const net = Chain.get(netId);
      if (net.type === "solana") {
        const def = SOL.find((w) => w.key === key), p = def && def.get();
        if (!p) throw new Error(`${def ? def.name : "Solana wallet"} not detected.`);
        const r = await p.connect();
        const pk = (r && r.publicKey) || p.publicKey;
        Wallet.providers[key] = p;
        Session.save({ type: "wallet", chain: "solana", network: netId, address: pk.toString(), wallet: def.name, key });
        return;
      }
      const entry = Wallet.evmWallets().find((w) => (w.info.rdns || "injected") === key) || Wallet.evmWallets()[0];
      if (!entry) throw new Error("No EVM wallet detected. Install MetaMask, Rabby or Coinbase Wallet.");
      const p = entry.provider;
      const acc = await p.request({ method: "eth_requestAccounts" });
      await Wallet.switchEvm(p, net);
      Wallet.providers[key] = p;
      Session.save({ type: "wallet", chain: "evm", network: netId, address: acc[0], wallet: entry.info.name, key: entry.info.rdns || "injected" });
      Wallet.bind(p);
    },

    async switchEvm(p, net) {
      const chainId = Chain.hex(net.chainId);
      try {
        await p.request({ method: "wallet_switchEthereumChain", params: [{ chainId }] });
      } catch (e) {
        if (e.code === 4902 || /unrecognized|not added|unknown chain/i.test(e.message || "")) {
          await p.request({ method: "wallet_addEthereumChain", params: [{ chainId, chainName: net.name, nativeCurrency: net.nativeCurrency, rpcUrls: net.rpcUrls, blockExplorerUrls: [net.explorer] }] });
        } else throw e;
      }
    },

    bind(p) {
      if (p._whataiBound || !p.on) return;
      p._whataiBound = true;
      p.on("accountsChanged", (a) => { const s = Session.state; if (s?.type !== "wallet") return; a.length ? Session.save({ ...s, address: a[0] }) : Wallet.disconnect(); });
      p.on("chainChanged", (cid) => { const s = Session.state; const n = Chain.byChainId(parseInt(cid, 16)); if (s?.chain === "evm" && n) Session.save({ ...s, network: n.id }); });
    },

    async disconnect() {
      const s = Session.state;
      if (s?.chain === "solana") { try { await Wallet.providers[s.key]?.disconnect?.(); } catch {} }
      Session.clear();
    },

    async restore() {
      const s = Session.load();
      if (!s || s.type !== "wallet") return;
      await new Promise((r) => setTimeout(r, 350));
      try {
        if (s.chain === "solana") {
          const def = SOL.find((w) => w.key === s.key), p = def && def.get();
          if (!p) return Session.clear();
          const r = await p.connect({ onlyIfTrusted: true });
          const pk = (r && r.publicKey) || p.publicKey;
          if (!pk) return Session.clear();
          Wallet.providers[s.key] = p;
          Session.save({ ...s, address: pk.toString() });
        } else {
          const e = Wallet.evmWallets().find((w) => (w.info.rdns || "injected") === s.key) || Wallet.evmWallets()[0];
          if (!e) return Session.clear();
          const acc = await e.provider.request({ method: "eth_accounts" });
          if (!acc.length) return Session.clear();
          Wallet.providers[s.key] = e.provider;
          Wallet.bind(e.provider);
          Session.save({ ...s, address: acc[0] });
        }
      } catch { Session.clear(); }
    },
  };

  /* ---------- UI helpers ---------- */
  const short = (a) => (a && a.length > 12 ? a.slice(0, 6) + "…" + a.slice(-4) : a || "");

  function toast(msg) {
    let t = $("#toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 1800);
  }

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); ta.remove();
    }
    toast("CA copied");
  }

  const icons = (nets) => nets.map((n) => `<img src="${esc(n.icon)}" alt="${esc(n.short)}" title="${esc(n.name)}" width="22" height="22">`).join("");
  const COPY_SVG = `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M9 9h10v10H9zM5 15V5h10"/></svg>`;

  function caRow(g) {
    const names = g.nets.map((n) => n.short).join(" · ");
    return `<div class="ca-row" style="--net:${esc(g.nets[0].color)}">
      <span class="ca-icons">${icons(g.nets)}</span>
      <span class="ca-net">${esc(names)}</span>
      ${g.ca
        ? `<code class="ca-addr">${esc(g.ca)}</code><button class="ca-copy" data-copy="${esc(g.ca)}" aria-label="Copy CA">${COPY_SVG}<span>Copy CA</span></button>`
        : `<code class="ca-addr ca-empty">CA coming soon</code>`}
    </div>`;
  }

  function renderShared() {
    const T = CFG.token, S = CFG.social, multi = Chain.isMulti(), p = Chain.get(Chain.primaryId());
    document.documentElement.style.setProperty("--net", multi ? "var(--brand)" : p.color);
    document.body.dataset.mode = multi ? "multi" : "single";
    document.body.dataset.network = multi ? "multi" : p.id;

    document.querySelectorAll("[data-token-name]").forEach((el) => (el.textContent = T.name));
    document.querySelectorAll("[data-token-symbol]").forEach((el) => (el.textContent = "$" + T.symbol));
    document.querySelectorAll("[data-net-label]").forEach((el) => (el.innerHTML = multi
      ? `<span class="ca-icons">${icons(Chain.list())}</span> Multi-chain`
      : `<span class="ca-icons">${icons([p])}</span> ${esc(p.name)}`));

    document.querySelectorAll("[data-social]").forEach((el) => {
      const u = S[el.dataset.social];
      if (u) { el.href = u; el.hidden = false; } else el.hidden = true;
    });

    document.querySelectorAll("[data-ca-list]").forEach((el) => (el.innerHTML = Chain.caGroups().map(caRow).join("")));
    document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
  }

  document.addEventListener("click", (e) => {
    const c = e.target.closest("[data-copy]");
    if (c) copy(c.dataset.copy);
  });

  window.WA = { CFG, Chain, Wallet, Session, esc, short, toast, copy, icons, caRow, renderShared, SOL, EVM_SUGGEST };
})();
