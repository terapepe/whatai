/* WhatAi — home: sign-in screen, then the project status view. */
(function () {
  const { CFG, Chain, Wallet, Session, esc, short, toast, icons } = window.WA;
  const $ = (s, el = document) => el.querySelector(s);
  let pickNet = Chain.primaryId();

  function header() {
    const s = Session.state, btn = $("#accountBtn");
    if (!btn) return;
    if (s) {
      btn.hidden = false;
      const net = s.network ? Chain.get(s.network) : null;
      btn.innerHTML = `${net ? `<img src="${esc(net.icon)}" width="18" height="18" alt="">` : `<span class="dot"></span>`}<span>${esc(s.type === "email" ? s.email : short(s.address))}</span>`;
    } else btn.hidden = true;
  }

  function view() {
    const s = Session.state;
    $("#signin").hidden = !!s;
    $("#dashboard").hidden = !s;
    header();
    if (s) {
      const net = s.network ? Chain.get(s.network) : null;
      $("#who").innerHTML = s.type === "email"
        ? `Signed in as <b>${esc(s.email)}</b>`
        : `Connected <b>${esc(short(s.address))}</b> via ${esc(s.wallet)}${net ? ` on ${esc(net.name)}` : ""}`;
    }
  }

  /* ---------- Connect button ---------- */
  function connectLabel() {
    const b = $("#connectBtn");
    if (Chain.isMulti()) b.innerHTML = `<span class="ca-icons">${icons(Chain.list())}</span><span>Connect wallet</span>`;
    else { const n = Chain.get(Chain.primaryId()); b.innerHTML = `<span class="ca-icons">${icons([n])}</span><span>Connect ${esc(n.short === n.name ? n.name : n.short)} wallet</span>`; }
  }

  /* ---------- Wallet modal ---------- */
  function openModal() { pickNet = Session.state?.network || Chain.primaryId(); renderModal(); $("#modal").hidden = false; }
  function closeModal() { $("#modal").hidden = true; }

  function renderModal() {
    const net = Chain.get(pickNet);
    $("#netTabs").hidden = !Chain.isMulti();
    $("#netTabs").innerHTML = Chain.list().map((n) =>
      `<button class="net-tab${n.id === pickNet ? " on" : ""}" data-net="${n.id}" style="--net:${esc(n.color)}"><img src="${esc(n.icon)}" width="20" height="20" alt="">${esc(n.short)}</button>`).join("");
    $("#modalNet").textContent = net.name;

    let items;
    if (net.type === "solana") {
      items = Wallet.solWallets().map((w) => w.installed
        ? `<button class="wallet" data-wallet="${w.key}">${w.icon ? `<img src="${esc(w.icon)}" width="28" height="28" alt="">` : `<span class="w-ph">${esc(w.name[0])}</span>`}<span>${esc(w.name)}</span><em>Detected</em></button>`
        : `<a class="wallet off" href="${esc(w.url)}" target="_blank" rel="noopener"><span class="w-ph">${esc(w.name[0])}</span><span>${esc(w.name)}</span><em>Install</em></a>`).join("");
    } else {
      const list = Wallet.evmWallets();
      items = list.length
        ? list.map((w) => `<button class="wallet" data-wallet="${esc(w.info.rdns || "injected")}">${w.info.icon ? `<img src="${esc(w.info.icon)}" width="28" height="28" alt="">` : `<span class="w-ph">${esc(w.info.name[0])}</span>`}<span>${esc(w.info.name)}</span><em>Detected</em></button>`).join("")
        : window.WA.EVM_SUGGEST.map((w) => `<a class="wallet off" href="${esc(w.url)}" target="_blank" rel="noopener"><span class="w-ph">${esc(w.name[0])}</span><span>${esc(w.name)}</span><em>Install</em></a>`).join("");
    }
    $("#walletList").innerHTML = items;
    $("#modalErr").textContent = "";
  }

  document.addEventListener("click", async (e) => {
    const t = e.target;
    if (t.closest("#connectBtn")) return openModal();
    if (t.closest("[data-close]") || t.id === "modal") return closeModal();
    const tab = t.closest("[data-net]");
    if (tab) { pickNet = tab.dataset.net; return renderModal(); }
    const w = t.closest("[data-wallet]");
    if (w) {
      w.classList.add("busy");
      try { await Wallet.connect(pickNet, w.dataset.wallet); closeModal(); toast("Wallet connected"); }
      catch (err) { $("#modalErr").textContent = err.code === 4001 ? "Request rejected in wallet." : (err.message || "Connection failed."); }
      finally { w.classList.remove("busy"); }
      return;
    }
    if (t.closest("#accountBtn")) { $("#accountMenu").hidden = !$("#accountMenu").hidden; return; }
    if (t.closest("#signOut")) { $("#accountMenu").hidden = true; await Wallet.disconnect(); toast("Signed out"); return; }
    if (!t.closest("#accountMenu")) $("#accountMenu").hidden = true;
  });

  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  /* ---------- Email sign-in ---------- */
  $("#emailForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("#email").value.trim().toLowerCase(), err = $("#emailErr"), btn = $("#emailForm button");
    err.textContent = "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { err.textContent = "Enter a valid email address."; return; }
    const ep = CFG.auth.emailEndpoint;
    if (ep) {
      btn.disabled = true;
      try {
        const r = await fetch(ep, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, site: CFG.brand.domain }) });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `Sign-in failed (${r.status})`);
      } catch (x) { err.textContent = x.message; btn.disabled = false; return; }
      btn.disabled = false;
    }
    $("#emailSentTo").textContent = email;
    $("#emailForm").hidden = true;
    $("#emailSent").hidden = false;
  });

  $("#emailRetry").addEventListener("click", () => {
    $("#emailSent").hidden = true;
    $("#emailForm").hidden = false;
    $("#email").focus();
  });

  /* ---------- Boot ---------- */
  window.addEventListener("session:change", view);
  $("#emailBlock").hidden = !CFG.auth.email;
  Wallet.init();
  window.WA.renderShared();
  connectLabel();
  Session.load();
  view();
  Wallet.restore();
})();
